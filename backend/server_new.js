import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

import { initDB, pool } from './db.js';
import { updateKickStats, getKickStats } from './services/kickService.js';
import { getDiscordStats } from './services/discordService.js';
import { getTelegramStats } from './services/telegramService.js';
import { getInstagramStats, getAuthUrl as getInstaAuthUrl, verifyWebhook as verifyInstaWebhook } from './services/instagramService.js';
import { getTikTokStats, getAuthUrl as getTikTokAuthUrl } from './services/tiktokService.js';
import { getFacebookStats } from './services/facebookService.js';
import { getThreadsStats } from './services/threadsService.js';
import { verifyTask, processBotVerification } from './services/verificationService.js';

// Import Bots (Running as side effects)
import './telegram_bot.js';
import './discord_bot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB
initDB();

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password, wallet_address, visitor_id } = req.body;
    
    if (!username || !password || !wallet_address || !visitor_id) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ success: false, error: 'Username must contain only letters, numbers, and underscores' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await pool.query('SELECT id FROM users WHERE visitor_id = ?', [visitor_id]);
        
        if (user.length > 0) {
            await pool.query('UPDATE users SET username = ?, password = ?, wallet_address = ? WHERE visitor_id = ?', 
                [username, hashedPassword, wallet_address, visitor_id]);
        } else {
            await pool.query('INSERT INTO users (visitor_id, username, password, wallet_address) VALUES (?, ?, ?, ?)', 
                [visitor_id, username, hashedPassword, wallet_address]);
        }

        res.json({ success: true, username });
    } catch (e) {
        console.error('Registration Error:', e);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ success: false, error: 'Invalid password' });
        }

        res.json({ 
            success: true, 
            user: {
                username: user.username,
                wallet_address: user.wallet_address,
                visitor_id: user.visitor_id,
                total_points: user.total_points
            }
        });
    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// --- STATS API (STANDARDIZED) ---
// Update Kick stats every 1 minute
cron.schedule('* * * * *', updateKickStats);
updateKickStats(); // Run on start

app.get('/api/stats', async (req, res) => {
    try {          // Fetch all stats in parallel                        // Fetch all stats in parallel
        const [kick, discord, telegram, instagram, tiktok, facebook, threads] = await Promise.all([
            getKickStats(),
            getDiscordStats(),
            getTelegramStats(),
            getInstagramStats(),
            getTikTokStats(),
            getFacebookStats(),
            getThreadsStats()
        ]);

        const platforms = [kick, discord, telegram, instagram, tiktok, facebook, threads];

        const totalUsers = kick.stats.followers || 0;
        const weeklyStart = await getSystemStat('weekly_start_followers');
        let weeklyGrowth = 0;
        if (weeklyStart && totalUsers) {
            weeklyGrowth = totalUsers - Number(weeklyStart);
        }

        const legacyStats = {
            discord_members: discord.stats.followers,
            telegram_members: telegram.stats.followers,
            kick_followers: totalUsers,
            kick_viewers: kick.stats.viewers,
            kick_is_live: kick.stats.is_live,
            kick_category: kick.stats.category || 'None',
            weekly_growth: weeklyGrowth
        };

        res.json({
            success: true,
            platforms,
            ...legacyStats
        });
    } catch (e) {
        console.error('Stats API Error:', e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// --- VERIFICATION ROUTES ---
app.post('/api/verify-task', async (req, res) => {
    const { username, task_id, platform, g_code } = req.body;
    try {
        const result = await verifyTask(username, task_id, platform, g_code);
        res.json(result);
    } catch (e) {
        console.error('Verification Error:', e);
        res.status(400).json({ success: false, error: e.message });
    }
});

// --- OAUTH REDIRECTS (Delegated to Services) ---
app.get('/api/tiktok/login', (req, res) => {
    const { visitor_id } = req.query;
    const csrfState = Math.random().toString(36).substring(7);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });
    const state = JSON.stringify({ csrf: csrfState, visitor_id });
    const redirectUri = `${req.protocol}://${req.get('host')}/api/tiktok/callback`;
    res.redirect(getTikTokAuthUrl(redirectUri, state));
});

app.get('/api/instagram/login', (req, res) => {
    const { visitor_id } = req.query;
    const state = visitor_id ? JSON.stringify({ visitor_id }) : '{}';
    const redirectUri = `${req.protocol}://${req.get('host')}/api/instagram/callback/`;
    res.redirect(getInstaAuthUrl(redirectUri, state));
});

app.post('/api/social/click', async (req, res) => {
    const { visitor_id, platform, target } = req.body || {};
    if (!platform || !target) {
        return res.status(400).json({ success: false, error: 'Missing platform or target' });
    }
    try {
        appendEventLog('social_click', req, { visitor_id, platform, target });
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, error: 'Failed to log click' });
    }
});

// --- WEBHOOKS ---
app.get('/api/instagram/webhook', verifyInstaWebhook);
app.post('/api/instagram/webhook', (req, res) => {
    // Handle incoming events (messages, etc.) here later
    console.log('📨 Incoming Webhook Event:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

// --- GENESIS PROTOTYPE ROUTES (Legacy Logic) ---
// Kept inline for now as it uses local JSON files
const GENESIS_STATS_FILE = join(__dirname, 'GENESIS_DATA', 'genesis_stats.json');
const getGenesisStats = () => {
    try {
        if (fs.existsSync(GENESIS_STATS_FILE)) {
            return JSON.parse(fs.readFileSync(GENESIS_STATS_FILE));
        }
    } catch (e) {}
    return { spotsLeft: 50 };
};
const updateGenesisSpots = (decrement = 1) => {
    try {
        const stats = getGenesisStats();
        stats.spotsLeft = Math.max(0, stats.spotsLeft - decrement);
        const dir = dirname(GENESIS_STATS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(GENESIS_STATS_FILE, JSON.stringify(stats, null, 2));
        return stats.spotsLeft;
    } catch (e) { return 50; }
};

app.get('/api/genesis/stats', (req, res) => {
    res.json(getGenesisStats());
});

app.post('/api/genesis/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Required' });
    try {
        const GENESIS_USERS_FILE = join(__dirname, '../data/genesis_users.json');
        if (!fs.existsSync(GENESIS_USERS_FILE)) return res.status(400).json({ success: false, error: 'No users' });
        const users = JSON.parse(fs.readFileSync(GENESIS_USERS_FILE));
        const user = users.find(u => u.websiteNickname === username && u.password === password);
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, error: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ success: false, error: 'Error' }); }
});

app.post('/api/genesis/test-register', async (req, res) => {
    const { platformUsername, nickname, password, wallet, platform, ref } = req.body;
    if (!platformUsername || !nickname || !password || !wallet) return res.status(400).json({ success: false, error: 'Missing fields' });
    try {
        const stats = getGenesisStats();
        if (stats.spotsLeft <= 0) return res.status(400).json({ success: false, error: 'No spots' });
        
        const staticPrefix = "ghost";
        const walletPart = wallet.substring(0, 8);
        const platformName = platform || 'Kick';
        const platformInitial = platformName.charAt(0).toUpperCase();
        const thirdPart = `GS${platformInitial}`;
        const random = Math.floor(100000 + Math.random() * 900000);
        const gCode = `👻${staticPrefix}-${walletPart}-${thirdPart}-${random}👻`;
        
        const GENESIS_USERS_FILE = join(__dirname, '../data/genesis_users.json');
        const dataDir = dirname(GENESIS_USERS_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        
        let users = [];
        if (fs.existsSync(GENESIS_USERS_FILE)) users = JSON.parse(fs.readFileSync(GENESIS_USERS_FILE));
        
        const newSpots = updateGenesisSpots(1);
        const rank = 50 - newSpots;
        
        const newUser = {
            id: users.length + 1,
            platform: platformName,
            platformUsername,
            websiteNickname: nickname,
            wallet,
            gCode,
            password,
            rank,
            timestamp: new Date().toISOString()
        };
        
        users.push(newUser);
        fs.writeFileSync(GENESIS_USERS_FILE, JSON.stringify(users, null, 2));

        if (ref) {
            try {
                const refIndex = users.findIndex(u => u.gCode === ref);
                if (refIndex !== -1) {
                    const refUser = users[refIndex];
                    refUser.referrals = (refUser.referrals || 0) + 1;
                    refUser.points = (refUser.points || 0) + 500;
                    users[refIndex] = refUser;
                    fs.writeFileSync(GENESIS_USERS_FILE, JSON.stringify(users, null, 2));
                    appendEventLog('referral_award', req, { referrer: refUser.websiteNickname, awarded: 500, ref_gcode: ref, new_referrals: refUser.referrals, new_points: refUser.points });
                    try {
                        if (globalThis.AKGS_LOGGER && typeof globalThis.AKGS_LOGGER.send === 'function') {
                            await globalThis.AKGS_LOGGER.send(`🎁 Referral Award\nReferrer: ${refUser.websiteNickname}\nAward: 500 points\nRef Code: ${ref}\nTotal Referrals: ${refUser.referrals}\nTotal Points: ${refUser.points}`);
                        }
                    } catch {}
                }
            } catch (e) {}
        }
        
        res.json({ success: true, rank, spotsLeft: newSpots, gCode, message: 'Welcome' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Error' });
    }
});

// Serve static files from the React app
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}


app.listen(PORT, () => {
    console.log(`🚀 Server V2 (Services Enabled) running on port ${PORT}`);
});

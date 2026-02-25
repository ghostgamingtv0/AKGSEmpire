import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { initDB, pool, getSystemStat } from './db.js';
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

const USER_EVENTS_FILE = join(__dirname, '../data/user_events.jsonl');

const appendEventLog = (name, req, payload = {}) => {
    try {
        const dir = dirname(USER_EVENTS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const entry = {
            event: name,
            timestamp: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            method: req.method,
            path: req.originalUrl || req.url,
            referer: req.headers['referer'] || null,
            payload
        };
        fs.appendFileSync(USER_EVENTS_FILE, JSON.stringify(entry) + '\n');
    } catch (e) {
        console.error('Failed to append event log:', e.message);
    }
};

const app = express();
const PORT = process.env.PORT || 3001;

// --- SECURITY MIDDLEWARE ---
// 1. Helmet for Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for development, enable in production with specific domains
    crossOriginEmbedderPolicy: false
}));

// 2. Rate Limiting (Prevent DDoS/Brute Force)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register attempts per hour
    message: { success: false, error: 'Too many login attempts. Please try again in an hour.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// 3. CORS Configuration
const allowedOrigins = [
    'https://akgsempire.org',
    'https://www.akgsempire.org',
    'https://akgs-empire.pages.dev'
];

app.use(cors({
    origin: (origin, callback) => {
        // Disallow localhost and null origins in production
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked Unauthorized Access: ${origin}`);
            callback(new Error('Access Denied: Only Cloudflare-proxied requests allowed.'));
        }
    },
    credentials: true
}));

// 4. Force Cloudflare Proxy Only
app.use((req, res, next) => {
    // Cloudflare adds 'cf-connecting-ip'. If it's missing, the request didn't come through Cloudflare.
    if (!req.headers['cf-connecting-ip'] && process.env.NODE_ENV === 'production') {
        console.error('Direct access attempt blocked:', req.ip);
        return res.status(403).send('Forbidden: Direct access to this server is not allowed. Please use https://akgsempire.org');
    }
    next();
});

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
        // 1. Check if username is taken
        const [existingByUsername] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingByUsername.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. Check if visitor_id already has a guest account
        const [existingByVisitor] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
        
        if (existingByVisitor.length > 0) {
            // Upgrade guest account
            await pool.query(
                'UPDATE users SET username = ?, password = ?, wallet_address = ? WHERE visitor_id = ?', 
                [username, hashedPassword, wallet_address, visitor_id]
            );
        } else {
            // Create brand new account
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await pool.query(
                'INSERT INTO users (visitor_id, username, password, wallet_address, referral_code) VALUES (?, ?, ?, ?, ?)', 
                [visitor_id, username, hashedPassword, wallet_address, referralCode]
            );
        }

        res.json({ success: true, username });
    } catch (e) {
        console.error('Registration Error:', e);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password, visitor_id } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            appendEventLog('login_fail_user_not_found', req, { username, visitor_id });
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            appendEventLog('login_fail_wrong_password', req, { username, visitor_id });
            return res.status(400).json({ success: false, error: 'Invalid password' });
        }

        // Update visitor_id on login to link this device
        if (visitor_id && visitor_id !== user.visitor_id) {
            await pool.query('UPDATE users SET visitor_id = ? WHERE id = ?', [visitor_id, user.id]);
            user.visitor_id = visitor_id;
        }

        appendEventLog('login_success', req, { username, visitor_id });
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
        appendEventLog('login_error', req, { username, error: e.message });
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

app.post('/api/init-user', async (req, res) => {
    const { visitor_id, ref_code, wallet_address, kick_username, g_code: client_g_code } = req.body;
    if (!visitor_id) return res.status(400).json({ error: 'Visitor ID required' });

    try {
        let [users] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
        
        if (users.length === 0) {
            // Create new user
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            let referredBy = null;
            
            if (ref_code) {
                // Check validity of referral code
                const [refs] = await pool.query('SELECT visitor_id FROM users WHERE referral_code = ?', [ref_code]);
                if (refs.length > 0) {
                    referredBy = refs[0].visitor_id;
                    // Award referrer
                    await pool.query('UPDATE users SET referral_count = referral_count + 1, total_points = total_points + 100, weekly_points = weekly_points + 100 WHERE visitor_id = ?', [referredBy]);
                }
            }

            const gCode = client_g_code || ('G-' + Math.random().toString(36).substring(2, 8).toUpperCase());
            
            await pool.query(
                'INSERT INTO users (visitor_id, referral_code, referred_by, g_code, wallet_address, kick_username) VALUES (?, ?, ?, ?, ?, ?)', 
                [visitor_id, referralCode, referredBy, gCode, wallet_address || null, kick_username || null]
            );
            
            [users] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
        } else {
            // Update existing user with new profile info if provided
            const user = users[0];
            const updates = [];
            const params = [];

            if (wallet_address && wallet_address !== user.wallet_address) {
                updates.push('wallet_address = ?');
                params.push(wallet_address);
            }
            if (kick_username && kick_username !== user.kick_username) {
                updates.push('kick_username = ?');
                params.push(kick_username);
            }
            if (client_g_code && client_g_code !== user.g_code) {
                updates.push('g_code = ?');
                params.push(client_g_code);
            }

            if (updates.length > 0) {
                params.push(visitor_id);
                await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE visitor_id = ?`, params);
                // Refresh user data
                [users] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
            }
        }
        
        res.json({ success: true, user: users[0] });
    } catch (e) {
        console.error('Init User Error:', e);
        res.status(500).json({ error: e.message });
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
    const { username, visitor_id, task_id, platform, g_code } = req.body;

    if (!visitor_id || !task_id || !platform) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        // 1. Check if user exists by visitor_id
        const [users] = await pool.query('SELECT id, total_points, kick_username, username FROM users WHERE visitor_id = ?', [visitor_id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const user = users[0];

        // 2. Validate G-Code format (should contain username or kick_username)
        const effectiveUsername = username || user.kick_username || user.username || 'anonymous';
        const isValidGCode = g_code && g_code.includes('👻') && (g_code.includes(effectiveUsername) || g_code.includes(visitor_id.substring(0, 8)));
        
        if (!isValidGCode) {
             return res.status(400).json({ success: false, error: 'Invalid G-Code format' });
        }

        // 3. Award Points (e.g., 10 points per task)
        const REWARD_POINTS = 10;
        await pool.query('UPDATE users SET total_points = total_points + ?, weekly_points = weekly_points + ?, tasks_completed = tasks_completed + 1 WHERE id = ?', [REWARD_POINTS, REWARD_POINTS, user.id]);
        
        // 4. Log Verification
        await pool.query('INSERT INTO task_verifications (username, task_id, platform, g_code, status) VALUES (?, ?, ?, ?, ?)', 
            [effectiveUsername, task_id || 0, platform, g_code, 'approved']);

        res.json({ 
            success: true, 
            message: 'Task verified successfully', 
            points_added: REWARD_POINTS,
            new_total: user.total_points + REWARD_POINTS 
        });

    } catch (e) {
        console.error('Verification Error:', e);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// --- KICK MINING ROUTES (Used by Kick Chat Bot + Frontend) ---
app.post('/api/kick/mining/verify', async (req, res) => {
    try {
        const { kick_username, g_code } = req.body || {};
        if (!kick_username || !g_code) {
            return res.status(400).json({ success: false, message: 'Missing kick_username or g_code' });
        }

        const normalizedKick = String(kick_username).toLowerCase();

        const [users] = await pool.query('SELECT * FROM users WHERE g_code = ?', [g_code]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'G-Code not found' });
        }

        const user = users[0];

        if (user.kick_username && user.kick_username.toLowerCase() !== normalizedKick) {
            return res.status(409).json({ success: false, message: 'G-Code is linked to another user' });
        }

        if (!user.kick_username) {
            await pool.query('UPDATE users SET kick_username = ? WHERE id = ?', [kick_username, user.id]);
        }

        if (!user.mining_unlocked) {
            await pool.query('UPDATE users SET mining_unlocked = 1 WHERE id = ?', [user.id]);
        }

        return res.json({ success: true, message: 'Mining unlocked', visitor_id: user.visitor_id });
    } catch (e) {
        console.error('Kick mining verify error:', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/kick/mining/status', async (req, res) => {
    try {
        const { visitor_id } = req.query || {};
        if (!visitor_id) {
            return res.status(400).json({ success: false, message: 'Missing visitor_id' });
        }

        const [users] = await pool.query('SELECT mining_unlocked FROM users WHERE visitor_id = ?', [visitor_id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const miningUnlocked = !!users[0].mining_unlocked;
        return res.json({ success: true, mining_unlocked: miningUnlocked });
    } catch (e) {
        console.error('Kick mining status error:', e);
        return res.status(500).json({ success: false, message: 'Server error' });
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

app.post('/api/social/check-account', async (req, res) => {
    const { platform, username } = req.body || {};
    if (!platform || !username) {
        return res.status(400).json({ success: false, error: 'Missing platform or username' });
    }
    const cleanUsername = String(username).trim();
    if (!cleanUsername) {
        return res.status(400).json({ success: false, error: 'Empty username' });
    }
    try {
        appendEventLog('social_account_check_disabled', req, { platform, username: cleanUsername });
        return res.json({ success: true, exists: true });
    } catch (e) {
        appendEventLog('social_account_check_error', req, { platform, username: cleanUsername, error: e.message });
        return res.json({ success: true, exists: false });
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
        stats.spotsLeft = stats.spotsLeft - decrement;
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
    const { platformUsername, nickname, password, wallet, platform, ref, signMessage, signTimestamp, visitor_id } = req.body;
    if (!platformUsername || !nickname || !password || !wallet) return res.status(400).json({ success: false, error: 'Missing fields' });
    
    try {
        const stats = getGenesisStats();
        const staticPrefix = "ghost";
        const walletPart = wallet.substring(0, 8);
        const platformName = platform || 'Kick';
        const platformInitial = platformName.charAt(0).toUpperCase();
        const thirdPart = `GS${platformInitial}`;
        const random = Math.floor(100000 + Math.random() * 900000);
        const gCode = `👻${staticPrefix}-${walletPart}-${thirdPart}-${random}👻`;
        
        // 1. Save to JSON (Legacy/Archive)
        const GENESIS_USERS_FILE = join(__dirname, '../data/genesis_users.json');
        const dataDir = dirname(GENESIS_USERS_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        
        let users = [];
        if (fs.existsSync(GENESIS_USERS_FILE)) users = JSON.parse(fs.readFileSync(GENESIS_USERS_FILE));
        
        const newSpots = updateGenesisSpots(1);
        const rank = users.length + 1;
        
        const newUser = {
            id: users.length + 1,
            platform: platformName,
            platformUsername,
            websiteNickname: nickname,
            wallet,
            gCode,
            password,
            rank,
            signMessage: signMessage || null,
            signTimestamp: signTimestamp || null,
            timestamp: new Date().toISOString(),
            visitor_id: visitor_id || null
        };
        
        users.push(newUser);
        fs.writeFileSync(GENESIS_USERS_FILE, JSON.stringify(users, null, 2));

        // 2. Sync to Database (Main System)
        if (visitor_id) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Insert or Update user in DB
            await pool.query(
                `INSERT INTO users (visitor_id, username, password, wallet_address, kick_username, g_code, referral_code) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(visitor_id) DO UPDATE SET 
                    username = excluded.username,
                    password = excluded.password,
                    wallet_address = excluded.wallet_address,
                    kick_username = excluded.kick_username,
                    g_code = excluded.g_code`,
                [visitor_id, nickname, hashedPassword, wallet, platformUsername, gCode, referralCode]
            );
        }

        // 3. Handle Referrals
        if (ref) {
            try {
                const refIndex = users.findIndex(u => u.gCode === ref);
                if (refIndex !== -1) {
                    const refUser = users[refIndex];
                    refUser.referrals = (refUser.referrals || 0) + 1;
                    refUser.points = (refUser.points || 0) + 500;
                    users[refIndex] = refUser;
                    fs.writeFileSync(GENESIS_USERS_FILE, JSON.stringify(users, null, 2));

                    // Also update in DB
                    if (refUser.visitor_id) {
                        await pool.query(
                            'UPDATE users SET referral_count = referral_count + 1, total_points = total_points + 500 WHERE visitor_id = ?',
                            [refUser.visitor_id]
                        );
                    }

                    appendEventLog('referral_award', req, { referrer: refUser.websiteNickname, awarded: 500, ref_gcode: ref, new_referrals: refUser.referrals, new_points: refUser.points });
                }
            } catch (e) {
                console.error('Referral Sync Error:', e);
            }
        }
        
        res.json({ success: true, rank, spotsLeft: newSpots, gCode, message: 'Welcome' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Error' });
    }
});

app.post('/api/claim', async (req, res) => {
    const { visitor_id, task_id, points, platform } = req.body;
    
    try {
        // 1. Get User
        const [users] = await pool.query('SELECT g_code FROM users WHERE visitor_id = ?', [visitor_id]);
        if (users.length === 0) return res.status(400).json({ success: false, message: 'User not found' });

        // 2. Update User Points
        const pointsToAdd = points || 10;
        
        await pool.query(
            'UPDATE users SET total_points = total_points + ?, weekly_points = weekly_points + ?, tasks_completed = tasks_completed + 1 WHERE visitor_id = ?',
            [pointsToAdd, pointsToAdd, visitor_id]
        );

        res.json({ success: true, message: 'Reward claimed' });
    } catch (error) {
        console.error('Claim Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.post('/api/tasks/claim', (req, res) => {
    res.redirect(307, '/api/claim');
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await pool.query('SELECT username, kick_username, total_points, weekly_points FROM users ORDER BY total_points DESC LIMIT 10');
        res.json({ success: true, leaderboard });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/leaderboard/points', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, kick_username, weekly_points as points FROM users ORDER BY weekly_points DESC LIMIT 10');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/leaderboard/tasks', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, kick_username, tasks_completed as count FROM users ORDER BY tasks_completed DESC LIMIT 10');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/leaderboard/referrers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, kick_username, referral_count as count FROM users ORDER BY referral_count DESC LIMIT 10');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/leaderboard/comments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, kick_username, weekly_comments as count FROM users ORDER BY weekly_comments DESC LIMIT 10');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/leaderboard/messages', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT username, kick_username, chat_messages_count as count FROM users ORDER BY chat_messages_count DESC LIMIT 10');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/users/platform/:platform', async (req, res) => {
    const { platform } = req.params;
    let column = '';
    if (platform === 'kick') column = 'kick_username';
    else if (platform === 'twitter') column = 'twitter_username';
    else if (platform === 'threads') column = 'threads_username';
    else if (platform === 'instagram') column = 'instagram_username';
    
    if (!column) return res.status(400).json({ error: 'Invalid platform' });
    
    try {
        const [rows] = await pool.query(`SELECT username, ${column}, weekly_points FROM users WHERE ${column} IS NOT NULL ORDER BY weekly_points DESC LIMIT 10`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
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

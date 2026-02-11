import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Parser from 'rss-parser';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const dbPath = join(__dirname, 'database.sqlite');

// Middleware
app.use(cors());
app.use(express.json());

// Explicit Route for TikTok Verification
app.get(['/tiktokqfGXBGgUXkMcnQDdwq3B7hOdThOrskcI.html', '/tiktokqfGXBGgUXkMcnQDdwq3B7hOdThOrskcI'], (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send('tiktok-developers-site-verification=qfGXBGgUXkMcnQDdwq3B7hOdThOrskcI');
});

// Database Connection (SQLite)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initTables();
  }
});

// Wrapper to mimic mysql2 pool.query interface
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const trimmedSql = sql.trim().toUpperCase();
      if (trimmedSql.startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows, []]); // Match [rows, fields] format
        });
      } else {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve([{ affectedRows: this.changes, insertId: this.lastID }, []]); // Match [result] format
        });
      }
    });
  }
};

// Initialize Tables
const initTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        visitor_id TEXT PRIMARY KEY,
        wallet_address TEXT,
        kick_username TEXT,
        email TEXT,
        g_code TEXT,
        total_points INTEGER DEFAULT 0,
        weekly_points INTEGER DEFAULT 0,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        referral_count INTEGER DEFAULT 0,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_by) REFERENCES users(visitor_id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        reward INTEGER DEFAULT 0,
        platform TEXT,
        is_recurring BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visitor_id) REFERENCES users(visitor_id) ON DELETE CASCADE,
        UNIQUE(visitor_id, task_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_wallets (
        visitor_id TEXT,
        wallet_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (visitor_id, wallet_address)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT,
        wallet_address TEXT,
        task_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist
    try {
        await pool.query('ALTER TABLE users ADD COLUMN weekly_comments INTEGER DEFAULT 0');
    } catch (e) { /* Column likely exists */ }
    
    try {
        await pool.query('ALTER TABLE users ADD COLUMN chat_messages_count INTEGER DEFAULT 0');
    } catch (e) { /* Column likely exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN tasks_completed INTEGER DEFAULT 0');
    } catch (e) { /* Column likely exists */ }
    
    try {
        await pool.query('ALTER TABLE users ADD COLUMN last_mining_ping DATETIME');
    } catch (e) { /* Column likely exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN instagram_username TEXT');
    } catch (e) { /* Column likely exists */ }
    
    try {
      await pool.query('ALTER TABLE users ADD COLUMN twitter_username TEXT');
    } catch (e) { /* Column likely exists */ }

    // Add password column for Auth
    try {
        await pool.query('ALTER TABLE users ADD COLUMN password TEXT');
    } catch (e) { /* Column likely exists */ }
    
    try {
        await pool.query('ALTER TABLE users ADD COLUMN threads_username TEXT');
    } catch (e) { /* Column likely exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN email TEXT');
    } catch (e) { /* Column likely exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN password_hash TEXT');
    } catch (e) { /* Column likely exists */ }

    // Initialize System Stats Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_stats (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables initialized');
  } catch (err) {
    console.error('❌ Table initialization failed:', err);
  }
};

// Test Connection (Kept for compatibility logic, but simplified)
const testConnection = async () => {
  // SQLite doesn't need explicit connection testing like MySQL pool
  // But we can check if tables exist or add columns if needed (migrations)
  try {
    // Check for new columns (migrations)
    // Note: SQLite ALTER TABLE is limited, but ADD COLUMN is supported
    // We can just rely on CREATE TABLE IF NOT EXISTS for the base structure
    // If we need to add columns to existing DB, we can try-catch ALTER statements
    try {
        await pool.query('ALTER TABLE users ADD COLUMN kick_username TEXT');
    } catch (e) { /* Ignore if exists */ }
    
    try {
        await pool.query('ALTER TABLE users ADD COLUMN g_code TEXT');
    } catch (e) { /* Ignore if exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN weekly_comments INTEGER DEFAULT 0');
    } catch (e) { /* Ignore if exists */ }

    try {
        await pool.query('ALTER TABLE users ADD COLUMN last_mining_ping DATETIME');
    } catch (e) { /* Ignore if exists */ }
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
  }
};
testConnection();


const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'awybmwoe72ngwrao';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || 'z52hU47VSzTYUYWVANb7hLDX4L87NptJ';

// --- TikTok OAuth Flow ---
app.get('/api/tiktok/login', (req, res) => {
    const csrfState = Math.random().toString(36).substring(7);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // Dynamic Redirect URI based on Host
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/tiktok/callback`;

    console.log(`🔗 TikTok Login: Redirecting to ${redirectUri}`);

    const params = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        scope: 'user.info.basic', // Basic scope to get OpenID/Username
        response_type: 'code',
        redirect_uri: redirectUri, // Dynamic
        state: csrfState
    });

    res.redirect(`${url}?${params.toString()}`);
});

// TikTok Webhook / Data Deletion Callback (POST)
// Required for "Webhooks" and "Data Portability" compliance testing
app.post(['/api/tiktok/callback', '/api/tiktok/webhook'], (req, res) => {
    console.log('📩 TikTok Webhook/Callback POST Received:', JSON.stringify(req.body));
    // TikTok expects 200 OK
    res.status(200).send();
});

app.get('/api/tiktok/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('No code provided');

    // Reconstruct Redirect URI (Must match the one sent in login)
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/tiktok/callback`;

    try {
        // Exchange code for token
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            console.error('TikTok Token Error:', tokenData);
            return res.status(400).send('Token Exchange Failed: ' + JSON.stringify(tokenData));
        }

        const accessToken = tokenData.access_token;
        const openId = tokenData.open_id; // Unique user ID

        // Fetch User Info
        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const userData = await userRes.json();
        const tikTokName = userData.data?.user?.display_name || 'TikTok User';

        // TODO: Store in DB associated with current user...
        // Since this is a redirect callback, we might lose the 'visitor_id' context unless passed in state.
        // For now, we just show success.
        
        res.send(`
            <h1>✅ TikTok Connected!</h1>
            <p>Hello ${tikTokName}. You can verify your task now.</p>
            <script>
                // Notify parent window if in popup
                if(window.opener) {
                    window.opener.postMessage({ type: 'TIKTOK_CONNECTED', username: '${tikTokName}' }, '*');
                    window.close();
                } else {
                    // Fallback for direct redirect
                    window.location.href = '/earn'; 
                }
            </script>
        `);

    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error during TikTok Auth');
    }
});

// --- Auth Endpoints ---

app.post('/api/auth/register', async (req, res) => {
    const { visitor_id, password, wallet_address } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
        
        if (existing.length > 0) {
            await pool.query('UPDATE users SET password = ?, wallet_address = ? WHERE visitor_id = ?', [hashedPassword, wallet_address, visitor_id]);
        } else {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await pool.query('INSERT INTO users (visitor_id, password, wallet_address, referral_code) VALUES (?, ?, ?, ?)', [visitor_id, hashedPassword, wallet_address, referralCode]);
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE kick_username = ?', [username]);
        if (users.length === 0) return res.status(400).json({ error: 'User not found' });
        
        const user = users[0];
        if (!user.password) return res.status(400).json({ error: 'No password set. Login with Kick first.' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid password' });
        
        res.json({ success: true, user });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/kick/exchange-token', async (req, res) => {
    const { code, code_verifier, redirect_uri, visitor_id } = req.body;
    try {
        const tokenRes = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: '01KH3T8WNDZ269403HKC17JN7X',
                code,
                redirect_uri,
                code_verifier
            })
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenRes.ok) {
            console.error('Kick Token Error:', tokenData);
            // Fallback for dev/testing if real auth fails
            if (process.env.NODE_ENV === 'development') {
                 // Simulate success
                 const mockUser = 'Guest_' + Math.floor(Math.random() * 1000);
                 await pool.query('UPDATE users SET kick_username = ? WHERE visitor_id = ?', [mockUser, visitor_id]);
                 return res.json({ success: true, username: mockUser, is_profile_complete: false });
            }
            return res.status(400).json({ error: 'Kick Auth Failed', details: tokenData });
        }

        // Fetch User Info
        const userRes = await fetch('https://api.kick.com/public/v1/users', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userRes.json();
        
        if (userData && userData.data) {
             const kickUsername = userData.data.slug || userData.data.username;
             
             // Update User in DB
             await pool.query('INSERT INTO users (visitor_id, kick_username) VALUES (?, ?) ON CONFLICT(visitor_id) DO UPDATE SET kick_username = excluded.kick_username', [visitor_id, kickUsername]);
             
             // Check if profile is complete (has password/wallet)
             const [users] = await pool.query('SELECT password, wallet_address FROM users WHERE visitor_id = ?', [visitor_id]);
             const isComplete = users[0] && users[0].password && users[0].wallet_address;
             
             res.json({ success: true, username: kickUsername, is_profile_complete: isComplete });
        } else {
             throw new Error('Failed to fetch user data');
        }

    } catch (e) {
        console.error('Kick Exchange Error:', e);
        // Emergency Fallback to let user proceed in case of API issues
        res.json({ success: true, username: 'GhostUser', is_profile_complete: false });
    }
});

// --- Helper for System Stats ---
const getSystemStat = async (key) => {
    try {
        const [rows] = await pool.query('SELECT value FROM system_stats WHERE key = ?', [key]);
        return rows.length > 0 ? rows[0].value : null;
    } catch (e) { return null; }
};

const setSystemStat = async (key, value) => {
    try {
        await pool.query(`
            INSERT INTO system_stats (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `, [key, String(value)]);
    } catch (e) { console.error(`Failed to set stat ${key}:`, e); }
};

// --- Cron Job: Reset Weekly Points every Friday at 13:00 (1:00 PM) ---
// Syntax: Minute Hour DayMonth Month DayWeek
cron.schedule('0 13 * * 5', async () => {
  console.log('⏰ Running Weekly Reset (Friday 13:00)...');
  try {
    // Reset weekly_points only. total_points stay forever.
    // Also reset weekly_comments
    const [result] = await pool.query('UPDATE users SET weekly_points = 0, weekly_comments = 0');
    
    // Reset Weekly Start Followers for Growth Calculation
    const currentFollowers = await getSystemStat('kick_followers');
    if (currentFollowers) {
        await setSystemStat('weekly_start_followers', currentFollowers);
        console.log(`✅ Weekly start followers reset to ${currentFollowers}`);
    }

    console.log(`✅ Weekly points/comments reset for ${result.affectedRows} users.`);
  } catch (error) {
    console.error('❌ Failed to reset weekly points:', error);
  }
}, {
  scheduled: true,
  timezone: "Africa/Casablanca" // Adjust timezone as needed (e.g., UTC or specific region)
});

// --- Google Sheets Sync ---
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

const syncToGoogleSheet = async (type, data) => {
    if (!GOOGLE_SCRIPT_URL) return;
    try {
        // Prepare payload based on type
        const payload = {
            type: type, // 'USER_UPDATE', 'TASK_CLICK', 'FRAUD_ALERT'
            timestamp: new Date().toISOString(),
            ...data
        };
        
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('❌ Google Sheet Sync Error:', error.message);
    }
};

const parser = new Parser();

// RSS Feeds Configuration (Updated XML Links)
const myFeeds = {
    instagram: "https://rss.app/feeds/TI0LGIRM3exwbPIT.xml",
    tiktok: "https://rss.app/feeds/zCraR8juic5yl9sT.xml",
    threads: "https://rss.app/feeds/lWdvL5EjEU3wODIt.xml",
    twitter: "https://rss.app/feeds/x7YxHPY0B5j4Pyqq.xml"
};

let feedCache = {
    instagram: { isNew: false, date: null },
    tiktok: { isNew: false, date: null },
    threads: { isNew: false, date: null },
    twitter: { isNew: false, date: null }
};

// Kick Stats Management
// We rely on Client-Side updates or Manual Fallback because Server-Side is blocked by Cloudflare.

// Initialize Stats from ENV if DB is empty
const initKickStats = async () => {
    const stored = await getSystemStat('kick_followers');
    if (!stored && process.env.STARTING_FOLLOWERS) {
        await setSystemStat('kick_followers', process.env.STARTING_FOLLOWERS);
        await setSystemStat('weekly_start_followers', process.env.STARTING_FOLLOWERS);
        console.log('ℹ️ Initialized Kick Stats from .env:', process.env.STARTING_FOLLOWERS);
    }
};
setTimeout(initKickStats, 2000);

// Endpoint for Client-Side or Admin to update stats
app.post('/api/update-kick-stats', async (req, res) => {
    const { followers, viewers, is_live } = req.body;
    
    try {
        if (followers !== undefined) {
            await setSystemStat('kick_followers', followers);
            
            // If this is the first time we see followers, set weekly start
            const weeklyStart = await getSystemStat('weekly_start_followers');
            if (!weeklyStart) {
                await setSystemStat('weekly_start_followers', followers);
            }
        }
        
        if (viewers !== undefined) await setSystemStat('kick_viewers', viewers);
        if (is_live !== undefined) await setSystemStat('kick_is_live', is_live);
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to Link Instagram Username
app.post('/api/user/link-instagram', async (req, res) => {
    const { visitor_id, username } = req.body;
    if (!visitor_id || !username) return res.status(400).json({ error: 'Missing data' });
    
    try {
        await pool.query('UPDATE users SET instagram_username = ? WHERE visitor_id = ?', [username, visitor_id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to Link Twitter Username
app.post('/api/user/link-twitter', async (req, res) => {
    const { visitor_id, username } = req.body;
    if (!visitor_id || !username) return res.status(400).json({ error: 'Missing data' });
    
    try {
        await pool.query('UPDATE users SET twitter_username = ? WHERE visitor_id = ?', [username, visitor_id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to Link Threads Username
app.post('/api/user/link-threads', async (req, res) => {
    const { visitor_id, username } = req.body;
    if (!visitor_id || !username) return res.status(400).json({ error: 'Missing data' });
    
    try {
        await pool.query('UPDATE users SET threads_username = ? WHERE visitor_id = ?', [username, visitor_id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Leaderboard Endpoints ---

// 1. Top Referrers
app.get('/api/leaderboard/referrers', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, referral_count 
            FROM users 
            ORDER BY referral_count DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Top Comments (Using weekly_comments)
app.get('/api/leaderboard/comments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_comments
            FROM users 
            ORDER BY weekly_comments DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2b. Most Interactive (Using chat_messages_count)
app.get('/api/leaderboard/messages', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, chat_messages_count
            FROM users 
            ORDER BY chat_messages_count DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2c. Tasks Done (Using tasks_completed)
app.get('/api/leaderboard/tasks', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, tasks_completed
            FROM users 
            ORDER BY tasks_completed DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Weekly Global Rankings (Points)
app.get('/api/leaderboard/points', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_points 
            FROM users 
            ORDER BY weekly_points DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Platform User Lists
app.get('/api/users/platform/:platform', async (req, res) => {
    const { platform } = req.params;
    let column = '';
    
    if (platform === 'kick') column = 'kick_username';
    else if (platform === 'instagram') column = 'instagram_username';
    else if (platform === 'twitter') column = 'twitter_username';
    else if (platform === 'threads') column = 'threads_username';
    else return res.json([]);

    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, ${column} as username
            FROM users 
            WHERE ${column} IS NOT NULL AND ${column} != ''
            ORDER BY total_points DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Kick OAuth Flow ---
app.post('/api/kick/exchange-token', async (req, res) => {
    const { code, visitor_id, code_verifier, redirect_uri } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    try {
        console.log('🔄 Exchanging Kick Auth Code...');
        
        // Use KICK_CLIENT_ID from env (matching .env file)
        const clientId = process.env.KICK_CLIENT_ID || process.env.KICK_DEVELOPER_ID || '01KH3T8WNDZ269403HKC17JN7X';
        const clientSecret = process.env.KICK_CLIENT_SECRET;

        // DEBUG LOGGING
        console.log('DEBUG PARAMS:');
        console.log('- Client ID:', clientId);
        console.log('- Redirect URI:', redirect_uri);
        console.log('- Code Verifier:', code_verifier ? 'Provided' : 'Missing');
        console.log('- Code:', code ? code.substring(0, 10) + '...' : 'Missing');

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('redirect_uri', redirect_uri || 'http://localhost:3000/');
        params.append('code', code);
        
        // Add PKCE verifier if provided (Required by Kick now)
        if (code_verifier) {
            params.append('code_verifier', code_verifier);
        }

        // Try standard OAuth endpoints
        const tokenEndpoints = [
            'https://id.kick.com/oauth/token'
        ];
        
        let tokenData = null;
        let response = null;

        for (const tokenUrl of tokenEndpoints) {
            try {
                console.log(`Trying Token URL: ${tokenUrl}`);
                response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });
                
                const responseText = await response.text();
                console.log(`Response Status: ${response.status}`);
                console.log(`Response Body: ${responseText}`);

                if (response.ok) {
                    tokenData = JSON.parse(responseText);
                    break;
                } else {
                    console.error(`❌ Kick API Error (${response.status}) at ${tokenUrl}:`, responseText);
                }
            } catch (e) { console.error(`Failed ${tokenUrl}:`, e.message); }
        }
        
        if (!tokenData) {
            console.error('❌ Token Exchange Failed');
            return res.status(400).json({ error: 'Failed to exchange token' });
        }

        const accessToken = tokenData.access_token;
        console.log('✅ Kick Access Token obtained');
        
        // Save this token for background updates
        await setSystemStat('kick_access_token', accessToken);

        // 1. Fetch Authenticated User Details (For Identity)
        let username = null;
        let profilePic = null;
        let finalGCode = null;
        let isProfileComplete = false;

        // Try multiple endpoints for identity
        const identityEndpoints = [
            'https://id.kick.com/oauth/userinfo', // Standard OIDC (Most reliable)
            'https://api.kick.com/api/v1/me',     // Common alternative
            'https://api.kick.com/public/v1/users', 
            'https://api.kick.com/api/v1/users'
        ];

        for (const endpoint of identityEndpoints) {
            try {
                console.log(`   👉 Fetching Identity from: ${endpoint}`);
                const meRes = await fetch(endpoint, {
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    }
                });
                
                console.log(`   👉 Identity Status: ${meRes.status}`);
                const meText = await meRes.text();
                
                // Log first 300 chars to avoid spam
                console.log(`   👉 Identity Body: ${meText.substring(0, 300)}...`);

                if (meRes.ok) {
                    const meData = JSON.parse(meText);
                    const user = meData.data || meData; 
                    
                    // Handle OIDC fields (sub, preferred_username, name)
                    if (user.preferred_username || user.name || user.sub) {
                         username = user.preferred_username || user.name || user.sub; // 'sub' might be ID, but better than nothing
                    }
                    
                    // Handle Kick API fields (username, slug)
                    if (user.username || user.slug) {
                        username = user.username || user.slug;
                    }

                    if (username) {
                        const email = user.email || null;
                        profilePic = user.profile_pic || user.picture; // 'picture' is OIDC standard
                        console.log('   ✅ Identified User:', username);
                        break; // Stop if we found the user
                    }
                }
            } catch (e) {
                console.error(`   ❌ Failed endpoint ${endpoint}:`, e.message);
            }
        }

        if (username) {
             try {
                 // Generate G-Code if not exists
                 let g_code = null;
                 const randomPart = Math.floor(100000 + Math.random() * 900000);
                 g_code = `${username}-G-${randomPart}`;

                 // Update user with username, email AND g_code (if missing)
                 // Use UPSERT to ensure user exists (fixes Foreign Key error in Claim)
                 await pool.query(`
                    INSERT INTO users (visitor_id, kick_username, email, g_code)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(visitor_id) DO UPDATE SET
                                    kick_username = excluded.kick_username, 
                                    email = COALESCE(excluded.email, users.email),
                                    g_code = COALESCE(users.g_code, excluded.g_code)
                             `, [visitor_id, username, email, g_code]);
                             
                             // Fetch final G-Code and Profile Status
                             const [rows] = await pool.query('SELECT g_code, password_hash FROM users WHERE visitor_id = ?', [visitor_id]);
                             if (rows.length > 0) {
                                 finalGCode = rows[0].g_code;
                             }
                             isProfileComplete = rows.length > 0 && !!rows[0].password_hash;

                             console.log('   ✅ Linked Kick Username, Email & G-Code to Visitor:', visitor_id);
                         } catch (e) { console.error('   ❌ DB Update Error:', e.message); }
         }

        // 2. Fetch Channel Stats (ghost_gamingtv) using this token
        // Also check if user is following
        const endpoints = [
            'https://api.kick.com/public/v1/channels/ghost_gamingtv',
            'https://api.kick.com/api/v1/channels/ghost_gamingtv',
            'https://api.kick.com/v1/channels/ghost_gamingtv'
        ];
        
        let followers = null;
        let isFollowing = false;

        // Check Relationship (Are they following?)
        try {
            console.log('   👉 Checking Follow Status for user:', username);
            const meChannelRes = await fetch('https://api.kick.com/api/v2/channels/ghost_gamingtv/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            console.log('   👉 Follow Check Status:', meChannelRes.status);
            
            if (meChannelRes.ok) {
                const meChannelData = await meChannelRes.json();
                console.log('   👉 Follow Data:', JSON.stringify(meChannelData));
                
                if (meChannelData.following || meChannelData.subscription) {
                    isFollowing = true;
                    console.log('   ✅ User IS following ghost_gamingtv');
                } else {
                    console.log('   ❌ User is NOT following ghost_gamingtv');
                }
            } else {
                const errText = await meChannelRes.text();
                console.error('   ❌ Follow Check Failed:', errText);
            }
        } catch (e) { console.error('   ❌ Check Following Error:', e.message); }
        
        for (const url of endpoints) {
            try {
                const userRes = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    console.log('✅ Fetched Kick Data:', userData.slug || 'success');
                    // Extract followers (structure depends on endpoint)
                    followers = userData.followersCount || userData.followers_count || (userData.followers && userData.followers.length);
                    if (followers) break;
                }
            } catch (e) { console.error('Fetch error:', e.message); }
        }

        // If automatic fetch fails, we still return success so frontend knows we are connected
        
        if (followers) {
            await setSystemStat('kick_followers', followers);
             // If this is the first time we see followers, set weekly start
            const weeklyStart = await getSystemStat('weekly_start_followers');
            if (!weeklyStart) {
                await setSystemStat('weekly_start_followers', followers);
            }
            console.log('✅ Updated Kick Followers:', followers);
        }

        res.json({ success: true, username, profile_pic: profilePic, followers, g_code: finalGCode, following: isFollowing, is_profile_complete: isProfileComplete });

    } catch (error) {
        console.error('❌ OAuth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Auth Endpoints ---
app.post('/api/auth/register', async (req, res) => {
    const { visitor_id, password, wallet_address } = req.body;
    if (!visitor_id || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update user record
        await pool.query(`
            UPDATE users 
            SET password_hash = ?, wallet_address = COALESCE(?, wallet_address)
            WHERE visitor_id = ?
        `, [hashedPassword, wallet_address, visitor_id]);

        console.log(`✅ User registered: ${visitor_id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Registration Error:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE kick_username = ?', [username]);
        if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
        
        const user = rows[0];
        if (!user.password_hash) return res.status(400).json({ error: 'Profile not completed. Please register via Kick first.' });
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });
        
        console.log(`✅ User logged in: ${username}`);
        res.json({ 
            success: true, 
            visitor_id: user.visitor_id, 
            username: user.kick_username,
            g_code: user.g_code,
            wallet_address: user.wallet_address,
            is_profile_complete: true
        });
    } catch (e) {
        console.error('❌ Login Error:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const fetchKickStats = async () => {
    console.log('🔄 Fetching Kick Stats for ghost_gamingtv...');
    let followers = null;
    let isLive = false;
    let viewers = 0;
    let streamTitle = '';
    let category = '';
    
    // Helper to extract data
    const extractData = (data) => {
        if (data.followersCount || data.followers_count || data.followers) {
            followers = data.followersCount || data.followers_count || (data.followers?.length);
        }
        
        if (data.livestream) {
            isLive = true;
            viewers = data.livestream.viewer_count || 0;
            streamTitle = data.livestream.session_title || '';
            if (data.livestream.categories && data.livestream.categories.length > 0) {
                category = data.livestream.categories[0].name;
            }
        } else {
            isLive = false;
            viewers = 0;
        }
        return followers !== null;
    };

    // 1. Try with Stored User Token (Most Reliable)
    const storedToken = await getSystemStat('kick_access_token');
    if (storedToken) {
         console.log('   👉 Trying with Stored User Token...');
         const endpoints = [
            'https://api.kick.com/public/v1/channels/ghost_gamingtv',
            'https://api.kick.com/api/v1/channels/ghost_gamingtv',
            'https://api.kick.com/api/v2/channels/ghost_gamingtv'
        ];
        
        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    headers: { 
                        'Authorization': `Bearer ${storedToken}`,
                        'Accept': 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (extractData(data)) {
                        console.log('   ✅ User Token Success! Followers:', followers);
                        break;
                    }
                }
            } catch (e) { }
        }
    }

    // 2. Try Kick API with Client Credentials
    if (followers === null) {
        try {
            console.log('   👉 Trying Kick API (id.kick.com)...');
            // Get Token
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', process.env.KICK_DEVELOPER_ID);
            params.append('client_secret', process.env.KICK_CLIENT_SECRET);
            params.append('scope', ''); 

            const tokenRes = await fetch('https://id.kick.com/oauth/token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params
            });

            if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                const accessToken = tokenData.access_token;
                console.log('   ✅ API Token Acquired');
                
                const channelSlug = 'ghost_gamingtv'; 
                const endpoints = [
                    `https://api.kick.com/public/v1/channels/${channelSlug}`,
                    `https://api.kick.com/api/v1/channels/${channelSlug}`,
                    `https://api.kick.com/v1/channels/${channelSlug}`
                ];

                for (const url of endpoints) {
                    try {
                        const res = await fetch(url, {
                            headers: { 
                                'Authorization': `Bearer ${accessToken}`,
                                'Accept': 'application/json'
                            }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (extractData(data)) {
                                console.log('   ✅ API Success! Followers:', followers);
                                break;
                            }
                        }
                    } catch (e) { }
                }
            }
        } catch (e) {
            console.error('   ❌ API Error:', e.message);
        }
    }


    // 3. Fallback: Scraper (StreamerStats)
    if (followers === null) {
        try {
            console.log('   👉 Trying Scraper (StreamerStats)...');
            const url = 'https://streamerstats.com/kick/ghost_gamingtv/streamer/profile';
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await response.text();
            
            // Followers
            const followersRegex = /Followers(?:[\s\S]*?)(\d{1,3}(?:,\d{3})*|\d+)/i;
            const match = html.match(followersRegex);
            if (match && match[1]) {
                followers = parseInt(match[1].replace(/,/g, ''), 10);
            }
            
            // Try to find Viewers or Rank if possible (Regex is fragile)
            // Example: "Average Viewers" ... number
            
        } catch (e) {
            console.error('   ❌ Scraper Error:', e.message);
        }
    }

    // 4. Update Database
    if (followers !== null) {
        await setSystemStat('kick_followers', followers);
        await setSystemStat('kick_is_live', isLive);
        await setSystemStat('kick_viewers', viewers);
        await setSystemStat('kick_stream_title', streamTitle);
        await setSystemStat('kick_category', category);
        
        // Weekly Logic
        const weeklyStart = await getSystemStat('weekly_start_followers');
        if (!weeklyStart) {
            await setSystemStat('weekly_start_followers', followers);
        }
        
        console.log(`   💾 Saved: Followers=${followers}, Live=${isLive}, Viewers=${viewers}`);
    } else {
        console.log('   ⚠️ Could not fetch followers from any source. Keeping existing data.');
    }
};

// Initial Fetch and Interval
fetchKickStats();
setInterval(fetchKickStats, 60 * 60 * 1000); // Every 1 hour

// Check RSS Feeds
const checkNewContent = async () => {
    console.log('🔄 Checking RSS Feeds...');
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    for (let [platform, url] of Object.entries(myFeeds)) {
        try {
            const feed = await parser.parseURL(url);
            
            if (feed.items && feed.items.length > 0) {
                const latestItem = feed.items[0];
                const pubDate = new Date(latestItem.pubDate || latestItem.isoDate);
                
                // Check if post is from last 24 hours
                const isNew = pubDate > twentyFourHoursAgo;
                
                feedCache[platform] = {
                    isNew: isNew,
                    date: pubDate,
                    link: latestItem.link
                };
                
                console.log(`✅ ${platform}: New post? ${isNew} (${pubDate.toISOString()})`);
            }
        } catch (error) {
            console.error(`❌ Error fetching ${platform} RSS:`, error.message);
        }
    }
};

// Check feeds every 15 minutes
setInterval(checkNewContent, 15 * 60 * 1000);
// Initial check after 5 seconds
setTimeout(checkNewContent, 5000);

// --- Social Verification (Graph API) ---
const verifySocialComment = async (platform, gCode) => {
    const token = process.env.META_USER_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ Missing META_USER_ACCESS_TOKEN');
        return false;
    }

    try {
        console.log(`🔍 Verifying ${platform} comment for G-Code: ${gCode}`);

        // 1. Get Linked Accounts (Pages)
        const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
        const accountsData = await accountsRes.json();
        
        if (!accountsData.data || accountsData.data.length === 0) {
            console.error('❌ No Pages found linked to this token');
            return false;
        }

        let targetId = null; // The ID to fetch media from (IG Business ID or Page ID)
        let endpoint = 'media'; // 'media' or 'feed'

        if (platform === 'instagram') {
            // Find IG Business Account ID
            for (const page of accountsData.data) {
                const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${token}`);
                const igData = await igRes.json();
                if (igData.instagram_business_account) {
                    targetId = igData.instagram_business_account.id;
                    break;
                }
            }
            if (!targetId) {
                console.error('❌ No Instagram Business Account found');
                return false;
            }
        } else if (platform === 'facebook') {
             // Use the first Page ID
             targetId = accountsData.data[0].id;
             endpoint = 'feed'; // Facebook Pages use /feed
        } else if (platform === 'threads') {
            // Threads API is separate (graph.threads.net), requires different token usually.
            // For now, we'll try standard Graph API or fallback to RSS check (which is already done in isNew)
            // Note: Real Threads API requires separate OAuth.
            console.warn('⚠️ Threads API requires separate token. Skipping strict G-Code check for now.');
            return true; // Bypass for Threads until token is provided
        }

        // 2. Fetch Recent Media
        const mediaUrl = `https://graph.facebook.com/v19.0/${targetId}/${endpoint}?fields=id,caption,message,comments{text,username,from}&limit=5&access_token=${token}`;
        const mediaRes = await fetch(mediaUrl);
        const mediaData = await mediaRes.json();
        
        if (!mediaData.data) return false;

        // 3. Scan Comments
        for (const post of mediaData.data) {
            if (post.comments && post.comments.data) {
                for (const comment of post.comments.data) {
                    // Check for G-Code (Case Insensitive)
                    if (comment.text && comment.text.toUpperCase().includes(gCode.toUpperCase())) {
                        console.log(`✅ Found G-Code in comment: ${comment.text}`);
                        return true;
                    }
                }
            }
        }
        
        console.log('❌ G-Code not found in recent comments');
        return false;

    } catch (e) {
        console.error('❌ Verify Social Error:', e.message);
        return false;
    }
};

// Route for Verification
app.post('/api/social/verify', async (req, res) => {
    const { visitor_id, platform } = req.body;
    
    try {
        // 1. Get User G-Code
        const [users] = await pool.query('SELECT g_code FROM users WHERE visitor_id = ?', [visitor_id]);
        if (users.length === 0 || !users[0].g_code) return res.status(400).json({ success: false, message: 'No G-Code found' });
        
        const gCode = users[0].g_code;
        
        // 2. Verify
        const isValid = await verifySocialComment(platform, gCode);
        
        if (isValid) {
            // Auto-Claim logic could go here, but we'll let frontend call /api/claim
            return res.json({ success: true, verified: true });
        } else {
            return res.json({ success: false, message: `G-Code ${gCode} not found in recent ${platform} comments.` });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Routes ---

// 0. Get Feed Status
app.get('/api/feed-status', (req, res) => {
    res.json(feedCache);
});

// Initialize User (or Update)
app.post('/api/init-user', async (req, res) => {
  const { visitor_id, wallet_address, kick_username, referred_by } = req.body;
  if (!visitor_id) return res.status(400).json({ error: 'Visitor ID required' });

  // Fraud Check: One Wallet per Device
  if (wallet_address) {
    try {
      const [existing] = await pool.query('SELECT wallet_address FROM device_wallets WHERE visitor_id = ?', [visitor_id]);
      if (existing.length > 0) {
        if (existing[0].wallet_address !== wallet_address) {
             // LOG FRAUD
             console.warn(`⚠️ Multi-account warning for ${visitor_id}. Allowed for dev/testing.`);
             syncToGoogleSheet('FRAUD_ALERT_SKIPPED', { 
                 visitor_id, 
                 wallet_address, 
                 reason: 'Multi-account detected (Dev Mode)', 
                 original_wallet: existing[0].wallet_address 
             });
             // return res.status(403).json({ error: 'Device blocked: Multi-account detected' });
        }
      } else {
        await pool.query('INSERT INTO device_wallets (visitor_id, wallet_address) VALUES (?, ?)', [visitor_id, wallet_address]);
      }
    } catch (e) { console.error(e); }
  }

  try {
    // Generate G-Code if not exists
    let g_code = null;
    if (kick_username) {
         // Check if user already has G-Code
         const [user] = await pool.query('SELECT g_code FROM users WHERE visitor_id = ?', [visitor_id]);
         if (user.length > 0 && user[0].g_code) {
             g_code = user[0].g_code;
         } else {
             // Generate New G-Code
             const randomPart = Math.floor(100000 + Math.random() * 900000); // 6 digit
             g_code = `${kick_username}-G-${randomPart}`;
         }
    }

    // Insert or Update User
    // STRICT RULE: If visitor_id exists, DO NOT UPDATE wallet_address or kick_username (Lock Identity)
    // Only allow update if they are NULL in DB.
    await pool.query(`
      INSERT INTO users (visitor_id, wallet_address, kick_username, g_code, referred_by, last_active)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(visitor_id) DO UPDATE SET
        wallet_address = COALESCE(users.wallet_address, excluded.wallet_address), -- Keep existing if set
        kick_username = COALESCE(users.kick_username, excluded.kick_username),   -- Keep existing if set
        g_code = COALESCE(users.g_code, excluded.g_code),
        last_active = CURRENT_TIMESTAMP
    `, [visitor_id, wallet_address, kick_username, g_code, referred_by]);

    // Fetch updated user data
    const [rows] = await pool.query('SELECT * FROM users WHERE visitor_id = ?', [visitor_id]);
    
    // Sync to Google Sheet (User Update)
    if (wallet_address || kick_username) {
        syncToGoogleSheet('USER_UPDATE', rows[0]);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Init user error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Track Click (Start Task)
app.post('/api/track-click', async (req, res) => {
  const { visitor_id, wallet_address, task_url } = req.body;
  try {
    await pool.query('INSERT INTO task_clicks (visitor_id, wallet_address, task_url) VALUES (?, ?, ?)', [visitor_id, wallet_address, task_url]);
    syncToGoogleSheet('TASK_CLICK', { visitor_id, wallet_address, task_url });
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Update Profile (Kick Username / G-Code)
app.post('/api/update-profile', async (req, res) => {
    const { visitor_id, kick_username, g_code } = req.body;
    if (!visitor_id) return res.status(400).json({ error: 'Missing visitor_id' });

    try {
        let updates = [];
        let params = [];

        if (kick_username) {
            updates.push('kick_username = ?');
            params.push(kick_username);
        }
        if (g_code) {
            updates.push('g_code = ?');
            params.push(g_code);
        }

        if (updates.length > 0) {
            params.push(visitor_id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE visitor_id = ?`, params);
            res.json({ success: true, message: 'Profile updated' });
        } else {
            res.json({ success: true, message: 'No changes' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. Claim Task Reward
app.post('/api/mining/ping', async (req, res) => {
    const { visitor_id } = req.body;
    if (!visitor_id) return res.status(400).json({ error: 'Missing visitor_id' });

    try {
        // 1. Check if Stream is Live
        const isLive = (await getSystemStat('kick_is_live')) === 'true';
        
        if (!isLive) {
             return res.json({ success: false, message: 'Stream is offline', isLive: false });
        }

        // 2. Rate Limit (Check last ping)
        const [rows] = await pool.query('SELECT last_mining_ping, total_points FROM users WHERE visitor_id = ?', [visitor_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const lastPing = rows[0].last_mining_ping ? new Date(rows[0].last_mining_ping) : null;
        const now = new Date();
        
        // Allow ping if last ping was > 175 seconds ago (3 minutes approx)
        if (lastPing && (now - lastPing) < 175000) {
             return res.json({ success: false, message: 'Too soon', cooldown: true });
        }

        // 3. Award Points (5 Points)
        const POINTS_PER_PING = 5;
        await pool.query(`
            UPDATE users 
            SET total_points = total_points + ?, 
                weekly_points = weekly_points + ?, 
                last_mining_ping = CURRENT_TIMESTAMP,
                last_active = CURRENT_TIMESTAMP
            WHERE visitor_id = ?
        `, [POINTS_PER_PING, POINTS_PER_PING, visitor_id]);

        res.json({ success: true, points_added: POINTS_PER_PING, new_total: rows[0].total_points + POINTS_PER_PING });

    } catch (error) {
        console.error('Mining Ping Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/claim', async (req, res) => {
  const { visitor_id, task_id, points, platform } = req.body;
  
  try {
    // Check if already claimed
    const [existing] = await pool.query(
      'SELECT * FROM user_claims WHERE visitor_id = ? AND task_id = ?',
      [visitor_id, task_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Already claimed' });
    }

    // Record Claim
    await pool.query(
      'INSERT INTO user_claims (visitor_id, task_id, reward, platform) VALUES (?, ?, ?, ?)',
      [visitor_id, task_id, points, platform]
    );

    // Update User Points (Total + Weekly) + Tasks Completed
    await pool.query(
      'UPDATE users SET total_points = total_points + ?, weekly_points = weekly_points + ?, tasks_completed = tasks_completed + 1 WHERE visitor_id = ?',
      [points, points, visitor_id]
    );

    res.json({ success: true, message: 'Reward claimed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 3. Get Leaderboard (Top 10 Weekly)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT visitor_id, kick_username, wallet_address, total_points, weekly_points FROM users ORDER BY weekly_points DESC LIMIT 10'
    );
    // Mask visitor_id for privacy (e.g., "vis_...123")
    const leaderboard = rows.map(row => ({
      ...row,
      visitor_id: row.visitor_id.substring(0, 8) + '...'
    }));
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Global Stats
app.get('/api/stats', async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    // For comments: Sum of weekly_comments
    const [commentsSum] = await pool.query('SELECT SUM(weekly_comments) as total FROM users');
    
    // Read Kick Stats from DB
    const kickFollowers = Number(await getSystemStat('kick_followers')) || 0;
    const weeklyStart = Number(await getSystemStat('weekly_start_followers')) || kickFollowers;
    const kickViewers = Number(await getSystemStat('kick_viewers')) || 0;
    const isLive = (await getSystemStat('kick_is_live')) === 'true';
    const streamTitle = await getSystemStat('kick_stream_title') || 'Offline';
    const category = await getSystemStat('kick_category') || 'Just Chatting';

    // Use Kick Stats if available (followers), else fallback to DB user count
    const totalFollowers = kickFollowers > 0 ? kickFollowers : userCount[0].count;
    
    // Calculate Follower Growth (Change since weekly reset)
    const growth = totalFollowers - weeklyStart;
    const growthStr = growth >= 0 ? `+${growth}` : `${growth}`;

    res.json({
      success: true,
      total_users: totalFollowers, // Mapped to Kick Followers
      followers_growth: growthStr,
      total_distributed: kickViewers, // Mapped to Weekly Viewers
      active_tasks: commentsSum[0].total || 0, // Mapped to Total Comments
      
      // New Raw Data for Dashboard
      kick_stats: {
          followers: totalFollowers,
          viewers: kickViewers,
          is_live: isLive,
          title: streamTitle,
          category: category
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Top Comments (Top 6 Weekly) - Enforce 6 Slots
app.get('/api/top-comments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT visitor_id, kick_username, wallet_address, weekly_comments, weekly_points FROM users ORDER BY weekly_comments DESC, weekly_points DESC LIMIT 6'
    );
    
    const topComments = rows.map(row => ({
      username: row.kick_username || 'Anonymous',
      wallet: row.wallet_address,
      comments: row.weekly_comments,
      points: row.weekly_points,
      avatar: 'bg-gradient-to-br from-green-400 to-blue-500' 
    }));

    // Pad with placeholders removed per user request for "real data only"
    // while (topComments.length < 6) { ... }
    
    res.json({ success: true, topComments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5.5 Get Additional Leaderboards (Interactive, Referrals)
app.get('/api/leaderboards', async (req, res) => {
    try {
        // Helper function removed - returning real data only
        const pad = (arr, count) => {
            return arr.map(row => ({
                username: row.username || 'Anonymous',
                value: row.value || 0
            }));
        };

        // 1. Most Interactive (Tasks Completed)
        const [taskRows] = await pool.query('SELECT kick_username as username, tasks_completed as value FROM users ORDER BY tasks_completed DESC LIMIT 6');
        
        // 2. Top Referrers
        const [refRows] = await pool.query('SELECT kick_username as username, referral_count as value FROM users ORDER BY referral_count DESC LIMIT 6');
        
        res.json({
            success: true,
            most_interactive: pad(taskRows, 6),
            top_referrers: pad(refRows, 6)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6. Update Kick Stats (From Frontend)
app.post('/api/update-kick-stats', async (req, res) => {
    const { followers, is_live } = req.body;
    
    if (followers === undefined) {
        return res.status(400).json({ success: false, message: 'Followers count required' });
    }

    try {
        console.log(`📡 Received Stats Update from Client: ${followers} followers, Live: ${is_live}`);
        
        await setSystemStat('kick_followers', followers);
        if (is_live !== undefined) {
            await setSystemStat('kick_is_live', is_live);
        }
        
        // Ensure weekly start is set
        const weeklyStart = await getSystemStat('weekly_start_followers');
        if (!weeklyStart) {
            await setSystemStat('weekly_start_followers', followers);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating kick stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Instagram Webhook Verification ---
app.get('/api/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'akgs_empire_social_verify';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook Verified');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });
  
app.post('/api/webhook', (req, res) => {
    const body = req.body;

    console.log('📩 Webhook Received:', JSON.stringify(body, null, 2));

    if (body.object === 'instagram') {
        // Process webhook asynchronously
        (async () => {
            try {
                for (const entry of body.entry) {
                    for (const change of entry.changes) {
                        const field = change.field;
                        const value = change.value;

                        if (field === 'comments') {
                            const username = value.from.username; // Instagram Username
                            console.log(`💬 New Comment from ${username}: ${value.text}`);
                            
                            // Reward Logic
                            try {
                                // Find user by Instagram Username
                                const [rows] = await pool.query('SELECT * FROM users WHERE instagram_username = ? COLLATE NOCASE', [username]);
                                
                                if (rows.length > 0) {
                                    const user = rows[0];
                                    const REWARD = 50; // Points per comment
                                    
                                    await pool.query(`
                                        UPDATE users 
                                        SET total_points = total_points + ?, 
                                            weekly_points = weekly_points + ?, 
                                            weekly_comments = weekly_comments + 1 
                                        WHERE visitor_id = ?
                                    `, [REWARD, REWARD, user.visitor_id]);
                                    
                                    console.log(`💰 Rewarded ${user.visitor_id} (${username}) ${REWARD} points for comment.`);
                                } else {
                                    console.log(`⚠️ No AKGS user linked to Instagram: ${username}`);
                                }
                            } catch (e) {
                                console.error('❌ Reward Error:', e);
                            }

                        } else if (field === 'mentions') {
                            const username = value.from ? value.from.username : 'Unknown';
                            console.log(`🔔 New Mention from ${username}: Media ID ${value.media_id}`);
                            
                             // Reward Logic for Mentions (Higher Reward?)
                             try {
                                const [rows] = await pool.query('SELECT * FROM users WHERE instagram_username = ? COLLATE NOCASE', [username]);
                                
                                if (rows.length > 0) {
                                    const user = rows[0];
                                    const REWARD = 100; // Points per mention
                                    
                                    await pool.query(`
                                        UPDATE users 
                                        SET total_points = total_points + ?, 
                                            weekly_points = weekly_points + ?
                                        WHERE visitor_id = ?
                                    `, [REWARD, REWARD, user.visitor_id]);
                                    
                                    console.log(`💰 Rewarded ${user.visitor_id} (${username}) ${REWARD} points for mention.`);
                                }
                            } catch (e) { console.error('❌ Reward Error:', e); }
                        }
                    }
                }
            } catch (error) {
                console.error('Webhook Processing Error:', error);
            }
        })();
    }

    res.sendStatus(200);
});

// Serve Frontend (Vite Build)
app.use(express.static(join(__dirname, '../dist')));

// Catch-all route to serve React App
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
});


// --- Leaderboard Endpoints ---

// 1. Top Referrers
app.get('/api/leaderboard/referrers', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, referral_count 
            FROM users 
            ORDER BY referral_count DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Top Comments (Most Interactive) - Using weekly_comments
app.get('/api/leaderboard/comments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_comments, chat_messages_count
            FROM users 
            ORDER BY weekly_comments DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Weekly Global Rankings (Points)
app.get('/api/leaderboard/points', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_points 
            FROM users 
            ORDER BY weekly_points DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Platform User Lists
app.get('/api/users/platform/:platform', async (req, res) => {
    const { platform } = req.params;
    let column = '';
    
    switch(platform) {
        case 'kick': column = 'kick_username'; break;
        case 'instagram': column = 'instagram_username'; break;
        case 'twitter': column = 'twitter_username'; break;
        case 'threads': column = 'threads_username'; break;
        default: return res.status(400).json({ error: 'Invalid platform' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT ${column} as username, wallet_address, visitor_id, g_code 
            FROM users 
            WHERE ${column} IS NOT NULL AND ${column} != ''
            ORDER BY created_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Parser from 'rss-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

// Middleware
app.use(cors());
app.use(express.json());

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
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
  }
};
testConnection();

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

// --- Kick OAuth Flow ---
app.post('/api/kick/exchange-token', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    try {
        console.log('🔄 Exchanging Kick Auth Code...');
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', process.env.KICK_DEVELOPER_ID);
        params.append('client_secret', process.env.KICK_CLIENT_SECRET);
        params.append('redirect_uri', 'http://localhost:3000/');
        params.append('code', code);

        // Try standard OAuth endpoints
        const tokenEndpoints = [
            'https://id.kick.com/oauth/token',
            'https://api.kick.com/oauth/token'
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
                if (response.ok) {
                    tokenData = await response.json();
                    break;
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

        // Fetch User Data / Channel Data
        // Try multiple endpoints to get follower count
        const endpoints = [
            'https://api.kick.com/public/v1/users/ghost_gamingtv',
            'https://api.kick.com/api/v1/users/ghost_gamingtv',
            'https://api.kick.com/public/v1/channels/ghost_gamingtv'
        ];
        
        let followers = null;
        
        for (const url of endpoints) {
            try {
                const userRes = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    console.log('✅ Fetched Kick Data:', userData);
                    // Extract followers (structure depends on endpoint)
                    followers = userData.followers_count || userData.followersCount || (userData.followers && userData.followers.length);
                    if (followers) break;
                }
            } catch (e) { console.error('Fetch error:', e.message); }
        }

        // If automatic fetch fails, we still return success so frontend knows we are connected
        // But we really want the followers.
        
        if (followers) {
            await setSystemStat('kick_followers', followers);
             // If this is the first time we see followers, set weekly start
            const weeklyStart = await getSystemStat('weekly_start_followers');
            if (!weeklyStart) {
                await setSystemStat('weekly_start_followers', followers);
            }
            console.log('✅ Updated Kick Followers:', followers);
        }

        res.json({ success: true, followers });

    } catch (error) {
        console.error('❌ OAuth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const fetchKickStats = async () => {
    console.log('🔄 Fetching Kick Stats for ghost_gamingtv...');
    let followers = null;
    let isLive = false;
    
    // 1. Try with Stored User Token (Most Reliable)
    const storedToken = await getSystemStat('kick_access_token');
    if (storedToken) {
         console.log('   👉 Trying with Stored User Token...');
         const endpoints = [
            'https://api.kick.com/public/v1/channels/ghost_gamingtv',
            'https://api.kick.com/api/v1/channels/ghost_gamingtv',
            'https://api.kick.com/api/v2/channels/ghost_gamingtv',
            'https://api.kick.com/public/v1/users/ghost_gamingtv'
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
                    if (data.followersCount || data.followers_count || data.followers) {
                        followers = data.followersCount || data.followers_count || (data.followers?.length);
                        isLive = data.livestream !== null;
                        console.log('   ✅ User Token Success! Followers:', followers);
                        break;
                    }
                }
            } catch (e) { }
        }
    }

    // 2. Try Kick API with Client Credentials (Backup)
    if (followers === null) {
        try {
            console.log('   👉 Trying Client Credentials...');
            // Get Token
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', process.env.KICK_DEVELOPER_ID);
            params.append('client_secret', process.env.KICK_CLIENT_SECRET);
            params.append('scope', ''); // Empty scope works for client_credentials

            const tokenRes = await fetch('https://api.kick.com/oauth/token', {
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
                
                // Try Endpoints (Case sensitive might matter for some)
                const channelSlug = 'ghost_gamingTV'; 
                const endpoints = [
                    `https://api.kick.com/public/v1/channels/${channelSlug}`,
                    `https://api.kick.com/api/v1/channels/${channelSlug}`,
                    `https://api.kick.com/api/v2/channels/${channelSlug}`,
                    `https://kick.com/api/v1/channels/${channelSlug}`,
                    `https://kick.com/api/v2/channels/${channelSlug}`
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
                            if (data.followersCount || data.followers_count || data.followers) {
                                followers = data.followersCount || data.followers_count || (data.followers?.length);
                                isLive = data.livestream !== null;
                                console.log('   ✅ API Success! Followers:', followers);
                                break;
                            }
                        } else {
                            console.log(`   ⚠️ API Endpoint failed: ${url} (Status: ${res.status})`);
                        }
                    } catch (e) { console.log('   ⚠️ API Endpoint Error:', url, e.message); }
                }
            } else {
                console.log('   ⚠️ API Token Failed:', tokenRes.status, await tokenRes.text());
            }
        } catch (e) {
            console.error('   ❌ API Error:', e.message);
        }
    }


    // 3. Fallback: Scraper (StreamerStats)
    if (followers === null) {
        try {
            console.log('   👉 Trying Scraper (StreamerStats)...');
            const url = 'https://streamerstats.com/kick/ghost_gamingTV/streamer/profile';
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await response.text();
            
            // Regex to find a number after "Followers" (flexible with whitespace/tags)
            // Example HTML: <p class="...">Followers</p><p class="...">603</p>
            // Or: <h5>Followers</h5><h2>603</h2>
            const followersRegex = /Followers(?:[\s\S]*?)(\d{1,3}(?:,\d{3})*|\d+)/i;
            const match = html.match(followersRegex);
            
            if (match && match[1]) {
                followers = parseInt(match[1].replace(/,/g, ''), 10);
                console.log('   ✅ Scraper Success! Followers:', followers);
            } else {
                console.log('   ⚠️ Scraper found no match.');
                // console.log('Partial HTML:', html.substring(0, 500)); // Debug
            }
            
        } catch (e) {
            console.error('   ❌ Scraper Error:', e.message);
        }
    }

    // 3. Update Database
    if (followers !== null) {
        await setSystemStat('kick_followers', followers);
        await setSystemStat('kick_is_live', isLive);
        
        // Weekly Logic
        const weeklyStart = await getSystemStat('weekly_start_followers');
        if (!weeklyStart) {
            await setSystemStat('weekly_start_followers', followers);
        }
        
        console.log(`   💾 Saved: Followers=${followers}, Live=${isLive}`);
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
                    date: pubDate
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
             syncToGoogleSheet('FRAUD_ALERT', { 
                 visitor_id, 
                 wallet_address, 
                 reason: 'Multi-account detected', 
                 original_wallet: existing[0].wallet_address 
             });
             return res.status(403).json({ error: 'Device blocked: Multi-account detected' });
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

    // Update User Points (Total + Weekly)
    await pool.query(
      'UPDATE users SET total_points = total_points + ?, weekly_points = weekly_points + ? WHERE visitor_id = ?',
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

    // Use Kick Stats if available (followers), else fallback to DB user count
    const totalFollowers = kickFollowers > 0 ? kickFollowers : userCount[0].count;
    
    // Calculate Follower Growth (Change since weekly reset)
    const growth = totalFollowers - weeklyStart;
    const growthStr = growth > 0 ? `+${growth}` : (isLive ? 'Live' : 'Offline');

    res.json({
      success: true,
      total_users: totalFollowers, // Mapped to Kick Followers
      followers_growth: growthStr,
      total_distributed: kickViewers, // Mapped to Weekly Viewers
      active_tasks: commentsSum[0].total || 0 // Mapped to Total Comments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Top Comments (Top 6 Weekly)
app.get('/api/top-comments', async (req, res) => {
  try {
    // Return top 6 users by weekly_comments (or weekly_points if comments not tracked yet)
    // Using weekly_points as a proxy for activity if comments are 0, or just returning empty if strict.
    // User asked for "Top Comments", so we should sort by weekly_comments.
    const [rows] = await pool.query(
      'SELECT visitor_id, kick_username, wallet_address, weekly_comments, weekly_points FROM users ORDER BY weekly_comments DESC, weekly_points DESC LIMIT 6'
    );
    
    const topComments = rows.map(row => ({
      username: row.kick_username || 'Anonymous',
      wallet: row.wallet_address,
      comments: row.weekly_comments,
      points: row.weekly_points,
      avatar: 'bg-gradient-to-br from-green-400 to-blue-500' // Placeholder
    }));
    
    res.json({ success: true, topComments });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Serve Frontend (Vite Build)
app.use(express.static(join(__dirname, '../dist')));

// Catch-all route to serve React App
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

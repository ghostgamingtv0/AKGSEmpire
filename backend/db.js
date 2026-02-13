import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ DB Connection Error:', err.message);
    else console.log('✅ Connected to SQLite Database (Shared)');
});

// Promisify DB Wrapper
export const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows]); // Return as [rows] to match mysql2 structure
                });
            } else {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
                });
            }
        });
    }
};

export const getSystemStat = async (key) => {
    try {
        const [rows] = await pool.query('SELECT value FROM system_stats WHERE key = ?', [key]);
        return rows.length > 0 ? rows[0].value : null;
    } catch (e) {
        return null;
    }
};

export const setSystemStat = async (key, value) => {
    try {
        await pool.query('INSERT INTO system_stats (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);
    } catch (e) {
        console.error(`Failed to set stat ${key}:`, e);
    }
};

export const initDB = async () => {
  try {
    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT UNIQUE,
        kick_username TEXT,
        wallet_address TEXT,
        password TEXT,
        referral_code TEXT,
        referred_by TEXT,
        total_points INTEGER DEFAULT 0,
        weekly_points INTEGER DEFAULT 0,
        weekly_comments INTEGER DEFAULT 0,
        chat_messages_count INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        referral_count INTEGER DEFAULT 0,
        instagram_username TEXT,
        facebook_username TEXT,
        tiktok_username TEXT,
        twitter_username TEXT,
        threads_username TEXT,
        username TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns if they don't exist (Migration-like)
    try { await pool.query('ALTER TABLE users ADD COLUMN facebook_username TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN tiktok_username TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN instagram_username TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN username TEXT UNIQUE'); } catch (e) {}

    // Tasks Table (Optional if you want dynamic tasks)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        points INTEGER,
        url TEXT,
        type TEXT
      )
    `);

    // Task Verifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        task_id INTEGER,
        platform TEXT,
        g_code TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System Stats Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_stats (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables initialized (Shared DB)');
  } catch (err) {
    console.error('❌ Table initialization failed:', err);
  }
};

export default db;

import axios from 'axios';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = '@ghost_gamingtv'; 

console.log('🚀 Telegram Bot Stats Module Initialized');

async function updateTelegramStats() {
    if (!TOKEN) {
        console.log('❌ Telegram Token missing in .env');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${TOKEN}/getChatMembersCount?chat_id=${CHANNEL_ID}`;
        const res = await axios.get(url);
        
        if (res.data.ok) {
            const count = res.data.result;
            console.log(`📊 Telegram Count: ${count}`);
            db.run('INSERT OR REPLACE INTO system_stats (key, value) VALUES (?, ?)', ['telegram_members', count.toString()], (err) => {
                if (err) console.error('❌ DB Error (Telegram):', err.message);
            });
        } else {
            console.error('⚠️ Telegram API Error:', res.data);
        }
    } catch (e) {
        console.error('❌ Telegram Fetch Error:', e.message);
    }
}

// Run immediately and then every 10 minutes
updateTelegramStats();
setInterval(updateTelegramStats, 10 * 60 * 1000);

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ DB Connection Error:', err.message);
        process.exit(1);
    }
});

console.log('--- 🛡️ AKGS EMPIRE FULL DATABASE DUMP 🛡️ ---');
console.log('--------------------------------------------');

// Get table info first to see what we are dealing with
db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) {
        console.error('❌ PRAGMA Error:', err.message);
        db.close();
        return;
    }
    
    console.log('Columns found:', columns.map(c => c.name).join(', '));
    console.log('--------------------------------------------');

    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('❌ Select All Error:', err.message);
        } else if (rows.length === 0) {
            console.log('⚠️ No users found in the database.');
        } else {
            console.log(`✅ Total Users Found: ${rows.length}\n`);
            rows.forEach((user, index) => {
                console.log(`User #${index + 1}:`, JSON.stringify(user, null, 2));
                console.log('--------------------------------------------');
            });
        }
        db.close();
    });
});

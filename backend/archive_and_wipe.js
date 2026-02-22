import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');
const backupDir = path.join(__dirname, '../_USER_DATA_ARCHIVE');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const backupFile = path.join(backupDir, `users_backup_${Date.now()}.json`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database', err);
        process.exit(1);
    }
    console.log('✅ Connected to database.');
});

db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
        console.error('❌ Error querying users', err);
        process.exit(1);
    }

    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
    console.log(`✅ Backup created successfully at: ${backupFile}`);
    console.log(`📊 Total user records archived: ${rows.length}`);

    db.run('DELETE FROM users', [], (err) => {
        if (err) {
            console.error('❌ Error deleting users', err);
            process.exit(1);
        }
        console.log('🗑️ All user data deleted successfully from database.');

        db.run('DELETE FROM task_verifications', [], (err) => {
            if (err) {
                console.error('❌ Error deleting task_verifications', err);
            } else {
                console.log('🗑️ All task_verifications data deleted successfully from database.');
            }

            db.run('DELETE FROM system_stats', [], (err) => {
                if (err) {
                    console.error('❌ Error deleting system_stats', err);
                } else {
                    console.log('🗑️ All system_stats data deleted successfully from database.');
                }

                db.run('VACUUM', [], (err) => {
                    if (err) console.error('Warning: Vacuum failed', err);
                    else console.log('🧹 Database vacuumed and optimized.');
                    process.exit(0);
                });
            });
        });
    });
});

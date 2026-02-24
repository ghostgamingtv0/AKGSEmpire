
import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM system_stats', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- System Stats ---');
        rows.forEach(row => {
            console.log(`${row.key}: ${row.value}`);
        });
    }
    db.close();
});

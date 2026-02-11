
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    const rows = await db.all("PRAGMA table_info(users)");
    console.log(rows);
})();

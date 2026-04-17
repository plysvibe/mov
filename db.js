// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Используем /app/data/auth.db на Railway или локальный auth.db
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'auth.db');
const dbDir = path.dirname(dbPath);

// Создаём папку, если её нет
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        first_name TEXT,
        last_name TEXT,
        username TEXT,
        photo_url TEXT,
        auth_date INTEGER
    )`);
});

function findOrCreateUser(profile, callback) {
    const { id: telegram_id, first_name, last_name, username, photo_url, auth_date } = profile;
    
    db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id], (err, row) => {
        if (err) return callback(err);
        if (row) {
            return callback(null, row);
        } else {
            db.run(
                `INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, auth_date) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [telegram_id, first_name, last_name, username, photo_url, auth_date],
                function(err) {
                    if (err) return callback(err);
                    callback(null, {
                        id: this.lastID,
                        telegram_id,
                        first_name,
                        last_name,
                        username,
                        photo_url
                    });
                }
            );
        }
    });
}

module.exports = { findOrCreateUser };
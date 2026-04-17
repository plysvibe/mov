// auth.js
require('dotenv').config();
const passport = require('passport');
const TelegramStrategy = require('passport-telegram-official').TelegramStrategy;
const { findOrCreateUser } = require('./db');

console.log("🚀 Загружаем auth.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;

if (!BOT_TOKEN) { /* ... */ } // Проверки наличия переменных
if (!BOT_USERNAME) { /* ... */ }
if (!BASE_URL) { /* ... */ }

console.log(`✅ Конфигурация: BOT_USERNAME=${BOT_USERNAME}, BASE_URL=${BASE_URL}`);

// --- НАСТРОЙКА PASSPORT ---
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    done(null, { id });
});

// Используем стратегию, передавая ТОЛЬКО botToken
passport.use(new TelegramStrategy({
    botToken: BOT_TOKEN
}, (profile, done) => {
    console.log('🔔 Получен профиль от Telegram:', profile);
    findOrCreateUser(profile, (err, user) => {
        if (err) return done(err);
        return done(null, user);
    });
}));

console.log("✅ Passport настроен");
module.exports = { passport };
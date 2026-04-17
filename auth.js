// auth.js
require('dotenv').config();
const passport = require('passport');
const TelegramStrategy = require('passport-telegram-official').TelegramStrategy;

// Подключаем БД, но если её нет - работаем без неё
let findOrCreateUser;
try {
    const db = require('./db');
    findOrCreateUser = db.findOrCreateUser;
} catch (err) {
    console.warn('⚠️ db.js не найден, пользователи не будут сохраняться в БД');
    findOrCreateUser = (profile, cb) => cb(null, profile);
}

console.log("🚀 Загружаем auth.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;

if (!BOT_TOKEN) {
    console.error("❌ Ошибка: BOT_TOKEN не задан в переменных окружения");
    process.exit(1);
}
if (!BOT_USERNAME) {
    console.error("❌ Ошибка: BOT_USERNAME не задан");
    process.exit(1);
}
if (!BASE_URL) {
    console.error("❌ Ошибка: BASE_URL не задан");
    process.exit(1);
}

console.log(`✅ Конфигурация: BOT_USERNAME=${BOT_USERNAME}, BASE_URL=${BASE_URL}`);

// --- НАСТРОЙКА PASSPORT ---

passport.serializeUser((user, done) => {
    done(null, user.id || user.telegram_id);
});

passport.deserializeUser((id, done) => {
    // Упрощённо: возвращаем объект с id
    done(null, { id });
});

passport.use(new TelegramStrategy({
    botToken: BOT_TOKEN
}, (profile, done) => {
    console.log('🔔 Получен профиль от Telegram:', profile);
    findOrCreateUser(profile, (err, user) => {
        if (err) {
            console.error('❌ Ошибка при работе с БД:', err);
            return done(err);
        }
        return done(null, user);
    });
}));

console.log("✅ Passport и Telegram стратегия настроены");

module.exports = { passport };
// auth.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { betterAuth } = require("better-auth");
const { telegram } = require("better-auth-telegram");

console.log("🚀 Загружаем auth.js");

// ========== Читаем переменные окружения ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET;

// ========== Проверки ==========
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
if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32) {
    console.error("❌ Ошибка: BETTER_AUTH_SECRET должен быть длиной не менее 32 символов");
    process.exit(1);
}

console.log(`✅ Конфигурация: BOT_USERNAME=${BOT_USERNAME}, BASE_URL=${BASE_URL}`);

// ========== Подготавливаем путь к базе данных ==========
// Используем путь из переменной окружения или /app/data/auth.db
const dbPath = process.env.DATABASE_URL || "/app/data/auth.db";
const dbDir = path.dirname(dbPath);

// Создаём папку, если её нет
if (!fs.existsSync(dbDir)) {
    console.log(`📁 Создаём директорию для базы данных: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`🗄️  База данных будет находиться в: ${dbPath}`);

// ========== Инициализация Better Auth с SQLite ==========
const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    database: {
        provider: "sqlite",
        url: dbPath,
    },
    plugins: [
        telegram({
            botToken: BOT_TOKEN,
            botUsername: BOT_USERNAME,
            redirectUri: `${BASE_URL}/api/auth/callback/telegram-oidc`,
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7,      // 7 дней
        updateAge: 60 * 60 * 24,          // 1 день
    },
    trustedOrigins: [BASE_URL],
});

console.log("✅ Better Auth успешно инициализирован (SQLite)");
console.log("🔌 Загруженные плагины:", auth.options.plugins?.map(p => p.name || p.provider) || []);

module.exports = { auth };
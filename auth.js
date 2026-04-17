// auth.js
require('dotenv').config(); // <-- добавляем, чтобы переменные из .env загрузились сразу

const { betterAuth } = require("better-auth");
const { telegram } = require("better-auth-telegram");

console.log("🚀 Загружаем auth.js");

// ========== Читаем переменные окружения ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;
// Better Auth требует секрет длиной минимум 32 символа
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

// ========== Инициализация Better Auth с SQLite ==========
const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    database: {
        provider: "sqlite",
        url: "/app/data/auth.db",               // файл базы данных будет создан в корне проекта
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
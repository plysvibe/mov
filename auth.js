// auth.js
require('dotenv').config();

const { betterAuth } = require("better-auth");
const { telegram } = require("better-auth-telegram");
const { memoryAdapter } = require("better-auth/adapters/memory");

console.log("🚀 Загружаем auth.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET;

if (!BOT_TOKEN) {
    console.error("❌ Ошибка: BOT_TOKEN не задан");
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

// ===== ВРЕМЕННО: используем memoryAdapter =====
const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    database: memoryAdapter(),
    plugins: [
        telegram({
            botToken: BOT_TOKEN,
            botUsername: BOT_USERNAME,
            redirectUri: `${BASE_URL}/api/auth/callback/telegram-oidc`,
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [BASE_URL],
});

console.log("✅ Better Auth успешно инициализирован (memory)");
console.log("🔌 Загруженные плагины:", auth.options.plugins?.map(p => p.name || p.provider) || []);

// Добавим обработку непойманных ошибок, чтобы увидеть стек
process.on('uncaughtException', (err) => {
    console.error('💥 НЕПОЙМАННОЕ ИСКЛЮЧЕНИЕ:', err.stack || err);
    process.exit(1);
});

module.exports = { auth };
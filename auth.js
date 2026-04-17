// auth.js
const { betterAuth } = require("better-auth");
const { telegram } = require("better-auth-telegram");
const { memoryAdapter } = require("better-auth/adapters/memory"); // <-- правильный импорт

console.log("🚀 Загружаем auth.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET || "default-dev-secret-CHANGE-ME";

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

const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    database: memoryAdapter(), // <-- вызываем функцию адаптера
    plugins: [
        telegram({
            botToken: BOT_TOKEN,
            botUsername: BOT_USERNAME,
            redirectUri: `${BASE_URL}/api/auth/callback/telegram`,
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [BASE_URL],
});

console.log("✅ Better Auth успешно инициализирован (memory)");

module.exports = { auth };
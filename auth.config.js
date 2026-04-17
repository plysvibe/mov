require('dotenv').config();

const { BetterAuth } = require('better-auth');
const { telegram } = require('better-auth-telegram');

const auth = new BetterAuth({
    fetch: (...args) => fetch(...args),
    db: {
        provider: "sqlite",
        url: "sqlite:auth.db"
    },
    secret: process.env.AUTH_SECRET || "your-secret-key-change-in-production",
    trustedOrigins: [process.env.BASE_URL || "http://localhost:8080"],
    plugins: [
        telegram({
            clientID: process.env.BOT_USERNAME,
            clientSecret: process.env.BOT_TOKEN,
            redirectURI: `${process.env.BASE_URL}/api/auth/telegram/callback`
        })
    ]
});

module.exports = auth;
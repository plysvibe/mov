const express = require('express');
const path = require('path');
const { auth } = require('./auth');
const { toNodeHandler } = require('better-auth/node');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ========== Middleware ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключаем Better Auth
app.use('/api/auth', toNodeHandler(auth));

// Middleware для проверки авторизации
async function requireAuth(req, res, next) {
    const session = await auth.api.getSession({
        headers: req.headers,
    });
    if (!session) {
        return res.redirect('/');
    }
    req.user = session.user;
    next();
}

// ========== Маршруты ==========

app.get('/', async (req, res) => {
    const session = await auth.api.getSession({
        headers: req.headers,
    });
    res.render('landing', {
        user: session?.user || null,
        botUsername: process.env.BOT_USERNAME,
    });
});

app.get('/cabinet', requireAuth, (req, res) => {
    res.render('cabinet', { user: req.user });
});

app.get('/api/balance', requireAuth, (req, res) => {
    res.json({ balance: 250 });
});

app.get('/logout', async (req, res) => {
    await auth.api.signOut({
        headers: req.headers,
    });
    res.redirect('/');
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен: ${BASE_URL}`);
    console.log(`🤖 Telegram бот: @${process.env.BOT_USERNAME}`);
    console.log(`🔐 Better Auth готов к работе`);
});
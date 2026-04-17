// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const { passport } = require('./auth');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET || 'dev-secret-key-at-least-32-chars-long!!';

// ========== Middleware ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Сессии
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: BASE_URL.startsWith('https'),
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 дней
    }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Глобальная переменная user для шаблонов
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// ========== Маршруты ==========

app.get('/', (req, res) => {
    res.render('landing', {
        botUsername: process.env.BOT_USERNAME
    });
});

app.get('/cabinet', requireAuth, (req, res) => {
    res.render('cabinet', { user: req.user });
});

app.get('/api/balance', requireAuth, (req, res) => {
    res.json({ balance: 250 });
});

// --- Telegram OAuth ---
app.get('/auth/telegram', passport.authenticate('telegram'));

app.get('/auth/telegram/callback',
    passport.authenticate('telegram', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/cabinet');
    }
);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен: ${BASE_URL}`);
    console.log(`🤖 Telegram бот: @${process.env.BOT_USERNAME}`);
    console.log(`🔐 Авторизация через Passport (Telegram OAuth) готова`);
});
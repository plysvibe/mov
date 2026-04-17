// app.js
const express = require('express');
const path = require('path');
const session = require('express-session'); // Добавляем поддержку сессий
const { passport } = require('./auth');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET;

// ========== Middleware ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настраиваем сессии (обязательно для Passport)
app.use(session({
    secret: BETTER_AUTH_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: BASE_URL.startsWith('https') } // secure: true для HTTPS
}));

// Инициализируем Passport и подключаем его сессии
app.use(passport.initialize());
app.use(passport.session());

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// ========== Маршруты ==========

app.get('/', (req, res) => {
    res.render('landing', {
        user: req.user || null,
        botUsername: process.env.BOT_USERNAME,
    });
});

app.get('/cabinet', requireAuth, (req, res) => {
    res.render('cabinet', { user: req.user });
});

app.get('/api/balance', requireAuth, (req, res) => {
    res.json({ balance: 250 });
});

// --- Маршруты для Telegram OAuth ---

// Начало процесса авторизации: перенаправляет пользователя на страницу Telegram
app.get('/auth/telegram', passport.authenticate('telegram'));

// Callback URL, на который Telegram вернёт пользователя после авторизации
app.get('/auth/telegram/callback',
    passport.authenticate('telegram', { failureRedirect: '/' }),
    (req, res) => {
        // Успешная авторизация, перенаправляем в личный кабинет
        res.redirect('/cabinet');
    }
);

// Выход из системы
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен: ${BASE_URL}`);
    console.log(`🤖 Telegram бот: @${process.env.BOT_USERNAME}`);
    console.log(`🔐 Авторизация через Passport (Telegram OAuth) готова`);
});
const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------- Конфигурация ----------
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const SESSION_SECRET = process.env.SESSION_SECRET || 'molotov-vpn-secret-key-2025';
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ---------- Инициализация бота ----------
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();

// ========== ХРАНИЛИЩЕ ТОКЕНОВ (в памяти) ==========
const authTokens = new Map(); // key: token, value: { chatId, expires }

function saveAuthToken(chatId, token) {
    authTokens.set(token, { chatId, expires: Date.now() + 5 * 60 * 1000 }); // 5 минут
}

function getChatIdByToken(token) {
    const record = authTokens.get(token);
    if (!record) return null;
    if (record.expires < Date.now()) {
        authTokens.delete(token);
        return null;
    }
    return record.chatId;
}

function deleteAuthToken(token) {
    authTokens.delete(token);
}

// ========== Настройки сессий ==========
app.use(session({
    secret: process.env.SESSION_SECRET,  // берите из .env
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true,   // true только для HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // сутки
    }
}));

// ========== Стандартные middleware ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== Вспомогательные функции ==========

// Проверка данных от Telegram Login Widget (может пригодиться в будущем)
function verifyTelegramAuth(data, botToken) {
    const { hash, ...dataToCheck } = data;
    const checkString = Object.keys(dataToCheck)
        .sort()
        .map(key => `${key}=${dataToCheck[key]}`)
        .join('\n');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === hash;
}

// Проверка initData, полученных из Telegram WebApp (если вы решите передавать их напрямую)
function verifyWebAppInitData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return calculatedHash === hash;
}

// ========== Обработчик команд бота ==========
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const startParam = match[1] || '';

    if (startParam === 'register') {
        // Генерируем одноразовый токен
        const token = crypto.randomBytes(16).toString('hex');
        saveAuthToken(chatId, token);

        // URL, который откроется внутри WebApp
        const authUrl = `${BASE_URL}/auth/telegram/token?token=${token}`;

        await bot.sendMessage(chatId, 
            '🔐 Нажмите кнопку ниже, чтобы войти в личный кабинет Molotov VPN', 
            {
                reply_markup: {
                    inline_keyboard: [[{
                        text: '🚀 Войти на сайт',
                        web_app: { url: authUrl }
                    }]]
                }
            }
        );
    } else {
        await bot.sendMessage(chatId, 
            `👋 Добро пожаловать в Molotov VPN!\n\n` +
            `Используйте команду /register для регистрации и входа на сайт.`
        );
    }
});

// ========== Маршруты ==========

// Главная страница
app.get('/', (req, res) => {
    const user = req.session.user || null;
    res.render('landing', { 
        user: user,
        botUsername: BOT_USERNAME 
    });
});

// Обработка авторизации по токену (WebApp)
app.get('/auth/telegram/token', async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.redirect('/?error=no_token');
    }

    const chatId = getChatIdByToken(token);
    if (!chatId) {
        return res.redirect('/?error=invalid_token');
    }

    // Удаляем токен, чтобы его нельзя было использовать повторно
    deleteAuthToken(token);

    try {
        // Получаем информацию о пользователе через бота
        const userInfo = await bot.getChat(chatId);
        
        req.session.user = {
            id: chatId,
            firstName: userInfo.first_name || 'Пользователь',
            lastName: userInfo.last_name || '',
            username: userInfo.username || '',
            photoUrl: '' // фото можно получить отдельно через bot.getUserProfilePhotos
        };
        
        // Сохраняем сессию перед редиректом
        req.session.save(err => {
            if (err) console.error('Ошибка сохранения сессии:', err);
            res.redirect('/cabinet');
        });
    } catch (err) {
        console.error('Ошибка получения данных пользователя:', err.message);
        
        // Создаём базового пользователя на случай ошибки API
        req.session.user = {
            id: chatId,
            firstName: 'Пользователь',
            lastName: '',
            username: '',
            photoUrl: ''
        };
        
        req.session.save(() => {
            res.redirect('/cabinet');
        });
    }
});

// Личный кабинет
app.get('/cabinet', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('cabinet', { user: req.session.user });
});

// API: баланс (заглушка)
app.get('/api/balance', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ balance: 250 });
});

// Выход
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Ошибка при разрушении сессии:', err);
        res.redirect('/');
    });
});

// ========== Запуск сервера ==========
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен: ${BASE_URL}`);
    console.log(`🤖 Telegram бот: @${BOT_USERNAME}`);
});
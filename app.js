const express = require('express');
const path = require('path');
const crypto = require('crypto'); // ⚠️ Добавьте в начало файла, если ещё не импортирован

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const BOT_USERNAME = process.env.BOT_USERNAME;

// Сессия для хранения данных пользователя
const sessions = new Map();

// ========== Middleware ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    const token = req.cookies['telegram_user'];
    if (!token) {
        return res.redirect('/');
    }
    try {
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());
        req.user = userData;
        next();
    } catch (err) {
        res.clearCookie('telegram_user');
        return res.redirect('/');
    }
}

// ========== Маршруты ==========

app.get('/', (req, res) => {
    const token = req.cookies['telegram_user'];
    let user = null;
    if (token) {
        try {
            user = JSON.parse(Buffer.from(token, 'base64').toString());
        } catch (err) {
            res.clearCookie('telegram_user');
        }
    }
    res.render('landing', {
        user: user,
        botUsername: process.env.BOT_USERNAME,
    });
});

// Маршрут для аутентификации через Telegram
app.post('/api/auth/telegram', (req, res) => {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    // Формируем строку для проверки хеша
    const dataCheckString = Object.keys(req.body)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => `${key}=${req.body[key]}`)
        .join('\n');
    
    // Создаем секретный ключ из токена бота
    const secretKey = crypto.createHash('sha256').update(process.env.BOT_TOKEN).digest();
    
    // Вычисляем хеш
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    // Проверяем соответствие хешей
    if (hmac !== hash) {
        return res.status(401).json({ success: false, error: 'Invalid hash' });
    }
    
    // Проверяем срок действия (24 часа)
    const authTime = parseInt(auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authTime > 86400) {
        return res.status(401).json({ success: false, error: 'Auth expired' });
    }
    
    // Создаем объект пользователя
    const userData = {
        id: id,
        firstName: first_name,
        lastName: last_name,
        username: username,
        photoUrl: photo_url
    };
    
    // Устанавливаем cookie с данными пользователя
    const token = Buffer.from(JSON.stringify(userData)).toString('base64');
    res.cookie('telegram_user', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    });
    
    res.json({ success: true, user: userData });
});

// Маршрут для получения информации о пользователе
app.get('/api/user', (req, res) => {
    const token = req.cookies['telegram_user'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());
        res.json(userData);
    } catch (err) {
        res.clearCookie('telegram_user');
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get('/cabinet', requireAuth, (req, res) => {
    res.render('cabinet', { user: req.user });
});

app.get('/api/balance', requireAuth, (req, res) => {
    res.json({ balance: 250 });
});

app.get('/logout', (req, res) => {
    res.clearCookie('telegram_user');
    res.redirect('/');
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен: ${BASE_URL}`);
    console.log(`🤖 Telegram бот: @${process.env.BOT_USERNAME}`);
    console.log(`🔐 Better Auth готов к работе`);
});
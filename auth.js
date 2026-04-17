require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BASE_URL = process.env.BASE_URL;

// Экспортируем конфигурацию для использования в app.js
module.exports = { BOT_USERNAME, BASE_URL };
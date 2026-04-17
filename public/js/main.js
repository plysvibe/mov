document.addEventListener('DOMContentLoaded', () => {

    // ====================== ТЕМА ======================
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            toggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            toggle.checked = false;
        }
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ====================== Кнопка Telegram ======================
    const telegramBtn = document.getElementById('telegramAuth');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', () => {
            window.open('https://t.me/MolotovVPN_bot', '_blank');
        });
    }

    // ====================== LOTTIE АНИМАЦИИ ======================
    // Вспомогательная функция для загрузки анимации с запасным эмодзи
    function loadAnimation(containerId, filePath, fallbackEmoji) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (typeof lottie !== 'undefined') {
            lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: filePath
            }).addEventListener('error', () => {
                container.innerHTML = fallbackEmoji;
                container.style.fontSize = '2rem';
            });
        } else {
            container.innerHTML = fallbackEmoji;
            container.style.fontSize = '2rem';
        }
    }

// Загружаем все анимации
loadAnimation('moneyAnimation', '/animations/cash.json', '💰');
loadAnimation('raketaAnimation', '/animations/raketa.json', '🚀');
loadAnimation('lockAnimation', '/animations/lock.json', '🔒');
loadAnimation('russiaFlagAnimation', '/animations/russia-flag.json', '🇷🇺');
loadAnimation('handsAnimation', '/animations/hands.json', '🤝');
loadAnimation('btnTelegramAnimation', '/animations/telegram-icon.json', '📱'); // иконка в кнопке
console.log('✅ Все анимации загружены через Lottie');
});
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

    // ====================== Кнопка Telegram OAuth ======================
    const telegramBtn = document.getElementById('telegramAuth');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', () => {
            // Открываем поп-ап авторизации Telegram OAuth
            const authPopup = window.open('https://oauth.telegram.org/auth?bot_id=YOUR_BOT_ID&origin=YOUR_SITE_URL', '', 'width=600,height=600');
            
            // Периодически проверяем закрытие поп-апа
            const checkPopupClosed = setInterval(() => {
                if (authPopup.closed) {
                    clearInterval(checkPopupClosed);
                    
                    // Проверяем наличие параметра auth_data в URL
                    const params = new URLSearchParams(window.location.search);
                    const authData = params.get('auth_data');
                    
                    if (authData) {
                        // Отправляем auth_data на сервер для проверки
                        fetch('/api/auth/telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ authData })
                        }).then(response => {
                            if (response.ok) {
                                // Авторизация прошла успешно, перенаправляем на личный кабинет
                                window.location.href = '/cabinet';
                            } else {
                                alert('Ошибка авторизации!');
                            }
                        });
                    }
                }
            }, 500);
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
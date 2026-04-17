// public/js/auth-client.js
(async () => {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    const telegramBtn = document.getElementById('telegramAuth');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/auth/sign-in/social', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'telegram-oidc' }),
                });
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    console.error('Ошибка входа:', data);
                    alert('Не удалось начать процесс авторизации.');
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                alert('Произошла ошибка. Попробуйте позже.');
            }
        });
    }
})();
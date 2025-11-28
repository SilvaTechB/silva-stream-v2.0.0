let deferredPrompt;
const installButton = document.getElementById('install-prompt');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installButton) {
        installButton.classList.add('show');
    }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install ${outcome}`);
            deferredPrompt = null;
            installButton.classList.remove('show');
        }
    });
}

window.addEventListener('appinstalled', () => {
    console.log('🎉 SilvaStream installed successfully!');
});

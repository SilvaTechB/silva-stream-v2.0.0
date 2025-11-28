class Sports {
    constructor() {
        this.currentPage = 'home';
        this.iframe = null;
        this.isFullscreen = false;
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.setupIframe();
    }

    setupDOM() {
        this.iframe = document.getElementById('aisports-frame');
        this.embedOverlay = document.getElementById('embed-overlay');
        this.currentUrl = document.getElementById('current-url');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.backBtn = document.getElementById('back-btn');
        this.navItems = document.querySelectorAll('.nav-item');
        this.embedWrapper = document.querySelector('.embed-wrapper');
    }

    setupEvents() {
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.navigateToPage(item.dataset.page);
            });
        });

        // Control buttons
        this.refreshBtn.addEventListener('click', () => {
            this.refreshIframe();
        });

        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        this.backBtn.addEventListener('click', () => {
            this.goBack();
        });

        // Iframe event listeners
        this.iframe.addEventListener('load', () => {
            this.hideLoading();
            this.updateCurrentUrl();
        });

        this.iframe.addEventListener('error', () => {
            this.showError('Failed to load AI Sports. Please check your connection.');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        });

        // Fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
    }

    setupIframe() {
        // Set initial iframe properties
        this.iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation';
        this.iframe.referrerPolicy = 'no-referrer-when-downgrade';
        
        // Show loading initially
        this.showLoading();
    }

    navigateToPage(page) {
        this.currentPage = page;
        
        // Update active nav item
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Map pages to AI Sports URLs
        const pageUrls = {
            'home': 'https://aisports.cc/',
            'football': 'https://aisports.cc/live?sportType=football',
            'cricket': 'https://aisports.cc/live?sportType=cricket',
            'basketball': 'https://aisports.cc/live?sportType=basketball',
            'news': 'https://aisports.cc/sports-news'
        };

        const url = pageUrls[page] || pageUrls.home;
        this.loadUrl(url);
    }

    loadUrl(url) {
        this.showLoading();
        this.iframe.src = url;
        this.currentUrl.textContent = url;
    }

    refreshIframe() {
        this.showLoading();
        this.refreshBtn.classList.add('loading');
        this.refreshBtn.disabled = true;

        // Reload the iframe
        this.iframe.src = this.iframe.src;

        // Re-enable button after a delay
        setTimeout(() => {
            this.refreshBtn.classList.remove('loading');
            this.refreshBtn.disabled = false;
        }, 2000);
    }

    goBack() {
        try {
            // Try to use iframe history if available
            this.iframe.contentWindow.history.back();
        } catch (error) {
            // Fallback to navigation
            this.navigateToPage(this.currentPage);
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        if (this.embedWrapper.requestFullscreen) {
            this.embedWrapper.requestFullscreen();
        } else if (this.embedWrapper.webkitRequestFullscreen) {
            this.embedWrapper.webkitRequestFullscreen();
        } else if (this.embedWrapper.msRequestFullscreen) {
            this.embedWrapper.msRequestFullscreen();
        }
        
        this.embedWrapper.classList.add('fullscreen');
        this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        this.isFullscreen = true;
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        this.embedWrapper.classList.remove('fullscreen');
        this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        this.isFullscreen = false;
    }

    handleFullscreenChange() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            this.embedWrapper.classList.remove('fullscreen');
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            this.isFullscreen = false;
        }
    }

    updateCurrentUrl() {
        try {
            // Try to get the current iframe URL
            const iframeUrl = this.iframe.contentWindow.location.href;
            this.currentUrl.textContent = iframeUrl;
        } catch (error) {
            // Cross-origin restriction - keep the last known URL
            console.log('Cannot access iframe URL due to cross-origin restrictions');
        }
    }

    showLoading() {
        this.embedOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.embedOverlay.classList.add('hidden');
    }

    showError(message) {
        this.embedOverlay.innerHTML = `
            <div class="overlay-content">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 10px; color: var(--light);">Connection Error</h3>
                <p style="margin-bottom: 20px; color: var(--gray-light);">${message}</p>
                <button class="control-btn" onclick="sportsApp.refreshIframe()" style="background: var(--primary);">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        this.embedOverlay.classList.remove('hidden');
    }

    // Method to handle external navigation (if needed)
    navigateToExternal(url) {
        this.loadUrl(url);
    }
}

// Initialize the sports app
const sportsApp = new Sports();

// Make it available globally for any external controls
window.sportsApp = sportsApp;

// Handle page load
document.addEventListener('DOMContentLoaded', () => {
    // Start with home page
    sportsApp.navigateToPage('home');
});
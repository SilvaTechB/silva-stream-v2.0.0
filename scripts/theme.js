// SilvaStream Theme Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('silvastream-theme') || 'dark';
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.applySavedTheme();
    }

    setupTheme() {
        // Define theme variables
        this.themes = {
            dark: {
                '--bg-primary': '#0a0a0f',
                '--bg-secondary': '#14141f',
                '--bg-tertiary': '#1e1e2d',
                '--bg-card': '#252536',
                '--text-primary': '#ffffff',
                '--text-secondary': '#b0b0c0',
                '--text-muted': '#606070',
                '--border-color': '#2d2d3d',
                '--shadow-color': 'rgba(0, 0, 0, 0.5)'
            },
            light: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f5f5f7',
                '--bg-tertiary': '#e8e8ed',
                '--bg-card': '#ffffff',
                '--text-primary': '#1a1a2e',
                '--text-secondary': '#4a4a5e',
                '--text-muted': '#8a8a9e',
                '--border-color': '#e0e0e8',
                '--shadow-color': 'rgba(0, 0, 0, 0.1)'
            },
            midnight: {
                '--bg-primary': '#0d1117',
                '--bg-secondary': '#161b22',
                '--bg-tertiary': '#21262d',
                '--bg-card': '#30363d',
                '--text-primary': '#f0f6fc',
                '--text-secondary': '#c9d1d9',
                '--text-muted': '#8b949e',
                '--border-color': '#30363d',
                '--shadow-color': 'rgba(0, 0, 0, 0.3)'
            },
            ocean: {
                '--bg-primary': '#001233',
                '--bg-secondary': '#001845',
                '--bg-tertiary': '#002855',
                '--bg-card': '#023e7d',
                '--text-primary': '#ffffff',
                '--text-secondary': '#caf0f8',
                '--text-muted': '#90e0ef',
                '--border-color': '#0077b6',
                '--shadow-color': 'rgba(0, 119, 182, 0.3)'
            },
            neon: {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#2a2a2a',
                '--bg-card': '#3a3a3a',
                '--text-primary': '#ffffff',
                '--text-secondary': '#00ffff',
                '--text-muted': '#ff00ff',
                '--border-color': '#00ffff',
                '--shadow-color': 'rgba(0, 255, 255, 0.3)'
            }
        };

        // Add theme styles to document
        this.addThemeStyles();
    }

    addThemeStyles() {
        if (!document.getElementById('theme-styles')) {
            const style = document.createElement('style');
            style.id = 'theme-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Theme toggle button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-switch') || e.target.closest('.theme-toggle-btn')) {
                this.toggleTheme();
            }
        });

        // Theme selector in settings
        document.addEventListener('change', (e) => {
            if (e.target.id === 'theme-selector') {
                this.setTheme(e.target.value);
            }
        });

        // System theme preference
        if (window.matchMedia) {
            this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
            this.prefersDarkScheme.addEventListener('change', (e) => {
                if (localStorage.getItem('silvastream-theme') === 'system') {
                    this.applySystemTheme();
                }
            });
        }

        // Keyboard shortcut (Ctrl/Cmd + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('silvastream-theme');
        
        if (savedTheme === 'system') {
            this.applySystemTheme();
        } else if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else {
            // First time user - detect system preference
            this.applySystemTheme();
        }
    }

    applySystemTheme() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
    }

    setTheme(themeName, save = true) {
        if (!this.themes[themeName]) {
            console.warn(`Theme ${themeName} not found`);
            return;
        }

        this.theme = themeName;
        
        // Apply theme variables
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        Object.keys(theme).forEach(variable => {
            root.style.setProperty(variable, theme[variable]);
        });
        
        // Update body class
        document.body.classList.remove('dark-theme', 'light-theme', 'midnight-theme', 'ocean-theme', 'neon-theme');
        document.body.classList.add(`${themeName}-theme`);
        
        // Save preference
        if (save) {
            localStorage.setItem('silvastream-theme', themeName);
        }
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(themeName);
        
        // Update theme selector if exists
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = themeName;
        }
    }

    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
        
        // Show theme name toast
        this.showThemeToast(themes[nextIndex]);
    }

    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themechange', {
            detail: { theme: themeName }
        });
        document.dispatchEvent(event);
    }

    showThemeToast(themeName) {
        const themeNames = {
            dark: '🌙 Dark Mode',
            light: '☀️ Light Mode',
            midnight: '🌌 Midnight',
            ocean: '🌊 Ocean',
            neon: '💡 Neon'
        };
        
        if (window.utils) {
            window.utils.showToast(`${themeNames[themeName]} activated`, 'info');
        }
    }

    getCurrentTheme() {
        return this.theme;
    }

    getAvailableThemes() {
        return Object.keys(this.themes);
    }

    resetToSystem() {
        localStorage.setItem('silvastream-theme', 'system');
        this.applySystemTheme();
    }

    // For programmatic theme changes
    async fadeThemeTransition(newTheme) {
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${this.themes[newTheme]['--bg-primary']};
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        
        document.body.appendChild(overlay);
        
        // Fade in
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Change theme
        this.setTheme(newTheme);
        
        // Fade out and remove overlay
        await new Promise(resolve => setTimeout(resolve, 500));
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }

    // Add theme animation styles
    addThemeAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            .theme-transition-overlay {
                pointer-events: none;
            }
            
            .theme-icon {
                transition: transform 0.3s ease;
            }
            
            .theme-toggle-btn:hover .theme-icon {
                transform: rotate(30deg);
            }
            
            @media (prefers-reduced-motion: reduce) {
                .theme-transition-overlay {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize theme animations
    initAnimations() {
        this.addThemeAnimations();
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Make available globally
window.themeManager = themeManager;

// Auto-initialize animations
themeManager.initAnimations();

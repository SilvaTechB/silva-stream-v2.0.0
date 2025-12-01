// Theme Manager with smooth transitions and persistence
class ThemeManager {
    constructor() {
        this.themeKey = 'silvastream_theme';
        this.systemThemeKey = 'silvastream_system_theme';
        this.currentTheme = 'dark';
        this.isTransitioning = false;
        this.transitionDuration = 300;
        this.init();
    }

    init() {
        // Load saved theme
        this.loadTheme();
        
        // Apply theme immediately
        this.applyTheme();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup system theme detection
        this.setupSystemThemeDetection();
        
        console.log('Theme Manager initialized');
    }

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem(this.themeKey);
            const systemTheme = localStorage.getItem(this.systemThemeKey);
            
            if (savedTheme) {
                this.currentTheme = savedTheme;
            } else if (systemTheme) {
                this.currentTheme = systemTheme;
            } else {
                // Default to system preference
                this.currentTheme = this.getSystemTheme();
                localStorage.setItem(this.systemThemeKey, this.currentTheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
            this.currentTheme = 'dark';
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem(this.themeKey, theme);
            this.currentTheme = theme;
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    setupSystemThemeDetection() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                const newTheme = e.matches ? 'dark' : 'light';
                
                // Only update if user hasn't set a custom theme
                if (!localStorage.getItem(this.themeKey)) {
                    this.currentTheme = newTheme;
                    localStorage.setItem(this.systemThemeKey, newTheme);
                    this.applyTheme();
                }
            };
            
            // Listen for changes
            mediaQuery.addEventListener('change', handleChange);
            
            // Store for cleanup
            this.mediaQueryListener = handleChange;
        }
    }

    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Listen for theme changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.themeKey && e.newValue) {
                this.currentTheme = e.newValue;
                this.applyTheme();
            }
        });
        
        // Keyboard shortcut (Alt+T)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        if (this.isTransitioning) return;
        
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Show notification
        if (window.uiManager) {
            uiManager.showSuccess(`Theme changed to ${newTheme} mode`);
        }
    }

    setTheme(theme) {
        if (this.isTransitioning || this.currentTheme === theme) return;
        
        this.isTransitioning = true;
        
        // Save theme
        this.saveTheme(theme);
        
        // Start transition
        this.startTransition(() => {
            this.currentTheme = theme;
            this.applyTheme();
            this.isTransitioning = false;
            
            // Update UI
            this.updateThemeUI();
            
            // Dispatch theme change event
            this.dispatchThemeChangeEvent();
        });
    }

    applyTheme() {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('dark-mode', 'light-mode');
        
        // Add current theme class
        body.classList.add(`${this.currentTheme}-mode`);
        
        // Update meta theme-color
        this.updateMetaThemeColor();
        
        // Update CSS variables
        this.updateCSSVariables();
    }

    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Set theme color based on current theme
        if (this.currentTheme === 'dark') {
            metaThemeColor.content = '#0a0a0f';
        } else {
            metaThemeColor.content = '#f8f9fa';
        }
    }

    updateCSSVariables() {
        const root = document.documentElement;
        
        if (this.currentTheme === 'dark') {
            root.style.setProperty('--bg-color', 'var(--dark-bg)');
            root.style.setProperty('--surface-color', 'var(--dark-surface)');
            root.style.setProperty('--card-color', 'var(--dark-card)');
            root.style.setProperty('--text-color', 'var(--dark-text)');
            root.style.setProperty('--text-secondary', 'var(--dark-text-secondary)');
            root.style.setProperty('--border-color', 'var(--dark-border)');
            root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
        } else {
            root.style.setProperty('--bg-color', 'var(--light-bg)');
            root.style.setProperty('--surface-color', 'var(--light-surface)');
            root.style.setProperty('--card-color', 'var(--light-card)');
            root.style.setProperty('--text-color', 'var(--light-text)');
            root.style.setProperty('--text-secondary', 'var(--light-text-secondary)');
            root.style.setProperty('--border-color', 'var(--light-border)');
            root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        }
    }

    updateThemeUI() {
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const moonIcon = themeToggle.querySelector('.fa-moon');
            const sunIcon = themeToggle.querySelector('.fa-sun');
            
            if (this.currentTheme === 'dark') {
                moonIcon.style.opacity = '1';
                sunIcon.style.opacity = '0';
                themeToggle.setAttribute('title', 'Switch to light theme');
            } else {
                moonIcon.style.opacity = '0';
                sunIcon.style.opacity = '1';
                themeToggle.setAttribute('title', 'Switch to dark theme');
            }
        }
        
        // Update theme indicator in user menu
        const themeIndicator = document.getElementById('themeIndicator');
        if (themeIndicator) {
            themeIndicator.textContent = this.currentTheme === 'dark' ? '🌙' : '☀️';
        }
    }

    startTransition(callback) {
        // Add transition class to body
        document.body.classList.add('theme-transitioning');
        
        // Set transition duration
        document.body.style.transitionDuration = `${this.transitionDuration}ms`;
        
        // Execute callback after transition
        setTimeout(() => {
            callback();
            
            // Remove transition class
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
                document.body.style.transitionDuration = '';
            }, 50);
        }, this.transitionDuration);
    }

    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themechange', {
            detail: { theme: this.currentTheme }
        });
        window.dispatchEvent(event);
    }

    // Utility methods
    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    isLightMode() {
        return this.currentTheme === 'light';
    }

    resetToSystem() {
        const systemTheme = this.getSystemTheme();
        this.setTheme(systemTheme);
        localStorage.removeItem(this.themeKey);
        
        if (window.uiManager) {
            uiManager.showInfo('Theme reset to system preference');
        }
    }

    // Add theme to specific element
    addThemeToElement(element, theme) {
        if (!element) return;
        
        element.classList.remove('dark-mode', 'light-mode');
        element.classList.add(`${theme}-mode`);
    }

    // Remove theme from element
    removeThemeFromElement(element) {
        if (!element) return;
        
        element.classList.remove('dark-mode', 'light-mode');
    }

    // Cleanup
    destroy() {
        if (this.mediaQueryListener) {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryListener);
        }
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Make available globally
window.ThemeManager = ThemeManager;
window.themeManager = themeManager;

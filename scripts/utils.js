// SilvaStream Utility Functions
class SilvaStreamUtils {
    constructor() {
        this.init();
    }

    init() {
        this.setupErrorHandling();
        this.setupPerformanceMonitoring();
    }

    // Error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError(event.error || event.message);
            this.showToast('An error occurred. Please try again.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason);
            this.showToast('An error occurred. Please try again.', 'error');
        });
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor largest contentful paint
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log(`LCP: ${entry.startTime}ms`);
                }
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    // Log errors
    logError(error, additionalInfo = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error?.message || error,
            stack: error?.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...additionalInfo
        };

        console.error('SilvaStream Error:', errorLog);
        
        // Send to error tracking service (if configured)
        if (window.SENTRY_DSN) {
            this.sendToErrorTracking(errorLog);
        }
    }

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.getElementById('toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        // Add event listener to close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto remove after duration
        setTimeout(() => this.removeToast(toast), duration);
        
        return toast;
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    removeToast(toast) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Format time (seconds to HH:MM:SS)
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Merge objects
    mergeObjects(...objects) {
        return objects.reduce((merged, current) => {
            if (!current) return merged;
            
            Object.keys(current).forEach(key => {
                if (current[key] !== undefined && current[key] !== null) {
                    if (typeof current[key] === 'object' && !Array.isArray(current[key])) {
                        merged[key] = this.mergeObjects(merged[key] || {}, current[key]);
                    } else {
                        merged[key] = current[key];
                    }
                }
            });
            
            return merged;
        }, {});
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    this.showToast('Copied to clipboard!', 'success');
                    return true;
                } else {
                    throw new Error('Copy command failed');
                }
            } catch (err) {
                document.body.removeChild(textArea);
                this.showToast('Failed to copy to clipboard', 'error');
                return false;
            }
        }
    }

    // Share content
    shareContent(title, text, url) {
        if (navigator.share) {
            navigator.share({
                title,
                text,
                url
            })
            .then(() => this.showToast('Shared successfully!', 'success'))
            .catch(error => console.log('Sharing cancelled:', error));
        } else {
            this.copyToClipboard(url);
        }
    }

    // Detect device type
    detectDevice() {
        const ua = navigator.userAgent;
        
        if (/Android/i.test(ua)) {
            return 'android';
        } else if (/iPad|iPhone|iPod/i.test(ua)) {
            return 'ios';
        } else if (/Windows Phone/i.test(ua)) {
            return 'windows-phone';
        } else if (/Mac/i.test(ua)) {
            return 'mac';
        } else if (/Windows/i.test(ua)) {
            return 'windows';
        } else if (/Linux/i.test(ua)) {
            return 'linux';
        } else {
            return 'unknown';
        }
    }

    // Check if touch device
    isTouchDevice() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }

    // Get browser name
    getBrowserName() {
        const ua = navigator.userAgent;
        
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("SamsungBrowser")) return "Samsung Internet";
        if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
        if (ua.includes("Trident") || ua.includes("MSIE")) return "Internet Explorer";
        if (ua.includes("Edge")) return "Edge";
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Safari")) return "Safari";
        
        return "Unknown";
    }

    // Save to localStorage with expiration
    setLocalStorage(key, value, expirationMinutes = 60) {
        const item = {
            value: value,
            expiry: Date.now() + (expirationMinutes * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    // Get from localStorage with expiration check
    getLocalStorage(key) {
        const itemStr = localStorage.getItem(key);
        
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    }

    // Clear expired localStorage items
    clearExpiredStorage() {
        Object.keys(localStorage).forEach(key => {
            const item = localStorage.getItem(key);
            
            try {
                const parsed = JSON.parse(item);
                if (parsed.expiry && Date.now() > parsed.expiry) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                // Not a JSON item, skip
            }
        });
    }

    // Create loading spinner
    createLoadingSpinner(size = 'md') {
        const sizes = {
            sm: '1.5rem',
            md: '3rem',
            lg: '5rem'
        };
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner" style="width: ${sizes[size] || sizes.md}; height: ${sizes[size] || sizes.md};">
                <div class="spinner-circle"></div>
            </div>
        `;
        
        return spinner;
    }

    // Animate element
    animateElement(element, animation, duration = 300) {
        element.style.animation = `${animation} ${duration}ms ease-out`;
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Scroll to element smoothly
    scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // Paginate array
    paginateArray(array, page = 1, perPage = 20) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return {
            data: array.slice(start, end),
            page,
            perPage,
            total: array.length,
            totalPages: Math.ceil(array.length / perPage)
        };
    }

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate URL
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Format date
    formatDate(date, format = 'relative') {
        const d = new Date(date);
        
        if (format === 'relative') {
            const now = new Date();
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays < 7) return `${diffDays} days ago`;
            
            return d.toLocaleDateString();
        }
        
        return d.toLocaleDateString();
    }

    // Parse query parameters
    parseQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }

    // Create query string from object
    createQueryString(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }

    // Update URL without reload
    updateUrl(params, replace = false) {
        const currentParams = this.parseQueryParams();
        const mergedParams = { ...currentParams, ...params };
        const queryString = this.createQueryString(mergedParams);
        const newUrl = `${window.location.pathname}?${queryString}`;
        
        if (replace) {
            window.history.replaceState({}, '', newUrl);
        } else {
            window.history.pushState({}, '', newUrl);
        }
    }

    // Check if offline
    isOffline() {
        return !navigator.onLine;
    }

    // Online/offline event handlers
    setupConnectionMonitor() {
        window.addEventListener('online', () => {
            this.showToast('You are back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('You are offline. Some features may not work.', 'warning');
        });
    }

    // Check for updates
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            
            try {
                await registration.update();
                
                if (registration.waiting) {
                    this.showToast('New version available! Reload to update.', 'info', 10000);
                }
            } catch (error) {
                console.error('Update check failed:', error);
            }
        }
    }
}

// Global utils instance
window.utils = new SilvaStreamUtils();

// Export for module usage
export { SilvaStreamUtils };

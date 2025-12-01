// SilvaStream Configuration
class Config {
    static API_CONFIG = {
        BASE_URL: 'https://movieapi.giftedtech.co.ke/api',
        ENDPOINTS: {
            SEARCH: '/search',
            MOVIE_INFO: '/info',
            DOWNLOAD_SOURCES: '/sources',
            TRENDING: '/trending',
            POPULAR: '/popular',
            UPCOMING: '/upcoming',
            SIMILAR: '/similar',
            CAST: '/cast',
            TRAILERS: '/trailers'
        },
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3,
        CACHE_TTL: 3600000 // 1 hour
    };

    static APP_CONFIG = {
        NAME: 'SilvaStream',
        VERSION: '2.0.0',
        THEME: {
            DEFAULT: 'dark',
            STORAGE_KEY: 'silvastream_theme'
        },
        USER: {
            STORAGE_KEY: 'silvastream_user',
            WATCH_HISTORY_KEY: 'silvastream_watch_history',
            MY_LIST_KEY: 'silvastream_my_list',
            RECOMMENDATIONS_KEY: 'silvastream_recommendations'
        },
        PLAYBACK: {
            DEFAULT_QUALITY: '720p',
            AUTO_PLAY_NEXT: true,
            AUTO_SKIP_INTRO: false,
            DEFAULT_SUBTITLES: 'en',
            PLAYBACK_SPEEDS: [0.5, 0.75, 1, 1.25, 1.5, 2]
        },
        PERFORMANCE: {
            LAZY_LOAD_THRESHOLD: 300,
            IMAGE_QUALITY: 'medium',
            PRELOAD_IMAGES: 5,
            CACHE_STRATEGY: 'stale-while-revalidate'
        },
        ANALYTICS: {
            ENABLED: true,
            TRACK_EVENTS: ['play', 'pause', 'complete', 'search', 'favorite']
        }
    };

    static UI_CONFIG = {
        BREAKPOINTS: {
            MOBILE: 768,
            TABLET: 1024,
            DESKTOP: 1280
        },
        ANIMATIONS: {
            ENABLED: true,
            DURATION: 300,
            EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        NOTIFICATIONS: {
            TIMEOUT: 5000,
            POSITION: 'top-right'
        },
        LOADING: {
            MINIMUM_DISPLAY_TIME: 500,
            SPINNER_TYPE: 'film'
        }
    };

    static CATEGORIES = [
        { 
            id: 'trending-now', 
            name: 'Trending Now', 
            query: 'trending',
            icon: 'fas fa-fire',
            color: '#e50914',
            viewAll: true
        },
        { 
            id: 'hollywood-movies', 
            name: 'Hollywood Movies', 
            query: 'hollywood',
            icon: 'fas fa-film',
            color: '#00a8ff',
            viewAll: true
        },
        { 
            id: 'teen-romance', 
            name: 'Teen Romance', 
            query: 'romance',
            icon: 'fas fa-heart',
            color: '#ff4d8d',
            viewAll: true
        },
        { 
            id: 'halloween-special', 
            name: 'Halloween Special', 
            query: 'horror',
            icon: 'fas fa-ghost',
            color: '#9d4edd',
            viewAll: true
        },
        { 
            id: 'nollywood', 
            name: 'Nollywood', 
            query: 'nollywood',
            icon: 'fas fa-globe-africa',
            color: '#00d95f',
            viewAll: true
        },
        { 
            id: 'sa-drama', 
            name: 'SA Drama', 
            query: 'drama',
            icon: 'fas fa-tv',
            color: '#ff6b35',
            viewAll: true
        },
        { 
            id: 'premium-vip', 
            name: 'Premium VIP HD', 
            query: 'marvel',
            icon: 'fas fa-crown',
            color: '#ffd700',
            viewAll: true
        },
        { 
            id: 'western-tv', 
            name: 'Western TV', 
            query: 'western',
            icon: 'fas fa-hat-cowboy',
            color: '#8b4513',
            viewAll: true
        },
        { 
            id: 'k-drama', 
            name: 'K-Drama', 
            query: 'korean',
            icon: 'fas fa-theater-masks',
            color: '#ff4d4d',
            viewAll: true
        },
        { 
            id: 'animated-film', 
            name: 'Animated Films', 
            query: 'animation',
            icon: 'fas fa-dragon',
            color: '#4cc9f0',
            viewAll: true
        },
        { 
            id: 'black-shows', 
            name: 'Black Shows', 
            query: 'black panther',
            icon: 'fas fa-users',
            color: '#000000',
            viewAll: true
        },
        { 
            id: 'action-movies', 
            name: 'Action Movies', 
            query: 'action',
            icon: 'fas fa-explosion',
            color: '#ff0000',
            viewAll: true
        },
        { 
            id: 'adventure-movies', 
            name: 'Adventure Movies', 
            query: 'adventure',
            icon: 'fas fa-mountain',
            color: '#00b894',
            viewAll: true
        },
        { 
            id: 'deadly-hunt', 
            name: 'Deadly Hunt', 
            query: 'hunt',
            icon: 'fas fa-bullseye',
            color: '#8b0000',
            viewAll: true
        },
        { 
            id: 'most-trending', 
            name: 'Most Trending', 
            query: 'popular',
            icon: 'fas fa-chart-line',
            color: '#9c88ff',
            viewAll: true
        }
    ];

    static WHATSAPP_CHANNELS = [
        {
            name: 'SilvaStream Main Channel',
            url: 'https://whatsapp.com/channel/0029VaAgJ8PAe5ViH81LR41u',
            description: 'Get daily movie recommendations, updates, and exclusive content',
            icon: 'fab fa-whatsapp',
            members: '10K+',
            category: 'Official'
        },
        {
            name: 'Silva Tech Nexus',
            url: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
            description: 'Behind the scenes, tech updates, and development insights',
            icon: 'fas fa-code',
            members: '5K+',
            category: 'Tech'
        }
    ];

    static FEATURES = {
        DARK_MODE: true,
        OFFLINE_SUPPORT: true,
        PUSH_NOTIFICATIONS: true,
        BACKGROUND_SYNC: true,
        PICTURE_IN_PICTURE: true,
        CAST_SUPPORT: true,
        DOWNLOAD_MANAGER: true,
        PARENTAL_CONTROLS: false,
        MULTI_PROFILES: true
    };

    static getApiUrl(endpoint, params = {}) {
        let url = `${this.API_CONFIG.BASE_URL}${endpoint}`;
        
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams(params);
            url += `?${queryParams.toString()}`;
        }
        
        return url;
    }

    static isMobile() {
        return window.innerWidth <= this.UI_CONFIG.BREAKPOINTS.MOBILE;
    }

    static isTablet() {
        const width = window.innerWidth;
        return width > this.UI_CONFIG.BREAKPOINTS.MOBILE && 
               width <= this.UI_CONFIG.BREAKPOINTS.TABLET;
    }

    static isDesktop() {
        return window.innerWidth > this.UI_CONFIG.BREAKPOINTS.TABLET;
    }

    static getImageQuality() {
        if (this.isMobile()) {
            return 'low';
        } else if (this.isTablet()) {
            return 'medium';
        }
        return 'high';
    }

    static getCategoryById(id) {
        return this.CATEGORIES.find(cat => cat.id === id);
    }

    static getDefaultUser() {
        return {
            id: 'guest_' + Date.now(),
            name: 'Guest',
            email: null,
            avatar: null,
            isVip: false,
            preferences: {
                theme: this.APP_CONFIG.THEME.DEFAULT,
                autoPlay: true,
                subtitles: 'en',
                quality: this.APP_CONFIG.PLAYBACK.DEFAULT_QUALITY
            },
            watchHistory: [],
            myList: [],
            recommendations: []
        };
    }

    static validate() {
        const errors = [];
        
        if (!this.API_CONFIG.BASE_URL) {
            errors.push('API base URL is not configured');
        }
        
        if (this.APP_CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD < 0) {
            errors.push('Lazy load threshold must be positive');
        }
        
        return errors;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}

// Configuration for SilvaStream
class Config {
    constructor() {
        this.apiEndpoints = {
            base: 'https://movieapi.giftedtech.co.ke/api',
            search: 'https://movieapi.giftedtech.co.ke/api/search/',
            info: 'https://movieapi.giftedtech.co.ke/api/info/',
            sources: 'https://movieapi.giftedtech.co.ke/api/sources/'
        };

        this.categories = [
            { id: 'trending-now', query: 'trending', icon: 'fas fa-fire', title: 'Trending Now' },
            { id: 'hollywood-movies', query: 'hollywood', icon: 'fas fa-film', title: 'Hollywood Movies' },
            { id: 'teen-romance', query: 'romance', icon: 'fas fa-heart', title: 'Teen Romance' },
            { id: 'halloween-special', query: 'horror', icon: 'fas fa-ghost', title: 'Halloween Special' },
            { id: 'nollywood', query: 'nollywood', icon: 'fas fa-globe-africa', title: 'Nollywood' },
            { id: 'sa-drama', query: 'drama', icon: 'fas fa-tv', title: 'SA Drama' },
            { id: 'premium-vip', query: 'marvel', icon: 'fas fa-crown', title: 'Premium VIP' },
            { id: 'western-tv', query: 'western', icon: 'fas fa-hat-cowboy', title: 'Western TV' },
            { id: 'k-drama', query: 'korean', icon: 'fas fa-theater-masks', title: 'K-Drama' },
            { id: 'animated-film', query: 'animation', icon: 'fas fa-dragon', title: 'Animated Films' },
            { id: 'black-shows', query: 'black panther', icon: 'fas fa-users', title: 'Black Shows' },
            { id: 'action-movies', query: 'action', icon: 'fas fa-explosion', title: 'Action Movies' },
            { id: 'adventure-movies', query: 'adventure', icon: 'fas fa-mountain', title: 'Adventure Movies' },
            { id: 'deadly-hunt', query: 'hunt', icon: 'fas fa-bullseye', title: 'Deadly Hunt' },
            { id: 'most-trending', query: 'popular', icon: 'fas fa-chart-line', title: 'Most Trending' }
        ];

        this.genres = [
            'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
            'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
            'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
            'Thriller', 'War', 'Western'
        ];

        this.qualities = ['360p', '480p', '720p', '1080p', '4K'];
        this.languages = ['English', 'Spanish', 'French', 'German', 'Hindi'];
        
        this.appConfig = {
            name: 'SilvaStream',
            version: '3.0.0',
            theme: 'dark',
            autoPlay: true,
            defaultQuality: '720p',
            maxWatchHistory: 1000,
            cacheDuration: 3600, // 1 hour in seconds
            apiRetryAttempts: 3
        };
    }

    getApiUrl(endpoint, params = {}) {
        let url = this.apiEndpoints[endpoint];
        if (params) {
            const queryParams = new URLSearchParams(params);
            url += '?' + queryParams.toString();
        }
        return url;
    }

    getCategoryById(id) {
        return this.categories.find(cat => cat.id === id);
    }

    getAllGenres() {
        return this.genres;
    }

    getAppConfig() {
        return this.appConfig;
    }

    updateConfig(key, value) {
        if (key in this.appConfig) {
            this.appConfig[key] = value;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    saveToStorage() {
        localStorage.setItem('silvastream_config', JSON.stringify(this.appConfig));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('silvastream_config');
        if (saved) {
            this.appConfig = { ...this.appConfig, ...JSON.parse(saved) };
        }
    }
}

// Global configuration instance
const CONFIG = new Config();
CONFIG.loadFromStorage();

export { CONFIG };

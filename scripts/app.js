// Main Application Class with Enhanced Features
class SilvaStreamApp {
    constructor() {
        this.api = movieAPI;
        this.cache = new CacheManager();
        this.auth = new AuthManager();
        this.ui = new UIManager();
        this.player = null;
        
        // State management
        this.state = {
            user: null,
            watchHistory: [],
            myList: [],
            recommendations: [],
            continueWatching: [],
            featuredContent: [],
            categories: [],
            isLoading: false,
            searchResults: [],
            currentCategory: null
        };
    }

    async init() {
        try {
            // Show loading overlay
            this.ui.showLoading();
            
            // Initialize components
            await this.initializeComponents();
            
            // Load user data
            await this.loadUserData();
            
            // Load initial content
            await this.loadInitialContent();
            
            // Initialize event listeners
            this.setupEventListeners();
            
            // Initialize sliders
            this.initializeSliders();
            
            // Check for updates
            this.checkForUpdates();
            
            // Hide loading overlay
            setTimeout(() => {
                this.ui.hideLoading();
            }, 1000);
            
            console.log('SilvaStream App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.ui.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    async initializeComponents() {
        // Initialize theme
        this.theme = new ThemeManager();
        await this.theme.init();
        
        // Initialize PWA
        this.pwa = new PWAHandler();
        await this.pwa.init();
        
        // Initialize notifications
        this.notifications = new NotificationManager();
        await this.notifications.init();
        
        // Initialize offline manager
        this.offlineManager = new OfflineManager();
        await this.offlineManager.init();
        
        // Initialize recommendation engine
        this.recommendationEngine = new RecommendationEngine();
    }

    async loadUserData() {
        try {
            // Load user from localStorage or create guest
            this.state.user = this.auth.getUser() || Config.getDefaultUser();
            
            // Load watch history
            this.state.watchHistory = this.cache.get('watchHistory') || [];
            
            // Load my list
            this.state.myList = this.cache.get('myList') || [];
            this.updateListCount();
            
            // Load recommendations
            this.state.recommendations = this.cache.get('recommendations') || [];
            
            // Update UI with user data
            this.updateUserUI();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async loadInitialContent() {
        try {
            // Load featured content for hero slider
            await this.loadFeaturedContent();
            
            // Load trending movies
            await this.loadTrendingMovies();
            
            // Load categories
            await this.loadCategories();
            
            // Load recommendations based on watch history
            if (this.state.watchHistory.length > 0) {
                await this.loadRecommendations();
            }
            
            // Load continue watching
            await this.loadContinueWatching();
            
        } catch (error) {
            console.error('Failed to load initial content:', error);
            this.ui.showError('Failed to load content. Please check your connection.');
        }
    }

    async loadFeaturedContent() {
        try {
            const data = await this.api.getTrendingMovies('all', 10);
            
            if (data && data.results && data.results.items) {
                this.state.featuredContent = data.results.items.slice(0, 5);
                this.renderFeaturedSlider();
            }
        } catch (error) {
            console.error('Failed to load featured content:', error);
            // Fallback to cached content
            const cached = this.cache.get('featuredContent');
            if (cached) {
                this.state.featuredContent = cached;
                this.renderFeaturedSlider();
            }
        }
    }

    async loadTrendingMovies() {
        try {
            const data = await this.api.getTrendingMovies('all', 20);
            
            if (data && data.results && data.results.items) {
                this.renderTrendingSlider(data.results.items.slice(0, 10));
                
                // Cache the data
                this.cache.set('trendingMovies', data.results.items, 1800000); // 30 minutes
            }
        } catch (error) {
            console.error('Failed to load trending movies:', error);
            // Try cached data
            const cached = this.cache.get('trendingMovies');
            if (cached) {
                this.renderTrendingSlider(cached.slice(0, 10));
            }
        }
    }

    async loadCategories() {
        try {
            const categoryGrid = document.getElementById('categoryGrid');
            if (!categoryGrid) return;
            
            // Clear existing content
            categoryGrid.innerHTML = '';
            
            // Load each category
            const categoryPromises = Config.CATEGORIES.map(async (category) => {
                try {
                    const data = await this.api.searchMovies(category.query, { limit: 8 });
                    
                    if (data && data.results && data.results.items) {
                        return {
                            ...category,
                            items: data.results.items.slice(0, 8)
                        };
                    }
                } catch (error) {
                    console.error(`Failed to load ${category.name}:`, error);
                    return {
                        ...category,
                        items: []
                    };
                }
            });
            
            const categoriesWithData = await Promise.all(categoryPromises);
            this.state.categories = categoriesWithData;
            
            // Render categories
            categoriesWithData.forEach((category, index) => {
                if (category.items && category.items.length > 0) {
                    this.renderCategory(category, index);
                }
            });
            
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadRecommendations() {
        if (this.state.watchHistory.length === 0) return;
        
        try {
            // Get genres from watch history
            const watchedGenres = this.getWatchedGenres();
            
            if (watchedGenres.length > 0) {
                const genre = watchedGenres[0]; // Use most watched genre
                const data = await this.api.searchMovies(genre, { limit: 10 });
                
                if (data && data.results && data.results.items) {
                    this.state.recommendations = data.results.items;
                    this.renderRecommendations();
                    
                    // Cache recommendations
                    this.cache.set('recommendations', this.state.recommendations, 3600000);
                }
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
    }

    async loadContinueWatching() {
        if (this.state.watchHistory.length === 0) return;
        
        try {
            // Get last 5 watched items
            const continueWatching = this.state.watchHistory
                .slice(-5)
                .reverse();
            
            this.state.continueWatching = continueWatching;
            
            if (continueWatching.length > 0) {
                this.renderContinueWatching();
                document.getElementById('continueWatchingSection').style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load continue watching:', error);
        }
    }

    // Render Methods
    renderFeaturedSlider() {
        const slidesContainer = document.getElementById('featuredSlides');
        if (!slidesContainer) return;
        
        slidesContainer.innerHTML = this.state.featuredContent.map((item, index) => {
            const isActive = index === 0 ? 'is-active' : '';
            const posterUrl = this.api.getOptimizedImageUrl(item.cover?.url, 'large');
            
            return `
                <li class="splide__slide ${isActive}">
                    <div class="slide-content">
                        <img src="${posterUrl}" 
                             alt="${item.title}"
                             class="slide-image"
                             loading="${index === 0 ? 'eager' : 'lazy'}">
                        <div class="slide-overlay">
                            <div class="slide-info">
                                <h2 class="slide-title">${item.title}</h2>
                                <div class="slide-meta">
                                    <span>${item.year || 'N/A'}</span>
                                    <span>•</span>
                                    <span>${MovieAPI.isSeries(item) ? 'Series' : 'Movie'}</span>
                                    <span>•</span>
                                    <span><i class="fas fa-star"></i> ${item.imdbRatingValue || 'N/A'}</span>
                                </div>
                                <p class="slide-description">${item.description?.substring(0, 150) || ''}...</p>
                                <div class="slide-actions">
                                    <button class="btn btn-primary watch-now" data-id="${item.subjectId}" data-type="${MovieAPI.isSeries(item) ? 'series' : 'movie'}">
                                        <i class="fas fa-play"></i> Watch Now
                                    </button>
                                    <button class="btn btn-outline add-to-list" data-id="${item.subjectId}">
                                        <i class="fas fa-plus"></i> Add to List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
        
        // Initialize slider
        this.initializeMainSlider();
    }

    renderTrendingSlider(items) {
        const trendingList = document.getElementById('trendingList');
        if (!trendingList) return;
        
        trendingList.innerHTML = items.map(item => {
            const posterUrl = this.api.getOptimizedImageUrl(item.cover?.url, 'medium');
            const isInList = this.isInMyList(item.subjectId);
            
            return `
                <div class="splide__slide">
                    <div class="movie-card">
                        <div class="movie-poster-container">
                            <img src="${posterUrl}" 
                                 alt="${item.title}"
                                 class="movie-poster"
                                 loading="lazy">
                            <div class="movie-overlay">
                                <button class="play-btn" data-id="${item.subjectId}" data-type="${MovieAPI.isSeries(item) ? 'series' : 'movie'}">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="list-btn ${isInList ? 'in-list' : ''}" data-id="${item.subjectId}">
                                    <i class="fas ${isInList ? 'fa-check' : 'fa-plus'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">${item.title}</h3>
                            <div class="movie-meta">
                                <span>${item.year || 'N/A'}</span>
                                <span>•</span>
                                <span>${MovieAPI.isSeries(item) ? 'Series' : 'Movie'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize slider
        this.initializeTrendingSlider();
    }

    renderCategory(category, delayIndex) {
        const categoryGrid = document.getElementById('categoryGrid');
        if (!categoryGrid) return;
        
        const categoryElement = document.createElement('section');
        categoryElement.className = 'section-slider animate-slide-up';
        categoryElement.style.animationDelay = `${delayIndex * 0.1}s`;
        
        categoryElement.innerHTML = `
            <div class="section-header">
                <div class="section-title">
                    <i class="${category.icon}" style="color: ${category.color}"></i>
                    <h2>${category.name}</h2>
                </div>
                ${category.viewAll ? `
                    <a href="category.html?type=${category.id}" class="view-all">
                        View All
                        <i class="fas fa-arrow-right"></i>
                    </a>
                ` : ''}
            </div>
            <div class="category-items">
                ${category.items.map(item => {
                    const posterUrl = this.api.getOptimizedImageUrl(item.cover?.url, 'small');
                    const isInList = this.isInMyList(item.subjectId);
                    
                    return `
                        <div class="category-item" data-id="${item.subjectId}" data-type="${MovieAPI.isSeries(item) ? 'series' : 'movie'}">
                            <div class="item-poster">
                                <img src="${posterUrl}" 
                                     alt="${item.title}"
                                     loading="lazy">
                                <div class="item-overlay">
                                    <button class="play-btn" data-id="${item.subjectId}">
                                        <i class="fas fa-play"></i>
                                    </button>
                                    <button class="list-btn ${isInList ? 'in-list' : ''}" data-id="${item.subjectId}">
                                        <i class="fas ${isInList ? 'fa-check' : 'fa-plus'}"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="item-info">
                                <h4 class="item-title">${item.title}</h4>
                                <div class="item-meta">
                                    <span>${item.year || 'N/A'}</span>
                                    <span>•</span>
                                    <span><i class="fas fa-star"></i> ${item.imdbRatingValue || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        categoryGrid.appendChild(categoryElement);
    }

    renderRecommendations() {
        const recommendationsList = document.getElementById('recommendationsList');
        if (!recommendationsList || this.state.recommendations.length === 0) return;
        
        recommendationsList.innerHTML = this.state.recommendations.slice(0, 10).map(item => {
            const posterUrl = this.api.getOptimizedImageUrl(item.cover?.url, 'medium');
            const isInList = this.isInMyList(item.subjectId);
            
            return `
                <div class="splide__slide">
                    <div class="movie-card">
                        <div class="movie-poster-container">
                            <img src="${posterUrl}" 
                                 alt="${item.title}"
                                 class="movie-poster"
                                 loading="lazy">
                            <div class="movie-overlay">
                                <button class="play-btn" data-id="${item.subjectId}" data-type="${MovieAPI.isSeries(item) ? 'series' : 'movie'}">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="list-btn ${isInList ? 'in-list' : ''}" data-id="${item.subjectId}">
                                    <i class="fas ${isInList ? 'fa-check' : 'fa-plus'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">${item.title}</h3>
                            <div class="movie-meta">
                                <span><i class="fas fa-thumbs-up"></i> Recommended</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize slider
        this.initializeRecommendationsSlider();
    }

    renderContinueWatching() {
        const continueList = document.getElementById('continueList');
        if (!continueList) return;
        
        continueList.innerHTML = this.state.continueWatching.map(item => {
            const posterUrl = this.api.getOptimizedImageUrl(item.poster, 'medium');
            const progress = item.progress || 0;
            const progressPercent = Math.min(progress * 100, 100);
            
            return `
                <div class="splide__slide">
                    <div class="continue-card">
                        <div class="continue-poster">
                            <img src="${posterUrl}" 
                                 alt="${item.title}"
                                 loading="lazy">
                            <div class="continue-progress">
                                <div class="progress-bar" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="continue-overlay">
                                <button class="play-btn" data-id="${item.id}" data-type="${item.type}" data-resume="true">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                        <div class="continue-info">
                            <h4 class="continue-title">${item.title}</h4>
                            <div class="continue-meta">
                                <span>Continue from ${Math.round(progress * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize slider
        this.initializeContinueSlider();
    }

    // Slider Initialization
    initializeMainSlider() {
        const mainSlider = new Splide('#mainSlider', {
            type: 'fade',
            rewind: true,
            pagination: false,
            arrows: true,
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            pauseOnFocus: true,
            speed: 1000,
            classes: {
                arrows: 'splide__arrows slider-arrows',
                arrow: 'splide__arrow slider-arrow',
                prev: 'splide__arrow--prev slider-prev',
                next: 'splide__arrow--next slider-next',
            }
        });
        
        mainSlider.mount();
        
        // Add progress bar
        mainSlider.on('mounted move', () => {
            const bar = mainSlider.root.querySelector('.splide__progress__bar');
            if (bar) {
                bar.style.width = `${(mainSlider.index + 1) / mainSlider.length * 100}%`;
            }
        });
    }

    initializeTrendingSlider() {
        new Splide('#trendingSlider', {
            type: 'slide',
            perPage: 5,
            perMove: 1,
            gap: '20px',
            pagination: false,
            arrows: true,
            breakpoints: {
                1024: { perPage: 4 },
                768: { perPage: 3 },
                480: { perPage: 2 }
            }
        }).mount();
    }

    initializeRecommendationsSlider() {
        new Splide('#recommendationsSlider', {
            type: 'slide',
            perPage: 5,
            perMove: 1,
            gap: '20px',
            pagination: false,
            arrows: true,
            breakpoints: {
                1024: { perPage: 4 },
                768: { perPage: 3 },
                480: { perPage: 2 }
            }
        }).mount();
    }

    initializeContinueSlider() {
        new Splide('#continueSlider', {
            type: 'slide',
            perPage: 5,
            perMove: 1,
            gap: '20px',
            pagination: false,
            arrows: true,
            breakpoints: {
                1024: { perPage: 4 },
                768: { perPage: 3 },
                480: { perPage: 2 }
            }
        }).mount();
    }

    initializeSliders() {
        // Initialize any other sliders
        const sliders = document.querySelectorAll('.splide:not([id])');
        sliders.forEach(slider => {
            new Splide(slider, {
                type: 'slide',
                perPage: 4,
                perMove: 1,
                gap: '15px',
                pagination: false,
                arrows: false,
                breakpoints: {
                    768: { perPage: 3 },
                    480: { perPage: 2 }
                }
            }).mount();
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Play buttons
        document.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.play-btn, .watch-now');
            if (playBtn) {
                const id = playBtn.dataset.id;
                const type = playBtn.dataset.type || 'movie';
                const resume = playBtn.dataset.resume === 'true';
                
                if (resume) {
                    this.resumeWatching(id, type);
                } else {
                    this.playContent(id, type);
                }
            }
            
            // Add to list buttons
            const listBtn = e.target.closest('.list-btn, .add-to-list');
            if (listBtn) {
                const id = listBtn.dataset.id;
                this.toggleMyList(id);
            }
            
            // Category items
            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                const id = categoryItem.dataset.id;
                const type = categoryItem.dataset.type || 'movie';
                this.viewDetails(id, type);
            }
        });
        
        // Start watching button
        const startWatchingBtn = document.getElementById('startWatching');
        if (startWatchingBtn) {
            startWatchingBtn.addEventListener('click', () => {
                if (this.state.featuredContent.length > 0) {
                    const firstItem = this.state.featuredContent[0];
                    this.playContent(firstItem.subjectId, MovieAPI.isSeries(firstItem) ? 'series' : 'movie');
                }
            });
        }
        
        // Search trigger
        const searchTriggers = document.querySelectorAll('.search-trigger');
        searchTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'search.html';
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Scroll events for navbar
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.main-nav');
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // Core Methods
    async playContent(id, type = 'movie') {
        try {
            // Add to watch history
            this.addToWatchHistory(id, type);
            
            // Redirect to player
            window.location.href = `player.html?id=${id}&type=${type}`;
        } catch (error) {
            console.error('Failed to play content:', error);
            this.ui.showError('Failed to play content. Please try again.');
        }
    }

    async resumeWatching(id, type) {
        try {
            const historyItem = this.state.watchHistory.find(item => item.id === id);
            if (historyItem && historyItem.progress) {
                window.location.href = `player.html?id=${id}&type=${type}&time=${historyItem.time}`;
            } else {
                this.playContent(id, type);
            }
        } catch (error) {
            console.error('Failed to resume watching:', error);
            this.ui.showError('Failed to resume playback.');
        }
    }

    async viewDetails(id, type = 'movie') {
        try {
            const page = type === 'series' ? 'series-details' : 'movie-details';
            window.location.href = `${page}.html?id=${id}`;
        } catch (error) {
            console.error('Failed to view details:', error);
        }
    }

    async toggleMyList(id) {
        try {
            const index = this.state.myList.findIndex(item => item.id === id);
            
            if (index === -1) {
                // Add to list
                const item = await this.getContentInfo(id);
                if (item) {
                    this.state.myList.push({
                        id: id,
                        title: item.title,
                        poster: item.cover?.url,
                        type: MovieAPI.isSeries(item) ? 'series' : 'movie',
                        addedAt: new Date().toISOString()
                    });
                    
                    this.ui.showNotification('Added to My List', 'success');
                }
            } else {
                // Remove from list
                this.state.myList.splice(index, 1);
                this.ui.showNotification('Removed from My List', 'info');
            }
            
            // Update cache
            this.cache.set('myList', this.state.myList);
            
            // Update UI
            this.updateListCount();
            this.updateListButtons(id);
            
        } catch (error) {
            console.error('Failed to toggle my list:', error);
            this.ui.showError('Failed to update My List.');
        }
    }

    async getContentInfo(id) {
        try {
            // Check cache first
            const cached = this.cache.get(`content_${id}`);
            if (cached) return cached;
            
            // Fetch from API
            const data = await this.api.getMovieInfo(id);
            if (data && data.results && data.results.subject) {
                this.cache.set(`content_${id}`, data.results.subject, 3600000);
                return data.results.subject;
            }
        } catch (error) {
            console.error('Failed to get content info:', error);
        }
        return null;
    }

    addToWatchHistory(id, type, time = 0, duration = 0) {
        const progress = duration > 0 ? time / duration : 0;
        
        // Remove existing entry if exists
        this.state.watchHistory = this.state.watchHistory.filter(item => item.id !== id);
        
        // Add new entry
        this.state.watchHistory.push({
            id: id,
            type: type,
            time: time,
            duration: duration,
            progress: progress,
            watchedAt: new Date().toISOString()
        });
        
        // Keep only last 50 items
        if (this.state.watchHistory.length > 50) {
            this.state.watchHistory = this.state.watchHistory.slice(-50);
        }
        
        // Update cache
        this.cache.set('watchHistory', this.state.watchHistory);
        
        // Update recommendations
        this.updateRecommendations();
    }

    // Utility Methods
    isInMyList(id) {
        return this.state.myList.some(item => item.id === id);
    }

    updateListCount() {
        const count = this.state.myList.length;
        
        // Update desktop counter
        const listCount = document.getElementById('listCount');
        if (listCount) {
            listCount.textContent = count;
            listCount.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        
        // Update mobile counter
        const mobileListCount = document.getElementById('mobileListCount');
        if (mobileListCount) {
            mobileListCount.textContent = count;
            mobileListCount.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }

    updateListButtons(id) {
        const isInList = this.isInMyList(id);
        
        // Update all list buttons for this item
        const listButtons = document.querySelectorAll(`[data-id="${id}"]`);
        listButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isInList ? 'fas fa-check' : 'fas fa-plus';
            }
            btn.classList.toggle('in-list', isInList);
        });
    }

    updateUserUI() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) {
            userName.textContent = this.state.user.name;
        }
        
        if (userAvatar) {
            if (this.state.user.avatar) {
                userAvatar.innerHTML = `<img src="${this.state.user.avatar}" alt="${this.state.user.name}">`;
            } else {
                userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
            }
        }
    }

    getWatchedGenres() {
        const genreCount = {};
        
        this.state.watchHistory.forEach(item => {
            if (item.genres) {
                item.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            }
        });
        
        return Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .map(([genre]) => genre);
    }

    updateRecommendations() {
        // In a real app, this would call an API or use ML
        // For now, we'll just reload recommendations
        this.loadRecommendations();
    }

    toggleMobileMenu() {
        const mobileNav = document.getElementById('mobileNav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        mobileNav.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    }

    async logout() {
        try {
            // Clear user data
            this.auth.logout();
            this.cache.clear();
            
            // Redirect to home
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    checkForUpdates() {
        // Check for app updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update();
                }
            });
        }
        
        // Check for content updates every 5 minutes
        setInterval(() => {
            this.loadFeaturedContent();
        }, 300000);
    }

    // Performance optimization
    prefetchContent() {
        // Prefetch likely next pages
        if (this.state.watchHistory.length > 0) {
            const lastWatched = this.state.watchHistory[this.state.watchHistory.length - 1];
            this.api.prefetch(Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.MOVIE_INFO}/${lastWatched.id}`));
        }
    }

    // Analytics
    trackEvent(event, data = {}) {
        if (!Config.APP_CONFIG.ANALYTICS.ENABLED) return;
        
        const analyticsData = {
            event,
            userId: this.state.user.id,
            timestamp: new Date().toISOString(),
            ...data
        };
        
        // In a real app, send to analytics server
        console.log('Analytics Event:', analyticsData);
        
        // Store locally for offline sync
        this.cache.append('analytics_events', analyticsData);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SilvaStreamApp();
    window.app.init();
});

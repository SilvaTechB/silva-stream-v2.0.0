class SilvaStreamApp {
    constructor() {
        this.init();
    }

    async init() {
        this.setupDOM();
        this.setupEventListeners();
        this.initializeServices();
        await this.preloadAssets();
        this.initializeApp();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            loadingProgress: document.getElementById('loadingProgress'),
            themeToggle: document.getElementById('themeToggle'),
            mobileMenuBtn: document.getElementById('mobileMenuBtn'),
            mainNav: document.getElementById('mainNav'),
            searchTrigger: document.getElementById('searchTrigger'),
            searchOverlay: document.getElementById('searchOverlay'),
            globalSearch: document.getElementById('globalSearch'),
            clearSearch: document.getElementById('clearSearch'),
            closeSearch: document.getElementById('closeSearch'),
            searchResults: document.getElementById('searchResults'),
            notificationBtn: document.getElementById('notificationBtn'),
            profileBtn: document.getElementById('profileBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            exploreBtn: document.getElementById('exploreBtn'),
            ctaSignup: document.getElementById('ctaSignup'),
            ctaPlans: document.getElementById('ctaPlans'),
            aiRecommendations: document.getElementById('aiRecommendations'),
            heroSwiper: document.querySelector('.heroSwiper')
        };

        this.state = {
            isLoading: true,
            searchActive: false,
            userLoggedIn: false,
            currentTheme: 'dark',
            watchHistory: [],
            watchlist: []
        };
    }

    setupEventListeners() {
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Mobile menu
        this.elements.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());

        // Search functionality
        this.elements.searchTrigger.addEventListener('click', () => this.openSearch());
        this.elements.closeSearch.addEventListener('click', () => this.closeSearch());
        this.elements.clearSearch.addEventListener('click', () => this.clearSearch());
        this.elements.globalSearch.addEventListener('input', (e) => this.handleSearchInput(e));

        // User interactions
        this.elements.exploreBtn.addEventListener('click', () => this.exploreContent());
        this.elements.ctaSignup.addEventListener('click', () => this.showSignupModal());
        this.elements.ctaPlans.addEventListener('click', () => this.showPlansModal());
        this.elements.logoutBtn.addEventListener('click', () => this.logout());

        // Notification and profile dropdowns
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll());

        // Wave effects
        this.initWaveEffects();

        // Swipe gestures for mobile
        this.initSwipeGestures();
    }

    initializeServices() {
        // Initialize AOS (Animate On Scroll)
        AOS.init({
            duration: 800,
            offset: 100,
            once: true,
            easing: 'ease-out-cubic'
        });

        // Initialize Typed.js
        this.initTypedText();

        // Initialize Swiper
        this.initHeroSwiper();

        // Initialize service worker
        this.initServiceWorker();

        // Initialize analytics
        this.initAnalytics();

        // Initialize cache
        CacheManager.init();
    }

    async preloadAssets() {
        const assets = [
            'assets/logo.svg',
            'assets/default-avatar.jpg',
            'styles/main.css',
            'styles/components.css'
        ];

        let loaded = 0;
        const total = assets.length;

        for (const asset of assets) {
            try {
                await this.preloadAsset(asset);
                loaded++;
                this.updateLoadingProgress((loaded / total) * 100);
            } catch (error) {
                console.warn(`Failed to preload ${asset}:`, error);
            }
        }
    }

    async preloadAsset(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            
            if (url.endsWith('.css')) {
                link.as = 'style';
                link.onload = resolve;
                link.onerror = reject;
                link.href = url;
                document.head.appendChild(link);
            } else if (url.endsWith('.js')) {
                link.as = 'script';
                link.onload = resolve;
                link.onerror = reject;
                link.href = url;
                document.head.appendChild(link);
            } else {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            }
        });
    }

    updateLoadingProgress(percentage) {
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = `${percentage}%`;
        }
    }

    async initializeApp() {
        try {
            // Load user data
            await this.loadUserData();

            // Load initial content
            await Promise.all([
                this.loadHeroSlider(),
                this.loadAIRecommendations(),
                this.loadTrendingContent(),
                this.loadNotifications()
            ]);

            // Initialize lazy loading
            this.initLazyLoading();

            // Start background sync
            this.startBackgroundSync();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Unable to load app content. Please refresh.');
        } finally {
            this.hideLoadingScreen();
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-theme');
        this.state.currentTheme = isDark ? 'dark' : 'light';
        
        // Save theme preference
        localStorage.setItem('theme', this.state.currentTheme);
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.state.currentTheme }
        }));
    }

    toggleMobileMenu() {
        this.elements.mainNav.classList.toggle('active');
        this.elements.mobileMenuBtn.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }

    openSearch() {
        this.elements.searchOverlay.classList.add('active');
        this.elements.globalSearch.focus();
        document.body.classList.add('search-open');
        this.state.searchActive = true;
    }

    closeSearch() {
        this.elements.searchOverlay.classList.remove('active');
        document.body.classList.remove('search-open');
        this.state.searchActive = false;
    }

    clearSearch() {
        this.elements.globalSearch.value = '';
        this.elements.searchResults.innerHTML = '';
    }

    async handleSearchInput(event) {
        const query = event.target.value.trim();
        
        if (query.length < 2) {
            this.showSearchSuggestions();
            return;
        }

        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            await this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        try {
            this.showSearchLoading();
            
            const results = await MovieAPI.searchMovies(query);
            
            if (results && results.results && results.results.items) {
                this.displaySearchResults(results.results.items, query);
                
                // Cache search results
                CacheManager.set(`search_${query}`, results, 300); // 5 minutes
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError();
        }
    }

    displaySearchResults(items, query) {
        const container = this.elements.searchResults.querySelector('.results-container');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>No results found for "${query}"</h4>
                    <p>Try different keywords or browse categories</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.slice(0, 10).map(item => {
            const isMovie = MovieAPI.isMovie(item);
            const type = isMovie ? 'movie' : 'series';
            const year = item.year || 'N/A';
            const rating = item.imdbRatingValue ? `${item.imdbRatingValue}/10` : 'N/A';

            return `
                <a href="${type}-details.html?id=${item.subjectId}" class="search-result-item">
                    <div class="result-poster">
                        <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${item.title}"
                             loading="lazy">
                        <span class="result-type">${type.toUpperCase()}</span>
                    </div>
                    <div class="result-info">
                        <h4 class="result-title">${item.title}</h4>
                        <div class="result-meta">
                            <span>${year}</span>
                            <span>•</span>
                            <span><i class="fas fa-star"></i> ${rating}</span>
                        </div>
                        <p class="result-description">${item.description?.substring(0, 100) || 'No description available.'}...</p>
                    </div>
                </a>
            `;
        }).join('');

        // Add view all results link
        if (items.length > 10) {
            container.innerHTML += `
                <div class="view-all-results">
                    <a href="search.html?q=${encodeURIComponent(query)}" class="view-all-link">
                        View all ${items.length} results
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
        }
    }

    initTypedText() {
        if (document.getElementById('typedText')) {
            new Typed('#typedText', {
                strings: [
                    'Movies in 4K',
                    'TV Shows & Series',
                    'Live Sports',
                    'Exclusive Content',
                    'Anytime, Anywhere'
                ],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        }
    }

    initHeroSwiper() {
        if (this.elements.heroSwiper) {
            this.swiper = new Swiper('.heroSwiper', {
                direction: 'horizontal',
                loop: true,
                speed: 800,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                breakpoints: {
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 10
                    },
                    768: {
                        slidesPerView: 1,
                        spaceBetween: 20
                    },
                    1024: {
                        slidesPerView: 1,
                        spaceBetween: 30
                    }
                }
            });
        }
    }

    async loadHeroSlider() {
        try {
            // Try to get from cache first
            const cached = CacheManager.get('hero_slider');
            if (cached) {
                this.populateHeroSlider(cached);
                return;
            }

            // Fetch from API
            const trending = await MovieAPI.searchMovies('trending');
            if (trending?.results?.items) {
                const items = trending.results.items.slice(0, 5);
                
                // Cache for 1 hour
                CacheManager.set('hero_slider', items, 3600);
                
                this.populateHeroSlider(items);
            }
        } catch (error) {
            console.error('Failed to load hero slider:', error);
        }
    }

    populateHeroSlider(items) {
        if (!this.swiper || !items) return;

        const wrapper = this.swiper.wrapperEl;
        wrapper.innerHTML = '';

        items.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            const backdrop = item.backdrop?.url || item.cover?.url || 'assets/hero-default.jpg';
            
            slide.innerHTML = `
                <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${backdrop}')">
                    <div class="slide-content">
                        <div class="slide-badge">
                            <span>${MovieAPI.isMovie(item) ? 'MOVIE' : 'SERIES'}</span>
                            <span>HD</span>
                            ${item.imdbRatingValue ? `<span><i class="fas fa-star"></i> ${item.imdbRatingValue}</span>` : ''}
                        </div>
                        <h2 class="slide-title">${item.title}</h2>
                        <p class="slide-description">${item.description?.substring(0, 150) || 'Watch now on SilvaStream'}...</p>
                        <div class="slide-actions">
                            <button class="btn btn-primary watch-now" data-id="${item.subjectId}" data-type="${MovieAPI.isMovie(item) ? 'movie' : 'series'}">
                                <i class="fas fa-play"></i>
                                Watch Now
                            </button>
                            <button class="btn btn-outline more-info" data-id="${item.subjectId}">
                                <i class="fas fa-info-circle"></i>
                                More Info
                            </button>
                        </div>
                    </div>
                </div>
            `;

            wrapper.appendChild(slide);
        });

        // Add event listeners to buttons
        setTimeout(() => {
            wrapper.querySelectorAll('.watch-now').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.watch-now').dataset.id;
                    const type = e.target.closest('.watch-now').dataset.type;
                    window.location.href = `playback.html?id=${id}&type=${type}`;
                });
            });

            wrapper.querySelectorAll('.more-info').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.more-info').dataset.id;
                    const type = MovieAPI.isMovie(items.find(i => i.subjectId === id)) ? 'movie' : 'series';
                    window.location.href = `${type}-details.html?id=${id}`;
                });
            });
        }, 100);

        this.swiper.update();
    }

    async loadAIRecommendations() {
        try {
            // Get user's watch history for personalized recommendations
            const history = this.state.watchHistory;
            let recommendations = [];

            if (history.length > 0) {
                // Get recommendations based on watch history
                const lastWatched = history[history.length - 1];
                recommendations = await MovieAPI.getSimilarContent(lastWatched.id);
            } else {
                // Fallback to trending
                const trending = await MovieAPI.searchMovies('trending');
                recommendations = trending?.results?.items?.slice(0, 8) || [];
            }

            this.displayAIRecommendations(recommendations);
        } catch (error) {
            console.error('Failed to load AI recommendations:', error);
        }
    }

    displayAIRecommendations(items) {
        if (!this.elements.aiRecommendations || !items) return;

        this.elements.aiRecommendations.innerHTML = items.slice(0, 8).map(item => {
            const isMovie = MovieAPI.isMovie(item);
            const type = isMovie ? 'movie' : 'series';
            const year = item.year || 'N/A';
            const rating = item.imdbRatingValue ? item.imdbRatingValue : 'N/A';

            return `
                <div class="movie-card" data-id="${item.subjectId}" data-type="${type}">
                    <div class="card-badge">AI PICK</div>
                    <div class="movie-poster">
                        <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${item.title}"
                             loading="lazy"
                             class="lazy-image">
                        <div class="poster-overlay">
                            <button class="play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="bookmark-btn">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${item.title}</h3>
                        <div class="movie-meta">
                            <span>${year}</span>
                            <span>•</span>
                            <span><i class="fas fa-star"></i> ${rating}</span>
                            <span>•</span>
                            <span>${type}</span>
                        </div>
                        <p class="movie-description">${item.description?.substring(0, 80) || 'Watch now on SilvaStream'}...</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        this.addCardEventListeners();
    }

    async loadTrendingContent() {
        const categories = [
            { id: 'trending-now', query: 'trending' },
            { id: 'hollywood-movies', query: 'hollywood' },
            { id: 'teen-romance', query: 'romance' },
            { id: 'halloween-special', query: 'horror' },
            { id: 'nollywood', query: 'nollywood' },
            { id: 'premium-vip', query: 'marvel' },
            { id: 'k-drama', query: 'korean' }
        ];

        // Load in parallel with concurrency limit
        const batchSize = 2;
        for (let i = 0; i < categories.length; i += batchSize) {
            const batch = categories.slice(i, i + batchSize);
            await Promise.all(batch.map(async (category) => {
                await this.loadCategory(category.id, category.query);
            }));
        }
    }

    async loadCategory(containerId, query) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Show skeleton loading
            container.innerHTML = this.getSkeletonCards(6);

            // Try cache first
            const cacheKey = `category_${query}`;
            const cached = CacheManager.get(cacheKey);
            
            if (cached) {
                this.populateCategory(containerId, cached);
                return;
            }

            // Fetch from API
            const results = await MovieAPI.searchMovies(query);
            if (results?.results?.items) {
                const items = results.results.items.slice(0, 12);
                
                // Cache for 30 minutes
                CacheManager.set(cacheKey, items, 1800);
                
                this.populateCategory(containerId, items);
            }
        } catch (error) {
            console.error(`Failed to load ${containerId}:`, error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load content</p>
                    </div>
                `;
            }
        }
    }

    populateCategory(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container || !items) return;

        container.innerHTML = items.map(item => {
            const isMovie = MovieAPI.isMovie(item);
            const type = isMovie ? 'movie' : 'series';
            const year = item.year || 'N/A';

            return `
                <div class="movie-card" data-id="${item.subjectId}" data-type="${type}">
                    <div class="movie-poster">
                        <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${item.title}"
                             loading="lazy"
                             class="lazy-image">
                        <div class="poster-overlay">
                            <button class="play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="bookmark-btn">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                        <div class="card-type">${type.toUpperCase()}</div>
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${item.title}</h3>
                        <div class="movie-meta">
                            <span>${year}</span>
                            <span>${item.imdbRatingValue ? `<i class="fas fa-star"></i> ${item.imdbRatingValue}` : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        this.addCardEventListeners();
    }

    addCardEventListeners() {
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicked on buttons inside
                if (e.target.closest('.play-btn') || e.target.closest('.bookmark-btn')) {
                    return;
                }

                const id = card.dataset.id;
                const type = card.dataset.type;
                window.location.href = `${type}-details.html?id=${id}`;
            });

            // Play button
            const playBtn = card.querySelector('.play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = card.dataset.id;
                    const type = card.dataset.type;
                    window.location.href = `playback.html?id=${id}&type=${type}`;
                });
            }

            // Bookmark button
            const bookmarkBtn = card.querySelector('.bookmark-btn');
            if (bookmarkBtn) {
                bookmarkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBookmark(card);
                });
            }
        });
    }

    toggleBookmark(card) {
        const id = card.dataset.id;
        const type = card.dataset.type;
        const title = card.querySelector('.movie-title').textContent;
        
        const bookmarkBtn = card.querySelector('.bookmark-btn');
        const isBookmarked = bookmarkBtn.classList.contains('bookmarked');
        
        if (isBookmarked) {
            // Remove from watchlist
            bookmarkBtn.classList.remove('bookmarked');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            this.removeFromWatchlist(id);
            this.showToast('Removed from watchlist');
        } else {
            // Add to watchlist
            bookmarkBtn.classList.add('bookmarked');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            this.addToWatchlist({ id, type, title });
            this.showToast('Added to watchlist');
        }
    }

    async loadUserData() {
        try {
            // Check if user is logged in
            const token = localStorage.getItem('auth_token');
            if (token) {
                this.state.userLoggedIn = true;
                
                // Load user profile
                const userData = await Auth.getUserProfile();
                if (userData) {
                    this.updateUserProfile(userData);
                }

                // Load watch history and watchlist
                this.state.watchHistory = JSON.parse(localStorage.getItem('watch_history') || '[]');
                this.state.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateUserProfile(userData) {
        // Update UI with user data
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = userData.name || 'User';
        if (userAvatar && userData.avatar) {
            userAvatar.src = userData.avatar;
        }
    }

    async loadNotifications() {
        try {
            const notifications = await this.fetchNotifications();
            this.displayNotifications(notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    initLazyLoading() {
        // Intersection Observer for lazy loading
        const lazyImages = document.querySelectorAll('.lazy-image');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy-image');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            lazyImages.forEach(img => {
                img.src = img.dataset.src || img.src;
            });
        }
    }

    initWaveEffects() {
        document.querySelectorAll('[data-wave]').forEach(element => {
            element.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple-effect');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    initSwipeGestures() {
        if ('ontouchstart' in window) {
            let startX, startY;
            
            document.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                if (!startX || !startY) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Only consider horizontal swipes
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 50) {
                        // Swipe left - close search/menu
                        if (this.state.searchActive) {
                            this.closeSearch();
                        }
                        if (document.body.classList.contains('menu-open')) {
                            this.toggleMobileMenu();
                        }
                    }
                }
                
                startX = null;
                startY = null;
            }, { passive: true });
        }
    }

    handleScroll() {
        const header = document.querySelector('.main-header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Parallax effect for hero
        const hero = document.querySelector('.hero-slider');
        if (hero) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    }

    handleKeyboardShortcuts(e) {
        // Only trigger when not in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key.toLowerCase()) {
            case '/':
                e.preventDefault();
                this.openSearch();
                break;
            case 'escape':
                if (this.state.searchActive) {
                    this.closeSearch();
                }
                break;
            case 'm':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleMobileMenu();
                }
                break;
            case 'd':
                if (e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    this.toggleTheme();
                }
                break;
        }
    }

    handleOutsideClick(e) {
        // Close dropdowns when clicking outside
        const notificationPanel = document.querySelector('.notification-panel');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        if (notificationPanel && !e.target.closest('.notification-dropdown')) {
            notificationPanel.classList.remove('show');
        }
        
        if (profileDropdown && !e.target.closest('.user-profile')) {
            profileDropdown.classList.remove('show');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    hideLoadingScreen() {
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
                this.state.isLoading = false;
            }, 500);
        }, 500);
    }

    getSkeletonCards(count) {
        return Array(count).fill(0).map(() => `
            <div class="movie-card skeleton">
                <div class="movie-poster skeleton"></div>
                <div class="movie-info">
                    <div class="movie-title skeleton"></div>
                    <div class="movie-meta skeleton"></div>
                </div>
            </div>
        `).join('');
    }

    addToWatchlist(item) {
        if (!this.state.watchlist.some(i => i.id === item.id)) {
            this.state.watchlist.push(item);
            localStorage.setItem('watchlist', JSON.stringify(this.state.watchlist));
            
            // Update UI
            this.updateWatchlistCount();
        }
    }

    removeFromWatchlist(id) {
        this.state.watchlist = this.state.watchlist.filter(item => item.id !== id);
        localStorage.setItem('watchlist', JSON.stringify(this.state.watchlist));
        this.updateWatchlistCount();
    }

    updateWatchlistCount() {
        const badge = document.querySelector('.count-badge');
        if (badge) {
            badge.textContent = this.state.watchlist.length;
        }
    }

    async logout() {
        try {
            await Auth.logout();
            this.state.userLoggedIn = false;
            this.state.watchHistory = [];
            this.state.watchlist = [];
            
            localStorage.removeItem('auth_token');
            localStorage.removeItem('watch_history');
            localStorage.removeItem('watchlist');
            
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    exploreContent() {
        // Scroll to trending section
        document.getElementById('trending-now')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    showSignupModal() {
        // Implementation for signup modal
        console.log('Show signup modal');
    }

    showPlansModal() {
        // Implementation for plans modal
        console.log('Show plans modal');
    }

    showSearchLoading() {
        const container = this.elements.searchResults.querySelector('.results-container');
        if (container) {
            container.innerHTML = `
                <div class="search-loading">
                    <div class="spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }
    }

    showSearchError() {
        const container = this.elements.searchResults.querySelector('.results-container');
        if (container) {
            container.innerHTML = `
                <div class="search-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to search. Please try again.</p>
                </div>
            `;
        }
    }

    showSearchSuggestions() {
        const container = this.elements.searchResults.querySelector('.results-container');
        if (container) {
            container.innerHTML = `
                <div class="search-suggestions">
                    <h4>Try searching for:</h4>
                    <div class="suggestion-list">
                        <span class="suggestion">Action Movies</span>
                        <span class="suggestion">Comedy Series</span>
                        <span class="suggestion">Latest Releases</span>
                        <span class="suggestion">Popular Actors</span>
                    </div>
                </div>
            `;
        }
    }

    async fetchNotifications() {
        // Simulated notifications
        return [
            { id: 1, type: 'new', title: 'New Movie Added', message: 'Check out the latest Hollywood blockbuster', time: '2 hours ago', read: false },
            { id: 2, type: 'update', title: 'System Update', message: 'We have improved streaming quality', time: '1 day ago', read: true },
            { id: 3, type: 'promo', title: 'Special Offer', message: 'Get 20% off on VIP subscription', time: '3 days ago', read: false }
        ];
    }

    displayNotifications(notifications) {
        const container = document.querySelector('.notification-list');
        if (!container) return;

        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas fa-${notif.type === 'new' ? 'film' : notif.type === 'update' ? 'cog' : 'gift'}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notif.title}</h5>
                    <p>${notif.message}</p>
                    <span class="notification-time">${notif.time}</span>
                </div>
                ${!notif.read ? '<span class="unread-dot"></span>' : ''}
            </div>
        `).join('');

        // Update notification count
        const unreadCount = notifications.filter(n => !n.read).length;
        const countBadge = document.querySelector('.notification-count');
        if (countBadge) {
            countBadge.textContent = unreadCount;
            countBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    initAnalytics() {
        // Basic analytics tracking
        window.addEventListener('load', () => {
            this.trackEvent('page_view', {
                page: window.location.pathname,
                theme: this.state.currentTheme
            });
        });

        // Track user interactions
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('.movie-card')) {
                this.trackEvent('content_click', {
                    element: 'movie_card'
                });
            }
        });
    }

    trackEvent(eventName, data = {}) {
        // Implementation for analytics tracking
        console.log(`Track: ${eventName}`, data);
    }

    showUpdateNotification() {
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification';
        updateNotification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <div>
                    <h4>Update Available</h4>
                    <p>A new version of SilvaStream is available</p>
                </div>
                <button class="btn btn-sm btn-primary" id="updateApp">Update Now</button>
            </div>
        `;
        
        document.body.appendChild(updateNotification);
        
        document.getElementById('updateApp').addEventListener('click', () => {
            window.location.reload();
        });
    }

    startBackgroundSync() {
        // Start periodic background sync for data
        if ('sync' in navigator.serviceWorker) {
            setInterval(() => {
                this.syncData();
            }, 5 * 60 * 1000); // Every 5 minutes
        }
    }

    async syncData() {
        try {
            // Sync user data, watch history, etc.
            await this.loadUserData();
            
            // Preload next likely content
            await this.preloadNextContent();
        } catch (error) {
            console.error('Background sync failed:', error);
        }
    }

    async preloadNextContent() {
        // Preload content that user is likely to watch next
        const history = this.state.watchHistory;
        if (history.length > 0) {
            const lastWatched = history[history.length - 1];
            const similar = await MovieAPI.getSimilarContent(lastWatched.id);
            
            if (similar && similar.length > 0) {
                // Preload images for first 3 similar items
                similar.slice(0, 3).forEach(item => {
                    if (item.cover?.url) {
                        const img = new Image();
                        img.src = item.cover.url;
                    }
                });
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SilvaStreamApp();
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SilvaStreamApp;
}

class CategoryPage {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.categoryType = '';
        this.categoryName = '';
        this.currentView = 'grid';
        this.filters = {
            sortBy: 'popularity',
            type: 'all',
            year: 'all',
            minRating: 0
        };
        
        this.content = [];
        this.stats = {
            movies: 0,
            series: 0,
            avgRating: 0,
            avgYear: 2024
        };
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadCategoryFromURL();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            loading: document.getElementById('loadingOverlay'),
            categoryTitle: document.getElementById('categoryTitle'),
            categoryDescription: document.getElementById('categoryDescription'),
            categoryFilters: document.getElementById('categoryFilters'),
            
            // Filters
            sortBy: document.getElementById('sortBy'),
            yearFilter: document.getElementById('yearFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            applyFilters: document.getElementById('applyFilters'),
            resetFilters: document.getElementById('resetFilters'),
            typeButtons: document.querySelectorAll('.type-btn'),
            
            // Content
            contentSection: document.getElementById('contentSection'),
            contentGrid: document.getElementById('contentGrid'),
            contentList: document.getElementById('contentList'),
            contentCount: document.getElementById('contentCount'),
            loadingText: document.getElementById('loadingText'),
            loadingMore: document.getElementById('loadingMore'),
            noResults: document.getElementById('noResults'),
            
            // View toggle
            viewButtons: document.querySelectorAll('.view-btn'),
            
            // Pagination
            pagination: document.getElementById('pagination'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            pageNumbers: document.getElementById('pageNumbers'),
            
            // Sidebar
            relatedCategories: document.getElementById('relatedCategories'),
            topRated: document.getElementById('topRated'),
            moviesCount: document.getElementById('moviesCount'),
            seriesCount: document.getElementById('seriesCount'),
            avgRating: document.getElementById('avgRating'),
            avgYear: document.getElementById('avgYear')
        };
    }

    setupEventListeners() {
        // Filter changes
        this.elements.sortBy.addEventListener('change', () => this.updateFilters());
        this.elements.yearFilter.addEventListener('change', () => this.updateFilters());
        this.elements.ratingFilter.addEventListener('change', () => this.updateFilters());
        
        // Type buttons
        this.elements.typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filters.type = btn.dataset.type;
            });
        });
        
        // Apply filters
        this.elements.applyFilters.addEventListener('click', () => this.loadCategoryContent());
        this.elements.resetFilters.addEventListener('click', () => this.resetFilters());
        
        // View toggle
        this.elements.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.changeView(btn.dataset.view);
            });
        });
        
        // Pagination
        this.elements.prevPage.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.elements.nextPage.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        
        // Infinite scroll
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Search button
        document.getElementById('searchBtn').addEventListener('click', () => {
            window.location.href = 'search.html';
        });
    }

    loadCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.categoryType = urlParams.get('type') || 'trending';
        this.categoryName = this.getCategoryName(this.categoryType);
        
        // Update page title
        document.title = `${this.categoryName} - SilvaStream`;
        
        // Update header
        this.elements.categoryTitle.innerHTML = `
            <h1>${this.categoryName}</h1>
        `;
        this.elements.categoryDescription.textContent = this.getCategoryDescription(this.categoryType);
        
        // Load initial content
        this.loadCategoryContent();
        this.loadRelatedCategories();
        this.loadTopRated();
    }

    getCategoryName(type) {
        const categories = {
            'trending': 'Trending Now',
            'hollywood': 'Hollywood Movies',
            'romance': 'Teen Romance',
            'horror': 'Horror & Halloween',
            'nollywood': 'Nollywood Hits',
            'drama': 'SA Drama',
            'premium': 'Premium VIP HD',
            'western': 'Western TV',
            'korean': 'K-Drama Series',
            'animation': 'Animated Films',
            'black-panther': 'Black Shows',
            'action': 'Action Movies',
            'adventure': 'Adventure Movies',
            'hunt': 'Deadly Hunt',
            'popular': 'Most Popular'
        };
        
        return categories[type] || type.replace('-', ' ').toUpperCase();
    }

    getCategoryDescription(type) {
        const descriptions = {
            'trending': 'The hottest movies and series everyone is watching right now',
            'hollywood': 'Blockbuster hits from Hollywood studios',
            'romance': 'Heartwarming teen romance movies and series',
            'horror': 'Spooky horror films perfect for Halloween',
            'nollywood': 'The best of Nigerian cinema',
            'drama': 'Compelling South African drama series',
            'premium': 'Exclusive premium content in HD quality',
            'western': 'Classic and modern western TV shows',
            'korean': 'Addictive Korean drama series',
            'animation': 'Animated movies for all ages',
            'black-panther': 'Shows featuring black excellence',
            'action': 'High-octane action-packed movies',
            'adventure': 'Epic adventure films and series',
            'hunt': 'Thrilling hunt and survival stories',
            'popular': 'Most watched content on SilvaStream'
        };
        
        return descriptions[type] || 'Browse our collection of movies and series';
    }

    async loadCategoryContent() {
        this.showLoading();
        this.elements.contentGrid.innerHTML = '';
        this.elements.contentList.innerHTML = '';
        
        try {
            // Load content from API
            const contentData = await MovieAPI.getCategoryContent(this.categoryType, this.currentPage);
            
            if (contentData?.results?.items) {
                this.content = contentData.results.items;
                this.totalItems = contentData.results.total || this.content.length;
                
                // Apply filters
                let filteredContent = this.applyContentFilters(this.content);
                
                if (filteredContent.length === 0) {
                    this.showNoResults();
                } else {
                    // Update stats
                    this.calculateStats(filteredContent);
                    this.updateStatsDisplay();
                    
                    // Display content
                    this.displayContent(filteredContent);
                    this.updatePagination();
                    this.updateContentCount();
                    
                    // Hide loading
                    this.hideNoResults();
                }
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Error loading category content:', error);
            this.showError('Failed to load category content');
        } finally {
            this.hideLoading();
        }
    }

    applyContentFilters(content) {
        let filtered = [...content];
        
        // Filter by type
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(item => {
                if (this.filters.type === 'movie') return MovieAPI.isMovie(item);
                if (this.filters.type === 'series') return MovieAPI.isSeries(item);
                return true;
            });
        }
        
        // Filter by year
        if (this.filters.year !== 'all') {
            filtered = filtered.filter(item => item.year == this.filters.year);
        }
        
        // Filter by rating
        if (this.filters.minRating > 0) {
            filtered = filtered.filter(item => 
                item.imdbRatingValue && parseFloat(item.imdbRatingValue) >= this.filters.minRating
            );
        }
        
        // Sort content
        filtered.sort((a, b) => {
            switch(this.filters.sortBy) {
                case 'newest':
                    return (b.year || 0) - (a.year || 0);
                case 'rating':
                    return (parseFloat(b.imdbRatingValue) || 0) - (parseFloat(a.imdbRatingValue) || 0);
                case 'year':
                    return (b.year || 0) - (a.year || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'popularity':
                default:
                    return (b.popularity || 0) - (a.popularity || 0);
            }
        });
        
        return filtered;
    }

    calculateStats(content) {
        let movies = 0;
        let series = 0;
        let totalRating = 0;
        let totalYear = 0;
        let ratedItems = 0;
        let itemsWithYear = 0;
        
        content.forEach(item => {
            if (MovieAPI.isMovie(item)) movies++;
            if (MovieAPI.isSeries(item)) series++;
            
            if (item.imdbRatingValue) {
                totalRating += parseFloat(item.imdbRatingValue);
                ratedItems++;
            }
            
            if (item.year) {
                totalYear += parseInt(item.year);
                itemsWithYear++;
            }
        });
        
        this.stats = {
            movies,
            series,
            avgRating: ratedItems > 0 ? (totalRating / ratedItems).toFixed(1) : '0.0',
            avgYear: itemsWithYear > 0 ? Math.round(totalYear / itemsWithYear) : '2024'
        };
    }

    updateStatsDisplay() {
        this.elements.moviesCount.textContent = this.stats.movies;
        this.elements.seriesCount.textContent = this.stats.series;
        this.elements.avgRating.textContent = this.stats.avgRating;
        this.elements.avgYear.textContent = this.stats.avgYear;
    }

    displayContent(content) {
        // Clear previous content
        this.elements.contentGrid.innerHTML = '';
        this.elements.contentList.innerHTML = '';
        
        // Display in grid view
        const gridHTML = content.map(item => this.createGridItem(item)).join('');
        this.elements.contentGrid.innerHTML = gridHTML;
        
        // Display in list view
        const listHTML = content.map(item => this.createListItem(item)).join('');
        this.elements.contentList.innerHTML = listHTML;
        
        // Add event listeners
        this.addContentEventListeners();
    }

    createGridItem(item) {
        const isMovie = MovieAPI.isMovie(item);
        const type = isMovie ? 'movie' : 'series';
        const year = item.year || 'N/A';
        const rating = item.imdbRatingValue || 'N/A';
        
        return `
            <div class="content-card" data-id="${item.subjectId}" data-type="${type}">
                <div class="card-poster">
                    <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                         alt="${item.title}"
                         loading="lazy"
                         onerror="this.src='assets/placeholder.jpg'">
                    <div class="card-overlay">
                        <button class="play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="bookmark-btn">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                    <div class="card-badge">${type.toUpperCase()}</div>
                    ${rating !== 'N/A' ? `
                        <div class="card-rating">
                            <i class="fas fa-star"></i>
                            <span>${rating}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-info">
                    <h4 class="card-title">${item.title}</h4>
                    <div class="card-meta">
                        <span>${year}</span>
                        ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating}</span>` : ''}
                    </div>
                    <p class="card-description">${item.description?.substring(0, 80) || 'No description available'}...</p>
                </div>
            </div>
        `;
    }

    createListItem(item) {
        const isMovie = MovieAPI.isMovie(item);
        const type = isMovie ? 'movie' : 'series';
        const year = item.year || 'N/A';
        const rating = item.imdbRatingValue || 'N/A';
        
        return `
            <div class="list-item" data-id="${item.subjectId}" data-type="${type}">
                <div class="item-poster">
                    <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                         alt="${item.title}"
                         loading="lazy">
                </div>
                <div class="item-info">
                    <h4 class="item-title">${item.title}</h4>
                    <div class="item-meta">
                        <span class="item-year">${year}</span>
                        <span class="item-type">${type}</span>
                        ${rating !== 'N/A' ? `
                            <span class="item-rating">
                                <i class="fas fa-star"></i>
                                ${rating}
                            </span>
                        ` : ''}
                    </div>
                    <p class="item-description">${item.description || 'No description available'}</p>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary play-btn">
                            <i class="fas fa-play"></i>
                            Play
                        </button>
                        <button class="btn btn-sm btn-outline bookmark-btn">
                            <i class="fas fa-bookmark"></i>
                            Save
                        </button>
                        <button class="btn btn-sm btn-outline details-btn">
                            <i class="fas fa-info-circle"></i>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addContentEventListeners() {
        // Grid view cards
        this.elements.contentGrid.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.play-btn') && !e.target.closest('.bookmark-btn')) {
                    const id = card.dataset.id;
                    const type = card.dataset.type;
                    window.location.href = `${type}-details.html?id=${id}`;
                }
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
        
        // List view items
        this.elements.contentList.querySelectorAll('.list-item').forEach(item => {
            // Details click
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.play-btn') && 
                    !e.target.closest('.bookmark-btn') && 
                    !e.target.closest('.details-btn')) {
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.location.href = `${type}-details.html?id=${id}`;
                }
            });
            
            // Play button
            const playBtn = item.querySelector('.play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.location.href = `playback.html?id=${id}&type=${type}`;
                });
            }
            
            // Bookmark button
            const bookmarkBtn = item.querySelector('.bookmark-btn');
            if (bookmarkBtn) {
                bookmarkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBookmark(item);
                });
            }
            
            // Details button
            const detailsBtn = item.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.location.href = `${type}-details.html?id=${id}`;
                });
            }
        });
    }

    toggleBookmark(element) {
        const id = element.dataset.id;
        const type = element.dataset.type;
        const title = element.querySelector('.card-title, .item-title').textContent;
        
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const isBookmarked = watchlist.some(item => item.id === id);
        
        const bookmarkBtn = element.querySelector('.bookmark-btn');
        
        if (isBookmarked) {
            // Remove from watchlist
            const updatedWatchlist = watchlist.filter(item => item.id !== id);
            localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
            
            if (bookmarkBtn) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
                if (bookmarkBtn.classList.contains('btn')) {
                    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
                }
            }
            
            this.showToast('Removed from watchlist', 'success');
        } else {
            // Add to watchlist
            const item = {
                id,
                title,
                type,
                poster: element.querySelector('img')?.src,
                year: element.querySelector('.card-meta span, .item-year')?.textContent || 'N/A'
            };
            
            watchlist.push(item);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            
            if (bookmarkBtn) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark" style="color: #e50914;"></i>';
                if (bookmarkBtn.classList.contains('btn')) {
                    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark" style="color: #e50914;"></i> Saved';
                }
            }
            
            this.showToast('Added to watchlist', 'success');
        }
    }

    updatePagination() {
        const itemsPerPage = 24;
        this.totalPages = Math.ceil(this.totalItems / itemsPerPage);
        
        // Update button states
        this.elements.prevPage.disabled = this.currentPage <= 1;
        this.elements.nextPage.disabled = this.currentPage >= this.totalPages;
        
        // Update page numbers
        this.elements.pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            this.elements.pageNumbers.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadCategoryContent();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateContentCount() {
        const start = (this.currentPage - 1) * 24 + 1;
        const end = Math.min(this.currentPage * 24, this.totalItems);
        this.elements.contentCount.textContent = `Showing ${start}-${end} of ${this.totalItems} items`;
    }

    changeView(view) {
        this.currentView = view;
        
        if (view === 'grid') {
            this.elements.contentGrid.style.display = 'grid';
            this.elements.contentList.style.display = 'none';
        } else {
            this.elements.contentGrid.style.display = 'none';
            this.elements.contentList.style.display = 'block';
        }
    }

    updateFilters() {
        this.filters.sortBy = this.elements.sortBy.value;
        this.filters.year = this.elements.yearFilter.value;
        this.filters.minRating = parseInt(this.elements.ratingFilter.value);
    }

    resetFilters() {
        this.elements.sortBy.value = 'popularity';
        this.elements.yearFilter.value = 'all';
        this.elements.ratingFilter.value = '0';
        
        this.elements.typeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'all') {
                btn.classList.add('active');
            }
        });
        
        this.filters = {
            sortBy: 'popularity',
            type: 'all',
            year: 'all',
            minRating: 0
        };
        
        this.loadCategoryContent();
    }

    async loadRelatedCategories() {
        try {
            const allCategories = [
                { type: 'trending', name: 'Trending Now', icon: 'fire' },
                { type: 'hollywood', name: 'Hollywood', icon: 'film' },
                { type: 'korean', name: 'K-Drama', icon: 'theater-masks' },
                { type: 'action', name: 'Action', icon: 'explosion' },
                { type: 'horror', name: 'Horror', icon: 'ghost' },
                { type: 'romance', name: 'Romance', icon: 'heart' }
            ];
            
            // Filter out current category
            const related = allCategories.filter(cat => cat.type !== this.categoryType);
            
            // Display related categories
            this.elements.relatedCategories.innerHTML = related.map(cat => `
                <a href="category.html?type=${cat.type}" class="related-category">
                    <div class="category-icon">
                        <i class="fas fa-${cat.icon}"></i>
                    </div>
                    <span class="category-name">${cat.name}</span>
                </a>
            `).join('');
            
        } catch (error) {
            console.error('Error loading related categories:', error);
        }
    }

    async loadTopRated() {
        try {
            // Get trending content for top rated
            const trending = await MovieAPI.searchMovies('trending');
            if (!trending?.results?.items) return;
            
            // Take top 5 rated items
            const topRated = trending.results.items
                .filter(item => item.imdbRatingValue)
                .sort((a, b) => parseFloat(b.imdbRatingValue) - parseFloat(a.imdbRatingValue))
                .slice(0, 5);
            
            // Display top rated
            this.elements.topRated.innerHTML = topRated.map(item => {
                const isMovie = MovieAPI.isMovie(item);
                const type = isMovie ? 'movie' : 'series';
                
                return `
                    <a href="${type}-details.html?id=${item.subjectId}" class="top-rated-item">
                        <div class="item-poster">
                            <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                                 alt="${item.title}"
                                 loading="lazy">
                        </div>
                        <div class="item-info">
                            <h6 class="item-title">${item.title}</h6>
                            <div class="item-meta">
                                <span>${item.year || 'N/A'}</span>
                                <span><i class="fas fa-star"></i> ${item.imdbRatingValue}</span>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading top rated:', error);
        }
    }

    handleScroll() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        const threshold = 100; // pixels from bottom
        
        if (scrollPosition >= pageHeight - threshold) {
            this.loadMoreContent();
        }
    }

    async loadMoreContent() {
        if (this.isLoadingMore || this.currentPage >= this.totalPages) return;
        
        this.isLoadingMore = true;
        this.elements.loadingMore.style.display = 'flex';
        
        try {
            this.currentPage++;
            const nextPageData = await MovieAPI.getCategoryContent(this.categoryType, this.currentPage);
            
            if (nextPageData?.results?.items) {
                const newContent = nextPageData.results.items;
                const filteredContent = this.applyContentFilters(newContent);
                
                // Append to existing content
                if (this.currentView === 'grid') {
                    const gridHTML = filteredContent.map(item => this.createGridItem(item)).join('');
                    this.elements.contentGrid.innerHTML += gridHTML;
                } else {
                    const listHTML = filteredContent.map(item => this.createListItem(item)).join('');
                    this.elements.contentList.innerHTML += listHTML;
                }
                
                // Update count
                this.totalItems += newContent.length;
                this.updateContentCount();
                
                // Add event listeners to new content
                this.addContentEventListeners();
            }
        } catch (error) {
            console.error('Error loading more content:', error);
            this.currentPage--; // Revert page on error
        } finally {
            this.isLoadingMore = false;
            this.elements.loadingMore.style.display = 'none';
        }
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
        this.elements.loadingText.textContent = 'Loading content...';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    showNoResults() {
        this.elements.contentSection.style.display = 'none';
        this.elements.noResults.style.display = 'block';
    }

    hideNoResults() {
        this.elements.contentSection.style.display = 'block';
        this.elements.noResults.style.display = 'none';
    }

    showError(message) {
        this.elements.noResults.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Content</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="categoryPage.loadCategoryContent()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
        this.showNoResults();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.categoryPage = new CategoryPage();
});

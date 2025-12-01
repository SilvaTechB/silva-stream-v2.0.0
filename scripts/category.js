// scripts/category.js
class CategoryPage {
    constructor() {
        this.categoryName = '';
        this.allItems = [];
        this.filteredItems = [];
        this.currentView = 'grid';
        this.filters = {
            type: 'all',
            sort: 'relevance'
        };
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        this.setupDOM();
        this.setupEvents();
        await this.loadCategoryData();
        this.applyFiltersAndDisplay();
    }

    setupDOM() {
        this.categoryTitle = document.getElementById('category-title');
        this.categoryDescription = document.getElementById('category-description');
        this.totalCount = document.getElementById('total-count');
        this.contentGrid = document.getElementById('content-grid');
        this.loading = document.getElementById('loading');
        this.noContent = document.getElementById('no-content');
        
        // Filter elements
        this.filterToggle = document.getElementById('filter-toggle');
        this.filterPanel = document.getElementById('filter-panel');
        this.filterType = document.getElementById('filter-content-type');
        this.sortSelect = document.getElementById('sort-category');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        this.resetFiltersBtn = document.getElementById('reset-filters');
        
        // View toggle
        this.viewButtons = document.querySelectorAll('.view-btn');
        
        // Search
        this.categorySearch = document.getElementById('category-search');
        this.searchBtn = document.querySelector('.search-in-category .search-btn');
    }

    setupEvents() {
        // Filter toggle
        this.filterToggle.addEventListener('click', () => {
            this.filterPanel.classList.toggle('active');
        });

        // Apply filters
        this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());

        // Reset filters
        this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());

        // View toggle
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view || 
                            e.target.closest('.view-btn').dataset.view;
                this.switchView(view);
            });
        });

        // Search
        this.searchBtn.addEventListener('click', () => this.searchWithinCategory());
        this.categorySearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWithinCategory();
        });

        // Close filter panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.filterPanel.contains(e.target) && 
                !this.filterToggle.contains(e.target) &&
                this.filterPanel.classList.contains('active')) {
                this.filterPanel.classList.remove('active');
            }
        });
    }

    async loadCategoryData() {
        this.showLoading();
        
        try {
            // Get category data from localStorage
            const categoryName = localStorage.getItem('categoryName');
            const categoryItems = localStorage.getItem('categoryItems');
            
            if (categoryName && categoryItems) {
                this.categoryName = categoryName;
                this.allItems = JSON.parse(categoryItems);
                this.filteredItems = [...this.allItems];
                
                this.updateCategoryInfo();
            } else {
                // Fallback: load from URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                const category = urlParams.get('name') || 'trending';
                
                const results = await MovieAPI.searchMovies(category);
                if (results?.results?.items) {
                    this.categoryName = this.formatCategoryName(category);
                    this.allItems = results.results.items;
                    this.filteredItems = [...this.allItems];
                    
                    this.updateCategoryInfo();
                }
            }
        } catch (error) {
            console.error('Error loading category data:', error);
            this.showError('Failed to load category content');
        } finally {
            this.hideLoading();
        }
    }

    formatCategoryName(name) {
        return name.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    updateCategoryInfo() {
        if (this.categoryTitle) {
            this.categoryTitle.textContent = this.categoryName;
            document.title = `${this.categoryName} - SilvaStream`;
        }
        
        if (this.categoryDescription) {
            this.categoryDescription.textContent = 
                `Browse all ${this.categoryName.toLowerCase()} content on SilvaStream`;
        }
        
        if (this.totalCount) {
            this.totalCount.textContent = this.allItems.length;
        }
    }

    applyFilters() {
        this.filters.type = this.filterType.value;
        this.filters.sort = this.sortSelect.value;
        
        this.applyFiltersAndDisplay();
        this.filterPanel.classList.remove('active');
    }

    resetFilters() {
        this.filterType.value = 'all';
        this.sortSelect.value = 'relevance';
        this.categorySearch.value = '';
        
        this.filters.type = 'all';
        this.filters.sort = 'relevance';
        this.searchQuery = '';
        
        this.applyFiltersAndDisplay();
        this.filterPanel.classList.remove('active');
    }

    applyFiltersAndDisplay() {
        // Start with all items
        this.filteredItems = [...this.allItems];
        
        // Apply type filter
        if (this.filters.type !== 'all') {
            this.filteredItems = this.filteredItems.filter(item => {
                if (this.filters.type === 'movie') {
                    return MovieAPI.isMovie(item);
                } else if (this.filters.type === 'series') {
                    return MovieAPI.isSeries(item);
                }
                return true;
            });
        }
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            this.filteredItems = this.filteredItems.filter(item => {
                return item.title?.toLowerCase().includes(query) ||
                       item.description?.toLowerCase().includes(query);
            });
        }
        
        // Apply sorting
        this.applySorting();
        
        // Display results
        this.displayContent();
    }

    applySorting() {
        switch (this.filters.sort) {
            case 'newest':
                this.filteredItems.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'oldest':
                this.filteredItems.sort((a, b) => (a.year || 0) - (b.year || 0));
                break;
            case 'rating':
                this.filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title':
                this.filteredItems.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            default: // relevance
                // Keep original order
                break;
        }
    }

    displayContent() {
        if (!this.contentGrid) return;
        
        if (this.filteredItems.length === 0) {
            this.showNoContent();
            return;
        }
        
        // Clear existing content
        this.contentGrid.innerHTML = '';
        
        // Create content cards
        this.filteredItems.forEach(item => {
            const card = this.createContentCard(item);
            this.contentGrid.appendChild(card);
        });
        
        // Update count
        if (this.totalCount) {
            this.totalCount.textContent = this.filteredItems.length;
        }
        
        // Hide no content message
        this.noContent.style.display = 'none';
    }

    createContentCard(item) {
        const isMovie = MovieAPI.isMovie(item);
        const posterUrl = item.cover?.url || item.cover || item.thumbnail || 
                          'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
        
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.subjectId;
        card.dataset.type = isMovie ? 'movie' : 'series';
        
        card.innerHTML = `
            <img src="${posterUrl}" 
                 alt="${item.title}" 
                 class="content-poster"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image'">
            <div class="content-info">
                <div class="content-type">${isMovie ? 'MOVIE' : 'SERIES'}</div>
                <h3 class="content-title">${item.title}</h3>
                <div class="content-meta">
                    <span>${item.year || ''}</span>
                    ${item.rating ? `<span><i class="fas fa-star"></i> ${item.rating}</span>` : ''}
                </div>
                <p class="content-description">${item.description?.substring(0, 100) || ''}...</p>
                <div class="content-actions">
                    <button class="action-btn play-btn">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="action-btn info-btn">
                        <i class="fas fa-info"></i> Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const playBtn = card.querySelector('.play-btn');
        const infoBtn = card.querySelector('.info-btn');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playContent(item);
        });
        
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDetails(item);
        });
        
        card.addEventListener('click', () => {
            this.showDetails(item);
        });
        
        return card;
    }

    switchView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        
        // Update active button
        this.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update grid class
        this.contentGrid.className = `content-grid ${view}-view`;
        
        // Update cards for list view
        if (view === 'list') {
            this.contentGrid.querySelectorAll('.content-card').forEach(card => {
                card.classList.add('list-view');
            });
        } else {
            this.contentGrid.querySelectorAll('.content-card').forEach(card => {
                card.classList.remove('list-view');
            });
        }
    }

    searchWithinCategory() {
        this.searchQuery = this.categorySearch.value.trim();
        this.applyFiltersAndDisplay();
    }

    playContent(item) {
        const isMovie = MovieAPI.isMovie(item);
        if (isMovie) {
            window.location.href = `playback.html?id=${item.subjectId}&type=movie`;
        } else {
            window.location.href = `playback.html?id=${item.subjectId}&type=series`;
        }
    }

    showDetails(item) {
        const isMovie = MovieAPI.isMovie(item);
        if (isMovie) {
            window.location.href = `movie-details.html?id=${item.subjectId}`;
        } else {
            window.location.href = `series-details.html?id=${item.subjectId}`;
        }
    }

    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
        }
    }

    showNoContent() {
        if (this.noContent) {
            this.noContent.style.display = 'block';
        }
        if (this.contentGrid) {
            this.contentGrid.innerHTML = '';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const main = document.querySelector('main');
        if (main) {
            main.prepend(errorDiv);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }
}

// Initialize category page
document.addEventListener('DOMContentLoaded', () => {
    new CategoryPage();
});

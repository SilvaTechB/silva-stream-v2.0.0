class SeriesDetailsPage {
    constructor() {
        this.seriesId = this.getSeriesId();
        this.currentSeason = 1;
        this.seriesData = null;
        this.seasons = [];
        this.episodes = [];
        this.cast = [];
        this.similar = [];
        
        if (this.seriesId) {
            this.init();
        } else {
            this.showError('Series ID not found in URL');
        }
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadSeriesDetails();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            loading: document.getElementById('loadingOverlay'),
            seriesHero: document.getElementById('seriesHero'),
            heroBackdrop: document.getElementById('heroBackdrop'),
            posterImage: document.getElementById('posterImage'),
            seriesYear: document.getElementById('seriesYear'),
            seriesSeasons: document.getElementById('seriesSeasons'),
            seriesGenre: document.getElementById('seriesGenre'),
            ratingBadge: document.getElementById('ratingBadge'),
            seriesTitle: document.getElementById('seriesTitle'),
            seriesDescription: document.getElementById('seriesDescription'),
            seriesTags: document.getElementById('seriesTags'),
            episodeCount: document.getElementById('episodeCount'),
            seriesStatus: document.getElementById('seriesStatus'),
            seriesNetwork: document.getElementById('seriesNetwork'),
            seriesCreator: document.getElementById('seriesCreator'),
            seriesAwards: document.getElementById('seriesAwards'),
            castGrid: document.getElementById('castGrid'),
            similarGrid: document.getElementById('similarGrid'),
            seasonsSection: document.getElementById('seasonsSection'),
            seasonSelector: document.getElementById('seasonSelector'),
            episodesGrid: document.getElementById('episodesGrid'),
            castSection: document.getElementById('castSection'),
            similarSection: document.getElementById('similarSection'),
            
            // Buttons
            watchNowBtn: document.getElementById('watchNowBtn'),
            watchTrailerBtn: document.getElementById('watchTrailerBtn'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            shareBtn: document.getElementById('shareBtn'),
            viewAllSimilar: document.getElementById('viewAllSimilar'),
            
            // Modals
            episodeModal: document.getElementById('episodeModal'),
            episodeModalTitle: document.getElementById('episodeModalTitle'),
            episodeDetails: document.getElementById('episodeDetails')
        };
    }

    setupEventListeners() {
        // Action buttons
        this.elements.watchNowBtn.addEventListener('click', () => this.watchFirstEpisode());
        this.elements.watchTrailerBtn.addEventListener('click', () => this.showTrailer());
        this.elements.bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        this.elements.shareBtn.addEventListener('click', () => this.shareSeries());
        this.elements.viewAllSimilar.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAllSimilar();
        });

        // Modal close
        document.getElementById('closeEpisodeModal').addEventListener('click', () => {
            this.closeEpisodeModal();
        });

        // Close modal on outside click
        this.elements.episodeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.episodeModal) {
                this.closeEpisodeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeEpisodeModal();
        });
    }

    getSeriesId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadSeriesDetails() {
        this.showLoading();
        
        try {
            // Load series data
            this.seriesData = await MovieAPI.getMovieInfo(this.seriesId);
            
            // Load additional data in parallel
            const [castData, similarData] = await Promise.all([
                MovieAPI.getMovieCast(this.seriesId),
                MovieAPI.getSimilarMovies(this.seriesId)
            ]);
            
            this.cast = castData || [];
            this.similar = similarData || [];
            
            // Extract seasons and episodes
            this.extractSeasons();
            
            // Update UI
            this.updateSeriesDetails();
            this.displayCast();
            this.displaySimilarSeries();
            this.displaySeasonSelector();
            this.loadEpisodes(this.currentSeason);
            
            // Update page title
            document.title = `${this.seriesData.subject?.title || 'Series'} - SilvaStream`;
            
        } catch (error) {
            console.error('Error loading series details:', error);
            this.showError('Failed to load series details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    extractSeasons() {
        const series = this.seriesData.results?.subject;
        const resource = this.seriesData.results?.resource;
        
        if (!series || !resource) return;
        
        this.seasons = resource.seasons?.map((season, index) => ({
            seasonNumber: index + 1,
            episodeCount: season.maxEp || season.resolutions?.[0]?.epNum || 0,
            year: season.year || series.year,
            description: season.description || ''
        })) || [];
    }

    updateSeriesDetails() {
        const series = this.seriesData.results?.subject;
        
        if (!series) return;
        
        // Update backdrop
        if (series.cover?.url) {
            this.elements.heroBackdrop.style.backgroundImage = 
                `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${series.cover.url}')`;
        }
        
        // Update poster
        if (series.cover?.url) {
            this.elements.posterImage.src = series.cover.url;
            this.elements.posterImage.alt = series.title;
        }
        
        // Update text content
        this.elements.seriesTitle.textContent = series.title || 'Unknown Title';
        this.elements.seriesYear.textContent = series.year || 'N/A';
        this.elements.seriesSeasons.textContent = `${this.seasons.length} Seasons`;
        this.elements.seriesGenre.textContent = series.genre || 'N/A';
        
        // Calculate total episodes
        const totalEpisodes = this.seasons.reduce((sum, season) => sum + season.episodeCount, 0);
        this.elements.episodeCount.textContent = `${totalEpisodes} Episodes`;
        
        // Update rating
        if (series.imdbRatingValue) {
            this.elements.ratingBadge.innerHTML = `
                <i class="fas fa-star"></i>
                <span>${series.imdbRatingValue}/10</span>
            `;
        }
        
        // Update description
        this.elements.seriesDescription.textContent = 
            series.description || 'No description available.';
        
        // Update tags
        if (series.genre) {
            const tags = series.genre.split(',').slice(0, 3);
            this.elements.seriesTags.innerHTML = tags.map(tag => 
                `<span class="tag">${tag.trim()}</span>`
            ).join('');
        }
        
        // Update additional info
        this.elements.seriesStatus.textContent = 'Ongoing';
        this.elements.seriesNetwork.textContent = 'SilvaStream Original';
        this.elements.seriesCreator.textContent = series.director || 'N/A';
        this.elements.seriesAwards.textContent = series.awards || 'N/A';
        
        // Show sections
        this.elements.seriesHero.style.display = 'block';
        this.elements.seasonsSection.style.display = this.seasons.length > 0 ? 'block' : 'none';
        this.elements.castSection.style.display = this.cast.length > 0 ? 'block' : 'none';
        this.elements.similarSection.style.display = this.similar.length > 0 ? 'block' : 'none';
    }

    displaySeasonSelector() {
        if (!this.seasons.length) return;
        
        this.elements.seasonSelector.innerHTML = this.seasons.map(season => `
            <button class="season-btn ${season.seasonNumber === this.currentSeason ? 'active' : ''}" 
                    data-season="${season.seasonNumber}">
                Season ${season.seasonNumber}
            </button>
        `).join('');
        
        // Add event listeners
        this.elements.seasonSelector.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const seasonNumber = parseInt(btn.dataset.season);
                this.changeSeason(seasonNumber);
            });
        });
    }

    async loadEpisodes(seasonNumber) {
        try {
            // Get episodes for the selected season
            // This would typically come from an API endpoint
            // For now, we'll generate episode data
            const season = this.seasons.find(s => s.seasonNumber === seasonNumber);
            if (!season) return;
            
            this.episodes = Array.from({ length: season.episodeCount }, (_, i) => ({
                episodeNumber: i + 1,
                title: `Episode ${i + 1}`,
                description: `Description for episode ${i + 1} of season ${seasonNumber}`,
                duration: '45 min',
                airDate: '2024-01-01',
                rating: '8.5'
            }));
            
            this.displayEpisodes();
        } catch (error) {
            console.error('Error loading episodes:', error);
            this.showEpisodeError();
        }
    }

    displayEpisodes() {
        if (!this.episodes.length) {
            this.elements.episodesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <p>No episodes available for this season</p>
                </div>
            `;
            return;
        }
        
        this.elements.episodesGrid.innerHTML = this.episodes.map(episode => `
            <div class="episode-card" data-episode="${episode.episodeNumber}">
                <div class="episode-number">
                    <span>${episode.episodeNumber}</span>
                </div>
                <div class="episode-info">
                    <h4 class="episode-title">${episode.title}</h4>
                    <p class="episode-description">${episode.description}</p>
                    <div class="episode-meta">
                        <span><i class="fas fa-clock"></i> ${episode.duration}</span>
                        <span><i class="fas fa-calendar"></i> ${episode.airDate}</span>
                        ${episode.rating ? `<span><i class="fas fa-star"></i> ${episode.rating}</span>` : ''}
                    </div>
                </div>
                <div class="episode-actions">
                    <button class="btn btn-sm btn-primary watch-episode" 
                            data-season="${this.currentSeason}" 
                            data-episode="${episode.episodeNumber}">
                        <i class="fas fa-play"></i> Watch
                    </button>
                    <button class="btn btn-sm btn-outline episode-info-btn" 
                            data-season="${this.currentSeason}" 
                            data-episode="${episode.episodeNumber}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        this.elements.episodesGrid.querySelectorAll('.watch-episode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const season = e.target.closest('.watch-episode').dataset.season;
                const episode = e.target.closest('.watch-episode').dataset.episode;
                this.watchEpisode(season, episode);
            });
        });
        
        this.elements.episodesGrid.querySelectorAll('.episode-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const season = e.target.closest('.episode-info-btn').dataset.season;
                const episode = e.target.closest('.episode-info-btn').dataset.episode;
                this.showEpisodeDetails(season, episode);
            });
        });
    }

    displayCast() {
        if (!this.cast.length) {
            this.elements.castGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No cast information available</p>
                </div>
            `;
            return;
        }
        
        this.elements.castGrid.innerHTML = this.cast.slice(0, 10).map(person => `
            <div class="cast-card">
                <div class="cast-photo">
                    <img src="${person.photo || 'assets/default-avatar.jpg'}" 
                         alt="${person.name}"
                         loading="lazy"
                         onerror="this.src='assets/default-avatar.jpg'">
                </div>
                <div class="cast-info">
                    <h4 class="cast-name">${person.name}</h4>
                    <p class="cast-character">${person.character || 'Actor'}</p>
                    ${person.known_for ? `<span class="cast-role">${person.known_for}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    displaySimilarSeries() {
        // Filter to only show series
        const similarSeries = this.similar.filter(item => MovieAPI.isSeries(item));
        
        if (!similarSeries.length) {
            this.elements.similarGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <p>No similar series found</p>
                </div>
            `;
            return;
        }
        
        this.elements.similarGrid.innerHTML = similarSeries.slice(0, 6).map(series => {
            return `
                <a href="series-details.html?id=${series.subjectId}" class="similar-card">
                    <div class="similar-poster">
                        <img src="${series.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${series.title}"
                             loading="lazy">
                        <div class="similar-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="similar-badge">SERIES</div>
                    </div>
                    <div class="similar-info">
                        <h4 class="similar-title">${series.title}</h4>
                        <div class="similar-meta">
                            <span>${series.year || 'N/A'}</span>
                            ${series.imdbRatingValue ? 
                                `<span><i class="fas fa-star"></i> ${series.imdbRatingValue}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    changeSeason(seasonNumber) {
        // Update active button
        this.elements.seasonSelector.querySelectorAll('.season-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.season) === seasonNumber) {
                btn.classList.add('active');
            }
        });
        
        // Update current season
        this.currentSeason = seasonNumber;
        
        // Load episodes for new season
        this.loadEpisodes(seasonNumber);
    }

    watchFirstEpisode() {
        if (this.seasons.length > 0 && this.seasons[0].episodeCount > 0) {
            this.watchEpisode(1, 1);
        } else {
            this.showToast('No episodes available', 'error');
        }
    }

    watchEpisode(season, episode) {
        window.location.href = `playback.html?id=${this.seriesId}&type=series&season=${season}&episode=${episode}`;
    }

    async showTrailer() {
        try {
            const trailer = await MovieAPI.getTrailer(this.seriesId);
            
            if (trailer?.type === 'youtube') {
                window.open(trailer.url, '_blank');
            } else {
                this.showToast('Trailer not available', 'info');
            }
        } catch (error) {
            this.showToast('Trailer not available', 'error');
        }
    }

    showEpisodeDetails(season, episode) {
        // For now, show a simple modal with episode info
        // In production, this would fetch detailed episode info from API
        const episodeNumber = parseInt(episode);
        
        this.elements.episodeModalTitle.textContent = `Season ${season}, Episode ${episode}`;
        
        const episodeData = this.episodes.find(e => e.episodeNumber === episodeNumber);
        
        if (episodeData) {
            this.elements.episodeDetails.innerHTML = `
                <div class="episode-detail-content">
                    <h4>${episodeData.title}</h4>
                    <p class="episode-detail-description">${episodeData.description}</p>
                    <div class="episode-detail-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Duration: ${episodeData.duration}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Aired: ${episodeData.airDate}</span>
                        </div>
                        ${episodeData.rating ? `
                            <div class="meta-item">
                                <i class="fas fa-star"></i>
                                <span>Rating: ${episodeData.rating}/10</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="episode-detail-actions">
                        <button class="btn btn-primary watch-from-modal" 
                                data-season="${season}" 
                                data-episode="${episode}">
                            <i class="fas fa-play"></i> Watch Episode
                        </button>
                        <button class="btn btn-outline close-modal-btn">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners for modal buttons
            this.elements.episodeDetails.querySelector('.watch-from-modal').addEventListener('click', () => {
                this.watchEpisode(season, episode);
            });
            
            this.elements.episodeDetails.querySelector('.close-modal-btn').addEventListener('click', () => {
                this.closeEpisodeModal();
            });
        }
        
        this.elements.episodeModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeEpisodeModal() {
        this.elements.episodeModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    toggleBookmark() {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const isBookmarked = watchlist.some(item => item.id === this.seriesId);
        
        if (isBookmarked) {
            // Remove from watchlist
            const updatedWatchlist = watchlist.filter(item => item.id !== this.seriesId);
            localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
            this.elements.bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            this.showToast('Removed from watchlist', 'success');
        } else {
            // Add to watchlist
            const seriesItem = {
                id: this.seriesId,
                title: this.seriesData.subject?.title,
                type: 'series',
                poster: this.seriesData.subject?.cover?.url,
                year: this.seriesData.subject?.year,
                seasons: this.seasons.length
            };
            
            watchlist.push(seriesItem);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            this.elements.bookmarkBtn.innerHTML = '<i class="fas fa-bookmark" style="color: #e50914;"></i>';
            this.showToast('Added to watchlist', 'success');
        }
    }

    shareSeries() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.seriesData.subject?.title || 'Check out this series');
        
        // Open share dialog
        if (navigator.share) {
            navigator.share({
                title: this.seriesData.subject?.title,
                text: 'Check out this series on SilvaStream',
                url: window.location.href
            });
        } else {
            // Fallback to copy link
            navigator.clipboard.writeText(window.location.href);
            this.showToast('Link copied to clipboard', 'success');
        }
    }

    showAllSimilar() {
        // Store similar series in session storage for the view-all page
        const similarSeries = this.similar.filter(item => MovieAPI.isSeries(item));
        sessionStorage.setItem('similarSeries', JSON.stringify(similarSeries));
        sessionStorage.setItem('similarTitle', `Similar to ${this.seriesData.subject?.title}`);
        window.location.href = 'similar.html';
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    showError(message) {
        this.elements.seriesHero.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Series</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    showEpisodeError() {
        this.elements.episodesGrid.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load episodes</p>
                <button class="btn btn-sm btn-primary" onclick="seriesDetails.loadEpisodes(${this.currentSeason})">
                    Retry
                </button>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.seriesDetails = new SeriesDetailsPage();
});

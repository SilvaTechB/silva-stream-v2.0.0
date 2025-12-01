class MovieDetailsPage {
    constructor() {
        this.movieId = this.getMovieId();
        this.movieData = null;
        this.sources = null;
        this.cast = [];
        this.similar = [];
        this.trailer = null;
        
        if (this.movieId) {
            this.init();
        } else {
            this.showError('Movie ID not found in URL');
        }
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadMovieDetails();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            loading: document.getElementById('loadingOverlay'),
            movieHero: document.getElementById('movieHero'),
            heroBackdrop: document.getElementById('heroBackdrop'),
            posterImage: document.getElementById('posterImage'),
            moviePoster: document.getElementById('moviePoster'),
            movieYear: document.getElementById('movieYear'),
            movieRuntime: document.getElementById('movieRuntime'),
            movieGenre: document.getElementById('movieGenre'),
            ratingBadge: document.getElementById('ratingBadge'),
            movieTitle: document.getElementById('movieTitle'),
            movieDescription: document.getElementById('movieDescription'),
            movieTags: document.getElementById('movieTags'),
            releaseDate: document.getElementById('releaseDate'),
            director: document.getElementById('director'),
            writer: document.getElementById('writer'),
            budget: document.getElementById('budget'),
            castGrid: document.getElementById('castGrid'),
            similarGrid: document.getElementById('similarGrid'),
            sourcesGrid: document.getElementById('sourcesGrid'),
            castSection: document.getElementById('castSection'),
            similarSection: document.getElementById('similarSection'),
            sourcesSection: document.getElementById('sourcesSection'),
            
            // Buttons
            watchNowBtn: document.getElementById('watchNowBtn'),
            watchTrailerBtn: document.getElementById('watchTrailerBtn'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            shareBtn: document.getElementById('shareBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            viewAllSimilar: document.getElementById('viewAllSimilar'),
            
            // Modals
            qualityModal: document.getElementById('qualityModal'),
            trailerModal: document.getElementById('trailerModal'),
            shareModal: document.getElementById('shareModal'),
            qualityOptions: document.getElementById('qualityOptions'),
            trailerContainer: document.getElementById('trailerContainer'),
            shareLinkInput: document.getElementById('shareLinkInput'),
            copyLinkBtn: document.getElementById('copyLinkBtn')
        };
    }

    setupEventListeners() {
        // Action buttons
        this.elements.watchNowBtn.addEventListener('click', () => this.watchMovie());
        this.elements.watchTrailerBtn.addEventListener('click', () => this.showTrailer());
        this.elements.bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        this.elements.shareBtn.addEventListener('click', () => this.showShareModal());
        this.elements.downloadBtn.addEventListener('click', () => this.showQualityModal());
        this.elements.viewAllSimilar.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAllSimilar();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Copy link button
        this.elements.copyLinkBtn.addEventListener('click', () => this.copyShareLink());

        // Share options
        document.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', () => this.handleShare(option.dataset.platform));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModals();
            if (e.key === ' ' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.watchMovie();
            }
        });
    }

    getMovieId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadMovieDetails() {
        this.showLoading();
        
        try {
            // Load movie data, cast, and similar movies in parallel
            const [movieData, castData, similarData] = await Promise.all([
                MovieAPI.getMovieInfo(this.movieId),
                MovieAPI.getMovieCast(this.movieId),
                MovieAPI.getSimilarMovies(this.movieId)
            ]);
            
            this.movieData = movieData;
            this.cast = castData || [];
            this.similar = similarData || [];
            
            // Load sources
            this.sources = await MovieAPI.getDownloadSources(this.movieId);
            
            // Update UI
            this.updateMovieDetails();
            this.displayCast();
            this.displaySimilarMovies();
            this.displayDownloadSources();
            
            // Preload trailer
            this.preloadTrailer();
            
            // Update page title
            document.title = `${this.movieData.subject?.title || 'Movie'} - SilvaStream`;
            
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    updateMovieDetails() {
        const movie = this.movieData.results?.subject || {};
        
        // Update backdrop
        if (movie.cover?.url) {
            this.elements.heroBackdrop.style.backgroundImage = 
                `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${movie.cover.url}')`;
        }
        
        // Update poster
        if (movie.cover?.url) {
            this.elements.posterImage.src = movie.cover.url;
            this.elements.posterImage.alt = movie.title;
        }
        
        // Update text content
        this.elements.movieTitle.textContent = movie.title || 'Unknown Title';
        this.elements.movieYear.textContent = movie.year || 'N/A';
        this.elements.movieRuntime.textContent = movie.duration ? 
            `${Math.floor(movie.duration / 60)} min` : 'N/A';
        this.elements.movieGenre.textContent = movie.genre || 'N/A';
        
        // Update rating
        if (movie.imdbRatingValue) {
            this.elements.ratingBadge.innerHTML = `
                <i class="fas fa-star"></i>
                <span>${movie.imdbRatingValue}/10</span>
            `;
        }
        
        // Update description
        this.elements.movieDescription.textContent = 
            movie.description || 'No description available.';
        
        // Update tags
        if (movie.genre) {
            const tags = movie.genre.split(',').slice(0, 3);
            this.elements.movieTags.innerHTML = tags.map(tag => 
                `<span class="tag">${tag.trim()}</span>`
            ).join('');
        }
        
        // Update additional info
        this.elements.releaseDate.textContent = movie.releaseDate || 'N/A';
        this.elements.director.textContent = movie.director || 'N/A';
        this.elements.writer.textContent = movie.writer || 'N/A';
        this.elements.budget.textContent = movie.budget ? `$${movie.budget}` : 'N/A';
        
        // Show sections
        this.elements.movieHero.style.display = 'block';
        this.elements.castSection.style.display = this.cast.length > 0 ? 'block' : 'none';
        this.elements.similarSection.style.display = this.similar.length > 0 ? 'block' : 'none';
        this.elements.sourcesSection.style.display = this.sources?.results?.length > 0 ? 'block' : 'none';
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

    displaySimilarMovies() {
        if (!this.similar.length) {
            this.elements.similarGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <p>No similar movies found</p>
                </div>
            `;
            return;
        }
        
        this.elements.similarGrid.innerHTML = this.similar.slice(0, 6).map(movie => {
            const isMovie = MovieAPI.isMovie(movie);
            const type = isMovie ? 'movie' : 'series';
            
            return `
                <a href="${type}-details.html?id=${movie.subjectId}" class="similar-card">
                    <div class="similar-poster">
                        <img src="${movie.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${movie.title}"
                             loading="lazy">
                        <div class="similar-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="similar-badge">${type.toUpperCase()}</div>
                    </div>
                    <div class="similar-info">
                        <h4 class="similar-title">${movie.title}</h4>
                        <div class="similar-meta">
                            <span>${movie.year || 'N/A'}</span>
                            ${movie.imdbRatingValue ? 
                                `<span><i class="fas fa-star"></i> ${movie.imdbRatingValue}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    displayDownloadSources() {
        if (!this.sources?.results?.length) {
            this.elements.sourcesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-download"></i>
                    <p>No download sources available</p>
                </div>
            `;
            return;
        }
        
        this.elements.sourcesGrid.innerHTML = this.sources.results.map(source => {
            const quality = source.quality || 'Unknown';
            const format = source.format || 'mp4';
            const size = this.formatFileSize(source.size);
            const isStreamable = ['mp4', 'm3u8', 'webm'].includes(format.toLowerCase());
            
            return `
                <div class="source-card">
                    <div class="source-info">
                        <div class="source-quality">
                            <span class="quality-badge">${quality}</span>
                            <span class="format-badge">${format.toUpperCase()}</span>
                        </div>
                        <div class="source-details">
                            <span><i class="fas fa-hdd"></i> ${size}</span>
                            ${source.language ? 
                                `<span><i class="fas fa-language"></i> ${source.language}</span>` : ''}
                        </div>
                    </div>
                    <div class="source-actions">
                        ${isStreamable ? `
                            <button class="btn btn-sm btn-primary stream-btn" 
                                    data-url="${source.download_url}">
                                <i class="fas fa-play"></i> Stream
                            </button>
                        ` : ''}
                        <a href="${source.download_url}" 
                           class="btn btn-sm btn-outline download-btn" 
                           download>
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to stream buttons
        this.elements.sourcesGrid.querySelectorAll('.stream-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.closest('.stream-btn').dataset.url;
                this.streamMovie(url);
            });
        });
    }

    async preloadTrailer() {
        try {
            this.trailer = await MovieAPI.getTrailer(this.movieId);
        } catch (error) {
            console.error('Failed to load trailer:', error);
        }
    }

    watchMovie() {
        if (this.sources?.results?.length > 0) {
            // Open quality selection modal
            this.showQualityModal();
        } else {
            // Direct play if only one source
            window.location.href = `playback.html?id=${this.movieId}&type=movie`;
        }
    }

    async showTrailer() {
        if (!this.trailer) {
            try {
                this.trailer = await MovieAPI.getTrailer(this.movieId);
            } catch (error) {
                this.showToast('Trailer not available', 'error');
                return;
            }
        }
        
        if (this.trailer.type === 'youtube') {
            this.elements.trailerContainer.innerHTML = `
                <iframe width="100%" height="500" 
                        src="https://www.youtube.com/embed/${this.trailer.id}?autoplay=1&rel=0" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            `;
        } else {
            this.elements.trailerContainer.innerHTML = `
                <video controls autoplay class="video-player">
                    <source src="${this.trailer.url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }
        
        this.elements.trailerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showQualityModal() {
        if (!this.sources?.results?.length) {
            this.showToast('No streaming sources available', 'error');
            return;
        }
        
        // Filter streamable sources
        const streamableSources = this.sources.results.filter(source => {
            const format = source.format?.toLowerCase() || '';
            return ['mp4', 'm3u8', 'webm'].includes(format);
        });
        
        if (streamableSources.length === 0) {
            this.showToast('No streamable sources available', 'error');
            return;
        }
        
        // Populate quality options
        this.elements.qualityOptions.innerHTML = streamableSources.map(source => {
            const quality = source.quality || 'Unknown';
            const format = source.format || 'mp4';
            const size = this.formatFileSize(source.size);
            
            return `
                <div class="quality-option" data-url="${source.download_url}">
                    <div class="quality-details">
                        <span class="quality-name">${quality}</span>
                        <span class="quality-info">${format.toUpperCase()} • ${size}</span>
                    </div>
                    <button class="btn btn-sm btn-primary select-quality">
                        <i class="fas fa-play"></i> Play
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        this.elements.qualityOptions.querySelectorAll('.select-quality').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const qualityOption = e.target.closest('.quality-option');
                const url = qualityOption.dataset.url;
                this.streamMovie(url);
            });
        });
        
        this.elements.qualityModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showShareModal() {
        const currentUrl = window.location.href;
        this.elements.shareLinkInput.value = currentUrl;
        this.elements.shareModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
        
        // Clear trailer container
        this.elements.trailerContainer.innerHTML = '';
    }

    streamMovie(url) {
        this.closeModals();
        window.location.href = `playback.html?id=${this.movieId}&type=movie&url=${encodeURIComponent(url)}`;
    }

    toggleBookmark() {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const isBookmarked = watchlist.some(item => item.id === this.movieId);
        
        if (isBookmarked) {
            // Remove from watchlist
            const updatedWatchlist = watchlist.filter(item => item.id !== this.movieId);
            localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
            this.elements.bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            this.showToast('Removed from watchlist', 'success');
        } else {
            // Add to watchlist
            const movieItem = {
                id: this.movieId,
                title: this.movieData.subject?.title,
                type: 'movie',
                poster: this.movieData.subject?.cover?.url,
                year: this.movieData.subject?.year
            };
            
            watchlist.push(movieItem);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            this.elements.bookmarkBtn.innerHTML = '<i class="fas fa-bookmark" style="color: #e50914;"></i>';
            this.showToast('Added to watchlist', 'success');
        }
    }

    handleShare(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.movieData.subject?.title || 'Check out this movie');
        
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${title}%20${url}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                break;
            case 'copy':
                this.copyShareLink();
                return;
        }
        
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        this.closeModals();
    }

    copyShareLink() {
        this.elements.shareLinkInput.select();
        document.execCommand('copy');
        
        // Change button icon to indicate success
        const originalHTML = this.elements.copyLinkBtn.innerHTML;
        this.elements.copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        this.showToast('Link copied to clipboard', 'success');
        
        // Revert after 2 seconds
        setTimeout(() => {
            this.elements.copyLinkBtn.innerHTML = originalHTML;
        }, 2000);
    }

    showAllSimilar() {
        // Store similar movies in session storage for the view-all page
        sessionStorage.setItem('similarMovies', JSON.stringify(this.similar));
        sessionStorage.setItem('similarTitle', `Similar to ${this.movieData.subject?.title}`);
        window.location.href = 'similar.html';
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    showError(message) {
        this.elements.movieHero.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Movie</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Try Again
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

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.movieDetails = new MovieDetailsPage();
});

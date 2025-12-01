// scripts/movie-details.js - ENHANCED VERSION

class MovieDetails {
    constructor() {
        this.movieId = this.getMovieIdFromURL();
        this.sources = null;
        this.cast = [];
        this.trailers = [];
        this.similar = [];
        this.selectedDownloadQuality = null;
        
        if (this.movieId) {
            this.init();
        } else {
            this.showError('No movie ID provided in URL');
        }
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.loadMovieDetails();
        this.setupShare();
    }

    setupDOM() {
        // Existing elements
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.movieDetails = document.getElementById('movie-details');
        this.detailsBackdrop = document.getElementById('details-backdrop');
        this.detailsPoster = document.getElementById('details-poster');
        this.detailsTitle = document.getElementById('details-title');
        this.detailsYear = document.getElementById('details-year');
        this.detailsRuntime = document.getElementById('details-runtime');
        this.detailsGenre = document.getElementById('details-genre');
        this.detailsRating = document.getElementById('details-rating');
        this.detailsOverview = document.getElementById('details-overview');
        this.watchBtn = document.getElementById('watch-btn');
        this.trailerBtn = document.getElementById('trailer-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.sourcesSection = document.getElementById('sources-section');
        this.sourcesGrid = document.getElementById('sources-grid');
        
        // New sections
        this.createCastSection();
        this.createSimilarSection();
        this.createTrailerSection();
        this.createShareSection();
        
        // Create download modal
        this.createDownloadModal();
    }

    createCastSection() {
        const castSection = document.createElement('section');
        castSection.className = 'cast-section';
        castSection.innerHTML = `
            <h2 class="section-title"><i class="fas fa-users"></i> Cast</h2>
            <div class="cast-grid" id="cast-grid">
                <div class="loading-cast">Loading cast...</div>
            </div>
        `;
        
        this.movieDetails.parentNode.insertBefore(castSection, this.sourcesSection);
    }

    createSimilarSection() {
        const similarSection = document.createElement('section');
        similarSection.className = 'similar-section';
        similarSection.innerHTML = `
            <h2 class="section-title"><i class="fas fa-film"></i> Similar Movies</h2>
            <div class="similar-grid" id="similar-grid">
                <div class="loading-similar">Loading similar movies...</div>
            </div>
        `;
        
        const main = document.querySelector('main');
        if (main) {
            main.appendChild(similarSection);
        }
    }

    createTrailerSection() {
        const trailerSection = document.createElement('section');
        trailerSection.className = 'trailer-section';
        trailerSection.innerHTML = `
            <h2 class="section-title"><i class="fas fa-video"></i> Trailers & Clips</h2>
            <div class="trailer-grid" id="trailer-grid">
                <div class="loading-trailers">Loading trailers...</div>
            </div>
        `;
        
        const castSection = document.querySelector('.cast-section');
        if (castSection) {
            castSection.parentNode.insertBefore(trailerSection, castSection.nextSibling);
        }
    }

    createShareSection() {
        const shareSection = document.createElement('div');
        shareSection.className = 'share-section';
        shareSection.innerHTML = `
            <div class="share-buttons">
                <button class="share-btn whatsapp-share">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="share-btn facebook-share">
                    <i class="fab fa-facebook"></i>
                </button>
                <button class="share-btn twitter-share">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="share-btn copy-link">
                    <i class="fas fa-link"></i>
                </button>
            </div>
        `;
        
        const actions = this.movieDetails.querySelector('.details-actions');
        if (actions) {
            actions.appendChild(shareSection);
        }
    }

    createDownloadModal() {
        if (!document.getElementById('download-quality-modal')) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'download-quality-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Select Download Quality</h3>
                        <button class="close-modal" data-modal="download-quality-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="quality-options" id="download-quality-options"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    setupEvents() {
        // Existing events
        if (this.watchBtn) {
            this.watchBtn.addEventListener('click', () => this.watchMovie());
        }
        
        if (this.trailerBtn) {
            this.trailerBtn.addEventListener('click', () => this.playFirstTrailer());
        }
        
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.showDownloadQualitySelection());
        }

        // Share events
        this.setupShareEvents();

        // Modal events
        this.setupModalEvents();
    }

    setupShareEvents() {
        document.querySelector('.whatsapp-share')?.addEventListener('click', () => this.shareOnWhatsApp());
        document.querySelector('.facebook-share')?.addEventListener('click', () => this.shareOnFacebook());
        document.querySelector('.twitter-share')?.addEventListener('click', () => this.shareOnTwitter());
        document.querySelector('.copy-link')?.addEventListener('click', () => this.copyLink());
    }

    setupModalEvents() {
        // Close modals
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.closeModal(modalId);
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async loadMovieDetails() {
        this.showLoading();
        try {
            const [movieInfo, sources] = await Promise.all([
                MovieAPI.getMovieInfo(this.movieId),
                MovieAPI.getDownloadSources(this.movieId)
            ]);
            
            if (movieInfo?.results?.subject) {
                this.movieData = movieInfo.results;
                this.sources = sources;
                
                this.displayMovieDetails();
                this.displayCast();
                this.displaySimilarMovies();
                this.displayTrailers();
                this.setupDownloadOptions();
                
                // Preload for better performance
                this.preloadContent();
            } else {
                this.showError('Failed to load movie details');
            }
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Error loading movie details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayMovieDetails() {
        const movie = this.movieData.subject;
        
        // Update basic info
        const backdropUrl = movie.cover?.url || movie.cover || movie.stills?.url || '';
        const posterUrl = movie.cover?.url || movie.cover || '';
        
        if (this.detailsBackdrop && backdropUrl) {
            this.detailsBackdrop.src = backdropUrl;
            this.detailsBackdrop.onload = () => {
                this.detailsBackdrop.classList.add('loaded');
            };
        }
        
        if (this.detailsPoster && posterUrl) {
            this.detailsPoster.src = posterUrl;
            this.detailsPoster.onload = () => {
                this.detailsPoster.classList.add('loaded');
            };
        }
        
        if (this.detailsTitle) {
            this.detailsTitle.textContent = movie.title || 'Unknown Title';
            document.title = `${movie.title} - SilvaStream`;
        }
        
        if (this.detailsYear) {
            this.detailsYear.textContent = movie.year || movie.releaseDate || 'N/A';
        }
        
        if (this.detailsRuntime) {
            const duration = movie.duration ? `${Math.floor(movie.duration / 60)} min` : 'N/A';
            this.detailsRuntime.textContent = duration;
        }
        
        if (this.detailsGenre) {
            this.detailsGenre.textContent = movie.genre || 'N/A';
        }
        
        if (this.detailsRating) {
            const rating = movie.imdbRatingValue ? `${movie.imdbRatingValue}/10` : 'N/A';
            this.detailsRating.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
        }
        
        if (this.detailsOverview) {
            this.detailsOverview.textContent = movie.description || 'No description available.';
        }

        // Show movie details section
        if (this.movieDetails) {
            this.movieDetails.style.display = 'block';
        }
    }

    displayCast() {
        const castGrid = document.getElementById('cast-grid');
        if (!castGrid) return;

        const cast = this.movieData.subject.cast || [];
        
        if (cast.length === 0) {
            castGrid.innerHTML = '<p class="no-cast">No cast information available.</p>';
            return;
        }

        castGrid.innerHTML = cast.slice(0, 10).map(person => `
            <div class="cast-member">
                <div class="cast-photo">
                    ${person.photo ? 
                        `<img src="${person.photo}" alt="${person.name}" 
                             loading="lazy"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\"fas fa-user\"></i>';" 
                             class="cast-img">` :
                        `<div class="cast-placeholder"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <div class="cast-info">
                    <h4 class="cast-name">${person.name}</h4>
                    <p class="cast-character">${person.character || 'Actor'}</p>
                </div>
            </div>
        `).join('');
    }

    async displaySimilarMovies() {
        const similarGrid = document.getElementById('similar-grid');
        if (!similarGrid) return;

        try {
            // Use movie title to find similar movies
            const title = this.movieData.subject.title;
            const searchWords = title.split(' ').slice(0, 2).join(' ');
            const similarData = await MovieAPI.searchMovies(searchWords);
            
            if (similarData?.results?.items) {
                // Filter out current movie
                const similarMovies = similarData.results.items
                    .filter(item => item.subjectId !== this.movieId)
                    .slice(0, 8);

                if (similarMovies.length === 0) {
                    similarGrid.innerHTML = '<p class="no-similar">No similar movies found.</p>';
                    return;
                }

                similarGrid.innerHTML = similarMovies.map(movie => {
                    const isMovie = MovieAPI.isMovie(movie);
                    const posterUrl = movie.cover?.url || 'https://via.placeholder.com/200x300/2a2a2a/ffffff?text=No+Image';
                    
                    return `
                        <div class="similar-card" data-id="${movie.subjectId}" data-type="${isMovie ? 'movie' : 'series'}">
                            <img src="${posterUrl}" 
                                 alt="${movie.title}" 
                                 loading="lazy"
                                 class="similar-poster"
                                 onerror="this.src='https://via.placeholder.com/200x300/2a2a2a/ffffff?text=No+Image'">
                            <div class="similar-info">
                                <h4 class="similar-title">${movie.title}</h4>
                                <p class="similar-year">${movie.year || ''}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                // Add click events
                similarGrid.querySelectorAll('.similar-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.id;
                        const type = card.dataset.type;
                        window.location.href = `${type}-details.html?id=${id}`;
                    });
                });
            } else {
                similarGrid.innerHTML = '<p class="no-similar">No similar movies found.</p>';
            }
        } catch (error) {
            console.error('Error loading similar movies:', error);
            similarGrid.innerHTML = '<p class="no-similar">Failed to load similar movies.</p>';
        }
    }

    displayTrailers() {
        const trailerGrid = document.getElementById('trailer-grid');
        if (!trailerGrid) return;

        // Mock trailers for now - you'll need to integrate with your API
        const mockTrailers = [
            { title: 'Official Trailer', duration: '2:30', thumbnail: '' },
            { title: 'Behind the Scenes', duration: '5:15', thumbnail: '' },
            { title: 'Cast Interviews', duration: '3:45', thumbnail: '' }
        ];

        trailerGrid.innerHTML = mockTrailers.map((trailer, index) => `
            <div class="trailer-card" data-index="${index}">
                <div class="trailer-thumbnail">
                    <i class="fas fa-play"></i>
                    <span class="trailer-duration">${trailer.duration}</span>
                </div>
                <div class="trailer-info">
                    <h4 class="trailer-title">${trailer.title}</h4>
                </div>
            </div>
        `).join('');

        // Add click events
        trailerGrid.querySelectorAll('.trailer-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.dataset.index;
                this.playTrailer(index);
            });
        });
    }

    playTrailer(index) {
        // This would play the actual trailer
        // For now, we'll just show a message
        this.showNotification('Playing trailer...');
        
        // You would integrate with your trailer API here
        // const trailerUrl = this.trailers[index].url;
        // this.openTrailerPlayer(trailerUrl);
    }

    playFirstTrailer() {
        if (this.trailers.length > 0) {
            this.playTrailer(0);
        } else {
            this.showNotification('No trailers available');
        }
    }

    setupDownloadOptions() {
        if (this.sources?.results) {
            const downloadSources = this.sources.results.filter(source => source.download_url);
            
            if (downloadSources.length > 0) {
                this.downloadBtn.style.display = 'flex';
                this.sourcesSection.style.display = 'block';
                this.displayDownloadSources(downloadSources);
            }
        }
    }

    displayDownloadSources(sources) {
        if (!this.sourcesGrid) return;

        // Sort by quality
        sources.sort((a, b) => {
            const qualityA = this.parseQuality(a.quality);
            const qualityB = this.parseQuality(b.quality);
            return qualityB - qualityA;
        });

        this.sourcesGrid.innerHTML = sources.map((source, index) => `
            <div class="source-card" data-index="${index}">
                <div class="source-info">
                    <div class="source-quality">${source.quality || 'Unknown'}</div>
                    <div class="source-details">
                        <span><i class="fas fa-file-video"></i> ${source.format || 'mp4'}</span>
                        <span><i class="fas fa-hdd"></i> ${this.formatFileSize(source.size)}</span>
                    </div>
                </div>
                <div class="source-actions">
                    <a href="${source.download_url}" class="download-link" download>
                        <i class="fas fa-download"></i> Download
                    </a>
                    <button class="preview-btn" data-url="${source.stream_url || source.download_url}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>
        `).join('');

        // Add preview events
        this.sourcesGrid.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.dataset.url;
                this.previewSource(url);
            });
        });
    }

    previewSource(url) {
        // Open preview in modal
        const previewModal = document.createElement('div');
        previewModal.className = 'modal preview-modal';
        previewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Video Preview</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <video controls class="preview-player">
                        <source src="${url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
        previewModal.style.display = 'block';
        
        // Close event
        previewModal.querySelector('.close-modal').addEventListener('click', () => {
            previewModal.remove();
        });
        
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.remove();
            }
        });
    }

    showDownloadQualitySelection() {
        if (!this.sources?.results) {
            this.showError('No download sources available');
            return;
        }

        const downloadableSources = this.sources.results.filter(source => source.download_url);
        
        if (downloadableSources.length === 0) {
            this.showError('No downloadable sources available');
            return;
        }

        this.populateDownloadQualityOptions(downloadableSources);
        this.openModal('download-quality-modal');
    }

    populateDownloadQualityOptions(sources) {
        const optionsContainer = document.getElementById('download-quality-options');
        if (!optionsContainer) return;

        optionsContainer.innerHTML = sources.map((source, index) => {
            return `
                <div class="quality-option" data-index="${index}">
                    <div class="quality-info">
                        <div class="quality-name">${source.quality || 'Unknown Quality'}</div>
                        <div class="quality-details">
                            <span>Format: ${source.format || 'mp4'}</span>
                            <span>Size: ${this.formatFileSize(source.size)}</span>
                        </div>
                    </div>
                    <a href="${source.download_url}" class="quality-action" download>
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            `;
        }).join('');
    }

    watchMovie() {
        if (this.movieId) {
            // Add to watch history
            this.addToWatchHistory();
            
            // Navigate to playback
            window.location.href = `playback.html?id=${this.movieId}&type=movie`;
        } else {
            this.showError('Cannot play movie, ID is missing.');
        }
    }

    addToWatchHistory() {
        let watchHistory = JSON.parse(localStorage.getItem('silvastream-history') || '[]');
        
        // Remove if already exists
        watchHistory = watchHistory.filter(item => item.id !== this.movieId);
        
        // Add to beginning
        watchHistory.unshift({
            id: this.movieId,
            type: 'movie',
            title: this.movieData.subject.title,
            poster: this.movieData.subject.cover?.url,
            watchedAt: Date.now()
        });
        
        // Keep only last 50 items
        if (watchHistory.length > 50) {
            watchHistory = watchHistory.slice(0, 50);
        }
        
        localStorage.setItem('silvastream-history', JSON.stringify(watchHistory));
    }

    shareOnWhatsApp() {
        const title = this.movieData.subject.title;
        const url = window.location.href;
        const text = `Check out "${title}" on SilvaStream! ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }

    shareOnFacebook() {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    shareOnTwitter() {
        const title = this.movieData.subject.title;
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Watching "${title}" on SilvaStream`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    copyLink() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => this.showNotification('Link copied to clipboard!'))
            .catch(() => this.showNotification('Failed to copy link'));
    }

    setupShare() {
        // Add social meta tags
        const metaTags = `
            <meta property="og:title" content="${this.movieData?.subject?.title || 'SilvaStream'}">
            <meta property="og:description" content="${this.movieData?.subject?.description || 'Watch movies and TV shows on SilvaStream'}">
            <meta property="og:image" content="${this.movieData?.subject?.cover?.url || ''}">
            <meta property="og:url" content="${window.location.href}">
            <meta name="twitter:card" content="summary_large_image">
        `;
        
        document.head.insertAdjacentHTML('beforeend', metaTags);
    }

    preloadContent() {
        // Preload similar movie images
        const similarGrid = document.getElementById('similar-grid');
        if (similarGrid) {
            similarGrid.querySelectorAll('img').forEach(img => {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const lazyImage = entry.target;
                            if (lazyImage.dataset.src) {
                                lazyImage.src = lazyImage.dataset.src;
                                lazyImage.removeAttribute('data-src');
                            }
                            observer.unobserve(lazyImage);
                        }
                    });
                });
                
                observer.observe(img);
            });
        }
    }

    // Utility methods
    getMovieIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    showLoading() {
        if (this.loading) this.loading.style.display = 'flex';
    }

    hideLoading() {
        if (this.loading) this.loading.style.display = 'none';
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    parseQuality(quality) {
        if (!quality) return 0;
        const match = quality.match(/(\d+)p/);
        return match ? parseInt(match[1]) : 0;
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MovieDetails();
});

// Add CSS for new sections
const detailsStyles = document.createElement('style');
detailsStyles.textContent = `
    .cast-section, .similar-section, .trailer-section {
        margin: 3rem 0;
        padding: 2rem 0;
    }
    
    .cast-grid, .similar-grid, .trailer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }
    
    .cast-member {
        background: var(--card-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        transition: var(--transition-smooth);
    }
    
    .cast-member:hover {
        transform: translateY(-5px);
        box-shadow: var(--card-shadow);
    }
    
    .cast-photo {
        aspect-ratio: 1;
        background: var(--bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .cast-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .cast-placeholder {
        font-size: 3rem;
        color: var(--text-tertiary);
    }
    
    .cast-info {
        padding: 1rem;
    }
    
    .cast-name {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }
    
    .cast-character {
        font-size: 0.8rem;
        color: var(--text-tertiary);
    }
    
    .similar-card, .trailer-card {
        background: var(--card-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        cursor: pointer;
        transition: var(--transition-smooth);
    }
    
    .similar-card:hover, .trailer-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--card-shadow);
    }
    
    .similar-poster {
        width: 100%;
        aspect-ratio: 2/3;
        object-fit: cover;
    }
    
    .similar-info {
        padding: 1rem;
    }
    
    .similar-title {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }
    
    .similar-year {
        font-size: 0.8rem;
        color: var(--text-tertiary);
    }
    
    .trailer-thumbnail {
        aspect-ratio: 16/9;
        background: var(--bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    
    .trailer-thumbnail .fa-play {
        font-size: 2rem;
        color: white;
        z-index: 2;
    }
    
    .trailer-duration {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }
    
    .trailer-info {
        padding: 1rem;
    }
    
    .trailer-title {
        font-size: 0.9rem;
        font-weight: 600;
    }
    
    .share-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .share-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .share-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        font-size: 1.2rem;
        cursor: pointer;
        transition: var(--transition-quick);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .share-btn:hover {
        transform: scale(1.1);
    }
    
    .whatsapp-share { background: #25D366; color: white; }
    .facebook-share { background: #1877F2; color: white; }
    .twitter-share { background: #1DA1F2; color: white; }
    
    .notification {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--card-shadow);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .preview-modal .modal-content {
        max-width: 800px;
        width: 90%;
    }
    
    .preview-player {
        width: 100%;
        max-height: 70vh;
        border-radius: var(--border-radius);
    }
`;
document.head.appendChild(detailsStyles);

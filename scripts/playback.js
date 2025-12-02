class EnhancedPlayback {
    constructor() {
        this.videoPlayer = document.getElementById('video-player');
        this.videoData = null;
        this.sources = [];
        this.currentSource = null;
        this.currentQuality = 'auto';
        this.videoType = null;
        this.currentSeason = null;
        this.currentEpisode = null;
        this.autoQuality = true;
        this.isBuffering = false;
        this.init();
    }

    async init() {
        this.setupDOM();
        this.setupEventListeners();
        this.setupCustomControls();
        await this.loadVideo();
        this.startNetworkMonitoring();
        this.setupBufferOptimization();
    }

    setupDOM() {
        // Video elements
        this.videoPlayer = document.getElementById('video-player');
        this.videoTitle = document.getElementById('video-title');
        this.videoDescription = document.getElementById('video-description');
        this.videoYear = document.getElementById('video-year');
        this.videoRating = document.getElementById('video-rating');
        this.videoDuration = document.getElementById('video-duration');
        this.videoGenre = document.getElementById('video-genre');
        
        // Control elements
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.rewindBtn = document.getElementById('rewind-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.timeDisplay = document.getElementById('time-display');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // New feature elements
        this.castList = document.getElementById('cast-list');
        this.similarList = document.getElementById('similar-list');
        this.trailerContainer = document.getElementById('trailer-container');
        this.episodeList = document.getElementById('episode-list');
        
        // Buttons
        this.qualitySelectorBtn = document.getElementById('quality-selector-btn');
        this.backBtn = document.getElementById('back-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // Modals
        this.qualityModal = document.getElementById('quality-modal');
        this.qualityOptions = document.getElementById('quality-options');
        this.shareModal = document.getElementById('share-modal');
        
        // Initialize video player settings
        this.videoPlayer.preload = 'auto';
        this.videoPlayer.playsInline = true;
        
        // Set default volume
        this.videoPlayer.volume = 1;
    }

    setupEventListeners() {
        // Navigation
        this.backBtn.addEventListener('click', () => window.history.back());
        
        // Modals
        this.qualitySelectorBtn.addEventListener('click', () => {
            this.qualityModal.style.display = 'block';
        });
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                document.getElementById(modalId).style.display = 'none';
            });
        });
        
        // Click outside modal to close
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
        
        // Share functionality
        this.setupShareFunctionality();
    }

    setupCustomControls() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.videoPlayer.addEventListener('click', () => this.togglePlayPause());
        
        // Rewind/Forward
        this.rewindBtn.addEventListener('click', () => this.rewind(10));
        this.forwardBtn.addEventListener('click', () => this.forward(10));
        
        // Volume
        this.volumeSlider.addEventListener('input', (e) => {
            this.videoPlayer.volume = e.target.value;
            this.updateVolumeIcon();
        });
        
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        
        // Progress bar
        this.progressBar.addEventListener('input', (e) => this.seekToTime(e.target.value));
        
        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousEpisode());
        this.nextBtn.addEventListener('click', () => this.nextEpisode());
        
        // Video events
        this.videoPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.videoPlayer.addEventListener('loadeddata', () => this.hideLoading());
        this.videoPlayer.addEventListener('waiting', () => this.showLoading());
        this.videoPlayer.addEventListener('playing', () => this.hideLoading());
        this.videoPlayer.addEventListener('ended', () => this.onVideoEnded());
        this.videoPlayer.addEventListener('error', (e) => this.onVideoError(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async loadVideo() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        this.videoType = urlParams.get('type');
        const season = urlParams.get('season');
        const episode = urlParams.get('episode');
        
        if (!videoId) {
            this.showError('No video ID provided');
            return;
        }
        
        this.showLoading();
        
        try {
            // Load movie info
            this.videoData = await MovieAPI.getMovieInfo(videoId);
            
            if (!this.videoData || !this.videoData.results) {
                throw new Error('Failed to load video data');
            }
            
            // Update UI with video info
            this.updateVideoInfo();
            
            // Load trailers
            await this.loadTrailers(videoId);
            
            // Load cast
            this.loadCast();
            
            // Load similar content
            await this.loadSimilarContent(videoId);
            
            // Load sources
            if (this.videoType === 'movie') {
                await this.loadMovieSources(videoId);
            } else if (this.videoType === 'series') {
                this.currentSeason = season ? parseInt(season) : 1;
                this.currentEpisode = episode ? parseInt(episode) : 1;
                await this.loadSeriesSources(videoId, this.currentSeason, this.currentEpisode);
                this.renderEpisodeList();
            }
            
            // Start playback
            if (this.sources.length > 0) {
                await this.playVideo(this.sources[0].download_url);
            }
            
        } catch (error) {
            console.error('Error loading video:', error);
            this.showError(`Failed to load video: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    updateVideoInfo() {
        const subject = this.videoData.results.subject;
        
        // Update title
        this.videoTitle.textContent = subject.title || 'Unknown Title';
        
        // Update description
        this.videoDescription.textContent = subject.description || 'No description available';
        
        // Update metadata
        if (subject.year) {
            this.videoYear.textContent = subject.year;
            this.videoYear.style.display = 'inline-block';
        }
        
        if (subject.rating) {
            this.videoRating.textContent = `⭐ ${subject.rating}`;
            this.videoRating.style.display = 'inline-block';
        }
        
        if (subject.duration) {
            this.videoDuration.textContent = subject.duration;
            this.videoDuration.style.display = 'inline-block';
        }
        
        if (subject.genre && subject.genre.length > 0) {
            this.videoGenre.textContent = subject.genre[0];
            this.videoGenre.style.display = 'inline-block';
        }
        
        // Update episode info if series
        if (this.videoType === 'series' && this.currentSeason && this.currentEpisode) {
            const episodeInfo = document.getElementById('current-episode-info');
            episodeInfo.textContent = `Season ${this.currentSeason} • Episode ${this.currentEpisode}`;
            episodeInfo.style.display = 'block';
        }
    }

    async loadTrailers(videoId) {
        try {
            // Check if trailer exists in video data
            const subject = this.videoData.results.subject;
            if (subject.trailer && subject.trailer.videoAddress) {
                const trailers = [{
                    title: 'Official Trailer',
                    url: subject.trailer.videoAddress.url,
                    thumbnail: subject.cover?.url || subject.thumbnail,
                    duration: '2:30'
                }];
                
                this.displayTrailers(trailers);
            } else {
                // Fallback: search for trailer using title
                const searchTerm = `${subject.title} trailer`;
                const searchResults = await MovieAPI.searchMovies(searchTerm);
                
                if (searchResults && searchResults.results && searchResults.results.items) {
                    const trailerItems = searchResults.results.items.slice(0, 3);
                    const trailers = trailerItems.map(item => ({
                        title: `${item.title} Trailer`,
                        url: item.trailer?.videoAddress?.url || null,
                        thumbnail: item.cover?.url || item.thumbnail,
                        duration: '2:30'
                    })).filter(t => t.url);
                    
                    this.displayTrailers(trailers);
                } else {
                    this.trailerContainer.innerHTML = '<p class="no-content">No trailers available</p>';
                }
            }
        } catch (error) {
            console.error('Error loading trailers:', error);
            this.trailerContainer.innerHTML = '<p class="no-content">Error loading trailers</p>';
        }
    }

    displayTrailers(trailers) {
        if (!trailers || trailers.length === 0) {
            this.trailerContainer.innerHTML = '<p class="no-content">No trailers available</p>';
            return;
        }
        
        this.trailerContainer.innerHTML = trailers.map((trailer, index) => `
            <div class="trailer-card" data-trailer-url="${trailer.url}">
                <img src="${trailer.thumbnail || '/images/placeholder.jpg'}" 
                     alt="${trailer.title}"
                     onerror="this.src='/images/placeholder.jpg'">
                <div class="trailer-overlay">
                    <div class="play-trailer-btn">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="trailer-info">
                    <h4>${trailer.title}</h4>
                    <span>${trailer.duration}</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for trailers
        this.trailerContainer.querySelectorAll('.trailer-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.dataset.trailerUrl;
                if (url) {
                    this.playTrailer(url);
                }
            });
        });
    }

    playTrailer(url) {
        // Create trailer modal if it doesn't exist
        let trailerModal = document.getElementById('trailer-modal');
        if (!trailerModal) {
            trailerModal = document.createElement('div');
            trailerModal.id = 'trailer-modal';
            trailerModal.className = 'modal entertainment-modal';
            trailerModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-play-circle"></i> Trailer</h3>
                        <button class="close-modal" onclick="this.closest('.modal').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="trailer-player" id="trailer-player"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(trailerModal);
        }
        
        // Set trailer video
        const trailerPlayer = document.getElementById('trailer-player');
        trailerPlayer.innerHTML = `
            <video controls autoplay style="width:100%; border-radius:8px; background:#000;">
                <source src="${url}" type="video/mp4">
                Your browser does not support video playback
            </video>
        `;
        
        // Show modal
        trailerModal.style.display = 'block';
        
        // Close modal when video ends
        const video = trailerPlayer.querySelector('video');
        video.addEventListener('ended', () => {
            trailerModal.style.display = 'none';
        });
    }

    loadCast() {
        const subject = this.videoData.results.subject;
        const cast = subject.cast || [];
        
        if (cast.length === 0) {
            this.castList.innerHTML = '<p class="no-content">No cast information available</p>';
            return;
        }
        
        // Display first 10 cast members
        const displayCast = cast.slice(0, 10);
        
        this.castList.innerHTML = displayCast.map(member => `
            <div class="cast-member">
                <div class="cast-photo">
                    ${member.photo ? 
                        `<img src="${member.photo}" alt="${member.name}" 
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\"fas fa-user\"></i>';" 
                             class="cast-photo-img">` :
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="cast-name">${member.name || 'Unknown'}</div>
                <div class="cast-character">${member.character || 'Actor'}</div>
            </div>
        `).join('');
    }

    async loadSimilarContent(videoId) {
        try {
            const subject = this.videoData.results.subject;
            const title = subject.title;
            
            // Use first genre or title to find similar content
            const searchTerm = subject.genre && subject.genre.length > 0 ? 
                subject.genre[0] : title.split(' ')[0];
            
            const similarData = await MovieAPI.searchMovies(searchTerm);
            
            if (!similarData || !similarData.results || !similarData.results.items) {
                this.similarList.innerHTML = '<p class="no-content">No similar content found</p>';
                return;
            }
            
            // Filter out current video and limit to 6 items
            const currentVideoId = new URLSearchParams(window.location.search).get('id');
            const similarItems = similarData.results.items
                .filter(item => item.subjectId !== currentVideoId)
                .slice(0, 6);
            
            if (similarItems.length === 0) {
                this.similarList.innerHTML = '<p class="no-content">No similar content found</p>';
                return;
            }
            
            this.similarList.innerHTML = similarItems.map(item => {
                const itemType = MovieAPI.isSeries(item) ? 'series' : 'movie';
                return `
                    <div class="similar-item" data-id="${item.subjectId}" data-type="${itemType}">
                        <img src="${item.cover?.url || item.thumbnail || '/images/placeholder.jpg'}" 
                             alt="${item.title}"
                             onerror="this.src='/images/placeholder.jpg'">
                        <div class="similar-item-info">
                            <div class="similar-item-title">${item.title}</div>
                            <div class="similar-item-meta">
                                <span>${item.year || ''}</span>
                                <span>${itemType === 'series' ? 'TV Show' : 'Movie'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click event to similar items
            this.similarList.querySelectorAll('.similar-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.location.href = `playback.html?id=${id}&type=${type}`;
                });
            });
            
        } catch (error) {
            console.error('Error loading similar content:', error);
            this.similarList.innerHTML = '<p class="no-content">Error loading similar content</p>';
        }
    }

    async loadMovieSources(videoId) {
        try {
            const sourcesData = await MovieAPI.getDownloadSources(videoId);
            this.sources = sourcesData.results || [];
            this.populateQualityOptions();
        } catch (error) {
            console.error('Error loading movie sources:', error);
            this.showError('Failed to load video sources');
        }
    }

    async loadSeriesSources(videoId, season, episode) {
        try {
            const sourcesData = await MovieAPI.getDownloadSources(videoId, season, episode);
            this.sources = sourcesData.results || [];
            this.populateQualityOptions();
        } catch (error) {
            console.error('Error loading series sources:', error);
            this.showError('Failed to load episode sources');
        }
    }

    populateQualityOptions() {
        this.qualityOptions.innerHTML = '';
        
        // Add auto quality option
        const autoOption = document.createElement('div');
        autoOption.className = 'quality-option recommended';
        autoOption.innerHTML = `
            <span>Auto (Recommended)</span>
            <span class="quality-badge">Smart</span>
        `;
        autoOption.addEventListener('click', () => {
            this.currentQuality = 'auto';
            this.showNotification('Auto quality enabled');
            this.qualityModal.style.display = 'none';
        });
        this.qualityOptions.appendChild(autoOption);
        
        // Add available quality options
        this.sources.forEach(source => {
            const option = document.createElement('div');
            option.className = 'quality-option';
            option.innerHTML = `
                <span>${source.quality.toUpperCase()}</span>
                <span class="quality-badge">${source.format || 'MP4'}</span>
            `;
            option.addEventListener('click', () => {
                this.switchToQuality(source);
                this.qualityModal.style.display = 'none';
            });
            this.qualityOptions.appendChild(option);
        });
    }

    async switchToQuality(source) {
        const currentTime = this.videoPlayer.currentTime;
        const wasPlaying = !this.videoPlayer.paused;
        
        this.showLoading();
        this.currentQuality = source.quality;
        this.currentSource = source;
        
        try {
            // Change video source
            this.videoPlayer.src = source.download_url;
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.videoPlayer.addEventListener('loadeddata', resolve, { once: true });
            });
            
            // Restore playback position
            this.videoPlayer.currentTime = currentTime;
            
            if (wasPlaying) {
                await this.videoPlayer.play();
            }
            
            // Update UI
            document.getElementById('current-quality')?.textContent = source.quality;
            document.getElementById('playback-quality')?.textContent = source.quality;
            
            this.showNotification(`Switched to ${source.quality}`);
            
        } catch (error) {
            console.error('Error switching quality:', error);
            this.showError('Failed to switch quality');
        } finally {
            this.hideLoading();
        }
    }

    renderEpisodeList() {
        if (this.videoType !== 'series') {
            this.episodeList.style.display = 'none';
            return;
        }
        
        const subject = this.videoData.results.subject;
        const seasons = subject.seasons || [];
        
        if (seasons.length === 0) {
            this.episodeList.innerHTML = '<p class="no-content">No episodes available</p>';
            return;
        }
        
        this.episodeList.innerHTML = seasons.map((season, seasonIndex) => {
            const seasonNum = seasonIndex + 1;
            const episodes = season.episodes || [];
            
            return `
                <div class="season">
                    <div class="season-header" data-season="${seasonNum}">
                        <h3>Season ${seasonNum}</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="season-content" id="season-${seasonNum}">
                        <div class="episodes">
                            ${episodes.map((episode, epIndex) => {
                                const epNum = epIndex + 1;
                                const isActive = seasonNum === this.currentSeason && epNum === this.currentEpisode;
                                
                                return `
                                    <button class="episode ${isActive ? 'active' : ''}" 
                                            data-season="${seasonNum}" 
                                            data-episode="${epNum}">
                                        Episode ${epNum}
                                        ${episode.title ? `<span class="episode-title">${episode.title}</span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        this.episodeList.querySelectorAll('.season-header').forEach(header => {
            header.addEventListener('click', () => {
                const seasonNum = header.dataset.season;
                this.toggleSeason(seasonNum);
            });
        });
        
        this.episodeList.querySelectorAll('.episode').forEach(episode => {
            episode.addEventListener('click', async () => {
                const season = parseInt(episode.dataset.season);
                const episodeNum = parseInt(episode.dataset.episode);
                
                await this.loadEpisode(season, episodeNum);
            });
        });
        
        // Open current season
        if (this.currentSeason) {
            this.toggleSeason(this.currentSeason, true);
        }
    }

    toggleSeason(seasonNum, forceOpen = false) {
        const seasonContent = document.getElementById(`season-${seasonNum}`);
        const seasonHeader = document.querySelector(`.season-header[data-season="${seasonNum}"]`);
        
        if (forceOpen || !seasonContent.classList.contains('active')) {
            // Close all other seasons
            this.episodeList.querySelectorAll('.season-content').forEach(content => {
                content.classList.remove('active');
            });
            this.episodeList.querySelectorAll('.season-header').forEach(header => {
                header.classList.remove('active');
            });
            
            // Open selected season
            seasonContent.classList.add('active');
            seasonHeader.classList.add('active');
        } else {
            seasonContent.classList.remove('active');
            seasonHeader.classList.remove('active');
        }
    }

    async loadEpisode(season, episode) {
        if (season === this.currentSeason && episode === this.currentEpisode) {
            return; // Already playing this episode
        }
        
        this.showLoading();
        
        try {
            const videoId = new URLSearchParams(window.location.search).get('id');
            await this.loadSeriesSources(videoId, season, episode);
            
            this.currentSeason = season;
            this.currentEpisode = episode;
            
            // Update episode info
            const episodeInfo = document.getElementById('current-episode-info');
            episodeInfo.textContent = `Season ${season} • Episode ${episode}`;
            episodeInfo.style.display = 'block';
            
            // Update URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('season', season);
            newUrl.searchParams.set('episode', episode);
            window.history.replaceState({}, '', newUrl);
            
            // Highlight active episode
            this.episodeList.querySelectorAll('.episode').forEach(ep => {
                ep.classList.remove('active');
            });
            
            const activeEpisode = this.episodeList.querySelector(
                `.episode[data-season="${season}"][data-episode="${episode}"]`
            );
            if (activeEpisode) {
                activeEpisode.classList.add('active');
            }
            
            // Play video
            if (this.sources.length > 0) {
                await this.playVideo(this.sources[0].download_url);
            }
            
        } catch (error) {
            console.error('Error loading episode:', error);
            this.showError('Failed to load episode');
        } finally {
            this.hideLoading();
        }
    }

    async playVideo(url) {
        try {
            this.videoPlayer.src = url;
            
            // Wait for video to load
            await new Promise((resolve, reject) => {
                this.videoPlayer.addEventListener('loadeddata', resolve, { once: true });
                this.videoPlayer.addEventListener('error', reject, { once: true });
            });
            
            // Attempt to play
            await this.videoPlayer.play();
            
            // Hide overlay if exists
            const overlay = document.querySelector('.premium-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error playing video:', error);
            
            // If autoplay is blocked, show play button
            if (error.name === 'NotAllowedError') {
                this.showNotification('Click play to start video');
                const overlay = document.querySelector('.premium-overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
            } else {
                this.showError('Failed to play video. Please try a different quality.');
            }
        }
    }

    setupBufferOptimization() {
        // Pre-buffer next segments
        this.videoPlayer.addEventListener('progress', () => {
            if (this.videoPlayer.buffered.length > 0) {
                const bufferedEnd = this.videoPlayer.buffered.end(0);
                const currentTime = this.videoPlayer.currentTime;
                const bufferAhead = bufferedEnd - currentTime;
                
                // If buffer is less than 10 seconds, show loading
                if (bufferAhead < 10 && !this.videoPlayer.paused) {
                    this.showLoading();
                }
            }
        });
        
        // Adjust quality based on network
        this.setupAdaptiveBitrate();
    }

    setupAdaptiveBitrate() {
        let networkSpeed = 1; // Default Mbps
        let bufferStarvationCount = 0;
        
        // Monitor buffer health
        this.videoPlayer.addEventListener('waiting', () => {
            bufferStarvationCount++;
            
            // If buffering occurs frequently, switch to lower quality
            if (bufferStarvationCount >= 2 && this.autoQuality && this.sources.length > 1) {
                this.switchToLowerQuality();
                bufferStarvationCount = 0;
            }
            
            this.showLoading();
        });
        
        this.videoPlayer.addEventListener('playing', () => {
            this.hideLoading();
        });
    }

    switchToLowerQuality() {
        const qualityOrder = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1, 'auto': 0 };
        const currentQualityIndex = qualityOrder[this.currentQuality] || 0;
        
        // Find next lower quality
        for (let i = this.sources.length - 1; i >= 0; i--) {
            const source = this.sources[i];
            const sourceQualityIndex = qualityOrder[source.quality] || 0;
            
            if (sourceQualityIndex < currentQualityIndex) {
                this.switchToQuality(source);
                this.showNotification(`Switched to ${source.quality} for smoother playback`);
                break;
            }
        }
    }

    startNetworkMonitoring() {
        if (navigator.connection) {
            const connection = navigator.connection;
            
            connection.addEventListener('change', () => {
                this.updateNetworkStatus();
            });
            
            this.updateNetworkStatus();
        }
    }

    updateNetworkStatus() {
        if (!navigator.connection) return;
        
        const connection = navigator.connection;
        const downlink = connection.downlink || 5;
        const effectiveType = connection.effectiveType || '4g';
        const statusEl = document.getElementById('network-status');
        
        if (statusEl) {
            if (downlink > 10) {
                statusEl.textContent = 'Excellent Connection';
                statusEl.style.color = '#08d9d6';
            } else if (downlink > 5) {
                statusEl.textContent = 'Good Connection';
                statusEl.style.color = '#ffde7d';
            } else if (downlink > 2) {
                statusEl.textContent = 'Fair Connection';
                statusEl.style.color = '#ffa500';
            } else {
                statusEl.textContent = 'Slow Connection';
                statusEl.style.color = '#ff2e63';
            }
        }
    }

    // Control Methods
    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.videoPlayer.play();
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.videoPlayer.pause();
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    rewind(seconds) {
        this.videoPlayer.currentTime = Math.max(0, this.videoPlayer.currentTime - seconds);
    }

    forward(seconds) {
        this.videoPlayer.currentTime = Math.min(
            this.videoPlayer.duration,
            this.videoPlayer.currentTime + seconds
        );
    }

    toggleMute() {
        this.videoPlayer.muted = !this.videoPlayer.muted;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volume = this.videoPlayer.muted ? 0 : this.videoPlayer.volume;
        let icon = 'fa-volume-up';
        
        if (volume === 0) {
            icon = 'fa-volume-mute';
        } else if (volume < 0.5) {
            icon = 'fa-volume-down';
        }
        
        this.volumeBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.volumeSlider.value = volume;
    }

    seekToTime(percent) {
        const time = (percent / 100) * this.videoPlayer.duration;
        this.videoPlayer.currentTime = time;
    }

    updateProgress() {
        if (this.videoPlayer.duration) {
            const percent = (this.videoPlayer.currentTime / this.videoPlayer.duration) * 100;
            this.progressBar.value = percent;
            
            const currentTime = this.formatTime(this.videoPlayer.currentTime);
            const duration = this.formatTime(this.videoPlayer.duration);
            this.timeDisplay.textContent = `${currentTime} / ${duration}`;
        }
    }

    toggleFullscreen() {
        const videoWrapper = this.videoPlayer.parentElement;
        
        if (!document.fullscreenElement) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) {
                videoWrapper.webkitRequestFullscreen();
            }
            this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // Navigation Methods
    async previousEpisode() {
        if (this.videoType !== 'series') return;
        
        if (this.currentEpisode > 1) {
            await this.loadEpisode(this.currentSeason, this.currentEpisode - 1);
        } else if (this.currentSeason > 1) {
            // Go to previous season's last episode
            const prevSeason = this.currentSeason - 1;
            // We need to know how many episodes in previous season
            // For now, go to episode 1
            await this.loadEpisode(prevSeason, 1);
        }
    }

    async nextEpisode() {
        if (this.videoType !== 'series') return;
        
        // Get total episodes in current season
        const subject = this.videoData.results.subject;
        const currentSeasonData = subject.seasons?.[this.currentSeason - 1];
        const totalEpisodes = currentSeasonData?.episodes?.length || 0;
        
        if (this.currentEpisode < totalEpisodes) {
            await this.loadEpisode(this.currentSeason, this.currentEpisode + 1);
        } else if (subject.seasons?.length > this.currentSeason) {
            // Go to next season's first episode
            await this.loadEpisode(this.currentSeason + 1, 1);
        }
    }

    // Event Handlers
    onVideoEnded() {
        if (this.videoType === 'series') {
            // Auto-play next episode after 3 seconds
            setTimeout(() => {
                this.nextEpisode();
            }, 3000);
        }
    }

    onVideoError(e) {
        console.error('Video error:', e);
        
        switch(e.target.error.code) {
            case e.target.error.MEDIA_ERR_NETWORK:
                this.showError('Network error. Please check your connection.');
                break;
            case e.target.error.MEDIA_ERR_DECODE:
                this.showError('Video format error. Try a different quality.');
                break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                this.showError('Video format not supported.');
                break;
            default:
                this.showError('Playback error. Please try again.');
        }
    }

    // Utility Methods
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading() {
        this.isBuffering = true;
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('show');
        }
    }

    hideLoading() {
        this.isBuffering = false;
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('show');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification show';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff2e63' : '#08d9d6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 3000;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    handleKeyboardShortcuts(e) {
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'f':
                this.toggleFullscreen();
                break;
            case 'm':
                this.toggleMute();
                break;
            case 'arrowleft':
                e.preventDefault();
                this.rewind(5);
                break;
            case 'arrowright':
                e.preventDefault();
                this.forward(5);
                break;
        }
    }

    setupShareFunctionality() {
        const shareBtn = document.getElementById('share-btn');
        if (!shareBtn) return;
        
        shareBtn.addEventListener('click', () => {
            this.shareModal.style.display = 'block';
            this.setupShareOptions();
        });
    }

    setupShareOptions() {
        const currentUrl = window.location.href;
        const title = this.videoTitle.textContent;
        
        // Set share URL input
        const urlInput = document.getElementById('share-url-input');
        if (urlInput) {
            urlInput.value = currentUrl;
        }
        
        // Copy URL button
        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                    this.showNotification('Link copied to clipboard!');
                });
            });
        }
        
        // Social share buttons
        const shareOptions = document.querySelectorAll('.share-option');
        shareOptions.forEach(option => {
            option.addEventListener('click', () => {
                const platform = option.dataset.platform;
                this.shareToPlatform(platform, currentUrl, title);
            });
        });
    }

    shareToPlatform(platform, url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Link copied to clipboard!');
                });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    }
    
    // Initialize playback system
    const playback = new EnhancedPlayback();
    window.playback = playback;
});

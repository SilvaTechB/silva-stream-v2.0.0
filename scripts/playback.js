class Playback {
    constructor() {
        this.sources = [];
        this.subtitles = [];
        this.currentSeason = null;
        this.currentEpisode = null;
        this.videoType = null;
        this.videoData = null;
        this.isPlaying = false;
        this.isFullscreen = false;
        this.controlsVisible = true;
        this.controlsTimeout = null;
        this.currentSubtitle = null;
        this.activeTextTrack = null;
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.setupCustomControls();
        this.loadVideo();
    }

    setupDOM() {
        // Existing elements
        this.videoPlayer = document.getElementById('video-player');
        this.videoTitle = document.getElementById('video-title');
        this.videoDescription = document.getElementById('video-description');
        this.videoYear = document.getElementById('video-year');
        this.videoRating = document.getElementById('video-rating');
        this.videoDuration = document.getElementById('video-duration');
        this.videoGenre = document.getElementById('video-genre');
        this.currentEpisodeInfo = document.getElementById('current-episode-info');
        this.qualitySelectorBtn = document.getElementById('quality-selector-btn');
        this.backBtn = document.getElementById('back-btn');
        this.episodeList = document.getElementById('episode-list');
        this.playlistWrapper = document.getElementById('playlist-wrapper');
        this.qualityModal = document.getElementById('quality-modal');
        this.qualityOptions = document.getElementById('quality-options');
        this.closeModalBtn = document.querySelector('.close-modal');

        // Custom controls elements
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.progressBar = document.getElementById('progress-bar');
        this.progressTime = document.getElementById('progress-time');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.rewindBtn = document.getElementById('rewind-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.downloadBtn = document.getElementById('download-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.timeDisplay = document.getElementById('time-display');
        this.customControls = document.querySelector('.custom-controls');
        
        // New elements
        this.subtitlesBtn = document.getElementById('subtitles-btn');
        this.shareBtn = document.getElementById('share-btn');
        this.subtitlesModal = document.getElementById('subtitles-modal');
        this.subtitlesOptions = document.getElementById('subtitles-options');
        this.shareModal = document.getElementById('share-modal');
        this.shareUrlInput = document.getElementById('share-url-input');
        this.copyUrlBtn = document.getElementById('copy-url-btn');
        this.castList = document.getElementById('cast-list');
        this.similarList = document.getElementById('similar-list');
    }

    setupEvents() {
        // Existing events
        this.backBtn.addEventListener('click', () => {
            window.history.back();
        });

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

        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    setupCustomControls() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.videoPlayer.addEventListener('click', () => this.togglePlayPause());

        // Progress bar
        this.progressBar.addEventListener('input', () => this.seekVideo());
        this.progressBar.addEventListener('mousedown', () => this.pauseVideo());
        this.progressBar.addEventListener('mouseup', () => {
            if (this.isPlaying) this.playVideo();
        });

        // Rewind/Forward
        this.rewindBtn.addEventListener('click', () => this.rewind(10));
        this.forwardBtn.addEventListener('click', () => this.forward(10));

        // Volume
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.volumeBtn.addEventListener('click', () => this.toggleMute());

        // Download
        this.downloadBtn.addEventListener('click', () => this.downloadVideo());

        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousContent());
        this.nextBtn.addEventListener('click', () => this.nextContent());

        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Subtitles
        this.subtitlesBtn.addEventListener('click', () => this.showSubtitlesModal());

        // Share
        this.shareBtn.addEventListener('click', () => this.showShareModal());

        // Video events
        this.videoPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.videoPlayer.addEventListener('loadeddata', () => this.hideLoading());
        this.videoPlayer.addEventListener('waiting', () => this.showLoading());
        this.videoPlayer.addEventListener('playing', () => this.hideLoading());
        this.videoPlayer.addEventListener('ended', () => this.videoEnded());

        // Controls visibility
        this.videoPlayer.addEventListener('mousemove', () => this.showControls());
        this.videoPlayer.addEventListener('mouseleave', () => this.hideControls());
        this.customControls.addEventListener('mousemove', () => this.showControls());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadVideo() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        this.videoType = urlParams.get('type');
        const season = urlParams.get('season');
        const episode = urlParams.get('episode');

        if (!videoId || !this.videoType) {
            console.error('No video ID or type specified');
            return;
        }

        this.showLoading();
        try {
            this.videoData = await MovieAPI.getMovieInfo(videoId);
            
            if (!this.videoData || !this.videoData.results) {
                console.error('Failed to load video data');
                return;
            }

            this.updateVideoInfo();
            this.loadCastMembers();
            this.loadSimilarContent(videoId);

            // Load sources and subtitles
            if (this.videoType === 'movie') {
                this.playlistWrapper.style.display = 'none';
                this.prevBtn.style.display = 'none';
                this.nextBtn.style.display = 'none';
                const sourcesData = await MovieAPI.getDownloadSources(videoId);
                this.sources = sourcesData.results || [];
                this.subtitles = sourcesData.subtitles || [];
                this.populateQualityOptions();
                this.populateSubtitlesOptions();
                if (this.sources.length > 0) {
                    this.playVideo(this.sources[0].download_url);
                }
            } else if (this.videoType === 'series') {
                const seasons = this.videoData.results.resource?.seasons || [];
                this.renderSeasonDropdowns(seasons);

                if (season && episode) {
                    this.currentSeason = parseInt(season);
                    this.currentEpisode = parseInt(episode);
                    this.updateCurrentEpisodeInfo();
                    const sourcesData = await MovieAPI.getDownloadSources(videoId, season, episode);
                    this.sources = sourcesData.results || [];
                    this.subtitles = sourcesData.subtitles || [];
                    this.populateQualityOptions();
                    this.populateSubtitlesOptions();
                    if (this.sources.length > 0) {
                        this.playVideo(this.sources[0].download_url);
                    }
                    this.highlightCurrentEpisode();
                    this.openSeasonDropdown(this.currentSeason);
                }

                this.prevBtn.style.display = 'flex';
                this.nextBtn.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading video:', error);
        }
    }

    updateVideoInfo() {
        const subject = this.videoData.results.subject;
        this.videoTitle.textContent = subject.title;
        this.videoDescription.textContent = subject.description || 'No description available.';
        
        // Update meta information
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
    }

    loadCastMembers() {
        const subject = this.videoData.results.subject;
        const cast = subject.cast || [];
        
        if (cast.length === 0) {
            this.castList.innerHTML = '<p>No cast information available.</p>';
            return;
        }

        this.castList.innerHTML = cast.map(member => `
            <div class="cast-member">
                <div class="cast-photo">
                    ${member.photo ? 
                        `<img src="${member.photo}" alt="${member.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\"fas fa-user\"></i>';" class="cast-photo">` :
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="cast-name">${member.name}</div>
                <div class="cast-character">${member.character || 'Actor'}</div>
            </div>
        `).join('');
    }

    async loadSimilarContent(videoId) {
        try {
            // Since we don't have a specific similar content API endpoint,
            // we'll use search with the video title to find similar content
            const title = this.videoData.results.subject.title;
            const searchWords = title.split(' ').slice(0, 2).join(' ');
            const similarData = await MovieAPI.searchMovies(searchWords);
            this.renderSimilarContent(similarData);
        } catch (error) {
            console.error('Error loading similar content:', error);
            this.similarList.innerHTML = '<p>No similar content found.</p>';
        }
    }

    renderSimilarContent(similarData) {
        if (!similarData || !similarData.results || similarData.results.length === 0) {
            this.similarList.innerHTML = '<p>No similar content found.</p>';
            return;
        }

        // Filter out the current video and limit to 6 items
        const currentVideoId = new URLSearchParams(window.location.search).get('id');
        const similarItems = similarData.results
            .filter(item => item.id !== currentVideoId)
            .slice(0, 6);

        if (similarItems.length === 0) {
            this.similarList.innerHTML = '<p>No similar content found.</p>';
            return;
        }

        this.similarList.innerHTML = similarItems.map(item => {
            const itemType = MovieAPI.isSeries(item) ? 'series' : 'movie';
            return `
                <div class="similar-item" data-id="${item.id}" data-type="${itemType}">
                    <img src="${item.cover || item.poster || '/images/placeholder.jpg'}" 
                         alt="${item.title}" 
                         onerror="this.src='/images/placeholder.jpg'">
                    <div class="similar-item-info">
                        <div class="similar-item-title">${item.title}</div>
                        <div class="similar-item-year">${item.year || ''}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to similar items
        this.similarList.querySelectorAll('.similar-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const type = item.dataset.type;
                window.location.href = `playback.html?id=${id}&type=${type}`;
            });
        });
    }

    populateSubtitlesOptions() {
        // Clear existing options except "Subtitles Off"
        const existingOptions = this.subtitlesOptions.querySelectorAll('.subtitle-option:not([data-lan="off"])');
        existingOptions.forEach(option => option.remove());

        // Add subtitle options
        if (this.subtitles && this.subtitles.length > 0) {
            this.subtitlesOptions.innerHTML += this.subtitles.map(subtitle => `
                <div class="subtitle-option" data-lan="${subtitle.lan}" data-url="${subtitle.url}">
                    <span class="subtitle-lan">${subtitle.lanName} (${subtitle.lan})</span>
                </div>
            `).join('');
        }

        // Add event listeners to subtitle options
        this.subtitlesOptions.querySelectorAll('.subtitle-option').forEach(option => {
            option.addEventListener('click', () => {
                const lan = option.dataset.lan;
                const url = option.dataset.url;
                
                // Remove active class from all options
                this.subtitlesOptions.querySelectorAll('.subtitle-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Add active class to selected option
                option.classList.add('active');
                
                if (lan === 'off') {
                    this.disableSubtitles();
                } else {
                    this.loadSubtitle(url, lan);
                }
                
                this.subtitlesModal.style.display = 'none';
            });
        });

        // Set "Subtitles Off" as active by default
        const offOption = this.subtitlesOptions.querySelector('.subtitle-option[data-lan="off"]');
        if (offOption) {
            offOption.classList.add('active');
        }
    }

    async loadSubtitle(url, lan) {
        try {
            // Convert SRT to VTT format
            const response = await fetch(url);
            const srtContent = await response.text();
            const vttContent = this.convertSrtToVtt(srtContent);
            
            // Create blob URL for VTT content
            const blob = new Blob([vttContent], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(blob);
            
            // Remove existing track if any
            if (this.activeTextTrack) {
                this.videoPlayer.removeChild(this.activeTextTrack);
            }
            
            // Create new track element
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.src = vttUrl;
            track.srclang = lan;
            track.label = this.getLanguageName(lan);
            track.default = true;
            
            this.videoPlayer.appendChild(track);
            this.activeTextTrack = track;
            
            // Enable subtitles
            this.videoPlayer.textTracks[0].mode = 'showing';
            this.currentSubtitle = lan;
            
            // Update subtitles button appearance
            this.subtitlesBtn.classList.add('active');
            
        } catch (error) {
            console.error('Error loading subtitle:', error);
        }
    }

    disableSubtitles() {
        if (this.activeTextTrack) {
            this.videoPlayer.removeChild(this.activeTextTrack);
            this.activeTextTrack = null;
        }
        
        this.currentSubtitle = null;
        this.subtitlesBtn.classList.remove('active');
        
        // Disable all text tracks
        for (let i = 0; i < this.videoPlayer.textTracks.length; i++) {
            this.videoPlayer.textTracks[i].mode = 'disabled';
        }
    }

    convertSrtToVtt(srtContent) {
        // Basic SRT to VTT conversion
        let vttContent = 'WEBVTT\n\n';
        vttContent += srtContent
            .replace(/\r\n/g, '\n')
            .replace(/\n\r/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$2 --> $3')
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        
        return vttContent;
    }

    getLanguageName(lan) {
        const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'tr': 'Turkish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'pl': 'Polish',
            'in_id': 'Indonesian',
            'ms': 'Malay',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'fil': 'Filipino',
            'sw': 'Swahili',
            'bn': 'Bengali',
            'pa': 'Punjabi',
            'ur': 'Urdu',
            'fa': 'Persian'
        };
        
        return languageNames[lan] || lan;
    }

    showSubtitlesModal() {
        this.subtitlesModal.style.display = 'block';
    }

    showShareModal() {
        // Set current URL in share input
        this.shareUrlInput.value = window.location.href;
        this.shareModal.style.display = 'block';
        
        // Setup share options
        this.setupShareOptions();
    }

    setupShareOptions() {
        const currentUrl = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.videoTitle.textContent);
        
        // Copy link
        document.getElementById('copy-link').addEventListener('click', () => {
            this.copyToClipboard(window.location.href);
        });
        
        // WhatsApp
        document.getElementById('share-whatsapp').addEventListener('click', () => {
            window.open(`https://wa.me/?text=${title}%20${currentUrl}`, '_blank');
        });
        
        // Facebook
        document.getElementById('share-facebook').addEventListener('click', () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, '_blank');
        });
        
        // Twitter
        document.getElementById('share-twitter').addEventListener('click', () => {
            window.open(`https://twitter.com/intent/tweet?text=${title}&url=${currentUrl}`, '_blank');
        });
        
        // Telegram
        document.getElementById('share-telegram').addEventListener('click', () => {
            window.open(`https://t.me/share/url?url=${currentUrl}&text=${title}`, '_blank');
        });
        
        // Copy URL button
        this.copyUrlBtn.addEventListener('click', () => {
            this.copyToClipboard(window.location.href);
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Link copied to clipboard!');
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            z-index: 3000;
            box-shadow: var(--shadow);
            transition: var(--transition);
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Custom Controls Methods
    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.playVideo();
        } else {
            this.pauseVideo();
        }
    }

    playVideo(url = null) {
        if (url) {
            this.videoPlayer.src = url;
        }
        this.videoPlayer.play();
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    pauseVideo() {
        this.videoPlayer.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    seekVideo() {
        const seekTime = (this.progressBar.value / 100) * this.videoPlayer.duration;
        this.videoPlayer.currentTime = seekTime;
    }

    updateProgress() {
        if (this.videoPlayer.duration) {
            const progress = (this.videoPlayer.currentTime / this.videoPlayer.duration) * 100;
            this.progressBar.value = progress;
            
            const currentTime = this.formatTime(this.videoPlayer.currentTime);
            const duration = this.formatTime(this.videoPlayer.duration);
            
            this.progressTime.textContent = `${currentTime} / ${duration}`;
            this.timeDisplay.textContent = `${currentTime} / ${duration}`;
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

    setVolume() {
        this.videoPlayer.volume = this.volumeSlider.value;
        this.updateVolumeIcon();
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

    downloadVideo() {
        if (this.videoPlayer.src) {
            const a = document.createElement('a');
            a.href = this.videoPlayer.src;
            a.download = `${this.videoTitle.textContent}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    previousContent() {
        if (this.videoType === 'series' && this.currentEpisode > 1) {
            this.currentEpisode--;
            this.loadEpisode(this.currentSeason, this.currentEpisode);
        }
    }

    nextContent() {
        if (this.videoType === 'series') {
            const currentSeasonData = this.videoData.results.resource.seasons[this.currentSeason - 1];
            if (this.currentEpisode < currentSeasonData.maxEp) {
                this.currentEpisode++;
                this.loadEpisode(this.currentSeason, this.currentEpisode);
            } else if (this.currentSeason < this.videoData.results.resource.seasons.length) {
                this.currentSeason++;
                this.currentEpisode = 1;
                this.loadEpisode(this.currentSeason, this.currentEpisode);
            }
        }
    }

    async loadEpisode(season, episode) {
        this.showLoading();
        const videoId = new URLSearchParams(window.location.search).get('id');
        const sourcesData = await MovieAPI.getDownloadSources(videoId, season, episode);
        this.sources = sourcesData.results || [];
        this.subtitles = sourcesData.subtitles || [];
        this.currentSeason = season;
        this.currentEpisode = episode;
        this.updateCurrentEpisodeInfo();
        this.highlightCurrentEpisode();
        this.populateQualityOptions();
        this.populateSubtitlesOptions();
        
        if (this.sources.length > 0) {
            this.playVideo(this.sources[0].download_url);
        }
        
        // Update URL without reloading
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('season', season);
        newUrl.searchParams.set('episode', episode);
        window.history.replaceState({}, '', newUrl);
    }

    toggleFullscreen() {
        const videoWrapper = this.videoPlayer.parentElement;
        
        if (!this.isFullscreen) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) {
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) {
                videoWrapper.msRequestFullscreen();
            }
            this.isFullscreen = true;
            this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    showLoading() {
        this.loadingSpinner.classList.add('show');
    }

    hideLoading() {
        this.loadingSpinner.classList.remove('show');
    }

    showControls() {
        this.customControls.classList.add('show-controls');
        clearTimeout(this.controlsTimeout);
        this.controlsTimeout = setTimeout(() => this.hideControls(), 3000);
    }

    hideControls() {
        if (this.isPlaying) {
            this.customControls.classList.remove('show-controls');
        }
    }

    videoEnded() {
        if (this.videoType === 'series') {
            // Auto-play next episode
            setTimeout(() => this.nextContent(), 2000);
        }
    }

    handleKeyboard(e) {
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
            case 'c':
                e.preventDefault();
                this.showSubtitlesModal();
                break;
            case 'arrowleft':
                e.preventDefault();
                this.rewind(5);
                break;
            case 'arrowright':
                e.preventDefault();
                this.forward(5);
                break;
            case 'j':
                this.rewind(10);
                break;
            case 'l':
                this.forward(10);
                break;
        }
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Existing methods for seasons and episodes
    renderSeasonDropdowns(seasons) {
        this.episodeList.innerHTML = seasons.map((season, seasonIndex) => {
            const seasonNumber = seasonIndex + 1;
            return `
                <div class="season">
                    <div class="season-header" data-season="${seasonNumber}">
                        <h3>Season ${seasonNumber}</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="season-content" id="season-${seasonNumber}">
                        <div class="episodes">
                            ${[...Array(season.maxEp).keys()].map(episodeIndex => {
                                const episodeNumber = episodeIndex + 1;
                                return `
                                    <button class="episode" data-season="${seasonNumber}" data-episode="${episodeNumber}">
                                        Episode ${episodeNumber}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to season headers
        this.episodeList.querySelectorAll('.season-header').forEach(header => {
            header.addEventListener('click', () => {
                const seasonNumber = header.dataset.season;
                this.toggleSeasonDropdown(seasonNumber);
            });
        });

        // Add event listeners to episodes
        this.episodeList.querySelectorAll('.episode').forEach(episodeEl => {
            episodeEl.addEventListener('click', async () => {
                const season = episodeEl.dataset.season;
                const episodeNumber = episodeEl.dataset.episode;
                
                this.currentSeason = parseInt(season);
                this.currentEpisode = parseInt(episodeNumber);
                this.updateCurrentEpisodeInfo();
                this.highlightCurrentEpisode();
                
                const sourcesData = await MovieAPI.getDownloadSources(
                    new URLSearchParams(window.location.search).get('id'), 
                    season, 
                    episodeNumber
                );
                this.sources = sourcesData.results || [];
                this.subtitles = sourcesData.subtitles || [];
                this.populateQualityOptions();
                this.populateSubtitlesOptions();
                
                if (this.sources.length > 0) {
                    this.playVideo(this.sources[0].download_url);
                }
            });
        });
    }

    toggleSeasonDropdown(seasonNumber) {
        const seasonContent = document.getElementById(`season-${seasonNumber}`);
        const seasonHeader = document.querySelector(`.season-header[data-season="${seasonNumber}"]`);
        
        this.episodeList.querySelectorAll('.season-content').forEach(content => {
            if (content.id !== `season-${seasonNumber}`) {
                content.classList.remove('active');
                content.previousElementSibling.classList.remove('active');
            }
        });
        
        seasonContent.classList.toggle('active');
        seasonHeader.classList.toggle('active');
    }

    openSeasonDropdown(seasonNumber) {
        const seasonContent = document.getElementById(`season-${seasonNumber}`);
        const seasonHeader = document.querySelector(`.season-header[data-season="${seasonNumber}"]`);
        
        seasonContent.classList.add('active');
        seasonHeader.classList.add('active');
    }

    updateCurrentEpisodeInfo() {
        if (this.videoType === 'series' && this.currentSeason && this.currentEpisode) {
            this.currentEpisodeInfo.textContent = `Season ${this.currentSeason} • Episode ${this.currentEpisode}`;
            this.currentEpisodeInfo.classList.add('active');
        }
    }

    highlightCurrentEpisode() {
        this.episodeList.querySelectorAll('.episode').forEach(ep => {
            ep.classList.remove('active');
        });
        
        const currentEpisodeEl = this.episodeList.querySelector(
            `.episode[data-season="${this.currentSeason}"][data-episode="${this.currentEpisode}"]`
        );
        
        if (currentEpisodeEl) {
            currentEpisodeEl.classList.add('active');
        }
    }

    populateQualityOptions() {
        this.qualityOptions.innerHTML = this.sources.map(source => `
            <div class="quality-option" data-url="${source.download_url}">
                ${source.quality}
            </div>
        `).join('');

        this.qualityOptions.querySelectorAll('.quality-option').forEach(option => {
            option.addEventListener('click', () => {
                this.playVideo(option.dataset.url);
                this.qualityModal.style.display = 'none';
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Playback();
});

// Handle fullscreen changes
document.addEventListener('fullscreenchange', () => {
    const playback = document.querySelector('.playback-container')?.playbackInstance;
    if (playback) {
        playback.isFullscreen = !playback.isFullscreen;
    }
});

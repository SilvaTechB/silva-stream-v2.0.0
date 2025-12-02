// Video Player Management
class VideoPlayer {
    constructor() {
        this.videoPlayer = document.getElementById('video-player');
        this.playerContainer = document.getElementById('player-container');
        this.playerTitle = document.getElementById('player-title');
        this.closePlayer = document.getElementById('close-player');
        
        this.initEvents();
    }

    initEvents() {
        if (this.closePlayer) {
            this.closePlayer.addEventListener('click', () => this.close());
        }
        
        // Close player when clicking outside (optional)
        if (this.playerContainer) {
            this.playerContainer.addEventListener('click', (e) => {
                if (e.target === this.playerContainer) {
                    this.close();
                }
            });
        }

        // Close player with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.playerContainer.classList.contains('active')) {
                this.close();
            }
        });
    }

    play(sourceUrl, title) {
        if (!this.videoPlayer || !this.playerContainer) return;
        
        // Set video source
        this.videoPlayer.src = sourceUrl;
        
        // Set title
        if (title && this.playerTitle) {
            this.playerTitle.textContent = title;
        }
        
        // Show player
        this.playerContainer.classList.add('active');
        
        // Scroll to player
        this.playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto play with error handling
        const playPromise = this.videoPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Auto-play prevented:', error);
                // Show custom play button or instructions if needed
            });
        }
    }

    close() {
        if (!this.videoPlayer || !this.playerContainer) return;
        
        this.playerContainer.classList.remove('active');
        this.videoPlayer.pause();
        this.videoPlayer.src = '';
    }

    // Find playable source from API response
    findPlayableSource(sources) {
        if (!sources) return null;

        // Check if sources has results array
        if (sources.results && Array.isArray(sources.results)) {
            const source = sources.results.find(s => 
                s.download_url && (s.download_url.includes('.mp4') || s.download_url.includes('.m3u8'))
            );
            if (source) return source;
        }
        
        // Check if sources is an array
        if (Array.isArray(sources)) {
            const source = sources.find(s => 
                s.download_url && (s.download_url.includes('.mp4') || s.download_url.includes('.m3u8'))
            );
            if (source) return source;
        }
        
        return null;
    }

    // Get available qualities from sources
    getAvailableQualities(sources) {
        if (!sources) return [];

        let sourcesArray = [];
        
        if (sources.results && Array.isArray(sources.results)) {
            sourcesArray = sources.results;
        } else if (Array.isArray(sources)) {
            sourcesArray = sources;
        }

        return sourcesArray
            .filter(source => source.download_url && this.isStreamableFormat(source.format))
            .map(source => ({
                quality: source.quality || 'Unknown',
                url: source.download_url,
                format: source.format || 'mp4',
                size: source.size
            }))
            .sort((a, b) => {
                const qualityA = this.parseQuality(a.quality);
                const qualityB = this.parseQuality(b.quality);
                return qualityB - qualityA;
            });
    }

    isStreamableFormat(format) {
        const streamableFormats = ['mp4', 'm3u8', 'webm', 'mkv'];
        return streamableFormats.includes((format || 'mp4').toLowerCase());
    }

    parseQuality(quality) {
        if (!quality) return 0;
        const match = quality.match(/(\d+)p/);
        return match ? parseInt(match[1]) : 0;
    }
}

// Initialize video player if elements exist
let videoPlayer;
if (document.getElementById('video-player') && document.getElementById('player-container')) {
    videoPlayer = new VideoPlayer();
}

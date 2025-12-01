// scripts/entertainment.js
class EntertainmentEffects {
    constructor() {
        this.effects = {
            curtain: true,
            spotlight: true,
            filmGrain: true,
            watermarks: true,
            progressBar: true
        };
        this.init();
    }

    init() {
        this.setupEffects();
        this.createEntertainmentElements();
        this.setupScrollEffects();
        this.setupMouseEffects();
        this.setupKeyboardEffects();
    }

    setupEffects() {
        // Load user preferences
        const savedEffects = localStorage.getItem('silvastream-effects');
        if (savedEffects) {
            this.effects = { ...this.effects, ...JSON.parse(savedEffects) };
        }
    }

    createEntertainmentElements() {
        // Create film grain overlay
        if (this.effects.filmGrain) {
            const grain = document.createElement('div');
            grain.className = 'cinematic-overlay';
            document.body.appendChild(grain);
        }

        // Create theater curtains
        if (this.effects.curtain) {
            const curtains = document.createElement('div');
            curtains.className = 'theater-curtains';
            document.body.appendChild(curtains);
        }

        // Create watermark
        if (this.effects.watermarks) {
            const watermark = document.createElement('div');
            watermark.className = 'watermark';
            watermark.textContent = 'SILVASTREAM';
            document.body.appendChild(watermark);
        }

        // Create progress indicator
        if (this.effects.progressBar) {
            const progress = document.createElement('div');
            progress.className = 'progress-indicator';
            progress.style.transform = 'scaleX(0)';
            document.body.appendChild(progress);
            this.progressBar = progress;
        }

        // Create spotlight effect container
        if (this.effects.spotlight) {
            const spotlight = document.createElement('div');
            spotlight.className = 'spotlight-effect';
            spotlight.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
                background: radial-gradient(
                    circle at var(--mouse-x) var(--mouse-y),
                    transparent 20%,
                    rgba(0, 0, 0, 0.5) 70%
                );
                opacity: 0.3;
                transition: background 0.3s ease;
            `;
            document.body.appendChild(spotlight);
            this.spotlight = spotlight;
        }
    }

    setupScrollEffects() {
        // Progress bar on scroll
        if (this.effects.progressBar && this.progressBar) {
            window.addEventListener('scroll', () => {
                const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (winScroll / height) * 100;
                this.progressBar.style.transform = `scaleX(${scrolled / 100})`;
            });
        }

        // Parallax effect on hero
        window.addEventListener('scroll', () => {
            const hero = document.querySelector('.hero');
            if (hero) {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.3;
                hero.style.transform = `translate3d(0, ${rate}px, 0)`;
            }
        });

        // Fade in elements on scroll
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Add staggered animation for movie cards
                    if (entry.target.classList.contains('movie-card')) {
                        const delay = Array.from(
                            entry.target.parentNode.children
                        ).indexOf(entry.target) * 0.1;
                        entry.target.style.animationDelay = `${delay}s`;
                    }
                }
            });
        }, observerOptions);

        // Observe all movie cards and sections
        document.querySelectorAll('.movie-card, .section-title, .whatsapp-promo').forEach(el => {
            observer.observe(el);
        });
    }

    setupMouseEffects() {
        if (this.effects.spotlight && this.spotlight) {
            document.addEventListener('mousemove', (e) => {
                const x = e.clientX;
                const y = e.clientY;
                
                this.spotlight.style.setProperty('--mouse-x', `${x}px`);
                this.spotlight.style.setProperty('--mouse-y', `${y}px`);
                
                // Create ripple effect on click
                if (e.target.classList.contains('movie-card') || 
                    e.target.closest('.movie-card')) {
                    this.createRippleEffect(e);
                }
            });
        }

        // Hover effects for interactive elements
        this.setupHoverEffects();
    }

    setupHoverEffects() {
        const hoverElements = document.querySelectorAll('.movie-card, .btn, .nav-link');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (this.effects.spotlight) {
                    el.classList.add('spotlight-hover');
                }
            });
            
            el.addEventListener('mouseleave', () => {
                el.classList.remove('spotlight-hover');
            });
        });
    }

    createRippleEffect(event) {
        const card = event.target.closest('.movie-card') || event.target;
        const ripple = document.createElement('span');
        
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(229, 9, 20, 0.3) 0%, transparent 70%);
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 1;
            animation: ripple 0.6s ease-out;
        `;
        
        card.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    setupKeyboardEffects() {
        document.addEventListener('keydown', (e) => {
            // Space bar for play/pause effect
            if (e.code === 'Space' && document.querySelector('.video-player')) {
                this.createSpacebarEffect();
            }
            
            // Escape for fullscreen exit effect
            if (e.code === 'Escape') {
                this.createFullscreenExitEffect();
            }
            
            // Arrow keys for navigation effects
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.createNavigationEffect(e.code);
            }
        });
    }

    createSpacebarEffect() {
        const effect = document.createElement('div');
        effect.className = 'keyboard-effect spacebar';
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(229, 9, 20, 0.4) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            animation: spacebarPulse 0.5s ease-out;
        `;
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }

    createNavigationEffect(direction) {
        const effect = document.createElement('div');
        const arrows = {
            ArrowUp: '↑',
            ArrowDown: '↓',
            ArrowLeft: '←',
            ArrowRight: '→'
        };
        
        effect.textContent = arrows[direction];
        effect.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            font-size: 2rem;
            color: var(--cinema-red);
            text-shadow: 0 0 20px var(--cinema-red);
            z-index: 10000;
            animation: arrowFloat 0.5s ease-out;
        `;
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }

    createFullscreenExitEffect() {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(229, 9, 20, 0.1);
            backdrop-filter: blur(5px);
            z-index: 9999;
            animation: fadeOut 0.3s ease-out;
        `;
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 300);
    }

    // Particle effects for special events
    createParticleEffect(element, count = 30) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const rect = element.getBoundingClientRect();
            
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: linear-gradient(45deg, var(--cinema-red), var(--cinema-gold));
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                animation: particleExplode 1s ease-out forwards;
            `;
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;
            
            particle.style.setProperty('--target-x', `${targetX}px`);
            particle.style.setProperty('--target-y', `${targetY}px`);
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    // Celebration effect for achievements
    createCelebrationEffect() {
        const colors = ['#e50914', '#ffd700', '#00b4d8', '#9d00ff', '#ff00ff'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                top: -50px;
                left: ${Math.random() * 100}vw;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 10000;
                animation: confettiFall ${Math.random() * 3 + 2}s ease-in forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    // Theater countdown before playing
    createCountdownEffect(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'countdown-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            flex-direction: column;
            gap: 30px;
        `;
        
        const countdownText = document.createElement('div');
        countdownText.textContent = 'Starting in';
        countdownText.style.cssText = `
            font-size: 2rem;
            color: var(--cinema-silver);
            text-transform: uppercase;
            letter-spacing: 3px;
        `;
        
        const countdownNumber = document.createElement('div');
        countdownNumber.textContent = '5';
        countdownNumber.style.cssText = `
            font-size: 8rem;
            font-weight: 900;
            color: var(--cinema-red);
            text-shadow: 0 0 50px var(--cinema-red);
            animation: countdownPulse 1s infinite;
        `;
        
        overlay.appendChild(countdownText);
        overlay.appendChild(countdownNumber);
        document.body.appendChild(overlay);
        
        let count = 5;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                this.createParticleEffect(countdownNumber);
            } else {
                clearInterval(countdown);
                overlay.remove();
                if (callback) callback();
            }
        }, 1000);
    }

    // Movie rating effect (stars)
    createRatingEffect(rating, element) {
        const starsContainer = document.createElement('div');
        starsContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 10px;
            z-index: 100;
        `;
        
        const fullStars = Math.floor(rating / 2);
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.innerHTML = i < fullStars ? '★' : '☆';
            star.style.cssText = `
                font-size: 3rem;
                color: ${i < fullStars ? 'var(--cinema-gold)' : 'var(--cinema-silver)'};
                animation: starPop ${0.2 * i}s ease-out;
                text-shadow: 0 0 20px ${i < fullStars ? 'var(--cinema-gold)' : 'transparent'};
            `;
            starsContainer.appendChild(star);
        }
        
        element.appendChild(starsContainer);
        
        setTimeout(() => {
            starsContainer.style.opacity = '0';
            starsContainer.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => starsContainer.remove(), 300);
        }, 2000);
    }

    // Save user preferences
    saveEffects() {
        localStorage.setItem('silvastream-effects', JSON.stringify(this.effects));
    }

    // Toggle individual effects
    toggleEffect(effectName) {
        if (this.effects.hasOwnProperty(effectName)) {
            this.effects[effectName] = !this.effects[effectName];
            this.saveEffects();
            return this.effects[effectName];
        }
        return null;
    }
}

// Initialize entertainment effects
let entertainmentEffects;

document.addEventListener('DOMContentLoaded', () => {
    entertainmentEffects = new EntertainmentEffects();
    
    // Add animation styles
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes spacebarPulse {
            to {
                transform: translate(-50%, -50%) scale(2);
                opacity: 0;
            }
        }
        
        @keyframes arrowFloat {
            to {
                transform: translateY(-50px);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
            }
        }
        
        @keyframes particleExplode {
            to {
                transform: translate(var(--target-x), var(--target-y));
                opacity: 0;
            }
        }
        
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes countdownPulse {
            0%, 100% {
                transform: scale(1);
                text-shadow: 0 0 50px var(--cinema-red);
            }
            50% {
                transform: scale(1.2);
                text-shadow: 0 0 100px var(--cinema-red);
            }
        }
        
        @keyframes starPop {
            0% {
                transform: scale(0);
            }
            70% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .animate-in {
            animation: slideUp 0.6s ease-out forwards;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .spotlight-hover {
            position: relative;
            z-index: 10;
        }
        
        .spotlight-hover::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150%;
            height: 150%;
            background: radial-gradient(circle, rgba(229, 9, 20, 0.1) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            z-index: -1;
            border-radius: inherit;
        }
    `;
    document.head.appendChild(animationStyles);
});

// Make available globally
window.EntertainmentEffects = EntertainmentEffects;
window.entertainmentEffects = entertainmentEffects;

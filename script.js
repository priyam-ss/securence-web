/* ============================================
   SECURENCE — Interactive JavaScript
   Animations, Particles, GSAP ScrollTrigger
   ============================================ */

// ──────────── Wait for DOM ────────────
document.addEventListener('DOMContentLoaded', () => {

    // ──────────── PRELOADER ────────────
    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('loader-bar');
    let progress = 0;

    const preloaderInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(preloaderInterval);
            setTimeout(() => {
                preloader.classList.add('loaded');
                // Initialize all animations after preloader
                initAnimations();
            }, 400);
        }
        loaderBar.style.width = progress + '%';
    }, 150);

    // ──────────── PARTICLE SYSTEM ────────────
    initParticles();

    // ──────────── NAVIGATION ────────────
    initNavigation();

    // ──────────── MOBILE MENU ────────────
    initMobileMenu();

    // ──────────── LIVE DEMO ────────────
    initLiveDemo();
});

/* ============================================
   PARTICLE SYSTEM — Canvas-based Background
   ============================================ */
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let animationId;

    // Resize canvas to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position for interactive particles
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Particle class
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = this.getRandomColor();
            this.life = Math.random() * 200 + 100;
            this.maxLife = this.life;
        }

        getRandomColor() {
            const colors = [
                '168, 85, 247',    // Blue
                '236, 72, 153',   // Pink
                '6, 182, 212',    // Cyan
                '139, 92, 246'    // Violet
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--;

            // Subtle mouse interaction — particles drift away gently
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.speedX -= dx * 0.00005;
                this.speedY -= dy * 0.00005;
            }

            // Fade based on life
            const lifeRatio = this.life / this.maxLife;
            this.currentOpacity = this.opacity * lifeRatio;

            // Reset if out of bounds or dead
            if (this.life <= 0 || this.x < -10 || this.x > canvas.width + 10 ||
                this.y < -10 || this.y > canvas.height + 10) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.currentOpacity})`;
            ctx.fill();
        }
    }

    // Initialize particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Draw connections between nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    const opacity = (1 - dist / 120) * 0.15;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        animationId = requestAnimationFrame(animateParticles);
    }

    animateParticles();
}

/* ============================================
   NAVIGATION
   ============================================ */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Close mobile menu if open
                const overlay = document.getElementById('mobile-overlay');
                const menuBtn = document.getElementById('mobile-menu-btn');
                overlay.classList.remove('active');
                menuBtn.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

/* ============================================
   MOBILE MENU
   ============================================ */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-overlay');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    });
}

/* ============================================
   LIVE DEMO
   ============================================ */
function initLiveDemo() {
    const playBtn = document.getElementById('demo-play-btn');
    const watchBtn = document.getElementById('btn-watch-demo');
    const videoWrapper = document.getElementById('demo-video-wrapper');

    if (!videoWrapper || !playBtn) return;

    const placeholder = videoWrapper.querySelector('.demo-placeholder');
    const iframe = videoWrapper.querySelector('iframe');
    const localVideo = videoWrapper.querySelector('video');

    function playVideo() {
        if (!placeholder) return;

        // Hide placeholder with a fade
        gsap.to(placeholder, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                placeholder.style.display = 'none';
            }
        });

        // Prefer YouTube embed if present, else local video
        if (iframe) {
            if (localVideo) localVideo.style.display = 'none'; // hide local video so iframe is visible
            let src = iframe.src;
            if (!src.includes('autoplay=')) {
                iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
            }
        } else if (localVideo) {
            localVideo.play();
        }
    }

    playBtn.addEventListener('click', playVideo);

    if (watchBtn) {
        watchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(watchBtn.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                setTimeout(playVideo, 800);
            }
        });
    }
}

/* ============================================
   GSAP ANIMATIONS — ScrollTrigger powered
   ============================================ */
function initAnimations() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // ──────────── Hero Animations ────────────
    const heroTimeline = gsap.timeline({ delay: 0.3 });

    heroTimeline
        .from('#hero-badge', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        })
        .from('#hero-title .title-line', {
            opacity: 0,
            y: 60,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out'
        }, '-=0.4')
        .from('#hero-subtitle', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .from('#hero-actions', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .from('#hero-stats .stat-item', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out'
        }, '-=0.4')
        .from('#scroll-indicator', {
            opacity: 0,
            duration: 1,
            ease: 'power2.out'
        }, '-=0.3');

    // ──────────── Animated Counters ────────────
    animateCounters();

    // ──────────── Scroll-triggered Sections ───────────
    initScrollAnimations();

    // ──────────── Scenario Scroll Storytelling ────────────
    initScenarioScroll();

    // ──────────── Feature Card Glow Follow ────────────
    initFeatureCardGlow();

    // ──────────── Parallax Effects ────────────
    initParallax();
}

/* ============================================
   ANIMATED COUNTERS
   ============================================ */
function animateCounters() {
    // Select all elements with data-count attribute
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = target > 100 ? 2 : 1.5;

        ScrollTrigger.create({
            trigger: counter,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(counter, {
                    innerText: target,
                    duration: duration,
                    ease: 'power2.out',
                    snap: { innerText: 1 },
                    onUpdate: function () {
                        counter.textContent = Math.round(
                            gsap.getProperty(counter, 'innerText')
                        );
                    }
                });
            }
        });
    });
}

/* ============================================
   SCROLL-TRIGGERED ANIMATIONS
   ============================================ */
function initScrollAnimations() {
    // Fade Up animations
    gsap.utils.toArray('[data-anim="fade-up"]').forEach(el => {
        const delay = parseFloat(el.getAttribute('data-delay')) || 0;

        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.9,
            delay: delay,
            ease: 'power3.out'
        });
    });

    // Fade Right animations
    gsap.utils.toArray('[data-anim="fade-right"]').forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            x: -60,
            duration: 0.9,
            ease: 'power3.out'
        });
    });

    // Fade Left animations
    gsap.utils.toArray('[data-anim="fade-left"]').forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            x: 60,
            duration: 0.9,
            ease: 'power3.out'
        });
    });

    // Timeline step animations — line fill effect
    gsap.utils.toArray('.step-line').forEach(line => {
        gsap.from(line, {
            scrollTrigger: {
                trigger: line,
                start: 'top 80%',
                end: 'bottom 60%',
                scrub: 1
            },
            scaleY: 0,
            transformOrigin: 'top center'
        });
    });

    // Status bar fill animations (future section)
    gsap.utils.toArray('.status-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';

        gsap.to(bar, {
            scrollTrigger: {
                trigger: bar,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            width: width,
            duration: 1.5,
            ease: 'power3.out'
        });
    });
}

/* ============================================
   SCENARIO SCROLL STORYTELLING
   ============================================ */
function initScenarioScroll() {
    const scenes = document.querySelectorAll('.scene');

    scenes.forEach(scene => {
        ScrollTrigger.create({
            trigger: scene,
            start: 'top 75%',
            end: 'bottom 25%',
            onEnter: () => scene.classList.add('in-view'),
            onLeaveBack: () => scene.classList.remove('in-view')
        });

        // Parallax on scene elements
        gsap.from(scene.querySelector('.scene-content'), {
            scrollTrigger: {
                trigger: scene,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out'
        });
    });
}

/* ============================================
   FEATURE CARD — Interactive Glow Effect
   ============================================ */
function initFeatureCardGlow() {
    const cards = document.querySelectorAll('.feature-card, .future-card, .team-card');

    cards.forEach(card => {
        const glow = card.querySelector('.feature-glow, .future-card-glow, .team-card-glow');
        if (!glow) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            glow.style.left = (x - 125) + 'px';
            glow.style.top = (y - 125) + 'px';
        });
    });
}

/* ============================================
   PARALLAX EFFECTS
   ============================================ */
function initParallax() {
    // Hero device slow parallax on scroll
    const heroDevice = document.getElementById('hero-device');
    if (heroDevice) {
        gsap.to(heroDevice, {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            },
            y: -100,
            opacity: 0,
            ease: 'none'
        });
    }

    // Hero content parallax
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        gsap.to(heroContent, {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            },
            y: 80,
            opacity: 0,
            ease: 'none'
        });
    }

    // Section labels subtle parallax
    gsap.utils.toArray('.section-label').forEach(label => {
        gsap.from(label, {
            scrollTrigger: {
                trigger: label,
                start: 'top 90%',
                end: 'top 50%',
                scrub: 1
            },
            x: -20,
            opacity: 0
        });
    });
}

/* ============================================
   ADDITIONAL INTERACTIVE EFFECTS
   ============================================ */

// Tilt effect on hero device based on mouse position
document.addEventListener('mousemove', (e) => {
    const device = document.querySelector('.device-body');
    if (!device) return;

    const heroSection = document.getElementById('hero');
    const rect = heroSection.getBoundingClientRect();

    // Only apply when hero is in view
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = (e.clientX - centerX) / centerX;
    const deltaY = (e.clientY - centerY) / centerY;

    // Subtle mouse-follow rotation (added on top of CSS animation)
    const extraRotateY = deltaX * 10;
    const extraRotateX = -deltaY * 5;

    device.style.setProperty('--mouse-rotate-x', extraRotateX + 'deg');
    device.style.setProperty('--mouse-rotate-y', extraRotateY + 'deg');
});

// Magnetic button effect
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// Typing effect for the loader text (subtle)
function typeText(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
        element.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(interval);
    }, speed);
}

// Easter egg: Konami code activates a special effect
let konamiSequence = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiSequence.push(e.key);
    if (konamiSequence.length > konamiCode.length) {
        konamiSequence.shift();
    }
    if (konamiSequence.join(',') === konamiCode.join(',')) {
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 3000);
    }
});

console.log(
    '%c◈ SECURENCE %c— Your Safety. Reimagined.',
    'color: #a855f7; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 14px;'
);

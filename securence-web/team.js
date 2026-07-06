/* ============================================
   SECURENCE — Team Page JavaScript
   Particles, scroll animations, card interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ──────────── PRELOADER ────────────
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const loaderBar = document.getElementById('loader-bar');
        if (!loaderBar) return;
        let progress = 0;

        const preloaderInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(preloaderInterval);
                setTimeout(() => {
                    preloader.classList.add('loaded');
                    initTeamAnimations();
                }, 400);
            }
            loaderBar.style.width = progress + '%';
        }, 150);
    }

    // ──────────── PARTICLE CANVAS ────────────
    initTeamParticles();

    // ──────────── NAV SCROLL ────────────
    initTeamNav();

    // ──────────── CARD GLOW FOLLOW ────────────
    initCardGlow();

    // ──────────── MAGNETIC BUTTONS ────────────
    initMagneticButtons();

    // ──────────── PROFILE LIGHTBOX ────────────
    initProfileLightbox();
});

/* ============================================
   PARTICLE SYSTEM
   ============================================ */
function initTeamParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: 0, y: 0 };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.color = this.getColor();
        }

        getColor() {
            const colors = [
                '168, 85, 247',
                '59, 130, 246',
                '236, 72, 153',
                '139, 92, 246'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                this.x -= dx * 0.008;
                this.y -= dy * 0.008;
            }

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    const particleCount = Math.min(60, Math.floor(window.innerWidth / 22));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${0.05 * (1 - dist / 140)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
}

/* ============================================
   NAVIGATION SCROLL EFFECT
   ============================================ */
function initTeamNav() {
    const nav = document.getElementById('page-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

/* ============================================
   GSAP SCROLL ANIMATIONS
   ============================================ */
function initTeamAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero stagger reveal
    const heroTl = gsap.timeline({ delay: 0.2 });
    heroTl
        .from('.team-hero-label', {
            opacity: 0, y: 20, duration: 0.7, ease: 'power3.out'
        })
        .from('.team-hero-title', {
            opacity: 0, y: 40, duration: 0.9, ease: 'power3.out'
        }, '-=0.4')
        .from('.team-hero-desc', {
            opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
        }, '-=0.5');

    // Fade Up elements
    gsap.utils.toArray('[data-anim="fade-up"]').forEach(el => {
        const delay = parseFloat(el.getAttribute('data-delay')) || 0;
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.9,
            delay: delay,
            ease: 'power3.out'
        });
    });

    // Section labels
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

    // Team cards stagger
    const cards = gsap.utils.toArray('.tm-card');
    if (cards.length) {
        // Founder card separate animation
        const founderCard = document.querySelector('.tm-founder');
        if (founderCard) {
            gsap.from(founderCard, {
                scrollTrigger: {
                    trigger: founderCard,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 60,
                scale: 0.97,
                duration: 1,
                ease: 'power3.out'
            });
        }

        // Regular cards
        const regularCards = cards.filter(c => !c.classList.contains('tm-founder'));
        regularCards.forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 50,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out'
            });
        });
    }
}

/* ============================================
   CARD GLOW — Mouse Follow
   ============================================ */
function initCardGlow() {
    document.querySelectorAll('.tm-card').forEach(card => {
        const glow = card.querySelector('.tm-card-glow');
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
   MAGNETIC BUTTONS
   ============================================ */
function initMagneticButtons() {
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
}

/* ============================================
   PROFILE PICTURE LIGHTBOX
   ============================================ */
function initProfileLightbox() {
    const lightbox = document.getElementById('tm-lightbox');
    const lightboxImg = document.getElementById('tm-lightbox-img');
    const lightboxClose = document.getElementById('tm-lightbox-close');
    const lightboxOverlay = lightbox ? lightbox.querySelector('.tm-lightbox-overlay') : null;

    if (!lightbox || !lightboxImg) return;

    // Open lightbox when clicking any avatar with data-fullimg
    document.querySelectorAll('.tm-avatar[data-fullimg]').forEach(avatar => {
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            // Use the actual <img> src inside the avatar (most reliable)
            const img = avatar.querySelector('img');
            const imgSrc = img ? img.src : avatar.getAttribute('data-fullimg');
            if (!imgSrc) return;

            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close lightbox — X button
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Close lightbox — overlay click
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', closeLightbox);
    }

    // Close lightbox — Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        // Clear image after transition
        setTimeout(() => {
            lightboxImg.src = '';
        }, 400);
    }
}

/* ============================================
   CONSOLE BRANDING
   ============================================ */
console.log(
    '%c◈ SECURENCE %c— The Core Team',
    'color: #a855f7; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 14px;'
);

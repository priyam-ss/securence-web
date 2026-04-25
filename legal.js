/* ============================================
   SECURENCE — Legal Pages JS
   Particles, scroll animations, interactivity
   ============================================ */

// ──────────── PRELOADER ────────────
document.addEventListener('DOMContentLoaded', () => {
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
                }, 400);
            }
            loaderBar.style.width = progress + '%';
        }, 150);
    }
});

// ──────────── PARTICLE SYSTEM ────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
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
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
            ctx.fill();
        }
    }

    const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${0.06 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animateParticles);
    }

    animateParticles();
}

// ──────────── NAV SCROLL EFFECT ────────────
const pageNav = document.getElementById('page-nav');
if (pageNav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            pageNav.classList.add('scrolled');
        } else {
            pageNav.classList.remove('scrolled');
        }
    });
}

// ──────────── GSAP INIT ────────────
gsap.registerPlugin(ScrollTrigger);

// ──────────── LEGAL CARD ANIMATIONS ────────────
gsap.utils.toArray('.legal-card').forEach((card, i) => {
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: i * 0.08,
        ease: 'power3.out',
        onStart: () => card.classList.add('animated')
    });
});

// ──────────── HERO ANIMATIONS ────────────
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

// ──────────── SECTION LABEL PARALLAX ────────────
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

// ──────────── CARD GLOW FOLLOW ────────────
document.querySelectorAll('.legal-card').forEach(card => {
    const glow = card.querySelector('.legal-card-glow');
    if (!glow) return;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glow.style.left = (x - 125) + 'px';
        glow.style.top = (y - 125) + 'px';
    });
});

// ──────────── MAGNETIC BUTTONS ────────────
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

// ──────────── CONSOLE BRANDING ────────────
console.log(
    '%c◈ SECURENCE %c— Your Safety. Reimagined.',
    'color: #a855f7; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 14px;'
);

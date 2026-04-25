/* ============================================
   SECURENCE — Shared JS for Sub-Pages
   Particle system, scroll animations, interactivity
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

            // Mouse interaction
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

    // Create particles
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

        // Draw connection lines
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

// ──────────── GSAP INIT ────────────
gsap.registerPlugin(ScrollTrigger);

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

// ──────────── SCROLL ANIMATIONS ────────────
// Fade Up
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

// Fade Right
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

// Fade Left
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

// ──────────── CARD GLOW FOLLOW ────────────
document.querySelectorAll('.page-card').forEach(card => {
    const glow = card.querySelector('.page-card-glow');
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

// ──────────── ROLE SELECTION (mission.html) ────────────
const roleGrid = document.getElementById('role-grid');
const roleDisplay = document.getElementById('selected-role-display');

if (roleGrid) {
    roleGrid.addEventListener('click', (e) => {
        const option = e.target.closest('.role-option');
        if (!option) return;

        // Toggle selection
        const wasSelected = option.classList.contains('selected');

        // Remove all selections
        roleGrid.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));

        if (!wasSelected) {
            option.classList.add('selected');
            if (roleDisplay) {
                roleDisplay.value = option.querySelector('.role-option-title').textContent;
            }
        } else {
            if (roleDisplay) roleDisplay.value = '';
        }
    });
}

// ──────────── CONSOLE BRANDING ────────────
console.log(
    '%c◈ SECURENCE %c— Your Safety. Reimagined.',
    'color: #a855f7; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 14px;'
);

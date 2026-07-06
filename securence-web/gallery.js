/* ============================================
   SECURENCE — Gallery Pages JS
   Modal system, scroll animations, interactivity
   Used by inside.html & demo.html
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

// ──────────── MEDIA CARD STAGGER ────────────
gsap.utils.toArray('.media-grid').forEach(grid => {
    const cards = grid.querySelectorAll('.media-card');
    gsap.from(cards, {
        scrollTrigger: {
            trigger: grid,
            start: 'top 85%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out'
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

// ──────────── MEDIA MODAL SYSTEM ────────────
(function initMediaModal() {
    // Create modal element dynamically
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    modal.id = 'media-modal';
    modal.innerHTML = `
        <div class="media-modal-content" id="media-modal-content">
            <button class="media-modal-close" id="media-modal-close" aria-label="Close modal">✕</button>
        </div>
    `;
    document.body.appendChild(modal);

    const modalContent = document.getElementById('media-modal-content');
    const modalClose = document.getElementById('media-modal-close');

    // Open modal — shows actual size content
    function openModal(card) {
        const img = card.querySelector('img');
        const video = card.querySelector('video');

        // Don't open modal for placeholder-only cards
        if (!img && !video) return;

        // Clear previous content (keep close button)
        while (modalContent.children.length > 1) {
            modalContent.removeChild(modalContent.lastChild);
        }

        if (video) {
            // Clone video for modal — actual size
            const modalVideo = document.createElement('video');
            modalVideo.src = video.src;
            modalVideo.controls = true;
            modalVideo.autoplay = true;
            modalVideo.playsInline = true;
            modalContent.appendChild(modalVideo);

            // Fullscreen button
            const fsBtn = document.createElement('button');
            fsBtn.className = 'media-modal-fullscreen';
            fsBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Open Fullscreen
            `;
            fsBtn.addEventListener('click', () => {
                if (modalVideo.requestFullscreen) {
                    modalVideo.requestFullscreen();
                } else if (modalVideo.webkitRequestFullscreen) {
                    modalVideo.webkitRequestFullscreen();
                }
            });
            modalContent.appendChild(fsBtn);
        } else if (img) {
            // Show image at actual size in modal
            const modalImg = document.createElement('img');
            modalImg.src = img.src;
            modalImg.alt = img.alt || 'SECURENCE Media';
            modalContent.appendChild(modalImg);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Pause any playing videos
        const video = modalContent.querySelector('video');
        if (video) video.pause();
    }

    // Event listeners
    modalClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Bind clicks on all media cards
    document.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });
})();

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

// ──────────── CONSOLE BRANDING ────────────
console.log(
    '%c◈ SECURENCE %c— Your Safety. Reimagined.',
    'color: #a855f7; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 14px;'
);

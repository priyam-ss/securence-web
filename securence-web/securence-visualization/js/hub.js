/* ============================================
   SECURENCE VISUALIZATION — Hub Page Logic
   ============================================ */

(function () {
    'use strict';

    // ──────────── Preloader ────────────
    const preloader = document.getElementById('viz-preloader');
    const loaderBar = document.getElementById('viz-loader-bar');

    let progress = 0;
    const loadInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadInterval);
            setTimeout(() => {
                preloader.classList.add('loaded');
            }, 300);
        }
        loaderBar.style.width = progress + '%';
    }, 150);

    // Fallback: ensure preloader hides
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!preloader.classList.contains('loaded')) {
                loaderBar.style.width = '100%';
                setTimeout(() => preloader.classList.add('loaded'), 300);
            }
        }, 2000);
    });

    // ──────────── Card hover effect ────────────
    // Enhanced glow follows mouse on active cards
    const activeCards = document.querySelectorAll('.viz-card.active');
    activeCards.forEach(card => {
        const glow = card.querySelector('.viz-card-glow');
        if (!glow) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - 100;
            const y = e.clientY - rect.top - 100;
            glow.style.left = x + 'px';
            glow.style.top = y + 'px';
        });
    });

    // ──────────── Staggered entrance for coming-soon cards ────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const comingSoonCards = document.querySelectorAll('.viz-card.coming-soon');
    comingSoonCards.forEach(card => {
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

})();

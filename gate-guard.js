/* ============================================
   SECURENCE — Gate Guard
   Add to EVERY page except index.html & onboarding.html

   UI modifications ALWAYS run on legal pages.
   Redirect only runs when GATE_ENABLED = true.

   TESTING:    GATE_ENABLED = false
   PRODUCTION: GATE_ENABLED = true
   ============================================ */

(function () {
    'use strict';

    var GATE_ENABLED = false;

    // Legal page filenames
    var legalPages = [
        'privacy-policy.html', 'terms-and-conditions.html',
        'disclaimer.html', 'nda.html',
        'founder-team-agreement.html', 'product-notice.html',
        'ip-protection.html'
    ];

    // Current page
    var path = window.location.pathname.split('/').pop() || '';

    var isLegal = false;
    for (var i = 0; i < legalPages.length; i++) {
        if (path === legalPages[i]) { isLegal = true; break; }
    }

    // ── REDIRECT (only when GATE_ENABLED) ──
    if (GATE_ENABLED) {
        /*
        if (localStorage.getItem('userFilled') === 'true') return;
        */
        if (!isLegal) {
            document.documentElement.style.visibility = 'hidden';
            window.location.replace('index.html');
            return;
        }
    }

    // ── UI MODIFICATIONS — Always run on legal pages ──
    if (!isLegal) return;

    // ── Inject nuclear CSS directly (runs before any stylesheet loads) ──
    var style = document.createElement('style');
    style.textContent =
        'a.ob-link-disabled,' +
        'a[data-blocked-href],' +
        'a[data-ob-blocked]{' +
            'opacity:0.2!important;' +
            'pointer-events:none!important;' +
            'cursor:not-allowed!important;' +
            '-webkit-user-select:none!important;' +
            '-moz-user-select:none!important;' +
            'user-select:none!important;' +
            '-webkit-touch-callout:none!important;' +
            '-webkit-tap-highlight-color:transparent!important;' +
            'color:rgba(241,245,249,0.35)!important;' +
        '}';
    document.head.appendChild(style);

    // Check if link href is allowed
    function isAllowed(href) {
        if (!href) return false;
        if (href.indexOf('https://') === 0 || href.indexOf('http://') === 0) return true;
        for (var i = 0; i < legalPages.length; i++) {
            if (href.indexOf(legalPages[i]) !== -1) return true;
        }
        return false;
    }

    function lockLinks() {
        // ── 1. Change "Back to Home" → "Return to Onboarding" ──
        var backLink = document.querySelector('.page-back-link');
        if (backLink) {
            backLink.setAttribute('href', 'index.html');
            backLink.innerHTML =
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M19 12H5M12 19l-7-7 7-7"/>' +
                '</svg>' +
                'Return to Onboarding';
        }

        // ── 2. Process ALL links on the page ──
        var allLinks = document.querySelectorAll('a');
        for (var j = 0; j < allLinks.length; j++) {
            var link = allLinks[j];
            var href = link.getAttribute('href') || '';

            // Skip the back link (already modified)
            if (link === backLink) continue;

            // Skip already-blocked links (re-run safety)
            if (link.hasAttribute('data-blocked-href')) continue;

            // Skip allowed links (legal + external/social)
            if (isAllowed(href)) continue;

            // Skip in-page anchors (#section)
            if (href.charAt(0) === '#') continue;

            // ── DISABLE: remove href, store original, style as disabled ──
            link.setAttribute('data-blocked-href', href);
            link.removeAttribute('href');
            link.classList.add('ob-link-disabled');
            link.style.opacity = '0.2';
            link.style.cursor = 'not-allowed';
            link.style.pointerEvents = 'none';
            link.style.userSelect = 'none';
            link.style.webkitUserSelect = 'none';
            link.setAttribute('tabindex', '-1');
            link.setAttribute('aria-disabled', 'true');
        }

        // ── 3. Disable nav-logo specifically (always links to index) ──
        var navLogo = document.querySelector('.nav-logo');
        if (navLogo && navLogo !== backLink && !navLogo.hasAttribute('data-blocked-href')) {
            navLogo.setAttribute('data-blocked-href', navLogo.getAttribute('href') || '');
            navLogo.removeAttribute('href');
            navLogo.classList.add('ob-link-disabled');
            navLogo.style.opacity = '0.2';
            navLogo.style.cursor = 'not-allowed';
            navLogo.style.pointerEvents = 'none';
        }

        // ── 4. Bottom banner logic removed ──
    }

    // ── 5. BULLETPROOF: Intercept all click + touch on blocked links (runs once) ──
    function setupInterceptors() {
        function blockEvent(e) {
            var target = e.target.closest('a');
            if (!target) return;

            // If link has no href (we removed it), block it
            if (!target.hasAttribute('href')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            var clickHref = target.getAttribute('href') || '';

            // Allow: back to onboarding, legal/external, anchors
            var backLink = document.querySelector('.page-back-link');
            if (target === backLink) return;
            if (isAllowed(clickHref)) return;
            if (clickHref.charAt(0) === '#') return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }

        // Capture phase — fires before any other handlers
        document.addEventListener('click', blockEvent, true);
        document.addEventListener('touchend', blockEvent, true);
        document.addEventListener('touchstart', function (e) {
            var target = e.target.closest('a');
            if (target && !target.hasAttribute('href') && target.hasAttribute('data-blocked-href')) {
                e.preventDefault();
            }
        }, { capture: true, passive: false });

        // Block long-press "Open in new tab" on mobile
        document.addEventListener('contextmenu', function (e) {
            var target = e.target.closest('a');
            if (target && target.hasAttribute('data-blocked-href')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        }, { capture: true });
    }

    // Run on DOM ready
    function init() {
        lockLinks();
        setupInterceptors();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-run after a delay to catch any links added by legal.js
    setTimeout(function () {
        if (document.readyState !== 'loading') lockLinks();
    }, 2000);

    // MutationObserver — catch dynamically-added links on mobile
    if (typeof MutationObserver !== 'undefined') {
        var lockTimer = null;
        var observer = new MutationObserver(function () {
            // Debounce to avoid excessive re-runs
            if (lockTimer) clearTimeout(lockTimer);
            lockTimer = setTimeout(function () {
                lockLinks();
            }, 300);
        });

        function startObserver() {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startObserver);
        } else {
            startObserver();
        }
    }
})();

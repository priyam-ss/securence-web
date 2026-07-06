/* ============================================
   SECURENCE — Onboarding Modal System
   Uses same form/button/logo classes as main site
   ============================================ */
(function () {
    'use strict';

    // ── Inject lock CSS from JS (zero dependency on CSS files) ──
    var lockCSS = document.createElement('style');
    lockCSS.id = 'ob-lock-css';
    lockCSS.textContent =
        'body.ob-locked{' +
        'overflow:hidden!important;' +
        'position:fixed!important;' +
        'width:100%!important;' +
        'touch-action:none!important;' +
        '-ms-touch-action:none!important;' +
        'overscroll-behavior:none!important;' +
        '}' +
        'body.ob-locked::after{' +
        'content:"";position:fixed;inset:0;' +
        'background:rgba(3,3,12,0.6);' +
        'backdrop-filter:blur(14px);' +
        '-webkit-backdrop-filter:blur(14px);' +
        'z-index:10000;pointer-events:none;' +
        '}' +
        'body.ob-locked a{' +
        'opacity:0.2!important;' +
        'pointer-events:none!important;' +
        'cursor:not-allowed!important;' +
        '-webkit-user-select:none!important;' +
        'user-select:none!important;' +
        '-webkit-touch-callout:none!important;' +
        '-webkit-tap-highlight-color:transparent!important;' +
        '}' +
        'body.ob-locked a[href="privacy-policy.html"],' +
        'body.ob-locked a[href="terms-and-conditions.html"],' +
        'body.ob-locked a[href="disclaimer.html"],' +
        'body.ob-locked a[href="nda.html"],' +
        'body.ob-locked a[href="founder-team-agreement.html"],' +
        'body.ob-locked a[href="product-notice.html"],' +
        'body.ob-locked a[href="ip-protection.html"]{' +
        'opacity:1!important;pointer-events:auto!important;cursor:pointer!important;' +
        '}' +
        'body.ob-locked a[href^="https://"],' +
        'body.ob-locked a[href^="http://"]{' +
        'opacity:1!important;pointer-events:auto!important;cursor:pointer!important;' +
        '}' +
        '.ob-overlay a,.ob-overlay button{' +
        'opacity:1!important;pointer-events:auto!important;cursor:pointer!important;' +
        '}' +
        'a.ob-link-disabled,a[data-ob-blocked]{' +
        'opacity:0.2!important;' +
        'pointer-events:none!important;' +
        'cursor:not-allowed!important;' +
        '-webkit-touch-callout:none!important;' +
        '-webkit-tap-highlight-color:transparent!important;' +
        '}';
    document.head.appendChild(lockCSS);

    // Skip if user already completed onboarding (permanent)
    // COMMENTED OUT FOR TESTING — Uncomment before deploying to production
    // if (localStorage.getItem('ob_done') === '1') return;

    // Session-based skip (for testing — resets when tab is closed)
    if (sessionStorage.getItem('ob_done_session') === '1') return;

    // ──── SVG — exact same logo as nav ────
    var LOGO_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ob-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d946ef"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><path d="M12 2L4 7V12.5C4 17.5 7.5 21 12 22.5C16.5 21 20 17.5 20 12.5V7L12 2Z" stroke="url(#ob-grad)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="5,13 8,13 10,7 12,18 13.5,11 15.5,13 19,13" stroke="url(#ob-grad)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
    var SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    var SVG_CHECK2 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

    // ──── Build Modal ────
    function buildModal() {
        var html =
            '<div class="ob-overlay" id="ob-overlay">' +
            '<div class="ob-modal" id="ob-modal">' +

            // Header — same style as nav-logo
            '<div class="ob-hdr">' +
            '<div class="ob-hdr-logo">' +
            '<span class="logo-icon">' + LOGO_SVG + '</span>' +
            '<span class="logo-text">SECURENCE</span>' +
            '</div>' +
            '<p class="ob-hdr-sub">Your safety, reimagined</p>' +
            '<div class="ob-hdr-badge"><span class="ob-hdr-dot"></span>SECURE ENTRY PROTOCOL</div>' +
            '</div>' +

            // Form — uses form-group, form-label, form-input classes
            '<form class="ob-form" id="ob-form" autocomplete="off">' +

            '<div class="form-group">' +
            '<label class="form-label">Full Name</label>' +
            '<input class="form-input" type="text" name="name" placeholder="Enter your full name" required>' +
            '</div>' +

            '<div class="form-group">' +
            '<label class="form-label">Email Address</label>' +
            '<input class="form-input" type="email" name="email" placeholder="your.email@example.com" required>' +
            '</div>' +

            '<div class="form-group">' +
            '<label class="form-label">Phone Number</label>' +
            '<input class="form-input" type="tel" name="phone" placeholder="+91 XXXXX XXXXX" required>' +
            '</div>' +

            '<div class="form-group">' +
            '<label class="form-label">Address</label>' +
            '<input class="form-input" type="text" name="address" placeholder="Enter your full address" required>' +
            '</div>' +

            '<div class="form-group">' +
            '<label class="form-label">Profession / Passion</label>' +
            '<select class="form-select" name="profession" required>' +
            '<option value="" disabled selected>Select your field</option>' +
            '<option value="student">Student</option>' +
            '<option value="engineer">Engineer / Developer</option>' +
            '<option value="designer">Designer / Creative</option>' +
            '<option value="business">Business / Entrepreneur</option>' +
            '<option value="healthcare">Healthcare Professional</option>' +
            '<option value="education">Educator / Teacher</option>' +
            '<option value="government">Government / Public Service</option>' +
            '<option value="media">Media / Content Creator</option>' +
            '<option value="researcher">Researcher / Scientist</option>' +
            '<option value="homemaker">Homemaker</option>' +
            '<option value="freelancer">Freelancer / Self-employed</option>' +
            '<option value="other">Other</option>' +
            '</select>' +
            '</div>' +

            // Terms checkbox
            '<div class="form-group">' +
            '<label class="ob-terms-row">' +
            '<input type="checkbox" id="ob-agree">' +
            '<div class="ob-chk">' + SVG_CHECK + '</div>' +
            '<span class="ob-terms-text">I have read and agree to the ' +
            '<a href="terms-and-conditions.html" class="ob-terms-link">Terms & Conditions</a> and ' +
            '<a href="privacy-policy.html" class="ob-terms-link">Privacy Policy</a>' +
            '</span>' +
            '</label>' +
            '</div>' +

            // Submit — uses btn btn-primary btn-lg
            '<button type="submit" class="btn btn-primary btn-lg" id="ob-btn">' +
            '<span>Initialize Access</span>' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M5 12h14M12 5l7 7-7 7"/>' +
            '</svg>' +
            '</button>' +

            '</form>' +

            // Processing overlay — same as preloader animation
            '<div class="ob-proc" id="ob-proc">' +
            '<div class="ob-proc-inner">' +
            '<div class="ob-preloader-ring">' +
            '<div class="ob-preloader-ring-inner"></div>' +
            '</div>' +
            '<p class="ob-preloader-text" id="ob-preloader-text">Initializing SECURENCE</p>' +
            '<div class="ob-preloader-progress">' +
            '<div class="ob-preloader-progress-bar" id="ob-preloader-bar"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '</div>' +
            '</div>';

        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    // ──── Toast ────
    function showToast(msg) {
        var existing = document.querySelector('.ob-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'ob-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function () { toast.classList.add('show'); }, 30);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 400);
        }, 2800);
    }

    // ──── Allowed link check ────
    var legalPages = [
        'privacy-policy.html', 'terms-and-conditions.html',
        'disclaimer.html', 'nda.html',
        'founder-team-agreement.html', 'product-notice.html',
        'ip-protection.html'
    ];

    function isAllowed(href) {
        if (!href) return false;
        if (href.indexOf('https://') === 0 || href.indexOf('http://') === 0) return true;
        for (var i = 0; i < legalPages.length; i++) {
            if (href.indexOf(legalPages[i]) !== -1) return true;
        }
        return false;
    }

    // ──── Lock Page — remove hrefs from restricted links ────
    var savedScrollY = 0;
    function lockPage() {
        // Save scroll position before position:fixed locks it
        savedScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.classList.add('ob-locked');
        document.body.style.top = '-' + savedScrollY + 'px';

        var allLinks = document.querySelectorAll('a');
        for (var j = 0; j < allLinks.length; j++) {
            var link = allLinks[j];

            // Skip links inside the modal
            if (link.closest('.ob-overlay')) continue;

            // Skip already-blocked links (re-run safety)
            if (link.hasAttribute('data-ob-blocked')) continue;

            var href = link.getAttribute('href') || '';

            // Skip allowed links (legal pages + external/social)
            if (isAllowed(href)) continue;
            if (href === '') continue;

            // For # anchor links: only skip if NOT in footer
            // Footer # links (like #about, #features) must be blocked too
            if (href.charAt(0) === '#') {
                var isInFooter = link.closest('footer, .site-footer, [class*="footer"]');
                if (!isInFooter) continue;
            }

            // Physically remove href — most bulletproof on mobile
            link.setAttribute('data-ob-blocked', href);
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
    }

    // ──── Unlock — restore hrefs ────
    function unlockPage() {
        document.body.classList.remove('ob-locked');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollY);

        // Restore all blocked links
        var blocked = document.querySelectorAll('[data-ob-blocked]');
        for (var k = 0; k < blocked.length; k++) {
            blocked[k].setAttribute('href', blocked[k].getAttribute('data-ob-blocked'));
            blocked[k].removeAttribute('data-ob-blocked');
            blocked[k].classList.remove('ob-link-disabled');
            blocked[k].style.opacity = '';
            blocked[k].style.cursor = '';
            blocked[k].style.pointerEvents = '';
            blocked[k].style.userSelect = '';
            blocked[k].style.webkitUserSelect = '';
            blocked[k].removeAttribute('tabindex');
            blocked[k].removeAttribute('aria-disabled');
        }

        var overlay = document.getElementById('ob-overlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.7s ease';
            overlay.style.opacity = '0';
            setTimeout(function () { overlay.remove(); }, 700);
        }
    }

    // ──── Intercept clicks + touch as backup ────
    function interceptClicks() {
        function blockNav(e) {
            if (!document.body.classList.contains('ob-locked')) return;
            var link = e.target.closest('a');
            if (!link) return;
            if (link.closest('.ob-overlay')) return;

            // If href was removed, block it
            if (!link.hasAttribute('href') && link.hasAttribute('data-ob-blocked')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (e.type === 'click') showToast('🔒 Complete onboarding to unlock full access');
                return false;
            }

            var href = link.getAttribute('href') || '';
            if (isAllowed(href)) return;

            // Allow # anchors only if NOT in footer
            if (href.charAt(0) === '#') {
                var isInFooter = link.closest('footer, .site-footer, [class*="footer"]');
                if (!isInFooter) return;
            }

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (e.type === 'click') showToast('🔒 Complete onboarding to unlock full access');
            return false;
        }

        document.addEventListener('click', blockNav, true);
        document.addEventListener('touchend', blockNav, true);
        document.addEventListener('touchstart', function (e) {
            if (!document.body.classList.contains('ob-locked')) return;
            var link = e.target.closest('a');
            if (link && !link.hasAttribute('href') && link.hasAttribute('data-ob-blocked')) {
                e.preventDefault();
            }
        }, { capture: true, passive: false });

        // Block long-press "Open in new tab" on mobile
        document.addEventListener('contextmenu', function (e) {
            if (!document.body.classList.contains('ob-locked')) return;
            var link = e.target.closest('a');
            if (link && link.hasAttribute('data-ob-blocked')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        }, { capture: true });
    }

    // ──── Processing — Same preloader animation ────
    function startProcessing() {
        var proc = document.getElementById('ob-proc');
        if (!proc) return;
        proc.classList.add('active');

        var progressBar = document.getElementById('ob-preloader-bar');
        var textEl = document.getElementById('ob-preloader-text');
        if (!progressBar) return;

        var progress = 0;
        var statusMessages = [
            { at: 0,  text: 'Initializing SECURENCE' },
            { at: 25, text: 'Encrypting user data...' },
            { at: 50, text: 'Verifying identity...' },
            { at: 75, text: 'Establishing secure channel...' },
            { at: 95, text: 'Access granted ✓' }
        ];
        var msgIndex = 0;

        var processingInterval = setInterval(function () {
            progress += Math.random() * 12 + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(processingInterval);
                progressBar.style.width = '100%';
                if (textEl) textEl.textContent = 'Access granted ✓';
                if (textEl) textEl.style.color = '#10b981';
                setTimeout(onComplete, 600);
                return;
            }
            progressBar.style.width = progress + '%';

            // Update status text at thresholds
            if (textEl && msgIndex < statusMessages.length && progress >= statusMessages[msgIndex].at) {
                textEl.textContent = statusMessages[msgIndex].text;
                msgIndex++;
            }
        }, 180);
    }

    function onComplete() {
        // COMMENTED OUT FOR TESTING — Uncomment before deploying to production
        // localStorage.setItem('ob_done', '1');

        // Session-based flag (for testing — resets when tab is closed)
        sessionStorage.setItem('ob_done_session', '1');

        // ════════════════════════════════════════════
        // FIREBASE — Save onboarding data to Firestore
        // ════════════════════════════════════════════
        try {
            if (typeof db !== 'undefined') {
                var form = document.getElementById('ob-form');
                var formName = form.querySelector('[name="name"]').value.trim();
                var formEmail = form.querySelector('[name="email"]').value.trim();
                var formPhone = form.querySelector('[name="phone"]').value.trim();
                var formAddress = form.querySelector('[name="address"]').value.trim();
                var formProfession = form.querySelector('[name="profession"]').value;

                // Only write if we have actual data
                if (formName && formEmail) {
                    db.collection('users').add({
                        name: formName,
                        email: formEmail,
                        phone: formPhone,
                        address: formAddress,
                        profession: formProfession,
                        termsAccepted: true,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        source: 'onboarding_modal'
                    }).catch(function (err) {
                        console.warn('Firebase write failed:', err);
                    });
                }
            }
        } catch (err) {
            console.warn('Firebase save error:', err);
        }

        unlockPage();
    }

    // ──── Form Submit ────
    function handleSubmit(e) {
        e.preventDefault();
        var form = document.getElementById('ob-form');
        var name = form.querySelector('[name="name"]').value.trim();
        var email = form.querySelector('[name="email"]').value.trim();
        var phone = form.querySelector('[name="phone"]').value.trim();
        var address = form.querySelector('[name="address"]').value.trim();
        var profession = form.querySelector('[name="profession"]').value;
        var agree = document.getElementById('ob-agree');

        if (!name || !email || !phone || !address) {
            showToast('⚠️ Please fill in all fields');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('⚠️ Enter a valid email address');
            return;
        }
        if (!profession) {
            showToast('⚠️ Please select your profession');
            return;
        }
        if (!agree || !agree.checked) {
            showToast('⚠️ Please accept the Terms & Conditions');
            return;
        }

        var btn = document.getElementById('ob-btn');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Processing...';
        setTimeout(startProcessing, 400);
    }

    // ──── Ripple ────
    function addRipple(e) {
        var btn = e.currentTarget;
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ob-ripple';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 650);
    }

    // ──── Wait for preloader ────
    function waitAndShow() {
        var preloader = document.getElementById('preloader');
        if (!preloader) { show(); return; }
        var check = function () {
            var s = window.getComputedStyle(preloader);
            if (s.opacity === '0' || s.display === 'none' || s.visibility === 'hidden' ||
                parseFloat(s.opacity) < 0.1 || preloader.classList.contains('loaded')) {
                setTimeout(show, 400);
                return;
            }
            requestAnimationFrame(check);
        };
        setTimeout(check, 500);
        // Fallback: force-show after 4s even if preloader is still visible
        setTimeout(function () {
            if (!shown) {
                // Force-hide preloader if it's still blocking
                if (preloader && !preloader.classList.contains('loaded')) {
                    preloader.classList.add('loaded');
                }
                setTimeout(show, 500);
            }
        }, 4000);
    }

    var shown = false;
    function show() {
        if (shown) return;
        shown = true;

        var overlay = document.getElementById('ob-overlay');
        if (!overlay) return;

        // ── CRITICAL: Force z-index ABOVE preloader (10000) on ALL devices ──
        overlay.style.zIndex = '10001';

        lockPage();
        overlay.classList.add('active');
    }

    // ──── Init ────
    function init() {
        buildModal();
        interceptClicks();
        document.getElementById('ob-form').addEventListener('submit', handleSubmit);
        document.getElementById('ob-btn').addEventListener('click', addRipple);
        waitAndShow();

        // Re-lock after a delay to catch links added by other scripts (mobile menu etc.)
        setTimeout(function () {
            if (document.body.classList.contains('ob-locked')) {
                lockPage();
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

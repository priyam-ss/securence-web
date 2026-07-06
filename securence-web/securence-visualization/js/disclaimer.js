/* ============================================
   SECURENCE — Disclaimer Overlay System
   ============================================ */

const Disclaimer = (function () {
    'use strict';

    var BUTTON_DELAY = 3000;

    var DISCLAIMER_TEXT = [
        'This experience is a conceptual visualization of upcoming features planned for the SECURENCE platform. It is intended to demonstrate how future safety systems may function in real-world scenarios.',
        'The interactions, alerts, and responses shown here are simulated and do not represent a live or fully operational safety service. SECURENCE does not guarantee real-time protection through this interface.',
        'By continuing, you acknowledge that this is a demonstration of future capabilities and not an active safety solution.'
    ];

    function show(callback) {

        waitForPreloader(function () {
            var paragraphs = '';
            for (var i = 0; i < DISCLAIMER_TEXT.length; i++) {
                paragraphs += '<p>' + DISCLAIMER_TEXT[i] + '</p>';
            }

            var overlay = document.createElement('div');
            overlay.className = 'disclaimer-overlay';
            overlay.innerHTML =
                '<div class="disclaimer-card">' +
                    '<h2 class="disclaimer-title">Disclaimer</h2>' +
                    '<div class="disclaimer-body">' + paragraphs + '</div>' +
                    '<div class="disclaimer-actions">' +
                        '<button class="disclaimer-btn" id="disclaimer-btn">Accept & Continue →</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);

            var btn = document.getElementById('disclaimer-btn');
            var isEnabled = false;

            // Show overlay
            setTimeout(function () {
                overlay.classList.add('visible');
            }, 100);

            // Enable button after 3 seconds
            setTimeout(function () {
                isEnabled = true;
                btn.classList.add('enabled');
            }, BUTTON_DELAY + 100);

            // Button click — only works after enabled
            btn.addEventListener('click', function () {
                if (!isEnabled) return;

                overlay.classList.remove('visible');
                overlay.classList.add('exiting');

                setTimeout(function () {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    if (callback) callback();
                }, 350);
            });
        });
    }

    function waitForPreloader(onReady) {
        var preloader = document.getElementById('viz-preloader');

        if (!preloader) { onReady(); return; }
        if (preloader.classList.contains('loaded')) { setTimeout(onReady, 400); return; }

        var fired = false;
        var observer = new MutationObserver(function () {
            if (!fired && preloader.classList.contains('loaded')) {
                fired = true;
                observer.disconnect();
                setTimeout(onReady, 600);
            }
        });

        observer.observe(preloader, { attributes: true });
        setTimeout(function () { if (!fired) { fired = true; observer.disconnect(); onReady(); } }, 5000);
    }

    return { show: show };
})();

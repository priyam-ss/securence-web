/* ============================================
   SECURENCE — Onboarding Form Logic
   Full flow: form → legal popups → processing → redirect
   ============================================ */

(function () {
    'use strict';

    // ──── Returning visitor — skip to main site ────
    // COMMENTED OUT FOR TESTING — Uncomment before deploying to production
    /*
    if (localStorage.getItem('userFilled') === 'true') {
        var loaderBar = document.getElementById('loader-bar');
        var p = 0;
        var interval = setInterval(function () {
            p += Math.random() * 25 + 10;
            if (p > 100) p = 100;
            if (loaderBar) loaderBar.style.width = p + '%';
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(function () {
                    window.location.replace('index.html');
                }, 500);
            }
        }, 120);
        return;
    }
    */

    // ──── Legal Content ────
    var LEGAL_TERMS = '<h4>1. Acceptance of Terms</h4><p>By accessing, browsing, or using the SECURENCE website, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions. Your continued use of the platform constitutes acceptance of all provisions outlined herein.</p><h4>2. About SECURENCE</h4><p>SECURENCE is an independent safety technology project currently in a prototype and development stage. All content provided on the website is for informational, demonstrational, and developmental purposes and does not represent a finalized commercial product.</p><h4>3. Website Usage Rules</h4><p>Users agree to use the SECURENCE platform responsibly and in compliance with applicable laws. Any attempt to misuse the platform, interfere with its functionality, gain unauthorized access, or exploit vulnerabilities is strictly prohibited.</p><h4>4. Intellectual Property Rights</h4><p>All content, materials, and concepts presented on the SECURENCE platform — including designs, features, system logic, visual elements, text, and branding — are the intellectual property of the project. Users are not permitted to copy, reproduce, distribute, or modify any part without prior written permission.</p><h4>5. Concept & Innovation Protection</h4><p>The ideas, systems, and innovations presented within SECURENCE are original and proprietary. Users are strictly prohibited from replicating, reverse engineering, or using these ideas to develop similar or competing solutions.</p><h4>6. Product / Device Clause</h4><p>The SECURENCE device is currently in a prototype stage. All descriptions of features represent intended or conceptual functionality and may not reflect final implementation.</p><h4>7. Limitation of Liability</h4><p>SECURENCE shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the platform.</p><h4>8. No Guarantee Clause</h4><p>SECURENCE does not guarantee personal safety, prevention of harm, or successful outcomes in real-world situations.</p><h4>9. Termination of Access</h4><p>SECURENCE reserves the right to restrict, suspend, or terminate access at any time without prior notice.</p><h4>10. Modifications to Terms</h4><p>These Terms & Conditions may be updated or modified at any time. Continued use after updates constitutes acceptance.</p><h4>11. Governing Framework</h4><p>These Terms & Conditions are interpreted in accordance with applicable laws and general principles governing digital platforms and intellectual property.</p>';

    var LEGAL_PRIVACY = '<h4>1. Introduction</h4><p>SECURENCE is an independent safety technology initiative. This Privacy Policy explains how information is collected, processed, and handled when users interact with the SECURENCE website.</p><h4>2. Information We Collect</h4><p>SECURENCE collects only limited and user-provided information necessary for communication and basic interaction. This may include personal details such as name, email address, phone number, and address.</p><h4>3. How We Collect It</h4><p>Information is collected primarily through direct user interaction, including forms and submissions. SECURENCE does not employ hidden tracking mechanisms, behavioral analytics tools, or advertising trackers.</p><h4>4. Why We Collect It</h4><p>The information collected is used solely for responding to user inquiries, reviewing collaboration requests, and improving understanding of user needs. Data is not used for advertising, profiling, or commercial resale.</p><h4>5. Data Storage & Security</h4><p>SECURENCE operates on a minimal data retention model. Form submissions are processed through serverless backend systems. Reasonable technical measures are implemented to ensure secure transmission.</p><h4>6. Data Sharing</h4><p>SECURENCE does not sell, rent, or trade user data under any circumstances.</p><h4>7. User Rights</h4><p>Users have the right to request access, corrections, or deletion of their information.</p><h4>8. Cookies / Tracking</h4><p>SECURENCE does not currently use cookies, tracking pixels, or behavioral analytics.</p><h4>9. Third-party Services</h4><p>The platform may rely on third-party services such as hosting providers, governed by their own privacy policies.</p><h4>10. Policy Updates</h4><p>This Privacy Policy may be updated periodically. Continued use constitutes acceptance.</p>';

    var LEGAL_DATA = {
        terms: { title: 'Terms & Conditions', html: LEGAL_TERMS },
        privacy: { title: 'Privacy Policy', html: LEGAL_PRIVACY }
    };

    // ──── Open Legal Popup ────
    function openLegal(type) {
        var data = LEGAL_DATA[type];
        if (!data) return;
        var titleEl = document.getElementById('ob-legal-title');
        var bodyEl = document.getElementById('ob-legal-body');
        var overlay = document.getElementById('ob-legal-overlay');
        if (!titleEl || !bodyEl || !overlay) return;
        titleEl.textContent = data.title;
        bodyEl.innerHTML = data.html;
        overlay.classList.add('active');
    }

    function closeLegal() {
        var overlay = document.getElementById('ob-legal-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    // ──── Error Popup ────
    function showPopup(message) {
        var existing = document.querySelector('.ob-popup');
        if (existing) existing.remove();

        var popup = document.createElement('div');
        popup.className = 'ob-popup ob-popup-error';
        popup.innerHTML =
            '<div class="ob-popup-backdrop"></div>' +
            '<div class="ob-popup-card">' +
                '<div class="ob-popup-icon">' +
                    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<circle cx="12" cy="12" r="10"/>' +
                        '<line x1="12" y1="8" x2="12" y2="12"/>' +
                        '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="ob-popup-title">Verification Required</div>' +
                '<div class="ob-popup-msg">' + message + '</div>' +
                '<button class="ob-popup-btn" type="button">Got it</button>' +
            '</div>';

        document.body.appendChild(popup);

        function closePopup() {
            var card = popup.querySelector('.ob-popup-card');
            var bg = popup.querySelector('.ob-popup-backdrop');
            if (card) card.style.animation = 'obPopOut 0.3s ease forwards';
            if (bg) bg.style.animation = 'obPopOut 0.3s ease forwards';
            setTimeout(function () { popup.remove(); }, 350);
        }

        popup.querySelector('.ob-popup-btn').addEventListener('click', closePopup);
        popup.querySelector('.ob-popup-backdrop').addEventListener('click', closePopup);
    }

    // ──── Processing Animation ────
    function startProcessing() {
        var overlay = document.getElementById('ob-process-overlay');
        var stepsEl = document.getElementById('ob-proc-steps');
        if (!overlay || !stepsEl) return;
        stepsEl.innerHTML = '';
        overlay.classList.add('active');

        var steps = [
            'Initializing secure channel...',
            'Encrypting user identity...',
            'Verifying access...',
            'Access granted'
        ];

        var delay = 0;
        for (var i = 0; i < steps.length; i++) {
            (function (index) {
                delay += (index === 0 ? 600 : 1400);
                setTimeout(function () {
                    var step = document.createElement('div');
                    step.className = 'ob-step';
                    step.innerHTML =
                        '<div class="ob-step-indicator">' +
                            '<div class="ob-step-spinner"></div>' +
                            '<div class="ob-step-check">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
                                    '<polyline points="20 6 9 17 4 12"/>' +
                                '</svg>' +
                            '</div>' +
                        '</div>' +
                        '<span class="ob-step-text">' + steps[index] + '</span>';
                    stepsEl.appendChild(step);

                    setTimeout(function () { step.classList.add('show'); }, 30);

                    setTimeout(function () {
                        step.classList.add('done');
                        if (index === steps.length - 1) {
                            step.classList.add('granted');

                            // ════════════════════════════════════════════
                            // FIREBASE — Save onboarding data to Firestore
                            // ════════════════════════════════════════════
                            try {
                                if (typeof db !== 'undefined') {
                                    var form = document.getElementById('onboarding-form');
                                    if (form) {
                                        var formName = (form.querySelector('[name="name"]') || {}).value || '';
                                        var formEmail = (form.querySelector('[name="email"]') || {}).value || '';
                                        var formPhone = (form.querySelector('[name="phone"]') || {}).value || '';
                                        var formAddress = (form.querySelector('[name="address"]') || {}).value || '';

                                        if (formName.trim() && formEmail.trim()) {
                                            db.collection('users').add({
                                                name: formName.trim(),
                                                email: formEmail.trim(),
                                                phone: formPhone.trim(),
                                                address: formAddress.trim(),
                                                termsAccepted: true,
                                                timestamp: new Date().toISOString(),
                                                userAgent: navigator.userAgent,
                                                source: 'onboarding_standalone'
                                            }).catch(function (err) {
                                                console.warn('Firebase write failed:', err);
                                            });
                                        }
                                    }
                                }
                            } catch (err) {
                                console.warn('Firebase save error:', err);
                            }

                            // COMMENTED OUT FOR TESTING — Uncomment before deploying
                            /*
                            setTimeout(function () {
                                localStorage.setItem('userFilled', 'true');
                                window.location.replace('index.html');
                            }, 900);
                            */
                            // TESTING: just close the overlay after animation
                            setTimeout(function () {
                                overlay.classList.remove('active');
                                stepsEl.innerHTML = '';
                            }, 1500);
                        }
                    }, 1000);
                }, delay);
            })(i);
        }
    }

    // ──── Global Event Delegation ────
    // This handles ALL clicks in one place — avoids timing issues
    document.addEventListener('click', function (e) {

        // Legal link click (Terms / Privacy)
        var legalLink = e.target.closest('[data-legal]');
        if (legalLink) {
            e.preventDefault();
            e.stopPropagation();
            // Prevent checkbox toggle when clicking link inside label
            var checkbox = document.getElementById('terms-checkbox');
            if (checkbox) {
                var wasChecked = checkbox.checked;
                setTimeout(function () {
                    checkbox.checked = wasChecked;
                }, 0);
            }
            openLegal(legalLink.getAttribute('data-legal'));
            return;
        }

        // Legal popup close button
        if (e.target.id === 'ob-legal-close' || e.target.closest('#ob-legal-close')) {
            closeLegal();
            return;
        }

        // Legal overlay backdrop click
        if (e.target.id === 'ob-legal-overlay') {
            closeLegal();
            return;
        }
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLegal();
    });

    // ──── Form Submit ────
    document.addEventListener('submit', function (e) {
        var form = document.getElementById('onboarding-form');
        if (!form || e.target !== form) return;
        e.preventDefault();

        var name = form.querySelector('[name="name"]');
        var email = form.querySelector('[name="email"]');
        var phone = form.querySelector('[name="phone"]');
        var address = form.querySelector('[name="address"]');
        var terms = document.getElementById('terms-checkbox');

        if (!name.value.trim() || !email.value.trim() || !phone.value.trim() || !address.value.trim()) {
            showPopup('Please fill in all required fields before proceeding.');
            return;
        }

        if (!terms || !terms.checked) {
            showPopup('You must read and accept the Terms & Conditions and Privacy Policy to continue.');
            return;
        }

        startProcessing();
    });

})();

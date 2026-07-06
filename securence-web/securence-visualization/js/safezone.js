/* ============================================
   SECURENCE — Safe Zone Breach Simulation v2
   Clean timeline-based story flow
   ============================================ */
(function () {
    'use strict';
    SimEngine.initPreloader();

    const scene   = document.getElementById('sim-scene');
    const figure  = document.getElementById('sim-figure');
    const dot     = document.getElementById('sim-dot');
    const glow    = document.getElementById('sim-glow');
    const zone    = document.getElementById('sim-zone');
    const badge   = document.getElementById('sim-badge');
    const badgeTx = document.getElementById('badge-text');
    const popups  = document.getElementById('sim-popups');
    const startB  = document.getElementById('btn-start');

    function setBadge(text, isAlert) {
        badgeTx.textContent = text;
        badge.classList.toggle('alert', isAlert);
    }

    function reset() {
        SimEngine.fullReset();
        figure.style.left = '33%'; figure.style.bottom = '48%';
        figure.classList.remove('walking');
        dot.classList.remove('alert');
        glow.classList.remove('alert-glow');
        zone.classList.remove('breached');
        scene.classList.remove('screen-shake');
        popups.innerHTML = '';
        setBadge('ZONE ACTIVE', false);
        SimEngine.btnStart(startB);
    }

    async function run() {
        if (SimEngine.isRunning()) return;
        const signal = SimEngine.start();
        SimEngine.btnRunning(startB);

        try {
            await SimEngine.runTimeline([
                // STAGE 1 — Safe State
                { delay: 0, action: () => setBadge('ZONE ACTIVE', false) },
                { delay: 400, action: () => SimEngine.popup(popups, 'User within safe zone', 'success', signal) },

                // STAGE 2 — Movement
                { delay: 600, action: () => {
                    figure.classList.add('walking');
                    figure.style.left = '48%'; figure.style.bottom = '42%';
                }},
                { delay: 2200, action: () => {
                    figure.style.left = '56%'; figure.style.bottom = '36%';
                }},
                { delay: 1800, action: () => SimEngine.popup(popups, 'User approaching boundary…', 'warning', signal, 1500) },

                // STAGE 3 — Breach
                { delay: 400, action: () => {
                    figure.style.left = '68%'; figure.style.bottom = '30%';
                }},
                { delay: 2000, action: () => {
                    figure.classList.remove('walking');
                    zone.classList.add('breached');
                    dot.classList.add('alert');
                    glow.classList.add('alert-glow');
                    SimEngine.shake(scene, 400);
                    setBadge('BREACHED', true);
                }},

                // STAGE 4 — Alert System
                { delay: 500, action: () => SimEngine.popup(popups, '⚠ SAFE ZONE BREACHED', 'danger', signal) },
                { delay: 400, action: () => SimEngine.popup(popups, 'Analyzing risk level…', 'warning', signal) },
                { delay: 400, action: () => {
                    SimEngine.shake(scene, 300);
                }},
                { delay: 200, action: () => SimEngine.popup(popups, '🚨 ALERT TRIGGERED', 'danger', signal) },
                { delay: 300, action: () => SimEngine.popup(popups, '📍 LOCATION SHARED', 'danger', signal) },

                // STAGE 5 — Stabilization
                { delay: 600, action: () => {
                    setBadge('TRACKING', true);
                }},
                { delay: 300, action: () => SimEngine.popup(popups, 'Monitoring continues…', 'info', signal, 2500) },

                // Complete
                { delay: 500, action: () => {
                    SimEngine.complete();
                    SimEngine.btnReplay(startB);
                }},
            ], signal);
        } catch (e) {
            if (e.name !== 'AbortError') throw e;
        }
    }

    startB.addEventListener('click', () => {
        if (SimEngine.isRunning()) { reset(); setTimeout(run, 250); }
        else if (SimEngine.isComplete()) { reset(); setTimeout(run, 250); }
        else run();
    });
})();

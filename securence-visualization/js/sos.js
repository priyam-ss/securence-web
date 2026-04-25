/* ============================================
   SECURENCE — Smart SOS Simulation v2
   Clean timeline-based story flow
   ============================================ */
(function () {
    'use strict';
    SimEngine.initPreloader();

    const scene   = document.getElementById('sim-scene');
    const figure  = document.getElementById('sim-figure');
    const dot     = document.getElementById('sim-dot');
    const glow    = document.getElementById('sim-glow');
    const badge   = document.getElementById('sim-badge');
    const badgeTx = document.getElementById('badge-text');
    const pin     = document.getElementById('sim-pin');
    const popups  = document.getElementById('sim-popups');
    const startB  = document.getElementById('btn-start');

    function setBadge(text, isAlert) {
        badgeTx.textContent = text;
        badge.classList.toggle('alert', isAlert);
    }

    function showPin() {
        const l = parseFloat(figure.style.left) || 15;
        pin.style.left = (l + 2) + '%';
        pin.style.bottom = '58%';
        pin.classList.add('visible');
    }

    function reset() {
        SimEngine.fullReset();
        figure.style.left = '15%'; figure.style.bottom = '40%';
        figure.classList.remove('walking');
        dot.classList.remove('alert');
        glow.classList.remove('alert-glow');
        pin.classList.remove('visible');
        scene.classList.remove('screen-shake');
        popups.innerHTML = '';
        setBadge('MONITORING', false);
        SimEngine.btnStart(startB);
    }

    async function run() {
        if (SimEngine.isRunning()) return;
        const signal = SimEngine.start();
        SimEngine.btnRunning(startB);

        try {
            await SimEngine.runTimeline([
                // STAGE 1 — Idle
                { delay: 0, action: () => setBadge('MONITORING', false) },
                { delay: 400, action: () => SimEngine.popup(popups, 'System monitoring…', 'info', signal) },

                // STAGE 2 — Movement
                { delay: 600, action: () => { figure.classList.add('walking'); figure.style.left = '38%'; } },
                { delay: 2000, action: () => SimEngine.popup(popups, 'Monitoring activity…', 'info', signal) },
                { delay: 400, action: () => { figure.style.left = '55%'; } },

                // STAGE 3 — Risk Detection
                { delay: 2200, action: () => {
                    figure.classList.remove('walking'); figure.style.left = '58%';
                }},
                { delay: 600, action: () => SimEngine.popup(popups, '⚠ No response detected', 'warning', signal) },
                { delay: 400, action: () => setBadge('ALERT', false) },

                // STAGE 4 — System Decision
                { delay: 800, action: () => SimEngine.popup(popups, 'Analyzing situation…', 'info', signal) },

                // STAGE 5 — Action
                { delay: 500, action: () => {
                    setBadge('EMERGENCY', true);
                    dot.classList.add('alert');
                    glow.classList.add('alert-glow');
                    SimEngine.shake(scene, 350);
                }},
                { delay: 400, action: () => SimEngine.popup(popups, '🚨 SOS ALERT INITIATED', 'danger', signal) },
                { delay: 300, action: () => SimEngine.popup(popups, '📍 LIVE LOCATION SHARED', 'danger', signal) },
                { delay: 200, action: () => showPin() },
                { delay: 300, action: () => SimEngine.popup(popups, '📡 CONTACTING EMERGENCY CONTACTS', 'danger', signal) },

                // STAGE 6 — Resolution
                { delay: 800, action: () => {
                    setBadge('RESOLVED', false);
                    glow.classList.remove('alert-glow');
                }},
                { delay: 300, action: () => SimEngine.popup(popups, '✔ Help is on the way', 'success', signal, 2500) },

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

/* ============================================
   SECURENCE — AI Threat Detection Simulation v2
   Clean timeline-based story flow
   ============================================ */
(function () {
    'use strict';
    SimEngine.initPreloader();

    const scene   = document.getElementById('sim-scene');
    const figure  = document.getElementById('sim-figure');
    const dot     = document.getElementById('sim-dot');
    const glow    = document.getElementById('sim-glow');
    const scan    = document.getElementById('ai-scan');
    const suspect = document.getElementById('ai-suspect');
    const box     = document.getElementById('ai-box');
    const prob    = document.getElementById('ai-prob');
    const fill    = document.getElementById('ai-fill');
    const val     = document.getElementById('ai-val');
    const badge   = document.getElementById('sim-badge');
    const badgeTx = document.getElementById('badge-text');
    const popups  = document.getElementById('sim-popups');
    const startB  = document.getElementById('btn-start');

    let probAnim = null;

    function setBadge(text, isAlert) {
        badgeTx.textContent = text;
        badge.classList.toggle('alert', isAlert);
    }

    function setProb(target, durationMs) {
        const start = parseInt(val.textContent) || 0;
        const steps = Math.ceil(durationMs / 40);
        const inc = (target - start) / steps;
        let cur = start, step = 0;
        if (probAnim) clearInterval(probAnim);
        probAnim = setInterval(() => {
            step++; cur += inc;
            if (step >= steps) { cur = target; clearInterval(probAnim); probAnim = null; }
            const v = Math.round(cur);
            val.textContent = v + '%';
            fill.style.width = v + '%';
            fill.style.background = v < 30 ? 'var(--safe)' : v < 60 ? '#fbbf24' : 'var(--alert)';
        }, 40);
    }

    function reset() {
        SimEngine.fullReset();
        if (probAnim) { clearInterval(probAnim); probAnim = null; }
        figure.style.left = '18%'; figure.style.bottom = '38%';
        figure.classList.remove('walking');
        dot.classList.remove('alert');
        glow.classList.remove('alert-glow');
        scan.classList.remove('active');
        suspect.classList.remove('visible', 'detected');
        suspect.style.left = '78%'; suspect.style.bottom = '35%';
        box.classList.remove('visible');
        prob.classList.remove('visible');
        fill.style.width = '0%'; fill.style.background = 'var(--safe)';
        val.textContent = '0%';
        scene.classList.remove('screen-shake');
        popups.innerHTML = '';
        setBadge('AI ACTIVE', false);
        SimEngine.btnStart(startB);
    }

    async function run() {
        if (SimEngine.isRunning()) return;
        const signal = SimEngine.start();
        SimEngine.btnRunning(startB);

        try {
            await SimEngine.runTimeline([
                // STAGE 1 — Scanning
                { delay: 0, action: () => { setBadge('SCANNING', false); scan.classList.add('active'); } },
                { delay: 400, action: () => SimEngine.popup(popups, 'Scanning environment…', 'info', signal) },
                { delay: 300, action: () => { figure.classList.add('walking'); figure.style.left = '32%'; } },
                { delay: 1200, action: () => { prob.classList.add('visible'); setProb(8, 1200); } },

                // STAGE 2 — Pattern analysis
                { delay: 1800, action: () => { figure.style.left = '40%'; } },
                { delay: 800, action: () => SimEngine.popup(popups, 'Pattern analysis in progress…', 'info', signal) },
                { delay: 200, action: () => setProb(14, 1000) },

                // STAGE 3 — Suspect appears
                { delay: 1500, action: () => {
                    suspect.classList.add('visible');
                    setBadge('ANOMALY', false);
                }},
                { delay: 800, action: () => SimEngine.popup(popups, 'Unusual activity detected', 'warning', signal) },
                { delay: 200, action: () => setProb(38, 1800) },

                // STAGE 4 — Suspect moves closer
                { delay: 1200, action: () => {
                    suspect.style.left = '60%'; suspect.style.bottom = '33%';
                    figure.classList.remove('walking'); figure.style.left = '42%';
                }},
                { delay: 1200, action: () => SimEngine.popup(popups, 'Threat probability increasing…', 'warning', signal) },
                { delay: 200, action: () => setProb(62, 1500) },

                // STAGE 5 — Detection
                { delay: 1200, action: () => {
                    suspect.classList.add('detected');
                    box.classList.add('visible');
                    dot.classList.add('alert');
                    glow.classList.add('alert-glow');
                    SimEngine.shake(scene, 350);
                    setBadge('THREAT', true);
                    setProb(89, 1200);
                }},
                { delay: 500, action: () => SimEngine.popup(popups, '⚠ Threat identified — Proximity alert', 'danger', signal) },

                // STAGE 6 — Preventive alert
                { delay: 500, action: () => {
                    scan.classList.remove('active');
                    SimEngine.shake(scene, 300);
                    setProb(95, 600);
                    setBadge('ALERT', true);
                }},
                { delay: 300, action: () => SimEngine.popup(popups, '🚨 Preventive alert issued', 'danger', signal, 2500) },

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

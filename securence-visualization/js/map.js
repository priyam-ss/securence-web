/* ============================================
   SECURENCE — Safety Pulse Map Simulation v2
   Clean timeline-based story flow
   ============================================ */
(function () {
    'use strict';
    SimEngine.initPreloader();

    const scene     = document.getElementById('sim-scene');
    const mapLayer  = document.getElementById('map-layer');
    const mapPath   = document.getElementById('map-path');
    const pathLeg   = document.getElementById('map-path-legend');
    const badge     = document.getElementById('sim-badge');
    const badgeTx   = document.getElementById('badge-text');
    const glow      = document.getElementById('sim-glow');
    const popups    = document.getElementById('sim-popups');
    const startB    = document.getElementById('btn-start');

    const SAFE_PTS = [
        {x:12,y:22},{x:22,y:48},{x:10,y:65},{x:32,y:28},{x:28,y:72},
        {x:42,y:45},{x:52,y:20},{x:48,y:60},{x:18,y:38},{x:38,y:14},
        {x:8,y:52},{x:45,y:35},
    ];

    const RISK_PTS = [
        {x:62,y:30},{x:70,y:50},{x:58,y:68},{x:76,y:22},{x:68,y:42},
    ];

    function setBadge(text, isAlert) {
        badgeTx.textContent = text;
        badge.classList.toggle('alert', isAlert);
    }

    // Spawn a single dot with animation
    function spawnDot(x, y, type, signal) {
        if (signal && signal.aborted) return;
        const el = document.createElement('div');
        el.className = 'map-dot ' + type;
        el.style.left = x + '%';
        el.style.top = y + '%';
        if (type === 'risk') {
            const r = document.createElement('div');
            r.className = 'map-dot-ripple';
            el.appendChild(r);
        }
        mapLayer.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    }

    function drawPath() {
        const d = 'M 80 480 Q 140 420 200 360 Q 260 310 320 270 Q 380 240 430 220 Q 480 200 520 210 Q 560 230 540 260';
        mapPath.setAttribute('d', d);
        const len = mapPath.getTotalLength ? mapPath.getTotalLength() : 500;
        mapPath.style.strokeDasharray = len;
        mapPath.style.strokeDashoffset = len;
        mapPath.style.transition = 'none';
        mapPath.style.opacity = '1';
        requestAnimationFrame(() => {
            mapPath.style.transition = 'stroke-dashoffset 2s ease-in-out';
            mapPath.style.strokeDashoffset = '0';
        });
        pathLeg.style.transition = 'opacity 0.5s ease';
        pathLeg.style.opacity = '1';
    }

    function reset() {
        SimEngine.fullReset();
        mapLayer.innerHTML = '';
        mapPath.setAttribute('d', '');
        mapPath.style.opacity = '0';
        pathLeg.style.opacity = '0';
        glow.classList.remove('alert-glow');
        scene.classList.remove('screen-shake');
        popups.innerHTML = '';
        setBadge('SCANNING', false);
        SimEngine.btnStart(startB);
    }

    async function run() {
        if (SimEngine.isRunning()) return;
        const signal = SimEngine.start();
        SimEngine.btnRunning(startB);

        try {
            // Build timeline steps
            const steps = [];

            // Stage 1 — Collecting
            steps.push({ delay: 0, action: () => setBadge('SCANNING', false) });
            steps.push({ delay: 400, action: () => SimEngine.popup(popups, 'Analyzing community data…', 'info', signal) });

            // Spawn safe points staggered
            SAFE_PTS.forEach((p, i) => {
                steps.push({ delay: i === 0 ? 600 : 300, action: () => spawnDot(p.x, p.y, 'safe', signal) });
            });

            // Stage 2 — Safe zones identified
            steps.push({ delay: 500, action: () => SimEngine.popup(popups, 'Safe zones identified', 'success', signal) });
            steps.push({ delay: 200, action: () => setBadge('PROCESSING', false) });

            // Stage 3 — Risk zones
            steps.push({ delay: 500, action: () => SimEngine.popup(popups, 'Risk zones detected', 'warning', signal) });
            RISK_PTS.forEach((p, i) => {
                steps.push({ delay: i === 0 ? 400 : 400, action: () => spawnDot(p.x, p.y, 'risk', signal) });
            });

            // Stage 4 — High risk
            steps.push({ delay: 600, action: () => {
                setBadge('ELEVATED', true);
                glow.classList.add('alert-glow');
                SimEngine.shake(scene, 300);
            }});
            steps.push({ delay: 300, action: () => SimEngine.popup(popups, '⚠ High-risk cluster detected', 'danger', signal) });

            // Stage 5 — Safe path
            steps.push({ delay: 600, action: () => {
                setBadge('COMPLETE', false);
                glow.classList.remove('alert-glow');
                drawPath();
            }});
            steps.push({ delay: 300, action: () => SimEngine.popup(popups, '✓ Safe path generated', 'success', signal, 2500) });

            // Complete
            steps.push({ delay: 500, action: () => {
                SimEngine.complete();
                SimEngine.btnReplay(startB);
            }});

            await SimEngine.runTimeline(steps, signal);
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

/* ============================================
   SECURENCE — Smart SOS Decision System
   AI-Powered Behavior Analysis Engine
   High Fidelity JavaScript — v3
   ============================================

   LOGIC FLOW:
   MONITOR → ANALYZE → DETECT → VALIDATE → DECIDE → RESPOND

   BEHAVIOR TRACKING:
   1. Movement Speed
   2. Pause Duration
   3. Irregular Motion Pattern
   4. Sudden Stops

   AI DECISION CHAIN:
   Normal Activity → Anomaly Detected → Confirmation Wait →
   Risk Assessment → Threat Validated → SOS Triggered

   ============================================ */

(function () {
    'use strict';

    // ──────────── Initialize Preloader ────────────
    SimEngine.initPreloader();

    // ══════════════════════════════════════════════
    // DOM REFERENCES
    // ══════════════════════════════════════════════
    const DOM = {
        // App
        app: document.getElementById('sos-app'),
        scene: document.getElementById('sos-scene'),
        sceneInner: document.getElementById('sos-scene-inner'),

        // Figure
        figure: document.getElementById('sos-figure'),
        figureDot: document.getElementById('sos-figure-dot'),
        figurePing: document.getElementById('sos-figure-ping'),
        alertGlow: document.getElementById('sos-alert-glow'),

        // Environment
        detectionGrid: document.getElementById('sos-detection-grid'),
        scanline: document.getElementById('sos-scanline'),
        ambientGlow: document.getElementById('sos-ambient-glow'),
        trailCanvas: document.getElementById('sos-trail-canvas'),
        pathNodes: document.getElementById('sos-path-nodes'),
        threatZone: document.getElementById('sos-threat-zone'),
        pin: document.getElementById('sos-pin'),
        alertFlash: document.getElementById('sos-alert-flash'),

        // AI Indicator
        aiIndicator: document.getElementById('sos-ai-indicator'),
        aiLabel: document.getElementById('sos-ai-label'),

        // Top Bar
        badge: document.getElementById('sos-badge'),
        badgeText: document.getElementById('sos-badge-text'),
        systemClock: document.getElementById('sos-system-clock'),

        // Telemetry Left — Behavior
        telemLeft: document.getElementById('sos-telemetry-left'),
        speed: document.getElementById('sos-speed'),
        avgSpeed: document.getElementById('sos-avg-speed'),
        pauseDur: document.getElementById('sos-pause-dur'),
        irregular: document.getElementById('sos-irregular'),
        pattern: document.getElementById('sos-pattern'),
        heartbeatCanvas: document.getElementById('sos-heartbeat-canvas'),

        // Telemetry Right — Threat
        telemRight: document.getElementById('sos-telemetry-right'),
        riskLevel: document.getElementById('sos-risk-level'),
        threatPct: document.getElementById('sos-threat-pct'),
        threatBar: document.getElementById('sos-threat-bar'),
        aiConf: document.getElementById('sos-ai-conf'),
        decision: document.getElementById('sos-decision'),
        response: document.getElementById('sos-response'),

        // Bottom
        timelineFill: document.getElementById('sos-timeline-fill'),
        timelineLabel: document.getElementById('sos-timeline-label'),
        emergency: document.getElementById('sos-emergency'),
        emergencyLabel: document.getElementById('sos-emergency-label'),

        // Popups
        popups: document.getElementById('sos-popups'),

        // Buttons
        startBtn: document.getElementById('btn-start'),
        resetBtn: document.getElementById('btn-reset'),
    };

    // ══════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════
    const STATE = {
        isRunning: false,
        isComplete: false,
        abortController: null,
        clockInterval: null,
        heartbeatInterval: null,
        userPosition: { x: 12, y: 60 },
        speedHistory: [],
        currentSpeed: 0,
        pauseTime: 0,
        threatLevel: 0,
        trailPoints: [],
    };

    // ══════════════════════════════════════════════
    // TRAIL CANVAS SYSTEM
    // ══════════════════════════════════════════════
    let trailCtx = null;
    let trailWidth = 0;
    let trailHeight = 0;

    function initTrailCanvas() {
        const canvas = DOM.trailCanvas;
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        trailWidth = rect.width;
        trailHeight = rect.height;
        canvas.width = trailWidth;
        canvas.height = trailHeight;
        trailCtx = canvas.getContext('2d');
    }

    function addTrailPoint(xPct, yPct) {
        if (!trailCtx) return;
        const x = (xPct / 100) * trailWidth;
        const y = (yPct / 100) * trailHeight;
        STATE.trailPoints.push({ x, y, alpha: 1.0, time: Date.now() });
    }

    function drawTrail() {
        if (!trailCtx || STATE.trailPoints.length < 2) return;

        trailCtx.clearRect(0, 0, trailWidth, trailHeight);

        const now = Date.now();
        const fadeTime = 15000; // 15 seconds fade

        // Filter out old points
        STATE.trailPoints = STATE.trailPoints.filter(p => now - p.time < fadeTime);

        if (STATE.trailPoints.length < 2) return;

        // Draw trail line
        for (let i = 1; i < STATE.trailPoints.length; i++) {
            const p1 = STATE.trailPoints[i - 1];
            const p2 = STATE.trailPoints[i];

            const age1 = (now - p1.time) / fadeTime;
            const age2 = (now - p2.time) / fadeTime;
            const alpha = Math.max(0, 1 - (age1 + age2) / 2) * 0.6;

            trailCtx.beginPath();
            trailCtx.moveTo(p1.x, p1.y);
            trailCtx.lineTo(p2.x, p2.y);
            trailCtx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            trailCtx.lineWidth = 2;
            trailCtx.lineCap = 'round';
            trailCtx.stroke();
        }

        // Draw dots at each point
        STATE.trailPoints.forEach(p => {
            const age = (now - p.time) / fadeTime;
            const alpha = Math.max(0, 1 - age) * 0.4;
            const radius = 2 + (1 - Math.max(0, 1 - age)) * 1;

            trailCtx.beginPath();
            trailCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            trailCtx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
            trailCtx.fill();
        });
    }

    let trailAnimFrame = null;
    function startTrailAnimation() {
        function animate() {
            drawTrail();
            trailAnimFrame = requestAnimationFrame(animate);
        }
        trailAnimFrame = requestAnimationFrame(animate);
    }

    function stopTrailAnimation() {
        if (trailAnimFrame) {
            cancelAnimationFrame(trailAnimFrame);
            trailAnimFrame = null;
        }
    }

    // ══════════════════════════════════════════════
    // HEARTBEAT CHART
    // ══════════════════════════════════════════════
    let heartbeatCtx = null;
    let heartbeatData = [];
    const HB_MAX_POINTS = 40;

    function initHeartbeat() {
        const canvas = DOM.heartbeatCanvas;
        if (!canvas) return;
        heartbeatCtx = canvas.getContext('2d');
        heartbeatData = [];
        for (let i = 0; i < HB_MAX_POINTS; i++) {
            heartbeatData.push(0.5); // midline
        }
    }

    function pushHeartbeatValue(val) {
        heartbeatData.push(val);
        if (heartbeatData.length > HB_MAX_POINTS) heartbeatData.shift();
    }

    function drawHeartbeat(color) {
        if (!heartbeatCtx) return;
        const c = DOM.heartbeatCanvas;
        const w = c.width;
        const h = c.height;
        heartbeatCtx.clearRect(0, 0, w, h);

        // Mid baseline
        heartbeatCtx.beginPath();
        heartbeatCtx.moveTo(0, h / 2);
        heartbeatCtx.lineTo(w, h / 2);
        heartbeatCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        heartbeatCtx.lineWidth = 1;
        heartbeatCtx.stroke();

        // Data line
        heartbeatCtx.beginPath();
        const stepX = w / (HB_MAX_POINTS - 1);
        for (let i = 0; i < heartbeatData.length; i++) {
            const x = i * stepX;
            const y = (1 - heartbeatData[i]) * h;
            if (i === 0) heartbeatCtx.moveTo(x, y);
            else heartbeatCtx.lineTo(x, y);
        }
        heartbeatCtx.strokeStyle = color || 'rgba(0, 255, 136, 0.6)';
        heartbeatCtx.lineWidth = 1.5;
        heartbeatCtx.stroke();
    }

    function startHeartbeatUpdater(mode) {
        STATE.heartbeatInterval = setInterval(() => {
            let val;
            if (mode === 'normal') {
                // Regular walking rhythm
                const t = Date.now() / 400;
                val = 0.5 + Math.sin(t) * 0.15 + (Math.random() - 0.5) * 0.05;
            } else if (mode === 'irregular') {
                const t = Date.now() / 300;
                val = 0.5 + Math.sin(t * 1.7) * 0.25 + Math.sin(t * 0.3) * 0.1 + (Math.random() - 0.5) * 0.15;
            } else if (mode === 'stopped') {
                val = 0.5 + (Math.random() - 0.5) * 0.08;
            } else if (mode === 'alert') {
                const t = Date.now() / 150;
                val = 0.5 + Math.sin(t) * 0.35 + (Math.random() - 0.5) * 0.1;
            } else {
                val = 0.5;
            }
            pushHeartbeatValue(Math.max(0, Math.min(1, val)));

            const color = mode === 'alert' ? 'rgba(255, 59, 59, 0.7)' :
                mode === 'irregular' ? 'rgba(251, 191, 36, 0.6)' :
                mode === 'stopped' ? 'rgba(249, 115, 22, 0.5)' :
                'rgba(0, 255, 136, 0.6)';
            drawHeartbeat(color);
        }, 80);
    }

    function stopHeartbeatUpdater() {
        if (STATE.heartbeatInterval) {
            clearInterval(STATE.heartbeatInterval);
            STATE.heartbeatInterval = null;
        }
    }

    // ══════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ══════════════════════════════════════════════

    function wait(ms, signal) {
        return new Promise((resolve, reject) => {
            const id = setTimeout(resolve, ms);
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(id);
                    reject(new DOMException('Aborted', 'AbortError'));
                }, { once: true });
            }
        });
    }

    function getTimeString() {
        return new Date().toTimeString().split(' ')[0];
    }

    function startClock() {
        updateClock();
        STATE.clockInterval = setInterval(updateClock, 1000);
    }

    function updateClock() {
        if (DOM.systemClock) DOM.systemClock.textContent = 'SYS TIME: ' + getTimeString();
    }

    function stopClock() {
        if (STATE.clockInterval) { clearInterval(STATE.clockInterval); STATE.clockInterval = null; }
    }

    function randRange(min, max) {
        return min + Math.random() * (max - min);
    }

    // ══════════════════════════════════════════════
    // POPUP SYSTEM
    // ══════════════════════════════════════════════

    async function showPopup(text, type, signal, stayMs) {
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const stay = stayMs || 2000;

        const el = document.createElement('div');
        el.className = 'sos-popup ' + (type || '');
        el.textContent = text;
        DOM.popups.appendChild(el);

        await wait(30, signal);
        el.classList.add('visible');
        await wait(400, signal);
        await wait(stay, signal);

        el.classList.remove('visible');
        el.classList.add('exiting');
        await wait(400, signal);

        if (el.parentNode) el.parentNode.removeChild(el);
    }

    // ══════════════════════════════════════════════
    // BADGE SYSTEM
    // ══════════════════════════════════════════════

    function setBadge(text, className) {
        DOM.badgeText.textContent = text;
        DOM.badge.className = 'sos-status-badge';
        if (className) DOM.badge.classList.add(className);
    }

    // ══════════════════════════════════════════════
    // AI INDICATOR
    // ══════════════════════════════════════════════

    function setAI(label, mode) {
        DOM.aiLabel.textContent = label;
        DOM.aiIndicator.className = 'sos-ai-indicator';
        if (mode) DOM.aiIndicator.classList.add(mode);
    }

    // ══════════════════════════════════════════════
    // TELEMETRY UPDATES
    // ══════════════════════════════════════════════

    function updateBehaviorTelemetry(speed, avgSpeed, pauseDur, irregular, pattern) {
        DOM.speed.textContent = speed.toFixed(1) + ' km/h';
        DOM.avgSpeed.textContent = avgSpeed.toFixed(1) + ' km/h';
        DOM.pauseDur.textContent = pauseDur.toFixed(1) + ' s';
        DOM.irregular.textContent = irregular ? 'YES' : 'NO';
        DOM.irregular.style.color = irregular ? '#fbbf24' : 'var(--text-primary)';

        DOM.pattern.textContent = pattern;
        DOM.pattern.className = 'sos-telem-value sos-pattern-indicator';
        if (pattern === 'NORMAL') DOM.pattern.classList.add('normal');
        else if (pattern === 'IRREGULAR') DOM.pattern.classList.add('irregular');
        else if (pattern === 'STOPPED') DOM.pattern.classList.add('stopped');
        else if (pattern === 'DANGER') DOM.pattern.classList.add('danger');
    }

    function updateThreatTelemetry(riskLevel, threatPct, aiConf, decision, response) {
        DOM.riskLevel.textContent = riskLevel;
        DOM.riskLevel.className = 'sos-telem-value sos-risk-value';
        if (riskLevel === 'LOW') DOM.riskLevel.classList.add('low');
        else if (riskLevel === 'MEDIUM') DOM.riskLevel.classList.add('medium');
        else if (riskLevel === 'HIGH') DOM.riskLevel.classList.add('high');
        else if (riskLevel === 'CRITICAL') DOM.riskLevel.classList.add('critical');

        DOM.threatPct.textContent = threatPct + '%';
        DOM.threatBar.style.width = Math.min(threatPct, 100) + '%';

        // Bar color based on threat
        if (threatPct > 80) DOM.threatBar.style.background = '#ff3b3b';
        else if (threatPct > 50) DOM.threatBar.style.background = '#f97316';
        else if (threatPct > 25) DOM.threatBar.style.background = '#fbbf24';
        else DOM.threatBar.style.background = '#00ff88';

        DOM.aiConf.textContent = aiConf;
        DOM.decision.textContent = decision;
        DOM.response.textContent = response;

        // Decision color
        if (decision === 'SOS TRIGGERED') {
            DOM.decision.style.color = '#ff3b3b';
        } else if (decision === 'ANALYZING') {
            DOM.decision.style.color = '#fbbf24';
        } else {
            DOM.decision.style.color = '';
        }
    }

    // ══════════════════════════════════════════════
    // TIMELINE
    // ══════════════════════════════════════════════

    function setTimeline(pct, label) {
        DOM.timelineFill.style.width = pct + '%';
        DOM.timelineLabel.textContent = 'PHASE: ' + label;
    }

    // ══════════════════════════════════════════════
    // VISUAL EFFECTS
    // ══════════════════════════════════════════════

    function screenShake(duration) {
        DOM.sceneInner.classList.add('sos-screen-shake');
        setTimeout(() => DOM.sceneInner.classList.remove('sos-screen-shake'), duration || 400);
    }

    function alertFlash() {
        DOM.alertFlash.classList.add('active');
        setTimeout(() => DOM.alertFlash.classList.remove('active'), 500);
    }

    function moveUser(x, y, speed) {
        const prevX = STATE.userPosition.x;
        const prevY = STATE.userPosition.y;

        // Set transition speed
        if (speed) {
            DOM.figure.style.transition = `left ${speed}s cubic-bezier(0.25,0.46,0.45,0.94), top ${speed}s cubic-bezier(0.25,0.46,0.45,0.94)`;
        }

        STATE.userPosition = { x, y };
        DOM.figure.style.left = x + '%';
        DOM.figure.style.top = y + '%';

        // Add trail point
        addTrailPoint(x, y);
    }

    function addPathNode(x, y, isAlert) {
        const node = document.createElement('div');
        node.className = 'sos-path-node' + (isAlert ? ' alert-node' : '');
        node.style.left = x + '%';
        node.style.top = y + '%';
        DOM.pathNodes.appendChild(node);

        setTimeout(() => node.classList.add('visible'), 50);

        if (isAlert) {
            const ring = document.createElement('div');
            ring.className = 'sos-path-node-ring';
            node.appendChild(ring);
        }
    }

    function showPin(x, y) {
        DOM.pin.style.left = x + '%';
        DOM.pin.style.top = (y - 5) + '%';
        DOM.pin.classList.add('visible');
    }

    function showThreatZone(x, y) {
        DOM.threatZone.style.left = (x - 4) + '%';
        DOM.threatZone.style.top = (y - 4) + '%';
        DOM.threatZone.classList.add('visible');
    }

    function showTelemetry() {
        DOM.telemLeft.classList.add('visible');
        DOM.telemRight.classList.add('visible');
    }

    function hideTelemetry() {
        DOM.telemLeft.classList.remove('visible');
        DOM.telemRight.classList.remove('visible');
    }

    // ══════════════════════════════════════════════
    // BUTTON HELPERS
    // ══════════════════════════════════════════════

    const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>';
    const ICON_REPLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    const ICON_RUNNING = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    function btnStart() {
        DOM.startBtn.disabled = false;
        DOM.startBtn.innerHTML = ICON_PLAY + ' Initialize Simulation';
    }

    function btnRunning() {
        DOM.startBtn.disabled = true;
        DOM.startBtn.innerHTML = ICON_RUNNING + ' AI Analyzing…';
    }

    function btnReplay() {
        DOM.startBtn.disabled = false;
        DOM.startBtn.innerHTML = ICON_REPLAY + ' Replay Simulation';
    }

    // ══════════════════════════════════════════════
    // FULL RESET
    // ══════════════════════════════════════════════

    function fullReset() {
        if (STATE.abortController) STATE.abortController.abort();

        STATE.isRunning = false;
        STATE.isComplete = false;
        STATE.userPosition = { x: 12, y: 60 };
        STATE.speedHistory = [];
        STATE.currentSpeed = 0;
        STATE.pauseTime = 0;
        STATE.threatLevel = 0;
        STATE.trailPoints = [];

        stopClock();
        stopHeartbeatUpdater();
        stopTrailAnimation();

        // Clear trail canvas
        if (trailCtx) trailCtx.clearRect(0, 0, trailWidth, trailHeight);

        // Reset figure
        DOM.figure.style.left = '12%';
        DOM.figure.style.top = '60%';
        DOM.figure.style.transition = '';
        DOM.figure.classList.remove('walking', 'slow-walk', 'stopped');

        // Reset dots
        DOM.figureDot.className = 'sos-figure-dot';
        DOM.figurePing.className = 'sos-figure-ping';
        DOM.alertGlow.classList.remove('active');

        // Reset environment
        DOM.detectionGrid.className = 'sos-detection-grid';
        DOM.scanline.className = 'sos-scanline';
        DOM.ambientGlow.className = 'sos-ambient-glow';
        DOM.threatZone.classList.remove('visible');
        DOM.pin.classList.remove('visible');
        DOM.alertFlash.classList.remove('active');
        DOM.scene.classList.remove('alert-vignette');

        // Reset path nodes
        DOM.pathNodes.innerHTML = '';

        // Reset AI
        setAI('AI ACTIVE', '');

        // Reset badge
        setBadge('MONITORING', '');

        // Reset popups
        DOM.popups.innerHTML = '';

        // Reset behavior telemetry
        updateBehaviorTelemetry(0, 0, 0, false, 'NORMAL');

        // Reset threat telemetry
        updateThreatTelemetry('LOW', 0, '--', 'STANDBY', 'INACTIVE');

        // Reset timeline
        setTimeline(0, 'STANDBY');

        // Reset emergency
        DOM.emergency.classList.remove('active');
        DOM.emergencyLabel.textContent = 'EMERGENCY: INACTIVE';

        // Reset heartbeat
        initHeartbeat();
        drawHeartbeat();

        // Hide telemetry
        hideTelemetry();

        // Reset button
        btnStart();
    }

    // ══════════════════════════════════════════════
    // MAIN SIMULATION SEQUENCE
    // ══════════════════════════════════════════════

    async function runSimulation() {
        if (STATE.isRunning) return;

        STATE.abortController = new AbortController();
        const signal = STATE.abortController.signal;
        STATE.isRunning = true;
        STATE.isComplete = false;

        btnRunning();
        startClock();
        initTrailCanvas();
        initHeartbeat();
        startTrailAnimation();

        try {
            // ═══════════════════════════════════════
            // STAGE 1: SYSTEM INITIALIZATION
            // ═══════════════════════════════════════
            setTimeline(5, 'INITIALIZING');

            await wait(400, signal);
            DOM.telemLeft.classList.add('visible');
            await wait(300, signal);
            DOM.telemRight.classList.add('visible');

            await wait(300, signal);
            setBadge('MONITORING', '');
            setAI('AI ACTIVE', '');
            await showPopup('AI behavior monitoring system online', 'info', signal, 2200);

            setTimeline(8, 'SYSTEM READY');
            await wait(300, signal);
            updateBehaviorTelemetry(0, 0, 0, false, 'NORMAL');
            updateThreatTelemetry('LOW', 2, '99.2%', 'STANDBY', 'INACTIVE');

            await showPopup('Behavioral analysis engine initialized', 'success', signal, 2000);

            // Start detection grid
            DOM.detectionGrid.classList.add('active');

            // ═══════════════════════════════════════
            // STAGE 2: NORMAL WALKING PHASE
            // ═══════════════════════════════════════
            setTimeline(15, 'MONITORING');
            startHeartbeatUpdater('normal');

            await wait(500, signal);
            DOM.figure.classList.add('walking');
            DOM.scanline.classList.add('active');

            // Normal walk path
            moveUser(20, 56, 2.5);
            addTrailPoint(12, 60);
            await wait(600, signal);
            updateBehaviorTelemetry(4.2, 4.2, 0, false, 'NORMAL');
            updateThreatTelemetry('LOW', 3, '99.1%', 'MONITORING', 'INACTIVE');
            addPathNode(16, 58, false);

            await showPopup('User walking — Normal activity pattern', 'info', signal, 1800);

            await wait(1800, signal);
            setTimeline(22, 'TRACKING');

            moveUser(30, 50, 2.5);
            addTrailPoint(20, 56);
            await wait(800, signal);
            updateBehaviorTelemetry(4.5, 4.3, 0, false, 'NORMAL');
            addPathNode(25, 53, false);

            await wait(1500, signal);

            moveUser(40, 48, 2);
            addTrailPoint(30, 50);
            await wait(600, signal);
            updateBehaviorTelemetry(4.1, 4.3, 0, false, 'NORMAL');
            updateThreatTelemetry('LOW', 5, '98.8%', 'MONITORING', 'INACTIVE');
            addPathNode(35, 49, false);

            await showPopup('Consistent movement pattern — No anomalies', 'success', signal, 1800);

            await wait(1500, signal);

            // ═══════════════════════════════════════
            // STAGE 3: BEHAVIOR STARTS CHANGING
            // ═══════════════════════════════════════
            setTimeline(35, 'ANALYZING');

            // Movement slows down
            moveUser(48, 44, 3);
            addTrailPoint(40, 48);
            addPathNode(44, 46, false);

            await wait(1000, signal);
            DOM.figure.classList.remove('walking');
            DOM.figure.classList.add('slow-walk');
            updateBehaviorTelemetry(2.1, 3.8, 0, false, 'NORMAL');
            updateThreatTelemetry('LOW', 8, '98.4%', 'MONITORING', 'INACTIVE');

            await showPopup('Movement speed decreasing…', 'info', signal, 1600);

            await wait(1500, signal);

            // Speed drops further
            moveUser(52, 43, 3.5);
            addTrailPoint(48, 44);
            updateBehaviorTelemetry(1.5, 3.2, 0, false, 'NORMAL');
            updateThreatTelemetry('LOW', 12, '97.8%', 'MONITORING', 'INACTIVE');

            await wait(1800, signal);

            // ═══════════════════════════════════════
            // STAGE 4: IRREGULAR MOTION DETECTED
            // ═══════════════════════════════════════
            setTimeline(45, 'IRREGULARITY');

            // Erratic direction change
            moveUser(55, 48, 1.5);
            addTrailPoint(52, 43);
            addPathNode(53, 46, false);

            await wait(800, signal);
            stopHeartbeatUpdater();
            startHeartbeatUpdater('irregular');
            updateBehaviorTelemetry(1.8, 2.9, 0, true, 'IRREGULAR');
            updateThreatTelemetry('MEDIUM', 22, '94.6%', 'MONITORING', 'INACTIVE');
            setAI('ANALYZING', 'analyzing');

            await showPopup('⚠ Irregular movement pattern detected', 'warning', signal, 2200);

            await wait(800, signal);

            // Another erratic move
            moveUser(53, 52, 1.5);
            addTrailPoint(55, 48);
            addPathNode(54, 50, true);

            await wait(1200, signal);
            updateBehaviorTelemetry(1.2, 2.5, 0, true, 'IRREGULAR');
            updateThreatTelemetry('MEDIUM', 30, '91.2%', 'ANALYZING', 'INACTIVE');

            await showPopup('Analyzing movement pattern anomaly…', 'warning', signal, 1800);

            await wait(1000, signal);

            // ═══════════════════════════════════════
            // STAGE 5: MOVEMENT STOPS UNEXPECTEDLY
            // ═══════════════════════════════════════
            setTimeline(55, 'ANOMALY DETECTED');

            // User stops
            DOM.figure.classList.remove('slow-walk');
            DOM.figure.classList.add('stopped');
            moveUser(56, 50, 0.5);
            addTrailPoint(53, 52);
            addPathNode(56, 50, true);

            await wait(800, signal);
            stopHeartbeatUpdater();
            startHeartbeatUpdater('stopped');
            updateBehaviorTelemetry(0.0, 2.1, 0.5, true, 'STOPPED');
            updateThreatTelemetry('MEDIUM', 38, '88.5%', 'ANALYZING', 'INACTIVE');

            setBadge('ALERT', 'analyzing');
            await showPopup('⚠ Movement stopped unexpectedly', 'warning', signal, 2200);

            // Pause counter starts
            await wait(1000, signal);
            updateBehaviorTelemetry(0.0, 1.8, 1.5, true, 'STOPPED');
            updateThreatTelemetry('MEDIUM', 42, '86.1%', 'ANALYZING', 'INACTIVE');

            await wait(1000, signal);
            updateBehaviorTelemetry(0.0, 1.5, 2.5, true, 'STOPPED');
            updateThreatTelemetry('HIGH', 48, '83.4%', 'ANALYZING', 'INACTIVE');

            await showPopup('⚠ No response detected — Pause: 2.5s', 'warning', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 6: VALIDATION PHASE
            // System DOES NOT trigger immediately
            // ═══════════════════════════════════════
            setTimeline(65, 'VALIDATING');

            await wait(800, signal);
            updateBehaviorTelemetry(0.0, 1.2, 3.5, true, 'STOPPED');
            updateThreatTelemetry('HIGH', 55, '79.8%', 'VALIDATING', 'STANDBY');
            setAI('VALIDATING', 'analyzing');

            await showPopup('AI validating anomaly — Confirming threat…', 'warning', signal, 2200);

            await wait(800, signal);
            updateBehaviorTelemetry(0.0, 1.0, 4.5, true, 'STOPPED');
            updateThreatTelemetry('HIGH', 62, '74.2%', 'VALIDATING', 'STANDBY');

            // Show threat zone around user
            showThreatZone(56, 50);

            await wait(800, signal);
            updateBehaviorTelemetry(0.0, 0.8, 5.5, true, 'STOPPED');
            updateThreatTelemetry('HIGH', 71, '68.9%', 'VALIDATING', 'STANDBY');

            await showPopup('Threat probability rising — 71%', 'warning', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 7: AI DECISION — RISK CONFIRMED
            // ═══════════════════════════════════════
            setTimeline(75, 'DECISION');

            await wait(600, signal);
            updateBehaviorTelemetry(0.0, 0.6, 6.5, true, 'DANGER');
            updateThreatTelemetry('CRITICAL', 85, '92.7%', 'SOS TRIGGERED', 'ACTIVATING');

            // ═══ SOS TRIGGERED ═══
            alertFlash();
            screenShake(500);
            setAI('SOS ACTIVE', 'alert');
            setBadge('EMERGENCY', 'emergency');

            // Detection grid turns red
            DOM.detectionGrid.classList.add('alert');
            DOM.scanline.classList.add('alert');

            // Ambient goes red
            DOM.ambientGlow.className = 'sos-ambient-glow alert';

            // Vignette
            DOM.scene.classList.add('alert-vignette');

            // Figure indicators go alert
            DOM.figureDot.className = 'sos-figure-dot alert';
            DOM.figurePing.className = 'sos-figure-ping alert';
            DOM.alertGlow.classList.add('active');

            // Stop old heartbeat, start alert
            stopHeartbeatUpdater();
            startHeartbeatUpdater('alert');

            // Emergency indicator
            DOM.emergency.classList.add('active');
            DOM.emergencyLabel.textContent = 'EMERGENCY: ACTIVE';

            // ═══════════════════════════════════════
            // STAGE 8: MULTI-STEP RESPONSE SEQUENCE
            // ═══════════════════════════════════════

            // Step 1
            await wait(400, signal);
            await showPopup('⚠ Irregular activity detected', 'danger', signal, 2200);

            // Step 2
            await wait(300, signal);
            await showPopup('Analyzing movement pattern…', 'warning', signal, 1800);

            // Step 3
            await wait(300, signal);
            updateThreatTelemetry('CRITICAL', 92, '96.4%', 'SOS TRIGGERED', 'ACTIVE');
            await showPopup('Threat probability rising — 92%', 'danger', signal, 2000);

            // Step 4
            setTimeline(82, 'SOS RESPONSE');
            await wait(300, signal);
            screenShake(350);
            alertFlash();
            await showPopup('🚨 SOS INITIATED', 'danger', signal, 2500);

            // Step 5
            await wait(300, signal);
            showPin(56, 50);
            updateThreatTelemetry('CRITICAL', 96, '98.1%', 'SOS TRIGGERED', 'TRACKING');
            await showPopup('📍 Live tracking enabled', 'danger', signal, 2200);

            // Step 6
            setTimeline(90, 'CONTACTING');
            await wait(300, signal);
            await showPopup('📡 Emergency contacts notified', 'danger', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 9: RESOLUTION
            // ═══════════════════════════════════════
            setTimeline(95, 'RESPONSE SENT');

            await wait(600, signal);
            updateThreatTelemetry('CRITICAL', 96, '98.1%', 'SOS TRIGGERED', 'CONFIRMED');

            setBadge('RESOLVED', 'resolved');
            DOM.emergencyLabel.textContent = 'EMERGENCY: RESPONDED';

            // Ease back visual intensity
            DOM.scene.classList.remove('alert-vignette');
            stopHeartbeatUpdater();
            startHeartbeatUpdater('normal');

            await showPopup('✔ Help is on the way — System monitoring continues', 'success', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 10: COMPLETE
            // ═══════════════════════════════════════
            setTimeline(100, 'COMPLETE');

            await wait(800, signal);
            await showPopup('AI response cycle complete — Awaiting resolution', 'success', signal, 2500);

            stopHeartbeatUpdater();
            stopTrailAnimation();
            STATE.isRunning = false;
            STATE.isComplete = true;
            btnReplay();

        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Simulation error:', e);
                throw e;
            }
        }
    }

    // ══════════════════════════════════════════════
    // EVENT LISTENERS
    // ══════════════════════════════════════════════

    DOM.startBtn.addEventListener('click', () => {
        if (STATE.isRunning) {
            fullReset();
            setTimeout(runSimulation, 300);
        } else if (STATE.isComplete) {
            fullReset();
            setTimeout(runSimulation, 300);
        } else {
            runSimulation();
        }
    });

    // ══════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════

    function init() {
        initTrailCanvas();
        initHeartbeat();
        startClock();
        setBadge('MONITORING', '');
        setAI('AI ACTIVE', '');

        // Disable start button until disclaimer is accepted
        DOM.startBtn.disabled = true;
        DOM.startBtn.style.opacity = '0.4';
        DOM.startBtn.style.pointerEvents = 'none';

        // Show disclaimer after preloader, enable button on acceptance
        Disclaimer.show(function () {
            DOM.startBtn.disabled = false;
            DOM.startBtn.style.opacity = '';
            DOM.startBtn.style.pointerEvents = '';
        });

        // Handle resize
        window.addEventListener('resize', () => {
            initTrailCanvas();
        });
    }

    init();

})();

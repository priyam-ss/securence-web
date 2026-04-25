/* ============================================
   SECURENCE — Safety Pulse Map
   Community Safety Visualization Engine
   High Fidelity JavaScript — v3
   ============================================

   LOGIC FLOW:
   INIT → DEPLOY NODES → ANALYZE → DETECT RISK →
   SPREAD WAVES → CALCULATE PATH → DISPLAY ROUTE

   NODE TYPES:
   - SAFE (green)     — Low risk, stable
   - MODERATE (yellow) — Some activity, monitor
   - RISK (orange)    — Elevated concern
   - DANGER (red)     — Active threat zone

   ============================================ */

(function () {
    'use strict';

    // ──────────── Initialize Preloader ────────────
    SimEngine.initPreloader();

    // ══════════════════════════════════════════════
    // DOM REFERENCES
    // ══════════════════════════════════════════════
    const DOM = {
        app: document.getElementById('pm-app'),
        scene: document.getElementById('pm-scene'),
        sceneInner: document.getElementById('pm-scene-inner'),

        nodeLayer: document.getElementById('pm-node-layer'),
        networkSvg: document.getElementById('pm-network-svg'),
        pathSvg: document.getElementById('pm-path-svg'),
        waveLayer: document.getElementById('pm-wave-layer'),

        userMarker: document.getElementById('pm-user-marker'),
        destMarker: document.getElementById('pm-dest-marker'),

        ambientGlow: document.getElementById('pm-ambient-glow'),
        alertFlash: document.getElementById('pm-alert-flash'),

        // Top bar
        gps: document.getElementById('pm-gps'),
        gpsLabel: document.getElementById('pm-gps-label'),
        signalLabel: document.getElementById('pm-signal-label'),
        modeBadge: document.getElementById('pm-mode-badge'),
        modeText: document.getElementById('pm-mode-text'),
        systemClock: document.getElementById('pm-system-clock'),

        // Panels
        legendPanel: document.getElementById('pm-legend-panel'),
        statsPanel: document.getElementById('pm-stats-panel'),

        // Stats values
        totalNodes: document.getElementById('pm-total-nodes'),
        safeCount: document.getElementById('pm-safe-count'),
        modCount: document.getElementById('pm-mod-count'),
        riskCount: document.getElementById('pm-risk-count'),
        riskIndex: document.getElementById('pm-risk-index'),
        riskBar: document.getElementById('pm-risk-bar'),
        pathStatus: document.getElementById('pm-path-status'),
        confidence: document.getElementById('pm-confidence'),

        // Bottom
        timelineFill: document.getElementById('pm-timeline-fill'),
        timelineLabel: document.getElementById('pm-timeline-label'),
        dataStatus: document.getElementById('pm-data-status'),
        dataLabel: document.getElementById('pm-data-label'),

        // Popups
        popups: document.getElementById('pm-popups'),

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
        nodes: [],
        networkLines: [],
    };

    // ══════════════════════════════════════════════
    // MAP NODE CONFIGURATION
    // ══════════════════════════════════════════════
    const MAP_NODES = [
        // Format: { id, x, y (percent), initialType, label }
        { id: 'N01', x: 15, y: 20, type: 'safe', label: 'BLOCK A' },
        { id: 'N02', x: 30, y: 15, type: 'safe', label: 'SECTOR B' },
        { id: 'N03', x: 48, y: 12, type: 'safe', label: 'ZONE C' },
        { id: 'N04', x: 65, y: 18, type: 'safe', label: 'AREA D' },
        { id: 'N05', x: 82, y: 22, type: 'safe', label: 'HUB E' },
        { id: 'N06', x: 12, y: 42, type: 'safe', label: 'NODE F' },
        { id: 'N07', x: 28, y: 38, type: 'safe', label: 'POST G' },
        { id: 'N08', x: 42, y: 35, type: 'safe', label: 'GRID H' },
        { id: 'N09', x: 58, y: 40, type: 'safe', label: 'RELAY I' },
        { id: 'N10', x: 75, y: 38, type: 'safe', label: 'CELL J' },
        { id: 'N11', x: 88, y: 45, type: 'safe', label: 'POINT K' },
        { id: 'N12', x: 18, y: 62, type: 'safe', label: 'BASE L' },
        { id: 'N13', x: 35, y: 58, type: 'safe', label: 'TOWER M' },
        { id: 'N14', x: 50, y: 55, type: 'safe', label: 'HUB N' },
        { id: 'N15', x: 68, y: 60, type: 'safe', label: 'GRID O' },
        { id: 'N16', x: 85, y: 65, type: 'safe', label: 'OUTPOST P' },
        { id: 'N17', x: 22, y: 80, type: 'safe', label: 'LINK Q' },
        { id: 'N18', x: 40, y: 78, type: 'safe', label: 'NODE R' },
        { id: 'N19', x: 58, y: 82, type: 'safe', label: 'RELAY S' },
        { id: 'N20', x: 78, y: 80, type: 'safe', label: 'CORE T' },
    ];

    // Network connections (node index pairs)
    const CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 6], [1, 7], [2, 8], [3, 9], [4, 10],
        [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
        [5, 11], [6, 12], [8, 13], [9, 14], [10, 15],
        [11, 12], [12, 13], [13, 14], [14, 15],
        [11, 16], [12, 17], [13, 18], [14, 19],
        [16, 17], [17, 18], [18, 19],
    ];

    // Safe path waypoints (node indices: user → destination)
    const SAFE_PATH_NODES = [16, 11, 5, 6, 7, 2, 3, 4];

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
    // POPUP SYSTEM WITH ICONS
    // ══════════════════════════════════════════════

    async function showPopup(icon, text, type, signal, stayMs) {
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const stay = stayMs || 2000;
        const el = document.createElement('div');
        el.className = 'pm-popup ' + (type || '');

        // Icon container
        if (icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'pm-popup-icon';
            iconEl.textContent = icon;
            el.appendChild(iconEl);
        }

        // Text
        const textEl = document.createElement('span');
        textEl.textContent = text;
        el.appendChild(textEl);

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
    // MODE BADGE
    // ══════════════════════════════════════════════

    function setMode(text, className) {
        DOM.modeText.textContent = text;
        DOM.modeBadge.className = 'pm-mode-badge';
        if (className) DOM.modeBadge.classList.add(className);
    }

    // ══════════════════════════════════════════════
    // NODE CREATION & MANAGEMENT
    // ══════════════════════════════════════════════

    function createNodeElement(node) {
        const el = document.createElement('div');
        el.className = 'pm-node ' + node.type;
        el.id = 'node-' + node.id;
        el.style.left = node.x + '%';
        el.style.top = node.y + '%';
        el.style.transform = 'translate(-50%, -50%)';

        // Label
        const label = document.createElement('span');
        label.className = 'pm-node-label';
        label.textContent = node.label;
        el.appendChild(label);

        DOM.nodeLayer.appendChild(el);
        return el;
    }

    function updateNodeType(nodeIndex, newType, signal) {
        const node = STATE.nodes[nodeIndex];
        if (!node) return;

        node.data.type = newType;
        const el = node.el;

        // Animate transition
        el.classList.add('updating');
        setTimeout(() => el.classList.remove('updating'), 600);

        // Remove old type classes
        el.classList.remove('safe', 'moderate', 'risk', 'danger');
        el.classList.add(newType);

        // Add ripple for danger
        if (newType === 'danger' || newType === 'risk') {
            const ripple = document.createElement('div');
            ripple.className = 'pm-node-ripple';
            el.appendChild(ripple);

            if (newType === 'danger') {
                const ripple2 = document.createElement('div');
                ripple2.className = 'pm-node-ripple pm-node-ripple-2';
                el.appendChild(ripple2);
            }
        }
    }

    // ══════════════════════════════════════════════
    // NETWORK LINES (SVG)
    // ══════════════════════════════════════════════

    function createNetworkLine(n1, n2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', (n1.x / 100) * 1000);
        line.setAttribute('y1', (n1.y / 100) * 600);
        line.setAttribute('x2', (n2.x / 100) * 1000);
        line.setAttribute('y2', (n2.y / 100) * 600);
        line.setAttribute('class', 'pm-net-line');
        DOM.networkSvg.appendChild(line);
        return line;
    }

    function setNetworkLineRisk(lineEl, isRisk) {
        if (isRisk) {
            lineEl.classList.add('risk-line');
        } else {
            lineEl.classList.remove('risk-line');
        }
    }

    // ══════════════════════════════════════════════
    // SAFE PATH
    // ══════════════════════════════════════════════

    function createSafePath() {
        // Build SVG path string from waypoints
        const points = SAFE_PATH_NODES.map(i => {
            const n = MAP_NODES[i];
            return { x: (n.x / 100) * 1000, y: (n.y / 100) * 600 };
        });

        // Add user and destination positions
        const userPt = { x: (20 / 100) * 1000, y: (85 / 100) * 600 };
        const destPt = { x: (82 / 100) * 1000, y: (22 / 100) * 600 };

        const allPts = [userPt, ...points, destPt];

        let d = 'M ' + allPts[0].x + ' ' + allPts[0].y;
        for (let i = 1; i < allPts.length; i++) {
            d += ' L ' + allPts[i].x + ' ' + allPts[i].y;
        }

        // Glow path
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glow.setAttribute('d', d);
        glow.setAttribute('class', 'pm-safe-path-glow');
        DOM.pathSvg.appendChild(glow);

        // Main path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'pm-safe-path');
        DOM.pathSvg.appendChild(path);

        return { path, glow };
    }

    function animateSafePath(pathEls) {
        // Measure path length and set dasharray
        const len = pathEls.path.getTotalLength();
        pathEls.path.style.strokeDasharray = len;
        pathEls.path.style.strokeDashoffset = len;
        pathEls.glow.style.strokeDasharray = len;
        pathEls.glow.style.strokeDashoffset = len;

        // Trigger animation
        requestAnimationFrame(() => {
            pathEls.path.classList.add('animate');
            pathEls.glow.classList.add('animate');
        });
    }

    // ══════════════════════════════════════════════
    // RISK WAVES
    // ══════════════════════════════════════════════

    function emitRiskWave(x, y, large) {
        const wave = document.createElement('div');
        wave.className = 'pm-risk-wave' + (large ? ' large' : '');
        wave.style.left = x + '%';
        wave.style.top = y + '%';
        wave.style.transform = 'translate(-50%, -50%)';
        DOM.waveLayer.appendChild(wave);

        setTimeout(() => {
            if (wave.parentNode) wave.parentNode.removeChild(wave);
        }, large ? 3000 : 2500);
    }

    function emitMultiWaves(x, y, count, interval) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => emitRiskWave(x, y, i === 0), i * interval);
        }
    }

    // ══════════════════════════════════════════════
    // STATS PANEL
    // ══════════════════════════════════════════════

    function updateStats() {
        let safe = 0, mod = 0, risk = 0;
        STATE.nodes.forEach(n => {
            const t = n.data.type;
            if (t === 'safe') safe++;
            else if (t === 'moderate') mod++;
            else risk++;
        });

        DOM.totalNodes.textContent = STATE.nodes.length;
        DOM.safeCount.textContent = safe;
        DOM.modCount.textContent = mod;
        DOM.riskCount.textContent = risk;

        const riskIdx = Math.round(((risk * 3 + mod * 1) / STATE.nodes.length) * 100);
        DOM.riskIndex.textContent = riskIdx + '%';
        DOM.riskIndex.style.color = riskIdx > 50 ? '#ff3b3b' : riskIdx > 25 ? '#f97316' : riskIdx > 10 ? '#fbbf24' : '#00ff88';

        DOM.riskBar.style.width = riskIdx + '%';
        DOM.riskBar.style.background = riskIdx > 50 ? '#ff3b3b' : riskIdx > 25 ? '#f97316' : riskIdx > 10 ? '#fbbf24' : '#00ff88';
    }

    // ══════════════════════════════════════════════
    // VISUAL EFFECTS
    // ══════════════════════════════════════════════

    function alertFlash() {
        DOM.alertFlash.classList.add('active');
        setTimeout(() => DOM.alertFlash.classList.remove('active'), 500);
    }

    function screenShake() {
        DOM.sceneInner.classList.add('pm-screen-shake');
        setTimeout(() => DOM.sceneInner.classList.remove('pm-screen-shake'), 400);
    }

    function setTimeline(pct, label) {
        DOM.timelineFill.style.width = pct + '%';
        DOM.timelineLabel.textContent = 'PHASE: ' + label;
    }

    // ══════════════════════════════════════════════
    // BUTTON HELPERS
    // ══════════════════════════════════════════════

    const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>';
    const ICON_REPLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    const ICON_RUNNING = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    function btnStart() { DOM.startBtn.disabled = false; DOM.startBtn.innerHTML = ICON_PLAY + ' Initialize Scan'; }
    function btnRunning() { DOM.startBtn.disabled = true; DOM.startBtn.innerHTML = ICON_RUNNING + ' Scanning…'; }
    function btnReplay() { DOM.startBtn.disabled = false; DOM.startBtn.innerHTML = ICON_REPLAY + ' Replay Scan'; }

    // ══════════════════════════════════════════════
    // FULL RESET
    // ══════════════════════════════════════════════

    function fullReset() {
        if (STATE.abortController) STATE.abortController.abort();

        STATE.isRunning = false;
        STATE.isComplete = false;
        STATE.nodes = [];
        STATE.networkLines = [];

        stopClock();

        // Clear SVGs
        DOM.networkSvg.innerHTML = '';
        DOM.pathSvg.innerHTML = '';

        // Clear layers
        DOM.nodeLayer.innerHTML = '';
        DOM.waveLayer.innerHTML = '';
        DOM.popups.innerHTML = '';

        // Reset user marker
        DOM.userMarker.style.left = '20%';
        DOM.userMarker.style.top = '85%';

        // Reset dest marker
        DOM.destMarker.style.left = '82%';
        DOM.destMarker.style.top = '18%';
        DOM.destMarker.classList.remove('visible');

        // Reset ambient
        DOM.ambientGlow.className = 'pm-ambient-glow';
        DOM.alertFlash.classList.remove('active');
        DOM.scene.classList.remove('alert-vignette');

        // Reset mode
        setMode('MONITORING', '');

        // Reset stats
        DOM.totalNodes.textContent = '--';
        DOM.safeCount.textContent = '--';
        DOM.modCount.textContent = '--';
        DOM.riskCount.textContent = '--';
        DOM.riskIndex.textContent = '--';
        DOM.riskIndex.style.color = '';
        DOM.riskBar.style.width = '0%';
        DOM.pathStatus.textContent = 'PENDING';
        DOM.pathStatus.style.color = '';
        DOM.confidence.textContent = '--';

        // Reset data status
        DOM.dataStatus.className = 'pm-data-status';
        DOM.dataLabel.textContent = 'DATA: STANDBY';

        // Reset timeline
        setTimeline(0, 'STANDBY');

        // Hide panels
        DOM.legendPanel.classList.remove('visible');
        DOM.statsPanel.classList.remove('visible');

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

        try {
            // ═══════════════════════════════════════
            // STAGE 1: SYSTEM INITIALIZATION
            // ═══════════════════════════════════════
            setTimeline(3, 'INITIALIZING');

            await wait(400, signal);
            DOM.legendPanel.classList.add('visible');
            await wait(300, signal);
            DOM.statsPanel.classList.add('visible');

            await wait(200, signal);
            setMode('MONITORING', '');
            DOM.dataStatus.classList.add('processing');
            DOM.dataLabel.textContent = 'DATA: LOADING';

            await showPopup('📡', 'Pulse Map system initializing…', 'info', signal, 2200);

            await wait(300, signal);
            DOM.ambientGlow.classList.add('scanning');

            await showPopup('🛰️', 'GPS locked — Connecting to network', 'success', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 2: DEPLOY MAP NODES
            // ═══════════════════════════════════════
            setTimeline(10, 'DEPLOYING NODES');

            await wait(500, signal);
            await showPopup('🗺️', 'Deploying sensor nodes…', 'info', signal, 1500);

            // Create nodes one by one with stagger
            for (let i = 0; i < MAP_NODES.length; i++) {
                const nodeData = { ...MAP_NODES[i] };
                const el = createNodeElement(nodeData);
                STATE.nodes.push({ el, data: nodeData });

                // Stagger reveal
                await wait(80, signal);
                el.classList.add('visible');

                // Update stats
                updateStats();

                // Progress
                const prog = 10 + (i / MAP_NODES.length) * 15;
                setTimeline(Math.round(prog), 'DEPLOYING NODES');
            }

            DOM.dataLabel.textContent = 'DATA: CONNECTED';
            await wait(300, signal);
            await showPopup('✅', MAP_NODES.length + ' nodes deployed — Network online', 'success', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 3: BUILD NETWORK CONNECTIONS
            // ═══════════════════════════════════════
            setTimeline(28, 'BUILDING NETWORK');

            await wait(400, signal);
            await showPopup('🔗', 'Establishing network connections…', 'info', signal, 1800);

            for (let i = 0; i < CONNECTIONS.length; i++) {
                const [a, b] = CONNECTIONS[i];
                const line = createNetworkLine(MAP_NODES[a], MAP_NODES[b]);
                STATE.networkLines.push({ el: line, from: a, to: b });

                await wait(60, signal);
                line.classList.add('visible');
            }

            setTimeline(35, 'NETWORK ACTIVE');
            await wait(300, signal);
            await showPopup('🔗', 'Network mesh established — ' + CONNECTIONS.length + ' links', 'success', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 4: DATA ANALYSIS — SCANNING
            // ═══════════════════════════════════════
            setTimeline(40, 'ANALYZING');
            setMode('ANALYZING', 'analyzing');

            await wait(500, signal);
            await showPopup('📊', 'Analyzing area data…', 'info', signal, 2200);

            // Start updating some nodes to moderate
            await wait(800, signal);
            updateNodeType(7, 'moderate', signal);
            updateStats();
            await wait(400, signal);
            updateNodeType(9, 'moderate', signal);
            updateStats();
            await wait(400, signal);
            updateNodeType(13, 'moderate', signal);
            updateStats();
            await wait(400, signal);
            updateNodeType(14, 'moderate', signal);
            updateStats();

            setTimeline(48, 'DATA PROCESSING');
            await showPopup('📋', 'Activity patterns emerging — Elevated zones found', 'warning', signal, 2200);

            await wait(500, signal);

            // Some connections go risk
            STATE.networkLines.forEach(l => {
                if (l.from === 8 || l.to === 8 || l.from === 9 || l.to === 9 || l.from === 13 || l.to === 13) {
                    setNetworkLineRisk(l.el, true);
                }
            });

            // ═══════════════════════════════════════
            // STAGE 5: RISK DETECTION
            // ═══════════════════════════════════════
            setTimeline(55, 'RISK DETECTED');

            await wait(600, signal);
            updateNodeType(8, 'risk', signal);
            updateStats();
            emitRiskWave(MAP_NODES[8].x, MAP_NODES[8].y, false);
            await wait(500, signal);
            await showPopup('⚠️', 'Risk zone detected — Sector GRID H', 'warning', signal, 2000);

            await wait(600, signal);
            updateNodeType(13, 'risk', signal);
            updateStats();
            emitRiskWave(MAP_NODES[13].x, MAP_NODES[13].y, false);

            await wait(500, signal);
            updateNodeType(9, 'risk', signal);
            updateStats();
            emitRiskWave(MAP_NODES[9].x, MAP_NODES[9].y, false);

            setTimeline(62, 'ASSESSING');
            await showPopup('⚠️', 'Multiple risk zones identified — Assessing threat level', 'warning', signal, 2200);

            // ═══════════════════════════════════════
            // STAGE 6: DANGER ZONE ACTIVATION
            // ═══════════════════════════════════════
            await wait(800, signal);
            setTimeline(68, 'DANGER ZONES');
            setMode('ALERT MODE', 'alert');
            DOM.ambientGlow.className = 'pm-ambient-glow alert';

            // Node escalation
            updateNodeType(8, 'danger', signal);
            updateStats();
            alertFlash();
            screenShake();
            emitMultiWaves(MAP_NODES[8].x, MAP_NODES[8].y, 3, 400);

            await wait(600, signal);
            await showPopup('🚨', 'Risk zones detected — Danger level ELEVATED', 'danger', signal, 2500);

            await wait(400, signal);
            updateNodeType(13, 'danger', signal);
            updateStats();
            emitMultiWaves(MAP_NODES[13].x, MAP_NODES[13].y, 3, 400);

            // Vignette
            DOM.scene.classList.add('alert-vignette');

            setTimeline(72, 'THREAT ACTIVE');
            await wait(500, signal);
            await showPopup('🔴', 'Danger zones confirmed — Initiating safe route protocol', 'danger', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 7: SAFE PATH CALCULATION
            // ═══════════════════════════════════════
            await wait(600, signal);
            setTimeline(78, 'CALCULATING PATH');
            setMode('ROUTING', 'routing');
            DOM.ambientGlow.className = 'pm-ambient-glow routing';
            DOM.scene.classList.remove('alert-vignette');

            DOM.pathStatus.textContent = 'COMPUTING';
            DOM.pathStatus.style.color = '#fbbf24';

            await showPopup('🧮', 'Calculating safe route…', 'route', signal, 2200);

            // Mark safe path nodes
            await wait(500, signal);
            SAFE_PATH_NODES.forEach(i => {
                const node = STATE.nodes[i];
                if (node && node.data.type !== 'danger' && node.data.type !== 'risk') {
                    node.el.classList.add('safe');
                }
            });

            // Show destination
            DOM.destMarker.classList.add('visible');

            await wait(600, signal);
            DOM.confidence.textContent = '87.3%';
            DOM.pathStatus.textContent = 'ROUTING';
            DOM.pathStatus.style.color = 'var(--neon-cyan)';

            setTimeline(85, 'ROUTING');
            await showPopup('🛤️', 'Optimal safe route identified — Confidence: 87.3%', 'route', signal, 2200);

            // ═══════════════════════════════════════
            // STAGE 8: PATH ANIMATION
            // ═══════════════════════════════════════
            await wait(500, signal);
            setTimeline(90, 'PATH ACTIVE');

            const pathEls = createSafePath();
            animateSafePath(pathEls);

            DOM.dataStatus.className = 'pm-data-status active';
            DOM.dataLabel.textContent = 'DATA: ROUTE ACTIVE';

            await wait(3200, signal); // Wait for path animation to complete

            DOM.pathStatus.textContent = 'CONFIRMED';
            DOM.pathStatus.style.color = 'var(--safe)';
            DOM.confidence.textContent = '94.1%';

            await showPopup('✅', 'Safe path generated — Route confirmed', 'success', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 9: RESOLUTION
            // ═══════════════════════════════════════
            setTimeline(95, 'COMPLETE');
            setMode('COMPLETE', 'complete');
            DOM.ambientGlow.className = 'pm-ambient-glow complete';

            await wait(600, signal);
            await showPopup('🛡️', 'Pulse Map analysis complete — Safe navigation active', 'success', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 10: DONE
            // ═══════════════════════════════════════
            setTimeline(100, 'COMPLETE');

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
        startClock();
        setMode('MONITORING', '');
        DOM.userMarker.style.left = '20%';
        DOM.userMarker.style.top = '85%';
        DOM.destMarker.style.left = '82%';
        DOM.destMarker.style.top = '18%';

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

        window.addEventListener('resize', () => {
            // SVG viewBox handles scaling automatically
        });
    }

    init();

})();

/* ============================================
   SECURENCE — AI Threat Detection System
   Predictive Safety Analytics Engine
   High Fidelity JavaScript — v3
   ============================================

   LOGIC FLOW:
   SCAN → DETECT → ANALYZE → VALIDATE → PREDICT → ALERT

   DETECTION PIPELINE:
   1. Environmental scanning (passive)
   2. Entity identification
   3. Behavior pattern analysis
   4. Anomaly scoring
   5. Threat probability calculation
   6. Decision gate (threshold: 75%)
   7. Preventive alert issuance

   ============================================ */

(function () {
    'use strict';

    // ──────────── Initialize Preloader ────────────
    SimEngine.initPreloader();

    // ══════════════════════════════════════════════
    // DOM REFERENCES
    // ══════════════════════════════════════════════
    const DOM = {
        app: document.getElementById('ai-app'),
        scene: document.getElementById('ai-scene'),
        sceneInner: document.getElementById('ai-scene-inner'),

        // Environment
        detectGrid: document.getElementById('ai-detect-grid'),
        scanline: document.getElementById('ai-scanline'),
        scanlineV: document.getElementById('ai-scanline-v'),
        ambientGlow: document.getElementById('ai-ambient-glow'),
        glitchOverlay: document.getElementById('ai-glitch-overlay'),

        // Figures
        figure: document.getElementById('ai-figure'),
        figureDot: document.getElementById('ai-figure-dot'),
        figurePing: document.getElementById('ai-figure-ping'),
        suspect: document.getElementById('ai-suspect'),
        suspectTag: document.getElementById('ai-suspect-tag'),

        // Detection box
        detectBox: document.getElementById('ai-detect-box'),
        detectLabel: document.getElementById('ai-detect-label'),

        // Warning zones
        warningZone1: document.getElementById('ai-warning-zone-1'),
        warningZone2: document.getElementById('ai-warning-zone-2'),

        // Overlays
        alertFlash: document.getElementById('ai-alert-flash'),

        // Neural
        neural: document.getElementById('ai-neural'),
        neuralLabel: document.getElementById('ai-neural-label'),

        // Mode
        modeBadge: document.getElementById('ai-mode-badge'),
        modeText: document.getElementById('ai-mode-text'),
        systemClock: document.getElementById('ai-system-clock'),

        // Left Panel — Scan Data
        panelLeft: document.getElementById('ai-panel-left'),
        scanArea: document.getElementById('ai-scan-area'),
        entities: document.getElementById('ai-entities'),
        fps: document.getElementById('ai-fps'),
        anomalies: document.getElementById('ai-anomalies'),
        scanMode: document.getElementById('ai-scan-mode'),
        envRisk: document.getElementById('ai-env-risk'),

        // Right Panel — AI Analysis
        panelRight: document.getElementById('ai-panel-right'),
        threatPct: document.getElementById('ai-threat-pct'),
        threatBar: document.getElementById('ai-threat-bar'),
        pattern: document.getElementById('ai-pattern'),
        aiConf: document.getElementById('ai-confidence'),
        decision: document.getElementById('ai-decision'),
        prediction: document.getElementById('ai-prediction'),

        // Bottom
        timelineFill: document.getElementById('ai-timeline-fill'),
        timelineLabel: document.getElementById('ai-timeline-label'),
        alertStatus: document.getElementById('ai-alert-status'),
        alertLabel: document.getElementById('ai-alert-label'),

        // Popups
        popups: document.getElementById('ai-popups'),

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
        scanInterval: null,
        threatLevel: 0,
        suspectPosition: { x: 85, y: 30 },
        userPosition: { x: 15, y: 65 },
    };

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
        el.className = 'ai-popup ' + (type || '');
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
    // MODE & NEURAL INDICATORS
    // ══════════════════════════════════════════════

    function setMode(text, className) {
        DOM.modeText.textContent = text;
        DOM.modeBadge.className = 'ai-mode-badge';
        if (className) DOM.modeBadge.classList.add(className);
    }

    function setNeural(label, className) {
        DOM.neuralLabel.textContent = label;
        DOM.neural.className = 'ai-neural-indicator';
        if (className) DOM.neural.classList.add(className);
    }

    // ══════════════════════════════════════════════
    // SCAN DATA UPDATES
    // ══════════════════════════════════════════════

    function updateScanData(area, entities, fps, anomalies, mode, envRisk) {
        DOM.scanArea.textContent = area;
        DOM.entities.textContent = entities;
        DOM.fps.textContent = fps;
        DOM.anomalies.textContent = anomalies;

        DOM.scanMode.textContent = mode;
        DOM.scanMode.style.color = mode === 'ACTIVE' ? '#fbbf24' : mode === 'THREAT' ? '#ff3b3b' : '';

        DOM.envRisk.textContent = envRisk;
        DOM.envRisk.style.color = envRisk === 'LOW' ? '#00ff88' : envRisk === 'MEDIUM' ? '#fbbf24' : envRisk === 'HIGH' ? '#f97316' : envRisk === 'CRITICAL' ? '#ff3b3b' : '';
    }

    // ══════════════════════════════════════════════
    // AI ANALYSIS UPDATES
    // ══════════════════════════════════════════════

    function updateAIAnalysis(threatPct, pattern, conf, decision, prediction) {
        DOM.threatPct.textContent = threatPct + '%';

        DOM.threatBar.style.width = Math.min(threatPct, 100) + '%';
        if (threatPct > 75) DOM.threatBar.style.background = '#ff3b3b';
        else if (threatPct > 50) DOM.threatBar.style.background = '#f97316';
        else if (threatPct > 25) DOM.threatBar.style.background = '#fbbf24';
        else DOM.threatBar.style.background = '#00ff88';

        DOM.pattern.textContent = pattern;
        DOM.pattern.style.color = pattern === 'NORMAL' ? '#00ff88' : pattern === 'IRREGULAR' ? '#fbbf24' : pattern === 'SUSPICIOUS' ? '#f97316' : pattern === 'HOSTILE' ? '#ff3b3b' : '';

        DOM.aiConf.textContent = conf;
        DOM.decision.textContent = decision;
        DOM.decision.style.color = decision === 'ALERT ISSUED' ? '#ff3b3b' : decision === 'ANALYZING' ? '#fbbf24' : '';

        DOM.prediction.textContent = prediction;
        DOM.prediction.style.color = prediction === 'SAFE' ? '#00ff88' : prediction === 'CAUTION' ? '#fbbf24' : prediction === 'THREAT' ? '#ff3b3b' : '';
    }

    // ══════════════════════════════════════════════
    // VISUAL EFFECTS
    // ══════════════════════════════════════════════

    function flashAlert() {
        DOM.alertFlash.classList.add('active');
        setTimeout(() => DOM.alertFlash.classList.remove('active'), 500);
    }

    function screenShake(dur) {
        DOM.sceneInner.classList.add('ai-screen-shake');
        setTimeout(() => DOM.sceneInner.classList.remove('ai-screen-shake'), dur || 400);
    }

    function triggerGlitch() {
        DOM.glitchOverlay.classList.add('active');
        setTimeout(() => DOM.glitchOverlay.classList.remove('active'), 500);
    }

    function setTimeline(pct, label) {
        DOM.timelineFill.style.width = pct + '%';
        DOM.timelineLabel.textContent = 'PHASE: ' + label;
    }

    function moveUser(x, y) {
        STATE.userPosition = { x, y };
        DOM.figure.style.left = x + '%';
        DOM.figure.style.top = y + '%';
    }

    function moveSuspect(x, y) {
        STATE.suspectPosition = { x, y };
        DOM.suspect.style.left = x + '%';
        DOM.suspect.style.top = y + '%';
    }

    function positionDetectBox(x, y) {
        DOM.detectBox.style.left = (x - 4) + '%';
        DOM.detectBox.style.top = (y - 8) + '%';
    }

    // ══════════════════════════════════════════════
    // SIMULATED BACKGROUND SCAN UPDATER
    // ══════════════════════════════════════════════

    function startScanUpdater() {
        let frame = 0;
        STATE.scanInterval = setInterval(() => {
            frame++;
            // Simulate oscillating FPS
            const fps = Math.round(28 + Math.sin(frame * 0.1) * 3);
            DOM.fps.textContent = fps + ' fps';
        }, 500);
    }

    function stopScanUpdater() {
        if (STATE.scanInterval) { clearInterval(STATE.scanInterval); STATE.scanInterval = null; }
    }

    // ══════════════════════════════════════════════
    // BUTTON HELPERS
    // ══════════════════════════════════════════════

    const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>';
    const ICON_REPLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    const ICON_RUNNING = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    function btnStart() { DOM.startBtn.disabled = false; DOM.startBtn.innerHTML = ICON_PLAY + ' Initialize Scan'; }
    function btnRunning() { DOM.startBtn.disabled = true; DOM.startBtn.innerHTML = ICON_RUNNING + ' AI Scanning…'; }
    function btnReplay() { DOM.startBtn.disabled = false; DOM.startBtn.innerHTML = ICON_REPLAY + ' Replay Scan'; }

    // ══════════════════════════════════════════════
    // FULL RESET
    // ══════════════════════════════════════════════

    function fullReset() {
        if (STATE.abortController) STATE.abortController.abort();

        STATE.isRunning = false;
        STATE.isComplete = false;
        STATE.threatLevel = 0;

        stopClock();
        stopScanUpdater();

        // Reset figures
        DOM.figure.style.left = '15%';
        DOM.figure.style.top = '65%';
        DOM.figure.classList.remove('walking');
        DOM.figure.style.transition = '';

        DOM.suspect.style.left = '85%';
        DOM.suspect.style.top = '30%';
        DOM.suspect.className = 'ai-suspect';
        DOM.suspect.style.transition = '';
        DOM.suspectTag.textContent = 'UNKNOWN';

        DOM.figureDot.className = 'ai-figure-dot';
        DOM.figurePing.className = 'ai-figure-ping';

        // Reset environment
        DOM.detectGrid.className = 'ai-detect-grid';
        DOM.scanline.className = 'ai-scanline';
        DOM.scanlineV.className = 'ai-scanline-v';
        DOM.ambientGlow.className = 'ai-ambient-glow';
        DOM.glitchOverlay.className = 'ai-glitch-overlay';
        DOM.alertFlash.classList.remove('active');
        DOM.scene.classList.remove('alert-vignette');

        // Reset detection box
        DOM.detectBox.className = 'ai-detect-box';

        // Reset warning zones
        DOM.warningZone1.classList.remove('visible');
        DOM.warningZone2.classList.remove('visible');

        // Reset neural
        setNeural('NEURAL NET ACTIVE', '');

        // Reset mode
        setMode('SCANNING', '');

        // Reset popups
        DOM.popups.innerHTML = '';

        // Reset scan data
        updateScanData('250m²', '0', '30 fps', '0', 'PASSIVE', 'LOW');

        // Reset AI analysis
        updateAIAnalysis(0, 'NORMAL', '--', 'STANDBY', 'SAFE');

        // Reset timeline
        setTimeline(0, 'STANDBY');

        // Reset alert
        DOM.alertStatus.classList.remove('active');
        DOM.alertLabel.textContent = 'ALERT: INACTIVE';

        // Hide panels
        DOM.panelLeft.classList.remove('visible');
        DOM.panelRight.classList.remove('visible');

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
        startScanUpdater();

        try {
            // ═══════════════════════════════════════
            // STAGE 1: SYSTEM INITIALIZATION
            // ═══════════════════════════════════════
            setTimeline(3, 'INITIALIZING');

            await wait(400, signal);
            DOM.panelLeft.classList.add('visible');
            await wait(300, signal);
            DOM.panelRight.classList.add('visible');

            await wait(300, signal);
            setMode('SCANNING', 'scanning');
            setNeural('NEURAL NET ACTIVE', 'scanning');
            updateScanData('250m²', '0', '30 fps', '0', 'PASSIVE', 'LOW');

            await showPopup('AI threat detection system online', 'scan', signal, 2200);

            // Start scan lines
            DOM.detectGrid.classList.add('active');
            DOM.scanline.classList.add('active');
            DOM.scanlineV.classList.add('active');
            DOM.ambientGlow.classList.add('scanning');

            // Persistent glitch for ambiance
            DOM.glitchOverlay.classList.add('persistent');

            await wait(300, signal);
            await showPopup('Environmental scanning initiated', 'success', signal, 2000);

            setTimeline(8, 'SCAN ACTIVE');
            updateAIAnalysis(2, 'NORMAL', '99.4%', 'MONITORING', 'SAFE');

            // ═══════════════════════════════════════
            // STAGE 2: USER WALKING — NORMAL STATE
            // ═══════════════════════════════════════
            setTimeline(12, 'MONITORING');

            await wait(500, signal);
            DOM.figure.classList.add('walking');
            updateScanData('250m²', '1', '30 fps', '0', 'PASSIVE', 'LOW');

            moveUser(22, 60);
            await wait(500, signal);
            await showPopup('Scanning environment…', 'scan', signal, 1800);

            await wait(1500, signal);
            moveUser(30, 55);
            updateAIAnalysis(3, 'NORMAL', '99.2%', 'MONITORING', 'SAFE');

            await wait(2000, signal);
            setTimeline(18, 'TRACKING');
            moveUser(38, 52);

            await wait(1000, signal);
            await showPopup('User walking — Normal activity pattern', 'info', signal, 1800);

            await wait(1500, signal);
            moveUser(45, 50);
            updateAIAnalysis(4, 'NORMAL', '99.0%', 'MONITORING', 'SAFE');

            // ═══════════════════════════════════════
            // STAGE 3: SUSPECT ENTERS SCAN AREA
            // ═══════════════════════════════════════
            setTimeline(25, 'ENTITY DETECTED');

            await wait(800, signal);
            DOM.suspect.classList.add('visible');
            DOM.suspect.classList.add('walking');
            moveSuspect(82, 32);

            updateScanData('250m²', '2', '30 fps', '0', 'PASSIVE', 'LOW');

            await wait(600, signal);
            await showPopup('New entity detected in scan area', 'info', signal, 2000);

            await wait(1000, signal);
            moveSuspect(75, 36);

            await wait(1500, signal);
            setTimeline(30, 'ANALYZING');
            updateAIAnalysis(8, 'NORMAL', '98.5%', 'MONITORING', 'SAFE');

            // Suspect moves closer
            moveSuspect(68, 40);
            await wait(1000, signal);
            await showPopup('Analyzing entity behavior pattern…', 'info', signal, 1800);

            await wait(1500, signal);

            // ═══════════════════════════════════════
            // STAGE 4: PATTERN IRREGULARITY
            // ═══════════════════════════════════════
            setTimeline(38, 'IRREGULARITY');

            // Suspect changes direction erratically
            moveSuspect(62, 38);
            await wait(800, signal);
            moveSuspect(66, 43);
            await wait(600, signal);
            moveSuspect(60, 41);

            updateScanData('250m²', '2', '30 fps', '1', 'ACTIVE', 'MEDIUM');
            updateAIAnalysis(18, 'IRREGULAR', '96.8%', 'MONITORING', 'SAFE');
            setNeural('ANALYZING', 'detecting');
            setMode('DETECTING', 'detecting');

            await wait(500, signal);
            await showPopup('⚠ Irregular movement pattern detected', 'warning', signal, 2200);

            // Glitch effect
            await wait(400, signal);
            triggerGlitch();

            await wait(800, signal);
            moveSuspect(58, 45);
            updateAIAnalysis(25, 'IRREGULAR', '94.2%', 'ANALYZING', 'CAUTION');

            setTimeline(44, 'ANOMALY SCORING');
            await showPopup('Anomaly score increasing — Analyzing trajectory', 'warning', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 5: SUSPECT APPROACHES USER
            // ═══════════════════════════════════════
            setTimeline(50, 'APPROACH DETECTED');

            await wait(600, signal);
            moveSuspect(55, 48);
            updateScanData('250m²', '2', '30 fps', '2', 'ACTIVE', 'MEDIUM');
            updateAIAnalysis(35, 'SUSPICIOUS', '91.5%', 'ANALYZING', 'CAUTION');

            await wait(1200, signal);
            moveSuspect(52, 50);

            // Warning zone activates
            DOM.warningZone1.style.left = '50%';
            DOM.warningZone1.style.top = '48%';
            DOM.warningZone1.classList.add('visible');

            await wait(500, signal);
            await showPopup('⚠ Entity approaching user — Distance decreasing', 'warning', signal, 2200);

            // ═══════════════════════════════════════
            // STAGE 6: THREAT PROBABILITY RISING
            // ═══════════════════════════════════════
            setTimeline(58, 'THREAT RISING');

            await wait(600, signal);
            moveSuspect(50, 50);
            DOM.suspect.classList.add('detected');
            DOM.suspectTag.textContent = 'SUSPECT';

            updateAIAnalysis(48, 'SUSPICIOUS', '88.7%', 'ANALYZING', 'CAUTION');

            triggerGlitch();
            await wait(500, signal);
            await showPopup('Unusual activity detected — Threat rising', 'warning', signal, 2200);

            await wait(800, signal);
            updateAIAnalysis(58, 'SUSPICIOUS', '85.3%', 'ANALYZING', 'CAUTION');
            updateScanData('250m²', '2', '30 fps', '3', 'ACTIVE', 'HIGH');

            // Second warning zone
            DOM.warningZone2.style.left = '48%';
            DOM.warningZone2.style.top = '50%';
            DOM.warningZone2.classList.add('visible');

            setTimeline(63, 'VALIDATING');

            await wait(600, signal);
            await showPopup('Threat probability increasing — 58%', 'warning', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 7: VALIDATION PHASE
            // ═══════════════════════════════════════
            setTimeline(68, 'VALIDATION');

            await wait(600, signal);
            updateAIAnalysis(65, 'SUSPICIOUS', '82.1%', 'VALIDATING', 'THREAT');

            // Detection box appears around suspect
            positionDetectBox(50, 50);
            DOM.detectBox.classList.add('visible');
            DOM.detectBox.classList.add('scanning');

            setNeural('VALIDATING', 'detecting');
            await showPopup('AI validating anomaly — Confirming pattern…', 'warning', signal, 2200);

            await wait(800, signal);
            updateAIAnalysis(72, 'SUSPICIOUS', '79.6%', 'VALIDATING', 'THREAT');

            await wait(600, signal);
            triggerGlitch();
            updateAIAnalysis(78, 'HOSTILE', '91.4%', 'VALIDATING', 'THREAT');

            await showPopup('Threat probability: 78% — Threshold approaching', 'danger', signal, 2200);

            // ═══════════════════════════════════════
            // STAGE 8: THREAT CONFIRMED — ALERT
            // ═══════════════════════════════════════
            setTimeline(78, 'THREAT CONFIRMED');

            await wait(600, signal);

            // === ALERT TRIGGERED ===
            updateAIAnalysis(88, 'HOSTILE', '96.2%', 'ALERT ISSUED', 'THREAT');
            updateScanData('250m²', '2', '30 fps', '4', 'THREAT', 'CRITICAL');

            setNeural('THREAT ACTIVE', 'alert');
            setMode('ALERT MODE', 'alert');
            DOM.ambientGlow.className = 'ai-ambient-glow alert';
            DOM.detectGrid.classList.add('alert');
            DOM.scanline.classList.add('alert');

            // Visual effects
            flashAlert();
            screenShake(500);
            triggerGlitch();

            // Detection label changes
            DOM.detectLabel.textContent = 'THREAT CONFIRMED';
            DOM.detectBox.classList.remove('scanning');

            // Figure indicators
            DOM.figureDot.classList.add('alert');
            DOM.figurePing.classList.add('alert');

            // Vignette
            DOM.scene.classList.add('alert-vignette');

            // Remove persistent glitch, use urgent mode
            DOM.glitchOverlay.classList.remove('persistent');

            // Alert status
            DOM.alertStatus.classList.add('active');
            DOM.alertLabel.textContent = 'ALERT: ACTIVE';

            // ═══════════════════════════════════════
            // STAGE 9: MULTI-STEP RESPONSE
            // ═══════════════════════════════════════

            await wait(400, signal);
            await showPopup('⚠ Suspicious pattern confirmed', 'danger', signal, 2200);

            await wait(300, signal);
            await showPopup('Threat probability rising — 88%', 'danger', signal, 2000);

            await wait(300, signal);
            screenShake(350);
            flashAlert();
            triggerGlitch();
            updateAIAnalysis(94, 'HOSTILE', '97.8%', 'ALERT ISSUED', 'THREAT');

            setTimeline(85, 'ALERT ISSUED');
            await showPopup('⚠ Preventive alert issued', 'danger', signal, 2500);

            await wait(300, signal);
            await showPopup('📍 Position locked — Live tracking active', 'danger', signal, 2200);

            await wait(300, signal);
            await showPopup('📡 Emergency contacts notified', 'danger', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 10: RESOLUTION
            // ═══════════════════════════════════════
            setTimeline(93, 'RESPONSE SENT');

            await wait(600, signal);
            updateAIAnalysis(94, 'HOSTILE', '97.8%', 'ALERT ISSUED', 'THREAT');
            DOM.alertLabel.textContent = 'ALERT: RESPONDED';

            // Ease visual intensity
            DOM.scene.classList.remove('alert-vignette');

            await showPopup('✔ Preventive alert sent — Safety measures active', 'success', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 11: COMPLETE
            // ═══════════════════════════════════════
            setTimeline(100, 'COMPLETE');

            await wait(800, signal);
            await showPopup('AI threat detection cycle complete', 'success', signal, 2500);

            stopScanUpdater();
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
        setMode('SCANNING', '');
        setNeural('NEURAL NET ACTIVE', '');

        // Initial positions
        DOM.figure.style.left = '15%';
        DOM.figure.style.top = '65%';
        DOM.suspect.style.left = '85%';
        DOM.suspect.style.top = '30%';

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
    }

    init();

})();

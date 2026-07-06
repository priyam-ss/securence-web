/* ============================================
   SECURENCE — Safe Zone Intelligent System
   Advanced Geofencing Simulation Engine
   High Fidelity JavaScript — v3
   ============================================

   LOGIC FLOW:
   EVENT → DETECTION → VALIDATION → RESPONSE → CONFIRMATION

   THRESHOLD ZONES:
   1. INNER SAFE (green)    — 0-35% of radius
   2. WARNING (yellow)      — 35-65% of radius
   3. CRITICAL EDGE (orange) — 65-90% of radius
   4. OUTSIDE (red)         — 90%+ of radius

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
        app: document.getElementById('sz-app'),
        scene: document.getElementById('sz-scene'),
        sceneInner: document.getElementById('sz-scene-inner'),

        // Figure
        figure: document.getElementById('sz-figure'),
        figureDot: document.getElementById('sz-figure-dot'),
        figurePing: document.getElementById('sz-figure-ping'),

        // Zones
        zoneContainer: document.getElementById('sz-zone-container'),
        zoneInner: document.getElementById('sz-zone-inner'),
        zoneWarning: document.getElementById('sz-zone-warning'),
        zoneCritical: document.getElementById('sz-zone-critical'),
        zoneBoundary: document.getElementById('sz-zone-boundary'),

        // Center
        centerMarker: document.getElementById('sz-center-marker'),
        pulseWaves: document.getElementById('sz-pulse-waves'),
        scanSweep: document.getElementById('sz-scan-sweep'),

        // Ambient
        ambientGlow: document.getElementById('sz-ambient-glow'),
        breachFlash: document.getElementById('sz-breach-flash'),
        signalWaves: document.getElementById('sz-signal-waves'),
        crosshair: document.getElementById('sz-crosshair'),

        // Top Bar
        badge: document.getElementById('sz-badge'),
        badgeText: document.getElementById('sz-badge-text'),
        signalLabel: document.getElementById('sz-signal-label'),
        gpsLabel: document.getElementById('sz-gps-label'),
        systemClock: document.getElementById('sz-system-clock'),

        // Telemetry Left
        telemLeft: document.getElementById('sz-telemetry-left'),
        lat: document.getElementById('sz-lat'),
        lng: document.getElementById('sz-lng'),
        distance: document.getElementById('sz-distance'),
        radius: document.getElementById('sz-radius'),
        zoneStatus: document.getElementById('sz-zone-status'),
        boundaryPct: document.getElementById('sz-boundary-pct'),
        boundaryBar: document.getElementById('sz-boundary-bar'),

        // Telemetry Right
        telemRight: document.getElementById('sz-telemetry-right'),
        signalStrength: document.getElementById('sz-signal-strength'),
        gpsAccuracy: document.getElementById('sz-gps-accuracy'),
        velocity: document.getElementById('sz-velocity'),
        heading: document.getElementById('sz-heading'),
        alertLevel: document.getElementById('sz-alert-level'),
        responseStatus: document.getElementById('sz-response-status'),

        // Bottom
        timelineFill: document.getElementById('sz-timeline-fill'),
        timelineLabel: document.getElementById('sz-timeline-label'),
        contactStatus: document.getElementById('sz-contact-status'),
        contactLabel: document.getElementById('sz-contact-label'),

        // Popups
        popups: document.getElementById('sz-popups'),

        // Buttons
        startBtn: document.getElementById('btn-start'),
        resetBtn: document.getElementById('btn-reset'),
    };

    // ══════════════════════════════════════════════
    // STATE MANAGEMENT
    // ══════════════════════════════════════════════
    const STATE = {
        isRunning: false,
        isComplete: false,
        abortController: null,
        clockInterval: null,
        telemetryInterval: null,
        currentPhase: 'IDLE',
        currentZone: 'INNER_SAFE',
        distancePercent: 0,
        userPosition: { x: 50, y: 50 }, // percent-based positioning
        centerPosition: { x: 50, y: 50 },
        animationFrameId: null,
    };

    // ══════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════
    const CONFIG = {
        safeZoneRadius: 150, // meters (simulated)
        zones: {
            INNER_SAFE: { max: 0.35, color: 'safe', label: 'INNER SAFE', barColor: '#00ff88' },
            WARNING: { max: 0.65, color: 'warning', label: 'WARNING', barColor: '#fbbf24' },
            CRITICAL: { max: 0.90, color: 'critical', label: 'CRITICAL', barColor: '#f97316' },
            OUTSIDE: { max: Infinity, color: 'alert', label: 'OUTSIDE', barColor: '#ff3b3b' },
        },
        baseLat: 28.6139,
        baseLng: 77.2090,
    };

    // ══════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ══════════════════════════════════════════════

    /** Abortable wait */
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

    /** Get current time formatted */
    function getTimeString() {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    }

    /** Start system clock */
    function startClock() {
        updateClock();
        STATE.clockInterval = setInterval(updateClock, 1000);
    }

    function updateClock() {
        if (DOM.systemClock) {
            DOM.systemClock.textContent = 'SYS TIME: ' + getTimeString();
        }
    }

    function stopClock() {
        if (STATE.clockInterval) {
            clearInterval(STATE.clockInterval);
            STATE.clockInterval = null;
        }
    }

    /** Calculate distance between two points (percent-based) */
    function calculateDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** Calculate heading between two points */
    function calculateHeading(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        return angle;
    }

    /** Get cardinal direction from degrees */
    function getCardinal(deg) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(deg / 45) % 8];
    }

    /** Determine which zone the user is in based on distance percentage */
    function getZone(distPct) {
        if (distPct <= CONFIG.zones.INNER_SAFE.max) return 'INNER_SAFE';
        if (distPct <= CONFIG.zones.WARNING.max) return 'WARNING';
        if (distPct <= CONFIG.zones.CRITICAL.max) return 'CRITICAL';
        return 'OUTSIDE';
    }

    /** Random float in range */
    function randRange(min, max) {
        return min + Math.random() * (max - min);
    }

    // ══════════════════════════════════════════════
    // POPUP SYSTEM
    // ══════════════════════════════════════════════

    /**
     * Show popup notification — one at a time
     * Uses sz-popup class instead of sim-popup to match our new CSS
     */
    async function showPopup(text, type, signal, stayMs) {
        if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const stay = stayMs || 2000;

        const el = document.createElement('div');
        el.className = 'sz-popup ' + (type || '');
        el.textContent = text;
        DOM.popups.appendChild(el);

        // Fade in
        await wait(30, signal);
        el.classList.add('visible');
        await wait(400, signal);

        // Stay
        await wait(stay, signal);

        // Fade out
        el.classList.remove('visible');
        el.classList.add('exiting');
        await wait(400, signal);

        // Remove
        if (el.parentNode) el.parentNode.removeChild(el);
    }

    // ══════════════════════════════════════════════
    // BADGE SYSTEM
    // ══════════════════════════════════════════════

    function setBadge(text, className) {
        DOM.badgeText.textContent = text;
        DOM.badge.className = 'sz-status-badge';
        if (className) DOM.badge.classList.add(className);
    }

    // ══════════════════════════════════════════════
    // ZONE UPDATE SYSTEM
    // ══════════════════════════════════════════════

    function updateZoneIndicators(zone) {
        const zoneConfig = CONFIG.zones[zone];
        const prevZone = STATE.currentZone;

        // Remove active from all zones
        DOM.zoneInner.classList.remove('active-zone');
        DOM.zoneWarning.classList.remove('active-zone');
        DOM.zoneCritical.classList.remove('active-zone');
        DOM.zoneBoundary.classList.remove('breached');

        // Set active zone
        switch (zone) {
            case 'INNER_SAFE':
                DOM.zoneInner.classList.add('active-zone');
                break;
            case 'WARNING':
                DOM.zoneWarning.classList.add('active-zone');
                break;
            case 'CRITICAL':
                DOM.zoneCritical.classList.add('active-zone');
                break;
            case 'OUTSIDE':
                DOM.zoneBoundary.classList.add('breached');
                break;
        }

        // Update zone status indicator
        DOM.zoneStatus.textContent = zoneConfig.label;
        DOM.zoneStatus.className = 'sz-telem-value sz-zone-indicator ' + zoneConfig.color;

        // Update ambient glow
        DOM.ambientGlow.className = 'sz-ambient-glow';
        if (zone !== 'INNER_SAFE') {
            DOM.ambientGlow.classList.add(zoneConfig.color);
        }

        // Update figure dot and ping
        DOM.figureDot.className = 'sz-figure-dot';
        DOM.figurePing.className = 'sz-figure-ping';
        if (zone !== 'INNER_SAFE') {
            DOM.figureDot.classList.add(zoneConfig.color);
            DOM.figurePing.classList.add(zoneConfig.color);
        }

        STATE.currentZone = zone;
    }

    // ══════════════════════════════════════════════
    // TELEMETRY UPDATE SYSTEM
    // ══════════════════════════════════════════════

    function updateTelemetry(distPct, velocity, heading) {
        // Distance
        const distMeters = (distPct * CONFIG.safeZoneRadius).toFixed(1);
        DOM.distance.textContent = distMeters + ' m';

        // Boundary percentage
        const pct = Math.min(Math.round(distPct * 100), 150);
        DOM.boundaryPct.textContent = pct + '%';

        // Boundary progress bar
        DOM.boundaryBar.style.width = Math.min(pct, 100) + '%';
        const zone = getZone(distPct);
        DOM.boundaryBar.style.background = CONFIG.zones[zone].barColor;

        // Velocity
        DOM.velocity.textContent = velocity.toFixed(1) + ' km/h';

        // Heading
        DOM.heading.textContent = Math.round(heading) + '° ' + getCardinal(heading);

        // Simulate lat/lng based on distance
        const latOffset = (distPct * 0.003 * Math.cos(heading * Math.PI / 180));
        const lngOffset = (distPct * 0.003 * Math.sin(heading * Math.PI / 180));
        DOM.lat.textContent = (CONFIG.baseLat + latOffset).toFixed(4) + '°N';
        DOM.lng.textContent = (CONFIG.baseLng + lngOffset).toFixed(4) + '°E';

        // Update distance color
        if (distPct > 0.9) {
            DOM.distance.style.color = '#ff3b3b';
        } else if (distPct > 0.65) {
            DOM.distance.style.color = '#f97316';
        } else if (distPct > 0.35) {
            DOM.distance.style.color = '#fbbf24';
        } else {
            DOM.distance.style.color = '#00ff88';
        }
    }

    function updateSignalTelemetry(signal, gpsAcc) {
        DOM.signalStrength.textContent = signal + '%';
        DOM.gpsAccuracy.textContent = '±' + gpsAcc.toFixed(1) + ' m';
    }

    function setAlertLevel(level) {
        DOM.alertLevel.textContent = level;
        if (level === 'NONE') DOM.alertLevel.style.color = 'var(--text-primary)';
        else if (level === 'LOW') DOM.alertLevel.style.color = '#fbbf24';
        else if (level === 'HIGH') DOM.alertLevel.style.color = '#f97316';
        else if (level === 'CRITICAL') DOM.alertLevel.style.color = '#ff3b3b';
    }

    function setResponseStatus(status) {
        DOM.responseStatus.textContent = status;
    }

    // ══════════════════════════════════════════════
    // TIMELINE SYSTEM
    // ══════════════════════════════════════════════

    function setTimeline(pct, label) {
        DOM.timelineFill.style.width = pct + '%';
        DOM.timelineLabel.textContent = 'PHASE: ' + label;
    }

    // ══════════════════════════════════════════════
    // VISUAL EFFECTS
    // ══════════════════════════════════════════════

    /** Screen shake */
    function screenShake(duration) {
        DOM.sceneInner.classList.add('sz-screen-shake');
        setTimeout(() => DOM.sceneInner.classList.remove('sz-screen-shake'), duration || 400);
    }

    /** Breach flash */
    function breachFlash() {
        DOM.breachFlash.classList.add('active');
        setTimeout(() => DOM.breachFlash.classList.remove('active'), 600);
    }

    /** Create pulse wave from center */
    function createPulseWave() {
        const wave = document.createElement('div');
        wave.className = 'sz-pulse-wave';
        DOM.pulseWaves.appendChild(wave);
        setTimeout(() => {
            if (wave.parentNode) wave.parentNode.removeChild(wave);
        }, 2000);
    }

    /** Multiple pulse waves */
    function pulseBurst(count, interval) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => createPulseWave(), i * interval);
        }
    }

    /** Move user figure to position (percent-based) */
    function moveUser(x, y) {
        const prevX = STATE.userPosition.x;
        const prevY = STATE.userPosition.y;
        STATE.userPosition = { x, y };

        DOM.figure.style.left = x + '%';
        DOM.figure.style.top = y + '%';

        // Update crosshair to follow user
        const crossH = DOM.crosshair.querySelector('.sz-crosshair-h');
        const crossV = DOM.crosshair.querySelector('.sz-crosshair-v');
        if (crossH) crossH.style.top = y + '%';
        if (crossV) crossV.style.left = x + '%';
    }

    /** Show telemetry panels */
    function showTelemetry() {
        DOM.telemLeft.classList.add('visible');
        DOM.telemRight.classList.add('visible');
    }

    /** Hide telemetry panels */
    function hideTelemetry() {
        DOM.telemLeft.classList.remove('visible');
        DOM.telemRight.classList.remove('visible');
    }

    // ══════════════════════════════════════════════
    // COORDINATE GRID LABELS
    // ══════════════════════════════════════════════

    function generateGridCoords() {
        const container = DOM.crosshair; // reuse
        // Add a few static coord labels
        const labels = [
            { text: 'A1', x: '10%', y: '15%' },
            { text: 'B2', x: '30%', y: '15%' },
            { text: 'C3', x: '50%', y: '15%' },
            { text: 'D4', x: '70%', y: '15%' },
            { text: 'E5', x: '90%', y: '15%' },
            { text: 'A6', x: '10%', y: '85%' },
            { text: 'B7', x: '30%', y: '85%' },
            { text: 'C8', x: '50%', y: '85%' },
            { text: 'D9', x: '70%', y: '85%' },
            { text: 'E0', x: '90%', y: '85%' },
        ];

        const coordsDiv = document.getElementById('sz-grid-coords');
        labels.forEach(l => {
            const el = document.createElement('span');
            el.className = 'sz-grid-coord-label';
            el.textContent = l.text;
            el.style.left = l.x;
            el.style.top = l.y;
            coordsDiv.appendChild(el);
        });
    }

    // ══════════════════════════════════════════════
    // CONTINUOUS TELEMETRY UPDATER
    // ══════════════════════════════════════════════

    function startTelemetryUpdater() {
        STATE.telemetryInterval = setInterval(() => {
            const dist = calculateDistance(STATE.userPosition, STATE.centerPosition);
            // Normalize: the zone boundary visual is about 25% of the viewport away
            // Let's map the visual distance to the threshold
            const maxVisualDist = 28; // ~28% of viewport is the visible boundary edge
            const distPct = Math.min(dist / maxVisualDist, 1.5);

            const heading = calculateHeading(STATE.centerPosition, STATE.userPosition);
            const velocity = DOM.figure.classList.contains('walking') ? randRange(3.5, 5.5) : 0;

            updateTelemetry(distPct, velocity, heading);

            // Zone detection
            const zone = getZone(distPct);
            if (zone !== STATE.currentZone) {
                updateZoneIndicators(zone);
            }

            // Signal strength simulation
            const sig = Math.max(40, Math.round(98 - distPct * 40 + randRange(-2, 2)));
            const gps = 1.2 + distPct * 2 + randRange(-0.3, 0.3);
            updateSignalTelemetry(sig, gps);

        }, 200);
    }

    function stopTelemetryUpdater() {
        if (STATE.telemetryInterval) {
            clearInterval(STATE.telemetryInterval);
            STATE.telemetryInterval = null;
        }
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
        DOM.startBtn.innerHTML = ICON_RUNNING + ' System Active…';
    }

    function btnReplay() {
        DOM.startBtn.disabled = false;
        DOM.startBtn.innerHTML = ICON_REPLAY + ' Replay Simulation';
    }

    // ══════════════════════════════════════════════
    // FULL RESET
    // ══════════════════════════════════════════════

    function fullReset() {
        // Abort running simulation
        if (STATE.abortController) {
            STATE.abortController.abort();
        }

        STATE.isRunning = false;
        STATE.isComplete = false;
        STATE.currentPhase = 'IDLE';
        STATE.currentZone = 'INNER_SAFE';
        STATE.distancePercent = 0;
        STATE.userPosition = { x: 50, y: 50 };

        stopClock();
        stopTelemetryUpdater();

        // Reset figure
        DOM.figure.style.left = '50%';
        DOM.figure.style.top = '50%';
        DOM.figure.classList.remove('walking');
        DOM.figure.style.transition = '';

        // Reset crosshair
        const crossH = DOM.crosshair.querySelector('.sz-crosshair-h');
        const crossV = DOM.crosshair.querySelector('.sz-crosshair-v');
        if (crossH) crossH.style.top = '50%';
        if (crossV) crossV.style.left = '50%';

        // Reset zones
        DOM.zoneInner.classList.remove('active-zone');
        DOM.zoneWarning.classList.remove('active-zone');
        DOM.zoneCritical.classList.remove('active-zone');
        DOM.zoneBoundary.classList.remove('breached');
        DOM.zoneInner.classList.add('active-zone');

        // Reset dots
        DOM.figureDot.className = 'sz-figure-dot';
        DOM.figurePing.className = 'sz-figure-ping';

        // Reset ambient
        DOM.ambientGlow.className = 'sz-ambient-glow';
        DOM.breachFlash.classList.remove('active');
        DOM.signalWaves.classList.remove('active');
        DOM.scene.classList.remove('alert-vignette');

        // Reset badge
        setBadge('SECURE', '');

        // Reset popups
        DOM.popups.innerHTML = '';

        // Reset pulse waves
        DOM.pulseWaves.innerHTML = '';

        // Reset telemetry
        DOM.distance.textContent = '0.0 m';
        DOM.distance.style.color = '#00ff88';
        DOM.boundaryPct.textContent = '0%';
        DOM.boundaryBar.style.width = '0%';
        DOM.boundaryBar.style.background = '#00ff88';
        DOM.velocity.textContent = '0.0 km/h';
        DOM.heading.textContent = '0° N';
        DOM.signalStrength.textContent = '98%';
        DOM.gpsAccuracy.textContent = '±1.2 m';
        DOM.lat.textContent = CONFIG.baseLat.toFixed(4) + '°N';
        DOM.lng.textContent = CONFIG.baseLng.toFixed(4) + '°E';
        DOM.zoneStatus.textContent = 'INNER SAFE';
        DOM.zoneStatus.className = 'sz-telem-value sz-zone-indicator safe';
        setAlertLevel('NONE');
        setResponseStatus('STANDBY');

        // Reset timeline
        setTimeline(0, 'IDLE');

        // Reset contact
        DOM.contactStatus.classList.remove('active');
        DOM.contactLabel.textContent = 'CONTACTS: STANDBY';

        // Reset signal bars
        document.querySelectorAll('.sz-signal-bar').forEach(bar => {
            bar.classList.remove('weak');
            bar.classList.add('active');
        });
        DOM.signalLabel.textContent = 'STRONG';
        DOM.signalLabel.style.color = '';

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

        try {
            // ═══════════════════════════════════════
            // STAGE 1: SYSTEM INITIALIZATION
            // ═══════════════════════════════════════
            setTimeline(5, 'INITIALIZING');

            // Show telemetry panels with stagger
            await wait(400, signal);
            DOM.telemLeft.classList.add('visible');
            await wait(300, signal);
            DOM.telemRight.classList.add('visible');

            // Start continuous telemetry
            startTelemetryUpdater();

            await wait(500, signal);
            setBadge('SECURE', '');
            await showPopup('System online — Safe Zone active', 'success', signal, 2200);

            await wait(300, signal);
            setTimeline(10, 'SYSTEM READY');
            updateZoneIndicators('INNER_SAFE');

            await wait(400, signal);
            await showPopup('GPS locked — Signal strength: 98%', 'info', signal, 1800);

            await wait(300, signal);
            await showPopup('User within safe zone — Status: SECURE', 'success', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 2: MOVEMENT BEGINS
            // ═══════════════════════════════════════
            setTimeline(20, 'MONITORING');

            await wait(500, signal);
            DOM.figure.classList.add('walking');

            // Move 1: Within inner safe zone
            moveUser(44, 46);
            await wait(800, signal);
            await showPopup('Movement detected — Monitoring position', 'info', signal, 1500);

            await wait(1500, signal);

            // Move 2: Still in inner safe
            moveUser(40, 43);
            await wait(2000, signal);

            setTimeline(30, 'TRACKING');

            // ═══════════════════════════════════════
            // STAGE 3: APPROACHING WARNING ZONE
            // ═══════════════════════════════════════
            await wait(500, signal);

            // Move 3: Enter warning zone
            moveUser(35, 38);
            await wait(1200, signal);

            setTimeline(40, 'WARNING ZONE');
            setBadge('CAUTION', 'warning');
            setAlertLevel('LOW');
            await showPopup('⚠ Approaching safe zone boundary', 'warning', signal, 2000);

            await wait(1000, signal);

            // Move 4: Deeper into warning zone
            moveUser(31, 35);
            await wait(1500, signal);

            await showPopup('Distance increasing — Boundary at 55%', 'warning', signal, 1800);

            // ═══════════════════════════════════════
            // STAGE 4: ENTERING CRITICAL ZONE
            // ═══════════════════════════════════════
            await wait(800, signal);
            setTimeline(55, 'CRITICAL ZONE');

            // Move 5: Critical zone
            moveUser(27, 30);
            await wait(1200, signal);

            setBadge('WARNING', 'critical');
            setAlertLevel('HIGH');
            screenShake(250);

            await showPopup('⚠ CRITICAL ZONE — Boundary proximity alert', 'critical-popup', signal, 2200);

            await wait(600, signal);
            await showPopup('System preparing emergency protocols…', 'warning', signal, 1800);

            // Signal degradation
            document.querySelector('.sz-signal-bar.bar-4').classList.remove('active');
            document.querySelector('.sz-signal-bar.bar-4').classList.add('weak');
            DOM.signalLabel.textContent = 'FAIR';
            DOM.signalLabel.style.color = '#fbbf24';

            await wait(800, signal);

            // Move 6: Right at the edge
            moveUser(24, 27);
            await wait(1500, signal);

            setTimeline(65, 'EDGE DETECTED');
            await showPopup('Boundary threshold at 88% — Standby for breach', 'warning', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 5: BOUNDARY BREACH
            // ═══════════════════════════════════════
            await wait(600, signal);

            // Move 7: CROSS THE BOUNDARY — SOS triggers EXACTLY here
            moveUser(20, 23);

            // Wait for the figure to actually reach the boundary position
            await wait(2000, signal);

            // ═══ BREACH EVENT ═══
            setTimeline(75, 'BREACH DETECTED');
            DOM.figure.classList.remove('walking');

            // IMMEDIATE RESPONSE: Zone turns RED
            setBadge('BREACHED', 'alert');
            setAlertLevel('CRITICAL');

            // Pulse wave expands outward
            pulseBurst(5, 300);

            // Screen vibration
            screenShake(500);

            // Breach flash
            breachFlash();

            // Signal waves
            DOM.signalWaves.classList.add('active');

            // Vignette
            DOM.scene.classList.add('alert-vignette');

            // Signal goes weak
            document.querySelector('.sz-signal-bar.bar-3').classList.remove('active');
            document.querySelector('.sz-signal-bar.bar-3').classList.add('weak');
            DOM.signalLabel.textContent = 'WEAK';
            DOM.signalLabel.style.color = '#ff3b3b';

            setResponseStatus('ACTIVE');

            // ═══════════════════════════════════════
            // STAGE 6: MULTI-STEP RESPONSE SEQUENCE
            // ═══════════════════════════════════════

            // Step 1: Threshold exceeded
            await wait(400, signal);
            await showPopup('⚠ Boundary threshold exceeded', 'danger', signal, 2000);

            // Step 2: Validating
            await wait(300, signal);
            await showPopup('Validating position…', 'warning', signal, 1800);

            // Step 3: Breach confirmed
            await wait(300, signal);
            screenShake(300);
            breachFlash();
            pulseBurst(3, 200);
            await showPopup('🚨 SAFE ZONE BREACHED', 'danger', signal, 2500);

            // Step 4: Location locked
            setTimeline(85, 'EMERGENCY RESPONSE');
            await wait(300, signal);
            await showPopup('📍 Location locked — Coordinates secured', 'danger', signal, 2200);

            // Step 5: Alert sent
            await wait(300, signal);
            DOM.contactStatus.classList.add('active');
            DOM.contactLabel.textContent = 'CONTACTS: ALERTING';
            await showPopup('📡 Alert sent to trusted contacts', 'danger', signal, 2500);

            // ═══════════════════════════════════════
            // STAGE 7: TRACKING & STABILIZATION
            // ═══════════════════════════════════════
            setTimeline(92, 'TRACKING ACTIVE');
            await wait(500, signal);

            setBadge('TRACKING', 'tracking');
            setResponseStatus('TRACKING');
            DOM.contactLabel.textContent = 'CONTACTS: NOTIFIED';

            await showPopup('Live tracking enabled — Monitoring continues', 'info', signal, 2200);

            await wait(400, signal);
            await showPopup('Emergency contacts have been notified', 'success', signal, 2000);

            // ═══════════════════════════════════════
            // STAGE 8: COMPLETE
            // ═══════════════════════════════════════
            setTimeline(100, 'COMPLETE');
            await wait(800, signal);

            await showPopup('✔ System response complete — Awaiting resolution', 'success', signal, 2500);

            // Clean up
            stopTelemetryUpdater();
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
            // If simulation is running, abort and restart
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
        // Generate grid coordinates
        generateGridCoords();

        // Set initial position
        moveUser(50, 50);
        updateZoneIndicators('INNER_SAFE');

        // Start clock
        startClock();

        // Set initial badge
        setBadge('SECURE', '');

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

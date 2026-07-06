/* ============================================
   SECURENCE — Simulation Engine v2
   
   Clean timeline controller with:
   - Promise-based sequential steps
   - Popup notification system (ONE at a time)
   - State management + full reset
   - No messy setTimeout chains
   ============================================ */

const SimEngine = (function () {
    'use strict';

    let _abortController = null;
    let _isRunning = false;
    let _isComplete = false;

    // ──────────── Preloader ────────────
    function initPreloader() {
        const preloader = document.getElementById('viz-preloader');
        const bar = document.getElementById('viz-loader-bar');
        if (!preloader || !bar) return;

        let p = 0;
        const iv = setInterval(() => {
            p += Math.random() * 14 + 4;
            if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => preloader.classList.add('loaded'), 350); }
            bar.style.width = p + '%';
        }, 120);

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!preloader.classList.contains('loaded')) {
                    bar.style.width = '100%';
                    setTimeout(() => preloader.classList.add('loaded'), 300);
                }
            }, 2500);
        });
    }

    // ──────────── Abortable wait ────────────
    function wait(ms, signal) {
        return new Promise((resolve, reject) => {
            const id = setTimeout(resolve, ms);
            if (signal) {
                signal.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); });
            }
        });
    }

    // ──────────── Popup Notification System ────────────
    // Shows ONE popup at a time: fade in → stay → fade out
    function popup(container, text, type, signal, stayMs) {
        return new Promise(async (resolve, reject) => {
            if (signal && signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }

            const stay = stayMs || 1800;

            // Create popup element
            const el = document.createElement('div');
            el.className = 'sim-popup ' + (type || '');
            el.textContent = text;
            container.appendChild(el);

            // Fade in
            await wait(20, signal);
            el.classList.add('visible');
            await wait(350, signal);

            // Stay
            await wait(stay, signal);

            // Fade out
            el.classList.remove('visible');
            el.classList.add('exiting');
            await wait(350, signal);

            // Remove
            if (el.parentNode) el.parentNode.removeChild(el);
            resolve();
        });
    }

    // ──────────── Timeline Runner ────────────
    // Runs an array of steps sequentially. Each step = { delay, action }
    // action can return a promise (awaited) or be sync
    async function runTimeline(steps, signal) {
        for (const step of steps) {
            if (signal && signal.aborted) return;
            if (step.delay) await wait(step.delay, signal);
            if (step.action) {
                const result = step.action();
                if (result && typeof result.then === 'function') await result;
            }
        }
    }

    // ──────────── State ────────────
    function start() {
        _abortController = new AbortController();
        _isRunning = true;
        _isComplete = false;
        return _abortController.signal;
    }

    function complete() {
        _isRunning = false;
        _isComplete = true;
    }

    function abort() {
        if (_abortController) _abortController.abort();
        _isRunning = false;
    }

    function isRunning() { return _isRunning; }
    function isComplete() { return _isComplete; }

    function fullReset() {
        abort();
        _isComplete = false;
    }

    // ──────────── Screen Effects ────────────
    function shake(el, ms) {
        if (!el) return;
        el.classList.add('screen-shake');
        setTimeout(() => el.classList.remove('screen-shake'), ms || 400);
    }

    // ──────────── Button Helpers ────────────
    const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>';
    const ICON_REPLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    const ICON_CHECK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    function btnStart(btn) { if (btn) { btn.disabled = false; btn.innerHTML = ICON_PLAY + ' Start Simulation'; } }
    function btnReplay(btn) { if (btn) { btn.disabled = false; btn.innerHTML = ICON_REPLAY + ' Replay'; } }
    function btnRunning(btn) { if (btn) { btn.disabled = true; btn.innerHTML = ICON_CHECK + ' Running…'; } }

    // ──────────── Public API ────────────
    return {
        initPreloader,
        wait,
        popup,
        runTimeline,
        start,
        complete,
        abort,
        fullReset,
        isRunning,
        isComplete,
        shake,
        btnStart,
        btnReplay,
        btnRunning,
    };
})();

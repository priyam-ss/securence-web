/* ============================================
   SECURENCE — Floating Panels System v3
   Telemetry Panels (with collapse bar)
   + Status Box (drag only, no collapse)
   ============================================ */

(function () {
    'use strict';

    // ══════════════════════════════════════════════
    // PANEL SELECTORS
    // ══════════════════════════════════════════════

    var PANEL_SELECTORS = [
        { sel: '#sz-telemetry-left', id: 'sz-left', side: 'left', headerClass: 'sz-telem-header' },
        { sel: '#sz-telemetry-right', id: 'sz-right', side: 'right', headerClass: 'sz-telem-header' },
        { sel: '#sos-telemetry-left', id: 'sos-left', side: 'left', headerClass: 'sos-telem-header' },
        { sel: '#sos-telemetry-right', id: 'sos-right', side: 'right', headerClass: 'sos-telem-header' },
        { sel: '#pm-legend-panel', id: 'pm-legend', side: 'left', headerClass: 'pm-legend-header' },
        { sel: '#pm-stats-panel', id: 'pm-stats', side: 'right', headerClass: 'pm-stats-header' },
        { sel: '#ai-panel-left', id: 'ai-left', side: 'left', headerClass: 'ai-panel-header' },
        { sel: '#ai-panel-right', id: 'ai-right', side: 'right', headerClass: 'ai-panel-header' },
    ];

    var STORAGE_KEY = 'securence_fp_v3';
    var DRAG_THRESHOLD = 5;

    var panels = [];
    var savedPositions = {};

    // ══════════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════════

    function loadPositions() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) savedPositions = JSON.parse(data);
        } catch (e) { savedPositions = {}; }
    }

    function savePositions() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPositions)); }
        catch (e) { /* */ }
    }

    function savePanel(id, x, y, collapsed) {
        savedPositions[id] = { x: Math.round(x), y: Math.round(y), collapsed: collapsed };
        savePositions();
    }

    // ══════════════════════════════════════════════
    // COLLAPSE BAR
    // ══════════════════════════════════════════════

    function createCollapseBar(panelObj) {
        var bar = document.createElement('div');
        bar.className = 'fp-collapse-bar';

        var chevron = document.createElement('span');
        chevron.className = 'fp-bar-chevron';
        chevron.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>';

        var label = document.createElement('span');
        label.className = 'fp-bar-label';
        label.textContent = 'COLLAPSE';

        bar.appendChild(chevron);
        bar.appendChild(label);

        bar.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            toggleCollapse(panelObj);
        });
        bar.addEventListener('touchend', function (e) {
            if (!panelObj._didDrag) { e.preventDefault(); e.stopPropagation(); toggleCollapse(panelObj); }
        }, { passive: false });
        bar.addEventListener('mousedown', function (e) { e.stopPropagation(); });
        bar.addEventListener('touchstart', function (e) {
            e.stopPropagation(); panelObj._barTouched = true;
        }, { passive: true });

        return bar;
    }

    function toggleCollapse(panelObj) {
        var body = panelObj.body;
        var bar = panelObj.bar;
        var barLabel = bar.querySelector('.fp-bar-label');
        var isCollapsed = body.classList.contains('fp-collapsed');

        if (isCollapsed) {
            body.classList.remove('fp-collapsed');
            bar.classList.remove('fp-bar-collapsed');
            barLabel.textContent = 'COLLAPSE';
            panelObj.collapsed = false;
        } else {
            body.classList.add('fp-collapsed');
            bar.classList.add('fp-bar-collapsed');
            barLabel.textContent = 'EXPAND';
            panelObj.collapsed = true;
        }

        var rect = panelObj.el.getBoundingClientRect();
        savePanel(panelObj.id, rect.left, rect.top, panelObj.collapsed);
    }

    // ══════════════════════════════════════════════
    // UNIVERSAL DRAG SYSTEM
    // Works on any element — panels AND status box
    // ══════════════════════════════════════════════

    function initDrag(el, id, onDragEnd) {
        var isDragging = false;
        var startX, startY, startLeft, startTop;
        var _didDrag = false;

        function onStart(clientX, clientY) {
            _didDrag = false;
            var rect = el.getBoundingClientRect();
            startX = clientX;
            startY = clientY;
            startLeft = rect.left;
            startTop = rect.top;
        }

        function onMove(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;

            if (!isDragging) {
                if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                    isDragging = true;
                    _didDrag = true;
                    el.classList.add('fp-dragging');
                    el.style.left = startLeft + 'px';
                    el.style.top = startTop + 'px';
                    el.style.right = 'auto';
                    el.style.bottom = 'auto';
                    showResetButton();
                } else {
                    return;
                }
            }

            var newLeft = startLeft + dx;
            var newTop = startTop + dy;
            var maxX = window.innerWidth - el.offsetWidth;
            var maxY = window.innerHeight - el.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
        }

        function onEnd() {
            if (isDragging) {
                isDragging = false;
                el.classList.remove('fp-dragging');
                var rect = el.getBoundingClientRect();
                if (onDragEnd) onDragEnd(rect);
            }
        }

        // Mouse
        el.addEventListener('mousedown', function (e) {
            if (e.target.closest('.fp-collapse-bar')) return;
            e.preventDefault();
            onStart(e.clientX, e.clientY);
            function move(ev) { onMove(ev.clientX, ev.clientY); }
            function up() { onEnd(); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });

        // Touch
        el.addEventListener('touchstart', function (e) {
            if (e.target.closest('.fp-collapse-bar')) return;
            if (e.touches.length !== 1) return;
            var t = e.touches[0];
            onStart(t.clientX, t.clientY);
            function move(ev) {
                if (ev.touches.length !== 1) return;
                ev.preventDefault();
                onMove(ev.touches[0].clientX, ev.touches[0].clientY);
            }
            function end() { onEnd(); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end); document.removeEventListener('touchcancel', end); }
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', end);
            document.addEventListener('touchcancel', end);
        }, { passive: true });

        // Return flag accessor for collapse bar coordination
        return { getDragFlag: function () { return _didDrag; } };
    }

    // ══════════════════════════════════════════════
    // RESET BUTTON
    // ══════════════════════════════════════════════

    var resetBtn = null;

    function createResetButton() {
        resetBtn = document.createElement('button');
        resetBtn.className = 'fp-reset-pos';
        resetBtn.title = 'Reset panel positions';
        resetBtn.setAttribute('type', 'button');
        resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
        resetBtn.addEventListener('click', resetAll);
        resetBtn.addEventListener('touchend', function (e) { e.preventDefault(); resetAll(); });
        document.body.appendChild(resetBtn);
    }

    function showResetButton() {
        if (resetBtn) resetBtn.classList.add('visible');
    }

    function resetAll() {
        savedPositions = {};
        savePositions();

        // Reset telemetry panels
        panels.forEach(function (p) {
            p.el.style.left = '';
            p.el.style.top = '';
            p.el.style.right = '';
            p.el.style.bottom = '';
            if (p.side === 'left') { p.el.style.left = '12px'; p.el.style.right = 'auto'; }
            else { p.el.style.right = '12px'; p.el.style.left = 'auto'; }
            p.el.style.top = '12px';
            if (p.collapsed) {
                p.body.classList.remove('fp-collapsed');
                p.bar.classList.remove('fp-bar-collapsed');
                p.bar.querySelector('.fp-bar-label').textContent = 'COLLAPSE';
                p.collapsed = false;
            }
        });

        // Reset status box
        var statusBox = document.getElementById('fp-status-box');
        if (statusBox) {
            statusBox.style.left = '';
            statusBox.style.top = '';
            statusBox.style.right = '';
            statusBox.style.bottom = '';
        }

        if (resetBtn) resetBtn.classList.remove('visible');
    }

    // ══════════════════════════════════════════════
    // APPLY SAVED POSITION
    // ══════════════════════════════════════════════

    function applySaved(p) {
        var saved = savedPositions[p.id];
        if (!saved) return;
        var maxX = window.innerWidth - 50;
        var maxY = window.innerHeight - 50;
        if (saved.x >= 0 && saved.x < maxX && saved.y >= 0 && saved.y < maxY) {
            p.el.style.left = saved.x + 'px';
            p.el.style.top = saved.y + 'px';
            p.el.style.right = 'auto';
            p.el.style.bottom = 'auto';
            showResetButton();
        }
        if (saved.collapsed) {
            p.body.classList.add('fp-collapsed');
            p.bar.classList.add('fp-bar-collapsed');
            p.bar.querySelector('.fp-bar-label').textContent = 'EXPAND';
            p.collapsed = true;
        }
    }

    // ══════════════════════════════════════════════
    // INIT — STATUS BOX
    // ══════════════════════════════════════════════

    function initStatusBox() {
        var statusBox = document.getElementById('fp-status-box');
        if (!statusBox) return;

        // Apply saved position
        var saved = savedPositions['fp-status-box'];
        if (saved) {
            var maxX = window.innerWidth - 50;
            var maxY = window.innerHeight - 50;
            if (saved.x >= 0 && saved.x < maxX && saved.y >= 0 && saved.y < maxY) {
                statusBox.style.left = saved.x + 'px';
                statusBox.style.top = saved.y + 'px';
                statusBox.style.right = 'auto';
                showResetButton();
            }
        }

        // Setup drag — no collapse, just drag
        initDrag(statusBox, 'fp-status-box', function (rect) {
            savedPositions['fp-status-box'] = { x: Math.round(rect.left), y: Math.round(rect.top) };
            savePositions();
        });
    }

    // ══════════════════════════════════════════════
    // INIT — TELEMETRY PANELS
    // ══════════════════════════════════════════════

    function init() {
        loadPositions();

        // Telemetry panels
        PANEL_SELECTORS.forEach(function (config) {
            var el = document.querySelector(config.sel);
            if (!el) return;

            el.classList.add('fp-panel');

            var headerEl = el.querySelector('.' + config.headerClass);
            var body = document.createElement('div');
            body.className = 'fp-body';

            var children = Array.prototype.slice.call(el.children);
            var pastHeader = false;

            children.forEach(function (child) {
                if (child === headerEl) { pastHeader = true; return; }
                if (pastHeader) { body.appendChild(child); }
            });

            var panelObj = {
                el: el, id: config.id, side: config.side,
                collapsed: false, body: body, bar: null,
                _didDrag: false, _barTouched: false,
            };

            var bar = createCollapseBar(panelObj);
            panelObj.bar = bar;

            el.appendChild(body);
            el.appendChild(bar);

            var dragState = initDrag(el, config.id, function (rect) {
                savePanel(panelObj.id, rect.left, rect.top, panelObj.collapsed);
            });

            // Link drag flag to panelObj for collapse coordination
            var origMousedown = el.onmousedown;
            Object.defineProperty(panelObj, '_didDrag', {
                get: function () { return dragState.getDragFlag(); }
            });

            applySaved(panelObj);
            panels.push(panelObj);
        });

        // Status box (no collapse)
        initStatusBox();

        // Reset button
        if (panels.length > 0 || document.getElementById('fp-status-box')) {
            createResetButton();
            var hasSaved = Object.keys(savedPositions).length > 0;
            if (hasSaved) showResetButton();
        }

        // Resize guard
        window.addEventListener('resize', function () {
            var maxX = window.innerWidth - 30;
            var maxY = window.innerHeight - 30;
            panels.forEach(function (p) {
                var rect = p.el.getBoundingClientRect();
                if (rect.left > maxX) p.el.style.left = (maxX - 50) + 'px';
                if (rect.top > maxY) p.el.style.top = (maxY - 50) + 'px';
            });
            var statusBox = document.getElementById('fp-status-box');
            if (statusBox) {
                var r = statusBox.getBoundingClientRect();
                if (r.left > maxX) statusBox.style.left = (maxX - 50) + 'px';
                if (r.top > maxY) statusBox.style.top = (maxY - 50) + 'px';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 150); });
    } else {
        setTimeout(init, 150);
    }

})();

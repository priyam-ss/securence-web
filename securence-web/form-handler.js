/* ============================================
   SECURENCE — Form Submission Handler
   Connects HTML forms to Cloudflare Pages Functions
   ============================================ */

(function () {
    'use strict';

    // ──────────── TOAST NOTIFICATION SYSTEM ────────────
    function showToast(message, type = 'success') {
        // Remove existing toast
        const existing = document.querySelector('.securence-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `securence-toast securence-toast-${type}`;
        toast.innerHTML = `
            <div class="securence-toast-icon">
                ${type === 'success'
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
            }
            </div>
            <span>${message}</span>
        `;

        // Inject styles if not already present
        if (!document.getElementById('securence-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'securence-toast-styles';
            style.textContent = `
                .securence-toast {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%) translateY(20px);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 24px;
                    border-radius: 12px;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.88rem;
                    font-weight: 500;
                    color: #f0f0f0;
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    z-index: 99999;
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    max-width: 90vw;
                    box-sizing: border-box;
                }
                .securence-toast.show {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                .securence-toast-success {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.1);
                }
                .securence-toast-error {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.1);
                }
                .securence-toast-icon {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }
                .securence-toast-success .securence-toast-icon { color: #10b981; }
                .securence-toast-error .securence-toast-icon { color: #ef4444; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }

    // ──────────── FORM SUBMISSION ────────────

    // Double-submit prevention flag
    let isSubmitting = false;

    // Email format validator
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function collectFormData(form) {
        const data = {};
        const elements = form.querySelectorAll('input[name], textarea[name], select[name]');

        elements.forEach(el => {
            const value = el.value;
            if (value && value.trim()) {
                data[el.name] = value.trim();
            }
        });

        return data;
    }

    function setFormLoading(form, loading) {
        const btn = form.querySelector('button[type="submit"], button.btn-primary');
        if (!btn) return;

        if (loading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
            const span = btn.querySelector('span');
            if (span) span.textContent = 'Sending...';
        } else {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
            }
        }
    }

    async function submitForm(form, endpoint, successMsg) {
        // Double-submit prevention
        if (isSubmitting) return;

        const data = collectFormData(form);

        // Client-side validation — check for empty form
        if (Object.keys(data).length === 0) {
            showToast('Please fill in at least one field.', 'error');
            return;
        }

        // Client-side email format validation
        if (data.email && !isValidEmail(data.email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        isSubmitting = true;
        setFormLoading(form, true);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: Please make sure you are testing on Cloudflare Pages, not a local Live Server.`);
            }

            const result = await response.json();

            if (result.success) {
                showToast(successMsg, 'success');
                form.reset();
            } else {
                showToast(result.error || 'Something went wrong.', 'error');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            showToast(err.message || 'Network error. Please try again.', 'error');
        } finally {
            isSubmitting = false;
            setFormLoading(form, false);
        }
    }

    // ──────────── BIND FORMS ────────────
    document.addEventListener('DOMContentLoaded', () => {

        // Support form (support.html)
        const supportForm = document.getElementById('support-form');
        if (supportForm) {
            supportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                submitForm(supportForm, '/api/support', 'Message sent successfully! Thank you.');
            });
        }

        // Mission form (mission.html)
        const missionForm = document.getElementById('mission-form');
        if (missionForm) {
            missionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                submitForm(missionForm, '/api/mission', 'Welcome to the mission! 🚀');
            });
        }

        // Team form (team-join.html)
        const teamForm = document.getElementById('team-form');
        if (teamForm) {
            teamForm.addEventListener('submit', (e) => {
                e.preventDefault();
                submitForm(teamForm, '/api/team', 'Application submitted! We\'ll be in touch. 🔥');
            });
        }
    });
})();

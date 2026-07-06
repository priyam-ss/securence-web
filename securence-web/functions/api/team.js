/* ============================================
   SECURENCE — Team Application API Endpoint
   Cloudflare Pages Function
   ============================================ */

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// ── In-memory rate limiter (per-isolate, resets on cold start) ──
const rateMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;         // max 5 requests per IP per minute

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        rateMap.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return true;
    return false;
}

// ── Input sanitizer — strip HTML/script tags ──
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

// ── Email format validation ──
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // Rate limiting
        const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
        if (isRateLimited(clientIP)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Too many requests. Please try again later.'
            }), { status: 429, headers });
        }

        if (!env || !env.EMAIL_API_KEY || !env.EMAIL_2) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Server configuration error'
            }), { status: 500, headers });
        }

        let data;
        try {
            data = await request.json();
        } catch {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid request data'
            }), { status: 400, headers });
        }

        const name = sanitize(data.name || '');
        const email = sanitize(data.email || '');
        const role = sanitize(data.role || '');
        const skills = sanitize(data.skills || '');
        const experience = sanitize(data.experience || '');
        const message = sanitize(data.message || '');

        if (!name) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Name is required'
            }), { status: 400, headers });
        }

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email is required'
            }), { status: 400, headers });
        }

        if (!isValidEmail(email)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Please provide a valid email address'
            }), { status: 400, headers });
        }

        const roleLabels = {
            'software': 'Software Developer',
            'hardware': 'Hardware Engineer',
            'content': 'Content Creator',
            'design': 'UI/UX Designer',
            'business': 'Business & Strategy',
        };

        const roleDisplay = roleLabels[role] || role || '';

        const fields = [
            { label: 'Name', value: name },
            { label: 'Email', value: email },
            { label: 'Role', value: roleDisplay },
            { label: 'Skills', value: skills },
            { label: 'Experience', value: experience },
        ];

        const lines = [
            '━━━━━━━━━━━━━━━━━━━━━━',
            '🚀 SECURENCE NOTIFICATION',
            '━━━━━━━━━━━━━━━━━━━━━━',
            '',
            'Type: Team Application',
            '',
        ];

        fields.forEach(({ label, value }) => {
            if (value) {
                lines.push(`${label}: ${value}`);
            }
        });

        if (message) {
            lines.push('');
            lines.push('Why They Want to Join:');
            lines.push(message);
        }

        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('Sent from SECURENCE Website');
        lines.push(`IP: ${clientIP}`);
        lines.push('━━━━━━━━━━━━━━━━━━━━━━');

        const emailBody = lines.join('\n');

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'SECURENCE <onboarding@resend.dev>',
                to: [env.EMAIL_2],
                subject: '🔥 New Team Application — SECURENCE',
                text: emailBody,
            }),
        });

        const responseData = await emailResponse.json();

        if (!emailResponse.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: responseData.message || 'Failed to send email'
            }), { status: 500, headers });
        }

        return new Response(JSON.stringify({
            success: true
        }), { status: 200, headers });

    } catch {
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error'
        }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers });
}

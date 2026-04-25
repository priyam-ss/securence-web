const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        if (!env || !env.EMAIL_API_KEY || !env.EMAIL_1) {
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

        const message = (data.message || '').trim();

        if (!message) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Message is required'
            }), { status: 400, headers });
        }

        const emailBody = [
            '━━━━━━━━━━━━━━━━━━━━━━',
            '🚀 SECURENCE NOTIFICATION',
            '━━━━━━━━━━━━━━━━━━━━━━',
            '',
            'Type: Support',
            '',
            'Message:',
            message,
            '',
            '━━━━━━━━━━━━━━━━━━━━━━',
            'Sent from SECURENCE Website',
            '━━━━━━━━━━━━━━━━━━━━━━',
        ].join('\n');

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'SECURENCE <onboarding@resend.dev>',
                to: [env.EMAIL_1],
                subject: '🚀 New Support Message — SECURENCE',
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

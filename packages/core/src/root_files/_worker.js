export default {
    async fetch(request, env) {
        const response = await env.ASSETS.fetch(request);
        const headers = new Headers(response.headers);

        // The Star Traders dashboard embeds this DTrader workspace in an iframe.
        // Remove any anti-embedding headers that would make Chrome block the frame.
        headers.delete('X-Frame-Options');
        headers.delete('Content-Security-Policy');
        headers.delete('Content-Security-Policy-Report-Only');
        headers.delete('Cross-Origin-Embedder-Policy');
        headers.delete('Cross-Origin-Opener-Policy');
        headers.delete('Cross-Origin-Resource-Policy');

        // Explicitly permit the workspace to be embedded by Star Traders.
        headers.set(
            'Content-Security-Policy',
            "frame-ancestors 'self' https://startraders-xn1z.onrender.com https://startraders.com https://*.pages.dev;"
        );

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    },
};

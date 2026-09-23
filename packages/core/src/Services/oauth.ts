import { getAuthBaseUrl, getOAuthAppId, getOAuthClientId, getOAuthRedirectUri } from '@deriv/shared';

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const PKCE_VERIFIER_KEY = 'oauth_code_verifier';
const PKCE_EXPIRY_KEY = 'oauth_code_verifier_timestamp';
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const storePKCEVerifier = (verifier: string): void => {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(PKCE_EXPIRY_KEY, String(Date.now()));
};

export const getPKCEVerifier = (): string | null => {
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    const timestamp = Number(sessionStorage.getItem(PKCE_EXPIRY_KEY) ?? 0);
    if (!verifier || Date.now() - timestamp > PKCE_TTL_MS) {
        sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        sessionStorage.removeItem(PKCE_EXPIRY_KEY);
        return null;
    }
    return verifier;
};

export const clearPKCEVerifier = (): void => {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_EXPIRY_KEY);
};

// ---------------------------------------------------------------------------
// OAuth URL generation
// ---------------------------------------------------------------------------

export const generateOAuthURL = async (): Promise<string> => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    storePKCEVerifier(verifier);

    const csrf_token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    sessionStorage.setItem('oauth_csrf_token', csrf_token);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: getOAuthClientId(),
        redirect_uri: getOAuthRedirectUri(),
        scope: 'trade',
        state: csrf_token,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    });
    const oauth_app_id = getOAuthAppId();
    if (oauth_app_id) params.set('app_id', oauth_app_id);

    return `${getAuthBaseUrl()}/oauth2/auth?${params}`;
};

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

export const exchangeCodeForToken = async (
    code: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> => {
    const verifier = getPKCEVerifier();
    if (!verifier) throw new Error('PKCE code verifier not found or expired — restart login flow');

    const response = await fetch(`${getAuthBaseUrl()}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: getOAuthRedirectUri(),
            client_id: getOAuthClientId(),
            code_verifier: verifier,
        }),
    });

    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);

    const data = await response.json();
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[OAuth] Token exchange response:', {
            scope: data.scope,
            token_type: data.token_type,
            expires_in: data.expires_in,
        });
    }
    if (!data.access_token)
        throw new Error(`Token exchange succeeded but no access_token in response: ${JSON.stringify(data)}`);
    clearPKCEVerifier();
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
};

// ---------------------------------------------------------------------------
// Token storage
// Access and refresh tokens go in sessionStorage — cleared on tab close.
// active_loginid stays in localStorage for multi-tab account awareness.
// ---------------------------------------------------------------------------

const AUTH_INFO_KEY = 'auth_info';

export const storeTokens = (access_token: string, refresh_token?: string, expires_in?: number): void => {
    sessionStorage.setItem(
        AUTH_INFO_KEY,
        JSON.stringify({
            access_token,
            refresh_token,
            expires_at: expires_in ? Date.now() + expires_in * 1000 : null,
        })
    );
};

export const getStoredToken = (): string | null => {
    try {
        const info = JSON.parse(sessionStorage.getItem(AUTH_INFO_KEY) ?? 'null');
        if (!info) return null;
        if (info.expires_at && Date.now() >= info.expires_at) {
            clearTokens();
            return null;
        }
        return info.access_token ?? null;
    } catch {
        return null;
    }
};

export const clearTokens = (): void => {
    sessionStorage.removeItem(AUTH_INFO_KEY);
};

// ---------------------------------------------------------------------------
// StarTraders SSO handoff
// ---------------------------------------------------------------------------

const STARTRADERS_HANDOFF_URL = '/api/auth/handoff';

export const consumeStarTradersSSO = async (): Promise<boolean> => {
    const url = new URL(window.location.href);
    let handoff_code = url.searchParams.get('st_sso');

    try {
        // The Manual Trader is now served directly by the StarTraders Render app.
        // When the parent StarTraders session already exists, obtain a short-lived
        // one-time handoff code from the same origin and consume it immediately.
        if (!handoff_code) {
            const issue = await fetch(STARTRADERS_HANDOFF_URL, {
                method: 'POST',
                cache: 'no-store',
                credentials: 'same-origin',
            });

            if (!issue.ok) return false;

            const issued = await issue.json();
            handoff_code = issued?.code ?? null;
        }

        if (!handoff_code) return false;

        const response = await fetch(
            `${STARTRADERS_HANDOFF_URL}?code=${encodeURIComponent(handoff_code)}`,
            {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin',
            }
        );

        if (!response.ok) {
            throw new Error(`StarTraders SSO handoff failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.access_token) {
            throw new Error('StarTraders SSO handoff returned no access token.');
        }

        const expires_in = data.expires_at
            ? Math.max(60, Math.floor((Number(data.expires_at) - Date.now()) / 1000))
            : undefined;

        storeTokens(data.access_token, data.refresh_token, expires_in);

        url.searchParams.delete('st_sso');
        window.history.replaceState({}, document.title, url.toString());

        return true;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[StarTraders SSO] Failed:', error);

        url.searchParams.delete('st_sso');
        window.history.replaceState({}, document.title, url.toString());

        return false;
    }
};

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

export const refreshAccessToken = async (): Promise<string> => {
    const info = JSON.parse(sessionStorage.getItem(AUTH_INFO_KEY) ?? 'null');
    if (!info?.refresh_token) throw new Error('No refresh token stored');

    const response = await fetch(`${getAuthBaseUrl()}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: info.refresh_token,
            client_id: getOAuthClientId(),
        }),
    });

    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);
    const data = await response.json();
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data.access_token;
};

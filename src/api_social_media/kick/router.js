export const KICK_CONFIG = {
    CLIENT_ID: '01KH3T8WNDZ269403HKC17JN7X',
    CLIENT_SECRET: 'f03323199a30a58e4dc5809aaee22a360d125d77e249d45b709e1246d64158d8',
    AUTH_URL: 'https://id.kick.com/oauth/authorize',
    TOKEN_URL: 'https://id.kick.com/oauth/token',
    // Added channel:write for channel updates
    SCOPES: 'user:read channel:read channel:write' 
};

// PKCE Helpers
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function handleKickRequest(request, url) {
    // 1. Kick Login Redirect
    if (url.pathname === "/api/kick/login") {
        try {
            const { visitor_id } = Object.fromEntries(url.searchParams);
            // Use state to pass visitor_id securely
            const state = visitor_id ? JSON.stringify({ visitor_id }) : '{}';
            
            // Dynamic Redirect URI based on current host (Force HTTPS)
            const origin = url.origin.replace('http:', 'https:');
            const redirectUri = `${origin}/api/kick/callback`;
            
            // PKCE Generation
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            
            // Workaround for NextJS 127.0.0.1 bug: Add sacrificial param BEFORE redirect_uri if needed
            const params = new URLSearchParams();
            params.append('response_type', 'code');
            params.append('client_id', KICK_CONFIG.CLIENT_ID);
            
            if (redirectUri.includes('127.0.0.1')) {
                params.append('redirect', '127.0.0.1');
            }
            
            params.append('redirect_uri', redirectUri);
            params.append('scope', KICK_CONFIG.SCOPES);
            params.append('state', encodeURIComponent(state));
            
            // PKCE Params
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');

            // Set Cookie for Code Verifier
            const headers = new Headers();
            headers.append('Location', `${KICK_CONFIG.AUTH_URL}?${params.toString()}`);
            headers.append('Set-Cookie', `kick_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

            return new Response(null, { status: 302, headers });
        } catch (err) {
            return new Response(`Kick Login Error: ${err.message}`, { status: 500 });
        }
    }

    // 2. Kick Callback
    if (url.pathname === "/api/kick/callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
            return new Response(`Kick OAuth Error: ${error}`, { status: 400 });
        }

        if (!code) {
            return new Response("Missing code parameter", { status: 400 });
        }

        try {
            // Retrieve Code Verifier from Cookie
            const cookieHeader = request.headers.get('Cookie');
            let codeVerifier = null;
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').map(c => c.trim());
                const verifierCookie = cookies.find(c => c.startsWith('kick_code_verifier='));
                if (verifierCookie) {
                    codeVerifier = verifierCookie.split('=')[1];
                }
            }

            if (!codeVerifier) {
                return new Response("Missing PKCE code_verifier cookie. Please try logging in again.", { status: 400 });
            }

            // 2. Dynamic Redirect URI (Match Login)
            const origin = url.origin.replace('http:', 'https:');
            const redirectUri = `${origin}/api/kick/callback`;
            
            // 3. Exchange code for token
            const tokenResponse = await fetch(KICK_CONFIG.TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: KICK_CONFIG.CLIENT_ID,
                    client_secret: KICK_CONFIG.CLIENT_SECRET,
                    redirect_uri: redirectUri,
                    code: code,
                    code_verifier: codeVerifier // PKCE Required
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                return new Response(`Token Exchange Failed: ${JSON.stringify(tokenData)}`, { status: tokenResponse.status });
            }

            // 4. Fetch User Information (GET /public/v1/users)
            let userInfo = null;
            try {
                const userResponse = await fetch('https://api.kick.com/public/v1/users', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Accept': 'application/json'
                    }
                });
                if (userResponse.ok) {
                    userInfo = await userResponse.json();
                } else {
                     console.log('User fetch failed:', userResponse.status);
                }
            } catch (e) {
                console.log('User fetch error:', e);
            }

            // 5. Fetch Channel Information (GET /public/v1/channels)
            // As per docs: Provide no parameters (returns information for the currently authenticated user)
            const channelResponse = await fetch('https://api.kick.com/public/v1/channels', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json'
                }
            });

            const channelData = await channelResponse.json();

            // Success! Return Token + User + Channel Info
            const successHeaders = new Headers();
            successHeaders.append("Content-Type", "application/json");
            // Clear the cookie
            successHeaders.append("Set-Cookie", "kick_code_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

            return new Response(JSON.stringify({
                message: "Kick Authentication Successful",
                token_data: tokenData,
                user_info: userInfo,
                channel_info: channelData, 
                state_received: state
            }, null, 2), {
                status: 200,
                headers: successHeaders
            });

        } catch (err) {
            return new Response(`Kick Auth Error: ${err.message}`, { status: 500 });
        }
    }
    
    // 3. Kick Webhook
    if (url.pathname === "/api/kick/webhook" || url.pathname === "/api/kick/webhook/") {
        if (request.method === "POST") {
            try {
                const body = await request.text();
                // In a real implementation, you MUST verify the signature header here
                // const signature = request.headers.get("X-Kick-Signature");
                
                console.log("Received Kick Webhook:", body);
                
                // Return 200 OK to acknowledge receipt
                return new Response("Webhook Received", { status: 200 });
            } catch (err) {
                return new Response(`Webhook Error: ${err.message}`, { status: 500 });
            }
        }
        return new Response("Method Not Allowed", { status: 405 });
    }

    // 4. Update Channel Metadata (PATCH Proxy)
    if (url.pathname === "/api/kick/update-channel" && request.method === "POST") {
        try {
            const body = await request.json();
            const { access_token, category_id, custom_tags, stream_title } = body;

            if (!access_token) {
                return new Response(JSON.stringify({ error: "Missing access_token" }), { 
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const updatePayload = {};
            if (category_id) updatePayload.category_id = parseInt(category_id);
            if (custom_tags) updatePayload.custom_tags = Array.isArray(custom_tags) ? custom_tags : [custom_tags];
            if (stream_title) updatePayload.stream_title = stream_title;

            const response = await fetch('https://api.kick.com/public/v1/channels', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            if (response.status === 204) {
                return new Response(JSON.stringify({ message: "Channel updated successfully" }), { 
                    status: 200, // Returning 200 to frontend even if upstream is 204
                    headers: { "Content-Type": "application/json" }
                });
            }
            
            const errorText = await response.text();
            return new Response(JSON.stringify({ 
                error: "Update failed", 
                upstream_status: response.status, 
                details: errorText 
            }), { 
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: `Server Error: ${err.message}` }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    return null; // Not handled
}


export const KICK_CONFIG = {
    CLIENT_ID: '01KH3T8WNDZ269403HKC17JN7X',
    CLIENT_SECRET: 'f03323199a30a58e4dc5809aaee22a360d125d77e249d45b709e1246d64158d8',
    AUTH_URL: 'https://id.kick.com/oauth/authorize',
    TOKEN_URL: 'https://id.kick.com/oauth/token',
    // Added channel:write for channel updates
    SCOPES: 'user:read channel:read channel:write' 
};

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
            
            const params = new URLSearchParams({
                client_id: KICK_CONFIG.CLIENT_ID,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: KICK_CONFIG.SCOPES,
                state: encodeURIComponent(state)
            });

            return Response.redirect(`${KICK_CONFIG.AUTH_URL}?${params.toString()}`, 302);
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
                    code: code
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                return new Response(`Token Exchange Failed: ${JSON.stringify(tokenData)}`, { status: tokenResponse.status });
            }

            // 4. Fetch Channel Information (GET /public/v1/channels)
            // As per docs: Provide no parameters (returns information for the currently authenticated user)
            const channelResponse = await fetch('https://api.kick.com/public/v1/channels', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json'
                }
            });

            const channelData = await channelResponse.json();

            if (!channelResponse.ok) {
                return new Response(`Channel Fetch Failed: ${JSON.stringify(channelData)}`, { status: channelResponse.status });
            }

            // Success! Return Token + Channel Info
            return new Response(JSON.stringify({
                message: "Kick Authentication & Channel Fetch Successful",
                token_data: tokenData,
                channel_info: channelData, 
                state_received: state
            }, null, 2), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            return new Response(`Server Error: ${err.message}`, { status: 500 });
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

    return null; // Not handled
}

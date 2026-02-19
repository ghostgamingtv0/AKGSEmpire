// TikTok Router Logic
export const TIKTOK_CONFIG = {
    SANDBOX: {
        CLIENT_KEY: 'sbaw8q48mtdwkfigi3',
        CLIENT_SECRET: '7Z3CfRk2qI8nfoEqpczC96gZbvFaiOal'
    },
    PROD: {
        CLIENT_KEY: 'awyk8qjpedujjzz6',
        CLIENT_SECRET: 'FIPDCqZ7ahWnfm63Ve1oYUVkJfNTbKq9'
    }
};

export async function handleTikTokRequest(request, url) {
    // 1. TikTok Login Redirect
    if (
        url.pathname === "/api/tiktok/login" ||
        url.pathname === "/empire/api/tiktok/login"
    ) {
        const csrfState = Math.random().toString(36).substring(7);
        const origin = url.origin.replace('http:', 'https:');
        const redirectUri = `${origin}/empire/api/tiktok/callback`;
        const isDev = url.hostname.includes('localhost') || url.hostname.endsWith('pages.dev');
        const keys = isDev ? TIKTOK_CONFIG.SANDBOX : TIKTOK_CONFIG.PROD;
        
        let targetUrl = 'https://www.tiktok.com/v2/auth/authorize/';
        targetUrl += `?client_key=${keys.CLIENT_KEY}`;
        targetUrl += `&scope=user.info.basic`;
        targetUrl += `&response_type=code`;
        targetUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
        targetUrl += `&state=${csrfState}`;
        
        return Response.redirect(targetUrl, 302);
    }

    // 2. TikTok Callback (OAuth & Verification)
    if (
        url.pathname === "/api/tiktok/callback" ||
        url.pathname === "/tiktok_callback" ||
        url.pathname === "/empire/api/tiktok/callback"
    ) {
        // Handle OPTIONS (CORS)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }
        
        // Handle POST (Webhook/Verification)
        if (request.method === "POST") {
             return new Response(JSON.stringify({ status: "success", message: "TikTok Callback Received" }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Handle GET (OAuth Code or Verification Challenge)
        if (request.method === "GET") {
            const code = url.searchParams.get("code");
            const challenge = url.searchParams.get("challenge");
            
            // Verification Challenge
            if (challenge) {
                return new Response(challenge, {
                    status: 200,
                    headers: { "Content-Type": "text/plain" }
                });
            }
            
            // OAuth Code Exchange (must use the SAME redirect_uri as login)
            if (code) {
                try {
                    const origin = url.origin.replace('http:', 'https:');
                    const redirectUri = `${origin}/empire/api/tiktok/callback`;
                    const isDev = url.hostname.includes('localhost') || url.hostname.endsWith('pages.dev');
                    const keys = isDev ? TIKTOK_CONFIG.SANDBOX : TIKTOK_CONFIG.PROD;
                    const params = new URLSearchParams();
                    params.append('client_key', keys.CLIENT_KEY);
                    params.append('client_secret', keys.CLIENT_SECRET);
                    params.append('code', code);
                    params.append('grant_type', 'authorization_code');
                    params.append('redirect_uri', redirectUri);

                    const tokenRes = await fetch('https://open.tiktok/apis.com/v2/oauth/token/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params
                    });

                    const tokenData = await tokenRes.json();
                    
                    // TikTok v2 error struct: { code, message, log_id }
                    if (!tokenRes.ok || tokenData.error || tokenData.code) {
                        const errorPayload = {
                            stage: 'token_exchange',
                            status: tokenRes.status,
                            error: tokenData.error || tokenData.code || 'unknown_error',
                            message: tokenData.message || tokenData.description || 'TikTok token exchange failed',
                            log_id: tokenData.log_id || null
                        };
                        return new Response(JSON.stringify(errorPayload, null, 2), {
                            status: tokenRes.status || 400,
                            headers: { "Content-Type": "application/json" }
                        });
                    }
                    
                    const accessToken = tokenData.access_token;
                    
                    // Fetch User Info
                    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    
                    const userData = await userRes.json();
                    
                    if (!userRes.ok || userData.code) {
                        const errorPayload = {
                            stage: 'user_info',
                            status: userRes.status,
                            error: userData.code || 'user_info_error',
                            message: userData.message || 'Failed to fetch TikTok user info',
                            log_id: userData.log_id || null
                        };
                        return new Response(JSON.stringify(errorPayload, null, 2), {
                            status: userRes.status || 400,
                            headers: { "Content-Type": "application/json" }
                        });
                    }

                    const tikTokName = userData.data?.user?.display_name || 'TikTok User';

                    // Return Success HTML
                    const html = `
                        <!DOCTYPE html>
                        <html>
                        <body>
                            <h1>✅ TikTok Connected!</h1>
                            <p>Hello ${tikTokName}</p>
                            <script>
                                if(window.opener) {
                                    window.opener.postMessage({ type: 'TIKTOK_CONNECTED', username: '${tikTokName}' }, '*');
                                    window.close();
                                } else {
                                    window.location.href = '/empire/earn/';
                                }
                            </script>
                        </body>
                        </html>
                    `;
                    
                    return new Response(html, {
                        headers: { "Content-Type": "text/html" }
                    });

                } catch (e) {
                    const tikTokName = 'TikTok User';
                    const html = `
                        <!DOCTYPE html>
                        <html>
                        <body>
                            <h1>✅ TikTok Connected!</h1>
                            <p>Hello ${tikTokName}</p>
                            <script>
                                if(window.opener) {
                                    window.opener.postMessage({ type: 'TIKTOK_CONNECTED', username: '${tikTokName}' }, '*');
                                    window.close();
                                } else {
                                    window.location.href = '/empire/earn/';
                                }
                            </script>
                        </body>
                        </html>
                    `;
                    
                    return new Response(html, {
                        headers: { "Content-Type": "text/html" }
                    });
                }
            }
            
            // Fallback for direct access without code
            return new Response("No code provided", { status: 400 });
        }
    }
    
    return null; // Not handled
}

// TikTok Router Logic
export const TIKTOK_CONFIG = {
    CLIENT_KEY: 'sbaw5d5260t82p1ppy',
    CLIENT_SECRET: 'ErnjN9rguPdQByYZCWJpATljQUGogwh5'
};

export async function handleTikTokRequest(request, url) {
    // 1. TikTok Login Redirect
    if (url.pathname === "/api/tiktok/login") {
        const csrfState = Math.random().toString(36).substring(7);
        const redirectUri = `${url.origin}/api/tiktok/callback`;
        
        let targetUrl = 'https://www.tiktok.com/v2/auth/authorize/';
        targetUrl += `?client_key=${TIKTOK_CONFIG.CLIENT_KEY}`;
        targetUrl += `&scope=user.info.basic`;
        targetUrl += `&response_type=code`;
        targetUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
        targetUrl += `&state=${csrfState}`;
        
        return Response.redirect(targetUrl, 302);
    }

    // 2. TikTok Callback (OAuth & Verification)
    if (url.pathname === "/api/tiktok/callback" || url.pathname === "/tiktok_callback") {
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
            
            // OAuth Code Exchange
            if (code) {
                try {
                    const redirectUri = `${url.origin}/api/tiktok/callback`;
                    const params = new URLSearchParams();
                    params.append('client_key', TIKTOK_CONFIG.CLIENT_KEY);
                    params.append('client_secret', TIKTOK_CONFIG.CLIENT_SECRET);
                    params.append('code', code);
                    params.append('grant_type', 'authorization_code');
                    params.append('redirect_uri', redirectUri);

                    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params
                    });

                    const tokenData = await tokenRes.json();
                    
                    if (tokenData.error) {
                        return new Response(`Error: ${JSON.stringify(tokenData)}`, { status: 400 });
                    }
                    
                    const accessToken = tokenData.access_token;
                    
                    // Fetch User Info
                    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    
                    const userData = await userRes.json();
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
                                    window.location.href = '/earn';
                                }
                            </script>
                        </body>
                        </html>
                    `;
                    
                    return new Response(html, {
                        headers: { "Content-Type": "text/html" }
                    });

                } catch (e) {
                    return new Response(`Server Error: ${e.message}`, { status: 500 });
                }
            }
            
            // Fallback for direct access without code
            return new Response("No code provided", { status: 400 });
        }
    }
    
    return null; // Not handled
}

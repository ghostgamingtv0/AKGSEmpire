export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // =================================================================================
    // 1. TIKTOK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const TIKTOK_CLIENT_KEY = 'awcqzuswlwpus7hs';
    const TIKTOK_CLIENT_SECRET = 'Zqw7gHHHj0UZfr27qyJ1S4CY8eXExoiv';

    // =================================================================================
    // 2. INSTAGRAM CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const INSTAGRAM_CLIENT_ID = '780330031777441';
    const INSTAGRAM_CLIENT_SECRET = '24f2dc9cd5903a234c9ae31eb6672794';
    const INSTAGRAM_ACCESS_TOKEN = 'IGAALFtL5aBqFBZAFpWQVV3aWVqR2tHNTUtUGVHWW5OWGVzUldsYnltdmNBeXl1OFVDV2dUaHZAlVDFjVnZATa3ZArM3ZAlZAktMbjhCTXlRdHNCTUJ6Q0pCOEdXYjRMLWF3ZAXpXS0Y3V1RaS0dQZAnBTS0hEOWIwOGFNcDAxdFc5SHhOMAZDZD';

    // =================================================================================
    // 3. FACEBOOK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    // Note: If you have a specific Facebook App ID different from Instagram, update it here.
    // Currently using the same ID as Instagram as they are often linked in Meta Business Suite.
    const FACEBOOK_CLIENT_ID = '780330031777441'; 
    const FACEBOOK_CLIENT_SECRET = '24f2dc9cd5903a234c9ae31eb6672794';

    // =================================================================================
    // 4. KICK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const KICK_CLIENT_ID = '01KH3T8WNDZ269403HKC17JN7X';
    const KICK_CLIENT_SECRET = 'f32b79e79e8d4cf696cfc4a265a780f7c4559592e20474e9c2d34973ccbf969f';

    // =================================================================================
    // STATIC VERIFICATION FILES (Bypass SPA Routing)
    // =================================================================================
    if (url.pathname === "/czuudtyh60e6l29pldx1s2htix8oxz") {
        return new Response("czuudtyh60e6l29pldx1s2htix8oxz", {
            headers: { "Content-Type": "text/plain" }
        });
    }
    if (url.pathname === "/czuudtyh60e6l29pldx1s2htix8oxz.html") {
        return new Response("czuudtyh60e6l29pldx1s2htix8oxz", {
            headers: { "Content-Type": "text/html" }
        });
    }
    if (url.pathname === "/tiktokB2349wnKUX0GZx3d5AiH74FwPtj2x28d.txt") {
        return new Response("tiktok-developers-site-verification=B2349wnKUX0GZx3d5AiH74FwPtj2x28d", {
            headers: { "Content-Type": "text/plain" }
        });
    }

    // =================================================================================
    // TIKTOK LOGIC (Completely Separated)
    // =================================================================================
    
    // 1. TikTok Login Redirect
    if (url.pathname === "/api/tiktok/login") {
        const csrfState = Math.random().toString(36).substring(7);
        const redirectUri = `${url.origin}/api/tiktok/callback`;
        
        let targetUrl = 'https://www.tiktok.com/v2/auth/authorize/';
        targetUrl += `?client_key=${TIKTOK_CLIENT_KEY}`;
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
                    params.append('client_key', TIKTOK_CLIENT_KEY);
                    params.append('client_secret', TIKTOK_CLIENT_SECRET);
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

    // =================================================================================
    // INSTAGRAM LOGIC (Completely Separated)
    // =================================================================================

    // 1. Instagram Login Redirect
    if (url.pathname === "/api/instagram/login") {
        const redirectUri = `${url.origin}/api/instagram/callback/`; // Note: Trailing slash matches common setups
        const scope = 'user_profile,user_media';
        const state = Math.random().toString(36).substring(7);
        
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
        
        return Response.redirect(authUrl, 302);
    }

    // 2. Instagram Callback
    if (url.pathname === "/api/instagram/callback/" || url.pathname === "/api/instagram/callback") {
        const code = url.searchParams.get("code");
        if (code) {
             // Simulate Success for now
             const username = "Instagram User"; 
             const html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h1>✅ Instagram Connected!</h1>
                    <script>
                        if(window.opener) {
                            window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', username: '${username}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/earn';
                        }
                    </script>
                </body>
                </html>
            `;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }
    }

    // 3. Instagram Webhook (Data Deletion / Updates)
    if (url.pathname === "/api/instagram/webhook" || url.pathname === "/api/instagram/webhook/") {
        // GET: Verification
        if (request.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");
            
            if (mode === "subscribe" && token === "akgs_empire_verify_2025") {
                return new Response(challenge, { 
                    status: 200,
                    headers: { "Content-Type": "text/plain" }
                });
            }
            return new Response("Forbidden", { status: 403 });
        }
        
        // POST: Event Notification
        if (request.method === "POST") {
            return new Response("EVENT_RECEIVED", { status: 200 });
        }
    }

    // =================================================================================
    // FACEBOOK LOGIC (Completely Separated)
    // =================================================================================
    
    // 1. Facebook Login Redirect
    if (url.pathname === "/api/facebook/login") {
        const redirectUri = `${url.origin}/api/facebook/callback`;
        const state = Math.random().toString(36).substring(7);
        // Using FACEBOOK_CLIENT_ID explicitly
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}`;
        return Response.redirect(authUrl, 302);
    }

    // 2. Facebook Callback
    if (url.pathname === "/api/facebook/callback") {
         const code = url.searchParams.get("code");
         if (code) {
             const username = "Facebook User"; 
             const html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h1>✅ Facebook Connected!</h1>
                    <script>
                        if(window.opener) {
                            window.opener.postMessage({ type: 'FACEBOOK_CONNECTED', username: '${username}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/earn';
                        }
                    </script>
                </body>
                </html>
            `;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
         }
    }

    // Default: serve static assets
    return env.ASSETS.fetch(request);
  }
}

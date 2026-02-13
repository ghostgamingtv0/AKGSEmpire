// Instagram Router Logic
export const INSTAGRAM_CONFIG = {
    CLIENT_ID: '780330031777441',
    CLIENT_SECRET: '24f2dc9cd5903a234c9ae31eb6672794',
    ACCESS_TOKEN: 'IGAALFtL5aBqFBZAGI4Y214dlE5ZAXZApQlljVzluQ1VDZAzV4ZAGhUckE2b2FKZA2U5clhrRUxuRDNVa2M3aVNtRGpoeGthMWRaSmFwak1TMzNIbTdIT0Q5bUNMVkI2SktBSmR2SXgyZAkhSckhUaFg1R3U2TTVEN01Ubm5GRW9oS2JhbwZDZD'
};

export async function handleInstagramRequest(request, url) {
    // 1. Instagram Login Redirect
    if (url.pathname === "/api/instagram/login") {
        // Force HTTPS
        const origin = url.origin.replace('http:', 'https:');
        const redirectUri = `${origin}/api/instagram/callback/`; // Note: Trailing slash matches common setups
        const scope = 'user_profile,user_media';
        const state = Math.random().toString(36).substring(7);
        
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CONFIG.CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
        
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
    
    return null; // Not handled
}

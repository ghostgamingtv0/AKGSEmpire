export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // =================================================================================
    // 1. TIKTOK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const TIKTOK_SANDBOX_KEY = 'sbaw8q48mtdwkfigi3';
    const TIKTOK_SANDBOX_SECRET = '7Z3CfRk2qI8nfoEqpczC96gZbvFaiOal';
    const TIKTOK_PROD_KEY = 'awyk8qjpedujjzz6';
    const TIKTOK_PROD_SECRET = 'FIPDCqZ7ahWnfm63Ve1oYUVkJfNTbKq9';
    const IS_DEV = url.hostname.includes('localhost') || url.hostname.endsWith('pages.dev');
    const TIKTOK_CLIENT_KEY = IS_DEV ? TIKTOK_SANDBOX_KEY : TIKTOK_PROD_KEY;
    const TIKTOK_CLIENT_SECRET = IS_DEV ? TIKTOK_SANDBOX_SECRET : TIKTOK_PROD_SECRET;

    // =================================================================================
    // 2. INSTAGRAM CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const INSTAGRAM_CLIENT_ID = '780330031777441';
    const INSTAGRAM_CLIENT_SECRET = '17841477672773380';
    const INSTAGRAM_ACCESS_TOKEN = 'IGAALFtL5aBqFBZAFptRExKWTktcjYyU3VJS201blF4ZAVVmV2VmS004b09lZAVUzNndqY3lYWklBclZALc3gzSTRvdjFmeGhocXB4RkhycDUzdjV4SjFWYTVqUHRKVEJqU3FtNVJqRWc0SkFMUmNMZAFZADb0cybThLcEthaUFWMFZAwawZDZD';
    const INSTAGRAM_VERIFY_TOKEN = '2e68281baaf661cf70cad6e819f0070c';

    // =================================================================================
    // 3. FACEBOOK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    // Note: If you have a specific Facebook App ID different from Instagram, update it here.
    // Currently using the same ID as Instagram as they are often linked in Meta Business Suite.
    const FACEBOOK_CLIENT_ID = '1814051289293227'; 
    const FACEBOOK_CLIENT_SECRET = '861a257c043c1499e5e9aa77081a5769';
    const FACEBOOK_VERIFY_TOKEN = '2e68281baaf661cf70cad6e819f0070c';

    // =================================================================================
    // 4. KICK CONFIGURATION (INDEPENDENT)
    // =================================================================================
    const KICK_CLIENT_ID = '01KH3T8WNDZ269403HKC17JN7X';
    const KICK_CLIENT_SECRET = 'c23959f212aca21f06584f80029291f71d4b26b537e21c1e1b8865737791f7ba';

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
    if (url.pathname === "/tiktok1kNOcQ23SkeEyz8BjWfxtK5wGAE4Eah1.txt") {
        return new Response("tiktok-developers-site-verification=1kNOcQ23SkeEyz8BjWfxtK5wGAE4Eah1", {
            headers: { "Content-Type": "text/plain" }
        });
    }

    // =================================================================================
    // TIKTOK LOGIC (Completely Separated)
    // =================================================================================
    
    // 1. TikTok Login Redirect
    if (
        url.pathname === "/api/tiktok/login" ||
        url.pathname === "/empire/api/tiktok/login"
    ) {
        const csrfState = Math.random().toString(36).substring(7);
        const redirectUri = `${url.origin}/empire/api/tiktok/callback`;
        
        let targetUrl = 'https://www.tiktok.com/v2/auth/authorize/';
        targetUrl += `?client_key=${TIKTOK_CLIENT_KEY}`;
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
            
            // OAuth Code Exchange
            if (code) {
                try {
                    const redirectUri = `${url.origin}/empire/api/tiktok/callback`;
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
157                                     window.location.href = '/empire/earn/';
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
209                         window.location.href = '/empire/earn/';
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
            
            if (mode === "subscribe" && token === INSTAGRAM_VERIFY_TOKEN) {
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
270                             window.location.href = '/empire/earn/';
                        }
                    </script>
                </body>
                </html>
            `;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
         }
    }

    // 3. Facebook Webhook
    if (url.pathname === "/api/facebook/webhook" || url.pathname === "/api/facebook/webhook/") {
        if (request.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");
            if (mode === "subscribe" && token === FACEBOOK_VERIFY_TOKEN) {
                return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
            }
            return new Response("Forbidden", { status: 403 });
        }
        if (request.method === "POST") {
            return new Response("EVENT_RECEIVED", { status: 200 });
        }
    }

    // 5. Kick Webhook (Support GET for browser checks, POST for events)
    if (url.pathname === "/api/kick/webhook" || url.pathname === "/api/kick/webhook/") {
        if (request.method === "GET") {
            return new Response("Webhook OK", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        if (request.method === "POST") {
            try {
                const body = await request.text();
                // TODO: Verify signature header if provided
                return new Response("Webhook Received", { status: 200 });
            } catch (err) {
                return new Response(`Webhook Error: ${err.message}`, { status: 500 });
            }
        }
        return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/feed-status") {
        const payload = {
            twitter: { isNew: false },
            instagram: { isNew: false },
            tiktok: { isNew: false },
            threads: { isNew: false }
        };
        return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/stats") {
        try {
            const res = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
            if (res.ok) {
                const data = await res.json();
                const followers = data.followersCount || data.followers_count || 0;
                const isLive = !!data.livestream;
                const viewers = isLive ? (data.livestream.viewer_count || 0) : 0;
                const category =
                    (isLive && data.livestream && data.livestream.categories && data.livestream.categories[0] && data.livestream.categories[0].name) ||
                    (data.recent_categories && data.recent_categories[0] && data.recent_categories[0].name) ||
                    "None";
                const payload = {
                    success: true,
                    kick_followers: followers,
                    kick_viewers: viewers,
                    kick_is_live: isLive,
                    kick_category: category,
                    weekly_growth: 0,
                    discord_members: 0,
                    telegram_members: 0
                };
                return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
            }
        } catch (e) {}
        const fallbackPayload = {
            success: true,
            kick_followers: 0,
            kick_viewers: 0,
            kick_is_live: false,
            kick_category: "None",
            weekly_growth: 0,
            discord_members: 0,
            telegram_members: 0
        };
        return new Response(JSON.stringify(fallbackPayload), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/genesis/stats") {
        const payload = {
            totalSpots: 50,
            spotsLeft: 50
        };
        return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/init-user" && request.method === "POST") {
        try {
            const body = await request.json();
            const visitor = body?.visitor_id || "visitor_unknown";
            const gcode = "G-" + btoa(visitor).substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
            const resp = {
                success: true,
                visitor_id: visitor,
                kick_username: body?.kick_username || null,
                wallet_address: body?.wallet_address || null,
                total_points: 0,
                g_code: gcode
            };
            return new Response(JSON.stringify(resp), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response(JSON.stringify({ error: "Init failed" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    }

    if (url.pathname === "/api/claim" && request.method === "POST") {
        try {
            const body = await request.json();
            const resp = {
                success: true,
                message: "Claim recorded",
                points_added: body?.points || 5
            };
            return new Response(JSON.stringify(resp), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: "Invalid payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    }

    if (url.pathname === "/api/mining/ping" && request.method === "POST") {
        try {
            const resp = { success: true, points_added: 5 };
            return new Response(JSON.stringify(resp), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: "Ping failed" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    }

    if (url.pathname === "/empire/tiktok-developers-site-verification.html") {
        return new Response("tiktok-developers-site-verification=1kNOcQ23SkeEyz8BjWfxtK5wGAE4Eah1", { headers: { "Content-Type": "text/plain" } });
    }
    if (url.pathname === "/empire/tiktok-developers-site-verification.txt") {
        return new Response("tiktok-developers-site-verification=1kNOcQ23SkeEyz8BjWfxtK5wGAE4Eah1", { headers: { "Content-Type": "text/plain" } });
    }

    if (url.pathname.startsWith("/empire")) {
        const allowedExact = new Set([
            "/empire/tiktok-developers-site-verification.txt",
            "/empire/terms.html",
            "/empire/privacy.html",
            "/empire/api/instagram/callback",
            "/empire/api/instagram/callback/"
        ]);
        const isAllowedPrefix =
            url.pathname.startsWith("/empire/earn") ||
            url.pathname.startsWith("/empire/api") ||
            url.pathname.startsWith("/empire/tiktok-developers-site-verification");
        if (!allowedExact.has(url.pathname) && !isAllowedPrefix) {
            return Response.redirect(`${url.origin}/coming-soon`, 302);
        }
    }

    // Redirect legacy /earn to new route
    if (url.pathname === "/earn") {
        return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 301);
    }
    if (url.pathname === "/empire/earn") {
        return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 301);
    }
    // Map /empire/api/kick/callback to SPA handler at /empire/earn (preserve query)
    if (url.pathname === "/empire/api/kick/callback") {
        return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 302);
    }
    if (url.pathname === "/empire/earn/api/kick/callback") {
        return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 302);
    }
    if (url.pathname === "/empire/dev/api/kick/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/kick/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/kick/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/kick/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/instagram/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/instagram/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/facebook/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/facebook/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/tiktok/callback") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/tiktok/callback";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname.startsWith("/empire/earn/api/")) {
        const newUrl = new URL(request.url);
        newUrl.pathname = url.pathname.replace("/empire/earn", "");
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/stats") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/stats";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/feed-status") {
        const payload = {
            twitter: { isNew: false },
            instagram: { isNew: false },
            tiktok: { isNew: false },
            threads: { isNew: false }
        };
        return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/username/check" && request.method === "POST") {
        try {
            const body = await request.json();
            const username = (body?.username || "").trim();
            const platform = (body?.platform || "").toLowerCase();
            const valid = /^[a-zA-Z0-9_]+$/.test(username);
            const resp = {
                success: true,
                platform,
                username,
                is_valid: valid
            };
            return new Response(JSON.stringify(resp), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: "Invalid payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    }
    // Lightweight fallbacks to avoid JSON parse errors in Dashboard
    if (url.pathname === "/api/leaderboard") {
        return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/leaderboards") {
        return new Response(JSON.stringify({ success: true, most_interactive: [], top_referrers: [] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/top-comments") {
        return new Response(JSON.stringify({ success: true, topComments: [] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/stats") {
        const payload = {
            success: true,
            total_users: 0,
            total_distributed: 0,
            kick_followers: 0,
            kick_viewers: 0,
            kick_is_live: false,
            weekly_growth: "+0",
            kick_category: ""
        };
        return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/kick/exchange-token" && request.method === "POST") {
        try {
            const body = await request.json();
            const code = body?.code || null;
            const visitorId = body?.visitor_id || null;
            const codeVerifier = body?.code_verifier || null;
            const redirectUri = body?.redirect_uri || `${url.origin}/empire/earn/`;
            if (!code || !codeVerifier) {
                return new Response(JSON.stringify({ success: false, error: "Missing code or code_verifier" }), { status: 400, headers: { "Content-Type": "application/json" } });
            }
            const tokenParams = new URLSearchParams();
            tokenParams.append("grant_type", "authorization_code");
            tokenParams.append("client_id", KICK_CLIENT_ID);
            tokenParams.append("client_secret", KICK_CLIENT_SECRET);
            tokenParams.append("redirect_uri", redirectUri);
            tokenParams.append("code", code);
            tokenParams.append("code_verifier", codeVerifier);
            const tokenRes = await fetch("https://id.kick.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: tokenParams
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.access_token) {
                return new Response(JSON.stringify({ success: false, error: "Token exchange failed", details: tokenData }), { status: 400, headers: { "Content-Type": "application/json" } });
            }
            const accessToken = tokenData.access_token;
            let username = null;
            let profilePic = null;
            try {
                const userRes = await fetch("https://id.kick.com/oauth/userinfo", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json"
                    }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    const u = userData.data || userData;
                    username = u.username || u.slug || u.preferred_username || u.name || null;
                    profilePic = u.profile_pic || u.picture || null;
                }
            } catch (e) {}
            if (!username) {
                try {
                    const altRes = await fetch("https://api.kick.com/api/v1/me", {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/json"
                        }
                    });
                    if (altRes.ok) {
                        const altData = await altRes.json();
                        const u = altData.data || altData;
                        username = u.username || u.slug || username;
                        profilePic = profilePic || u.profile_pic || null;
                    }
                } catch (e) {}
            }
            let followers = null;
            try {
                const chRes = await fetch("https://api.kick.com/public/v1/channels", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json"
                    }
                });
                if (chRes.ok) {
                    const chData = await chRes.json();
                    const c = chData.data || chData;
                    followers = c.followersCount || c.followers_count || (Array.isArray(c.followers) ? c.followers.length : null);
                }
            } catch (e) {}
            const resp = {
                success: true,
                username: username || null,
                profile_pic: profilePic || null,
                followers: followers || null,
                following: false,
                is_profile_complete: false,
                visitor_id: visitorId
            };
            return new Response(JSON.stringify(resp), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: "Bad payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    }
    if (url.pathname === "/empire/earn/earn") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/empire/earn/";
        return Response.redirect(newUrl.toString(), 301);
    }
    if (url.pathname === "/empire/earn/api/instagram/callback") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/instagram/callback/";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/earn/api/facebook/callback") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/facebook/callback";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/api/instagram/callback" || url.pathname === "/empire/api/instagram/callback/") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/facebook/callback";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/dev/api/instagram/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/instagram/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    if (url.pathname === "/empire/dev/api/facebook/webhook") {
        const newUrl = new URL(request.url);
        newUrl.pathname = "/api/facebook/webhook";
        return Response.redirect(newUrl.toString(), 302);
    }
    // Default: serve static assets
    return env.ASSETS.fetch(request);
  }
}

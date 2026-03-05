import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleKickRequest, KICK_CONFIG } from './api_social_media/kick/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. REDIRECT RENDER USERS TO CLOUDFLARE
    if (url.hostname.includes("render.com")) {
      const secureUrl = new URL(request.url);
      secureUrl.hostname = "akgsempire.org";
      return Response.redirect(secureUrl.toString(), 301);
    }

    try {
      // =================================================================================
      // 0. STATIC VERIFICATION FILES (Bypass SPA Routing)
      // =================================================================================
      if (url.pathname === "/czuudtyh60e6l29pldx1s2htix8oxz") {
        return new Response("czuudtyh60e6l29pldx1s2htix8oxz", { headers: { "Content-Type": "text/plain" } });
      }
      if (url.pathname === "/czuudtyh60e6l29pldx1s2htix8oxz.html") {
        return new Response("czuudtyh60e6l29pldx1s2htix8oxz", { headers: { "Content-Type": "text/html" } });
      }
      if (url.pathname === "/tiktokLBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7.txt") {
        return new Response("tiktok-developers-site-verification=LBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7", { headers: { "Content-Type": "text/plain" } });
      }

      // =================================================================================
      // 1. API ROUTES (Internal Cloudflare Backend)
      // =================================================================================
      if (url.pathname.startsWith("/api/")) {
        
        // --- Social Media Handlers ---
        const kickRes = await handleKickRequest(request, url, env);
        if (kickRes) return kickRes;

        const fbRes = await handleFacebookRequest(request, url, env);
        if (fbRes) return fbRes;

        const igRes = await handleInstagramRequest(request, url, env);
        if (igRes) return igRes;

        // --- Auth: Register ---
        if (url.pathname === "/api/auth/register" && request.method === "POST") {
          try {
            const body = await request.json();
            const { username, password } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user:${username}`);
              if (existing) return new Response(JSON.stringify({ success: false, error: "Username taken" }), { status: 400 });
              await env.USERS.put(`user:${username}`, JSON.stringify({ ...body, total_points: 1000 }));
              return new Response(JSON.stringify({ success: true, message: "Registered on Edge" }), { headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({ success: true, message: "Registered (Local Mode)" }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Auth Error" }), { status: 500 }); }
        }

        // --- Auth: Login ---
        if (url.pathname === "/api/auth/login" && request.method === "POST") {
          try {
            const body = await request.json();
            const { username, password } = body;
            if (env.USERS) {
              const data = await env.USERS.get(`user:${username}`);
              if (data) {
                const user = JSON.parse(data);
                if (user.password === password) return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
              }
              return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), { status: 401 });
            }
            return new Response(JSON.stringify({ success: true, user: { username: username || "Guest", total_points: 1000 } }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Auth Error" }), { status: 500 }); }
        }

        // --- Stats API ---
        if (url.pathname === "/api/stats" || url.pathname === "/empire/earn/api/stats") {
          try {
            const kickApi = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", {
              headers: { "User-Agent": "Mozilla/5.0" }
            });
            const kickData = await kickApi.json();
            return new Response(JSON.stringify({
              success: true,
              kick_followers: kickData.followersCount || 850,
              kick_viewers: kickData.livestream ? kickData.livestream.viewer_count : 0,
              kick_is_live: !!kickData.livestream,
              kick_category: kickData.livestream ? kickData.livestream.categories[0].name : "Gaming",
              weekly_growth: 15
            }), { headers: { "Content-Type": "application/json" } });
          } catch (e) {
            return new Response(JSON.stringify({ success: true, kick_followers: 850, kick_is_live: false }), { headers: { "Content-Type": "application/json" } });
          }
        }

        // --- Leaderboard API ---
        if (url.pathname === "/api/leaderboard") {
          return new Response(JSON.stringify([
            { username: "Ghost_Master", total_points: 15000 },
            { username: "Empire_King", total_points: 12000 },
            { username: "Shadow_Warrior", total_points: 9500 }
          ]), { headers: { "Content-Type": "application/json" } });
        }

        // --- Ping / Health ---
        if (url.pathname === "/api/ping") {
          return new Response(JSON.stringify({ status: "Cloudflare Edge Active", timestamp: Date.now() }), { headers: { "Content-Type": "application/json" } });
        }

        // 404 for unknown API
        return new Response(JSON.stringify({ error: "API Route Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }

      // =================================================================================
      // 2. SPA ROUTING (Fallback to Frontend)
      // =================================================================================
      return env.ASSETS.fetch(request);

    } catch (e) {
      return new Response(`Cloudflare Worker Error: ${e.message}`, { status: 500 });
    }
  }
};

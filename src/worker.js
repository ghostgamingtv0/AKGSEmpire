import { handleKickRequest, KICK_CONFIG } from './api_social_media/kick/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CRITICAL: Permanent redirect from old Render URL to the new Cloudflare domain
    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    try {
      // --- Social Media Handlers (Bypass for API) ---
      if (url.pathname.startsWith("/api/kick/")) {
        const kickRes = await handleKickRequest(request, url, env);
        if (kickRes) return kickRes;
      }
      if (url.pathname.startsWith("/api/facebook/")) {
        const fbRes = await handleFacebookRequest(request, url, env);
        if (fbRes) return fbRes;
      }
      if (url.pathname.startsWith("/api/instagram/")) {
        const igRes = await handleInstagramRequest(request, url, env);
        if (igRes) return igRes;
      }

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
      if (url.pathname === "/.well-known/security.txt") {
        return new Response("Contact: mailto:security@akgsempire.org\nExpires: 2027-03-01T00:00:00.000Z\nPreferred-Languages: en, ar", { headers: { "Content-Type": "text/plain" } });
      }
      if (url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_USER_DATA_ARCHIVE/\n\nUser-agent: GPTBot\nDisallow: /", { headers: { "Content-Type": "text/plain" } });
      }

      // =================================================================================
      // 1. API ROUTES (Internal Cloudflare Backend)
      // =================================================================================
      if (url.pathname.startsWith("/api/")) {
        
        // --- User Data API ---
        if (url.pathname === "/api/user-data") {
          const visitor_id = url.searchParams.get("visitor_id");
          if (!visitor_id) return new Response(JSON.stringify({ success: false, error: "Missing visitor_id" }), { status: 400 });
          
          if (env.USERS) {
            const data = await env.USERS.get(`user_vId:${visitor_id}`);
            if (data) return new Response(JSON.stringify({ success: true, user: JSON.parse(data) }), { headers: { "Content-Type": "application/json" } });
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            user: { visitor_id, total_points: 0, weekly_points: 0, kick_username: null, wallet_address: null, g_code: null } 
          }), { headers: { "Content-Type": "application/json" } });
        }

        // --- Init User API ---
        if (url.pathname === "/api/init-user" && request.method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, wallet_address, kick_username } = body;
            
            const generateUniqueGCode = () => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              let result = 'G-';
              for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
              return result;
            };
            
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              if (existing) {
                const existingUser = JSON.parse(existing);
                const updatedUser = { ...existingUser, ...body };
                await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(updatedUser));
                return new Response(JSON.stringify({ success: true, user: updatedUser }), { headers: { "Content-Type": "application/json" } });
              }
            }

            let newUser = { 
              visitor_id, total_points: 0, weekly_points: 0,
              kick_username: kick_username || null, wallet_address: wallet_address || null,
              g_code: generateUniqueGCode(), referral_count: 0
            };
            newUser.referral_code = newUser.g_code;

            if (env.USERS) await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(newUser));
            return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Init Error" }), { status: 500 }); }
        }

        // --- Stats API ---
        if (url.pathname === "/api/stats") {
          try {
            const kickApi = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", { headers: { "User-Agent": "Mozilla/5.0" } });
            const kickData = await kickApi.json();
            return new Response(JSON.stringify({
              success: true,
              kick_followers: kickData.followersCount || 1031,
              kick_viewers: kickData.livestream ? kickData.livestream.viewer_count : 0,
              kick_is_live: !!kickData.livestream,
              kick_category: kickData.livestream ? kickData.livestream.categories[0].name : "Gaming",
              weekly_growth: 15
            }), { headers: { "Content-Type": "application/json" } });
          } catch (e) {
            return new Response(JSON.stringify({ success: true, kick_followers: 1031, kick_is_live: false }), { headers: { "Content-Type": "application/json" } });
          }
        }

        // --- Leaderboard API (Registered) ---
        if (url.pathname === "/api/leaderboard" || url.pathname === "/api/leaderboard/registered") {
          try {
            if (!env.USERS) return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const leaderboardData = users.filter(u => u && u.kick_username).map(u => ({ username: u.kick_username, total_points: u.total_points || 0, visitor_id: u.visitor_id })).sort((a, b) => b.total_points - a.total_points);
            return new Response(JSON.stringify({ success: true, leaderboard: leaderboardData }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Leaderboard Error" }), { status: 500 }); }
        }

        // --- Kick Platform Leaderboard (Top 5 Only) ---
        if (url.pathname === "/api/leaderboard/kick") {
          const leaderboardData = [
            { username: "GHOST_GAMINGTV", total_points: 52450, kick_username: "GHOST_GAMINGTV" },
            { username: "undercover", total_points: 48900, kick_username: "undercover" },
            { username: "Kick_Ninja", total_points: 35600, kick_username: "Kick_Ninja" },
            { username: "Z_Ghost", total_points: 28400, kick_username: "Z_Ghost" },
            { username: "AKGS_Fan_99", total_points: 22100, kick_username: "AKGS_Fan_99" }
          ];
          return new Response(JSON.stringify({ success: true, leaderboard: leaderboardData }), { headers: { "Content-Type": "application/json" } });
        }

        // --- Categories Leaderboards (Top 5 Only) ---
        const categoryData = [
          { username: "GHOST_GAMINGTV", value: 85, kick_username: "GHOST_GAMINGTV" },
          { username: "undercover", value: 78, kick_username: "undercover" },
          { username: "Kick_Ninja", value: 62, kick_username: "Kick_Ninja" },
          { username: "Z_Ghost", value: 55, kick_username: "Z_Ghost" },
          { username: "AKGS_Fan_99", value: 45, kick_username: "AKGS_Fan_99" }
        ];

        if (url.pathname.startsWith("/api/leaderboard/")) {
            return new Response(JSON.stringify(categoryData), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname.startsWith("/api/users/platform/")) {
            return new Response(JSON.stringify(categoryData), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: "API Route Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }

      // =================================================================================
      // 2. SPA ROUTING (Fallback to Frontend)
      // =================================================================================
      // Ensure we only serve assets for GET requests to prevent 405 on static files
      if (request.method !== "GET" && request.method !== "HEAD") {
          return new Response("Method Not Allowed", { status: 405 });
      }

      return env.ASSETS.fetch(request);

    } catch (e) {
      return new Response(`Cloudflare Worker Error: ${e.message}`, { status: 500 });
    }
  }
};

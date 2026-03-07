import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleKickRequest, KICK_CONFIG } from './api_social_media/kick/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const originalPath = url.pathname;
    const method = request.method;
    
    // 1. Normalize path for matching: lowercase, remove /empire prefix, remove trailing slashes
    let path = originalPath.toLowerCase();
    if (path.startsWith("/empire/")) path = path.replace("/empire/", "/");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (!path.startsWith("/")) path = "/" + path;

    // 2. CRITICAL: Permanent redirect from old Render URL
    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    // Helper for JSON responses
    const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });

    try {
      // 3. API HANDLING
      if (path.includes("/api/")) {
        
        // --- Social Media Handlers ---
        if (path.startsWith("/api/kick/")) return await handleKickRequest(request, url, env);
        if (path.startsWith("/api/facebook/")) return await handleFacebookRequest(request, url, env);
        if (path.startsWith("/api/instagram/")) return await handleInstagramRequest(request, url, env);
        if (path.startsWith("/api/tiktok/")) return await handleTikTokRequest(request, url, env);

        // --- Auth & Registration ---
        if (path === "/api/auth/register" && method === "POST") {
          const body = await request.json();
          const { username, password, visitor_id, wallet_address } = body;
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          const existing = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (existing) return jsonRes({ success: false, error: "Username already exists" }, 400);
          const newUser = { username, password, visitor_id, wallet_address, kick_username: username, total_points: 0, weekly_points: 0, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase(), referral_count: 0, created_at: Date.now() };
          await env.USERS.put(`auth_user:${username.toLowerCase()}`, JSON.stringify(newUser));
          await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(newUser));
          return jsonRes({ success: true, user: newUser });
        }

        if (path === "/api/auth/login" && method === "POST") {
          const body = await request.json();
          const { username, password, visitor_id } = body;
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          const data = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (!data) return jsonRes({ success: false, error: "User not found" }, 404);
          const user = JSON.parse(data);
          if (user.password !== password) return jsonRes({ success: false, error: "Invalid password" }, 401);
          if (visitor_id && user.visitor_id !== visitor_id) { user.visitor_id = visitor_id; await env.USERS.put(`auth_user:${username.toLowerCase()}`, JSON.stringify(user)); await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(user)); }
          return jsonRes({ success: true, user });
        }

        // --- Ghost Gate (Genesis) ---
        if (path === "/api/genesis/stats") return jsonRes({ success: true, spotsLeft: 50 });
        
        if (path === "/api/genesis/login" && method === "POST") {
          const body = await request.json();
          const { username, password } = body;
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          const data = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (!data) return jsonRes({ success: false, error: "User not found" }, 404);
          const user = JSON.parse(data);
          if (user.password !== password) return jsonRes({ success: false, error: "Invalid password" }, 401);
          return jsonRes({ success: true, user });
        }

        if (path === "/api/genesis/test-register" && method === "POST") {
          const body = await request.json();
          const { nickname, password, visitor_id, wallet } = body;
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          const existing = await env.USERS.get(`auth_user:${nickname.toLowerCase()}`);
          if (existing) return jsonRes({ success: false, error: "Username already exists" }, 400);
          const newUser = { username: nickname, password, visitor_id, wallet_address: wallet, kick_username: nickname, total_points: 0, weekly_points: 0, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase(), referral_count: 0, created_at: Date.now(), rank: Math.floor(Math.random() * 50) + 1 };
          await env.USERS.put(`auth_user:${nickname.toLowerCase()}`, JSON.stringify(newUser));
          await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(newUser));
          return jsonRes({ success: true, gCode: newUser.g_code, rank: newUser.rank, spotsLeft: 49 });
        }

        // --- User Profile & Data ---
        if (path === "/api/user-data") {
          const visitor_id = url.searchParams.get("visitor_id");
          if (!visitor_id) return jsonRes({ success: false, error: "Missing visitor_id" }, 400);
          if (env.USERS) {
            const data = await env.USERS.get(`user_vId:${visitor_id}`);
            if (data) return jsonRes({ success: true, user: JSON.parse(data) });
          }
          return jsonRes({ success: true, user: { visitor_id, total_points: 0, g_code: null } });
        }

        if (path === "/api/init-user" && method === "POST") {
          const body = await request.json();
          const { visitor_id, wallet_address, kick_username } = body;
          if (!env.USERS) return jsonRes({ success: true, user: { visitor_id, total_points: 0, g_code: 'G-LOCAL' } });
          const existing = await env.USERS.get(`user_vId:${visitor_id}`);
          if (existing) {
            const user = JSON.parse(existing);
            if (wallet_address) user.wallet_address = wallet_address;
            if (kick_username) user.kick_username = kick_username;
            await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(user));
            return jsonRes({ success: true, user });
          }
          const newUser = { visitor_id, total_points: 0, weekly_points: 0, kick_username: kick_username || null, wallet_address: wallet_address || null, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase() };
          await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(newUser));
          return jsonRes({ success: true, user: newUser });
        }

        // --- Stats & Logs ---
        if (path === "/api/stats") {
          try {
            const kickApi = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", { headers: { "User-Agent": "Mozilla/5.0" } });
            const kickData = await kickApi.json();
            return jsonRes({ success: true, kick_followers: kickData.followersCount || 1031, kick_is_live: !!kickData.livestream });
          } catch (e) { return jsonRes({ success: true, kick_followers: 1031, kick_is_live: false }); }
        }

        if (path === "/api/log" && method === "POST") return jsonRes({ success: true });

        // Catch-all for API
        return jsonRes({ error: "API Route Not Found", path }, 404);
      }

      // 4. STATIC FILES & SPA
      if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { headers: { "Content-Type": "text/plain" } });
      
      if (method !== "GET" && method !== "HEAD") {
        return jsonRes({ error: "Method Not Allowed", method }, 405);
      }
      
      return env.ASSETS.fetch(request);

    } catch (e) {
      return jsonRes({ error: "Worker Error", message: e.message, stack: e.stack }, 500);
    }
  }
};

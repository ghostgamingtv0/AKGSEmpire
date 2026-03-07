import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleKickRequest } from './api_social_media/kick/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const originalPath = url.pathname;
    const method = request.method;
    
    // 1. Permanent redirect from old Render URL
    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    // 2. Robust Normalization
    let path = originalPath.toLowerCase();
    
    // Remove /empire prefix if it exists
    if (path.startsWith("/empire/")) {
      path = path.substring(7);
    } else if (path === "/empire") {
      path = "/";
    }

    // Ensure it starts with /
    if (!path.startsWith("/")) path = "/" + path;
    // Remove trailing slash
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    // 3. Helper for JSON responses with CORS and Cache headers
    const jsonRes = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    };

    // 4. Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // 5. API DETECTION & HANDLING
    const isApiRequest = path.includes("/api");

    try {
      if (isApiRequest) {
        // Ping route for debugging
        if (path === "/api/ping") return jsonRes({ status: "ok", timestamp: Date.now(), path });

        // Defensive Body Parsing
        let body = {};
        if (method === "POST" || method === "PUT") {
          try {
            const text = await request.text();
            if (text) body = JSON.parse(text);
          } catch (e) {
            console.warn("Body parse warning:", e.message);
          }
        }

        // --- Social Media Proxy Handlers ---
        // Create a fake URL with the normalized path for the routers to use
        const normalizedUrl = new URL(url.toString());
        normalizedUrl.pathname = path;

        if (path.includes("/api/kick/")) {
          const res = await handleKickRequest(request, normalizedUrl, env);
          if (res) return res;
        }
        if (path.includes("/api/facebook/")) {
          const res = await handleFacebookRequest(request, normalizedUrl, env);
          if (res) return res;
        }
        if (path.includes("/api/instagram/")) {
          const res = await handleInstagramRequest(request, normalizedUrl, env);
          if (res) return res;
        }
        if (path.includes("/api/tiktok/")) {
          const res = await handleTikTokRequest(request, normalizedUrl, env);
          if (res) return res;
        }

        // --- Registration & Auth (Ghost Gate) ---
        if (path === "/api/genesis/test-register" && method === "POST") {
          const { nickname, password, visitor_id, wallet } = body;
          if (!nickname || !password || !visitor_id) {
            return jsonRes({ success: false, error: "Missing nickname, password or visitor_id" }, 400);
          }
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          
          const uKey = `auth_user:${nickname.toLowerCase()}`;
          const vKey = `user_vid:${visitor_id.toLowerCase()}`;
          const existing = await env.USERS.get(uKey);
          if (existing) return jsonRes({ success: false, error: "Username already exists" }, 400);

          const gCode = 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const rank = Math.floor(Math.random() * 50) + 1;
          const newUser = { username: nickname, password, visitor_id, wallet_address: wallet || null, kick_username: nickname, total_points: 0, weekly_points: 0, g_code: gCode, referral_count: 0, created_at: Date.now(), rank };

          await env.USERS.put(uKey, JSON.stringify(newUser));
          await env.USERS.put(vKey, JSON.stringify(newUser));
          
          return jsonRes({ success: true, gCode, rank, spotsLeft: 49 });
        }

        if (path === "/api/auth/register" && method === "POST") {
          const { username, password, visitor_id, wallet_address } = body;
          if (!username || !password || !visitor_id) return jsonRes({ success: false, error: "Missing required fields" }, 400);
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);

          const uKey = `auth_user:${username.toLowerCase()}`;
          const vKey = `user_vid:${visitor_id.toLowerCase()}`;
          const existing = await env.USERS.get(uKey);
          if (existing) return jsonRes({ success: false, error: "Username already exists" }, 400);

          const gCode = 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const newUser = { username, password, visitor_id, wallet_address: wallet_address || null, total_points: 0, g_code: gCode };

          await env.USERS.put(uKey, JSON.stringify(newUser));
          await env.USERS.put(vKey, JSON.stringify(newUser));
          
          return jsonRes({ success: true, user: newUser });
        }

        if (path === "/api/auth/login" && method === "POST") {
          const { username, password, visitor_id } = body;
          if (!username || !password) return jsonRes({ success: false, error: "Missing username or password" }, 400);
          
          if (!env.USERS) return jsonRes({ success: false, error: "Database not available" }, 500);
          
          const uKey = `auth_user:${username.toLowerCase()}`;
          const data = await env.USERS.get(uKey);
          if (!data) return jsonRes({ success: false, error: "User not found" }, 404);
          const user = JSON.parse(data);
          if (user.password !== password) return jsonRes({ success: false, error: "Invalid password" }, 401);
          if (visitor_id) {
             user.visitor_id = visitor_id;
             await env.USERS.put(uKey, JSON.stringify(user));
             await env.USERS.put(`user_vid:${visitor_id.toLowerCase()}`, JSON.stringify(user));
          }
          return jsonRes({ success: true, user });
        }

        if (path === "/api/init-user" && method === "POST") {
          const { visitor_id, wallet_address, kick_username } = body;
          if (!visitor_id) return jsonRes({ success: false, error: "Missing visitor_id" }, 400);
          
          if (env.USERS) {
            const vKey = `user_vid:${visitor_id.toLowerCase()}`;
            const existing = await env.USERS.get(vKey);
            if (existing) {
              const user = JSON.parse(existing);
              if (wallet_address) user.wallet_address = wallet_address;
              if (kick_username) user.kick_username = kick_username;
              await env.USERS.put(vKey, JSON.stringify(user));
              if (user.username) await env.USERS.put(`auth_user:${user.username.toLowerCase()}`, JSON.stringify(user));
              return jsonRes({ success: true, user });
            }
          }
          
          const newUser = { visitor_id, total_points: 0, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase() };
          if (env.USERS) await env.USERS.put(`user_vid:${visitor_id.toLowerCase()}`, JSON.stringify(newUser));
          return jsonRes({ success: true, user: newUser });
        }

        if (path === "/api/stats") {
          try {
            const kickApi = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", { headers: { "User-Agent": "Mozilla/5.0" } });
            const kickData = await kickApi.json();
            return jsonRes({ success: true, kick_followers: kickData.followersCount || 1031, kick_is_live: !!kickData.livestream });
          } catch (e) {
            return jsonRes({ success: true, kick_followers: 1031, kick_is_live: false });
          }
        }

        if (path === "/api/genesis/stats") return jsonRes({ success: true, spotsLeft: 50 });

        // --- Leaderboard & Tasks ---
        if (path.startsWith("/api/leaderboard/") || path.startsWith("/api/users/platform/")) {
          if (!env.USERS) return jsonRes([]);
          
          const users = [];
          const list = await env.USERS.list({ prefix: "auth_user:" });
          
          for (const key of list.keys) {
            const data = await env.USERS.get(key.name);
            if (data) {
              const user = JSON.parse(data);
              // Simple heuristic to filter by platform or metric
              if (path.includes("kick") && !user.kick_username) continue;
              if (path.includes("twitter") && !user.twitter_username) continue;
              if (path.includes("threads") && !user.threads_username) continue;
              if (path.includes("instagram") && !user.instagram_username) continue;
              
              users.push(user);
            }
          }
          
          // Sort by points descending
          users.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
          return jsonRes(users.slice(0, 10));
        }

        if (path === "/api/verify-task") return jsonRes({ success: true, points_added: 10 });
        if (path === "/api/log") return jsonRes({ success: true });
        if (path.startsWith("/api/social/")) return jsonRes({ success: true });
        
        return jsonRes({ error: "API route not matched", path, method }, 404);
      }

      // 6. STATIC ASSETS & SPA FALLBACK
      if (method !== "GET" && method !== "HEAD") {
        return jsonRes({ error: "Method not allowed for non-API request", path }, 405);
      }

      if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { headers: { "Content-Type": "text/plain" } });

      // Default to serving static assets
      return env.ASSETS.fetch(request);

    } catch (err) {
      console.error("Worker Critical Error:", err.message);
      return jsonRes({ 
        error: "Worker Internal Error", 
        message: err.message,
        path,
        method
      }, 500);
    }
  }
};

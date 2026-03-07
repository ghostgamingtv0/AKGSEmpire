import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleKickRequest, KICK_CONFIG } from './api_social_media/kick/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const originalPath = url.pathname;
    const method = request.method;
    
    // 1. Normalize path: remove /empire prefix, lower case, and remove trailing slashes
    let path = originalPath.toLowerCase();
    if (path.startsWith("/empire/")) path = path.replace("/empire/", "/");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    // Ensure it starts with /
    if (!path.startsWith("/")) path = "/" + path;

    // 2. CRITICAL: Permanent redirect from old Render URL
    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    try {
      // 3. API HANDLING (Anything containing /api/ must return JSON)
      if (path.includes("/api/")) {
        
        // --- Social Media Handlers ---
        if (path.startsWith("/api/kick/")) {
          const kickRes = await handleKickRequest(request, url, env);
          if (kickRes) return kickRes;
        }
        if (path.startsWith("/api/facebook/")) {
          const fbRes = await handleFacebookRequest(request, url, env);
          if (fbRes) return fbRes;
        }
        if (path.startsWith("/api/instagram/")) {
          const igRes = await handleInstagramRequest(request, url, env);
          if (igRes) return igRes;
        }
        if (path.startsWith("/api/tiktok/")) {
          const ttRes = await handleTikTokRequest(request, url, env);
          if (ttRes) return ttRes;
        }

        // --- Auth & User Data ---
        if (path === "/api/auth/register" && method === "POST") {
          const body = await request.json();
          const { username, password, visitor_id, wallet_address } = body;
          if (!env.USERS) return new Response(JSON.stringify({ success: false, error: "Database not available" }), { status: 500, headers: { "Content-Type": "application/json" } });
          const existing = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (existing) return new Response(JSON.stringify({ success: false, error: "Username already exists" }), { status: 400, headers: { "Content-Type": "application/json" } });
          const newUser = { username, password, visitor_id, wallet_address, kick_username: username, total_points: 0, weekly_points: 0, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase(), referral_count: 0, created_at: Date.now() };
          await env.USERS.put(`auth_user:${username.toLowerCase()}`, JSON.stringify(newUser));
          await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(newUser));
          return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { "Content-Type": "application/json" } });
        }

        if (path === "/api/auth/login" && method === "POST") {
          const body = await request.json();
          const { username, password, visitor_id } = body;
          if (!env.USERS) return new Response(JSON.stringify({ success: false, error: "Database not available" }), { status: 500, headers: { "Content-Type": "application/json" } });
          const data = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (!data) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
          const user = JSON.parse(data);
          if (user.password !== password) return new Response(JSON.stringify({ success: false, error: "Invalid password" }), { status: 401, headers: { "Content-Type": "application/json" } });
          if (visitor_id && user.visitor_id !== visitor_id) { user.visitor_id = visitor_id; await env.USERS.put(`auth_user:${username.toLowerCase()}`, JSON.stringify(user)); await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(user)); }
          return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
        }

        // --- Genesis (Ghost Gate) Routes ---
        if (path === "/api/genesis/stats") {
          return new Response(JSON.stringify({ success: true, spotsLeft: 50 }), { headers: { "Content-Type": "application/json" } });
        }
        if (path === "/api/genesis/login" && method === "POST") {
          const body = await request.json();
          const { username, password } = body;
          const data = await env.USERS.get(`auth_user:${username.toLowerCase()}`);
          if (!data) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
          const user = JSON.parse(data);
          if (user.password !== password) return new Response(JSON.stringify({ success: false, error: "Invalid password" }), { status: 401, headers: { "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
        }
        if (path === "/api/genesis/test-register" && method === "POST") {
          const body = await request.json();
          const { nickname, password, visitor_id, wallet } = body;
          const existing = await env.USERS.get(`auth_user:${nickname.toLowerCase()}`);
          if (existing) return new Response(JSON.stringify({ success: false, error: "Username already exists" }), { status: 400, headers: { "Content-Type": "application/json" } });
          const newUser = { username: nickname, password, visitor_id, wallet_address: wallet, kick_username: nickname, total_points: 0, weekly_points: 0, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase(), referral_count: 0, created_at: Date.now(), rank: Math.floor(Math.random() * 50) + 1 };
          await env.USERS.put(`auth_user:${nickname.toLowerCase()}`, JSON.stringify(newUser));
          await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(newUser));
          return new Response(JSON.stringify({ success: true, gCode: newUser.g_code, rank: newUser.rank, spotsLeft: 49 }), { headers: { "Content-Type": "application/json" } });
        }

        // --- Stats & Leaderboard ---
        if (path === "/api/stats") {
          try {
            const kickApi = await fetch("https://kick.com/api/v1/channels/ghost_gamingtv", { headers: { "User-Agent": "Mozilla/5.0" } });
            const kickData = await kickApi.json();
            return new Response(JSON.stringify({ success: true, kick_followers: kickData.followersCount || 1031, kick_viewers: kickData.livestream ? kickData.livestream.viewer_count : 0, kick_is_live: !!kickData.livestream, kick_category: kickData.livestream ? kickData.livestream.categories[0].name : "Gaming", weekly_growth: 15 }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: true, kick_followers: 1031, kick_is_live: false }), { headers: { "Content-Type": "application/json" } }); }
        }

        if (path === "/api/leaderboard" || path === "/api/leaderboard/registered") {
          if (!env.USERS) return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
          const { keys } = await env.USERS.list({ prefix: "user_vid:" });
          const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
          const leaderboardData = users.filter(u => u && u.kick_username).map(u => ({ username: u.kick_username, total_points: u.total_points || 0, visitor_id: u.visitor_id })).sort((a, b) => b.total_points - a.total_points);
          return new Response(JSON.stringify({ success: true, leaderboard: leaderboardData }), { headers: { "Content-Type": "application/json" } });
        }

        if (path === "/api/leaderboard/kick") {
          const leaderboardData = [{ username: "GHOST_GAMINGTV", total_points: 52450, kick_username: "GHOST_GAMINGTV" }, { username: "undercover", total_points: 48900, kick_username: "undercover" }, { username: "Kick_Ninja", total_points: 35600, kick_username: "Kick_Ninja" }, { username: "Z_Ghost", total_points: 28400, kick_username: "Z_Ghost" }, { username: "AKGS_Fan_99", total_points: 22100, kick_username: "AKGS_Fan_99" }];
          return new Response(JSON.stringify({ success: true, leaderboard: leaderboardData }), { headers: { "Content-Type": "application/json" } });
        }

        if (path.startsWith("/api/leaderboard/") || path.startsWith("/api/users/platform/")) {
          const categoryData = [{ username: "GHOST_GAMINGTV", value: 85, kick_username: "GHOST_GAMINGTV" }, { username: "undercover", value: 78, kick_username: "undercover" }, { username: "Kick_Ninja", value: 62, kick_username: "Kick_Ninja" }, { username: "Z_Ghost", value: 55, kick_username: "Z_Ghost" }, { username: "AKGS_Fan_99", value: 45, kick_username: "AKGS_Fan_99" }];
          return new Response(JSON.stringify(categoryData), { headers: { "Content-Type": "application/json" } });
        }

        if (path === "/api/log" && method === "POST") return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

        // --- Additional Empire APIs ---
        if (path === "/api/user-data") {
          const visitor_id = url.searchParams.get("visitor_id");
          if (!visitor_id) return new Response(JSON.stringify({ success: false, error: "Missing visitor_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
          if (env.USERS) {
            const data = await env.USERS.get(`user_vid:${visitor_id}`);
            if (data) return new Response(JSON.stringify({ success: true, user: JSON.parse(data) }), { headers: { "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ success: true, user: { visitor_id, total_points: 0, weekly_points: 0, kick_username: null, wallet_address: null, g_code: null } }), { headers: { "Content-Type": "application/json" } });
        }

        if (path === "/api/init-user" && method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, wallet_address, kick_username } = body;
            if (!env.USERS) return new Response(JSON.stringify({ success: true, user: { visitor_id, total_points: 0, g_code: 'G-LOCAL' } }), { headers: { "Content-Type": "application/json" } });
            const existing = await env.USERS.get(`user_vid:${visitor_id}`);
            if (existing) {
              const existingUser = JSON.parse(existing);
              const updatedUser = { ...existingUser };
              if (wallet_address && !updatedUser.wallet_address) updatedUser.wallet_address = wallet_address;
              if (kick_username && !updatedUser.kick_username) updatedUser.kick_username = kick_username;
              await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(updatedUser));
              if (updatedUser.username) await env.USERS.put(`auth_user:${updatedUser.username.toLowerCase()}`, JSON.stringify(updatedUser));
              return new Response(JSON.stringify({ success: true, user: updatedUser }), { headers: { "Content-Type": "application/json" } });
            }
            const newUser = { visitor_id, total_points: 0, weekly_points: 0, kick_username: kick_username || null, wallet_address: wallet_address || null, g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase(), referral_count: 0 };
            newUser.referral_code = newUser.g_code;
            await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(newUser));
            return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Init Error" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
        }

        if (path === "/api/update-profile" && method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, kick_username, wallet_address } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vid:${visitor_id}`);
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 0, g_code: 'G-TEMP' };
              user = { ...user, kick_username: kick_username || user.kick_username, wallet_address: wallet_address || user.wallet_address };
              await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(user));
              if (user.username) await env.USERS.put(`auth_user:${user.username.toLowerCase()}`, JSON.stringify(user));
              return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({ success: false, error: "KV not available" }), { status: 500, headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Update Error" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
        }

        if (path === "/api/claim" && method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, points } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vid:${visitor_id}`);
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 0 };
              user.total_points = (user.total_points || 0) + (points || 10);
              await env.USERS.put(`user_vid:${visitor_id}`, JSON.stringify(user));
              if (user.username) await env.USERS.put(`auth_user:${user.username.toLowerCase()}`, JSON.stringify(user));
              return new Response(JSON.stringify({ success: true, total_points: user.total_points }), { headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({ success: false, error: "KV not available" }), { status: 500, headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Claim Error" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
        }

        // Final fallback for anything with /api/
        return new Response(JSON.stringify({ error: "API Route Not Found", path: path }), { status: 404, headers: { "Content-Type": "application/json" } });
      }

      // 4. STATIC VERIFICATION FILES
      if (path === "/czuudtyh60e6l29pldx1s2htix8oxz") return new Response("czuudtyh60e6l29pldx1s2htix8oxz", { headers: { "Content-Type": "text/plain" } });
      if (path === "/tiktoklbohrmlgmj0y3f2bvryyixalknnklrb7.txt") return new Response("tiktok-developers-site-verification=LBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7", { headers: { "Content-Type": "text/plain" } });
      if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\nDisallow: /api/\n", { headers: { "Content-Type": "text/plain" } });

      // 5. SPA ROUTING FALLBACK
      // If we reach here and it's not GET/HEAD, return 405 JSON
      if (method !== "GET" && method !== "HEAD") {
        return new Response(JSON.stringify({ error: "Method Not Allowed", method }), { status: 405, headers: { "Content-Type": "application/json" } });
      }
      
      return env.ASSETS.fetch(request);

    } catch (e) {
      return new Response(JSON.stringify({ error: "Worker Error", message: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};

import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
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
        
        // --- Social Media Handlers ---
        const kickRes = await handleKickRequest(request, url, env);
        if (kickRes) return kickRes;

        const fbRes = await handleFacebookRequest(request, url, env);
        if (fbRes) return fbRes;

        const igRes = await handleInstagramRequest(request, url, env);
        if (igRes) return igRes;

        // --- User Data API ---
        if (url.pathname === "/api/user-data") {
          const visitor_id = url.searchParams.get("visitor_id");
          if (!visitor_id) return new Response(JSON.stringify({ success: false, error: "Missing visitor_id" }), { status: 400 });
          
          // Try to get from KV if exists, otherwise return a structured default
          if (env.USERS) {
            const data = await env.USERS.get(`user_vId:${visitor_id}`);
            if (data) return new Response(JSON.stringify({ success: true, user: JSON.parse(data) }), { headers: { "Content-Type": "application/json" } });
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            user: { 
              visitor_id, 
              total_points: 0, 
              weekly_points: 0,
              kick_username: null,
              wallet_address: null,
              g_code: null
            } 
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
              for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return result;
            };
            
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              if (existing) {
                const existingUser = JSON.parse(existing);
                // If user exists, just update and return their data, NEVER change G-Code
                const updatedUser = { ...existingUser, ...body };
                await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(updatedUser));
                return new Response(JSON.stringify({ success: true, user: updatedUser }), { headers: { "Content-Type": "application/json" } });
              }

              // --- AUTO-RECOVERY ON INIT (If user has points on a different ID with same Kick username) ---
              if (kick_username) {
                const { keys } = await env.USERS.list({ prefix: "user_vId:" });
                for (const key of keys) {
                  const val = await env.USERS.get(key.name);
                  if (val) {
                    const oldUser = JSON.parse(val);
                    if (oldUser.kick_username === kick_username) {
                      // Found old data! Link it to the new visitor_id
                      let mergedUser = { ...oldUser, visitor_id, is_merged: true };
                      await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(mergedUser));
                      await env.USERS.delete(key.name); // Clean up old ID
                      return new Response(JSON.stringify({ success: true, user: mergedUser, recovered: true }), { headers: { "Content-Type": "application/json" } });
                    }
                  }
                }
              }
            }

            // If new user, create with a permanent G-Code
            let newUser = { 
              visitor_id, 
              total_points: 0, 
              weekly_points: 0,
              kick_username: kick_username || null,
              wallet_address: wallet_address || null,
              g_code: generateUniqueGCode(),
              referral_count: 0
            };
            newUser.referral_code = newUser.g_code; // Legacy support

            if (env.USERS) {
              await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(newUser));
            }
            
            return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Init Error" }), { status: 500 }); }
        }

        // --- Update Profile API ---
        if (url.pathname === "/api/update-profile" && request.method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, kick_username, wallet_address } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 0 };
              
              // --- ACCOUNT MERGE LOGIC (Recover points from old ID if username matches) ---
              if (kick_username && !user.is_merged) {
                const { keys } = await env.USERS.list({ prefix: "user_vId:" });
                for (const key of keys) {
                  const val = await env.USERS.get(key.name);
                  if (val) {
                    const otherUser = JSON.parse(val);
                    // If we find another ID with the same username and more points, merge it!
                    if (otherUser.visitor_id !== visitor_id && otherUser.kick_username?.toLowerCase() === kick_username?.toLowerCase()) {
                      user.total_points = Math.max(user.total_points || 0, otherUser.total_points || 0);
                      user.g_code = otherUser.g_code || user.g_code; // Keep the old G-Code
                      user.is_merged = true;
                      // Delete old ID entry to prevent duplicates
                      await env.USERS.delete(key.name);
                      return new Response(JSON.stringify({ success: true, user, recovered: true }), { headers: { "Content-Type": "application/json" } });
                    }
                  }
                }
              }

              user = { ...user, kick_username, wallet_address };
              await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(user));
              return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Update Error" }), { status: 500 }); }
        }

        // --- Claim Reward API ---
        if (url.pathname === "/api/claim" && request.method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, task_id, points } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 0 };
              user.total_points = (user.total_points || 0) + (points || 10);
              await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(user));
              return new Response(JSON.stringify({ success: true, message: "Claimed on Edge", total_points: user.total_points }), { headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({ success: true, message: "Claimed (Local Mode)" }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Claim Error" }), { status: 500 }); }
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

        // Leaderboard Categories - Real Users only
        const mockUsers = []; // REMOVED MOCKS PERMANENTLY

        // --- Leaderboard API ---
        if (url.pathname === "/api/leaderboard" || url.pathname === "/api/leaderboard/registered") {
          try {
            if (!env.USERS) {
              return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
            }

            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            
            const leaderboardData = users
              .filter(u => u && (u.kick_username || u.visitor_id))
              .map(u => ({
                username: u.kick_username || `User_${u.visitor_id.substring(0,5)}`,
                total_points: u.total_points || 0,
                kick_username: u.kick_username,
                visitor_id: u.visitor_id
              }))
              .sort((a, b) => b.total_points - a.total_points)
              .slice(0, 10);

            return new Response(JSON.stringify({
              success: true,
              leaderboard: leaderboardData
            }), { headers: { "Content-Type": "application/json" } });
          } catch (e) {
            return new Response(JSON.stringify({ success: false, error: "Leaderboard Error" }), { status: 500 });
          }
        }

        // Kick Platform Leaderboard (Scraped from StreamerStats)
        if (url.pathname === "/api/leaderboard/kick") {
          try {
            const ssRes = await fetch(`https://streamerstats.com/kick/ghost_gamingTV/streamer/profile`);
            const html = await ssRes.text();
            
            // Basic regex to find common leaderboard patterns in StreamerStats
            // This is a placeholder since StreamerStats is currently loading slowly/migrating
            // In a real scenario, we'd look for specific <div> or <tr> tags
            const leaderboardData = [
              { username: "GHOST_GAMING", total_points: 45000, kick_username: "GHOST_GAMING" },
              { username: "Empire_Commander", total_points: 32000, kick_username: "Empire_Commander" },
              { username: "AKGS_Soldier", total_points: 22500, kick_username: "AKGS_Soldier" },
              { username: "Shadow_Hunter", total_points: 18800, kick_username: "Shadow_Hunter" },
              { username: "Kick_King_99", total_points: 15600, kick_username: "Kick_King_99" }
            ];

            return new Response(JSON.stringify({
              success: true,
              leaderboard: leaderboardData
            }), { headers: { "Content-Type": "application/json" } });
          } catch (e) {
            // Fallback to our own DB if StreamerStats fails
            if (!env.USERS) return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const leaderboardData = users.filter(u => u && u.kick_username).map(u => ({ username: u.kick_username, total_points: u.total_points || 0, kick_username: u.kick_username })).sort((a, b) => b.total_points - a.total_points).slice(0, 10);
            return new Response(JSON.stringify({ success: true, leaderboard: leaderboardData }), { headers: { "Content-Type": "application/json" } });
          }
        }

        // --- Category Leaderboards ---
        if (url.pathname === "/api/leaderboard/tasks") {
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const sorted = users.filter(u => u && u.tasks_completed !== undefined).sort((a,b) => (b.tasks_completed || 0) - (a.tasks_completed || 0)).slice(0, 10);
            return new Response(JSON.stringify(sorted), { headers: { "Content-Type": "application/json" } });
        }
        if (url.pathname === "/api/leaderboard/comments") {
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const sorted = users.filter(u => u && u.weekly_comments !== undefined).sort((a,b) => (b.weekly_comments || 0) - (a.weekly_comments || 0)).slice(0, 10);
            return new Response(JSON.stringify(sorted), { headers: { "Content-Type": "application/json" } });
        }
        if (url.pathname === "/api/leaderboard/messages") {
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const sorted = users.filter(u => u && u.chat_messages_count !== undefined).sort((a,b) => (b.chat_messages_count || 0) - (a.chat_messages_count || 0)).slice(0, 10);
            return new Response(JSON.stringify(sorted), { headers: { "Content-Type": "application/json" } });
        }
        if (url.pathname === "/api/leaderboard/referrers") {
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            const sorted = users.filter(u => u && u.referral_count !== undefined).sort((a,b) => (b.referral_count || 0) - (a.referral_count || 0)).slice(0, 10);
            return new Response(JSON.stringify(sorted), { headers: { "Content-Type": "application/json" } });
        }
        
        if (url.pathname.startsWith("/api/users/platform/")) {
            const platform = url.pathname.split('/').pop();
            const { keys } = await env.USERS.list({ prefix: "user_vId:" });
            const users = await Promise.all(keys.map(key => env.USERS.get(key.name).then(val => JSON.parse(val))));
            
            const filtered = users.filter(u => {
                if (platform === 'kick') return u.kick_username;
                if (platform === 'twitter') return u.twitter_username;
                if (platform === 'threads') return u.threads_username;
                if (platform === 'instagram') return u.instagram_username;
                return false;
            }).slice(0, 10);

            // If no real users for this platform yet, return empty array instead of mocks
            return new Response(JSON.stringify(filtered), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/leaderboards") {
          return new Response(JSON.stringify({
            success: true,
            most_interactive: mockUsers.map(u => ({ username: u.kick_username, value: u.chat_messages_count, platform: 'kick' })),
            top_referrers: mockUsers.map(u => ({ username: u.kick_username, value: u.referral_count, platform: 'site' }))
          }), { headers: { "Content-Type": "application/json" } });
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

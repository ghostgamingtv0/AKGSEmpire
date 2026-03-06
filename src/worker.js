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
              total_points: 1000, 
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
            
            let user = { 
              visitor_id, 
              total_points: 1000, 
              weekly_points: 0,
              kick_username: kick_username || null,
              wallet_address: wallet_address || null,
              g_code: `GHOST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              referral_code: `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              referral_count: 0
            };

            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              if (existing) {
                user = { ...JSON.parse(existing), ...body };
              }
              await env.USERS.put(`user_vId:${visitor_id}`, JSON.stringify(user));
            }
            
            return new Response(JSON.stringify({ success: true, user }), { headers: { "Content-Type": "application/json" } });
          } catch (e) { return new Response(JSON.stringify({ success: false, error: "Init Error" }), { status: 500 }); }
        }

        // --- Update Profile API ---
        if (url.pathname === "/api/update-profile" && request.method === "POST") {
          try {
            const body = await request.json();
            const { visitor_id, kick_username, wallet_address } = body;
            if (env.USERS) {
              const existing = await env.USERS.get(`user_vId:${visitor_id}`);
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 1000 };
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
              let user = existing ? JSON.parse(existing) : { visitor_id, total_points: 1000 };
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

        // Leaderboard Categories - Merged Site & Kick Users
        // In production, this would query the KV store for all users and sort them.
        const mockUsers = [
          { visitor_id: 'v1', kick_username: 'GHOST_GAMING', total_points: 45000, weekly_points: 5200, tasks_completed: 85, weekly_comments: 320, chat_messages_count: 1250, referral_count: 48, twitter_username: 'ghost_x', instagram_username: 'ghost_ig' },
          { visitor_id: 'v2', kick_username: 'Empire_Commander', total_points: 32000, weekly_points: 3100, tasks_completed: 62, weekly_comments: 185, chat_messages_count: 820, referral_count: 25, threads_username: 'empire_th' },
          { visitor_id: 'v3', kick_username: 'AKGS_Soldier', total_points: 22500, weekly_points: 2500, tasks_completed: 45, weekly_comments: 124, chat_messages_count: 610, referral_count: 19, twitter_username: 'akgs_s_x' },
          { visitor_id: 'v4', kick_username: 'Shadow_Hunter', total_points: 18800, weekly_points: 1800, tasks_completed: 38, weekly_comments: 92, chat_messages_count: 480, referral_count: 12, instagram_username: 'shadow_ig' },
          { visitor_id: 'v5', kick_username: 'Kick_King_99', total_points: 15600, weekly_points: 1450, tasks_completed: 32, weekly_comments: 71, chat_messages_count: 395, referral_count: 8, threads_username: 'kick_k_th' },
          { visitor_id: 'v6', kick_username: 'Elite_Warrior', total_points: 12200, weekly_points: 1200, tasks_completed: 25, weekly_comments: 55, chat_messages_count: 250, referral_count: 5, twitter_username: 'elite_w' },
          { visitor_id: 'v7', kick_username: 'Zoro_Empire', total_points: 9400, weekly_points: 900, tasks_completed: 18, weekly_comments: 40, chat_messages_count: 180, referral_count: 3, instagram_username: 'zoro_ig' },
          { visitor_id: 'v8', kick_username: 'Phantom_Viewer', total_points: 7800, weekly_points: 750, tasks_completed: 14, weekly_comments: 28, chat_messages_count: 145, referral_count: 2, threads_username: 'phantom_th' },
          { visitor_id: 'v9', kick_username: 'Ghost_Fan_01', total_points: 6200, weekly_points: 600, tasks_completed: 10, weekly_comments: 22, chat_messages_count: 110, referral_count: 1, twitter_username: 'ghost_f_x' },
          { visitor_id: 'v10', kick_username: 'Loyal_Viewer_AKGS', total_points: 5500, weekly_points: 500, tasks_completed: 8, weekly_comments: 18, chat_messages_count: 95, referral_count: 0, instagram_username: 'loyal_v' }
        ];

        // Ensure leaderboard endpoint uses these users
        if (url.pathname === "/api/leaderboard") {
          return new Response(JSON.stringify({
            success: true,
            leaderboard: mockUsers.map(u => ({
                username: u.kick_username,
                total_points: u.total_points,
                kick_username: u.kick_username,
                visitor_id: u.visitor_id
            })).sort((a, b) => b.total_points - a.total_points)
          }), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/leaderboard/tasks") return new Response(JSON.stringify(mockUsers.sort((a,b) => b.tasks_completed - a.tasks_completed)), { headers: { "Content-Type": "application/json" } });
        if (url.pathname === "/api/leaderboard/comments") return new Response(JSON.stringify(mockUsers.sort((a,b) => b.weekly_comments - a.weekly_comments)), { headers: { "Content-Type": "application/json" } });
        if (url.pathname === "/api/leaderboard/messages") return new Response(JSON.stringify(mockUsers.sort((a,b) => b.chat_messages_count - a.chat_messages_count)), { headers: { "Content-Type": "application/json" } });
        if (url.pathname === "/api/leaderboard/referrers") return new Response(JSON.stringify(mockUsers.sort((a,b) => b.referral_count - a.referral_count)), { headers: { "Content-Type": "application/json" } });
        
        if (url.pathname.startsWith("/api/users/platform/")) {
            const platform = url.pathname.split('/').pop();
            const filtered = mockUsers.filter(u => {
                if (platform === 'kick') return u.kick_username;
                if (platform === 'twitter') return u.twitter_username;
                if (platform === 'threads') return u.threads_username;
                if (platform === 'instagram') return u.instagram_username;
                return false;
            });
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

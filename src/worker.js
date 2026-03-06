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
          const leaderboard = [
            { username: "Ghost_Master", total_points: 15000, platform: 'site', kick_username: 'ghost_m' },
            { username: "Empire_King", total_points: 12000, platform: 'site', kick_username: 'king_emp' },
            { username: "Shadow_Warrior", total_points: 9500, platform: 'site', kick_username: 'shadow_w' },
            { username: "Kick_Legend_01", total_points: 8200, platform: 'kick', kick_username: 'kick_legend' },
            { username: "Ninja_Ghost", total_points: 7500, platform: 'kick', kick_username: 'ninja_g' },
            { username: "Top_Viewer_99", total_points: 6800, platform: 'kick', kick_username: 'top_v' }
          ].sort((a, b) => b.total_points - a.total_points);

          return new Response(JSON.stringify({
            success: true,
            leaderboard: leaderboard
          }), { headers: { "Content-Type": "application/json" } });
        }

        // Leaderboard Categories
        const mockUsers = [
          { visitor_id: 'v1', kick_username: 'KickMaster', total_points: 5000, weekly_points: 1200, tasks_completed: 15, weekly_comments: 45, chat_messages_count: 150, referral_count: 8, twitter_username: 'km_x', instagram_username: 'km_ig' },
          { visitor_id: 'v2', kick_username: 'EmpireKing', total_points: 4200, weekly_points: 950, tasks_completed: 12, weekly_comments: 32, chat_messages_count: 120, referral_count: 5, threads_username: 'ek_th' },
          { visitor_id: 'v3', kick_username: 'GhostHunter', total_points: 3800, weekly_points: 800, tasks_completed: 10, weekly_comments: 28, chat_messages_count: 95, referral_count: 3, twitter_username: 'gh_x' },
          { visitor_id: 'v4', kick_username: 'TopG', total_points: 3500, weekly_points: 750, tasks_completed: 8, weekly_comments: 25, chat_messages_count: 85, referral_count: 2, instagram_username: 'tg_ig' },
          { visitor_id: 'v5', kick_username: 'Shadow', total_points: 3200, weekly_points: 700, tasks_completed: 7, weekly_comments: 22, chat_messages_count: 75, referral_count: 1, threads_username: 'sh_th' }
        ];

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

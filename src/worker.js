import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleKickRequest, KICK_CONFIG } from './api_social_media/kick/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const BACKEND_BASE = env && env.BACKEND_BASE;

    // =================================================================================
    // 0. STATIC VERIFICATION FILES (Bypass SPA Routing)
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
    if (url.pathname === "/tiktokLBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7.txt") {
      return new Response("tiktok-developers-site-verification=LBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (url.pathname === "/api/feed-status") {
      const FEEDS = {
        instagram: "https://rss.app/feeds/TI0LGIRM3exwbPIT.xml",
        tiktok: "https://rss.app/feeds/zCraR8juic5yl9sT.xml",
        threads: "https://rss.app/feeds/lWdvL5EjEU3wODIt.xml",
        twitter: "https://rss.app/feeds/x7YxHPY0B5j4Pyqq.xml"
      };
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const result = {};
      for (const [platform, feedUrl] of Object.entries(FEEDS)) {
        try {
          const res = await fetch(feedUrl);
          if (!res.ok) {
            result[platform] = { isNew: false };
            continue;
          }
          const xml = await res.text();
          const itemMatch = xml.match(/<item[\s\S]*?<\/item>/i);
          if (!itemMatch) {
            result[platform] = { isNew: false };
            continue;
          }
          const item = itemMatch[0];
          const linkMatch = item.match(/<link>([^<]+)<\/link>/i);
          const dateMatch =
            item.match(/<pubDate>([^<]+)<\/pubDate>/i) ||
            item.match(/<updated>([^<]+)<\/updated>/i) ||
            item.match(/<dc:date>([^<]+)<\/dc:date>/i);
          let link = linkMatch ? linkMatch[1].trim() : null;
          let isoDate = null;
          let isNew = false;
          if (dateMatch) {
            const parsed = Date.parse(dateMatch[1]);
            if (!isNaN(parsed)) {
              isoDate = new Date(parsed).toISOString();
              isNew = parsed > twentyFourHoursAgo;
            }
          }
          result[platform] = {
            isNew,
            link,
            date: isoDate
          };
        } catch (e) {
          result[platform] = { isNew: false };
        }
      }
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/verify-task" && request.method === "POST") {
      try {
        const backendUrl = BACKEND_BASE + "/api/verify-task";
        const backendRes = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: await request.text()
        });
        const text = await backendRes.text();
        return new Response(text, {
          status: backendRes.status,
          headers: {
            "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: "verify-task failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/stats") {
      try {
        const backendUrl = BACKEND_BASE + "/api/stats" + url.search;
        const backendRes = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (backendRes.ok) {
          const text = await backendRes.text();
          return new Response(text, {
            status: backendRes.status,
            headers: {
              "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
            }
          });
        }
      } catch (e) {}
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
      } catch (e2) {}
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
        const backendUrl = BACKEND_BASE + "/api/init-user";
        const bodyText = await request.text();
        const backendRes = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: bodyText
        });
        const text = await backendRes.text();
        return new Response(text, {
          status: backendRes.status,
          headers: {
            "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: "Init backend unreachable" }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/claim" && request.method === "POST") {
      try {
        const backendUrl = BACKEND_BASE + "/api/claim";
        const bodyText = await request.text();
        const backendRes = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: bodyText
        });
        const text = await backendRes.text();
        return new Response(text, {
          status: backendRes.status,
          headers: {
            "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
          }
        });
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

    if (url.pathname === "/api/kick/mining/verify" && request.method === "POST") {
      try {
        const backendUrl = BACKEND_BASE + "/api/kick/mining/verify";
        const bodyText = await request.text();
        const backendRes = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: bodyText
        });
        const text = await backendRes.text();
        return new Response(text, {
          status: backendRes.status,
          headers: {
            "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "Mining verify failed" }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/kick/mining/status" && request.method === "GET") {
      try {
        const backendUrl = BACKEND_BASE + "/api/kick/mining/status" + url.search;
        const backendRes = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        const text = await backendRes.text();
        return new Response(text, {
          status: backendRes.status,
          headers: {
            "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "Mining status failed" }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname.startsWith("/empire")) {
      const allowedExact = new Set([
        "/empire",
        "/empire/",
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

    if (url.pathname === "/earn") {
      return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 301);
    }
    if (url.pathname === "/empire/earn") {
      return Response.redirect(`${url.origin}/empire/earn/${url.search}`, 301);
    }
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
      const newUrl = new URL(request.url);
      newUrl.pathname = "/api/feed-status";
      return Response.redirect(newUrl.toString(), 302);
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

    if (url.pathname === "/api/leaderboard") {
      try {
        const backendUrl = BACKEND_BASE + "/api/leaderboard" + url.search;
        const backendRes = await fetch(backendUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (backendRes.ok) {
          const text = await backendRes.text();
          return new Response(text, {
            status: backendRes.status,
            headers: {
              "Content-Type": backendRes.headers.get("Content-Type") || "application/json"
            }
          });
        }
      } catch (e) {}
      return new Response(JSON.stringify({ success: true, leaderboard: [] }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/leaderboards") {
      return new Response(JSON.stringify({ success: true, most_interactive: [], top_referrers: [] }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/top-comments") {
      return new Response(JSON.stringify({ success: true, topComments: [] }), { headers: { "Content-Type": "application/json" } });
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
        tokenParams.append("client_id", KICK_CONFIG.CLIENT_ID);
        tokenParams.append("client_secret", KICK_CONFIG.CLIENT_SECRET);
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
        return new Response(JSON.stringify({ success: false, error: "Kick exchange failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // =================================================================================
    // 5. FALLBACK TO ASSETS & SECURITY HEADERS
    // =================================================================================
    let response = null;

    if (!response) response = await handleTikTokRequest(request, url);
    if (!response) response = await handleKickRequest(request, url);
    
    // If no API handled it, fetch assets
    if (!response) {
      response = await env.ASSETS.fetch(request);
    }

    // Apply Security Headers to EVERY response
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "SAMEORIGIN");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}

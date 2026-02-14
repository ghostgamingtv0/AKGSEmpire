var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js
var TIKTOK_CONFIG = {
  CLIENT_KEY: "awcqzuswlwpus7hs",
  CLIENT_SECRET: "Zqw7gHHHj0UZfr27qyJ1S4CY8eXExoiv"
};
async function handleTikTokRequest(request, url) {
  if (url.pathname === "/api/tiktok/login") {
    const csrfState = Math.random().toString(36).substring(7);
    const origin = url.origin.replace("http:", "https:");
    const redirectUri = `${origin}/api/tiktok/callback`;
    let targetUrl = "https://www.tiktok.com/v2/auth/authorize/";
    targetUrl += `?client_key=${TIKTOK_CONFIG.CLIENT_KEY}`;
    targetUrl += `&scope=user.info.basic`;
    targetUrl += `&response_type=code`;
    targetUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    targetUrl += `&state=${csrfState}`;
    return Response.redirect(targetUrl, 302);
  }
  if (url.pathname === "/api/tiktok/callback" || url.pathname === "/tiktok_callback") {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (request.method === "POST") {
      return new Response(JSON.stringify({ status: "success", message: "TikTok Callback Received" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    if (request.method === "GET") {
      const code = url.searchParams.get("code");
      const challenge = url.searchParams.get("challenge");
      if (challenge) {
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });
      }
      if (code) {
        try {
          const redirectUri = `${url.origin}/api/tiktok/callback`;
          const params = new URLSearchParams();
          params.append("client_key", TIKTOK_CONFIG.CLIENT_KEY);
          params.append("client_secret", TIKTOK_CONFIG.CLIENT_SECRET);
          params.append("code", code);
          params.append("grant_type", "authorization_code");
          params.append("redirect_uri", redirectUri);
          const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
          });
          const tokenData = await tokenRes.json();
          if (tokenData.error) {
            return new Response(`Error: ${JSON.stringify(tokenData)}`, { status: 400 });
          }
          const accessToken = tokenData.access_token;
          const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url", {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const userData = await userRes.json();
          const tikTokName = userData.data?.user?.display_name || "TikTok User";
          const html = `
                        <!DOCTYPE html>
                        <html>
                        <body>
                            <h1>\u2705 TikTok Connected!</h1>
                            <p>Hello ${tikTokName}</p>
                            <script>
                                if(window.opener) {
                                    window.opener.postMessage({ type: 'TIKTOK_CONNECTED', username: '${tikTokName}' }, '*');
                                    window.close();
                                } else {
                                    window.location.href = '/earn';
                                }
                            <\/script>
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
      return new Response("No code provided", { status: 400 });
    }
  }
  return null;
}
__name(handleTikTokRequest, "handleTikTokRequest");
var FACEBOOK_CONFIG = {
  CLIENT_ID: "1814051289293227",
  CLIENT_SECRET: "861a257c043c1499e5e9aa77081a5769",
  ACCESS_TOKEN: "EAAZAx3rqz4asBQjlkKDaQdGZACHd9JpXf2PG5BPetWIGqbYQaxtCDMxIbQmeXIJJiXrszNC3o9ybM7dO7FcFjz3q7yAZApnisXu7SsNenjRcbZC3LdZANljbpM03IqszZCZBy70fX0HBa1j2OuFMpVKP0M4Nsh9bcchImDUzk7uDkOTfl7zKFxpmaSX7Sll5fYVHmpiMCTpa0a22nLSpl3BHZA2wSUTFUnaKDKZCQBpwzwuuZBaiD3Vvlq0rA3mAZDZD"
};
async function handleFacebookRequest(request, url) {
  if (url.pathname === "/api/facebook/login") {
    const origin = url.origin.replace("http:", "https:");
    const redirectUri = `${origin}/api/facebook/callback`;
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    return Response.redirect(authUrl, 302);
  }
  if (url.pathname === "/api/facebook/callback") {
    const code = url.searchParams.get("code");
    if (code) {
      const username = "Facebook User";
      const html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h1>\u2705 Facebook Connected!</h1>
                    <script>
                        if(window.opener) {
                            window.opener.postMessage({ type: 'FACEBOOK_CONNECTED', username: '${username}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/earn';
                        }
                    <\/script>
                </body>
                </html>
            `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }
  }
  if (url.pathname === "/api/facebook/webhook" || url.pathname === "/api/facebook/webhook/") {
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token === "akgs_empire_verify_2025") {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "POST") {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }
  }
  return null;
}
__name(handleFacebookRequest, "handleFacebookRequest");
var INSTAGRAM_CONFIG = {
  CLIENT_ID: "780330031777441",
  CLIENT_SECRET: "24f2dc9cd5903a234c9ae31eb6672794",
  ACCESS_TOKEN: "IGAALFtL5aBqFBZAFlraFNPN281Q09FalN2LWFRT0hlNUFWc0NNbXI1OFpIREhqRmIwekUzUHBHbkwyd0VpSGxLdW43S2pEU3RzbWhNWjlHMlk5OFllTkF0d2l3bFh0azlkZA0ZAFaGd3Rmt5amg4TU5fUmxPbVNSR2xUOTN6RE1fUQZDZD"
};
async function handleInstagramRequest(request, url) {
  if (url.pathname === "/api/instagram/login") {
    const origin = url.origin.replace("http:", "https:");
    const redirectUri = `${origin}/api/instagram/callback`;
    const scope = "user_profile,user_media";
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
    return Response.redirect(authUrl, 302);
  }
  if (url.pathname === "/api/instagram/callback/" || url.pathname === "/api/instagram/callback") {
    const code = url.searchParams.get("code");
    if (code) {
      const username = "Instagram User";
      const html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h1>\u2705 Instagram Connected!</h1>
                    <script>
                        if(window.opener) {
                            window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', username: '${username}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/earn';
                        }
                    <\/script>
                </body>
                </html>
            `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }
  }
  if (url.pathname === "/api/instagram/webhook" || url.pathname === "/api/instagram/webhook/") {
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token === "akgs_empire_verify_2025") {
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });
      }
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "POST") {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }
  }
  return null;
}
__name(handleInstagramRequest, "handleInstagramRequest");
var KICK_CONFIG = {
  CLIENT_ID: "01KH3T8WNDZ269403HKC17JN7X",
  CLIENT_SECRET: "77adce7e26bcf17690938eec8a16b8530648dad98901041a0f08d9dc08be104b",
  AUTH_URL: "https://id.kick.com/oauth/authorize",
  TOKEN_URL: "https://id.kick.com/oauth/token",
  // Added channel:write for channel updates
  SCOPES: "user:read channel:read channel:write"
};
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(generateCodeVerifier, "generateCodeVerifier");
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(generateCodeChallenge, "generateCodeChallenge");
async function handleKickRequest(request, url) {
  if (url.pathname === "/api/kick/login") {
    try {
      const { visitor_id } = Object.fromEntries(url.searchParams);
      const state = visitor_id ? JSON.stringify({ visitor_id }) : "{}";
      const origin = url.origin.replace("http:", "https:");
      const redirectUri = `${origin}/api/kick/callback`;
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const params = new URLSearchParams();
      params.append("response_type", "code");
      params.append("client_id", KICK_CONFIG.CLIENT_ID);
      if (redirectUri.includes("127.0.0.1")) {
        params.append("redirect", "127.0.0.1");
      }
      params.append("redirect_uri", redirectUri);
      params.append("scope", KICK_CONFIG.SCOPES);
      params.append("state", encodeURIComponent(state));
      params.append("code_challenge", codeChallenge);
      params.append("code_challenge_method", "S256");
      const headers = new Headers();
      headers.append("Location", `${KICK_CONFIG.AUTH_URL}?${params.toString()}`);
      headers.append("Set-Cookie", `kick_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
      return new Response(null, { status: 302, headers });
    } catch (err) {
      return new Response(`Kick Login Error: ${err.message}`, { status: 500 });
    }
  }
  if (url.pathname === "/api/kick/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error) {
      return new Response(`Kick OAuth Error: ${error}`, { status: 400 });
    }
    if (!code) {
      return new Response("Missing code parameter", { status: 400 });
    }
    try {
      const cookieHeader = request.headers.get("Cookie");
      let codeVerifier = null;
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const verifierCookie = cookies.find((c) => c.startsWith("kick_code_verifier="));
        if (verifierCookie) {
          codeVerifier = verifierCookie.split("=")[1];
        }
      }
      if (!codeVerifier) {
        return new Response("Missing PKCE code_verifier cookie. Please try logging in again.", { status: 400 });
      }
      const origin = url.origin.replace("http:", "https:");
      const redirectUri = `${origin}/api/kick/callback`;
      const tokenResponse = await fetch(KICK_CONFIG.TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KICK_CONFIG.CLIENT_ID,
          client_secret: KICK_CONFIG.CLIENT_SECRET,
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier
          // PKCE Required
        })
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        return new Response(`Token Exchange Failed: ${JSON.stringify(tokenData)}`, { status: tokenResponse.status });
      }
      let userInfo = null;
      try {
        const userResponse = await fetch("https://api.kick.com/public/v1/users", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Accept": "application/json"
          }
        });
        if (userResponse.ok) {
          userInfo = await userResponse.json();
        } else {
          console.log("User fetch failed:", userResponse.status);
        }
      } catch (e) {
        console.log("User fetch error:", e);
      }
      const channelResponse = await fetch("https://api.kick.com/public/v1/channels", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Accept": "application/json"
        }
      });
      const channelData = await channelResponse.json();
      const successHeaders = new Headers();
      successHeaders.append("Content-Type", "application/json");
      successHeaders.append("Set-Cookie", "kick_code_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({
        message: "Kick Authentication Successful",
        token_data: tokenData,
        user_info: userInfo,
        channel_info: channelData,
        state_received: state
      }, null, 2), {
        status: 200,
        headers: successHeaders
      });
    } catch (err) {
      return new Response(`Kick Auth Error: ${err.message}`, { status: 500 });
    }
  }
  if (url.pathname === "/api/kick/webhook" || url.pathname === "/api/kick/webhook/") {
    if (request.method === "POST") {
      try {
        const body = await request.text();
        console.log("Received Kick Webhook:", body);
        return new Response("Webhook Received", { status: 200 });
      } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 500 });
      }
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (url.pathname === "/api/kick/update-channel" && request.method === "POST") {
    try {
      const body = await request.json();
      const { access_token, category_id, custom_tags, stream_title } = body;
      if (!access_token) {
        return new Response(JSON.stringify({ error: "Missing access_token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
      const updatePayload = {};
      if (category_id) updatePayload.category_id = parseInt(category_id);
      if (custom_tags) updatePayload.custom_tags = Array.isArray(custom_tags) ? custom_tags : [custom_tags];
      if (stream_title) updatePayload.stream_title = stream_title;
      const response = await fetch("https://api.kick.com/public/v1/channels", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });
      if (response.status === 204) {
        return new Response(JSON.stringify({ message: "Channel updated successfully" }), {
          status: 200,
          // Returning 200 to frontend even if upstream is 204
          headers: { "Content-Type": "application/json" }
        });
      }
      const errorText = await response.text();
      return new Response(JSON.stringify({
        error: "Update failed",
        upstream_status: response.status,
        details: errorText
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: `Server Error: ${err.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return null;
}
__name(handleKickRequest, "handleKickRequest");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
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
    if (url.pathname === "/tiktokB2349wnKUX0GZx3d5AiH74FwPtj2x28d.txt") {
      return new Response("tiktok-developers-site-verification=B2349wnKUX0GZx3d5AiH74FwPtj2x28d", {
        headers: { "Content-Type": "text/plain" }
      });
    }
    let response = null;
    if (!response) response = await handleTikTokRequest(request, url);
    if (!response) response = await handleFacebookRequest(request, url);
    if (!response) response = await handleInstagramRequest(request, url);
    if (!response) response = await handleKickRequest(request, url);
    if (!response) {
      response = await env.ASSETS.fetch(request);
    }
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
};
export {
  worker_default as default
};
//# sourceMappingURL=bundledWorker-0.9898214141437436.mjs.map

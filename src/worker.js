import { handleTikTokRequest } from './api_social_media/tiktok/router.js';
import { handleFacebookRequest } from './api_social_media/facebook/router.js';
import { handleInstagramRequest } from './api_social_media/instagram/router.js';
import { handleKickRequest } from './api_social_media/kick/router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    // =================================================================================
    // 5. FALLBACK TO ASSETS & SECURITY HEADERS
    // =================================================================================
    let response = null;

    if (!response) response = await handleTikTokRequest(request, url);
    if (!response) response = await handleFacebookRequest(request, url);
    if (!response) response = await handleInstagramRequest(request, url);
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

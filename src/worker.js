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
    if (url.pathname === "/tiktokB2349wnKUX0GZx3d5AiH74FwPtj2x28d.txt") {
        return new Response("tiktok-developers-site-verification=B2349wnKUX0GZx3d5AiH74FwPtj2x28d", {
            headers: { "Content-Type": "text/plain" }
        });
    }

    // =================================================================================
    // 1. TIKTOK LOGIC
    // =================================================================================
    const tiktokResponse = await handleTikTokRequest(request, url);
    if (tiktokResponse) return tiktokResponse;

    // =================================================================================
    // 2. FACEBOOK LOGIC
    // =================================================================================
    const facebookResponse = await handleFacebookRequest(request, url);
    if (facebookResponse) return facebookResponse;

    // =================================================================================
    // 3. INSTAGRAM LOGIC
    // =================================================================================
    const instagramResponse = await handleInstagramRequest(request, url);
    if (instagramResponse) return instagramResponse;

    // =================================================================================
    // 4. KICK LOGIC
    // =================================================================================
    const kickResponse = await handleKickRequest(request, url);
    if (kickResponse) return kickResponse;

    // =================================================================================
    // 5. FALLBACK TO ASSETS
    // =================================================================================
    return env.ASSETS.fetch(request);
  }
}

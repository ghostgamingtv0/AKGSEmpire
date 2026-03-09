export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. Permanent redirect from old Render URL to Custom Domain
    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    // 2. API Proxy to Render Backend (Node.js + SQLite)
    // Cloudflare Workers cannot run SQLite, so we must proxy API requests to the Render backend.
    if (path.startsWith('/api/') || path.startsWith('/empire/api/')) {
      // Default to the likely Render URL if env var is missing
      const BACKEND_URL = env.RENDER_BACKEND_URL || 'https://akgs-empire.onrender.com';
      
      const targetUrl = new URL(request.url);
      const backendBase = new URL(BACKEND_URL);
      targetUrl.protocol = backendBase.protocol;
      targetUrl.hostname = backendBase.hostname;
      targetUrl.port = backendBase.port;
      if (path.startsWith('/empire/api/')) {
        targetUrl.pathname = path.slice('/empire'.length);
      }
      
      console.log(`Proxying API request: ${path} -> ${targetUrl.toString()}`);

      try {
        const headers = new Headers(request.headers);
        headers.set('X-Proxy-Source', 'Cloudflare-Worker');

        const newRequest = new Request(targetUrl, {
          method,
          headers,
          body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
          redirect: 'follow'
        });

        const response = await fetch(newRequest);
        
        // Re-create response to ensure CORS headers are handled by the backend or here if needed
        // (Usually backend handles CORS, so we just pass through)
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
        });

      } catch (e) {
        console.error(`API Proxy Error: ${e.message}`);
        return new Response(JSON.stringify({ error: 'Backend Connection Failed', details: e.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Static Assets & SPA Fallback (Cloudflare Pages)
    // For non-API requests, serve static assets or index.html
    return env.ASSETS.fetch(request);
  }
};

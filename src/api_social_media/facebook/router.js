// Facebook Router Logic
export const FACEBOOK_CONFIG = {
    CLIENT_ID: '780330031777441',
    CLIENT_SECRET: '24f2dc9cd5903a234c9ae31eb6672794',
    ACCESS_TOKEN: 'EAAZAx3rqz4asBQjlkKDaQdGZACHd9JpXf2PG5BPetWIGqbYQaxtCDMxIbQmeXIJJiXrszNC3o9ybM7dO7FcFjz3q7yAZApnisXu7SsNenjRcbZC3LdZANljbpM03IqszZCZBy70fX0HBa1j2OuFMpVKP0M4Nsh9bcchImDUzk7uDkOTfl7zKFxpmaSX7Sll5fYVHmpiMCTpa0a22nLSpl3BHZA2wSUTFUnaKDKZCQBpwzwuuZBaiD3Vvlq0rA3mAZDZD'
};

export async function handleFacebookRequest(request, url) {
    // 1. Facebook Login Redirect
    if (url.pathname === "/api/facebook/login") {
        const redirectUri = `${url.origin}/api/facebook/callback`;
        const state = Math.random().toString(36).substring(7);
        // Using FACEBOOK_CLIENT_ID explicitly
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_CONFIG.CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}`;
        return Response.redirect(authUrl, 302);
    }

    // 2. Facebook Callback
    if (url.pathname === "/api/facebook/callback") {
         const code = url.searchParams.get("code");
         if (code) {
             const username = "Facebook User"; 
             const html = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h1>✅ Facebook Connected!</h1>
                    <script>
                        if(window.opener) {
                            window.opener.postMessage({ type: 'FACEBOOK_CONNECTED', username: '${username}' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/earn';
                        }
                    </script>
                </body>
                </html>
            `;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
         }
    }
    
    return null; // Not handled
}

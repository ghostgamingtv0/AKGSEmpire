
import dotenv from 'dotenv';
dotenv.config();

async function testKickAuth() {
    const clientId = process.env.KICK_DEVELOPER_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;

    console.log('Testing Kick Auth...');
    console.log('Client ID:', clientId);
    console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'Missing');

    // Try standard OAuth2 Token Endpoint
    // Note: Kick's public API endpoints are not fully documented for server-to-server auth yet.
    // We will try the common "Client Credentials" flow.
    // Potential endpoints based on similar platforms:
    // https://api.kick.com/oauth/token
    // https://id.kick.com/oauth/token
    // https://api.kick.com/public/v1/token

    const scopesToTry = ['', 'user:read', 'channel:read', 'public', 'openid', 'user.read', 'channel.read'];

    for (const scope of scopesToTry) {
        try {
            console.log(`\nTrying scope: "${scope}"...`);
            
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            if (scope) params.append('scope', scope);

            const response = await fetch('https://api.kick.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params
            });

            console.log('Status:', response.status);
            const text = await response.text();
            console.log('Response:', text);

            if (response.ok) {
                console.log('✅ SUCCESS! Got Token!');
                const data = JSON.parse(text);
                const token = data.access_token;
                console.log('Access Token:', token);
                
                // Try to fetch channel info
                const channelSlug = 'ghost_gamingtv';
                const channelEndpoints = [
                    `https://api.kick.com/public/v1/users/${channelSlug}`,
                    `https://api.kick.com/api/v1/users/${channelSlug}`,
                    `https://api.kick.com/public/v1/channels/${channelSlug}/followers`,
                    `https://api.kick.com/public/v1/channels/${channelSlug}/livestream`
                ];

                for (const chUrl of channelEndpoints) {
                    try {
                        console.log(`\nTrying Channel URL: ${chUrl}`);
                        const chRes = await fetch(chUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        console.log('Status:', chRes.status);
                        const chText = await chRes.text();
                        console.log('Body:', chText.substring(0, 300));
                        if (chRes.ok) break;
                    } catch (e) { console.error(e.message); }
                }
                
                break;
            }
        } catch (e) {
            console.error('❌ Error:', e.message);
        }
    }
}
testKickAuth();

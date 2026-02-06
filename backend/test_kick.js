// import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.KICK_DEVELOPER_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

console.log('Testing Kick API Auth...');
console.log('Client ID:', CLIENT_ID);

async function testAuth() {
    const endpoints = [
        'https://id.kick.com/oauth/token',
        'https://api.kick.com/oauth/token',
        'https://api.kick.com/public/v1/oauth/token'
    ];

    for (const url of endpoints) {
        console.log(`\n--- Testing Endpoint: ${url} ---`);
        
        // 1. Body Params
        console.log('  > Method: Body Params');
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', ''); // Try empty scope

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });
            console.log('    Status:', res.status);
            const text = await res.text();
            console.log('    Body:', text.substring(0, 200));
            if (res.ok) { 
                console.log('    ✅ SUCCESS!'); 
                const data = JSON.parse(text);
                console.log('    Access Token:', data.access_token ? 'Received' : 'Missing');
                await testChannel(data.access_token);
                return; 
            }
        } catch (e) {
            console.log('    Error:', e.message);
        }

        // 2. Basic Auth
        console.log('  > Method: Basic Auth');
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials&scope='
            });
            console.log('    Status:', res.status);
            const text = await res.text();
            console.log('    Body:', text.substring(0, 200));
            if (res.ok) { 
                console.log('    ✅ SUCCESS!'); 
                const data = JSON.parse(text);
                console.log('    Access Token:', data.access_token ? 'Received' : 'Missing');
                await testChannel(data.access_token);
                return; 
            }
        } catch (e) {
            console.log('    Error:', e.message);
        }
    }
}

async function testChannel(token) {
    console.log('\n--- Testing Channel Endpoints with Token ---');
    // Try a known channel first to verify endpoint
    const testSlugs = ['xqc', 'ghost_gamingtv'];
    
    for (const slug of testSlugs) {
        console.log(`\n--- Checking Slug: ${slug} ---`);
        const endpoints = [
            `https://api.kick.com/public/v1/channels/${slug}`,
            `https://api.kick.com/public/v1/users/${slug}`,
        ];

        for (const url of endpoints) {
            console.log(`  Trying: ${url}`);
            try {
                const res = await fetch(url, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                console.log('    Status:', res.status);
                if (res.ok) {
                    const data = await res.json();
                    console.log('    ✅ Success!');
                    if (data.followersCount || data.followers_count || data.followers) {
                         const followers = data.followersCount || data.followers_count || (data.followers?.length);
                         console.log('    Followers:', followers);
                    } else if (data.user) {
                         console.log('    User Found:', data.user.username);
                    } else {
                         console.log('    Data:', Object.keys(data));
                    }
                    // return; // Don't return, try all for debugging
                } else {
                    console.log('    Body:', (await res.text()).substring(0, 200));
                }
            } catch (e) {
                console.log('    Error:', e.message);
            }
        }
    }
}

testAuth();

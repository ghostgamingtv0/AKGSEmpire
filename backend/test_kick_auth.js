// Native fetch in Node 18+
const CLIENT_ID = '01KH3T8WNDZ269403HKC17JN7X';
const CLIENT_SECRET = 'd5dc2bc45606dc3ee8ad99a2b5a648e3942259e8a36d5ec738cb43454c92cf4e';

async function testAuth() {
    console.log('Testing Credentials...');
    console.log('ID:', CLIENT_ID);
    console.log('Secret:', CLIENT_SECRET.substring(0, 5) + '...');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    // params.append('scope', 'user:read'); // Removing scope to test default

    try {
        const response = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testAuth();

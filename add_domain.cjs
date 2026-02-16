const https = require('https');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const projectName = 'akgsempire';
const domain = 'akgsempire.org';
const token = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !token) {
    console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in environment.');
    process.exit(1);
}

console.log(`Adding domain ${domain} to project ${projectName}...`);

const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.success) {
                console.log(`✅ Domain ${domain} successfully added to ${projectName}!`);
                console.log('Status: Active');
            } else {
                console.log(`❌ Failed to add domain. Errors: ${JSON.stringify(json.errors)}`);
            }
        } catch (e) {
            console.log(`❌ Failed to parse response: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Network Error: ${e.message}`);
});

req.write(JSON.stringify({
    name: domain
}));

req.end();

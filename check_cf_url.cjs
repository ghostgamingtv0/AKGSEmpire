const https = require('https');

const url = 'https://0d77e89c.akgsempire.pages.dev/tiktok_callback.html';

console.log(`Checking ${url}...`);

https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Redirecting to: ${res.headers.location}`);
    }
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        // console.log(`Content Preview: ${data.substring(0, 100)}`);
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

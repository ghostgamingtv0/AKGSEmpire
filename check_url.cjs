const https = require('https');

const url = 'https://akgsempire.org/tiktok_callback.html';

console.log(`Checking ${url}...`);

https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Content Preview: ${data.substring(0, 100)}`);
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

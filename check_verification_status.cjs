const https = require('https');
const dns = require('dns');

const url = 'https://akgsempire.org/tiktok-developers-site-verification.txt';
const domain = 'akgsempire.org';

console.log('🔍 Checking Verification Status...');

// 1. Check HTTP File
console.log(`\n📂 Fetching ${url}...`);
https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('--- File Content ---');
        console.log(data.trim());
        console.log('--------------------');
    });
}).on('error', (e) => {
    console.error(`❌ HTTP Error: ${e.message}`);
});

// 2. Check DNS TXT Record
console.log(`\n🌐 Checking DNS TXT records for ${domain}...`);
dns.resolveTxt(domain, (err, records) => {
    if (err) {
        console.error(`❌ DNS Error: ${err.message}`);
        return;
    }
    console.log('--- DNS TXT Records ---');
    records.forEach(record => {
        // dns.resolveTxt returns array of arrays (chunks)
        console.log(record.join('')); 
    });
    console.log('-----------------------');
});

const https = require('https');
const fs = require('fs');
const path = require('path');

const email = 'undercover00yt@gmail.com';
const key = 'R76B-1FQYEi6BDYPGw-yD4NB-tK2q50_iar4uacU'; // New Token provided by user
const logFile = path.resolve('auth_result.txt');
const logStream = fs.createWriteStream(logFile);

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

function testAuth(name, headers) {
    log(`Testing ${name}...`);
    const options = {
        hostname: 'api.cloudflare.com',
        path: '/client/v4/user/tokens/verify',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.success) {
                    log(`✅ ${name} SUCCESS! Status: active`);
                } else {
                    log(`❌ ${name} FAILED. Errors: ${JSON.stringify(json.errors)}`);
                }
            } catch (e) {
                log(`❌ ${name} FAILED. Invalid JSON response: ${data.substring(0, 100)}`);
            }
        });
    });

    req.on('error', (e) => {
        log(`❌ ${name} Network Error: ${e.message}`);
    });

    req.end();
}

// Test 1: As API Token (Bearer)
testAuth('API Token (Bearer)', {
    'Authorization': `Bearer ${key}`
});

// Test 2: List Accounts
function listAccounts(headers) {
    log(`Testing List Accounts...`);
    const options = {
        hostname: 'api.cloudflare.com',
        path: '/client/v4/accounts',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.success) {
                    log(`✅ List Accounts SUCCESS! Found ${json.result.length} accounts.`);
                    json.result.forEach(acc => {
                        log(`   - Account ID: ${acc.id}, Name: ${acc.name}`);
                    });
                } else {
                    log(`❌ List Accounts FAILED. Errors: ${JSON.stringify(json.errors)}`);
                }
            } catch (e) {
                log(`❌ List Accounts FAILED. Invalid JSON response.`);
            }
        });
    });
    
    req.on('error', (e) => log(`❌ Network Error: ${e.message}`));
    req.end();
}

listAccounts({
    'Authorization': `Bearer ${key}`
});

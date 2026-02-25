const https = require('https');

const email = process.env.CLOUDFLARE_EMAIL || 'undercover00yt@gmail.com';
const apiKey = process.env.CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID || 'dd6f87708289237323be906271272de6';
// We don't hardcode record ID here because we'll search for it first
const txtValue = 'tiktok-developers-site-verification=LBOhRmLGMJ0y3f2BvRyYIXaLkNNKlRB7';

function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (apiKey.length > 40) { // Likely a Bearer Token
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else { // Likely a Global API Key
            headers['X-Auth-Email'] = email;
            headers['X-Auth-Key'] = apiKey;
        }

        const options = {
            hostname: 'api.cloudflare.com',
            path: path,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    try {
        console.log(`🔍 Listing DNS records to find old TikTok verification...`);
        
        // 1. Find existing record
        const listResult = await request(`/client/v4/zones/${zoneId}/dns_records?type=TXT`);
        
        let recordIdToUpdate = null;

        if (listResult.success) {
            for (const record of listResult.result) {
                if (record.content.includes('tiktok-developers-site-verification')) {
                    console.log(`✅ Found existing record: ${record.id} -> ${record.content}`);
                    recordIdToUpdate = record.id;
                    break; 
                }
            }
        }

        const recordData = {
            type: 'TXT',
            name: '@',
            content: txtValue,
            ttl: 1 
        };

        if (recordIdToUpdate) {
            // 2. Update existing
            console.log(`🔄 Updating record ${recordIdToUpdate}...`);
            const updateResult = await request(`/client/v4/zones/${zoneId}/dns_records/${recordIdToUpdate}`, 'PUT', recordData);
            
            if (updateResult.success) {
                console.log('✅ DNS Record UPDATED successfully!');
                console.log('New Content:', updateResult.result.content);
            } else {
                console.error('❌ Failed to update:', JSON.stringify(updateResult.errors));
            }
        } else {
            // 3. Create new if not found
            console.log(`➕ No existing record found. Creating new one...`);
            const createResult = await request(`/client/v4/zones/${zoneId}/dns_records`, 'POST', recordData);
            
            if (createResult.success) {
                console.log('✅ DNS Record CREATED successfully!');
            } else {
                console.error('❌ Failed to create:', JSON.stringify(createResult.errors));
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();

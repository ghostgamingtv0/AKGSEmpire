import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const ACCESS_TOKEN = process.env.META_USER_ACCESS_TOKEN;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

function getAppSecretProof(accessToken, appSecret) {
    return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
}

async function testToken() {
    console.log('🔍 Testing Facebook Access Token...');
    console.log(`Token (first 10 chars): ${ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 10) + '...' : 'UNDEFINED'}`);
    
    if (!ACCESS_TOKEN || !APP_SECRET) {
        console.error('❌ Missing META_USER_ACCESS_TOKEN or FACEBOOK_APP_SECRET in .env');
        return;
    }

    const appSecretProof = getAppSecretProof(ACCESS_TOKEN, APP_SECRET);

    try {
        // 1. Get Debug Token Info
        console.log('\n--- 1. Fetching User Profile (/me) ---');
        const meRes = await axios.get(`https://graph.facebook.com/v19.0/me`, {
            params: {
                fields: 'id,name,permissions',
                access_token: ACCESS_TOKEN,
                appsecret_proof: appSecretProof
            }
        });
        console.log('✅ User Info:', JSON.stringify(meRes.data, null, 2));

        // 2. Fetch Accounts (Pages) this user manages
        console.log('\n--- 2. Fetching Accounts/Pages (/me/accounts) ---');
        const accountsRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: {
                access_token: ACCESS_TOKEN,
                appsecret_proof: appSecretProof
            }
        });
        
        if (accountsRes.data.data && accountsRes.data.data.length > 0) {
            console.log(`✅ Found ${accountsRes.data.data.length} page(s):`);
            accountsRes.data.data.forEach(page => {
                console.log(`   - Page: ${page.name} (ID: ${page.id})`);
                if (page.instagram_business_account) {
                    console.log(`     📸 Linked Instagram ID: ${page.instagram_business_account.id}`);
                }
            });
        } else {
            console.log('⚠️ No pages found for this user (missing pages_show_list permission or no pages).');
        }

        // 3. Test Direct Instagram Access (using ID from .env)
        const INSTA_ID = process.env.INSTAGRAM_BUSINESS_ID;
        if (INSTA_ID) {
            console.log(`\n--- 3. Testing Direct Instagram Access (ID: ${INSTA_ID}) ---`);
            try {
                const instaRes = await axios.get(`https://graph.facebook.com/v19.0/${INSTA_ID}`, {
                    params: {
                        fields: 'id,username,name,followers_count',
                        access_token: ACCESS_TOKEN,
                        appsecret_proof: appSecretProof
                    }
                });
                console.log('✅ Instagram Account Info:', instaRes.data);
            } catch (err) {
                console.error('❌ Failed to access Instagram Account directly:', err.response ? err.response.data : err.message);
            }
        }

    } catch (error) {
        console.error('❌ API Request Failed:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testToken();

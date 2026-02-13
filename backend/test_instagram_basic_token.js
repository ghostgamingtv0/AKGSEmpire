import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.INSTAGRAM_OFFICIAL_TOKEN;

async function testBasicDisplayToken() {
    console.log('🔍 Testing Instagram Basic Display Token...');
    console.log(`Token (first 10 chars): ${TOKEN ? TOKEN.substring(0, 10) + '...' : 'UNDEFINED'}`);

    if (!TOKEN) {
        console.error('❌ No INSTAGRAM_OFFICIAL_TOKEN found in .env');
        return;
    }

    try {
        // Basic Display API uses graph.instagram.com
        console.log('\n--- Fetching User Profile (graph.instagram.com) ---');
        const res = await axios.get(`https://graph.instagram.com/me`, {
            params: {
                fields: 'id,username,account_type,media_count',
                access_token: TOKEN
            }
        });
        
        console.log('✅ User Info:', JSON.stringify(res.data, null, 2));

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

testBasicDisplayToken();

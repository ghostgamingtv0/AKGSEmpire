import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.META_USER_ACCESS_TOKEN;
const appSecret = process.env.FACEBOOK_APP_SECRET;

function getAppSecretProof(accessToken, appSecret) {
    if (!appSecret) return null;
    return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
}

const proof = getAppSecretProof(token, appSecret);
const url = `https://graph.facebook.com/v19.0/me?fields=id,name,accounts{id,name,instagram_business_account}&access_token=${token}&appsecret_proof=${proof}`;

console.log('Verifying token...');
console.log(`Token Length: ${token ? token.length : 0}`);
if (token) console.log(`Token Start: ${token.substring(0, 10)}...`);

try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
} catch (error) {
    console.error('Error:', error.message);
}

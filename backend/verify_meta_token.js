import dotenv from 'dotenv';
dotenv.config();

const token = process.env.META_USER_ACCESS_TOKEN;
const url = `https://graph.facebook.com/v22.0/me?fields=id,name,accounts{id,name,instagram_business_account}&access_token=${token}`;

console.log('Verifying token...');

try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
} catch (error) {
    console.error('Error:', error.message);
}

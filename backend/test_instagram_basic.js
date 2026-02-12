import fetch from 'node-fetch';

const TOKEN = 'IGAANfU1kLurBBZAFl4eV9QbEItSDFDR2ZAFakpMd1JEcWNkS2gzNV9UenY1QjZAfTFBqMTBsWDJOTnRIUGZAXbVQ5Y1JEempQYk5xeGlSTHRQTUR4cUdjc3lvdUhqYnpqc19Db2N6TERNY3dUVlNzOGJxMndUeVlNdUZAaX3F4TUhFMAZDZD';

async function testBasicDisplay() {
    try {
        console.log('Testing Instagram Basic Display Token...');
        
        // 1. Get User Profile (id, username)
        const profileUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${TOKEN}`;
        const profileRes = await fetch(profileUrl);
        const profileData = await profileRes.json();
        
        if (profileData.error) {
            console.error('❌ Profile Error:', profileData.error);
            return;
        }
        
        console.log('✅ Profile Fetched Successfully:');
        console.log(JSON.stringify(profileData, null, 2));
        
        // 2. Get User Media (Recent Posts)
        const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${TOKEN}`;
        const mediaRes = await fetch(mediaUrl);
        const mediaData = await mediaRes.json();
        
        if (mediaData.error) {
            console.error('❌ Media Error:', mediaData.error);
            return;
        }
        
        console.log(`✅ Media Fetched: Found ${mediaData.data ? mediaData.data.length : 0} posts.`);
        if (mediaData.data && mediaData.data.length > 0) {
            console.log('First Post:', JSON.stringify(mediaData.data[0], null, 2));
        }
        
        console.log('\n--- CONCLUSION ---');
        console.log('The token is VALID for Basic Display (Login, Fetching Profile, Fetching Photos).');
        console.log('NOTE: This token CANNOT be used to send messages (requires Graph API + Facebook Page).');
        
    } catch (error) {
        console.error('Script Error:', error);
    }
}

testBasicDisplay();

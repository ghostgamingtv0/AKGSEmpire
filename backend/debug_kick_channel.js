
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const KICK_CHANNEL_SLUG = 'ghost_gamingtv';

async function checkChannelSearch() {
    console.log(`Searching for channel: ${KICK_CHANNEL_SLUG}`);
    
    // Method 4: Search Endpoint (Often works when direct lookup fails)
    try {
        console.log(`\n--- Searching via Internal API ---`);
        // Note: This endpoint might not need auth, or might need cookies.
        // Let's try without auth first.
        const res = await fetch(`https://kick.com/api/search/channel?term=${KICK_CHANNEL_SLUG}`);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Search Data found!');
            // console.log(JSON.stringify(data, null, 2));
            
            // Find exact match
            const match = data.channels?.find(c => c.slug === KICK_CHANNEL_SLUG);
            if (match) {
                console.log(`✅ MATCH FOUND! Chatroom ID: ${match.chatroom?.id || match.chatroom_id}`);
            } else {
                console.log('❌ Channel not found in search results');
            }
        } else {
            console.log('Search Response:', await res.text());
        }
    } catch (e) {
        console.error('Search Error:', e.message);
    }
}

checkChannelSearch();

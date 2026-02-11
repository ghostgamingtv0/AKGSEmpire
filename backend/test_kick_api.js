
import https from 'https';

const url = 'https://kick.com/api/v2/channels/ghost_gamingtv';

// Simple fetch wrapper since fetch is global in newer Node
async function test() {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log(`HTTP Error: ${response.status}`);
            const text = await response.text();
            console.log('Body:', text.substring(0, 200));
            return;
        }

        const json = await response.json();
        console.log('Followers:', json.followers_count || json.followersCount);
        console.log('Keys:', Object.keys(json));
        
        if (json.livestream) {
            console.log('Live Viewers:', json.livestream.viewer_count);
        } else {
            console.log('Stream is offline');
        }
        
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

test();

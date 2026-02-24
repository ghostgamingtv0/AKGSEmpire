
async function testKickStats() {
    const slug = 'ghost_gamingtv';
    // Try internal API first (often blocked by Cloudflare)
    // Then try public API v1 (if available)
    
    const urls = [
        `https://kick.com/api/v1/channels/${slug}`,
        `https://api.kick.com/public/v1/channels/${slug}`
    ];

    for (const url of urls) {
        console.log(`Fetching ${url}...`);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
                }
            });
            
            if (response.ok) {
                    const data = await response.json();
                    console.log('Success!');
                    // console.log('Data Keys:', Object.keys(data));
                    
                    if (data.followers_count) console.log('Followers:', data.followers_count);
                    
                    if (data.previous_livestreams) {
                        console.log('Previous Streams Count:', data.previous_livestreams.length);
                        if (data.previous_livestreams.length > 0) {
                            console.log('Last Stream:', data.previous_livestreams[0]);
                        }
                    }

                    if (data.recent_categories) {
                        console.log('Recent Categories:', JSON.stringify(data.recent_categories, null, 2));
                    }

                    if (data.livestream) {
                        console.log('Livestream:', 'Active');
                        console.log('Viewers:', data.livestream.viewer_count);
                    } else {
                        console.log('Livestream: Offline');
                    }
                    break;
                } else {
                console.log('Failed:', response.status);
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
}

testKickStats();

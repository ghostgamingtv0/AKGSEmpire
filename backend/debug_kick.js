async function test() {
    // 1. Try API v1
    try {
        console.log('--- Attempting API v1 ---');
        const res = await fetch('https://kick.com/api/v1/channels/ghost_gamingtv', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        console.log('API Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('API Followers:', data.followers_count);
        }
    } catch (e) {
        console.log('API Error:', e.message);
    }

    // 2. Try Scraping HTML
    try {
        console.log('\n--- Attempting HTML Scrape ---');
        const res = await fetch('https://kick.com/ghost_gamingtv', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });
        console.log('HTML Status:', res.status);
        if (res.ok) {
            const html = await res.text();
            // Look for patterns like "followers_count":1234 or "followersCount":1234
            const match = html.match(/"followers_count":(\d+)/) || html.match(/"followersCount":(\d+)/);
            if (match) {
                console.log('Found in HTML:', match[1]);
            } else {
                console.log('Not found in HTML. Saving sample...');
                // console.log(html.substring(0, 500)); 
            }
        }
    } catch (e) {
        console.log('HTML Error:', e.message);
    }
}

test();
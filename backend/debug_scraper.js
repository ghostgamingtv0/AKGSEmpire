import fs from 'fs';
// Native fetch is available in Node 18+, no need to import node-fetch

async function run() {
    console.log('Fetching StreamerStats...');
    try {
        const url = 'https://streamerstats.com/kick/ghost_gamingTV/streamer/profile';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        console.log('Length:', html.length);
        fs.writeFileSync('scraper_debug.html', html);
        console.log('Saved to scraper_debug.html');
        
        // Quick Regex Test
        const regex = /Followers(?:[\s\S]*?)(\d{1,3}(?:,\d{3})*|\d+)/i;
        const match = html.match(regex);
        console.log('Regex Match:', match ? match[1] : 'No match');
    } catch (e) {
        console.error(e);
    }
}

run();
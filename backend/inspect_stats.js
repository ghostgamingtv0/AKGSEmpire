async function inspectStreamerStats() {
    try {
        const res = await fetch('https://streamerstats.com/kick/ghost_gamingTV/streamer/profile', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log('Page Length:', html.length);
        
        // Try to find numbers around "Followers"
        // Regex to find "Followers" and nearby numbers
        const followerMatches = html.match(/Followers.{0,50}?(\d{1,3}(?:,\d{3})*|\d+)/gi);
        console.log('Follower Text Matches:', followerMatches);

        // Dump a chunk of HTML to see structure if regex fails
        // We'll look for the section that likely has the stats
        const statsIndex = html.indexOf('Followers');
        if (statsIndex !== -1) {
            console.log('Context around "Followers":');
            console.log(html.substring(statsIndex - 100, statsIndex + 200));
        } else {
            console.log('"Followers" string not found.');
        }

    } catch (e) {
        console.error(e);
    }
}

inspectStreamerStats();
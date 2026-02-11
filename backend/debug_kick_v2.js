async function test() {
    try {
        const res = await fetch('https://kick.com/api/v1/channels/ghost_gamingtv', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://kick.com/ghost_gamingtv',
                'Origin': 'https://kick.com',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Followers:', data.followers_count);
        } else {
            const text = await res.text();
            console.log('Error Body:', text.substring(0, 200));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
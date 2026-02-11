
async function testKickHtml() {
    try {
        const response = await fetch('https://kick.com/ghost_gamingtv', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });
        console.log('Status:', response.status);
        const html = await response.text();
        console.log('HTML Length:', html.length);
        if (html.includes('followers')) {
            console.log('Found "followers" in HTML');
            // Try to extract number
            // Look for specific patterns often found in Next.js props
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
testKickHtml();

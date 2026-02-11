
async function testKick() {
    try {
        const response = await fetch('https://kick.com/api/v1/channels/ghost_gamingtv');
        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Followers:', data.followers_count || data.followersCount);
        } else {
            console.log('Body:', await response.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
testKick();

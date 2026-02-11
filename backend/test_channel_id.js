
async function checkChannel() {
    const endpoints = [
        'https://api.kick.com/public/v1/channels/ghost_gamingtv',
        'https://api.kick.com/api/v1/channels/ghost_gamingtv',
        'https://api.kick.com/v1/channels/ghost_gamingtv'
    ];

    for (const url of endpoints) {
        try {
            console.log(`Trying ${url}...`);
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Chatroom ID:', data.chatroom?.id);
                console.log('Data:', JSON.stringify(data).substring(0, 200));
                break;
            } else {
                console.log('Error:', await res.text());
            }
        } catch (e) {
            console.log('Fetch error:', e.message);
        }
    }
}

checkChannel();

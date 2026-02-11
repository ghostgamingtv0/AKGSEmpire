
async function checkPusher() {
    try {
        const res = await fetch('https://kick.com/ghost_gamingtv');
        const text = await res.text();
        console.log('Page Length:', text.length);
        
        // Search for Pusher config
        const pusherKeyMatch = text.match(/key["']?:\s*["']([a-zA-Z0-9]+)["']/);
        const clusterMatch = text.match(/cluster["']?:\s*["']([a-zA-Z0-9]+)["']/);
        
        if (pusherKeyMatch) console.log('Found Pusher Key:', pusherKeyMatch[1]);
        if (clusterMatch) console.log('Found Pusher Cluster:', clusterMatch[1]);
        
        // Search for Chatroom ID
        const chatroomMatch = text.match(/"chatroom"\s*:\s*\{\s*"id"\s*:\s*(\d+)/);
        if (chatroomMatch) console.log('Found Chatroom ID:', chatroomMatch[1]);
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkPusher();

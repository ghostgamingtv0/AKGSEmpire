import WebSocket from 'ws';

const PUSHER_KEY = '32cbd69e4b950bf97679'; // Possible new key
const clusters = ['us2', 'mt1', 'eu', 'ap1', 'ap2', 'us1', 'us3'];

async function testCluster(cluster) {
    return new Promise((resolve) => {
        const wsUrl = `wss://ws-${cluster}.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;
        console.log(`Testing cluster: ${cluster}`);
        const ws = new WebSocket(wsUrl);

        let timeout = setTimeout(() => {
            console.log(`❌ ${cluster}: Timeout`);
            ws.terminate();
            resolve(false);
        }, 5000);

        ws.on('open', () => {
            // Wait for potential close message
        });

        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`❌ ${cluster}: Closed (${code}) - ${reason}`);
            resolve(false);
        });
        
        ws.on('message', (data) => {
             const msg = JSON.parse(data);
             if (msg.event === 'pusher:connection_established') {
                 clearTimeout(timeout);
                 console.log(`✅ ${cluster}: SUCCESS! Connected.`);
                 ws.terminate();
                 resolve(true);
             }
        });

        ws.on('error', (e) => {
            console.log(`❌ ${cluster}: Error - ${e.message}`);
        });
    });
}

(async () => {
    for (const c of clusters) {
        const success = await testCluster(c);
        if (success) break;
    }
})();

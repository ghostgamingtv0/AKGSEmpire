
async function simulateLive() {
    try {
        const response = await fetch('http://localhost:3001/api/update-kick-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_live: true, viewers: 150 })
        });
        
        const statsRes = await fetch('http://localhost:3001/api/stats');
        const stats = await statsRes.json();
        console.log('Live Stats:', stats);
    } catch (e) { console.error(e); }
}
simulateLive();


async function simulateGrowth() {
    try {
        const response = await fetch('http://localhost:3001/api/update-kick-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followers: 603 })
        });
        const data = await response.json();
        console.log('Update Result:', data);
        
        // Check stats
        const statsRes = await fetch('http://localhost:3001/api/stats');
        const stats = await statsRes.json();
        console.log('New Stats:', stats);
    } catch (e) {
        console.error('Error:', e);
    }
}
simulateGrowth();

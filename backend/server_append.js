
// --- Leaderboard Endpoints ---

// 1. Top Referrers
app.get('/api/leaderboard/referrers', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, referral_count 
            FROM users 
            ORDER BY referral_count DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Top Comments (Most Interactive) - Using weekly_comments or chat_messages_count
app.get('/api/leaderboard/comments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_comments, chat_messages_count
            FROM users 
            ORDER BY weekly_comments DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Weekly Global Rankings (Points)
app.get('/api/leaderboard/points', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT kick_username, wallet_address, visitor_id, g_code, weekly_points 
            FROM users 
            ORDER BY weekly_points DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Platform User Lists
app.get('/api/users/platform/:platform', async (req, res) => {
    const { platform } = req.params;
    let column = '';
    
    switch(platform) {
        case 'kick': column = 'kick_username'; break;
        case 'instagram': column = 'instagram_username'; break;
        case 'twitter': column = 'twitter_username'; break;
        case 'threads': column = 'threads_username'; break;
        default: return res.status(400).json({ error: 'Invalid platform' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT ${column} as username, wallet_address, visitor_id, g_code 
            FROM users 
            WHERE ${column} IS NOT NULL AND ${column} != ''
            ORDER BY created_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

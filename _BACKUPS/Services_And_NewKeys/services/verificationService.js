import { pool } from '../db.js';

// Central Verification Logic
export const verifyTask = async (username, taskId, platform, gCode, isBot = false) => {
    if (!username || !platform) {
        throw new Error('Missing required fields');
    }

    // 1. Check if user exists
    const [users] = await pool.query('SELECT id, total_points FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
        throw new Error('User not found');
    }
    const user = users[0];

    // 2. Validate G-Code (Basic Check)
    // If coming from Bot (isBot = true), we might trust it more or have different checks
    const isValidGCode = gCode && gCode.includes('👻') && gCode.includes(username);
    if (!isValidGCode && !isBot) {
         throw new Error('Invalid G-Code format');
    }

    // 3. Award Points
    const REWARD_POINTS = 10;
    await pool.query('UPDATE users SET total_points = total_points + ? WHERE id = ?', [REWARD_POINTS, user.id]);
    
    // 4. Log Verification
    await pool.query('INSERT INTO task_verifications (username, task_id, platform, g_code, status) VALUES (?, ?, ?, ?, ?)', 
        [username, taskId || 0, platform, gCode, 'approved']);

    return {
        success: true,
        message: 'Task verified successfully',
        points_added: REWARD_POINTS,
        new_total: user.total_points + REWARD_POINTS
    };
};

// Bot-Specific Verification (Simpler input for bots)
export const processBotVerification = async (platform, discordOrTelegramId, gCode) => {
    // Logic to find user by their linked Discord/Telegram ID (if we had that column)
    // For now, assuming G-Code contains the username or we parse it
    // G-Code format: 👻PREFIX-Username-...
    
    const match = gCode.match(/👻[^-]+-([^-]+)-/);
    if (!match) throw new Error('Invalid G-Code format');
    
    const username = match[1];
    return await verifyTask(username, 0, platform, gCode, true);
};

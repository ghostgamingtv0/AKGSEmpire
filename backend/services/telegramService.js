import { getSystemStat } from '../db.js';

const TELEGRAM_URL = 'https://t.me/ghost_gamingtv';

export const getTelegramStats = async () => {
    const members = parseInt(await getSystemStat('telegram_members')) || 0;
    
    return {
        name: 'telegram',
        stats: {
            followers: members,
            is_live: false,
            viewers: 0
        },
        url: TELEGRAM_URL
    };
};

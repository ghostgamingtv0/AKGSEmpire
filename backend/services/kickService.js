import { getSystemStat, setSystemStat } from '../db.js';

const CHANNEL_SLUG = 'ghost_gamingtv';
const KICK_URL = `https://kick.com/${CHANNEL_SLUG}`;
const API_URL = `https://kick.com/api/v1/channels/${CHANNEL_SLUG}`;

export const updateKickStats = async () => {
    try {
        const response = await fetch(API_URL, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        if (response.ok) {
            const data = await response.json();
            const followers = data.followersCount || data.followers_count || 0;
            const isLive = !!data.livestream;
            const viewers = isLive ? data.livestream.viewer_count : 0;
            const category = isLive && data.livestream.categories ? data.livestream.categories[0].name : (data.recent_categories?.[0]?.name || 'None');
            
            await setSystemStat('kick_followers', followers);
            await setSystemStat('kick_viewers', viewers);
            await setSystemStat('kick_is_live', isLive ? 'true' : 'false');
            await setSystemStat('kick_category', category);
            
            // Weekly Growth Logic
            const weeklyStart = await getSystemStat('weekly_start_followers');
            if (!weeklyStart) {
                await setSystemStat('weekly_start_followers', followers);
            }
            
            console.log(`✅ Kick Stats Updated: ${followers} Followers | Live: ${isLive} | Viewers: ${viewers}`);
            return { followers, isLive, viewers, category };
        }
    } catch (e) {
        console.error('❌ Failed to update Kick stats:', e.message);
    }
    return null;
};

export const getKickStats = async () => {
    const followers = parseInt(await getSystemStat('kick_followers')) || 0;
    const viewers = parseInt(await getSystemStat('kick_viewers')) || 0;
    const isLive = (await getSystemStat('kick_is_live')) === 'true';
    
    return {
        name: 'kick',
        stats: {
            followers,
            is_live: isLive,
            viewers
        },
        url: KICK_URL
    };
};

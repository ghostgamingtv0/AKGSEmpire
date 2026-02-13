import { getSystemStat } from '../db.js';

const DISCORD_INVITE = 'https://discord.gg/wMVJTrppXh';

export const getDiscordStats = async () => {
    const members = parseInt(await getSystemStat('discord_members')) || 0;
    
    return {
        name: 'discord',
        stats: {
            followers: members, // Mapping 'members' to 'followers' for standardization
            is_live: false,
            viewers: 0
        },
        url: DISCORD_INVITE
    };
};

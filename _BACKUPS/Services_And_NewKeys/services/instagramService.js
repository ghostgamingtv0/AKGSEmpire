import { getSystemStat } from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const INSTAGRAM_URL = 'https://www.instagram.com/ghost.gamingtv/';
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;

export const getInstagramStats = async () => {
    // Currently relying on manual or bot updates to DB
    const followers = parseInt(await getSystemStat('instagram_followers')) || 0;
    
    return {
        name: 'instagram',
        stats: {
            followers,
            is_live: false,
            viewers: 0
        },
        url: INSTAGRAM_URL
    };
};

// OAuth Logic (Legacy/Optional)
export const getAuthUrl = (redirectUri, state) => {
    if (!INSTAGRAM_CLIENT_ID) throw new Error('Instagram Client ID missing');
    return `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${encodeURIComponent(state)}`;
};

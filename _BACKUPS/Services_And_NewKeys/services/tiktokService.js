import { getSystemStat } from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const TIKTOK_URL = 'https://www.tiktok.com/@ghost.gamingtv';
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;

export const getTikTokStats = async () => {
    const followers = parseInt(await getSystemStat('tiktok_followers')) || 0;
    
    return {
        name: 'tiktok',
        stats: {
            followers,
            is_live: false,
            viewers: 0
        },
        url: TIKTOK_URL
    };
};

export const getAuthUrl = (redirectUri, state) => {
    if (!TIKTOK_CLIENT_KEY) throw new Error('TikTok Client Key missing');
    const url = 'https://www.tiktok.com/v2/auth/authorize/';
    const params = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        scope: 'user.info.basic',
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state
    });
    return `${url}?${params.toString()}`;
};

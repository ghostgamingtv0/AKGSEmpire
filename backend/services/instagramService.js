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

// OAuth Logic (Updated with Business Scopes)
export const getAuthUrl = (redirectUri, state) => {
    if (!INSTAGRAM_CLIENT_ID) throw new Error('Instagram Client ID missing');
    
    // User provided integration URL structure:
    // https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=...&redirect_uri=...&response_type=code&scope=...
    
    const scopes = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights'
    ].join(',');

    // We use the passed redirectUri from the controller to maintain flexibility (localhost vs prod),
    // but the scopes and endpoint are updated to match the user's request.
    return `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=${encodeURIComponent(state)}`;
};

// Webhook Verification Logic
export const verifyWebhook = (req, res) => {
    const VERIFY_TOKEN = 'ghost_empire_secret_123';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('❌ Webhook Verification Failed: Token mismatch');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

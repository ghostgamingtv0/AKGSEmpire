import { getSystemStat } from '../db.js';

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61587413956110';

export const getFacebookStats = async () => {
    const followers = parseInt(await getSystemStat('facebook_followers')) || 0;
    
    return {
        name: 'facebook',
        stats: {
            followers,
            is_live: false,
            viewers: 0
        },
        url: FACEBOOK_URL
    };
};

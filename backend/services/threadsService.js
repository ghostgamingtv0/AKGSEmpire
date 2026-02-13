import { getSystemStat } from '../db.js';

const THREADS_URL = 'https://www.threads.net/@ghost.gamingtv';

export const getThreadsStats = async () => {
    const followers = parseInt(await getSystemStat('threads_followers')) || 0;
    
    return {
        name: 'threads',
        stats: {
            followers,
            is_live: false,
            viewers: 0
        },
        url: THREADS_URL
    };
};

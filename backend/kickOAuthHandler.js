/**
 * Kick OAuth token exchange — shared by POST /api/kick/token and POST /api/kick/exchange-token
 * (Logic aligned with legacy server.js)
 */
import { pool, getSystemStat, setSystemStat } from './db.js';

export async function handleKickOAuth(req, res) {
    const { code, code_verifier, redirect_uri, visitor_id: bodyVisitorId } = req.body || {};

    try {
        const clientId = process.env.KICK_CLIENT_ID || process.env.KICK_DEVELOPER_ID || '01KH3T8WNDZ269403HKC17JN7X';
        const clientSecret = process.env.KICK_CLIENT_SECRET;

        if (!clientSecret) {
            console.error('❌ KICK_CLIENT_SECRET is not set');
            return res.status(500).json({ success: false, error: 'Kick OAuth not configured on server' });
        }

        if (!code) {
            return res.status(400).json({ success: false, error: 'Missing authorization code' });
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('redirect_uri', redirect_uri || 'https://ghostempire.org/');
        params.append('code', code);

        if (code_verifier) {
            params.append('code_verifier', code_verifier);
        }

        const tokenEndpoints = ['https://id.kick.com/oauth/token'];
        let tokenData = null;

        for (const tokenUrl of tokenEndpoints) {
            try {
                const response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });

                const responseText = await response.text();

                if (response.ok) {
                    tokenData = JSON.parse(responseText);
                    break;
                }
                console.error(`❌ Kick API Error (${response.status}) at ${tokenUrl}:`, responseText);
            } catch (e) {
                console.error(`❌ Connection Error at ${tokenUrl}:`, e.message);
            }
        }

        if (!tokenData) {
            return res.status(400).json({ success: false, error: 'Failed to exchange token with Kick' });
        }

        const accessToken = tokenData.access_token;
        await setSystemStat('kick_access_token', accessToken);

        let username = null;
        let profilePic = null;
        let isProfileComplete = false;

        const identityEndpoints = [
            'https://id.kick.com/oauth/userinfo',
            'https://api.kick.com/api/v1/me',
            'https://api.kick.com/public/v1/users',
            'https://api.kick.com/api/v1/users'
        ];

        for (const endpoint of identityEndpoints) {
            try {
                const meRes = await fetch(endpoint, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json'
                    }
                });

                const meText = await meRes.text();

                if (meRes.ok) {
                    const meData = JSON.parse(meText);
                    const user = meData.data || meData;

                    if (user.preferred_username || user.name || user.sub) {
                        username = user.preferred_username || user.name || user.sub;
                    }
                    if (user.username || user.slug) {
                        username = user.username || user.slug;
                    }

                    if (username) {
                        profilePic = user.profile_pic || user.picture;
                        break;
                    }
                }
            } catch (e) {
                console.error(`❌ Failed endpoint ${endpoint}:`, e.message);
            }
        }

        if (!username) {
            return res.status(400).json({ success: false, error: 'Failed to identify user from Kick.' });
        }

        const visitor_id = bodyVisitorId || 'v_' + Math.random().toString(36).substring(7);
        const finalGCode =
            'G-' +
            Buffer.from(String(username))
                .toString('base64')
                .substring(0, 6)
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, 'X');

        const kickUsername = username;
        const [existingUser] = await pool.query('SELECT * FROM users WHERE kick_username = ?', [kickUsername]);

        if (existingUser.length > 0) {
            await pool.query('UPDATE users SET g_code = ?, visitor_id = ? WHERE kick_username = ?', [
                finalGCode,
                visitor_id,
                kickUsername
            ]);
            isProfileComplete = !!(existingUser[0].password && existingUser[0].wallet_address);
        } else {
            await pool.query('INSERT INTO users (visitor_id, kick_username, g_code) VALUES (?, ?, ?)', [
                visitor_id,
                kickUsername,
                finalGCode
            ]);
        }

        let isFollowing = false;
        let followers = null;
        const channelSlug = 'ghost_gamingtv';

        try {
            const endpoints = [
                `https://api.kick.com/public/v1/channels/${channelSlug}`,
                `https://api.kick.com/api/v1/channels/${channelSlug}`
            ];

            for (const url of endpoints) {
                try {
                    const channelRes = await fetch(url);
                    if (channelRes.ok) {
                        const channelData = await channelRes.json();
                        followers = channelData.followers_count || channelData.followers?.length;
                    }
                } catch (e) {
                    /* ignore */
                }
            }

            try {
                const followingRes = await fetch(`https://api.kick.com/public/v1/users/${username}/following`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (followingRes.ok) {
                    const followingData = await followingRes.json();
                    const isFound = followingData.data?.find(
                        (c) => c.slug === channelSlug || c.username === channelSlug
                    );
                    if (isFound) {
                        isFollowing = true;
                    }
                }
            } catch (e) {
                console.error('❌ Check Following Error:', e.message);
            }

            for (const url of endpoints) {
                try {
                    const userRes = await fetch(url, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        followers =
                            userData.followersCount ||
                            userData.followers_count ||
                            (userData.followers && userData.followers.length);
                        if (followers) break;
                    }
                } catch (e) {
                    console.error('Fetch error:', e.message);
                }
            }

            if (followers) {
                await setSystemStat('kick_followers', followers);
                const weeklyStart = await getSystemStat('weekly_start_followers');
                if (!weeklyStart) {
                    await setSystemStat('weekly_start_followers', followers);
                }
            }

            return res.json({
                success: true,
                username,
                profile_pic: profilePic,
                followers,
                g_code: finalGCode,
                following: isFollowing,
                is_profile_complete: isProfileComplete
            });
        } catch (error) {
            console.error('❌ OAuth Error:', error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    } catch (e) {
        console.error('❌ Server Error:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
}

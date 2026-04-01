export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (url.hostname.includes('render.com')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'akgsempire.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const normalizePath = (p) => {
      if (p.startsWith('/empire/api/')) return p.slice('/empire'.length);
      return p;
    };

    const apiPath = normalizePath(path);

    const getJsonBody = async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    };

    const randomHex = (bytes) => {
      const a = new Uint8Array(bytes);
      crypto.getRandomValues(a);
      return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    const base64 = (buf) => {
      const bytes = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s);
    };

    const pbkdf2 = async (password, saltHex) => {
      const enc = new TextEncoder();
      const salt = Uint8Array.from(saltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16)));
      const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
        key,
        256
      );
      return base64(bits);
    };

    const ensureKv = () => {
      if (!env.USERS) throw new Error('KV USERS binding missing');
      return env.USERS;
    };

    const userVidKey = (visitorId) => `user_vid:${String(visitorId || '').toLowerCase()}`;
    const userUnKey = (username) => `user_un:${String(username || '').toLowerCase()}`;
    const refKey = (code) => `ref_code:${String(code || '').toUpperCase()}`;

    const sanitizeUser = (u) => {
      if (!u) return null;
      return {
        visitor_id: u.visitor_id,
        username: u.username,
        kick_username: u.kick_username || '',
        wallet_address: u.wallet_address || '',
        g_code: u.g_code || '',
        referral_code: u.referral_code || '',
        referred_by: u.referred_by || null,
        total_points: u.total_points || 0,
        weekly_points: u.weekly_points || 0,
        weekly_comments: u.weekly_comments || 0,
        chat_messages_count: u.chat_messages_count || 0,
        tasks_completed: u.tasks_completed || 0,
        referral_count: u.referral_count || 0,
        twitter_username: u.twitter_username || '',
        threads_username: u.threads_username || '',
        instagram_username: u.instagram_username || '',
        tiktok_username: u.tiktok_username || '',
        facebook_username: u.facebook_username || ''
      };
    };

    const saveUser = async (kv, user) => {
      await kv.put(userVidKey(user.visitor_id), JSON.stringify(user));
      if (user.username) await kv.put(userUnKey(user.username), JSON.stringify(user));
      if (user.referral_code) await kv.put(refKey(user.referral_code), String(user.visitor_id));
    };

    const listUsers = async (kv, limit = 200) => {
      const out = [];
      let cursor = undefined;
      while (out.length < limit) {
        const page = await kv.list({ prefix: 'user_vid:', cursor, limit: Math.min(100, limit - out.length) });
        cursor = page.cursor;
        for (const k of page.keys) {
          const raw = await kv.get(k.name);
          if (!raw) continue;
          try {
            out.push(JSON.parse(raw));
          } catch {}
        }
        if (page.list_complete) break;
      }
      return out;
    };

    const sortDesc = (arr, field) => {
      arr.sort((a, b) => (Number(b[field] || 0) - Number(a[field] || 0)));
      return arr;
    };

    const fetchKickStats = async () => {
      const slug = (env.KICK_CHANNEL_SLUG || 'ghost_gamingtv').trim();
      try {
        const r = await fetch(`https://kick.com/api/v1/channels/${encodeURIComponent(slug)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!r.ok) return null;
        const d = await r.json();
        return {
          kick_followers: d.followers_count ?? d.followersCount ?? 0,
          kick_viewers: d.livestream?.viewer_count ?? 0,
          kick_is_live: !!d.livestream,
          kick_category: d.livestream?.categories?.[0]?.name ?? d.category?.name ?? ''
        };
      } catch {
        return null;
      }
    };

    if (apiPath.startsWith('/api/')) {
      try {
        const kv = ensureKv();

        if (apiPath === '/api/ping' && method === 'GET') {
          return json({ success: true, timestamp: Date.now(), kv: true });
        }

        if (apiPath === '/api/auth/register' && method === 'POST') {
          const body = await getJsonBody();
          const { visitor_id, username, password, wallet_address } = body;
          if (!visitor_id || !username || !password || !wallet_address) {
            return json({ success: false, error: 'All fields are required' }, 400);
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return json({ success: false, error: 'Username must contain only letters, numbers, and underscores' }, 400);
          }
          const existing = await kv.get(userUnKey(username));
          if (existing) return json({ success: false, error: 'Username already taken' }, 400);

          const existingByVidRaw = await kv.get(userVidKey(visitor_id));
          const now = Date.now();
          const salt = randomHex(16);
          const passHash = await pbkdf2(password, salt);

          let user = null;
          if (existingByVidRaw) {
            try { user = JSON.parse(existingByVidRaw); } catch {}
          }

          if (!user) {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            user = {
              visitor_id,
              referral_code: referralCode,
              referred_by: null,
              created_at: now,
              total_points: 0,
              weekly_points: 0,
              weekly_comments: 0,
              chat_messages_count: 0,
              tasks_completed: 0,
              referral_count: 0,
              g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase()
            };
          }

          user.username = username;
          user.wallet_address = wallet_address;
          user.password_salt = salt;
          user.password_hash = passHash;

          await saveUser(kv, user);
          return json({ success: true, user: sanitizeUser(user) });
        }

        if (apiPath === '/api/auth/login' && method === 'POST') {
          const body = await getJsonBody();
          const { username, password, visitor_id } = body;
          if (!username || !password) return json({ success: false, error: 'Missing username or password' }, 400);
          const raw = await kv.get(userUnKey(username));
          if (!raw) return json({ success: false, error: 'User not found' }, 400);
          let user = null;
          try { user = JSON.parse(raw); } catch {}
          if (!user) return json({ success: false, error: 'User not found' }, 400);

          const salt = user.password_salt;
          const hash = user.password_hash;
          if (!salt || !hash) return json({ success: false, error: 'Account requires password reset' }, 400);
          const computed = await pbkdf2(password, salt);
          if (computed !== hash) return json({ success: false, error: 'Invalid password' }, 400);

          if (visitor_id && visitor_id !== user.visitor_id) {
            const oldVidRaw = await kv.get(userVidKey(visitor_id));
            if (oldVidRaw) {
              try {
                const old = JSON.parse(oldVidRaw);
                if (old?.username) await kv.delete(userUnKey(old.username));
              } catch {}
            }
            user.visitor_id = visitor_id;
          }

          await saveUser(kv, user);
          return json({ success: true, user: sanitizeUser(user) });
        }

        if (apiPath === '/api/init-user' && method === 'POST') {
          const body = await getJsonBody();
          const { visitor_id, ref_code, wallet_address, kick_username } = body;
          if (!visitor_id) return json({ success: false, error: 'Visitor ID required' }, 400);

          const raw = await kv.get(userVidKey(visitor_id));
          let user = null;
          if (raw) {
            try { user = JSON.parse(raw); } catch {}
          }

          if (!user) {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            user = {
              visitor_id,
              referral_code: referralCode,
              referred_by: null,
              created_at: Date.now(),
              total_points: 0,
              weekly_points: 0,
              weekly_comments: 0,
              chat_messages_count: 0,
              tasks_completed: 0,
              referral_count: 0,
              g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase()
            };

            if (ref_code) {
              const referrerVid = await kv.get(refKey(ref_code));
              if (referrerVid) {
                const refRaw = await kv.get(userVidKey(referrerVid));
                if (refRaw) {
                  try {
                    const refUser = JSON.parse(refRaw);
                    refUser.referral_count = (refUser.referral_count || 0) + 1;
                    refUser.total_points = (refUser.total_points || 0) + 100;
                    refUser.weekly_points = (refUser.weekly_points || 0) + 100;
                    await saveUser(kv, refUser);
                    user.referred_by = referrerVid;
                  } catch {}
                }
              }
            }
          }

          if (wallet_address) user.wallet_address = wallet_address;
          if (kick_username) user.kick_username = kick_username;

          await saveUser(kv, user);
          return json({ success: true, user: sanitizeUser(user) });
        }

        if (apiPath === '/api/genesis/stats' && method === 'GET') {
          const raw = await kv.get('genesis_spots_left');
          const spotsLeft = Number(raw || 50);
          return json({ success: true, spotsLeft });
        }

        if (apiPath === '/api/genesis/test-register' && method === 'POST') {
          const body = await getJsonBody();
          const {
            visitor_id,
            platform,
            platformUsername,
            nickname,
            password,
            wallet,
            ref
          } = body;

          if (!visitor_id || !nickname || !password || !wallet) {
            return json({ success: false, error: 'Missing required fields' }, 400);
          }
          if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
            return json({ success: false, error: 'Username must contain only letters, numbers, and underscores' }, 400);
          }

          const existing = await kv.get(userUnKey(nickname));
          if (existing) return json({ success: false, error: 'Username already taken' }, 400);

          const existingByVidRaw = await kv.get(userVidKey(visitor_id));
          let user = null;
          if (existingByVidRaw) {
            try { user = JSON.parse(existingByVidRaw); } catch {}
          }

          const now = Date.now();
          const salt = randomHex(16);
          const passHash = await pbkdf2(password, salt);

          if (!user) {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            user = {
              visitor_id,
              referral_code: referralCode,
              referred_by: null,
              created_at: now,
              total_points: 0,
              weekly_points: 0,
              weekly_comments: 0,
              chat_messages_count: 0,
              tasks_completed: 0,
              referral_count: 0,
              g_code: 'G-' + Math.random().toString(36).substring(2, 8).toUpperCase()
            };
          }

          user.username = nickname;
          user.wallet_address = wallet;
          user.password_salt = salt;
          user.password_hash = passHash;

          const p = String(platform || '').toLowerCase();
          if (p.includes('kick')) user.kick_username = platformUsername || user.kick_username || '';
          if (p.includes('twitter')) user.twitter_username = platformUsername || user.twitter_username || '';
          if (p.includes('threads')) user.threads_username = platformUsername || user.threads_username || '';
          if (p.includes('instagram')) user.instagram_username = platformUsername || user.instagram_username || '';
          if (p.includes('tiktok')) user.tiktok_username = platformUsername || user.tiktok_username || '';
          if (p.includes('facebook')) user.facebook_username = platformUsername || user.facebook_username || '';

          if (ref) {
            const referrerVid = await kv.get(refKey(ref));
            if (referrerVid) {
              const refRaw = await kv.get(userVidKey(referrerVid));
              if (refRaw) {
                try {
                  const refUser = JSON.parse(refRaw);
                  refUser.referral_count = (refUser.referral_count || 0) + 1;
                  refUser.total_points = (refUser.total_points || 0) + 100;
                  refUser.weekly_points = (refUser.weekly_points || 0) + 100;
                  await saveUser(kv, refUser);
                  user.referred_by = referrerVid;
                } catch {}
              }
            }
          }

          const spotsRaw = await kv.get('genesis_spots_left');
          let spotsLeft = Number(spotsRaw || 50);
          if (spotsLeft > 0) {
            spotsLeft -= 1;
            await kv.put('genesis_spots_left', String(spotsLeft));
          }

          await saveUser(kv, user);

          const countRaw = await kv.get('genesis_registered_count');
          const nextCount = Number(countRaw || 0) + 1;
          await kv.put('genesis_registered_count', String(nextCount));

          return json({ success: true, gCode: user.g_code, rank: nextCount, spotsLeft });
        }

        if (apiPath === '/api/log' && method === 'POST') {
          return json({ success: true });
        }

        if ((apiPath === '/api/claim' || apiPath === '/api/tasks/claim') && method === 'POST') {
          const body = await getJsonBody();
          const { visitor_id, points } = body;
          if (!visitor_id) return json({ success: false, message: 'User not found' }, 400);
          const raw = await kv.get(userVidKey(visitor_id));
          if (!raw) return json({ success: false, message: 'User not found' }, 400);
          let user = null;
          try { user = JSON.parse(raw); } catch {}
          if (!user) return json({ success: false, message: 'User not found' }, 400);

          const add = Number(points || 10);
          user.total_points = Number(user.total_points || 0) + add;
          user.weekly_points = Number(user.weekly_points || 0) + add;
          user.tasks_completed = Number(user.tasks_completed || 0) + 1;

          await saveUser(kv, user);
          return json({ success: true, message: 'Reward claimed', user: sanitizeUser(user) });
        }

        if (apiPath === '/api/verify-task' && method === 'POST') {
          const body = await getJsonBody();
          const { visitor_id, g_code } = body;
          if (!visitor_id) return json({ success: false, error: 'Missing required fields' }, 400);
          if (!g_code) return json({ success: false, error: 'Invalid G-Code format' }, 400);
          const raw = await kv.get(userVidKey(visitor_id));
          if (!raw) return json({ success: false, error: 'User not found' }, 404);
          let user = null;
          try { user = JSON.parse(raw); } catch {}
          if (!user) return json({ success: false, error: 'User not found' }, 404);

          const add = 10;
          user.total_points = Number(user.total_points || 0) + add;
          user.weekly_points = Number(user.weekly_points || 0) + add;
          await saveUser(kv, user);
          return json({ success: true, points_added: add, new_total: user.total_points, user: sanitizeUser(user) });
        }

        if (apiPath.startsWith('/api/leaderboard/') && method === 'GET') {
          const users = await listUsers(kv, 200);
          const metric = apiPath.split('/').pop();
          const fieldMap = {
            points: 'weekly_points',
            'total-points': 'total_points',
            comments: 'weekly_comments',
            messages: 'chat_messages_count',
            tasks: 'tasks_completed',
            referrers: 'referral_count'
          };
          const field = fieldMap[metric] || 'weekly_points';
          const top = sortDesc(users, field).slice(0, 50).map(sanitizeUser);
          return json(top);
        }

        if (apiPath === '/api/stats' && method === 'GET') {
          const users = await listUsers(kv, 200);
          const kick = await fetchKickStats();
          const total_users = users.length;
          const total_comments = users.reduce((s, u) => s + Number(u.weekly_comments || 0), 0);
          return json({
            success: true,
            total_users,
            total_comments,
            kick_followers: kick?.kick_followers ?? 0,
            kick_viewers: kick?.kick_viewers ?? 0,
            kick_is_live: kick?.kick_is_live ?? false,
            kick_category: kick?.kick_category ?? '',
            weekly_growth: 0
          });
        }

        if (apiPath === '/api/channel-stats' && method === 'GET') {
          const kick = await fetchKickStats();
          const users = await listUsers(kv, 200);
          const topUsers = sortDesc(users, 'weekly_points').slice(0, 6);
          return json({
            success: true,
            rank: 0,
            general: [
              { icon: '👥', label: 'Followers', value: String(kick?.kick_followers ?? 0), change: '+0' },
              { icon: '🔴', label: 'Viewers', value: String(kick?.kick_viewers ?? 0), change: (kick?.kick_is_live ? 'LIVE' : 'OFFLINE') }
            ],
            categories: [],
            topChatters: topUsers.map((u) => ({ name: u.kick_username || u.username || `Anonymous User ${String(u.visitor_id || '').substring(0, 6)}`, chats: Number(u.weekly_points || 0) })),
            overlap: []
          });
        }

        return json({ success: false, error: 'Not Found' }, 404);
      } catch (e) {
        return json({ success: false, error: e.message }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

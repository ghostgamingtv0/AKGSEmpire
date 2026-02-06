import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ExternalLink, Trophy, Flame, Copy, CheckCircle, TrendingUp } from 'lucide-react';
import fp from '@fingerprintjs/fingerprintjs';

const Dashboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total_users: 0, total_distributed: 0 });
  const [topComments, setTopComments] = useState([]);

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Load Visitor ID
        const fpPromise = fp.load();
        const { visitorId } = await (await fpPromise).get();
        
        // 2. Check for Referral Code
        const refCode = localStorage.getItem('ref_code');

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

        // 3. Init/Load User
        const res = await fetch(`${API_BASE}/api/init-user`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ visitor_id: visitorId, ref_code: refCode })
        });
        const data = await res.json();
        if (data.success) {
            setUserData(data.user);
            // Clear ref code after successful use to avoid re-sending
            if (refCode) localStorage.removeItem('ref_code');
        }

        // 4. Fetch Leaderboard
        const lbRes = await fetch(`${API_BASE}/api/leaderboard`);
        const lbData = await lbRes.json();
        if (lbData.success) {
          setLeaderboard(lbData.leaderboard);
        }

        // 5. Fetch Global Stats
        const statsRes = await fetch(`${API_BASE}/api/stats`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setGlobalStats(statsData);
        }

        // 6. Fetch Top Comments
        const commentsRes = await fetch(`${API_BASE}/api/top-comments`);
        const commentsData = await commentsRes.json();
        if (commentsData.success) {
          setTopComments(commentsData.topComments);
        }

        // 7. Client-Side Kick Stats Fetch (Crowdsourcing Real Data)
        try {
            const kickRes = await fetch('https://kick.com/api/v1/channels/ghost_gamingTV');
            if (kickRes.ok) {
                const kickData = await kickRes.json();
                if (kickData && (kickData.followers_count || kickData.followersCount)) {
                    const count = kickData.followers_count || kickData.followersCount;
                    // Send to backend
                    await fetch(`${API_BASE}/api/update-kick-stats`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            followers: count,
                            is_live: kickData.livestream !== null
                        })
                    });
                }
            }
        } catch (e) {
            // CORS might block this, but it's worth a try from user browsers
            console.log('Client-side fetch check');
        }

      } catch (error) {
        console.error('Failed to init dashboard', error);
      }
    };
    initData();
  }, []);

  const handleCopy = () => {
    if (userData?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}?ref=${userData.referral_code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKickSync = () => {
    const clientId = '01KGS5BYEFWHA2EQ51XZW8AK6B';
    const redirectUri = 'http://localhost:3000/';
    const scope = 'user:read channel:read'; 
    window.location.href = `https://id.kick.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  const stats = [
    { label: 'Total Users (Followers)', value: globalStats.total_users.toLocaleString(), icon: <Users className="text-[#53FC18]" />, change: 'Kick.com' },
    { label: 'Weekly Growth', value: globalStats.followers_growth || '+0', icon: <TrendingUp className="text-[#53FC18]" />, change: 'This Week' },
    { label: 'Total Comments', value: globalStats.active_tasks ? globalStats.active_tasks.toLocaleString() : '0', icon: <ExternalLink className="text-blue-400" />, change: 'Weekly' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-400">Track your progress and ecosystem stats</p>
          </div>
        </motion.div>

        {/* Referral Section */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 mb-12 border border-[#53FC18]/30"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-[#53FC18]" />
              Referral Program
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full space-y-2">
                <p className="text-gray-400 text-sm">Your Referral Link</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-gray-300 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {`${window.location.origin}?ref=${userData.referral_code}`}
                  </div>
                  <button 
                    type="button"
                    onClick={handleCopy}
                    className="bg-[#53FC18] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#45d415] transition-colors flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Share this link to earn 100 points for every new user!</p>
              </div>
              
              <div className="flex gap-8 md:border-l md:border-white/10 md:pl-8">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Total Invited</p>
                  <p className="text-3xl font-bold">{userData.referral_count || 0}</p>
                </div>
                 <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Points Earned</p>
                  <p className="text-3xl font-bold text-[#53FC18]">{(userData.referral_count || 0) * 100}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-[#53FC18]" />
            Live Analytics
          </h3>
          {/* Sync Button restored */}
          {/* <button 
            onClick={handleKickSync} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#53FC18] transition-colors"
            title="Sync Kick Stats"
          >
            Sync
          </button> */}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-white/5">
                  {stat.icon}
                </div>
                <span className="text-[#53FC18] text-sm font-medium bg-[#53FC18]/10 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-400" />
              <h2 className="text-xl font-bold">Weekly Leaderboard</h2>
            </div>
            
            <div className="space-y-4">
              {leaderboard.length > 0 ? (
                leaderboard.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {user.kick_username ? user.kick_username : (user.wallet_address ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : user.visitor_id)}
                        </p>
                        <p className="text-xs text-gray-500">Weekly Score</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-[#53FC18]">{user.weekly_points} pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading leaderboard...
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6"
          >
             <div className="flex items-center gap-3 mb-6">
              <Flame className="text-red-500" />
              <h2 className="text-xl font-bold">Top 6 Weekly Comments</h2>
            </div>
            
            <div className="space-y-4">
              {topComments.length > 0 ? (
                topComments.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 opacity-80"></div>
                      <div>
                         <p className="font-bold text-sm text-white">
                            {user.username}
                         </p>
                         <p className="text-[10px] text-gray-500">{user.wallet ? user.wallet.substring(0, 6) + '...' : 'No Wallet'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-white">{user.comments} Comments</p>
                       <p className="text-[10px] text-[#53FC18]">{user.points} pts</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                   <p className="text-gray-400 text-sm">No comments recorded this week.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

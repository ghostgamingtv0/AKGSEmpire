import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ExternalLink, Trophy, Flame, Copy, CheckCircle, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { FaInstagram, FaShareNodes, FaPlay, FaPowerOff } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';

import { generateRandomString, generateCodeChallenge } from '../pkce';

const Dashboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total_users: 0, total_distributed: 0 });
  const [topComments, setTopComments] = useState([]);
  const [interactiveLeaderboard, setInteractiveLeaderboard] = useState([]);
  const [referralLeaderboard, setReferralLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Twitter Widget
  useEffect(() => {
    const existingScript = document.getElementById('twitter-wjs');
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = 'twitter-wjs';
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Load Visitor ID
        const fpPromise = load();
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
        
        // Handle direct user object return or success wrapper
        if (data && (data.visitor_id || data.success)) {
            const user = data.user || data;
            setUserData(user);
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

        // 7. Fetch Extra Leaderboards (Interactive & Referral)
        try {
            const extraLbRes = await fetch(`${API_BASE}/api/leaderboards`);
            const extraLbData = await extraLbRes.json();
            if (extraLbData.success) {
                setInteractiveLeaderboard(extraLbData.most_interactive);
                setReferralLeaderboard(extraLbData.top_referrers);
            }
        } catch (e) {
            console.error('Failed to fetch extra leaderboards', e);
        }

        // 8. Client-Side Kick Stats Fetch (Crowdsourcing Real Data)
        try {
            const kickRes = await fetch('https://kick.com/api/v1/channels/ghost_gamingtv');
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
      } finally {
        setIsLoading(false);
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

  const handleKickSync = async () => {
    // Generate PKCE
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store verifier in localStorage for later verification
    localStorage.setItem('kick_code_verifier', codeVerifier);
    
    const KICK_AUTH_URL = `https://id.kick.com/oauth/authorize?client_id=${import.meta.env.VITE_KICK_CLIENT_ID}&redirect_uri=${window.location.origin}&response_type=code&scope=user:read&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    
    window.location.href = KICK_AUTH_URL;
  };

  const handleLinkInstagram = async (username) => {
    if (!username) return;
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
    
    try {
        const res = await fetch(`${API_BASE}/api/user/link-instagram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                visitor_id: userData.visitor_id, 
                username: username 
            })
        });
        const data = await res.json();
        if (data.success) {
            setUserData(prev => ({ ...prev, instagram_username: username }));
            alert('Instagram Linked Successfully! ✅');
        } else {
            alert('Failed to link Instagram ❌');
        }
    } catch (e) {
        console.error(e);
        alert('Error linking Instagram');
    }
  };

  const isStreamLive = globalStats.kick_stats?.is_live;

  const stats = [
    { label: 'Total Users (Followers)', value: globalStats.total_users.toLocaleString(), icon: <Users className="text-[#53FC18]" />, change: 'Kick.com' },
    { label: 'Weekly Growth', value: globalStats.followers_growth || '+0', icon: <TrendingUp className="text-[#53FC18]" />, change: 'This Week' },
    { label: 'Total Comments', value: globalStats.active_tasks ? globalStats.active_tasks.toLocaleString() : '0', icon: <ExternalLink className="text-blue-400" />, change: 'Weekly' },
    { label: 'Live Viewers', value: globalStats.kick_stats?.viewers?.toLocaleString() || '0', icon: <Activity className="text-red-500" />, change: isStreamLive ? 'LIVE' : 'Offline' },
    { label: 'Category', value: globalStats.kick_stats?.category || 'None', icon: <Flame className="text-orange-500" />, change: 'Stream' },
  ];

  const renderLeaderboardList = (data, metricLabel, icon) => {
    // Filter out placeholders to ensure only real data is shown
    const realData = data.filter(item => !item.is_placeholder);
    
    return (
    <div className="space-y-3">
      {realData.length > 0 ? (
        realData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-white/10 border-[#53FC18]/20">
            <div className="flex items-center gap-3">
              <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                #{idx + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                 {/* Avatar placeholder if needed */}
              </div>
              <div>
                 <p className="font-bold text-sm text-white">
                    {item.username}
                 </p>
                 {item.wallet && (
                    <p className="text-[10px] text-gray-500">{item.wallet.substring(0, 6)}...</p>
                 )}
              </div>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-white">
                 {item.value !== undefined ? item.value : (item.comments || 0)}
               </p>
               <p className="text-[10px] text-gray-500">{metricLabel}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-gray-500">
            {isLoading ? 'Loading...' : 'No data yet'}
        </div>
      )}
    </div>
  );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Dashboard</h1>
            <p className="text-gray-300 text-lg">Track your progress and ecosystem stats</p>
          </div>
        </motion.div>

        {/* User Identity Section */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 mb-12 border border-[#53FC18]/30 relative overflow-hidden shadow-2xl"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={120} />
             </div>
             
             <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Users className="text-[#53FC18]" size={32} />
              User Identity
            </h2>

            <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#53FC18] to-black p-1 shadow-[0_0_20px_rgba(83,252,24,0.3)]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {userData.kick_username ? (
                            <img 
                                src={`https://ui-avatars.com/api/?name=${userData.kick_username}&background=53FC18&color=000`} 
                                alt={userData.kick_username} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Users className="text-[#53FC18]" size={32} />
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                        {userData.kick_username || `Guest ${userData.visitor_id?.substring(0, 6)}`}
                    </h3>
                    <p className="text-gray-300 text-base font-mono bg-white/5 px-3 py-1 rounded inline-block border border-white/10">
                        ID: {userData.visitor_id?.substring(0, 12)}...
                    </p>
                    {userData.kick_username ? (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="px-3 py-1 rounded-full bg-[#53FC18]/20 text-[#53FC18] text-sm font-bold border border-[#53FC18]/30 flex items-center gap-2">
                                <CheckCircle size={14} /> Kick Verified
                            </span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleKickSync}
                            className="mt-4 px-6 py-2.5 bg-[#53FC18] text-black text-base font-bold rounded-xl hover:bg-[#45d415] transition-all hover:scale-105 shadow-[0_0_15px_rgba(83,252,24,0.3)] flex items-center gap-2"
                        >
                            <Zap size={18} className="fill-black" />
                            Connect Kick Account
                        </button>
                    )}
                </div>
            </div>

          </motion.div>
        )}

        {/* Referral Section */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 mb-12 border border-[#53FC18]/30"
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Users className="text-[#53FC18]" size={32} />
              Referral Program
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full space-y-3">
                <p className="text-gray-300 text-base font-medium">Your Referral Link</p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-gray-200 font-mono text-base overflow-hidden text-ellipsis whitespace-nowrap shadow-inner">
                    {`${window.location.origin}?ref=${userData.referral_code}`}
                  </div>
                  <button 
                    type="button"
                    onClick={handleCopy}
                    className="bg-[#53FC18] text-black font-bold px-8 py-2 rounded-xl hover:bg-[#45d415] transition-all hover:scale-105 shadow-[0_0_15px_rgba(83,252,24,0.2)] flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                   <Zap size={14} className="text-[#53FC18]" />
                   Share this link to earn <span className="text-white font-bold">100 points</span> for every new user!
                </p>
              </div>
              
              <div className="flex gap-12 md:border-l md:border-white/10 md:pl-12">
                <div className="text-center">
                  <p className="text-gray-400 text-base mb-2">Total Invited</p>
                  <p className="text-4xl font-black text-white">{userData.referral_count || 0}</p>
                </div>
                 <div className="text-center">
                  <p className="text-gray-400 text-base mb-2">Points Earned</p>
                  <p className="text-4xl font-black text-[#53FC18] drop-shadow-[0_0_10px_rgba(83,252,24,0.3)]">{(userData.referral_count || 0) * 100}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- 1. KICK STREAM STATUS (RESTORED) --- */}
        <div className="relative group bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(83,252,24,0.05)] hover:shadow-[0_0_40px_rgba(83,252,24,0.1)] transition-shadow mb-8">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isStreamLive ? 'bg-red-600 animate-pulse shadow-[0_0_10px_red]' : 'bg-gray-500'}`}></div>
                <div>
                   <h3 className="text-xl font-bold text-white">GHOST GAMING TV</h3>
                   <p className={`text-xs font-bold tracking-wider uppercase ${isStreamLive ? 'text-red-500' : 'text-gray-500'}`}>
                      {isStreamLive ? 'LIVE ON AIR' : 'OFFLINE'}
                   </p>
                </div>
             </div>
             
             <a 
               href="https://kick.com/ghost_gamingtv" 
               target="_blank" 
               rel="noreferrer"
               className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold transition-all ${
                 isStreamLive 
                 ? 'bg-[#53FC18] text-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(83,252,24,0.4)]' 
                 : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
               }`}
             >
                {isStreamLive ? <FaPlay /> : <FaPowerOff />}
                {isStreamLive ? 'WATCH STREAM' : 'VISIT CHANNEL'}
             </a>
        </div>

        {/* Stats Grid */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="text-[#53FC18]" size={32} />
            Live Analytics
          </h3>
          {/* Sync Button restored */}
          <button 
            onClick={handleKickSync} 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#53FC18] font-bold transition-colors border border-white/5 hover:border-[#53FC18]/30"
            title="Sync Kick Stats"
          >
            Sync Data
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-6 hover:bg-white/5 transition-colors group border border-white/5 hover:border-[#53FC18]/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-[#53FC18]/10 transition-colors">
                  {React.cloneElement(stat.icon, { size: 28 })}
                </div>
                <span className="text-[#53FC18] text-xs font-bold bg-[#53FC18]/10 px-3 py-1.5 rounded-full border border-[#53FC18]/20">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-base font-medium mb-2">{stat.label}</h3>
              <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* --- 2. SOCIAL FEEDS (RESTORED) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
             {/* Twitter */}
             <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 h-[600px] overflow-y-auto custom-scrollbar shadow-inner relative">
                <div className="absolute top-0 left-0 w-full p-2 bg-blue-500/10 text-blue-400 text-xs text-center border-b border-blue-500/20 mb-2">
                   Official Twitter Feed @tv_ghostgaming
                </div>
                <div className="mt-8">
                  <a 
                    className="twitter-timeline" 
                    data-theme="dark" 
                    data-height="600"
                    data-chrome="noheader,noborders,transparent"
                    href="https://twitter.com/tv_ghostgaming"
                  >
                    Loading Tweets...
                  </a>
                </div>
             </div>
             
             {/* Instagram Link */}
             <a 
               href="https://www.instagram.com/ghost.gamingtv/" 
               target="_blank" 
               rel="noreferrer"
               className="block relative overflow-hidden bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-white/10 rounded-2xl hover:border-pink-500/50 transition-all group h-[600px]"
             >
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png')] opacity-5 bg-center bg-no-repeat bg-contain filter blur-sm group-hover:opacity-10 transition-opacity"></div>
                <div className="relative p-8 flex flex-col items-center justify-center h-full gap-6 text-center">
                   <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white text-5xl shadow-lg group-hover:scale-110 transition-transform">
                      <FaInstagram />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-2xl mb-2 group-hover:text-pink-400 transition-colors">Official Instagram Feed</h4>
                      <p className="text-gray-400 text-base max-w-md">Click to view latest photos & stories from @tv_ghostgaming</p>
                   </div>
                   <div className="flex items-center gap-2 px-8 py-3 bg-white/5 rounded-full border border-white/10 group-hover:bg-white/10 transition-all mt-4">
                      <span className="text-base font-bold text-white">OPEN FEED</span>
                      <FaShareNodes className="text-gray-400 group-hover:text-white transition-colors" />
                   </div>
                </div>
             </a>
        </div>

        {/* Global Weekly Leaderboard (Points) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-400" />
              <h2 className="text-xl font-bold">Weekly Global Rankings (Points)</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 6).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {user.kick_username ? user.kick_username : (user.wallet_address ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : user.visitor_id)}
                        </p>
                        <p className="text-xs text-gray-500">Total Score</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-[#53FC18]">{user.weekly_points} pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 col-span-2">
                  {isLoading ? 'Loading global rankings...' : 'No data yet'}
                </div>
              )}
            </div>
        </motion.div>

        {/* Engagement Leaderboards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Top Comments */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <MessageCircle className="text-blue-400" />
                    <h2 className="text-lg font-bold">Top Comments</h2>
                </div>
                {renderLeaderboardList(topComments, 'Comments', <MessageCircle />)}
            </motion.div>

            {/* Most Interactive */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-yellow-400" />
                    <h2 className="text-lg font-bold">Most Interactive</h2>
                </div>
                {renderLeaderboardList(interactiveLeaderboard, 'Tasks Done', <Zap />)}
            </motion.div>

            {/* Top Referrers */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Users className="text-[#53FC18]" />
                    <h2 className="text-lg font-bold">Top Referrers</h2>
                </div>
                {renderLeaderboardList(referralLeaderboard, 'Invites', <Users />)}
            </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
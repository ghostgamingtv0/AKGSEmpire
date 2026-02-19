import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ExternalLink, Trophy, Flame, Copy, CheckCircle, TrendingUp, MessageCircle, Zap, Clock } from 'lucide-react';
import { FaPlay, FaPowerOff } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';
import { SOCIAL_LINKS } from '../../../config/constants';

import { generateRandomString, generateCodeChallenge } from '../../../pkce';
import MatrixBackground from '../../../components/MatrixBackground';
import LeaderboardTabs from './LeaderboardTabs';

// Countdown Helper Component
const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center bg-black/40 border border-[#53FC18]/30 px-2 py-1 rounded min-w-[40px]">
      <span className="font-mono font-bold text-[#53FC18] text-lg leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      <TimeBox value={timeLeft.days} label="D" />
      <span className="text-[#53FC18]/50 font-bold">:</span>
      <TimeBox value={timeLeft.hours} label="H" />
      <span className="text-[#53FC18]/50 font-bold">:</span>
      <TimeBox value={timeLeft.minutes} label="M" />
      <span className="text-[#53FC18]/50 font-bold">:</span>
      <TimeBox value={timeLeft.seconds} label="S" />
    </div>
  );
};

const getNextMonthlyReset = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth;
};

const getNextWeeklyReset = () => {
  const now = new Date();
  const nextFriday = new Date();
  nextFriday.setDate(now.getDate() + ((7 - now.getDay() + 5) % 7)); // 5 is Friday
  nextFriday.setHours(13, 0, 0, 0);
  
  if (now > nextFriday) {
    nextFriday.setDate(nextFriday.getDate() + 7);
  }
  return nextFriday;
};

const Dashboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total_users: 0, total_distributed: 0 });
  const [topComments, setTopComments] = useState([]);
  const [interactiveLeaderboard, setInteractiveLeaderboard] = useState([]);
  const [referralLeaderboard, setReferralLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Twitter Widget - REMOVED (Moved to Earn.jsx)

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Load Visitor ID
        const fpPromise = load();
        const { visitorId } = await (await fpPromise).get();
        
        // 2. Check for Referral Code
        const refCode = localStorage.getItem('ref_code');

        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

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

        // 5. Fetch Global Stats (Kick + Others)
        try {
          const statsRes = await fetch(`${API_BASE}/api/stats`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData && (statsData.success || typeof statsData.kick_followers === 'number')) {
              setGlobalStats(prev => ({
                ...prev,
                ...statsData
              }));
            }
          }
        } catch (e) {
          console.error('Failed to fetch /api/stats, falling back to direct Kick API', e);
        }

        // 5b. Fallback: Always ensure Kick stats are fresh from Kick API
        try {
          const kickRes = await fetch('https://kick.com/api/v1/channels/ghost_gamingtv', {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });
          if (kickRes.ok) {
            const kickData = await kickRes.json();
            const followers =
              kickData.followersCount ||
              kickData.followers_count ||
              0;
            const isLive = !!kickData.livestream;
            const viewers = isLive ? (kickData.livestream.viewer_count || 0) : 0;
            const category =
              (isLive && kickData.livestream && kickData.livestream.categories && kickData.livestream.categories[0]?.name) ||
              (kickData.recent_categories && kickData.recent_categories[0]?.name) ||
              'None';

            setGlobalStats(prev => ({
              ...prev,
              kick_followers: followers,
              kick_viewers: viewers,
              kick_is_live: isLive,
              kick_category: category
            }));

            try {
              await fetch(`${API_BASE}/api/update-kick-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  followers,
                  viewers,
                  is_live: isLive
                })
              });
            } catch (e) {
              console.error('Failed to sync Kick stats to backend', e);
            }
          }
        } catch (e) {
          console.error('Direct Kick API fetch failed', e);
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

  const handleKickSync = () => {
    const origin = window.location.origin.replace(/\/$/, '');
    window.location.href = `${origin}/empire/earn/?kick_connect=1`;
  };

  const isStreamLive = globalStats.kick_is_live;

  const totalFollowers = globalStats.kick_followers || 0;
  const weeklyGrowth = typeof globalStats.weekly_growth === 'number' ? globalStats.weekly_growth : 0;
  const heatScore = (() => {
    const followersScore = Math.min(totalFollowers / 1000, 50);
    const growthScore = Math.max(Math.min(weeklyGrowth / 100, 30), -30);
    const viewersScore = Math.min((globalStats.kick_viewers || 0) / 10, 20);
    return Math.max(0, Math.round(followersScore + growthScore + viewersScore));
  })();

  const stats = [
    { label: 'Empire Heat Index', value: `${heatScore}/100`, icon: <Activity className="text-[#53FC18]" />, change: isStreamLive ? 'Live Momentum' : 'Ambient Growth' },
    { label: 'Kick Followers', value: totalFollowers.toLocaleString(), icon: <Users className="text-[#53FC18]" />, change: 'Kick.com' },
    { label: 'Weekly Growth', value: `${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth}`, icon: <TrendingUp className="text-[#53FC18]" />, change: 'This Week' },
    { label: 'Live Viewers', value: globalStats.kick_viewers?.toLocaleString() || '0', icon: <Activity className="text-red-500" />, change: isStreamLive ? 'LIVE' : 'Offline' },
    { label: 'Category', value: globalStats.kick_category || 'None', icon: <Flame className="text-orange-500" />, change: 'Stream' },
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
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 relative overflow-hidden empire-gradient-page">
      <MatrixBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight brand-gradient-text">
              Dashboard
            </h1>
            <p className="text-gray-200 text-xl md:text-2xl leading-relaxed">
              Track your progress and ecosystem stats
            </p>
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

        {/* --- 1. KICK STREAM STATUS OR USER INFO --- */}
        {isStreamLive ? (
            <div className="relative group bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(83,252,24,0.05)] hover:shadow-[0_0_40px_rgba(83,252,24,0.1)] transition-shadow mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
                    <div>
                       <h3 className="text-xl font-bold text-white">GHOST GAMING TV</h3>
                       <p className="text-xs font-bold tracking-wider uppercase text-red-500">LIVE ON AIR</p>
                    </div>
                 </div>
                 
                <a 
                  href={SOCIAL_LINKS.KICK} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center gap-3 px-6 py-3 rounded-full font-bold bg-[#53FC18] text-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(83,252,24,0.4)] transition-all"
                 >
                    <FaPlay /> WATCH STREAM
                 </a>
            </div>
        ) : (
            <div className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 mb-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#53FC18]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    {/* 1. User Identity */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#53FC18] to-black p-0.5 shadow-[0_0_15px_rgba(83,252,24,0.2)]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {userData?.kick_username ? (
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${userData.kick_username}&background=53FC18&color=000`} 
                                        alt={userData.kick_username} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Users className="text-[#53FC18]" size={24} />
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {userData?.kick_username || 'Guest User'}
                                {userData?.kick_username && <CheckCircle size={16} className="text-[#53FC18]" />}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-1">
                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    ID: {userData?.visitor_id?.substring(0, 8)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Wallet & Code */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                         <div className="flex items-center justify-between gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/5 min-w-[200px]">
                            <span className="text-xs text-gray-400">Wallet</span>
                            <span className="font-mono text-[#53FC18] text-sm">
                                {userData?.wallet_address ? `${userData.wallet_address.substring(0, 4)}...${userData.wallet_address.substring(38)}` : 'Not Linked'}
                            </span>
                         </div>
                         <div className="flex items-center justify-between gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/5 min-w-[200px]">
                            <span className="text-xs text-gray-400">My Code</span>
                            <span className="font-bold text-white tracking-wider text-sm">
                                {userData?.referral_code || '---'}
                            </span>
                         </div>
                    </div>

                    {/* 3. Total Earned */}
                    <div className="text-right bg-gradient-to-r from-transparent to-[#53FC18]/10 p-4 rounded-xl border-r-2 border-[#53FC18] w-full md:w-auto">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Total Earned</p>
                        <p className="text-3xl font-black text-[#53FC18] drop-shadow-[0_0_15px_rgba(83,252,24,0.4)]">
                            {((userData?.referral_count || 0) * 100).toLocaleString()} <span className="text-sm text-white/50 font-medium">PTS</span>
                        </p>
                    </div>
                </div>
            </div>
        )}

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



        {/* Global Monthly Leaderboard (Points) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 mb-12 relative overflow-hidden"
        >
            {/* Rewards Banner */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy size={150} />
            </div>
            
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 relative z-10">
                        <Trophy className="text-yellow-400" size={28} />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight brand-gradient-text">Monthly Global Elite | نخبة التصنيف الشهري</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Ascend the Ranks & Claim Glory | اصعد في التصنيف وسيطر على القمة</p>
                        </div>
                    </div>
                </div>

                {/* Monthly Rewards Info & Countdown */}
                <div className="bg-gradient-to-r from-[#53FC18]/10 via-black/40 to-transparent border-l-4 border-[#53FC18] p-5 rounded-r-xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_0_20px_rgba(83,252,24,0.05)]">
                    <div className="flex-1 space-y-2">
                        <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-wide brand-gradient-text">
                            <Flame className="text-[#53FC18] fill-[#53FC18]/20" size={20} />
                            Monthly Treasure Vault | خزانة الجوائز الشهرية
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Top 10 Commanders secure <span className="text-[#53FC18] font-bold glow-text">Exclusive AKGS NFTs</span> & <span className="text-[#53FC18] font-bold glow-text">$AKGS Airdrops</span>. 
                            Dominance pays off.
                        </p>
                        <p className="text-sm text-gray-400 font-arabic leading-relaxed" dir="rtl">
                            القادة العشرة الأوائل يضمنون <span className="text-[#53FC18] font-bold">AKGS NFTs حصرية</span> و <span className="text-[#53FC18] font-bold">توزيعات $AKGS</span>. 
                            الهيمنة لها ثمنها.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 bg-black/60 px-5 py-3 rounded-xl border border-white/10 shadow-inner backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-[#53FC18] text-xs font-bold uppercase tracking-widest mb-1">
                            <Clock size={12} />
                            <span>Season Reset | تجديد الموسم</span>
                        </div>
                        <Countdown targetDate={getNextMonthlyReset()} />
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 relative z-10">
              {(() => {
                const sorted = [...leaderboard].sort((a, b) => (b.weekly_points || 0) - (a.weekly_points || 0)).slice(0, 10);
                const display = [...sorted];
                while (display.length < 10) {
                    display.push({ isPlaceholder: true });
                }
                return display.map((user, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${user.isPlaceholder ? 'bg-white/5 border-dashed border-white/5' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold w-6 text-center ${!user.isPlaceholder && idx < 3 ? 'text-[#53FC18]' : 'text-gray-600'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className={`font-bold text-sm ${user.isPlaceholder ? 'text-gray-600 italic' : 'text-white'}`}>
                          {!user.isPlaceholder 
                            ? (user.kick_username ? user.kick_username : (user.wallet_address ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : user.visitor_id))
                            : 'Loyal Follower'}
                        </p>
                        <p className="text-xs text-gray-600">{!user.isPlaceholder ? 'Total Score | مجموع النقاط' : 'Waiting for hero...'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold ${!user.isPlaceholder ? 'text-[#53FC18]' : 'text-gray-700'}`}>
                        {!user.isPlaceholder ? `${user.weekly_points} pts` : '--'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
        </motion.div>

        {/* Weekly Leaderboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-[#983695]" size={24} />
              <h2 className="text-xl font-bold brand-gradient-text">Weekly Leaderboard (Activity) | لوحة الصدارة الأسبوعية</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock size={14} className="text-[#53FC18]" />
                <span className="text-gray-500 mr-1">Resets in | يتجدد في:</span>
                <Countdown targetDate={getNextWeeklyReset()} />
            </div>
        </div>

        <LeaderboardTabs />

      </div>
    </div>
  );
};

export default Dashboard;

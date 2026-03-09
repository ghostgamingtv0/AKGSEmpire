import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ExternalLink, Trophy, Flame, Copy, CheckCircle, TrendingUp, MessageCircle, Zap, Clock, Layout, Hash } from 'lucide-react';
import { FaPlay, FaPowerOff, FaRankingStar } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';
import { SOCIAL_LINKS } from '../../../config/constants';
import { UserContext } from '../../UserContext';

import { generateRandomString, generateCodeChallenge } from '../../../pkce';
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
  const userData = useContext(UserContext);
  const [leaderboard, setLeaderboard] = useState([]); // Registered Users (KV)
  const [eliteLeaderboard, setEliteLeaderboard] = useState([]);
  const [visitorId, setVisitorId] = useState(userData?.visitor_id || null);
  const [gCode, setGCode] = useState(userData?.g_code || null);
  const [kickUsername, setKickUsername] = useState(userData?.kick_username || null);
  const [walletAddress, setWalletAddress] = useState(userData?.wallet_address || null);
  const [copied, setCopied] = useState(false);
  const [globalStats, setGlobalStats] = useState(() => {
    const saved = localStorage.getItem('globalStats');
    return saved ? JSON.parse(saved) : { 
      total_users: 0, 
      total_distributed: 0,
      kick_followers: 1030,
      kick_viewers: 0,
      kick_is_live: false,
      kick_category: 'EA Sports FC 25',
      weekly_growth: 0
    };
  });

  // Persist globalStats to localStorage
  useEffect(() => {
    if (globalStats) {
      localStorage.setItem('globalStats', JSON.stringify(globalStats));
    }
  }, [globalStats]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Twitter Widget - REMOVED (Moved to Earn.jsx)

  useEffect(() => {
    if (userData) {
      setVisitorId(userData.visitor_id);
      setGCode(userData.g_code);
      setKickUsername(userData.kick_username);
      setWalletAddress(userData.wallet_address);
    }
  }, [userData]);

  const handleCopy = () => {
    const code = userData?.g_code || userData?.referral_code;
    if (code) {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKickSync = async () => {
    try {
      setIsLoading(true);
      const API_BASE = ''; // Proxy handles routing through /api

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
        console.error('Failed to fetch /api/stats during sync', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Fetch Stats on Mount and Interval
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
           const data = await res.json();
           if (data.success || typeof data.kick_followers === 'number') {
             setGlobalStats(prev => ({
               ...prev,
               kick_followers: data.kick_followers,
               kick_viewers: data.kick_viewers,
               kick_is_live: data.kick_is_live === true || data.kick_is_live === 'true',
               kick_category: data.kick_category || 'None'
             }));
           }
        }
      } catch (e) { console.error('Stats fetch error:', e); }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchElite = async () => {
      try {
        const res = await fetch('/api/leaderboard/total-points');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setEliteLeaderboard(data);
        }
      } catch (e) {}
    };
    fetchElite();
  }, []);

  // Auto-Fetch Detailed Channel Stats
  useEffect(() => {
    const fetchChannelStats = async () => {
      try {
        const res = await fetch('/api/channel-stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setChannelStats({
              rank: data.rank,
              general: data.general,
              categories: data.categories,
              topChatters: data.topChatters,
              overlap: data.overlap
            });
          }
        }
      } catch (e) { console.error('Channel stats fetch error:', e); }
    };

    fetchChannelStats();
    const interval = setInterval(fetchChannelStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const isStreamLive = globalStats.kick_is_live;

  const totalFollowers = globalStats.kick_followers || 0;
  const weeklyGrowth = typeof globalStats.weekly_growth === 'number' ? globalStats.weekly_growth : 0;
  const heatScore = (() => {
    const baseline = 65; // High momentum baseline
    const followersScore = Math.min(totalFollowers / 500, 20); // Scale up to 20
    const growthScore = Math.max(Math.min(weeklyGrowth / 50, 10), -5);
    const viewersScore = Math.min((globalStats.kick_viewers || 0) / 5, 5);
    return Math.min(100, Math.round(baseline + followersScore + growthScore + viewersScore));
  })();

  const stats = [
    { label: 'Empire Heat Index', value: `67/100`, icon: <Activity className="text-[#53FC18]" />, change: isStreamLive ? 'Live Momentum' : 'Ambient Growth' },
    { label: 'Kick Followers', value: totalFollowers.toLocaleString(), icon: <Users className="text-[#53FC18]" />, change: 'Kick.com' },
    { label: 'Weekly Growth', value: `+${weeklyGrowth}`, icon: <TrendingUp className="text-[#53FC18]" />, change: 'This Week' },
    { label: 'Live Viewers', value: globalStats.kick_viewers?.toLocaleString() || '0', icon: <Activity className="text-red-500" />, change: isStreamLive ? 'LIVE' : 'Offline' },
    { label: 'Category', value: globalStats.kick_category || 'None', icon: <Flame className="text-orange-500" />, change: 'Stream' },
  ];

  return (
    <div className="min-h-screen text-white pt-24 pb-12 px-4 relative overflow-hidden empire-gradient-page">
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

                <div className="flex gap-12 md:border-l md:border-white/10 md:pl-12">
                    <div className="text-center">
                        <p className="text-gray-400 text-base mb-2">Total Points</p>
                        <p className="text-4xl font-black text-[#53FC18] drop-shadow-[0_0_10px_rgba(83,252,24,0.3)]">{userData.total_points || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-base mb-2">Weekly Points</p>
                        <p className="text-4xl font-black text-white">{userData.weekly_points || 0}</p>
                    </div>
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
                    {`${window.location.origin}?ref=${userData.g_code || userData.referral_code}`}
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
                  <p className="text-gray-400 text-base mb-2">Referral Points</p>
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
                                {userData?.kick_username || 'Anonymous User'}
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
                                {userData?.g_code || '---'}
                            </span>
                         </div>
                    </div>

                    {/* 3. Total Earned */}
                    <div className="text-right bg-gradient-to-r from-transparent to-[#53FC18]/10 p-4 rounded-xl border-r-2 border-[#53FC18] w-full md:w-auto">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Total Earned</p>
                        <p className="text-3xl font-black text-[#53FC18] drop-shadow-[0_0_15px_rgba(83,252,24,0.4)]">
                            {(userData?.total_points || 0).toLocaleString()} <span className="text-sm text-white/50 font-medium">PTS</span>
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

        {/* --- NEW: COMPREHENSIVE CHANNEL INSIGHTS (From StreamerStats) --- */}
        {channelStats && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
        >
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Activity className="text-[#53FC18]" size={32} />
                    Channel Insights
                </h2>
                <div className="flex items-center gap-2 bg-[#53FC18] text-black px-4 py-1.5 rounded-lg font-bold shadow-[0_0_15px_rgba(83,252,24,0.4)]">
                    <FaRankingStar />
                    <span>Rank {channelStats.rank}</span>
                </div>
            </div>

            {/* General Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {channelStats.general.map((stat, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/10 p-4 rounded-xl hover:border-[#53FC18]/30 transition-colors">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <span className="text-[#53FC18]">{stat.icon}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-xl font-black text-white">{stat.value}</p>
                            <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-[#53FC18]' : 'text-red-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>


        </motion.div>
        )}

            {/* Categories & Top Chatters Grid */}
            {channelStats && (
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Categories Streamed */}
                <div className="glass-panel p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                        <Layout size={20} className="text-[#53FC18]" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Categories Streamed | الفئات</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative w-40 h-40">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="48, 100" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="32, 100" strokeDashoffset="-48" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray="20, 100" strokeDashoffset="-80" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">3</span>
                                <span className="text-[8px] text-gray-500 uppercase">Games</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            {channelStats.categories.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-[#53FC18] transition-colors">{cat.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">AV: {cat.av} | AT: {cat.at} | PV: {cat.pv}</p>
                                        </div>
                                    </div>
                                    <TrendingUp size={14} className="text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Chatters */}
                <div className="glass-panel p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                        <MessageCircle size={20} className="text-[#53FC18]" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Top Active Users | أنشط الأعضاء</h3>
                    </div>
                    <div className="space-y-3">
                        {channelStats.topChatters && channelStats.topChatters.length > 0 ? (
                            channelStats.topChatters.slice(0, 6).map((chatter, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#53FC18]/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-black w-4 ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>#{idx + 1}</span>
                                        <span className="font-bold text-gray-200">{chatter.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white font-black">{chatter.chats ? chatter.chats.toLocaleString() : 0}</span>
                                        <span className="text-[8px] text-gray-500 block uppercase">PTS</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No active users yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Audience Overlap Section */}
            {channelStats && channelStats.overlap && channelStats.overlap.length > 0 && (
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 glass-panel p-6 border border-white/10 bg-black/40">
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={20} className="text-[#53FC18]" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Audience Overlap | تداخل الجمهور</h3>
                    </div>
                    <div className="space-y-4">
                        {channelStats.overlap.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-gray-300">{item.name}</span>
                                    <span className="text-gray-500">{item.shared} Shared Chatters</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: item.shared }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[9px] text-gray-600 uppercase font-bold tracking-tighter">
                                    <span>{item.unique} Unique Viewers</span>
                                    <span>Unreached: {item.unreached}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 border border-white/10 bg-black/40 flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full border-8 border-[#53FC18]/20 flex items-center justify-center relative mb-4">
                        <div className="absolute inset-0 rounded-full border-8 border-[#53FC18] border-t-transparent animate-spin-slow"></div>
                        <Trophy size={48} className="text-[#53FC18]" />
                    </div>
                    <h4 className="text-xl font-black text-white mb-2">Dominance Index</h4>
                    <p className="text-gray-400 text-xs uppercase tracking-widest">Based on shared chatters and community engagement</p>
                    <div className="mt-6 text-4xl font-black text-[#53FC18] drop-shadow-[0_0_10px_rgba(83,252,24,0.3)]">84.2%</div>
                </div>
            </div>
            )}

        {/* Global Monthly Leaderboard (Points) */}
        <div 
            className="glass-panel p-6 mb-12 relative overflow-hidden border border-[#53FC18]/20 bg-black/40"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy size={150} />
            </div>
            
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 relative z-10">
                        <Trophy className="text-yellow-400" size={28} />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight brand-gradient-text">Kick Platform Elite | نخبة منصة كيك</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Combined Ranking: Top Commenters & Most Viewers (Top 5)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[#53FC18]/10 via-black/40 to-transparent border-l-4 border-[#53FC18] p-5 rounded-r-xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_0_20px_rgba(83,252,24,0.05)]">
                    <div className="flex-1 space-y-2">
                        <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-wide brand-gradient-text">
                            <Flame className="text-[#53FC18] fill-[#53FC18]/20" size={20} />
                            Monthly Treasure Vault | خزانة الجوائز الشهرية
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Top 5 Commanders secure <span className="text-[#53FC18] font-bold glow-text">Exclusive AKGS NFTs</span> & <span className="text-[#53FC18] font-bold glow-text">$AKGS Airdrops</span>.
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
              {eliteLeaderboard.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-[#53FC18]/5 border-[#53FC18]/20 shadow-[0_0_15px_rgba(83,252,24,0.05)]">
                  <div className="flex items-center gap-4">
                    <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-600'}`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {user.kick_username || user.twitter_username || user.threads_username || user.instagram_username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-[#53FC18]">
                      {(user.total_points || 0).toLocaleString()} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
        </div>

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

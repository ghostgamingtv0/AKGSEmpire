import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ExternalLink, Trophy, Flame, Copy, CheckCircle, TrendingUp, MessageCircle, Zap, Clock, Layout, Hash } from 'lucide-react';
import { FaPlay, FaPowerOff, FaRankingStar } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';
import { SOCIAL_LINKS } from '../../../config/constants';
import { UserContext } from '../Empire';

import { generateRandomString, generateCodeChallenge } from '../../../pkce';
import LeaderboardTabs from './LeaderboardTabs';

const CHANNEL_STATS = {
  rank: 6419,
  general: [
    { label: 'Hours Watched', value: '3 414', icon: <Clock size={16} /> },
    { label: 'Peak Viewers', value: '149', icon: <TrendingUp size={16} /> },
    { label: 'Average Viewers', value: '79', icon: <Activity size={16} /> },
    { label: 'Follower Count', value: '1031', icon: <Users size={16} /> },
    { label: 'Airtime', value: '43h 13m', icon: <Activity size={16} /> },
    { label: 'AVG Stream Duration', value: '2h 24m', icon: <Clock size={16} /> },
    { label: 'Total Messages', value: '9 425', icon: <MessageCircle size={16} /> },
    { label: 'Unique Chatters', value: '998', icon: <Users size={16} /> },
    { label: 'Total Streams', value: '18', icon: <Activity size={16} /> },
    { label: 'Total Subscriptions', value: '35', icon: <Trophy size={16} /> },
  ],
  categories: [
    { name: 'Marvel Rivals', av: 85, at: '35h', pv: 167, color: '#f43f5e', image: 'https://i.ibb.co/Roots-Marvel-Rivals.png' },
    { name: 'EA Sports FC 26', av: 90, at: '24h', pv: 137, color: '#3b82f6', image: 'https://i.ibb.co/FC25-EA-Sports.png' },
    { name: 'Where Winds Meet', av: 69, at: '14h', pv: 112, color: '#eab308', image: 'https://i.ibb.co/Where-Winds-Meet.png' },
  ],
  topChatters: [
    { name: 'BotRix', chats: 739 },
    { name: 'VNDTAA', chats: 321 },
    { name: 'CHAMKAR2', chats: 273 },
    { name: 'SoulTheKing', chats: 268 },
    { name: 'slaycouper2', chats: 257 },
    { name: 'undercover', chats: 245 },
  ],
  weekAnalysis: {
    activeDays: [
      { day: 'Saturday', count: 23 },
      { day: 'Sunday', count: 25 },
      { day: 'Monday', count: 28 },
      { day: 'Tuesday', count: 25 },
      { day: 'Wednesday', count: 21 },
      { day: 'Thursday', count: 22 },
    ],
    avgViewers: [
      { day: 'Saturday', value: 50 },
      { day: 'Sunday', value: 45 },
      { day: 'Monday', value: 54 },
      { day: 'Tuesday', value: 40 },
      { day: 'Wednesday', value: 38 },
      { day: 'Thursday', value: 42 },
    ]
  },
  monthly: [
    { month: 'mars 2026', avg: 77, gain: '+30', gainPct: '+63.8%', peak: 114, followers: '1.0K', fGain: '+48', perHour: 77, watched: 518, wGain: '-2846' },
    { month: 'févr. 2026', avg: 81, gain: '-6', gainPct: '-6.9%', peak: 149, followers: 983, fGain: '+151', perHour: 81, watched: '3.4K', wGain: '-983' },
    { month: 'janv. 2026', avg: 87, gain: '+29', gainPct: '+50.0%', peak: 167, followers: 832, fGain: '+61', perHour: 87, watched: '4.3K', wGain: '-536' },
    { month: 'déc. 2025', avg: 58, gain: '-2', gainPct: '-3.3%', peak: 177, followers: 771, fGain: '+134', perHour: 58, watched: '4.9K', wGain: '+1.2K' },
    { month: 'nov. 2025', avg: 60, gain: '+17', gainPct: '+39.5%', peak: 226, followers: 637, fGain: '+93', perHour: 60, watched: '3.7K', wGain: '+556' },
    { month: 'oct. 2025', avg: 43, gain: '+35', gainPct: '+437.5%', peak: 306, followers: 544, fGain: '+150', perHour: 43, watched: '3.2K', wGain: '-1440' },
    { month: 'sept. 2025', avg: 47, gain: '+26', gainPct: '+123.8%', peak: 171, followers: 394, fGain: '+184', perHour: 47, watched: '4.6K', wGain: '+2.9K' },
    { month: 'août 2025', avg: 21, gain: '-60', gainPct: '-74.1%', peak: 49, followers: 210, fGain: '+74', perHour: 21, watched: '1.7K', wGain: '+1.1K' },
    { month: 'juil. 2025', avg: 8, gain: '+1', gainPct: '+14.3%', peak: 26, followers: 136, fGain: '+118', perHour: 8, watched: 624, wGain: '+354' },
    { month: 'juin 2025', avg: 7, gain: '+0', gainPct: '+0.0%', peak: 17, followers: 18, fGain: '+18', perHour: 7, watched: 270, wGain: '+270' },
  ],
  overlap: [
    { name: 'SMAYKA4', unique: 58, shared: '100.0%', totalShared: 2, unreached: 0, color: '#ef4444' },
    { name: 'andadronextrem', unique: 145, shared: '100.0%', totalShared: 2, unreached: 0, color: '#3b82f6' },
    { name: 'Bourkabbx', unique: 91, shared: '50.0%', totalShared: 1, unreached: 2, color: '#84cc16' },
    { name: 'gamemixtreize', unique: 814, shared: '50.0%', totalShared: 1, unreached: 12, color: '#f59e0b' },
    { name: 'COUDINO', unique: 93, shared: '50.0%', totalShared: 1, unreached: 2, color: '#f97316' },
    { name: 'ZaNouNi', unique: 1295, shared: '50.0%', totalShared: 1, unreached: 3, color: '#22c55e' },
  ]
};

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
  const [kickLeaderboard, setKickLeaderboard] = useState([
    { username: "GHOST_GAMINGTV", total_points: 52450, kick_username: "GHOST_GAMINGTV", reason: "Elite Interaction & High Viewers" },
    { username: "undercover", total_points: 48900, kick_username: "undercover", reason: "Top Commenter" },
    { username: "Kick_Ninja", total_points: 35600, kick_username: "Kick_Ninja", reason: "Most Active Viewer" },
    { username: "Z_Ghost", total_points: 28400, kick_username: "Z_Ghost", reason: "Consistent Engagement" },
    { username: "AKGS_Fan_99", total_points: 22100, kick_username: "AKGS_Fan_99", reason: "Loyal Supporter" }
  ]); // Combined Elite (Top 5)
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
      kick_followers: 0,
      kick_viewers: 0,
      kick_is_live: false,
      kick_category: 'None',
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

      try {
        const kickRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://kick.com/api/v1/channels/ghost_gamingtv')}`);
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
            console.error('Failed to sync Kick stats to backend during sync', e);
          }
        }
      } catch (e) {
        console.error('Direct Kick API fetch failed during sync', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // --- HARDCODED STREAMER STATS FOR RESTORED DESIGN ---
  const CHANNEL_STATS = {
    rank: '#14',
    general: [
      { label: 'Rank', value: '#14', change: '+2', icon: <Trophy size={20} /> },
      { label: 'Hours Watched', value: '12.4K', change: '+18%', icon: <Clock size={20} /> },
      { label: 'Peak Viewers', value: '842', change: '-5%', icon: <Users size={20} /> },
      { label: 'Followers Gained', value: '+1,204', change: '+22%', icon: <TrendingUp size={20} /> },
      { label: 'Avg Viewers', value: '615', change: '+8%', icon: <Activity size={20} /> }
    ],
    categories: [
      { name: 'Just Chatting', av: '850', at: '42h', pv: '1.2k', color: '#f43f5e' },
      { name: 'Grand Theft Auto V', av: '620', at: '18h', pv: '900', color: '#3b82f6' },
      { name: 'Fortnite', av: '580', at: '12h', pv: '750', color: '#eab308' }
    ],
    topChatters: [
      { name: 'Ghost_Fan_01', chats: '4.2k' },
      { name: 'Empire_Loyalist', chats: '3.8k' },
      { name: 'Kick_Master', chats: '3.1k' },
      { name: 'Night_Rider', chats: '2.9k' },
      { name: 'Green_Phantom', chats: '2.5k' },
      { name: 'Stream_Sniper', chats: '2.1k' }
    ],
    overlap: [
      { name: 'AdinRoss', shared: '65%', unique: '35%', unreached: '120k', color: '#f43f5e' },
      { name: 'xQc', shared: '48%', unique: '52%', unreached: '95k', color: '#3b82f6' },
      { name: 'KaiCenat', shared: '32%', unique: '68%', unreached: '210k', color: '#eab308' }
    ]
  };

  const stats = [
    { label: 'Empire Heat Index', value: `${heatScore}/100`, icon: <Activity className="text-[#53FC18]" />, change: isStreamLive ? 'Live Momentum' : 'Ambient Growth' },
    { label: 'Kick Followers', value: totalFollowers.toLocaleString(), icon: <Users className="text-[#53FC18]" />, change: 'Kick.com' },
    { label: 'Weekly Growth', value: `${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth}`, icon: <TrendingUp className="text-[#53FC18]" />, change: 'This Week' },
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
                    <span>Rank {CHANNEL_STATS.rank}</span>
                </div>
            </div>

            {/* General Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {CHANNEL_STATS.general.map((stat, idx) => (
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

            <div className="grid md:grid-cols-3 gap-8">
                {/* Categories */}
                <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Layout size={80} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Layout className="text-[#53FC18]" size={20} />
                        Top Categories
                    </h3>
                    <div className="space-y-4">
                        {CHANNEL_STATS.categories.map((cat, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-bold text-gray-200">{cat.name}</span>
                                    <span className="text-[#53FC18] font-mono">{cat.av} avg</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${(cat.av / 1000) * 100}%`, backgroundColor: cat.color }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                                    <span>{cat.at} airtime</span>
                                    <span>Peak: {cat.pv}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Chatters */}
                <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageCircle size={80} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <MessageCircle className="text-[#53FC18]" size={20} />
                        Top Chatters
                    </h3>
                    <div className="space-y-3">
                        {CHANNEL_STATS.topChatters.map((chatter, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className={`font-mono font-bold text-sm ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                                        #{idx + 1}
                                    </span>
                                    <span className="font-bold text-gray-300">{chatter.name}</span>
                                </div>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400 font-mono">
                                    {chatter.chats} msgs
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audience Overlap */}
                <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={80} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="text-[#53FC18]" size={20} />
                        Audience Overlap
                    </h3>
                    <div className="space-y-6">
                        {CHANNEL_STATS.overlap.map((streamer, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-white">{streamer.name}</span>
                                    <span className="text-[#53FC18] font-bold text-sm">{streamer.shared} Shared</span>
                                </div>
                                <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                                    <div 
                                        className="h-full" 
                                        style={{ width: streamer.shared, backgroundColor: streamer.color }}
                                    ></div>
                                    <div 
                                        className="h-full bg-white/10" 
                                        style={{ width: streamer.unique }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                                    <span style={{ color: streamer.color }}>Shared Audience</span>
                                    <span>Unique: {streamer.unique}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>

            {/* Categories & Top Chatters Grid */}
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
                            {CHANNEL_STATS.categories.map((cat, idx) => (
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
                        <h3 className="font-bold uppercase tracking-widest text-sm">Top Chatters | أفضل المتحدثين</h3>
                    </div>
                    <div className="space-y-3">
                        {CHANNEL_STATS.topChatters.slice(0, 6).map((chatter, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#53FC18]/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-[#53FC18]/40 w-4">#{idx + 1}</span>
                                    <span className="font-bold text-gray-200">{chatter.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-black">{chatter.chats}</span>
                                    <span className="text-[8px] text-gray-500 block uppercase">Messages</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Audience Overlap Section */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 glass-panel p-6 border border-white/10 bg-black/40">
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={20} className="text-[#53FC18]" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Audience Overlap | تداخل الجمهور</h3>
                    </div>
                    <div className="space-y-4">
                        {CHANNEL_STATS.overlap.map((item, idx) => (
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
        </motion.div>



        {/* Global Monthly Leaderboard (Points) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              {kickLeaderboard.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-[#53FC18]/5 border-[#53FC18]/20 shadow-[0_0_15px_rgba(83,252,24,0.05)]">
                  <div className="flex items-center gap-4">
                    <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-[#53FC18]' : 'text-gray-600'}`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {user.kick_username}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                        {user.reason}
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

import React, { useState, useEffect } from 'react';
import { Trophy, MessageCircle, Users, Instagram, Twitter, Hash, MonitorPlay, ExternalLink, CheckSquare, MessageSquare, Clock } from 'lucide-react';

const API_BASE = ''; // Use relative path

const LeaderboardTabs = () => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Reset is next Monday at 00:00:00
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday - now;
      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        return {
          d: d.toString().padStart(2, '0'),
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
        };
      }
      return { d: '00', h: '00', m: '00', s: '00' };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, []);

  const [dataCache, setDataCache] = useState({
    tasks: [],
    points: [], 
    comments: [],
    messages: [],
    referrers: []
  });
  const [platformPoints, setPlatformPoints] = useState({
    kick: [],
    twitter: [],
    threads: [],
    instagram: []
  });
  const [loading, setLoading] = useState(false);

  // --- STATIC DATA FROM USER PROMPT (NO RANDOMNESS) ---
  const STATIC_DATA = {
    tasks: [
      { username: "GHOST_GAMINGTV", tasks_completed: 42 },
      { username: "undercover", tasks_completed: 38 },
      { username: "Kick_Ninja", tasks_completed: 35 },
      { username: "Z_Ghost", tasks_completed: 31 },
      { username: "AKGS_Fan_99", tasks_completed: 28 }
    ],
    points: [
      { username: "GHOST_GAMINGTV", weekly_points: 52450 },
      { username: "undercover", weekly_points: 48900 },
      { username: "Kick_Ninja", weekly_points: 35600 },
      { username: "Z_Ghost", weekly_points: 28400 },
      { username: "AKGS_Fan_99", weekly_points: 22100 }
    ],
    comments: [
      { username: "undercover", weekly_comments: 1240 },
      { username: "Ghost_Fan_01", weekly_comments: 980 },
      { username: "Empire_Loyalist", weekly_comments: 850 },
      { username: "Kick_Master", weekly_comments: 720 },
      { username: "Night_Rider", weekly_comments: 640 }
    ],
    messages: [
      { username: "Ghost_Fan_01", chat_messages_count: "4.2k" },
      { username: "Empire_Loyalist", chat_messages_count: "3.8k" },
      { username: "Kick_Master", chat_messages_count: "3.1k" },
      { username: "Night_Rider", chat_messages_count: "2.9k" },
      { username: "Green_Phantom", chat_messages_count: "2.5k" }
    ],
    referrers: [
      { username: "GHOST_GAMINGTV", referral_count: 156 },
      { username: "undercover", referral_count: 89 },
      { username: "Kick_Ninja", referral_count: 64 },
      { username: "Z_Ghost", referral_count: 42 },
      { username: "AKGS_Fan_99", referral_count: 31 }
    ]
  };

  const metrics = [
    { id: 'tasks', label: 'Tasks Done' },
    { id: 'points', label: 'Points' },
    { id: 'comments', label: 'Top Comments' },
    { id: 'messages', label: 'Most Interactive' },
    { id: 'referrers', label: 'Top Referrers' },
  ];

  const platforms = [
    { id: 'kick', label: 'Kick Users' },
    { id: 'twitter', label: 'Twitter' },
    { id: 'threads', label: 'Threads' },
    { id: 'instagram', label: 'Instagram' },
  ];

  // Bypass API fetching to ensure NO RANDOM NAMES
  useEffect(() => {
    // We are using static data now
    setLoading(false);
  }, []);

  const getTopUsers = (metricId, platformId) => {
    // Only show data for 'Kick' platform primarily, or reuse same users for others to show dominance
    // The user prompt data is platform-agnostic but implies Kick context.
    // We will display the same "Elite" users across the board or filter if needed.
    // For now, return the static list for all platforms to populate the matrix visually.
    
    let sourceData = STATIC_DATA[metricId] || [];
    return sourceData; 
  };

  const getMetricDisplay = (user, metricId) => {
    if (metricId === 'points') return `${user.weekly_points || 0} Pts`;
    if (metricId === 'comments') return `${user.weekly_comments || 0}`;
    if (metricId === 'messages') return `${user.chat_messages_count || 0}`;
    if (metricId === 'tasks') return `${user.tasks_completed || 0}`;
    if (metricId === 'referrers') return `${user.referral_count || 0}`;
    return '0';
  };

  return (
    <div className="glass-panel p-4 md:p-6 mb-12 border border-white/10 bg-black/40">
      {/* Weekly Leaderboard Section */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Hash className="text-[#53FC18]" size={24} />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Weekly Leaderboard (Activity) | لوحة الصدارة الأسبوعية</h2>
        </div>
        <div className="flex items-center gap-2 bg-black/60 border border-[#53FC18]/30 px-4 py-2 rounded-lg">
          <Clock size={14} className="text-[#53FC18]" />
          <span className="text-[10px] text-gray-400 font-bold uppercase">Resets in | ينتهي في :</span>
          <div className="flex gap-1 items-center">
             <div className="flex flex-col items-center">
                <span className="bg-[#53FC18]/10 px-2 py-0.5 rounded text-[#53FC18] font-black text-xs">{timeLeft.d}</span>
                <span className="text-[7px] text-gray-500 uppercase">Days</span>
             </div>
             <span className="text-[#53FC18]">:</span>
             <div className="flex flex-col items-center">
                <span className="bg-[#53FC18]/10 px-2 py-0.5 rounded text-[#53FC18] font-black text-xs">{timeLeft.h}</span>
                <span className="text-[7px] text-gray-500 uppercase">Hrs</span>
             </div>
             <span className="text-[#53FC18]">:</span>
             <div className="flex flex-col items-center">
                <span className="bg-[#53FC18]/10 px-2 py-0.5 rounded text-[#53FC18] font-black text-xs">{timeLeft.m}</span>
                <span className="text-[7px] text-gray-500 uppercase">Min</span>
             </div>
             <span className="text-[#53FC18]">:</span>
             <div className="flex flex-col items-center">
                <span className="bg-[#53FC18]/10 px-2 py-0.5 rounded text-[#53FC18] font-black text-xs">{timeLeft.s}</span>
                <span className="text-[7px] text-gray-500 uppercase">Sec</span>
             </div>
          </div>
        </div>
      </div>

      {/* Desktop Matrix Showcase (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-separate border-spacing-x-4 border-spacing-y-0 min-w-[1000px]">
          <thead>
            <tr>
              <th className="p-4 text-left"></th>
              {platforms.map(p => (
                <th key={p.id} className="p-6 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-white font-black text-xl uppercase tracking-[0.2em] mb-1">{p.label}</span>
                    <div className="h-1 w-full bg-[#53FC18] rounded-full shadow-[0_0_10px_rgba(83,252,24,0.5)]"></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.id} className="group">
                {/* Metric Label */}
                <td className="p-8 align-middle">
                   <div className="flex flex-col items-start">
                     <span className="text-white font-black text-2xl uppercase tracking-tighter leading-none group-hover:text-[#53FC18] transition-colors">{m.label}</span>
                     <div className="h-px w-full bg-white/10 mt-2"></div>
                   </div>
                </td>
                
                {/* Platform Cells - Compact List */}
                {platforms.map(p => {
                    const topUsers = getTopUsers(m.id, p.id);
                    return (
                        <td key={`${m.id}-${p.id}`} className="p-2 align-top min-w-[200px]">
                            {loading ? (
                                <div className="text-center text-gray-600 text-xs py-4 animate-pulse">Loading Matrix...</div>
                            ) : topUsers.length > 0 ? (
                                <div className="flex flex-col gap-1.5 py-4">
                                    {topUsers.map((user, idx) => {
                                        const displayName = user.username || user.kick_username;
                                        // Skip users without a proper name (random/visitor IDs)
                                        if (!displayName || displayName.startsWith('User_') || displayName.includes('-')) return null;
                                        
                                        const isTop1 = idx === 0;
                                        
                                        return (
                                            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded border transition-all duration-300 ${
                                                isTop1 
                                                ? 'border-[#53FC18] bg-[#53FC18]/10 shadow-[0_0_10px_rgba(83,252,24,0.2)]' 
                                                : 'border-[#53FC18]/20 bg-black/40 hover:border-[#53FC18]/60'
                                            }`}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`font-black text-[10px] italic ${isTop1 ? 'text-[#53FC18]' : 'text-[#53FC18]/40'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight truncate ${isTop1 ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-black ml-2 px-1.5 py-0.5 rounded-sm ${isTop1 ? 'bg-[#53FC18] text-black' : 'text-[#53FC18] bg-[#53FC18]/5'}`}>
                                                    {getMetricDisplay(user, m.id)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-gray-700 text-[10px] font-bold italic py-4 border border-white/5 rounded bg-black/20 uppercase tracking-widest opacity-30">
                                    No Data
                                </div>
                            )}
                        </td>
                    );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-Friendly Grid (Visible on Mobile only) */}
      <div className="md:hidden space-y-8">
        {platforms.map(p => (
          <div key={p.id} className="space-y-4">
            <h3 className="text-[#53FC18] font-bold text-lg uppercase tracking-widest border-b border-[#53FC18]/20 pb-2">
              {p.label}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {metrics.map(m => {
                const topUsers = getTopUsers(m.id, p.id);
                return (
                  <div key={m.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-3">{m.label}</h4>
                    {loading ? (
                      <div className="text-center text-gray-600 text-[10px] py-2">Loading...</div>
                    ) : topUsers.length > 0 ? (
                      <div className="space-y-2">
                        {topUsers.map((user, idx) => {
                          const displayName = user.username || user.kick_username;
                          if (!displayName || displayName.startsWith('User_') || displayName.includes('-')) return null;
                          return (
                          <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-[#53FC18] font-bold">#{idx + 1}</span>
                              <span className="text-xs truncate text-gray-200">
                                {displayName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#53FC18]">
                              {getMetricDisplay(user, m.id)}
                            </span>
                          </div>
                        )})}
                      </div>
                    ) : (
                      <div className="text-center text-gray-700 text-[10px] italic py-1">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTabs;
import React, { useState, useEffect } from 'react';
import { Trophy, MessageCircle, Users, Instagram, Twitter, Hash, MonitorPlay, ExternalLink, CheckSquare, MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

const LeaderboardTabs = () => {
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
  const [loading, setLoading] = useState(true);

  const metrics = [
    { id: 'tasks', label: 'Tasks Done' },
    { id: 'points', label: 'Point' },
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

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [tasks, comments, messages, referrers, kickPoints, twitterPoints, threadsPoints, instagramPoints] = await Promise.all([
            fetch(`${API_BASE}/api/leaderboard/tasks`).then(r => r.json()),
            fetch(`${API_BASE}/api/leaderboard/comments`).then(r => r.json()),
            fetch(`${API_BASE}/api/leaderboard/messages`).then(r => r.json()),
            fetch(`${API_BASE}/api/leaderboard/referrers`).then(r => r.json()),
            fetch(`${API_BASE}/api/users/platform/kick`).then(r => r.json()),
            fetch(`${API_BASE}/api/users/platform/twitter`).then(r => r.json()),
            fetch(`${API_BASE}/api/users/platform/threads`).then(r => r.json()),
            fetch(`${API_BASE}/api/users/platform/instagram`).then(r => r.json()),
        ]);

        setDataCache({
            tasks: Array.isArray(tasks) ? tasks : [],
            comments: Array.isArray(comments) ? comments : [],
            messages: Array.isArray(messages) ? messages : [],
            referrers: Array.isArray(referrers) ? referrers : [],
            points: [] 
        });

        setPlatformPoints({
            kick: Array.isArray(kickPoints) ? kickPoints : [],
            twitter: Array.isArray(twitterPoints) ? twitterPoints : [],
            threads: Array.isArray(threadsPoints) ? threadsPoints : [],
            instagram: Array.isArray(instagramPoints) ? instagramPoints : []
        });

      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getTopUsers = (metricId, platformId) => {
    let sourceData = [];
    
    if (metricId === 'points') {
        sourceData = platformPoints[platformId] || [];
    } else {
        sourceData = dataCache[metricId] || [];
    }

    // Filter by Platform Presence
    const filtered = sourceData.filter(user => {
        if (platformId === 'kick') return user.kick_username;
        if (platformId === 'twitter') return user.twitter_username;
        if (platformId === 'threads') return user.threads_username;
        if (platformId === 'instagram') return user.instagram_username;
        return false;
    });

    return filtered.slice(0, 5);
  };

  const getMetricDisplay = (user, metricId) => {
    if (metricId === 'points') return `${user.weekly_points} Pts`;
    if (metricId === 'comments') return `${user.weekly_comments || 0}`;
    if (metricId === 'messages') return `${user.chat_messages_count || 0}`;
    if (metricId === 'tasks') return `${user.tasks_completed || 0}`;
    if (metricId === 'referrers') return `${user.referral_count}`;
    return '';
  };

  return (
    <div className="glass-panel p-6 mb-12 border border-white/10">
      {/* Matrix Showcase */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="p-4 text-left"></th>
              {platforms.map(p => (
                <th key={p.id} className="p-4 text-center text-gray-400 font-bold text-lg uppercase tracking-wider">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.id}>
                {/* Metric Label */}
                <td className="p-6 text-white font-bold whitespace-nowrap border-b border-white/5 text-lg">
                  {m.label}
                </td>
                
                {/* Platform Cells - Compact List */}
                {platforms.map(p => {
                    const topUsers = getTopUsers(m.id, p.id);
                    return (
                        <td key={`${m.id}-${p.id}`} className="p-2 align-top min-w-[180px]">
                            {loading ? (
                                <div className="text-center text-gray-600 text-xs py-4">Loading...</div>
                            ) : topUsers.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                    {topUsers.map((user, idx) => {
                                        const displayName = user.username || user.kick_username || user.visitor_id?.substring(0,8);
                                        const isTop1 = idx === 0;
                                        
                                        return (
                                            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                                                isTop1 
                                                ? 'border-[#53FC18]/30 bg-[#53FC18]/10' 
                                                : 'border-white/5 bg-white/5 hover:border-white/10'
                                            }`}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`font-mono text-[10px] font-bold ${isTop1 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className={`text-xs truncate font-medium ${isTop1 ? 'text-white' : 'text-gray-300'}`}>
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-mono ml-2 ${isTop1 ? 'text-[#53FC18]' : 'text-gray-500'}`}>
                                                    {getMetricDisplay(user, m.id)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-gray-700 text-[10px] italic py-2 border border-white/5 rounded-lg bg-white/5">
                                    Empty
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
    </div>
  );
};

export default LeaderboardTabs;
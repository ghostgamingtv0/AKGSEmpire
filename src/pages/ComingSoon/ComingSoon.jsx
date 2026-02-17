import { Timer, Rocket, Sparkles, Send, Twitter, Instagram, CheckCircle2, ShieldCheck, TrendingUp, MonitorCheck, Loader2, Zap, Tv, HeartHandshake, Crown, Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaThreads, FaFacebook } from 'react-icons/fa6';
import BackgroundEffects from './components/UnifiedBackground';
import { SOCIAL_LINKS, API_ENDPOINTS, ASSETS, CONTRACTS } from '../../config/constants';

const RandomGlowBox = ({ children, className }) => {
    const style = useMemo(() => ({
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 2}s`
    }), []);

    return (
        <div className={`${className} animate-pulse`} style={style}>
            {children}
        </div>
    );
};

const TimeBox = ({ value, label, labelAr }) => {
  const glowStyle = useMemo(() => ({
    animationDuration: `${Math.random() * 3 + 2}s`,
    animationDelay: `${Math.random() * 2}s`
  }), []);

  return (
    <div className="flex flex-col items-center group">
        <div 
            className="w-full aspect-square bg-white/5 backdrop-blur-md border border-[#53FC18]/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 shadow-[inset_0_0_20px_rgba(83,252,24,0.05)] animate-pulse"
            style={glowStyle}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-[#53FC18]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-3xl md:text-6xl font-mono font-bold text-white relative z-10 mb-1">
                {String(value).padStart(2, '0')}
            </span>
            <div className="flex flex-col items-center gap-0.5 relative z-10">
                <span className="text-[10px] md:text-sm text-[#53FC18] font-bold uppercase tracking-wider">{label}</span>
                <span className="text-[10px] md:text-sm text-gray-400 font-medium">{labelAr}</span>
            </div>
        </div>
    </div>
  );
};

const ComingSoon = () => {
  const [stats, setStats] = useState({
    discord_members: 0,
    telegram_members: 0
  });
  const [refLink, setRefLink] = useState('');
  const [refReady, setRefReady] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState(null);
  const [pendingTarget, setPendingTarget] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.STATS);
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({
            ...prev,
            discord_members: data.discord_members || prev.discord_members,
            telegram_members: data.telegram_members || prev.telegram_members
          }));
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem('user_session');
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          setUserSession(parsed);
        } catch {}
      }
      const existingG = localStorage.getItem('gCode');
      if (existingG) {
        setRefLink(`${window.location.origin}/?ref=${encodeURIComponent(existingG)}`);
        setRefReady(true);
        return;
      }
      fetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        if (data?.g_code) {
          setRefLink(`${window.location.origin}/?ref=${encodeURIComponent(data.g_code)}`);
          setRefReady(true);
        }
      }).catch(() => {});
    } catch {}
  }, []);

  const badges = useMemo(() => ['Web3 Gaming', 'Metaverse', 'Social2Earn', 'Watch2Earn'].map(text => ({
      text,
      style: {
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`
      }
  })), []);

  const socialLinks = useMemo(() => [
      { 
        id: 'telegram',
        label: 'Telegram', 
        url: SOCIAL_LINKS.TELEGRAM, 
        icon: Send, 
        color: '#0088cc',
        count: stats.telegram_members 
      },
      { 
        id: 'tiktok',
        label: 'TikTok', 
        url: SOCIAL_LINKS.TIKTOK, 
        svg: <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>,
        color: '#53FC18' 
      },
      { 
        id: 'threads',
        label: 'Threads', 
        url: SOCIAL_LINKS.THREADS, 
        icon: FaThreads, 
        color: '#ffffff' 
      },
      { 
        id: 'facebook',
        label: 'Facebook', 
        url: SOCIAL_LINKS.FACEBOOK, 
        icon: FaFacebook, 
        color: '#1877F2' 
      },
      { 
        id: 'instagram',
        label: 'Instagram', 
        url: SOCIAL_LINKS.INSTAGRAM, 
        icon: Instagram, 
        color: '#d62976' 
      },
      { 
        id: 'discord',
        label: 'Discord', 
        url: SOCIAL_LINKS.DISCORD, 
        svg: <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>,
        color: '#5865F2',
        count: stats.discord_members 
      },
      { 
        id: 'kick',
        label: 'Kick', 
        url: SOCIAL_LINKS.KICK, 
        svg: <path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/>,
        color: '#53FC18' 
      },
      { 
        id: 'twitter',
        label: 'Twitter', 
        url: SOCIAL_LINKS.TWITTER, 
        icon: Twitter, 
        color: '#ffffff' 
      }
  ], [stats.discord_members, stats.telegram_members]);

  const calculateTimeLeft = () => {
    // Target Date: February 23, 2026
    const targetDate = new Date('2026-02-23T00:00:00');
    const now = new Date();
    const difference = targetDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null; // Time's up
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const intervals = [
    { labelAr: 'أيام', labelEn: 'Days', value: timeLeft?.days || 0 },
    { labelAr: 'ساعات', labelEn: 'Hours', value: timeLeft?.hours || 0 },
    { labelAr: 'دقائق', labelEn: 'Minutes', value: timeLeft?.minutes || 0 },
    { labelAr: 'ثواني', labelEn: 'Seconds', value: timeLeft?.seconds || 0 }
  ];

  const hasGCode = !!userSession?.gCode;
  const effectiveGCode = hasGCode ? userSession.gCode : 'GENESIS G-CODE PENDING';
  const effectiveRefLink =
    refLink ||
    (hasGCode
      ? `${window.location.origin}/?ref=${encodeURIComponent(userSession.gCode)}`
      : 'Connect Genesis Gate to generate your referral link');

  const handleConsentConfirm = () => {
    if (pendingTarget && pendingPlatform) {
      if (pendingTarget.startsWith('/api/')) {
        window.location.href = pendingTarget;
      } else {
        window.open(pendingTarget, '_blank', 'noopener');
      }
    }
    setShowConsentModal(false);
    setPendingPlatform(null);
    setPendingTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white p-4 empire-gradient-page">
      <BackgroundEffects />

      <div className="relative z-10 max-w-7xl w-full text-center flex flex-col items-center pt-10 pb-10">
        <div className="w-full flex flex-col items-center gap-6 mb-10">
          <h1 className="text-4xl md:text-7xl font-black leading-tight font-heading text-center tracking-tighter brand-gradient-text">
            AKGS EMPIRE
          </h1>
          <div className="w-full md:w-[280px] bg-black/80 border border-[#53FC18]/40 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-[0_0_30px_rgba(83,252,24,0.3)] text-center md:text-right md:absolute md:right-[-80px] md:top-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[#53FC18]/10 via-transparent to-[#53FC18]/20 opacity-70 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
              <div className="w-12 h-12 rounded-full bg-[#53FC18]/10 flex items-center justify-center mb-1 border border-[#53FC18]/50 shadow-[0_0_30px_rgba(83,252,24,0.2)] relative">
                <div className="absolute inset-0 rounded-full bg-[#53FC18] blur-xl opacity-20"></div>
                <Crown size={28} className="text-[#53FC18] relative z-10" />
              </div>
              <h2 className="text-[9px] md:text-[10px] font-bold text-gray-300 uppercase tracking-[0.35em]">
                Your Unique G-Code
              </h2>
              <div className="w-full bg-black/90 border border-[#53FC18] rounded-2xl px-4 py-3 shadow-inner shadow-[#53FC18]/15 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light pointer-events-none"></div>
                <span className="text-lg md:text-xl font-mono font-bold text-[#53FC18] tracking-widest relative z-10 select-all">
                  {effectiveGCode}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
                Permanent ID • Non-Renewable
              </p>
              <div className="w-full pt-3 border-t border-white/10">
                <h3 className="text-[10px] font-bold text-gray-400 mb-2 flex items-center justify-center md:justify-end gap-2 uppercase tracking-wider">
                  <Users size={12} className="text-[#53FC18]" />
                  Referral Program
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-[10px] text-gray-200 font-mono overflow-x-auto">
                    {effectiveRefLink}
                  </div>
                  <button
                    disabled={!(refReady || hasGCode)}
                    onClick={() => {
                      const link = effectiveRefLink;
                      try {
                        navigator.clipboard.writeText(link);
                      } catch {}
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(83,252,24,0.3)] border ${
                      refReady || hasGCode
                        ? "bg-[#53FC18] text-black border-[#53FC18] hover:bg-[#45d612] transition-colors"
                        : "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 mt-2">
                  Earn <span className="text-[#53FC18] font-bold">5%</span> of your friends' points forever
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-[#53FC18] shadow-[0_0_50px_rgba(83,252,24,0.4)] overflow-hidden p-1 bg-black group hover:scale-105 transition-transform duration-500">
            <img 
              src="https://i.ibb.co/Jjdm6v0J/fe58cfb14a674ec977bf157cdc091cfd.jpg" 
              alt="AKGS Empire Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="font-bold text-xl md:text-2xl tracking-[0.5em] mt-8 font-heading uppercase brand-gradient-text">
            COMING SOON
          </div>
        </div>

        <div className="relative flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-[#53FC18] rounded-full blur-[60px] opacity-15 -z-10"></div>
          {badges.map((badge, index) => (
            <span 
              key={badge.text}
              className="px-3 py-1 rounded border border-[#53FC18]/30 bg-[#53FC18]/5 text-[#53FC18] text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-[inset_0_0_10px_rgba(83,252,24,0.1)] animate-pulse"
              style={badge.style}
            >
              {badge.text}
            </span>
          ))}
        </div>

        {/* Big Social Buttons Grid */}
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto mb-16 px-4">
            {socialLinks.map((link) => (
                <motion.a
                    key={link.id}
                    onClick={(e) => {
                      try {
                        const sessionRaw = localStorage.getItem('user_session');
                        let visitorId = null;
                        let usernameForCheck = null;
                        let hasGenesisSession = false;
                        if (sessionRaw) {
                          try {
                            const parsed = JSON.parse(sessionRaw);
                            visitorId = parsed.visitor_id || parsed.id || null;
                            usernameForCheck = parsed.username || null;
                            hasGenesisSession = !!parsed.nickname;
                          } catch {}
                        }
                        fetch('/api/social/click', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            visitor_id: visitorId,
                            platform: link.id,
                            target: link.url
                          })
                        }).catch(() => {});
                            if (link.id === 'kick' || link.id === 'tiktok') {
                              e.preventDefault();
                              let targetUrl = link.url;
                              if (link.id === 'kick' && hasGenesisSession) {
                                targetUrl = '/api/kick/login';
                              }
                              setPendingPlatform(link.id);
                              setPendingTarget(targetUrl);
                              setShowConsentModal(true);
                              return;
                            }
                        if (usernameForCheck && (link.id === 'instagram' || link.id === 'facebook' || link.id === 'threads')) {
                          fetch('/api/social/check-account', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              platform: link.id,
                              username: usernameForCheck
                            })
                          }).catch(() => {});
                        }
                      } catch {}
                    }}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center gap-3 px-10 py-5 bg-[#000000] border rounded-xl transition-all duration-300 min-w-[180px] md:min-w-[200px] justify-center"
                    style={{ borderColor: `${link.color}40` }}
                    whileHover={{ scale: 1.05, borderColor: link.color, backgroundColor: `${link.color}10` }}
                >
                    <div 
                        className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500 rounded-xl"
                        style={{ backgroundColor: link.color }}
                    />
                    
                    {link.icon ? (
                        <link.icon 
                            className="w-7 h-7 text-white transition-colors duration-300 group-hover:text-[var(--hover-color)]"
                            style={{ '--hover-color': link.color }}
                        />
                    ) : (
                        <svg 
                            className="w-7 h-7 text-white transition-colors duration-300 group-hover:text-[var(--hover-color)]"
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            style={{ '--hover-color': link.color }}
                        >
                            {link.svg}
                        </svg>
                    )}
                    
                    <span 
                        className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-[var(--hover-color)] relative z-10"
                        style={{ '--hover-color': link.color }}
                    >
                        {link.label}
                    </span>
                    
                    {/* Count badge for Telegram/Discord */}
                    {link.count > 0 && (
                        <span className="absolute -top-3 -right-3 bg-[#983695] text-white text-xs font-bold px-2 py-1 rounded-full border border-black shadow-lg">
                            {link.count.toLocaleString()}
                        </span>
                    )}
                </motion.a>
            ))}
        </div>
        
        <div className="flex flex-col gap-4 mb-10 max-w-4xl mx-auto">
          <p className="text-xl md:text-4xl text-white font-bold tracking-wide leading-relaxed drop-shadow-lg" dir="rtl">
            عندما يلتقي <span className="text-[#53FC18]">الشغف بالأرباح</span>.. نعيد تعريف مستقبل التفاعل الرقمي، حيث يصبح <span className="text-[#53FC18]">لوقتك قيمة حقيقية</span>
          </p>
          <div className="h-[1px] w-24 bg-[#53FC18]/30 mx-auto my-2"></div>
          <p className="text-sm md:text-xl text-gray-300 font-medium tracking-[0.15em] uppercase leading-relaxed font-heading">
            Where <span className="text-[#53FC18]">Passion</span> Meets <span className="text-[#53FC18]">Profit</span>.. Redefining The Future of Digital Interaction, Where Your Time Is The Ultimate <span className="text-[#53FC18]">Asset</span>
          </p>
        </div>

        <div className="w-full max-w-3xl mx-auto mb-12 bg-black/70 border border-[#53FC18]/40 rounded-3xl px-6 py-6 md:px-8 md:py-8 shadow-[0_0_35px_rgba(83,252,24,0.25)]">
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <h2 className="font-heading text-xs md:text-sm tracking-[0.3em] uppercase brand-gradient-text">
                INSIDE THE EMPIRE: GENESIS COMMANDERS
              </h2>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                Inside the AKGS Empire, a dedicated vault of 150,000,000 $AKGS and 50 royal Genesis NFTs is reserved for the earliest commanders. Every meaningful action across our linked platforms pushes you closer to that inner circle.
              </p>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                Within this system, the Daily Continuity Protocol governs your progress: earn +50 points for each active day, but going silent resets your streak. Hold your position for 4 consecutive days to trigger the x3 power multiplier and secure your status inside the Empire.
              </p>
            </div>
            <div dir="rtl" className="space-y-2 text-right font-arabic">
              <h2 className="font-bold text-xl md:text-2xl brand-gradient-text">
                داخل الإمبراطورية – مرحلة الجينيسيس للقادة الأوائل
              </h2>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                داخل إمبراطورية AKGS توجد خزينة مخصّصة تحتوي على 150,000,000 ‎$AKGS‎ و 50 ‎NFT‎ ملكي، محجوزة للقادة الأوائل فقط. كل تفاعل حقيقي داخل المنصات المرتبطة بالإمبراطورية يقرّبك خطوة نحو دائرة النخبة.
              </p>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed border-t border-[#53FC18]/30 pt-3">
                داخل النظام يعمل بروتوكول الاستمرارية اليومية؛ احصد ‎50‎ نقطة عن كل يوم حضور وتفاعل، لكن احذر.. أي يوم تغيب فيه يصفر عدّادك. حافظ على استمراريتك لـ 4 أيام متتالية لتفعيل مضاعف القوة ×3 وترسيخ مكانتك داخل الإمبراطورية.
              </p>
            </div>
          </div>
        </div>

        {timeLeft ? (
            <div className="relative grid grid-cols-4 gap-3 md:gap-6 mb-8 w-full max-w-3xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#53FC18] rounded-full blur-[100px] opacity-20 -z-10"></div>
                <TimeBox value={timeLeft.days} label="Days" labelAr="يوم" />
                <TimeBox value={timeLeft.hours} label="Hours" labelAr="ساعة" />
                <TimeBox value={timeLeft.minutes} label="Minutes" labelAr="دقيقة" />
                <TimeBox value={timeLeft.seconds} label="Seconds" labelAr="ثانية" />
            </div>
        ) : (
            <div className="text-4xl md:text-6xl font-bold text-[#53FC18] animate-pulse font-mono tracking-wider mb-8">
                LAUNCHING NOW
            </div>
        )}

        <div className="w-full grid md:grid-cols-2 gap-8 md:gap-16 px-4 mb-16 text-left">
            
            {/* Left Column: Roadmap */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="font-bold text-sm tracking-[0.2em] uppercase font-heading brand-gradient-text">Development Roadmap</h3>
                </div>

                <div className="space-y-0 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#53FC18]/20 z-0"></div>

                    <div className="relative z-10 flex gap-6 pb-8">
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-bold flex items-center gap-2 text-base md:text-lg font-heading tracking-wide brand-gradient-text">
                                Strategic Feasibility Study
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-100 text-sm md:text-base mt-1 font-medium leading-relaxed">Expert-led market analysis & strategic planning.</p>
                            <p className="text-[#53FC18] text-sm mt-1 font-arabic font-bold leading-relaxed" dir="rtl">دراسة جدوى شاملة وتحليل استراتيجي.</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <ShieldCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-bold flex items-center gap-2 text-base md:text-lg font-heading tracking-wide brand-gradient-text">
                                Legal & IP Protection
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-100 text-sm md:text-base mt-1 font-medium leading-relaxed">Official documentation & IP registration.</p>
                            <p className="text-[#53FC18] text-sm mt-1 font-arabic font-bold leading-relaxed" dir="rtl">توثيق قانوني وحماية الملكية الفكرية.</p>
                        </div>
                    </div>

                    {/* Stage 3 - Active */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(83,252,24,0.5)] animate-pulse">
                            <MonitorCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-bold flex items-center gap-2 text-base md:text-lg font-heading tracking-wide brand-gradient-text">
                                Platform Development
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold animate-pulse">IN PROGRESS</span>
                            </h4>
                            <p className="text-gray-100 text-sm md:text-base mt-1 font-medium leading-relaxed">Building the core infrastructure & features.</p>
                            <p className="text-[#53FC18] text-sm mt-1 font-arabic font-bold leading-relaxed" dir="rtl">تطوير البنية التحتية والميزات الأساسية.</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-black border border-gray-700 flex items-center justify-center shrink-0">
                            <Rocket size={20} className="text-gray-500" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-bold flex items-center gap-2 text-base md:text-lg font-heading tracking-wide brand-gradient-text">
                                Global Launch
                                <span className="text-gray-500 text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 border border-gray-500/30 font-sans font-bold">UPCOMING</span>
                            </h4>
                            <p className="text-gray-400 text-sm md:text-base mt-1 font-medium leading-relaxed">Official release to the public.</p>
                            <p className="text-gray-500 text-sm mt-1 font-arabic font-bold leading-relaxed" dir="rtl">الإطلاق الرسمي للجمهور.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="font-bold text-base md:text-lg tracking-[0.2em] uppercase font-heading brand-gradient-text">The Winning Formula</h3>
                </div>

                <div className="grid gap-6">
                    <div className="group bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-[#53FC18]/10 hover:border-[#53FC18]/40 transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#53FC18]/10 rounded-xl text-[#53FC18] group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-2 font-heading brand-gradient-text">Watch & Earn</h4>
                                <p className="text-gray-100 text-sm md:text-base leading-relaxed">Earn while watching hand‑picked content. Every session strengthens your position inside the empire.</p>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-[#53FC18]/10 hover:border-[#53FC18]/40 transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#53FC18]/10 rounded-xl text-[#53FC18] group-hover:scale-110 transition-transform">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-2 font-heading brand-gradient-text">Social Growth</h4>
                                <p className="text-gray-100 text-sm md:text-base leading-relaxed">Grow your social presence while stacking points. Connect, engage, and expand your reach with AKGS.</p>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-[#53FC18]/10 hover:border-[#53FC18]/40 transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#53FC18]/10 rounded-xl text-[#53FC18] group-hover:scale-110 transition-transform">
                                <HeartHandshake size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-2 font-heading brand-gradient-text">Community First</h4>
                                <p className="text-gray-100 text-sm md:text-base leading-relaxed">Designed with the community at the core. Fair rewards, clear rules, and transparent tracking.</p>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-[#53FC18]/10 hover:border-[#53FC18]/40 transition-all duration-300">
                        <div className="flex items-start gap-4 w-full">
                            <div className="p-3 bg-[#53FC18]/10 rounded-xl text-[#53FC18] group-hover:scale-110 transition-transform">
                                <Send size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-2xl mb-3 font-heading tracking-wide uppercase brand-gradient-text">Referral Command Link</h4>
                                <p className="text-gray-100 text-base md:text-lg leading-relaxed mb-3">
                                    Forge your personal invite link. Every verified signup through your link instantly grants you
                                    <span className="text-[#53FC18] font-bold"> 500 points</span> and pushes your rank forward inside the empire.
                                </p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        readOnly
                                        value={refLink}
                                        placeholder="Initialising..."
                                        className="flex-1 bg-black/40 border border-[#53FC18]/30 rounded-xl py-2 px-3 text-white text-xs font-mono"
                                    />
                                    <button 
                                        disabled={!refReady}
                                        onClick={() => { try { navigator.clipboard.writeText(refLink); } catch {} }}
                                        className={`px-4 py-2 rounded-xl font-bold ${refReady ? 'bg-[#53FC18] text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-[#53FC18]/10 hover:border-[#53FC18]/40 transition-all duration-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#53FC18]/10 rounded-xl text-[#53FC18] group-hover:scale-110 transition-transform">
                                <Tv size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg mb-2 font-heading brand-gradient-text">Contracts</h4>
                                <div className="text-gray-400 text-sm leading-relaxed space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#53FC18] font-bold">Token</span>
                                        <span className="font-mono text-xs break-all">{CONTRACTS.AKGS_TOKEN}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#53FC18] font-bold">NFT</span>
                                        <span className="font-mono text-xs break-all">{CONTRACTS.AKGS_NFT}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="w-full border-t border-[#53FC18]/10 pt-10 pb-6">
             <p className="text-gray-200 text-sm md:text-base tracking-[0.25em] uppercase font-semibold">
                2026 AKGS Empire · Systems Online · Commanders Preparing For Launch
             </p>
        </div>

        {showConsentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-[#050505] border border-[#53FC18]/40 rounded-2xl max-w-md w-full p-6 shadow-[0_0_30px_rgba(83,252,24,0.4)]">
              <h3 className="text-xl font-bold text-white mb-3" dir="rtl">
                موافقة على ربط حساب {pendingPlatform === 'kick' ? 'Kick' : 'TikTok'}
              </h3>
              <p className="text-sm text-gray-300 mb-3" dir="rtl">
                بالضغط على «أوافق» فأنت تمنح AKGS Empire إذنًا لقراءة بيانات حسابك العامة
                وربطها بهويتك داخل الإمبراطورية لأغراض التحقق، احتساب النقاط، وتحديث حالة المهام.
              </p>
              <p className="text-xs text-gray-500 mb-4" dir="rtl">
                يمكن إلغاء الربط لاحقًا عن طريق حذف بيانات المتصفح أو طلب مسح البيانات من فريق الدعم.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setShowConsentModal(false);
                    setPendingPlatform(null);
                    setPendingTarget(null);
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#53FC18] text-black text-sm font-bold hover:bg-[#45d612] transition-colors shadow-[0_0_18px_rgba(83,252,24,0.45)]"
                  onClick={handleConsentConfirm}
                >
                  أوافق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComingSoon;

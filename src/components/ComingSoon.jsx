import { Timer, Rocket, Sparkles, Send, Twitter, Instagram, CheckCircle2, ShieldCheck, TrendingUp, MonitorCheck, Loader2, Zap, Tv, HeartHandshake, Ghost as GhostIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaThreads, FaFacebook } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';

const Ghost = ({ className = "", duration = 20, delay = 0, size = 64, color = "white", xPath, yPath }) => {
  return (
    <motion.div
      className={`fixed top-0 left-0 pointer-events-none z-20 opacity-60 ${className}`}
      initial={{ x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) }}
      animate={{
        x: xPath || ["-10vw", "110vw"],
        y: yPath || ["10vh", "80vh", "20vh", "60vh", "10vh", "50vh"],
        rotate: [0, 15, -10, 5, -15, 0],
        scale: [1, 1.1, 0.9, 1.05, 0.95, 1]
      }}
      transition={{
        x: {
            duration: duration,
            repeat: Infinity,
            repeatType: "mirror",
            delay: delay,
            ease: "easeInOut",
        },
        y: {
            duration: duration * 1.2, // Slightly different duration for organic movement
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
        },
        rotate: {
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
        },
        scale: {
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
        }
      }}
    >
      <GhostIcon size={size} color={color} strokeWidth={1.5} />
    </motion.div>
  );
};

const MatrixRain = () => {
  useEffect(() => {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#53FC18';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas id="matrix-canvas" className="fixed inset-0 z-0 opacity-30 pointer-events-none" />;
};

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
  const [visitorId, setVisitorId] = useState(null);

  useEffect(() => {
    // Initialize FingerprintJS
    const initFingerprint = async () => {
      try {
        const fp = await load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
        console.log('Visitor ID:', result.visitorId);
      } catch (error) {
        console.error('Failed to get visitor ID:', error);
      }
    };
    initFingerprint();

    const fetchStats = async () => {
      try {
        const res = await fetch('https://akgsempire.org/api/stats');
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
    const handleMessage = (event) => {
      // Basic security check - in production you might want to be more specific
      // if (event.origin !== window.location.origin) return; 
      
      const { type, username } = event.data;
      if (type === 'TIKTOK_CONNECTED') {
          alert(`TikTok Connected Successfully: ${username}`);
      } else if (type === 'INSTAGRAM_CONNECTED') {
          alert(`Instagram Connected Successfully: ${username}`);
      } else if (type === 'FACEBOOK_CONNECTED') {
           alert(`Facebook Connected Successfully: ${username}`);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const openLoginPopup = (url, title) => {
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      window.open(url, title, `width=${width},height=${height},left=${left},top=${top}`);
  };

  const handleTikTokLogin = () => {
    if (!visitorId) return;
    openLoginPopup(`https://akgsempire.org/api/tiktok/login?visitor_id=${visitorId}`, 'TikTok Login');
  };

  const handleInstagramLogin = () => {
    if (!visitorId) return;
    openLoginPopup(`https://akgsempire.org/api/instagram/login?visitor_id=${visitorId}`, 'Instagram Login');
  };

  const handleFacebookLogin = () => {
    if (!visitorId) return;
    if (window.FB) {
        window.FB.login(function(response) {
            if (response.authResponse) {
                console.log('Welcome!  Fetching your information.... ');
                window.FB.api('/me', function(response) {
                    console.log('Good to see you, ' + response.name + '.');
                    alert('Facebook Connected: ' + response.name);
                });
            } else {
                console.log('User cancelled login or did not fully authorize.');
                openLoginPopup(`https://akgsempire.org/api/facebook/login?visitor_id=${visitorId}`, 'Facebook Login');
            }
        }, {scope: 'public_profile,email'});
    } else {
        openLoginPopup(`https://akgsempire.org/api/facebook/login?visitor_id=${visitorId}`, 'Facebook Login');
    }
  };

  const handleThreadsLogin = () => {
    if (!visitorId) return;
    openLoginPopup(`https://akgsempire.org/api/threads/login?visitor_id=${visitorId}`, 'Threads Login');
  };

  const badges = useMemo(() => ['Web3 Gaming', 'Metaverse', 'Social2Earn', 'Watch2Earn'].map(text => ({
      text,
      style: {
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`
      }
  })), []);

  const socialLinks = useMemo(() => [
      { icon: Twitter, url: 'https://x.com/tv_ghostgaming', label: 'Twitter' },
      { icon: null, svg: <path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/>, url: 'https://kick.com/ghost_gamingtv', label: 'Kick' },
      { icon: null, svg: <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>, url: 'https://discord.gg/wMVJTrppXh', label: 'Discord', count: stats.discord_members },
      { icon: Instagram, url: 'https://www.instagram.com/ghost.gamingtv/', label: 'Instagram' },
      { icon: FaFacebook, url: 'https://www.facebook.com/ghost.gamingtv', label: 'Facebook' },
      { icon: FaThreads, url: 'https://www.threads.net/@ghost.gamingtv', label: 'Threads' },
      { icon: null, svg: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.12v8.52c.04 2.91-2.1 5.4-4.99 5.89-3.05.51-5.99-1.55-6.62-4.57-.65-3.12 1.4-6.27 4.5-6.97.77-.18 1.58-.19 2.36-.05v4.03c-.28-.1-.58-.14-.88-.13-1.07.03-2.02.77-2.22 1.83-.2 1.05.47 2.11 1.5 2.37 1.05.27 2.17-.33 2.58-1.34.13-.34.18-.7.18-1.07V.02h-0.53z"/>, url: 'https://www.tiktok.com/@ghost.gamingtv', label: 'TikTok' },
      { icon: Send, url: 'https://t.me/ghost_gamingtv', label: 'Telegram', count: stats.telegram_members }
  ].map(item => ({
      ...item,
      style: {
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`
      }
  })), []);

  const ghosts = useMemo(() => {
    // Colors: White, Visible Black (Dark Gray), Neon Green
    const colors = ['#ffffff', '#2a2a2a', '#53FC18']; 
    return Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 20 + 20, // 20-40s duration
        delay: -Math.random() * 20, // Negative delay for immediate presence
        size: Math.random() * 40 + 30, // 30-70px size
        xPath: Array.from({ length: 5 }).map(() => `${Math.random() * 100}vw`), // Random X waypoints
        yPath: Array.from({ length: 5 }).map(() => `${Math.random() * 100}vh`)  // Random Y waypoints
    }));
  }, []);

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

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-['Rajdhani'] text-white p-4">
      <MatrixRain />
      
      {/* Flying Ghosts - Randomly generated */}
      {ghosts.map(ghost => (
        <Ghost 
          key={ghost.id}
          color={ghost.color}
          size={ghost.size}
          duration={ghost.duration}
          delay={ghost.delay}
          xPath={ghost.xPath}
          yPath={ghost.yPath}
        />
      ))}

      <div className="relative z-10 max-w-7xl w-full text-center flex flex-col items-center pt-10 pb-10">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
           <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-[#53FC18] shadow-[0_0_50px_rgba(83,252,24,0.3)] overflow-hidden p-1 bg-black group hover:scale-105 transition-transform duration-500">
             <img 
               src="https://i.ibb.co/Jjdm6v0J/fe58cfb14a674ec977bf157cdc091cfd.jpg" 
               alt="AKGS Empire Logo" 
               className="w-full h-full object-cover rounded-full"
             />
           </div>
           <div className="text-[#53FC18] font-bold text-xl md:text-2xl tracking-[0.5em] mt-8 animate-pulse font-['Orbitron']">COMING SOON</div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-7xl font-black mb-2 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#53FC18] to-white uppercase tracking-tighter font-['Orbitron']">
          AKGS EMPIRE
        </h1>
        
        {/* Subtitle / Theme Badges */}
        <div className="relative flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
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

        {/* Social Login Buttons */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 mb-10 flex flex-col items-center gap-4"
        >
            <div className="flex flex-wrap justify-center gap-4">
                {/* TikTok */}
                <button
                    onClick={handleTikTokLogin}
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#000000] border border-[#53FC18]/30 rounded-xl hover:bg-[#53FC18]/10 transition-all duration-300 hover:scale-105 hover:border-[#53FC18]"
                >
                    <div className="absolute inset-0 bg-[#53FC18]/5 blur-xl group-hover:bg-[#53FC18]/20 transition-all duration-500 rounded-xl" />
                    <svg className="w-5 h-5 text-white group-hover:text-[#53FC18] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-base font-bold text-white group-hover:text-[#53FC18] transition-colors relative z-10">TikTok</span>
                </button>

                {/* Instagram */}
                <button
                    onClick={handleInstagramLogin}
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#000000] border border-[#d62976]/30 rounded-xl hover:bg-[#d62976]/10 transition-all duration-300 hover:scale-105 hover:border-[#d62976]"
                >
                    <Instagram className="w-5 h-5 text-white group-hover:text-[#d62976] transition-colors" />
                    <span className="text-base font-bold text-white group-hover:text-[#d62976] transition-colors relative z-10">Instagram</span>
                </button>

                {/* Facebook */}
                <button
                    onClick={handleFacebookLogin}
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#000000] border border-[#1877F2]/30 rounded-xl hover:bg-[#1877F2]/10 transition-all duration-300 hover:scale-105 hover:border-[#1877F2]"
                >
                    <FaFacebook className="w-5 h-5 text-white group-hover:text-[#1877F2] transition-colors" />
                    <span className="text-base font-bold text-white group-hover:text-[#1877F2] transition-colors relative z-10">Facebook</span>
                </button>

                 {/* Threads */}
                <button
                    onClick={handleThreadsLogin}
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#000000] border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-white"
                >
                    <FaThreads className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                    <span className="text-base font-bold text-white group-hover:text-white transition-colors relative z-10">Threads</span>
                </button>
            </div>
            
            <p className="mt-4 text-xs text-gray-500 max-w-md mx-auto">
                Connect your account to verify identity and start earning.
            </p>
        </motion.div>
        
        <div className="flex flex-col gap-4 mb-10 max-w-4xl mx-auto">
          <p className="text-xl md:text-4xl text-white font-bold tracking-wide leading-relaxed drop-shadow-lg" dir="rtl">
            عندما يلتقي <span className="text-[#53FC18]">الشغف بالأرباح</span>.. نعيد تعريف مستقبل التفاعل الرقمي، حيث يصبح <span className="text-[#53FC18]">لوقتك قيمة حقيقية</span>
          </p>
          <div className="h-[1px] w-24 bg-[#53FC18]/30 mx-auto my-2"></div>
          <p className="text-sm md:text-xl text-gray-300 font-medium tracking-[0.15em] uppercase leading-relaxed font-['Orbitron']">
            Where <span className="text-[#53FC18]">Passion</span> Meets <span className="text-[#53FC18]">Profit</span>.. Redefining The Future of Digital Interaction, Where Your Time Is The Ultimate <span className="text-[#53FC18]">Asset</span>
          </p>
        </div>

        {/* Social Links */}
        <div className="relative flex flex-col items-center gap-4 mb-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#53FC18] rounded-full blur-[80px] opacity-15 -z-10"></div>
            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                Join Our Community <span className="text-[#53FC18]">//</span> انضم لمجتمعنا
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
                {socialLinks.map((link, index) => (
                    <motion.a 
                        key={index} 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="group relative"
                        whileHover={{ scale: 1.1 }}
                    >
                        <div 
                            className="absolute inset-0 bg-[#53FC18] blur-[80px] opacity-10 rounded-full animate-pulse"
                            style={link.style}
                        ></div>
                        <div className="relative z-10 p-2 md:p-3 bg-black/50 backdrop-blur-md rounded-2xl border border-[#53FC18]/30 group-hover:border-[#53FC18] transition-colors duration-300">
                            {link.icon ? (
                                <link.icon className="w-5 h-5 md:w-6 md:h-6 text-[#53FC18]" />
                            ) : (
                                <svg className="w-5 h-5 md:w-6 md:h-6 fill-[#53FC18]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    {link.svg}
                                </svg>
                            )}
                        </div>
                        
                        {/* Tooltip / Label */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-[#53FC18]/30 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-20">
                            <div className="text-[#53FC18] text-xs font-bold tracking-wider flex items-center gap-2">
                                <span>{link.label}</span>
                                {link.count > 0 && (
                                   <span className="bg-[#53FC18]/10 px-1.5 py-0.5 rounded text-[10px]">{link.count.toLocaleString()}</span>
                                )}
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                        </div>
                    </motion.a>
                ))}
            </div>
        </div>

        {/* Countdown Timer */}
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

        {/* Community Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-[#53FC18]/20 text-white">
                 <div className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse"></div>
                 <span className="font-mono font-bold text-[#53FC18]">{stats.discord_members}</span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">Discord Members</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-[#53FC18]/20 text-white">
                 <div className="w-2 h-2 rounded-full bg-[#0088cc] animate-pulse"></div>
                 <span className="font-mono font-bold text-[#53FC18]">{stats.telegram_members}</span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">Telegram Subs</span>
            </div>
        </div>

        {/* Main Content Grid: Roadmap & Winning Formula */}
        <div className="w-full grid md:grid-cols-2 gap-8 md:gap-16 px-4 mb-16 text-left">
            
            {/* Left Column: Roadmap */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="text-[#53FC18] font-bold text-sm tracking-[0.2em] uppercase font-['Orbitron']">Development Roadmap</h3>
                </div>

                <div className="space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#53FC18]/20 z-0"></div>

                    {/* Stage 1 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <CheckCircle2 size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Strategic Feasibility Study
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Expert-led market analysis & strategic planning.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">دراسة جدوى شاملة وتحليل استراتيجي.</p>
                        </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <ShieldCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Legal & IP Protection
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Official documentation & IP registration.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">توثيق قانوني وحماية الملكية الفكرية.</p>
                        </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <MonitorCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Infrastructure Setup
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Core system architecture & environment prep.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تأسيس البنية التحتية للمشروع.</p>
                        </div>
                    </div>

                    {/* Stage 4 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <TrendingUp size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Development & Polish
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Advanced coding & final system optimization.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">التطوير والتحسينات النهائية.</p>
                        </div>
                    </div>

                    {/* Stage 5 */}
                    <div className="relative z-10 flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-[#53FC18] border border-[#53FC18] flex items-center justify-center shrink-0 animate-pulse shadow-[0_0_15px_rgba(83,252,24,0.6)]">
                            <Loader2 size={20} className="text-black animate-spin" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Final Pre-Launch Phase
                                <span className="text-black bg-[#53FC18] text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse font-sans">99%</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Final security checks & countdown.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">اكتمال 99% - اللمسات الأخيرة.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Winning Formula */}
            <div>
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="text-[#53FC18] font-bold text-sm tracking-[0.2em] uppercase font-['Orbitron']">The Winning Formula</h3>
                </div>

                <div className="space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#53FC18]/20 z-0"></div>
                    
                    {/* Formula 1 */}
                    <div className="relative z-10 flex gap-6 pb-8 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <Zap size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Engagement = Wealth
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">Interact to earn points, convert to $AKGS tokens. Your time is currency.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تفاعلك هو ثروتك.. اجمع النقاط وحولها لتوكنات.</p>
                        </div>
                    </div>

                    {/* Formula 2 */}
                    <div className="relative z-10 flex gap-6 pb-8 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <Tv size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                Kick Stream & NFT Power
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">Follow on Kick for NFT giveaways. NFTs reduce tax & boost rewards.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تابعنا على Kick لفرص فوز بـ NFTs لتقليل الضريبة.</p>
                        </div>
                    </div>

                    {/* Formula 3 */}
                    <div className="relative z-10 flex gap-6 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <HeartHandshake size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-['Orbitron'] tracking-wide">
                                The 90% Pledge
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">We reinvest ~90% of profits back into the ecosystem to support YOU.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">نستثمر 90% من الأرباح لدعم المجتمع والمشروع.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 opacity-50 pb-8">
          <div className="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></div>
          <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-['Orbitron']">System Status: Pre-Launch</span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
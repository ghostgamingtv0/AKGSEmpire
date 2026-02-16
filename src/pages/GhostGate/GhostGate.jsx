import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Lock, Wallet, User, CheckCircle2, AlertTriangle, Key, Copy, Clock, Globe, Instagram, Gamepad2, Tv, ChevronDown, LogIn, ArrowRight, Facebook } from 'lucide-react';
import SceneOneBackground from './components/UnifiedBackground';
import { CONTRACTS, API_ENDPOINTS } from '../../config/constants';

const TOKEN_CONTRACT = CONTRACTS.AKGS_TOKEN;
// Using a placeholder SVG for now to ensure visibility if the external link is broken
const TOKEN_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='black' stroke='%2353FC18' stroke-width='5'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='30' fill='%2353FC18' text-anchor='middle' font-weight='bold'%3EAKGS%3C/text%3E%3C/svg%3E";

// Renamed from GenesisGate to GhostGate
const GhostGate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState('gate'); // gate, register, success
    const [authMode, setAuthMode] = useState('login'); // login, register
    const [spotsLeft, setSpotsLeft] = useState(50);
    const [formData, setFormData] = useState({
        platformUsername: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        confirmNickname: '',
        wallet: ''
    });
    const [selectedPlatform, setSelectedPlatform] = useState('Kick'); // Default to Kick
    const [showPlatformMenu, setShowPlatformMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userRank, setUserRank] = useState(null);
    
    // Success State Variables
    const [gCode, setGCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds

    

    // Fetch Real Spot Count
    useEffect(() => {
        const fetchSpots = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.GENESIS_STATS);
                const data = await res.json();
                if (data.spotsLeft !== undefined) {
                    setSpotsLeft(data.spotsLeft);
                }
            } catch (err) {
                console.error("Failed to fetch spots:", err);
            }
        };
        
        fetchSpots();
        // Poll every 10 seconds to keep updated
        const interval = setInterval(fetchSpots, 10000);
        return () => clearInterval(interval);
    }, []);

    // Countdown Timer for Success Screen
    useEffect(() => {
        let timer;
        if (step === 'success' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setFormData(prev => ({ ...prev, wallet: accounts[0] }));
                // Immediately ask to add token after connection
                await addTokenToWallet();
            } catch (err) {
                console.error("Wallet connection error:", err);
                setError('Failed to connect wallet');
            }
        } else {
            setError('Please install MetaMask');
        }
    };

    const addTokenToWallet = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: TOKEN_CONTRACT,
                        symbol: 'AKGS',
                        decimals: 18,
                        image: TOKEN_LOGO,
                    },
                },
            });
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text) => {
        // Formatted message for verification
        const message = `🛡️ GHOST GATE VERIFICATION 🛡️  🔑 G-Code: ${gCode}`;
        navigator.clipboard.writeText(message);
        // Could add a toast notification here
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Strict: Validate Nickname Match
        if (formData.nickname !== formData.confirmNickname) {
            setError('Nicknames do not match');
            setIsLoading(false);
            return;
        }

        // Strict: Validate Password Match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            let signMessage = null;
            let signTimestamp = Date.now();

            // Request Signature
            if (window.ethereum && formData.wallet) {
                signMessage = `Sign to verify ownership for AKGS Genesis Gate\nUser: ${formData.nickname}\nTimestamp: ${signTimestamp}`;
                try {
                    await window.ethereum.request({
                        method: 'personal_sign',
                        params: [signMessage, formData.wallet],
                    });
                } catch (e) {}
            }

            // Send to Backend
            const refParam = new URLSearchParams(location.search).get('ref') || null;
            const res = await fetch('/api/genesis/test-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    platform: selectedPlatform,
                    ref: refParam,
                    signMessage,
                    signTimestamp
                })
            });

            const data = await res.json();
            if (data.success) {
                setUserRank(data.rank || Math.floor(Math.random() * 50) + 1);
                if (data.spotsLeft !== undefined) setSpotsLeft(data.spotsLeft);
                setGCode(data.gCode); // Use server-generated G-Code
                
                // --- STRICT: SAVE TO LOCALSTORAGE FOR SYNC WITH EMPIRE ---
                localStorage.setItem('gCode', data.gCode);
                localStorage.setItem('user_session', JSON.stringify({
                    username: formData.platformUsername,
                    nickname: formData.nickname,
                    wallet_address: formData.wallet,
                    rank: data.rank,
                    gCode: data.gCode,
                    signMessage,
                    signTimestamp
                }));
                // --------------------------------------------------------

                try {
                    await fetch('/api/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'genesis_register',
                            platform: selectedPlatform,
                            platformUsername: formData.platformUsername,
                            nickname: formData.nickname,
                            wallet: formData.wallet,
                            gCode: data.gCode,
                            rank: data.rank
                        })
                    });
                } catch {}

                setStep('success');
                // Auto prompt to add token
                setTimeout(addTokenToWallet, 1000);
                // Redirect to Coming Soon immediately after successful registration
                navigate('/coming-soon');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-['Rajdhani'] relative overflow-hidden flex items-center justify-center">
            {/* Background Layers */}
            <SceneOneBackground />

            {/* Content Container */}
            <div className={`relative z-10 w-full p-6 transition-all duration-500 ${step === 'register' || step === 'success' ? 'max-w-5xl' : 'max-w-md'}`}>
                {/* Glow Blob Removed for Pure Black Theme */}
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-[#53FC18] font-['Orbitron'] mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(83,252,24,0.5)]">
                        GHOST EMPIRE
                    </h1>
                    <div className="relative inline-block max-w-2xl mx-auto">
                        <div className="absolute -inset-1 bg-[#53FC18]/20 blur-sm rounded-lg"></div>
                        <div className="relative bg-black/80 border border-[#53FC18]/30 rounded-lg p-4 backdrop-blur-md flex flex-col gap-3">
                            {/* English Section */}
                            <div className="flex items-center gap-3 border-b border-[#53FC18]/20 pb-3">
                                <div className="bg-[#53FC18]/10 p-2 rounded-full">
                                    <ShieldCheck size={18} className="text-[#53FC18]" />
                                </div>
                                <p className="text-gray-300 text-xs md:text-sm font-['Rajdhani'] font-medium tracking-wide text-left leading-relaxed">
                                    Not a sponsored platform, but a <span className="text-white font-bold">self-sufficient empire</span>. 
                                    Fueled 100% by personal dedication and revenue from <span className="text-[#53FC18] font-bold">Kick</span>.
                                </p>
                            </div>

                            {/* Arabic Section */}
                            <div className="flex items-center gap-3 flex-row-reverse">
                                <div className="bg-[#53FC18]/10 p-2 rounded-full">
                                    <ShieldCheck size={18} className="text-[#53FC18]" />
                                </div>
                                <p className="text-gray-200 text-xs md:text-sm font-['Cairo'] font-bold text-right leading-relaxed" dir="rtl">
                                    لسنا منصة مدعومة، بل <span className="text-[#53FC18]">مشروع مستقل</span> بذاته. 
                                    قائم على الاكتفاء الذاتي وبتمويل شخصي 100% من عوائد منصة <span className="text-[#53FC18]">كيك</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="bg-black/40 backdrop-blur-xl border border-[#53FC18]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(83,252,24,0.1)] relative overflow-hidden group">
                    {/* Scanning Line Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#53FC18]/50 shadow-[0_0_20px_#53FC18] animate-[scan_3s_linear_infinite] opacity-30 pointer-events-none"></div>

                    {step === 'gate' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center gap-6"
                        >
                            {/* Genesis Event Info Card */}
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep('register')}
                                className="w-full relative overflow-hidden bg-black/60 border-2 border-[#53FC18] rounded-2xl p-6 group transition-all duration-300 hover:shadow-[0_0_50px_rgba(83,252,24,0.3)]"
                            >
                                {/* Glowing Corner Accents */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#53FC18]"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#53FC18]"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#53FC18]"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#53FC18]"></div>
                                
                                {/* Background Pulse */}
                                <div className="absolute inset-0 bg-[#53FC18]/5 animate-pulse"></div>

                                {/* Header */}
                                <div className="relative z-10 flex flex-col items-center mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Globe className="text-[#53FC18] animate-[spin_10s_linear_infinite]" size={24} />
                                        <h3 className="text-xl font-black text-white tracking-[0.2em] font-['Orbitron']">GENESIS EVENT</h3>
                                        <Globe className="text-[#53FC18] animate-[spin_10s_linear_infinite_reverse]" size={24} />
                                    </div>
                                    <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-[#53FC18] to-transparent"></div>
                                </div>

                                {/* Content Body */}
                                <div className="relative z-10 flex flex-col gap-4 text-center">
                                    {/* Reward Box */}
                                    <div className="bg-[#53FC18]/10 border border-[#53FC18]/30 rounded-xl p-5 md:p-6 backdrop-blur-sm">
                                        <p className="text-[#53FC18] font-extrabold text-xl md:text-2xl mb-2 drop-shadow-[0_0_6px_rgba(83,252,24,0.7)]">
                                            150,000,000 $AKGS
                                        </p>
                                        <p className="text-white font-['Cairo'] font-bold text-base md:text-lg">
                                            + 50 GENESIS NFTs
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <p className="text-gray-100 text-sm md:text-base uppercase tracking-wider leading-relaxed">
                                            Reserved for the <span className="text-white font-bold">Top 100 Commanders</span>. 
                                            Prove your loyalty through consistent engagement on Kick & Instagram.
                                        </p>
                                        <p className="text-gray-100 font-['Cairo'] text-sm md:text-base leading-relaxed font-bold border-t border-[#53FC18]/30 pt-3">
                                            مخصصة لأفضل 100 قائد. أثبت ولاءك واستمراريتك عبر التفاعل القوي على منصات كيك وإنستغرام.
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Footer */}
                                <div className="relative z-10 mt-6 flex items-center justify-center gap-2 text-[#53FC18] animate-bounce">
                                    <span className="text-sm md:text-base font-bold tracking-[0.3em] uppercase">Click to Initialize</span>
                                    <ChevronDown size={16} />
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'selection' && (
                       null
                    )}

                    {step === 'register' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-5xl bg-black/80 backdrop-blur-xl border border-[#53FC18]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(83,252,24,0.15)] relative overflow-hidden"
                        >
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-black text-white tracking-wider font-['Orbitron'] mb-4">AKGS <span className="text-[#53FC18]">EMPIRE</span></h2>
                                <p className="text-gray-400 text-lg tracking-[0.2em] uppercase">Join the Elite Ranks</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 bg-white/5 rounded-xl mb-8 relative">
                                <div className="absolute inset-y-1 w-1/2 bg-[#53FC18] rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(83,252,24,0.3)]"
                                     style={{ left: authMode === 'login' ? '4px' : '50%' }}
                                ></div>
                                <button 
                                    onClick={() => setAuthMode('login')}
                                    className={`relative z-10 w-1/2 py-2 text-sm font-bold tracking-wider transition-colors duration-300 ${authMode === 'login' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => setAuthMode('register')}
                                    className={`relative z-10 w-1/2 py-2 text-sm font-bold tracking-wider transition-colors duration-300 ${authMode === 'register' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Register
                                </button>
                            </div>

                            {/* Login Form */}
                            {authMode === 'login' && (
                                <motion.form 
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        setError('');
                                        setIsLoading(true);
                                        try {
                                            const res = await fetch('/api/genesis/login', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    username: formData.nickname,
                                                    password: formData.password
                                                })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                localStorage.setItem('user_session', JSON.stringify(data.user));
                                                navigate('/coming-soon');
                                            } else {
                                                setError(data.error || 'Login failed');
                                            }
                                        } catch (err) {
                                            setError('Login failed');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="flex flex-col gap-5"
                                >
                                    <div className="space-y-1">
                                        <label className="text-[#53FC18] text-xs font-bold ml-1 uppercase tracking-wider">Username</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#53FC18] transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                name="nickname"
                                                value={formData.nickname}
                                                onChange={handleInputChange}
                                                placeholder="Enter username"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_20px_rgba(83,252,24,0.2)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[#53FC18] text-xs font-bold ml-1 uppercase tracking-wider">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#53FC18] transition-colors" size={18} />
                                            <input 
                                                type="password" 
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter password"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_20px_rgba(83,252,24,0.2)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-[#53FC18] hover:bg-[#45d612] text-black font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_40px_rgba(83,252,24,0.5)] transition-all mt-4 uppercase tracking-widest flex items-center justify-center gap-2 group"
                                    >
                                        Login
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                    </button>
                                </motion.form>
                            )}

                            {/* Register Form (Existing Genesis Flow) */}
                            {authMode === 'register' && (
                                <motion.form 
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    onSubmit={handleRegister}
                                    className="flex flex-col gap-4"
                                >
                                    {/* Verification Explanation */}
                                    <div className="bg-[#53FC18]/5 border border-[#53FC18]/20 rounded-lg p-3 mb-1">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-[#53FC18] mt-0.5 shrink-0" />
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[10px] text-gray-300 leading-tight">
                                                    <span className="text-[#53FC18] font-bold">Authenticity Check:</span> Access requires a verifiable digital footprint. Only valid usernames from <span className="text-white font-bold">Kick, Instagram, Discord, Facebook, or TikTok</span> will unlock the gate.
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-['Cairo'] leading-tight">
                                                    <span className="text-[#53FC18] font-bold">فحص المصداقية:</span> يتطلب الوصول بصمة رقمية يمكن التحقق منها. فقط المعرفات الحقيقية من <span className="text-white font-bold">كيك، إنستغرام، ديسكورد، فيسبوك، أو تيك توك</span> ستفتح البوابة.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Platform Selection - Visible Buttons */}
                                    <div className="space-y-2">
                                        <label className="text-[#53FC18] text-xs font-bold ml-1 uppercase tracking-wider flex justify-between">
                                            <span>Select Platform</span>
                                            <span className="font-['Cairo']">اختر المنصة</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Kick', 'Instagram', 'Discord', 'Facebook', 'TikTok'].map((platform) => (
                                                <motion.button
                                                    key={platform}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="button"
                                                    onClick={() => setSelectedPlatform(platform)}
                                                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all ${
                                                        selectedPlatform === platform 
                                                        ? 'bg-[#53FC18]/20 border-[#53FC18] text-[#53FC18] shadow-[0_0_15px_rgba(83,252,24,0.3)]' 
                                                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                                    }`}
                                                >
                                                    {platform === 'Kick' && <Tv size={20} />}
                                                    {platform === 'Instagram' && <Instagram size={20} />}
                                                    {platform === 'Discord' && <Gamepad2 size={20} />}
                                                    {platform === 'Facebook' && <Facebook size={20} />}
                                                    {platform === 'TikTok' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                                        </svg>
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase">{platform}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Platform Username */}
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53FC18] font-bold text-xs pointer-events-none">
                                            {selectedPlatform}:
                                        </div>
                                        <input 
                                            type="text" 
                                            name="platformUsername"
                                            value={formData.platformUsername}
                                            onChange={handleInputChange}
                                            placeholder="Enter Username | اسم المستخدم"
                                            className="w-full bg-black/40 border border-[#53FC18]/30 rounded-xl py-3 pl-24 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_20px_rgba(83,252,24,0.2)] transition-all font-mono"
                                            required
                                        />
                                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#53FC18] transition-colors" size={18} />
                                    </div>

                                    {/* Site Username & Confirm */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="relative group">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                            <input 
                                                type="text" 
                                                name="nickname"
                                                placeholder="Site Username | اسم بالموقع"
                                                className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                                value={formData.nickname}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="relative group">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                            <input 
                                                type="text" 
                                                placeholder="Confirm Username | تأكيد الاسم"
                                                className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                                value={formData.confirmNickname}
                                                onChange={(e) => setFormData({...formData, confirmNickname: e.target.value})}
                                                onPaste={(e) => { e.preventDefault(); return false; }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password & Confirm */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                            <input 
                                                type="password" 
                                                placeholder="Password | كلمة المرور"
                                                className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                onPaste={(e) => { e.preventDefault(); return false; }}
                                                required
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                            <input 
                                                type="password" 
                                                placeholder="Confirm | تأكيد"
                                                className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                onPaste={(e) => { e.preventDefault(); return false; }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Wallet Address (Read Only) */}
                                    <div className="relative group z-0">
                                        <img 
                                            src={TOKEN_LOGO} 
                                            alt="AKGS" 
                                            className="absolute left-4 top-3.5 w-[18px] h-[18px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" 
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Connect Wallet First | اربط المحفظة أولاً"
                                            className="w-full bg-black/30 border border-[#53FC18]/10 rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed font-['Cairo'] text-sm"
                                            value={formData.wallet}
                                            readOnly
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={connectWallet}
                                            className="absolute right-2 top-2 bg-[#53FC18]/10 hover:bg-[#53FC18]/20 text-[#53FC18] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#53FC18]/30 transition-all flex items-center gap-2"
                                        >
                                            <img src={TOKEN_LOGO} alt="AKGS" className="w-3 h-3 rounded-full" />
                                            Connect
                                        </motion.button>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                            <AlertTriangle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    <motion.button 
                                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(83,252,24,0.5)" }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full py-4 bg-[#53FC18] hover:bg-[#45d612] disabled:opacity-50 text-black font-bold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] mt-2 flex items-center justify-center gap-2 relative overflow-hidden group"
                                    >
                                        {/* Ripple/Flash Effect Layer */}
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                                        
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col leading-none items-center z-10">
                                                    <span>CLAIM G-CODE</span>
                                                    <span className="font-['Cairo'] text-sm">احصل على الكود</span>
                                                </div>
                                                <div className="px-2 py-0.5 bg-black/20 rounded text-xs z-10">#{50 - spotsLeft + 1}</div>
                                            </>
                                        )}
                                    </motion.button>
                                </motion.form>
                            )}
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center text-center gap-4"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-16 h-16 rounded-full bg-[#53FC18]/20 border-2 border-[#53FC18] flex items-center justify-center shadow-[0_0_50px_rgba(83,252,24,0.4)]">
                                    <CheckCircle2 size={32} className="text-[#53FC18]" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-2xl font-black text-white font-['Orbitron']">ACCESS GRANTED</h2>
                                    <h2 className="text-xl font-bold text-[#53FC18] font-['Cairo'] leading-none">تم منح الدخول</h2>
                                    <p className="text-gray-400 text-sm mt-1">Welcome, Citizen | أهلاً بك أيها المواطن</p>
                                </div>
                            </div>

                            {/* G-CODE DISPLAY */}
                            <div className="w-full bg-[#53FC18]/10 border border-[#53FC18]/30 rounded-xl p-4 relative overflow-hidden group">
                                <p className="text-[#53FC18] text-[10px] font-mono mb-1 uppercase tracking-widest flex justify-between">
                                    <span>Your Unique G-Code</span>
                                    <span className="font-['Cairo']">الكود الخاص بك</span>
                                </p>
                                <div className="text-lg md:text-xl font-mono font-bold text-white break-all drop-shadow-[0_0_5px_rgba(83,252,24,0.8)]">
                                    {gCode}
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => copyToClipboard(gCode)}
                                    className="absolute top-2 right-2 p-1.5 hover:bg-[#53FC18]/20 rounded transition-colors text-[#53FC18]"
                                >
                                    <Copy size={14} />
                                </motion.button>
                            </div>

                            {/* COUNTDOWN TIMER */}
                            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg border border-yellow-400/20 animate-pulse">
                                <Clock size={16} />
                                <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
                            </div>

                            {/* BILINGUAL NOTICE & WARNING */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 w-full">
                                <div className="flex items-start gap-2 text-left">
                                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-300 leading-tight">
                                            <span className="text-red-500 font-bold">WARNING: SPOT NOT SECURED.</span>
                                            <br />
                                            You must DM this G-Code via <span className="text-white font-bold">ANY PLATFORM</span> of your choice immediately. Failure to verify within 20:00 mins will revoke your Rank #{userRank} and downgrade you to Citizen Class.
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-['Cairo'] leading-tight">
                                            <span className="text-red-500 font-bold">تحذير: المقعد غير مؤكد.</span>
                                            <br />
                                            يجب عليك إرسال هذا الكود عبر <span className="text-white font-bold">أي منصة تختارها</span> فوراً. عدم التحقق خلال 20 دقيقة سيؤدي لسحب الرتبة #{userRank} وتسجيلك كمستخدم عادي.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/10 my-2"></div>

                            {/* Action Button: Copy & Go to Coming Soon */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (!gCode) return;
                                    copyToClipboard(gCode);
                                    navigate('/coming-soon');
                                }}
                                disabled={!gCode}
                                className="w-full py-3 bg-[#53FC18] hover:bg-[#45d612] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] flex items-center justify-center gap-2 group"
                            >
                                <Copy size={20} className="group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col leading-none items-center">
                                    <span>COPY CODE & ENTER</span>
                                    <span className="font-['Cairo'] text-xs font-bold">نسخ الكود والدخول</span>
                                </div>
                            </motion.button>

                            {/* TOKEN CONTRACT INFO */}
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <img src={TOKEN_LOGO} alt="AKGS" className="w-8 h-8 rounded-full" />
                                    <span className="font-bold text-white">AKGS Token</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2 border border-white/5">
                                    <code className="text-[10px] text-gray-400 font-mono truncate flex-1">
                                        {TOKEN_CONTRACT}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(TOKEN_CONTRACT)}
                                        className="text-[#53FC18] hover:text-white transition-colors"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <button 
                                    onClick={addTokenToWallet}
                                    className="w-full mt-3 py-2 bg-[#53FC18]/20 hover:bg-[#53FC18]/30 text-[#53FC18] font-bold text-sm rounded-lg border border-[#53FC18]/30 flex items-center justify-center gap-2 transition-all group"
                                >
                                    <img src={TOKEN_LOGO} alt="AKGS" className="w-4 h-4 rounded-full" />
                                    <span className="flex items-center gap-1">
                                        <span>Add to MetaMask</span>
                                        <span className="text-[#53FC18]/50">|</span>
                                        <span className="font-['Cairo']">إضافة للمحفظة</span>
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="mt-8 flex justify-center gap-8 text-[10px] text-gray-600 font-mono tracking-widest uppercase">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#53FC18] rounded-full animate-pulse"></span>
                        <span className="flex gap-1">
                            <span>System Online</span>
                            <span className="font-['Cairo']">النظام يعمل</span>
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#53FC18] rounded-full animate-pulse"></span>
                        <span className="flex gap-1">
                            <span>Secure Connection</span>
                            <span className="font-['Cairo']">اتصال آمن</span>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GhostGate;

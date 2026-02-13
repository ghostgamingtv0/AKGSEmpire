import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Wallet, User, CheckCircle2, AlertTriangle, Key, Copy, Clock, Globe, Instagram, Gamepad2, Tv, ChevronDown } from 'lucide-react';
import SceneOneBackground from './SceneOneBackground';
import { CONTRACTS, API_ENDPOINTS } from '../../config/constants';

const TOKEN_CONTRACT = CONTRACTS.AKGS_TOKEN;
// Using a placeholder SVG for now to ensure visibility if the external link is broken
const TOKEN_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='black' stroke='%2353FC18' stroke-width='5'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='30' fill='%2353FC18' text-anchor='middle' font-weight='bold'%3EAKGS%3C/text%3E%3C/svg%3E";

// Renamed from GenesisGate to SceneOne
const SceneOne = () => {
    const [step, setStep] = useState('gate'); // gate, register, success
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
            // Request Signature
            if (window.ethereum) {
                const message = `Sign to verify ownership for AKGS Genesis Gate\nUser: ${formData.nickname}\nTimestamp: ${Date.now()}`;
                await window.ethereum.request({
                    method: 'personal_sign',
                    params: [message, formData.wallet],
                });
            }

            // Send to Backend
            const res = await fetch('/api/genesis/test-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    platform: selectedPlatform
                })
            });

            const data = await res.json();
            if (data.success) {
                setUserRank(data.rank || Math.floor(Math.random() * 50) + 1);
                if (data.spotsLeft !== undefined) setSpotsLeft(data.spotsLeft);
                setGCode(data.gCode); // Use server-generated G-Code
                setStep('success');
                // Auto prompt to add token
                setTimeout(addTokenToWallet, 1000);
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
        <div className="min-h-screen bg-[#050505] text-white font-['Rajdhani'] relative overflow-hidden flex items-center justify-center">
            {/* Background Layers */}
            <SceneOneBackground />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md p-6">
                {/* Glow Blob from ComingSoon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-[#53FC18] rounded-full blur-[60px] opacity-15 -z-10"></div>
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-[#53FC18] font-['Orbitron'] mb-2 tracking-widest drop-shadow-[0_0_15px_rgba(83,252,24,0.5)]">
                        GHOST GATE <span className="block text-2xl md:text-3xl mt-2 font-['Cairo']">بوابة الشبح</span>
                    </h1>
                    <p className="text-gray-400 tracking-[0.2em] text-sm uppercase font-bold">
                        Secure Your Legacy <span className="text-[#53FC18] mx-2">|</span> <span className="font-['Cairo']">أمّن إرثك الرقمي</span>
                    </p>
                </div>

                {/* Main Panel */}
                <div className="bg-black/40 backdrop-blur-xl border border-[#53FC18]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(83,252,24,0.1)] relative overflow-hidden group">
                    {/* Scanning Line Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#53FC18]/50 shadow-[0_0_20px_#53FC18] animate-[scan_3s_linear_infinite] opacity-30 pointer-events-none"></div>

                    {/* ALWAYS VISIBLE: Remaining Spots (Negative Style) */}
                    {step !== 'success' && (
                        <div className="w-full bg-[#53FC18] rounded-xl p-4 border border-[#53FC18] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex flex-col">
                                    <span className="text-black text-sm font-bold tracking-wider">REMAINING SPOTS</span>
                                    <span className="text-black/70 text-xs font-['Cairo'] font-bold">المقاعد المتبقية</span>
                                </div>
                                <span className="text-black font-black font-mono text-2xl">{spotsLeft}/50</span>
                            </div>
                            <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-black/10">
                                <div 
                                    className="h-full bg-black transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                    style={{ width: `${(spotsLeft / 50) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {step === 'gate' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center gap-6"
                        >
                            <div className="w-24 h-24 rounded-full border-2 border-[#53FC18] flex items-center justify-center shadow-[0_0_30px_rgba(83,252,24,0.2)] animate-pulse">
                                <Lock size={40} className="text-[#53FC18]" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">ACCESS RESTRICTED</h2>
                                <p className="text-[#53FC18] font-['Cairo'] font-bold text-lg">الدخول مقيد</p>
                                <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Authentication Required</p>
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStep('register')}
                                className="w-full py-4 bg-[#53FC18] hover:bg-[#45d612] text-black font-bold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_40px_rgba(83,252,24,0.6)] uppercase tracking-wider flex items-center justify-center gap-2 group"
                            >
                                <Key size={20} className="group-hover:rotate-45 transition-transform" />
                                <span className="flex flex-col leading-tight items-start">
                                    <span className="text-sm">CREATE ACCOUNT TO ACCESS EMPIRE</span>
                                    <span className="font-['Cairo'] text-lg">إنشاء حساب للولوج إلى الإمبراطورية</span>
                                </span>
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'register' && (
                        <motion.form 
                            initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            onSubmit={handleRegister}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between mb-2 text-[#53FC18] border-b border-[#53FC18]/30 pb-2">
                                <div className="flex items-center gap-2">
                                    <Shield size={20} />
                                    <span className="font-bold tracking-wider text-sm">IDENTITY VERIFICATION</span>
                                </div>
                                <span className="font-['Cairo'] font-bold text-sm">التحقق من الهوية</span>
                            </div>

                            {/* Verification Explanation */}
                            <div className="bg-[#53FC18]/5 border border-[#53FC18]/20 rounded-lg p-3 mb-1">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-[#53FC18] mt-0.5 shrink-0" />
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[10px] text-gray-300 leading-tight">
                                            <span className="text-[#53FC18] font-bold">Authenticity Check:</span> Access requires a verifiable digital footprint. Only valid usernames from <span className="text-white font-bold">Kick, Instagram, or Discord</span> will unlock the gate.
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-['Cairo'] leading-tight">
                                            <span className="text-[#53FC18] font-bold">فحص المصداقية:</span> يتطلب الوصول بصمة رقمية يمكن التحقق منها. فقط المعرفات الحقيقية من <span className="text-white font-bold">كيك، إنستغرام، أو ديسكورد</span> ستفتح البوابة.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Platform Username */}
                            <div className="relative group z-50">
                                {/* Platform Selector */}
                                <div className="absolute left-2 top-2 z-50">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setShowPlatformMenu(!showPlatformMenu)}
                                        className="flex items-center gap-2 bg-black/80 border border-[#53FC18]/30 rounded-lg px-2 py-1.5 text-white hover:border-[#53FC18] transition-all min-w-[110px]"
                                    >
                                        {selectedPlatform === 'Kick' && <Tv size={16} className="text-[#53FC18]" />}
                                        {selectedPlatform === 'Instagram' && <Instagram size={16} className="text-[#E1306C]" />}
                                        {selectedPlatform === 'Discord' && <Gamepad2 size={16} className="text-[#5865F2]" />}
                                        <span className="text-xs font-bold">{selectedPlatform}</span>
                                        <ChevronDown size={14} className="ml-auto text-gray-400" />
                                    </motion.button>

                                    {/* Dropdown Menu */}
                                    {showPlatformMenu && (
                                        <div className="absolute top-full left-0 mt-1 w-[140px] bg-black border border-[#53FC18]/30 rounded-lg shadow-[0_0_20px_rgba(83,252,24,0.2)] overflow-hidden flex flex-col">
                                            {[
                                                { name: 'Kick', icon: Tv, color: '#53FC18' },
                                                { name: 'Instagram', icon: Instagram, color: '#E1306C' },
                                                { name: 'Discord', icon: Gamepad2, color: '#5865F2' }
                                            ].map((platform) => (
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    key={platform.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPlatform(platform.name);
                                                        setShowPlatformMenu(false);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#53FC18]/10 text-left transition-colors"
                                                >
                                                    <platform.icon size={16} style={{ color: platform.color }} />
                                                    <span className="text-xs font-bold text-white">{platform.name}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input 
                                    type="text" 
                                    placeholder={`${selectedPlatform} Username | اسم المستخدم`}
                                    className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-36 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                    value={formData.platformUsername}
                                    onChange={(e) => setFormData({...formData, platformUsername: e.target.value})}
                                    required
                                />
                            </div>

                            {/* Nickname */}
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-4 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Nickname (G-Code Name) | اللقب"
                                    className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                                    required
                                />
                            </div>

                            {/* Password - No Copy Paste */}
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-4 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
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

                            {/* Confirm Password - No Copy Paste */}
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-4 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="Confirm Password | تأكيد كلمة المرور"
                                    className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    onPaste={(e) => { e.preventDefault(); return false; }}
                                    required
                                />
                            </div>

                            {/* Confirm Nickname - No Copy Paste */}
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-4 text-[#53FC18]/50 group-focus-within:text-[#53FC18] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Confirm Nickname | تأكيد اللقب"
                                    className="w-full bg-black/50 border border-[#53FC18]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#53FC18] focus:shadow-[0_0_15px_rgba(83,252,24,0.3)] transition-all placeholder:text-gray-600 font-['Cairo'] text-sm"
                                    value={formData.confirmNickname}
                                    onChange={(e) => setFormData({...formData, confirmNickname: e.target.value})}
                                    onPaste={(e) => { e.preventDefault(); return false; }}
                                    required
                                />
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
                                            You must DM this G-Code via <span className="text-white font-bold">{selectedPlatform}</span> immediately. Failure to verify within 20:00 mins will revoke your Rank #{userRank} and downgrade you to Citizen Class.
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-['Cairo'] leading-tight">
                                            <span className="text-red-500 font-bold">تحذير: المقعد غير مؤكد.</span>
                                            <br />
                                            يجب عليك إرسال هذا الكود عبر <span className="text-white font-bold">{selectedPlatform}</span> فوراً. عدم التحقق خلال 20 دقيقة سيؤدي لسحب الرتبة #{userRank} وتسجيلك كمستخدم عادي.
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
                                    window.open('/coming-soon', '_self');
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

export default SceneOne;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, Lock, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { load } from '@fingerprintjs/fingerprintjs';
import { generateRandomString, generateCodeChallenge } from '../pkce';

const API_BASE = 'http://localhost:5000';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Kick, 2: Register, 3: Login
  const [visitorId, setVisitorId] = useState(null);
  const [kickUsername, setKickUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Visitor ID
  useEffect(() => {
    const loadFp = async () => {
      try {
        const fp = await load();
        const result = await fp.get();
        const id = localStorage.getItem('stable_visitor_id') || result.visitorId;
        if (!localStorage.getItem('stable_visitor_id')) localStorage.setItem('stable_visitor_id', id);
        setVisitorId(id);
      } catch (e) {
        console.error('FP Error:', e);
      }
    };
    loadFp();
  }, []);

  // Handle Kick OAuth
  const handleConnectKick = async () => {
    setError('');
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    
    // Store verifier for callback
    localStorage.setItem('pkce_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);

    const clientId = '01KH3T8WNDZ269403HKC17JN7X'; 
    const origin = window.location.origin.replace(/\/$/, '');
    const redirectUri = `${origin}/login`; // Callback to THIS page
    
    const scope = 'user:read channel:read';
    const authUrl = `https://id.kick.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

    window.location.href = authUrl;
  };

  // Handle Callback
  useEffect(() => {
    const processCallback = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            // Clear URL to avoid re-processing
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(true);
            
            try {
                const codeVerifier = localStorage.getItem('pkce_code_verifier');
                const origin = window.location.origin.replace(/\/$/, '');
                
                const res = await fetch(`${API_BASE}/api/kick/exchange-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code,
                        code_verifier: codeVerifier,
                        redirect_uri: `${origin}/login`,
                        visitor_id: visitorId
                    })
                });
                
                const data = await res.json();
                if (data.success) {
                    setKickUsername(data.username);
                    if (data.is_profile_complete) {
                         // Auto login or ask for password?
                         // If profile is complete, we should ideally ask for password to be secure.
                         // But for smooth UX, maybe we just log them in if they just auth'd with Kick?
                         // Let's assume yes for now, but strictly we should verify password.
                         // However, the token exchange proves identity.
                         // So we can consider them logged in.
                         localStorage.setItem('user_session', JSON.stringify(data));
                         navigate('/dashboard');
                    } else {
                        setStep(2); // Go to Register Form
                    }
                } else {
                    setError('Kick Authentication Failed');
                }
            } catch (e) {
                setError('Authentication Error');
            }
            setLoading(false);
        }
    };
    
    if (visitorId) processCallback();
  }, [visitorId, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }
    if (!walletAddress) {
        setError('Wallet address is required');
        return;
    }
    
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitor_id: visitorId,
                password,
                wallet_address: walletAddress
            })
        });
        const data = await res.json();
        if (data.success) {
            navigate('/dashboard');
        } else {
            setError(data.error || 'Registration failed');
        }
    } catch (err) {
        setError('Connection failed');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: kickUsername, // reusing state variable
                password
            })
        });
        const data = await res.json();
        if (data.success) {
            navigate('/dashboard');
        } else {
            setError(data.error || 'Login failed');
        }
    } catch (err) {
        setError('Connection failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#53FC18]/10 blur-[100px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">AKGS <span className="text-[#53FC18]">EMPIRE</span></h1>
            <p className="text-gray-400">Join the Elite Ranks</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {step === 1 && (
            <div className="space-y-6">
                <div className="p-4 bg-[#53FC18]/5 border border-[#53FC18]/20 rounded-xl text-center">
                    <p className="text-gray-300 text-sm mb-4">Identify yourself via Kick to begin.</p>
                    <button
                        onClick={handleConnectKick}
                        className="w-full py-3 bg-[#53FC18] text-black font-bold rounded-lg hover:bg-[#45e612] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/></svg>
                        Connect with Kick
                    </button>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#050505] px-2 text-gray-500">Or</span></div>
                </div>

                <button 
                    onClick={() => setStep(3)}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
                >
                    Login with Password
                </button>
            </div>
        )}

        {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#53FC18]/10 text-[#53FC18] text-xs font-mono mb-2">
                        <CheckCircle size={12} /> Kick Verified
                    </div>
                    <h3 className="text-xl font-bold">{kickUsername}</h3>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">WALLET ADDRESS</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-3 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">PASSWORD</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">CONFIRM</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-[#53FC18] text-black font-bold rounded-lg hover:bg-[#45e612] transition-colors mt-4"
                >
                    {loading ? 'Registering...' : 'Complete Registration'}
                </button>
            </form>
        )}

        {step === 3 && (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">KICK USERNAME</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            value={kickUsername}
                            onChange={(e) => setKickUsername(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">PASSWORD</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors mt-4"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                
                <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-sm text-gray-500 hover:text-white mt-2"
                >
                    Don't have an account? Register
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default Login;

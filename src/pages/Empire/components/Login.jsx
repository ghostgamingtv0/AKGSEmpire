
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, Lock, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { load } from '@fingerprintjs/fingerprintjs';
import { generateRandomString, generateCodeChallenge } from '../../../pkce';
import BackgroundEffects from '../../../components/BackgroundEffects';

const API_BASE = '';

const Login = () => {
  const navigate = useNavigate();
  // const [step, setStep] = useState(1); // Removed in favor of simple toggle
  const [visitorId, setVisitorId] = useState(null);
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

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

  // Handle Register
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
    // Regex Check
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username must contain only letters, numbers, and underscores');
        return;
    }
    
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitor_id: visitorId,
                username,
                password,
                wallet_address: walletAddress
            })
        });
        const data = await res.json();
        if (data.success) {
             // Auto login
             handleLogin(e); 
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
                username, 
                password
            })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('user_session', JSON.stringify(data.user));
            navigate('/empire/home');
        } else {
            setError(data.error || 'Login failed');
        }
    } catch (err) {
        setError('Connection failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#020308] via-[#050816] to-[#020308] empire-gradient-page">
      <BackgroundEffects forceVisible={true} />
      
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-4 brand-gradient-text">AKGS EMPIRE</h1>
            <p className="text-xl text-gray-400 tracking-wider">Join the Elite Ranks</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-[#983695]/10 border border-[#983695]/60 rounded-lg flex items-center gap-2 text-[#f3d0ff] text-sm">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${isLoginMode ? 'bg-[#53FC18] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
                Login
            </button>
            <button 
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${!isLoginMode ? 'bg-[#53FC18] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
                Register
            </button>
        </div>

        {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Username</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="Enter username"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="Enter password"
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#53FC18] text-black font-bold rounded-lg hover:bg-[#45e612] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? 'Logging in...' : 'Login'} <ArrowRight size={18} />
                </button>
            </form>
        ) : (
            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Username (Letters, Numbers, _ only)</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="Choose username"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="0x..."
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="Create password"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-[#53FC18] focus:outline-none transition-colors"
                            placeholder="Confirm password"
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#53FC18] text-black font-bold rounded-lg hover:bg-[#45e612] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={18} />
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default Login;

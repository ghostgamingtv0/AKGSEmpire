import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Wallet, Menu, X, Users, Coins, Zap, User } from 'lucide-react';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import Earn from './components/Earn';
import Tokenomics from './components/Tokenomics';
import WalletModal from './components/WalletModal';
import Login from './components/Login';
import BackgroundEffects from './components/UnifiedBackground';
import FacebookSDK from './components/FacebookSDK';
import { ASSETS } from '../../config/constants';

const Navbar = ({ onConnect, walletAddress }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/empire', icon: <LayoutDashboard size={18} /> },
    { name: 'Earn', path: '/empire/earn', icon: <Zap size={18} /> },
    { name: 'Dashboard', path: '/empire/dashboard', icon: <Users size={18} /> },
    { name: 'Tokenomics', path: '/empire/tokenomics', icon: <Coins size={18} /> },
    { name: 'Login', path: '/empire/login', icon: <User size={18} /> },
  ];

  const formatAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/empire" className="flex items-center gap-3 group">
            <img 
              src={ASSETS.LOGO_URL} 
              alt="AKGS Empire Logo" 
              className="w-20 h-20 rounded-lg object-cover border border-[#53FC18]/50 group-hover:shadow-[0_0_20px_rgba(83,252,24,0.5)] transition-all duration-300"
            />
            <span className="font-bold text-2xl tracking-wider text-white group-hover:text-[#53FC18] transition-colors">AKGS<span className="text-[#53FC18]">EMPIRE</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === item.path 
                    ? 'text-[#53FC18] bg-[#53FC18]/10 shadow-[0_0_15px_rgba(83,252,24,0.3)]' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5 hover:scale-105'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <button 
              type="button"
              onClick={onConnect}
              className={`px-8 py-3 border-2 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg ${
                walletAddress 
                  ? 'bg-[#53FC18]/10 border-[#53FC18] text-[#53FC18] hover:bg-[#53FC18]/20 shadow-[0_0_20px_rgba(83,252,24,0.2)]' 
                  : 'bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-white hover:border-[#53FC18] hover:text-[#53FC18] hover:shadow-[0_0_25px_rgba(83,252,24,0.4)] hover:-translate-y-1'
              }`}
            >
              <Wallet size={20} />
              {walletAddress ? formatAddress(walletAddress) : 'Connect Wallet'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050505] border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    location.pathname === item.path 
                      ? 'bg-[#53FC18]/10 text-[#53FC18]' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              <button 
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onConnect();
                }}
                className={`w-full mt-4 btn-primary flex items-center justify-center gap-2 ${
                    walletAddress 
                      ? 'bg-[#53FC18]/10 border-[#53FC18] text-[#53FC18]' 
                      : ''
                  }`}
              >
                <Wallet size={18} />
                {walletAddress ? formatAddress(walletAddress) : 'Connect Wallet'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-[#050505] border-t border-white/10 py-12 mt-20 relative z-10">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="mb-8 flex justify-center">
        <span className="text-2xl font-bold text-white">AKGS<span className="text-[#53FC18]">EMPIRE</span></span>
      </div>
      <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
        The ultimate Social2Earn and Watch2Earn ecosystem on Polygon. Join the empire and start earning today.
      </p>
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {[
          { name: 'Twitter', url: 'https://x.com/tv_ghostgaming' },
          { name: 'Telegram', url: 'https://t.me/ghost_gamingtv' },
          { name: 'Discord', url: 'https://discord.gg/wMVJTrppXh' },
          { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61587413956110' },
          { name: 'Instagram', url: 'https://www.instagram.com/ghost.gamingtv/' },
          { name: 'TikTok', url: 'https://www.tiktok.com/@ghost.gamingtv' },
          { name: 'Threads', url: 'https://www.threads.com/@ghost.gamingtv' },
          { name: 'Kick', url: 'https://kick.com/ghost_gamingtv' }
        ].map((social) => (
          <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#53FC18] transition-colors">
            {social.name}
          </a>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 mb-8 opacity-90 hover:opacity-100 transition-opacity">
        <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
           <span className="text-[#53FC18]">✔</span> Verified & Sponsored By
        </span>
        <div className="flex items-center gap-8">
          <a href="https://www.geckoterminal.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
            <img src="https://i.ibb.co/B5FHyTcS/geckoterminal-dark.png" alt="GeckoTerminal" className="h-8 group-hover:scale-105 transition-transform" />
            <span className="text-xs text-gray-500 group-hover:text-[#53FC18] transition-colors">Official Strategic Partner</span>
          </a>
          <div className="w-px h-10 bg-white/10"></div>
          <a href="https://polygon.technology/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
            <div className="h-8 w-8 flex items-center justify-center">
               <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" alt="Polygon" className="max-h-full max-w-full group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-xs text-gray-500 group-hover:text-[#8247E5] transition-colors">Built on Polygon</span>
          </a>
        </div>
      </div>
      <p className="text-gray-600 text-sm">
        © 2026 AKGS Empire. All rights reserved.
      </p>
    </div>
  </footer>
);

function Empire() {
  const location = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Listen for storage events (in case wallet is connected in another tab or via modal)
    const handleStorageChange = () => {
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setWalletAddress(storedAddress);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wallet-connection-update', handleStorageChange); // Custom event

    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('ref_code', refCode);
      console.log('Referral Code Saved:', refCode);
    }

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        } else {
          setWalletAddress('');
          localStorage.removeItem('walletAddress');
        }
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wallet-connection-update', handleStorageChange);
    };
  }, []);

  const isHome = location.pathname === '/empire' || location.pathname === '/empire/';

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#53FC18] selection:text-black relative">
      <FacebookSDK />
      {!isHome && <BackgroundEffects />}
      <Navbar 
        onConnect={() => setIsWalletModalOpen(true)} 
        walletAddress={walletAddress}
      />
      <main className="flex-grow pt-20 relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route index element={<Hero />} />
            <Route path="earn" element={<Earn />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tokenomics" element={<Tokenomics />} />
            <Route path="login" element={<Login />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </div>
  )
}

export default Empire;
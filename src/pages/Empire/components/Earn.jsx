import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Coins, Lock, Crown, Percent, Zap, Shield, ShieldCheck, Gem, Bell, PlayCircle, Video, Image as ImageIcon, Plus, Wallet, Ghost, Info, Share2, Youtube, Users, ExternalLink } from 'lucide-react';
import { FaInstagram, FaShareNodes, FaXTwitter, FaTiktok, FaThreads, FaFacebook } from 'react-icons/fa6';
import { load } from '@fingerprintjs/fingerprintjs';
import { SOCIAL_LINKS } from '../../../config/constants';
import { generateRandomString, generateCodeChallenge } from '../../../pkce';

const NFT_IMAGE_MINING = "https://i.ibb.co/sv1qDbd0/E4gk6-In-WEAQ1s-JF.jpg";
const NFT_IMAGE_REWARD = "https://i.ibb.co/dwzrDDGk/33710b273ed1e486862440e0446dfc18.jpg";
const NFT_IMAGE_MAIN = NFT_IMAGE_MINING;

const ProjectNFTIcon = ({ color = "#53FC18", tier = "1", imageSrc = NFT_IMAGE_MAIN }) => (
  <div className="relative w-20 h-20 md:w-24 md:h-24 group">
    <div className="absolute inset-0 rounded-lg blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: color }}></div>
    <div className="relative w-full h-full rounded-lg overflow-hidden border-2 bg-black z-10" style={{ borderColor: color }}>
      <img 
        src={imageSrc} 
        alt="AKGS NFT" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    </div>
    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-black border border-white flex items-center justify-center z-20 shadow-lg">
       <span className="text-[11px] font-bold text-white leading-none" style={{ color: color }}>{tier}</span>
    </div>
  </div>
);

const Earn = () => {
  const [activeTab, setActiveTab] = useState('social');
  const [isKickLive, setIsKickLive] = useState(false); // State for stream status
  const [timeLeft, setTimeLeft] = useState('');
  const [visitorId, setVisitorId] = useState(null);
  const [kickUsername, setKickUsername] = useState(() => {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        return session.username || localStorage.getItem('kickUsername') || '';
    });
  // Alias kickUsername to username for compatibility with existing code
  const username = kickUsername;

  const [walletAddress, setWalletAddress] = useState(() => {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      return session.wallet_address || localStorage.getItem('walletAddress') || '';
  });
  const [isProfileSaved, setIsProfileSaved] = useState(() => localStorage.getItem('isProfileSaved') === 'true');
  const [gCode, setGCode] = useState(() => localStorage.getItem('gCode') || '');
  const [points, setPoints] = useState(0); // User's Total Points
  const [showKickModal, setShowKickModal] = useState(false);
  const [tempKickUsername, setTempKickUsername] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAction, setConsentAction] = useState(null);
  
  const [showCopyCodeModal, setShowCopyCodeModal] = useState(false);
  const [currentTaskForModal, setCurrentTaskForModal] = useState(null);
  const [showMiningNftModal, setShowMiningNftModal] = useState(false);
  const [selectedMiningTier, setSelectedMiningTier] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [miningUnlocked, setMiningUnlocked] = useState(() => localStorage.getItem('kick_mining_unlocked') === 'true');
  const [gCodeExpected, setGCodeExpected] = useState(() => localStorage.getItem('kick_gcode_expected') || '');
  const [gCodeExpiresAt, setGCodeExpiresAt] = useState(() => parseInt(localStorage.getItem('kick_gcode_expires_at') || '0', 10));
  const [gCodeInput, setGCodeInput] = useState('');
  const [gCodeDigits, setGCodeDigits] = useState(() => localStorage.getItem('kick_gcode_digits') || '');

  // Generate G-Code
  const generateGCode = (platform) => {
      if (!username || !walletAddress) return '👻LOGIN-FIRST👻';
      
      const prefixes = {
          'Discord': 'KGDS',
          'Instagram': 'KGI',
          'Twitter (X)': 'KGT',
          'Facebook': 'KGF',
          'TikTok': 'KGTK',
          'Telegram': 'KGTM',
          'Kick': 'KGKICK',
          'Threads': 'KGTH'
      };
      
      const prefix = prefixes[platform] || 'KG';
      // User requested: Prefix of wallet (e.g. 0x123abc)
      const walletPart = (typeof walletAddress === 'string' ? walletAddress : '').substring(0, 8); 
      const random = Math.floor(100000 + Math.random() * 900000); // 6 digits
      
      return `👻${prefix}-${username}-${walletPart}-${random}👻`;
  };

  const handleOpenTaskModal = (task) => {
      // STRICT SYNC: Use existing G-Code from registration if available
      const existingCode = localStorage.getItem('gCode');
      const code = existingCode || generateGCode(task.platform);
      
      setGeneratedCode(code);
      setCurrentTaskForModal(task);
      setShowCopyCodeModal(true);
  };

  const handleCopyAndOpen = () => {
      const codeToCopy = gCode || generatedCode;
      if (codeToCopy) {
          navigator.clipboard.writeText(codeToCopy).then(() => {
              window.open(currentTaskForModal.link, '_blank');
          });
      }
  };

  const handleConfirmTask = async () => {
      setShowCopyCodeModal(false);

      // Start Verification Process
      try {
          // Register verification attempt in backend
          const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';
          await fetch(`${API_BASE}/api/verify-task`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  username,
                  task_id: currentTaskForModal.id,
                  platform: currentTaskForModal.platform,
                  g_code: generatedCode
              })
          });
      } catch (e) {
          console.error('Verification request failed', e);
      }
      
      // Start 60s countdown for "Verifying..."
      setConfirmationTasks(prev => ({
          ...prev,
          [currentTaskForModal.id]: { 
              timeLeft: 60, 
              status: 'verifying',
              gCode: generatedCode // Store G-Code for this specific verification
          }
      }));
  };

  // Countdown Timer & Auto-Verification
  useEffect(() => {
    const timer = setInterval(() => {
      setConfirmationTasks(prev => {
        const next = { ...prev };
        let changed = false;
        
        Object.keys(next).forEach(taskId => {
            const taskState = next[taskId];
            if (taskState.status === 'verifying') {
                if (taskState.timeLeft > 0) {
                    taskState.timeLeft -= 1;
                    changed = true;
                } else {
                    // Time is up, trigger verification
                    taskState.status = 'completing'; 
                    changed = true;
                    
                    // Trigger API Call with stored G-Code
                    verifyTaskAfterCountdown(taskId, taskState.gCode);
                }
            }
        });
        
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [username]); // Removed generatedCode dependency

  const verifyTaskAfterCountdown = async (taskId, storedGCode) => {
      // Find task details
      const task = tasks.find(t => t.id === parseInt(taskId));
      if (!task) return;

      try {
          const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';
          const res = await fetch(`${API_BASE}/api/verify-task`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  username,
                  task_id: taskId,
                  platform: task.platform,
                  g_code: storedGCode || generatedCode // Fallback if missing
              })
          });
          
          const data = await res.json();
          
          if (data.success) {
               // Update UI to success
               setConfirmationTasks(prev => ({
                   ...prev,
                   [taskId]: { timeLeft: 0, status: 'verified', points: data.points_added }
               }));
               // Update global points if needed
               // setPoints(prev => prev + data.points_added);
          } else {
               setConfirmationTasks(prev => ({
                   ...prev,
                   [taskId]: { timeLeft: 0, status: 'failed', error: data.error }
               }));
          }
      } catch (e) {
          console.error('Verification failed', e);
          setConfirmationTasks(prev => ({
               ...prev,
               [taskId]: { timeLeft: 0, status: 'failed', error: 'Connection Error' }
          }));
      }
  };


  const miningNftTiers = [
    { id: 1, label: 'Level 1', multiplier: 1, bonusPoints: 20 },
    { id: 2, label: 'Level 2', multiplier: 2, bonusPoints: 40 },
    { id: 3, label: 'Level 3', multiplier: 3, bonusPoints: 60 },
    { id: 4, label: 'Level 4', multiplier: 4, bonusPoints: 80 },
    { id: 5, label: 'Level 5', multiplier: 5, bonusPoints: 100 },
  ];



  const [claimedTasks, setClaimedTasks] = useState(() => {
    const saved = localStorage.getItem('claimedTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [verifyingTasks, setVerifyingTasks] = useState([]); // Tasks ready to claim
  const [processingTasks, setProcessingTasks] = useState({}); // Tasks in 20s countdown: { id: { timeLeft: 20 } }
  const [feedStatus, setFeedStatus] = useState({}); // RSS Feed Status
  const [confirmationTasks, setConfirmationTasks] = useState({}); // { taskId: { timeLeft: 60, readyToConfirm: false } }

  // Load Twitter Widget & Handle Tab Switch
  useEffect(() => {
    const existingScript = document.getElementById('twitter-wjs');
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = 'twitter-wjs';
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    }
  }, []);

  // Reload Twitter Widget when switching to Watch tab
  useEffect(() => {
    if (activeTab === 'watch' && window.twttr) {
      window.twttr.widgets.load();
    }
  }, [activeTab]);

  const openKickConsent = () => {
    handleKickConnect();
  };

  const tasks = [
    { 
      id: 1, 
      type: 'social', 
      platform: 'Twitter (X)', 
      action: 'Follow AKGS on X (Twitter)', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.TWITTER,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
      )
    },
    { 
      id: 2, 
      type: 'social', 
      platform: 'Telegram', 
      action: 'Join Official Telegram', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.TELEGRAM,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-blue-500" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>
        </svg>
      )
    },
    { 
      id: 3, 
      type: 'social', 
      platform: 'Instagram', 
      action: 'Follow AKGS on Instagram', 
      reward: '5 Points',  
      status: 'pending', 
      link: SOCIAL_LINKS.INSTAGRAM,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-pink-500" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
        </svg>
      )
    },
    { 
      id: 4, 
      type: 'social', 
      platform: 'TikTok', 
      action: 'Follow AKGS on TikTok', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.TIKTOK,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    { 
      id: 5, 
      type: 'social', 
      platform: 'Kick', 
      action: 'Follow AKGS on Kick', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-[#53FC18]" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/>
        </svg>
      )
    },
    { 
      id: 6, 
      type: 'social', 
      platform: 'Discord', 
      action: 'Join Official Discord', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.DISCORD,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-indigo-500" aria-hidden="true">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
        </svg>
      )
    },
    { 
      id: 7, 
      type: 'social', 
      platform: 'Threads', 
      action: 'Follow AKGS on Threads', 
      reward: '5 Points', 
      status: 'pending', 
      link: SOCIAL_LINKS.THREADS,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM16.4 12.8c.2-2.1-1.3-3.6-3.3-3.8-2.6-.2-4.5 2-4.2 4.8.2 2.1 2 3.6 4.3 3.4.9-.1 1.7-.4 2.3-.9v2.1c-.8.6-1.9 1-2.9 1-3.6 0-6.4-2.8-6.3-6.4 0-3.5 2.8-6.4 6.4-6.4 3.4 0 6.1 2.6 6.3 6h2c-.2-4.5-3.8-8-8.3-8-4.6 0-8.3 3.7-8.3 8.3 0 4.6 3.7 8.3 8.3 1.6 0 3.2-.5 4.5-1.3l-1-1.7c-.9.6-2.1.9-3.4.9-3.4 0-6.2-2.7-6.2-6.1 0-3.4 2.8-6.2 6.2-6.2 3.2 0 5.8 2.4 6.1 5.5v.1c0 1.9-1.3 3.3-3.1 3.3-1.1 0-1.8-.7-1.7-1.8.1-1.8 1.4-3.1 3-3.2.1 0 .2 0 .3 0v-2c-.1 0-.3 0-.4 0-2.6.2-4.6 2.4-4.5 5 0 1.5.8 2.7 2.1 2.7 1.6 0 2.8-1.2 2.8-3.4v-.2z"/>
        </svg>
      )
    },
    { 
      id: 8, 
      type: 'watch', 
      platform: 'TikTok', 
      action: 'Like & Share Latest TikTok', 
      instruction: 'MANDATORY: Comment your G-Code under the post',
      reward: '10 Points', 
      status: 'new_content',
      contentType: 'Reel', 
      link: SOCIAL_LINKS.TIKTOK,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    { 
      id: 9, 
      type: 'watch', 
      platform: 'Instagram', 
      action: 'Like & Share Latest Instagram Reel', 
      instruction: 'MANDATORY: Comment your G-Code under the reel',
      reward: '10 Points', 
      status: 'new_content',
      contentType: 'Reel', 
      link: SOCIAL_LINKS.INSTAGRAM,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-pink-500" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
        </svg>
      )
    },
    { 
      id: 10, 
      type: 'watch', 
      platform: 'Twitter (X)', 
      action: 'Like & Repost Latest X Post', 
      instruction: 'MANDATORY: Comment your G-Code in the thread',
      reward: '10 Points', 
      status: 'new_content',
      contentType: 'Post', 
      link: SOCIAL_LINKS.TWITTER,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
      )
    },
    { 
      id: 19, 
      type: 'watch', 
      platform: 'Threads', 
      action: 'Like & Share Latest Threads Post', 
      instruction: 'MANDATORY: Comment your G-Code in the replies',
      reward: '10 Points', 
      status: 'new_content',
      contentType: 'Post', 
      link: SOCIAL_LINKS.THREADS,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM16.4 12.8c.2-2.1-1.3-3.6-3.3-3.8-2.6-.2-4.5 2-4.2 4.8.2 2.1 2 3.6 4.3 3.4.9-.1 1.7-.4 2.3-.9v2.1c-.8.6-1.9 1-2.9 1-3.6 0-6.4-2.8-6.3-6.4 0-3.5 2.8-6.4 6.4-6.4 3.4 0 6.1 2.6 6.3 6h2c-.2-4.5-3.8-8-8.3-8-4.6 0-8.3 3.7-8.3 8.3 0 4.6 3.7 8.3 8.3 1.6 0 3.2-.5 4.5-1.3l-1-1.7c-.9.6-2.1.9-3.4.9-3.4 0-6.2-2.7-6.2-6.1 0-3.4 2.8-6.2 6.2-6.2 3.2 0 5.8 2.4 6.1 5.5v.1c0 1.9-1.3 3.3-3.1 3.3-1.1 0-1.8-.7-1.7-1.8.1-1.8 1.4-3.1 3-3.2.1 0 .2 0 .3 0v-2c-.1 0-.3 0-.4 0-2.6.2-4.6 2.4-4.5 5 0 1.5.8 2.7 2.1 2.7 1.6 0 2.8-1.2 2.8-3.4v-.2z"/>
        </svg>
      )
    },
    { 
      id: 11, 
      type: 'mining', 
      platform: 'Kick', 
      action: isKickLive ? 'Mining Active (+5 pts/3min)' : 'Offline', 
      reward: '100 Points/Hour', 
      status: isKickLive ? 'pending' : 'disabled', 
      link: SOCIAL_LINKS.KICK,
      isLive: isKickLive,
      icon: (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 fill-current ${isKickLive ? 'text-[#53FC18]' : 'text-gray-400'}`} aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/>
        </svg>
      )
    },
    { 
      id: 14, 
      type: 'nft', 
      platform: 'AKGS NFT', 
      action: '1x Sub or Gift Sub', 
      reward: 'Tax: 4%', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: <ProjectNFTIcon color="#983695" tier="1x" imageSrc={NFT_IMAGE_REWARD} />
    },
    { 
      id: 15, 
      type: 'nft', 
      platform: 'Kick', 
      action: '2x Subs or Gift Subs', 
      reward: 'Tax: 3%', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: <ProjectNFTIcon color="#983695" tier="2x" imageSrc={NFT_IMAGE_REWARD} />
    },
    { 
      id: 16, 
      type: 'nft', 
      platform: 'Kick', 
      action: '3x Subs or Gift Subs', 
      reward: 'Tax: 2%', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: <ProjectNFTIcon color="#53FC18" tier="3x" imageSrc={NFT_IMAGE_REWARD} />
    },
    { 
      id: 18, 
      type: 'nft', 
      platform: 'Kick', 
      action: '4x Subs or Gift Subs', 
      reward: 'Tax: 1%', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: <ProjectNFTIcon color="#53FC18" tier="4x" imageSrc={NFT_IMAGE_REWARD} />
    },
    { 
      id: 20, 
      type: 'nft', 
      platform: 'Kick', 
      action: '5x Subs or Gift Subs', 
      reward: 'Tax: 0%', 
      status: 'pending', 
      link: SOCIAL_LINKS.KICK,
      icon: <ProjectNFTIcon color="#53FC18" tier="5x" imageSrc={NFT_IMAGE_REWARD} />
    },
  ];


  // Listen for Kick connection from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kickUsername' && e.newValue) {
        setKickUsername(e.newValue);
        setIsProfileSaved(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check for Kick Task Completion after Redirect
  useEffect(() => {
    const checkKickTask = async () => {
        const isPerforming = localStorage.getItem('performing_kick_task');
        const username = localStorage.getItem('kickUsername');
        
        if (isPerforming === 'true' && username) {
            // User just came back from Kick Auth
            console.log('🔄 Completing Kick Task...');
            
            // Find Kick Task (ID 5)
            const kickTask = tasks.find(t => t.id === 5);
            if (kickTask && !claimedTasks.includes(5)) {
                await claimTask(kickTask);
                localStorage.removeItem('performing_kick_task');
                alert(`Kick Account Connected: ${username}\nReward Claimed! ✅`);
            }
        }
    };
    checkKickTask();
  }, [claimedTasks]);



  // Capture Referral Code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerID = urlParams.get('ref');

    if (referrerID) {
      localStorage.setItem('referred_by', referrerID);
      console.log("Referred by:", referrerID);
    }
  }, []);

  // Fetch Feed Status
  useEffect(() => {
    const fetchFeeds = async () => {
        try {
            const API_BASE = ''; // Proxy handles routing
            const res = await fetch(`${API_BASE}/api/feed-status`);
            const data = await res.json();
            setFeedStatus(data);
        } catch (e) { console.error('Feed fetch error:', e); }
    };
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, []);

  // Timer for Confirmation Tasks (New Post flow)
  useEffect(() => {
    const interval = setInterval(() => {
      setConfirmationTasks(prev => {
        const newState = { ...prev };
        let hasChanges = false;
        
        Object.keys(newState).forEach(taskId => {
          if (newState[taskId].timeLeft > 0) {
            newState[taskId] = { ...newState[taskId], timeLeft: newState[taskId].timeLeft - 1 };
            hasChanges = true;
          } else if (newState[taskId].timeLeft === 0 && !newState[taskId].readyToConfirm) {
             newState[taskId] = { ...newState[taskId], readyToConfirm: true };
             hasChanges = true;
          }
        });
        
        return hasChanges ? newState : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer effect for processing tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingTasks(prev => {
        const newState = { ...prev };
        let hasChanges = false;
        
        Object.keys(newState).forEach(taskId => {
          if (newState[taskId].timeLeft > 0) {
            newState[taskId] = { ...newState[taskId], timeLeft: newState[taskId].timeLeft - 1 };
            hasChanges = true;
          } else if (newState[taskId].timeLeft === 0 && !verifyingTasks.includes(Number(taskId))) {
             // Timer finished, move to verifying
             setVerifyingTasks(prevVerifying => [...prevVerifying, Number(taskId)]);
             delete newState[taskId];
             hasChanges = true;
          }
        });
        
        return hasChanges ? newState : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [verifyingTasks]);

  // Initialize FingerprintJS with persistence
  useEffect(() => {
    const loadFp = async () => {
      try {
        const fpPromise = load();
        const { visitorId } = await (await fpPromise).get();
        
        // Prefer stored ID if available to prevent rotation
        const stored = localStorage.getItem('stable_visitor_id');
        const finalId = stored || visitorId;
        
        if (!stored) {
            localStorage.setItem('stable_visitor_id', finalId);
        }
        
        setVisitorId(finalId);
        console.log('FingerprintJS Visitor ID:', finalId);
      } catch (error) {
        console.error('Failed to load FingerprintJS:', error);
      }
    };
    loadFp();
  }, []);

  // Sync User with Backend
  useEffect(() => {
    if (visitorId) {
      const syncUser = async () => {
        try {
          const API_BASE = ''; // Proxy handles routing
          const response = await fetch(`${API_BASE}/api/init-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitor_id: visitorId,
              wallet_address: walletAddress,
              kick_username: kickUsername,
              referred_by: localStorage.getItem('referred_by') || null
            })
          });
          const data = await response.json();
          if (data.error) {
            console.error('User Sync Error:', data.error);
            if (data.error.includes('blocked')) {
               alert(data.error);
            }
          } else {
            console.log('User Synced:', data);
            
            // Sync Profile Data (Restore identity if cleared from localStorage)
            if (data.kick_username) {
                setKickUsername(data.kick_username);
                localStorage.setItem('kickUsername', data.kick_username);
            }
            if (data.wallet_address) {
                setWalletAddress(data.wallet_address);
                localStorage.setItem('walletAddress', data.wallet_address);
            }
            if (data.kick_username && data.wallet_address) {
                setIsProfileSaved(true);
                localStorage.setItem('isProfileSaved', 'true');
            }

            // Sync Points
            if (data.total_points !== undefined) {
                setPoints(data.total_points);
            }
            // Sync G-Code (Unlock if exists)
            if (data.g_code) {
                setGCode(data.g_code);
                localStorage.setItem('gCode', data.g_code);
            }
          }
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      };
      syncUser();
    }
  }, [visitorId, walletAddress, kickUsername]);

  const startTaskLogic = (task) => {
    // User is starting task - Start 20s Timer
    window.open(task.link, '_blank');
    
    // Track click in backend
    try {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, wallet_address: walletAddress, task_url: task.link })
      });
    } catch (e) { console.error(e); }

    setProcessingTasks(prev => ({
      ...prev,
      [task.id]: { timeLeft: 20 }
    }));
  };

  const proceedWithTask = async (task) => {
    // Check New Post Flow
    let platformKey = task.platform.toLowerCase();
    if (platformKey.includes('twitter')) platformKey = 'twitter';
    
    const feedData = feedStatus[platformKey];
    const isNewPost = feedData?.isNew;
    const targetLink = (isNewPost && feedData?.link) ? feedData.link : task.link;

    if (isNewPost) {
        if (confirmationTasks[task.id]?.readyToConfirm) {
             await claimTask(task);
             setConfirmationTasks(prev => {
                 const next = { ...prev };
                 delete next[task.id];
                 return next;
             });
             return;
        }
        
        if (!confirmationTasks[task.id]) {
            // Start Timer & Open Link
            window.open(targetLink, '_blank');
            setConfirmationTasks(prev => ({ ...prev, [task.id]: { timeLeft: 60, readyToConfirm: false } }));
             try {
                fetch('/api/track-click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visitor_id: visitorId, wallet_address: walletAddress, task_url: targetLink })
                });
            } catch (e) { }
            return;
        }
        // Timer running
        return;
    }

    if (verifyingTasks.includes(task.id)) {
      await claimTask(task);
    } else {
      startTaskLogic(task);
    }
  };

  const handleCopyAndStart = () => {
     const codeToCopy = gCode || generatedCode;
     if (codeToCopy) {
         navigator.clipboard.writeText(codeToCopy).then(() => {
             setShowCopyCodeModal(false);
             if (currentTaskForModal) {
                 proceedWithTask(currentTaskForModal);
                 setCurrentTaskForModal(null);
             }
         });
     }
  };
  
  const copyReferralLink = () => {
      if (!gCode) return;
      const link = `${window.location.origin}/?ref=${gCode}`;
      navigator.clipboard.writeText(link);
      alert('Referral Link Copied: ' + link);
  };

  const claimTask = async (task) => {
      try {
        const API_BASE = ''; // Proxy handles routing
        const response = await fetch(`${API_BASE}/api/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            task_id: task.id,
            points: parseInt(task.reward) || 5, // Send points as integer
            platform: task.platform
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newClaimed = [...claimedTasks, task.id];
          setClaimedTasks(newClaimed);
          localStorage.setItem('claimedTasks', JSON.stringify(newClaimed));
          console.log('✅ Reward claimed via Backend:', data.message);
        } else {
          console.error('❌ Claim failed:', data.message);
          alert('Failed to claim reward: ' + data.message);
        }
      } catch (error) {
        console.error('❌ Backend connection error:', error);
        const newClaimed = [...claimedTasks, task.id];
        setClaimedTasks(newClaimed);
        localStorage.setItem('claimedTasks', JSON.stringify(newClaimed));
      }
  };

  const handleVisitProfile = (e, platform) => {
    e.stopPropagation();
    const linkMap = {
        'Kick': SOCIAL_LINKS.KICK,
        'Twitter': SOCIAL_LINKS.TWITTER,
        'Telegram': SOCIAL_LINKS.TELEGRAM,
        'TikTok': SOCIAL_LINKS.TIKTOK,
        'Threads': SOCIAL_LINKS.THREADS,
        'Instagram': SOCIAL_LINKS.INSTAGRAM,
        'Discord': SOCIAL_LINKS.DISCORD,
        'YouTube': 'https://www.youtube.com/@ghostgamingtvGhost.gamingtv'
    };
    if (linkMap[platform]) {
        window.open(linkMap[platform], '_blank');
    }
  };

  const handleKickConnect = async () => {
    // Generate PKCE
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    
    // Store verifier and state in localStorage for later verification
    localStorage.setItem('kick_code_verifier', codeVerifier);
    localStorage.setItem('kick_auth_state', state);
    localStorage.setItem('performing_kick_task', 'true');
    
    // Construct Redirect URI (must match the one used in Exchange Token)
    const origin = window.location.origin.replace(/\/$/, '');
    const redirectUri = `${origin}/empire/earn/`;
    console.log('Kick OAuth Redirect URI:', redirectUri);
    
    // Use the hardcoded Client ID if env var is missing (fallback)
    const clientId = import.meta.env.VITE_KICK_CLIENT_ID || '01KH3T8WNDZ269403HKC17JN7X';
    const scopes = 'chat:write channel:read user:read events:subscribe channel:write moderation:ban kicks:read channel:rewards:read channel:rewards:write';
    const KICK_AUTH_URL = `https://id.kick.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
    
    // Redirect in same tab to ensure callback handles correctly in this context
    // or use _self to replace current page
    window.location.href = KICK_AUTH_URL;
  };

  // Normalize and parse G-Code from chat or manual input
  // Accept both formats:
  // 1) 👻<6digits>+<username>+GGT👻
  // 2) <username>+GGT+<6digits>
  const parseGCode = (raw) => {
    if (!raw) return null;
    let s = String(raw).trim();
    // Remove leading/trailing ghost emoji
    s = s.replace(/^👻/, '').replace(/👻$/, '');
    // Remove invisible spaces
    s = s.replace(/\s+/g, '');
    // Try digits-first
    let m = s.match(/^(\d{6})\+([a-zA-Z0-9_]+)\+GGT$/i);
    if (m) return { digits: m[1], user: m[2].toLowerCase(), format: 'digits-first' };
    // Try user-first (legacy)
    m = s.match(/^([a-zA-Z0-9_]+)\+GGT\+(\d{6})$/i);
    if (m) return { digits: m[2], user: m[1].toLowerCase(), format: 'user-first' };
    return null;
  };

  const handleTaskAction = async (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (task.status === 'disabled' || claimedTasks.includes(task.id)) return;

    if (task.platform === 'Kick' && task.type === 'mining') {
        if (!kickUsername) {
            alert('Connect Kick first');
            return;
        }
        const now = Date.now();
        if (!gCodeExpected || now > gCodeExpiresAt) {
            const num = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
            const code = `👻${num}+${kickUsername}+GGT👻`;
            const expires = now + 15 * 60 * 1000;
            setGCodeExpected(code);
            setGCodeDigits(num);
            setGCodeExpiresAt(expires);
            localStorage.setItem('kick_gcode_expected', code);
            localStorage.setItem('kick_gcode_expires_at', String(expires));
            localStorage.setItem('kick_gcode_digits', num);
            alert(`Your G-Code: ${code}\nValid for 15 minutes`);
            return;
        }
        if (!miningUnlocked) {
            const input = prompt('Enter your G-Code');
            const parsed = parseGCode(input);
            const expectedUser = (kickUsername || '').toLowerCase();
            const valid =
              parsed &&
              parsed.user === expectedUser &&
              parsed.digits === String(gCodeDigits) &&
              Date.now() <= gCodeExpiresAt;
            if (valid) {
                setMiningUnlocked(true);
                localStorage.setItem('kick_mining_unlocked', 'true');
                alert('Mining unlocked');
            } else {
                alert('Invalid or expired code');
            }
            return;
        }
    }

    if (['TikTok', 'Instagram', 'Facebook', 'Threads'].includes(task.platform) && task.type === 'social') {
        const width = 600;
        const height = 700;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const platformKey = task.platform.toLowerCase();

        if (task.platform === 'TikTok') {
            window.open(
                SOCIAL_LINKS.TIKTOK,
                'TikTokAuth',
                `width=${width},height=${height},top=${top},left=${left}`
            );
        } else {
            window.open(
                `/api/${platformKey}/login?visitor_id=${visitorId}`, 
                `${task.platform}Auth`, 
                `width=${width},height=${height},top=${top},left=${left}`
            );
        }
        return;
    }

    // 3. G-Code Requirement
    // Mandatory if instruction contains "MANDATORY" - ONLY for Watch Tasks
    const isMandatory = task.type === 'watch' && task.instruction && task.instruction.includes('MANDATORY');

    // Check if we need to show the modal (only if not already in confirmation/verifying state)
    let platformKey = task.platform.toLowerCase();
    if (platformKey.includes('twitter')) platformKey = 'twitter';
    const isTimerRunning = confirmationTasks[task.id];
    
    if (isMandatory && !isTimerRunning && !verifyingTasks.includes(task.id)) {
         handleOpenTaskModal(task);
         return; 
    }

    proceedWithTask(task);
  };

  // Calculate time until next Friday 12:00 PM
  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 5 = Friday
      const currentHour = now.getHours();
      
      // Calculate days until next Friday
      // If today is Friday and it's before 12PM, target is today 12PM
      // If today is Friday and it's after 12PM, target is next Friday
      let daysUntilFriday = 5 - currentDay;
      if (daysUntilFriday < 0 || (daysUntilFriday === 0 && currentHour >= 12)) {
        daysUntilFriday += 7;
      }

      const nextFriday = new Date(now);
      nextFriday.setDate(now.getDate() + daysUntilFriday);
      nextFriday.setHours(12, 0, 0, 0);

      const difference = nextFriday.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Renewal in progress...');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Kick Stream Status (Real Implementation)
  useEffect(() => {
    const checkKickStatus = async () => {
      try {
        const API_BASE = ''; // Proxy handles routing
        const response = await fetch(`${API_BASE}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.kick_stats) {
            setIsKickLive(data.kick_stats.is_live === true || data.kick_stats.is_live === 'true');
          }
        }
      } catch (error) {
        console.error('Failed to check Kick status:', error);
      }
    };
    
    checkKickStatus();
    // Poll every 60 seconds
    const interval = setInterval(checkKickStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Mining Robot: Auto-Ping when Live ---
  useEffect(() => {
    let interval;
    if (isKickLive && visitorId) {
       console.log('⛏️ Mining Active: Starting Ping Loop...');
       
       // Initial ping (optional, but better to wait 1 min)
       
       interval = setInterval(async () => {
           try {
               const API_BASE = ''; // Proxy handles routing
               const res = await fetch(`${API_BASE}/api/mining/ping`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ visitor_id: visitorId })
               });
               const data = await res.json();
               if (data.success) {
                   console.log('💰 Mining Reward:', data.points_added);
                   setPoints(prev => prev + data.points_added);
               } else {
                   console.log('Mining Ping Failed:', data.message);
               }
           } catch (e) { console.error('Mining Error:', e); }
       }, 180000); // 3 minutes
    }
    return () => clearInterval(interval);
  }, [isKickLive, visitorId]);


  // Auto-detect Wallet
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error(err);
        }
        
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            setWalletAddress('');
          }
        });
      }
    };
    checkWallet();
  }, []);

  // G-Code Generation Logic
  useEffect(() => {
    // Only generate if user has Kick Username & Wallet
    if (kickUsername && walletAddress && !gCode) {
      // Logic moved to backend to ensure uniqueness and persistence
      // But we can check if it exists in local storage or backend response
    }
  }, [kickUsername, walletAddress, gCode]);

  const handleProfileSave = async () => {
    if (kickUsername && walletAddress) {
      localStorage.setItem('kickUsername', kickUsername);
      localStorage.setItem('walletAddress', walletAddress);
      
      // Save to Backend
      try {
        if (visitorId) {
          await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitor_id: visitorId,
              kick_username: kickUsername,
              wallet_address: walletAddress
            })
          });
        }
        localStorage.setItem('isProfileSaved', 'true');
        setIsProfileSaved(true);
        alert('Profile Saved! Complete social tasks to unlock your G-Code.');
      } catch (error) {
        console.error('Failed to save profile to backend:', error);
        localStorage.setItem('isProfileSaved', 'true');
        setIsProfileSaved(true);
        alert('Profile Saved locally, but failed to sync with server.');
      }
    } else {
      alert('Please enter both Kick Username and Wallet Address.');
    }
  };

  const handleDirectConnect = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('Please install a Web3 wallet extension.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trigger = params.get('kick_connect');
    if (trigger === '1') {
      params.delete('kick_connect');
      const search = params.toString();
      const newUrl = window.location.pathname + (search ? `?${search}` : '');
      window.history.replaceState({}, document.title, newUrl);
      handleKickConnect();
    }
  }, []);

  // Handle OAuth Callback Messages (Popup)
  useEffect(() => {
    const handleMessage = async (event) => {
        // Verify origin if needed, but for local/prod hybrid we might be lenient or check specific domains
        // if (event.origin !== window.location.origin) return; 

        const { type, username } = event.data;
        if (!type || !username) return;

        let platform = '';
        let taskId = 0;

        switch (type) {
            case 'TIKTOK_CONNECTED':
                platform = 'TikTok';
                taskId = 4;
                break;
            case 'INSTAGRAM_CONNECTED':
                platform = 'Instagram';
                taskId = 3;
                break;
            case 'FACEBOOK_CONNECTED':
                platform = 'Facebook';
                taskId = 17;
                break;
            case 'THREADS_CONNECTED':
                platform = 'Threads';
                taskId = 7;
                break;
            default:
                return;
        }

        if (platform && taskId) {
            console.log(`✅ ${platform} Connected: ${username}`);
            // Claim the task
            const task = tasks.find(t => t.id === taskId);
            if (task && !claimedTasks.includes(taskId)) {
                await claimTask(task);
                alert(`${platform} Connected as ${username}!\nReward Claimed!`);
            } else {
                alert(`${platform} Connected as ${username}!`);
            }
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tasks, claimedTasks]);

  // Handle OAuth Callback (Redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Handle Kick OAuth Errors
    if (error) {
        const origin = window.location.origin.replace(/\/$/, '');
        const currentRedirectUri = `${origin}/empire/earn/`;
        
        // Detailed Error Message for User
        let errorMsg = `Kick Login Failed: ${error}`;
        if (error === 'invalid_redirect_uri' || error.includes('redirect')) {
            errorMsg += `\n\nACTION REQUIRED:\nYou must add this Redirect URI to your Kick Developer Dashboard:\n\n${currentRedirectUri}`;
        }
        
        alert(errorMsg);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (code && state) {
        const savedState = localStorage.getItem('kick_auth_state');
        const codeVerifier = localStorage.getItem('kick_code_verifier');
        const isTaskAction = localStorage.getItem('performing_kick_task');

        if (state === savedState && codeVerifier) {
            const exchangeToken = async () => {
                try {
                    const API_BASE = ''; // Proxy handles routing
                    const origin = window.location.origin.replace(/\/$/, '');
                    const redirectUri = `${origin}/empire/earn/`;

                    const response = await fetch(`${API_BASE}/api/kick/exchange-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code,
                            code_verifier: codeVerifier,
                            visitor_id: visitorId || localStorage.getItem('stable_visitor_id'),
                            redirect_uri: redirectUri
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success && data.username) {
                        setKickUsername(data.username);
                        localStorage.setItem('kickUsername', data.username);
                        setIsProfileSaved(true);
                        localStorage.setItem('isProfileSaved', 'true');
                        
                        // Check if user is following (based on backend check)
                        const isFollowing = data.following;
                        
                        if (isTaskAction || isFollowing) {
                            // If this was initiated by the Kick Task OR we confirmed they are following
                            console.log('🔄 Claiming Kick Task (ID 5)...');
                            const kickTask = tasks.find(t => t.id === 5);
                            if (kickTask) {
                                try {
                                    await claimTask(kickTask);
                                    // Manually update local state to ensure UI reflects change immediately
                                    setClaimedTasks(prev => {
                                        if (!prev.includes(5)) return [...prev, 5];
                                        return prev;
                                    });
                                    alert(`✅ Connected as ${data.username}!\nReward Claimed!`);
                                } catch (err) {
                                    console.error('Claim failed:', err);
                                    // Fallback: Force add to local state if backend claim fails but we verified identity
                                    setClaimedTasks(prev => [...prev, 5]);
                                }
                            }
                            localStorage.removeItem('performing_kick_task');
                        } else {
                            alert(`✅ Connected as ${data.username}`);
                        }
                    } else {
                        console.error('Kick Connect Failed:', data);
                        alert('Failed to connect Kick account: ' + (data.error || 'Could not retrieve username. Please try again.'));
                    }
                } catch (error) {
                    console.error('Token Exchange Error:', error);
                }
            };
            exchangeToken();
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.removeItem('kick_auth_state');
        localStorage.removeItem('kick_code_verifier');
    }
  }, [visitorId]);

  // Ensure visitorId is stable
  useEffect(() => {
    const storedVisitorId = localStorage.getItem('stable_visitor_id');
    if (storedVisitorId) {
        setVisitorId(storedVisitorId);
    }
  }, []);


  
  // Lock Profile Check
  const isProfileLocked = kickUsername && walletAddress && isProfileSaved;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-24 empire-gradient-page">
      {/* Copy Code Modal */}
      {showCopyCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#53FC18]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_0_30px_rgba(83,252,24,0.1)]">
             <button 
              onClick={() => setShowCopyCodeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#53FC18]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#53FC18]/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#53FC18]"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Required Action</h3>
              <p className="text-gray-300 text-sm mb-4">
                You must comment your G-Code on the post to verify this task.
              </p>
              <div className="bg-[#53FC18]/10 border border-[#53FC18]/30 p-3 rounded-lg mb-4">
                 <span className="text-2xl md:text-3xl font-mono font-bold text-[#53FC18] tracking-widest relative z-10 select-all">{gCode || generatedCode}</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">
               Copy this code and paste it in the comments.
            </p>
            <p className="text-xs text-[#53FC18]" dir="rtl">
               انسخ هذا الكود وضعه في التعليقات
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-[10px] text-gray-400">Code is valid for 15 minutes only</p>
                <p className="text-[10px] text-gray-400" dir="rtl">الكود صالح لمدة 15 دقيقة فقط</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopyAndOpen}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <span>Copy & Open</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button
              type="button"
              onClick={handleConfirmTask}
              className="flex-1 bg-[#53FC18] hover:bg-[#45d612] text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)] flex items-center justify-center gap-2"
            >
              <span>Confirm</span>
              <CheckCircle size={18} />
            </button>
          </div>
          </div>
        </div>
      )}


      {/* Kick consent modal removed per latest requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight brand-gradient-text">
            Earn Points
          </h1>
          <p className="text-xl max-w-2xl mx-auto leading-relaxed brand-gradient-text">
            Complete tasks to earn points and climb the leaderboard.
            Choose a category below to get started.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-x-auto">
            {[
              { id: 'social', label: 'Social Tasks', icon: Share2 },
              { id: 'watch', label: 'Watch to Earn', icon: Youtube },
              { id: 'NFTs', label: 'NFT Rewards', icon: Gem },
              { id: 'mining', label: 'Mining', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all duration-300 text-lg ${
                  activeTab === tab.id
                    ? 'bg-[#53FC18] text-black shadow-[0_0_20px_rgba(83,252,24,0.3)] scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={24} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Identity & G-Code Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
          {/* Identity Card */}
          <div className="glass-panel p-6 border border-white/10 relative overflow-hidden group h-full flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#53FC18]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 text-white tracking-wide">
              <ShieldCheck className="text-[#53FC18]" />
              User Identity
            </h2>
            
            {!gCode ? (
              !isProfileSaved ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Kick Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={kickUsername}
                      readOnly
                      placeholder="Link Kick Account"
                      className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-[#53FC18] outline-none text-white font-sans text-lg pr-24 ${isProfileLocked ? 'cursor-not-allowed opacity-70 text-gray-400' : ''}`}
                    />
                    {!kickUsername && !isProfileLocked && (
                       <button
                         type="button"
                         onClick={openKickConsent}
                         className="absolute right-1 top-1 bottom-1 bg-[#53FC18] text-black text-xs font-bold px-4 rounded-lg hover:bg-[#45d612] transition-colors flex items-center gap-1 uppercase tracking-wide"
                       >
                         Link Kick
                       </button>
                    )}
                    {isProfileLocked && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Lock size={16} className="text-gray-500" />
                        </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Wallet Address (Polygon)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={walletAddress}
                      readOnly
                      placeholder="Connect Wallet to detect"
                      className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-[#53FC18] outline-none text-white font-mono text-sm pr-24 ${isProfileLocked ? 'cursor-not-allowed opacity-70 text-gray-400' : ''}`}
                    />
                    {!walletAddress && !isProfileLocked && (
                      <button 
                        onClick={handleDirectConnect}
                        className="absolute right-1 top-1 bottom-1 bg-[#53FC18] text-black text-xs font-bold px-4 rounded-lg hover:bg-[#45d612] transition-colors uppercase tracking-wide"
                      >
                        Connect
                      </button>
                    )}
                    {isProfileLocked && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Lock size={16} className="text-gray-500" />
                        </div>
                    )}
                  </div>
                </div>
                {!isProfileLocked && (
                  <button 
                    onClick={handleProfileSave}
                    className="w-full bg-white/5 hover:bg-[#53FC18] hover:text-black border border-white/10 hover:border-[#53FC18] text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-sm"
                  >
                    Claim Code & Save
                  </button>
                )}
                <p className="text-xs text-gray-500 text-center font-sans">
                  Required for G-Code generation & Leaderboard verification
                </p>
              </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-5 bg-[#53FC18]/10 border border-[#53FC18]/30 rounded-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                        <CheckCircle size={40} className="text-[#53FC18]" />
                    </div>
                    <p className="text-xs font-bold text-[#53FC18] mb-2 uppercase tracking-widest">Identity Connected</p>
                    <p className="text-2xl text-white font-heading font-bold mb-1">{kickUsername}</p>
                    {gCode && (
                        <div className="mb-2">
                            <span className="text-[#53FC18] font-mono text-sm font-bold border border-[#53FC18]/30 bg-[#53FC18]/10 px-2 py-0.5 rounded">
                                {gCode}
                            </span>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 font-mono bg-black/40 inline-block px-3 py-1 rounded-full">{walletAddress.substr(0, 6)}...{walletAddress.substr(-4)}</p>
                    <div className="mt-4 pt-4 border-t border-[#53FC18]/20 flex justify-between items-center">
                        <button 
                          onClick={() => setIsProfileSaved(false)}
                          className="text-[10px] text-gray-400 hover:text-white underline uppercase tracking-wider"
                        >
                          Edit Identity Details
                        </button>
                        <button
                          onClick={() => {
                            if(confirm('Reset all app data? This is for testing purposes.')) {
                              localStorage.clear();
                              window.location.reload();
                            }
                          }}
                          className="text-[10px] text-[#983695] hover:text-[#53FC18] underline uppercase tracking-wider"
                        >
                          Reset Data (Dev)
                        </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400 font-bold uppercase text-xs">G-Code Status</span>
                          <span className="text-[#983695] font-bold text-xs uppercase">Pending Tasks</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                           className="bg-gradient-to-r from-[#983695] via-[#53FC18] to-[#983695] h-full transition-all duration-500"
                           style={{ width: `${(claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length / tasks.filter(t => t.type === 'social').length) * 100}%` }}
                        />
                      </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-5">
                <div className="p-6 bg-gradient-to-br from-[#53FC18]/20 to-black border border-[#53FC18]/30 rounded-2xl text-center shadow-[0_0_30px_rgba(83,252,24,0.15)]">
                  <div className="w-12 h-12 bg-[#53FC18] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#53FC18]/40">
                    <CheckCircle size={24} className="text-black" />
                  </div>
                  <p className="text-sm text-[#53FC18] font-bold uppercase tracking-widest mb-1">Identity Verified</p>
                  <p className="text-3xl text-white font-heading font-bold tracking-wide">{kickUsername}</p>
                  <p className="text-xs text-gray-300 font-mono mt-2 opacity-80">{walletAddress.substr(0, 8)}...{walletAddress.substr(-6)}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Account Status</div>
                        <div className="text-[#53FC18] font-bold flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53FC18] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#53FC18]"></span>
                            </span>
                            Active
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Social Tasks</div>
                        <div className="text-[#53FC18] font-bold">100% Completed</div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* G-Code Status */}
          <div className="glass-panel p-6 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
            {gCode ? (
              <div className="animate-in fade-in zoom-in duration-500 w-full">
                <div className="w-20 h-20 rounded-full bg-[#53FC18]/10 flex items-center justify-center mx-auto mb-6 border border-[#53FC18]/50 shadow-[0_0_40px_rgba(83,252,24,0.2)] relative group">
                   <div className="absolute inset-0 rounded-full bg-[#53FC18] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                   <Crown size={40} className="text-[#53FC18] relative z-10" />
                </div>
                <h2 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-widest text-xs">Your Unique G-Code</h2>
                <div className="bg-black/80 border border-[#53FC18] rounded-xl px-6 py-5 mb-3 shadow-inner shadow-[#53FC18]/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <span className="text-2xl md:text-3xl font-mono font-bold text-[#53FC18] tracking-widest relative z-10 select-all">{gCode}</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest font-bold">Permanent ID • Non-Renewable</p>

                {/* Referral Section */}
                <div className="w-full mt-auto pt-5 border-t border-white/10">
                   <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center justify-center gap-2 uppercase tracking-wider">
                     <Users size={14} className="text-[#53FC18]" />
                     Referral Program
                   </h3>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-xs text-gray-300 font-mono truncate shadow-inner">
                        {`${window.location.origin}/?ref=${gCode}`}
                      </div>
                      <button 
                        onClick={copyReferralLink}
                        className="bg-[#53FC18] hover:bg-[#45d612] text-black border border-[#53FC18] px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide shadow-[0_0_15px_rgba(83,252,24,0.3)]"
                      >
                        Copy
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-500 mt-3 font-sans">
                      Earn <span className="text-[#53FC18]">5%</span> of your friends' points forever
                   </p>
                </div>
              </div>
            ) : (
              <div className="opacity-60 w-full max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <Lock size={40} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-gray-300 mb-2">G-Code Locked</h2>
                <p className="text-sm text-gray-500 mb-8 font-sans leading-relaxed">
                  Complete all Social Tasks and verify your identity to reveal your unique G-Code.
                </p>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className="bg-[#53FC18] h-full transition-all duration-500 shadow-[0_0_10px_rgba(83,252,24,0.5)]"
                    style={{ width: `${(claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length / tasks.filter(t => t.type === 'social').length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Progress</span>
                    <span>{claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length} / {tasks.filter(t => t.type === 'social').length} Tasks</span>
                </div>
              </div>
            )}
          </div>
        </div>
          {/* Token Tax & Staking Policy (Moved here for better flow) */}
            {activeTab === 'NFTs' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 mb-8 p-1 bg-gradient-to-r from-[#53FC18]/20 via-transparent to-[#53FC18]/20 rounded-2xl shadow-[0_0_20px_rgba(83,252,24,0.1)]"
              >
                <div className="bg-[#0a0a0a] rounded-xl p-8 border border-[#53FC18]/20 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#53FC18]/5 rounded-full blur-3xl -z-10"></div>
                  
                  <h3 className="text-[#53FC18] font-bold text-2xl flex items-center gap-3 mb-6 tracking-wide">
                    <Shield size={28} /> Token Tax & Staking Policy
                  </h3>
                  
                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-10 relative z-10">
                    {/* English Section */}
                    <div className="space-y-5">
                      <p className="text-base text-gray-200 leading-relaxed font-light">
                        The standard tax is maintained at <span className="text-[#53FC18] font-bold text-lg">15%</span> to encourage long-term holding and staking rewards. However, on special days, the tax will be reduced!
                      </p>
                      <div className="pt-2">
                        <span className="text-white font-bold text-base flex items-center gap-2 mb-2">
                          <Gem size={18} className="text-[#983695]" /> 
                          Loyalty Rewards Program
                        </span>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Exclusive, high-utility NFTs will be airdropped as prestige gifts to our most dedicated members, directly rewarding engagement depth and staking duration.
                        </p>
                      </div>
                    </div>

                    {/* Arabic Section */}
                    <div className="space-y-5 text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10" dir="rtl">
                      <p className="text-base text-gray-200 leading-relaxed font-arabic">
                        يتم الحفاظ على الضريبة القياسية عند <span className="text-[#53FC18] font-bold text-lg">15%</span> لتعزيز الاستثمار طويل الأجل وزيادة عوائد التخزين لمجتمعنا. ومع ذلك، في أيام خاصة، سيتم تخفيض الضريبة!
                      </p>
                      <div className="pt-2">
                        <span className="text-white font-bold text-base flex items-center gap-2 mb-2 justify-end">
                          برنامج مكافآت الولاء 
                          <Gem size={18} className="text-[#983695]" />
                        </span>
                        <p className="text-sm text-gray-400 leading-relaxed font-arabic">
                          سيتم توزيع NFTs حصرية وعالية القيمة كهدايا تقديرية لأعضاء مجتمعنا الأكثر ولاءً، مكافأةً لهم على عمق تفاعلهم ومدة تخزينهم للعملة.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Points Balance & Info */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 max-w-7xl mx-auto">
                    <div className="p-6 bg-[#53FC18]/5 border border-[#53FC18]/20 rounded-2xl flex-1 shadow-lg shadow-[#53FC18]/20 w-full">
                  <h3 className="mb-3 flex items-center gap-2 font-heading">
                    <Coins size={18} className="text-[#983695]" />
                    <span className="uppercase tracking-[0.4em] text-sm md:text-base">
                      Earning & Conversion Rate
                    </span>
                  </h3>
                  <div className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-2">
                    AKGS Empire • Commanders Only
                  </div>
                   <p className="text-gray-300 text-sm leading-relaxed font-arabic" dir="rtl">
                     <span className="text-[#53FC18] font-bold text-base font-sans">
                       كل 100 نقطة تساوي 1000 AKGS عملة AKGS (100 Points = 1,000 Coins).
                     </span>
                     كلما جمعت نقاط أكثر عبر المهام والتعدين، كلما تضاعفت حصتك الفعلية من العملة.
                   </p>
                </div>

                <div className="glass-panel px-8 py-6 flex items-center gap-6 border border-[#53FC18]/30 bg-[#53FC18]/5 rounded-2xl w-full md:w-auto min-w-[300px] justify-between md:justify-start">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 uppercase mb-1 tracking-widest font-bold">All Points Balance</div>
                      <div className="text-4xl font-bold text-[#53FC18] drop-shadow-[0_0_15px_rgba(83,252,24,0.5)] font-heading">{points.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        Resets in: <span className="text-[#53FC18]">{timeLeft}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#53FC18]/20 flex items-center justify-center text-[#53FC18] shadow-[0_0_20px_rgba(83,252,24,0.3)] border border-[#53FC18]/30">
                      <Clock size={32} />
                    </div>
                </div>
            </div>

        {/* Social Task Security Notice */}
        {activeTab === 'social' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass-panel border border-[#53FC18]/20 bg-[#53FC18]/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={100} className="text-[#53FC18]" />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-2">
                 <h4 className="text-[#53FC18] font-bold flex items-center gap-2">
                   <ShieldCheck size={20} />
                   Security Verification Notice
                 </h4>
                 <p className="text-sm text-gray-300 leading-relaxed">
                   If you are asked to log in again to a social media platform, this is strictly for <strong>verification purposes only</strong>. We use official APIs to confirm you are following our channels. We never access your personal data or post on your behalf.
                 </p>
              </div>
              <div className="space-y-2 text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8" dir="rtl">
                 <h4 className="text-[#53FC18] font-bold flex items-center gap-2 justify-end font-arabic">
                   تنويه أمني هام
                   <ShieldCheck size={20} />
                 </h4>
                 <p className="text-sm text-gray-300 leading-relaxed font-arabic">
                   إذا طُلب منك إعادة تسجيل الدخول إلى منصة التواصل الاجتماعي، فهذا الإجراء مخصص <strong>لأغراض التحقق فقط</strong>. نحن نستخدم الأنظمة الرسمية للتأكد من متابعتك لحساباتنا. نحن لا نطلع أبداً على بياناتك الشخصية ولا ننشر أي شيء نيابة عنك.
                 </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Watch Task Fair Play Rules */}
        {activeTab === 'watch' && (
          <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel p-6 border border-[#53FC18]/20 bg-[#53FC18]/5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-[#53FC18]" />
                    <h2 className="text-xl font-bold brand-gradient-text">Fair Play & Transparency Rules</h2>
                </div>
                <div className="flex items-center gap-3 md:flex-row-reverse text-right" dir="rtl">
                    <Shield className="text-[#53FC18] md:hidden" />
                    <h2 className="text-xl font-bold font-arabic text-[#53FC18]">قواعد اللعب النظيف والشفافية</h2>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 relative">
                {/* Divider for desktop */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>

                {/* English Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 brand-gradient-text">
                            <Info size={16} className="text-[#983695]" />
                            Community Motto
                        </h3>
                        <p className="text-lg italic text-gray-300">
                            "Don't hold back, be creative, provided it's real."
                        </p>
                    </div>
                    
                    <div className="space-y-4 text-sm text-gray-400">
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">Authenticity:</strong> All interactions must be genuine. Automated bots, spam, or fake engagement will result in immediate disqualification.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">Transparency:</strong> Points are tracked in real-time. Leaderboards update automatically based on verified on-chain and database actions.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">Fair Competition:</strong> Weekly resets ensure everyone has a fresh start to reach the top. Previous winners are celebrated in the Hall of Fame.</p>
                        </div>
                    </div>
                </div>

                {/* Arabic Section */}
                <div className="space-y-6 text-right" dir="rtl">
                    <div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 justify-end font-arabic brand-gradient-text">
                            شعار المجتمع
                            <Info size={16} className="text-[#983695]" />
                        </h3>
                        <p className="text-lg text-[#53FC18] font-arabic">
                            "لا تبخل ابدع بشرط ان يكون حقيقي"
                        </p>
                    </div>
                    
                    <div className="space-y-4 text-sm text-gray-400 font-arabic">
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">المصداقية:</strong> يجب أن تكون جميع التفاعلات حقيقية. سيؤدي استخدام الروبوتات الآلية (Bots) أو التفاعلات الوهمية إلى الاستبعاد الفوري.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">الشفافية:</strong> يتم تتبع النقاط في الوقت الفعلي. يتم تحديث قوائم المتصدرين تلقائيًا بناءً على إجراءات تم التحقق منها عبر البلوكشين وقاعدة البيانات.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-[#53FC18] rounded-full h-auto mt-1 mb-1"></div>
                            <p><strong className="text-white">المنافسة العادلة:</strong> تضمن عمليات إعادة التعيين الأسبوعية بداية جديدة للجميع للوصول إلى القمة. يتم الاحتفاء بالفائزين السابقين في قاعة المشاهير.</p>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>

          {/* Social Feeds & Interactive Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
             {/* Twitter Widget */}
             {(() => {
                 const task = tasks.find(t => t.id === 10);
                 const isNew = feedStatus['twitter']?.isNew;
                 const isClaimed = claimedTasks.includes(task.id);
                 const confirmState = confirmationTasks[task.id];
                 const isTimerRunning = confirmState && confirmState.timeLeft > 0;
                 const isReadyToConfirm = confirmState && confirmState.readyToConfirm;
                 
                let statusText = isNew ? "OPEN & EARN" : "VIEW FEED";
                let statusColor = "text-white";
                let borderClass = isNew ? 'bg-gradient-to-br from-[#983695]/20 to-black border-[#983695]/50 shadow-[0_0_30px_rgba(152,54,149,0.4)]' : 'bg-[#0A0A0A] border-white/5 hover:border-white/20';
                 
                if (isClaimed) {
                    statusText = "COMPLETED";
                    statusColor = "text-[#53FC18]";
                    borderClass = "bg-[#0A0A0A] border-[#53FC18]/30 opacity-60";
                 } else if (isReadyToConfirm) {
                     statusText = "CLAIM REWARD";
                     statusColor = "text-[#53FC18] animate-pulse";
                     borderClass = "bg-[#0A0A0A] border-[#53FC18] shadow-[0_0_30px_rgba(83,252,24,0.4)]";
                } else if (isTimerRunning) {
                    statusText = `WAIT ${confirmState.timeLeft}s`;
                    statusColor = "text-[#983695]";
                    borderClass = "bg-[#0A0A0A] border-[#983695]/40";
                 }

                 return (
                 <div 
                   onClick={(e) => task && !isClaimed && !isTimerRunning && handleTaskAction(e, task)}
                   className={`relative overflow-hidden border rounded-2xl transition-all group h-[300px] cursor-pointer ${borderClass}`}
                 >
                    {/* Background Icon */}
                    <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors transform rotate-12 scale-150">
                        <FaXTwitter size={200} />
                    </div>
                    
                    <div className="relative p-8 flex flex-col justify-between h-full">
                       <div className="flex justify-between items-start">
                           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white text-3xl border border-white/10 group-hover:scale-110 transition-transform">
                               <FaXTwitter />
                           </div>
                           {isNew && !isClaimed && !isReadyToConfirm && !isTimerRunning && (
                               <span className="flex items-center gap-1 text-[#983695] bg-[#983695]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#983695]/20 animate-pulse">
                                   <Bell size={12} /> NEW POST
                               </span>
                           )}
                       </div>
                       
                       <div>
                           <h4 className="text-white font-bold text-2xl mb-2 group-hover:text-[#983695] transition-colors">Twitter (X)</h4>
                           <p className="text-gray-400 text-sm max-w-[80%]">
                               <><span className="text-[#53FC18] font-bold">10 Points</span> - <span className="text-[#983695] font-bold">MANDATORY:</span> Comment your G-Code.</>
                           </p>
                       </div>

                       <div className={`flex items-center gap-2 text-sm font-bold ${statusColor} group-hover:gap-4 transition-all`}>
                           {statusText} <FaShareNodes />
                       </div>
                    </div>
                 </div>
                 );
             })()}

             {/* Instagram Widget */}
             {(() => {
                 const task = tasks.find(t => t.id === 9);
                 const isNew = feedStatus['instagram']?.isNew;
                 const isClaimed = claimedTasks.includes(task.id);
                 const confirmState = confirmationTasks[task.id];
                 const isTimerRunning = confirmState && confirmState.timeLeft > 0;
                 const isReadyToConfirm = confirmState && confirmState.readyToConfirm;
                 
                let statusText = isNew ? "OPEN & EARN" : "VIEW FEED";
                let statusColor = "text-white";
                let borderClass = isNew ? 'bg-gradient-to-br from-[#983695]/20 to-black border-[#983695]/50 shadow-[0_0_30px_rgba(152,54,149,0.4)]' : 'bg-[#0A0A0A] border-white/5 hover:border-white/20';
                 
                if (isClaimed) {
                    statusText = "COMPLETED";
                    statusColor = "text-[#53FC18]";
                    borderClass = "bg-[#0A0A0A] border-[#53FC18]/30 opacity-60";
                 } else if (isReadyToConfirm) {
                     statusText = "CLAIM REWARD";
                     statusColor = "text-[#53FC18] animate-pulse";
                     borderClass = "bg-[#0A0A0A] border-[#53FC18] shadow-[0_0_30px_rgba(83,252,24,0.4)]";
                } else if (isTimerRunning) {
                    statusText = `WAIT ${confirmState.timeLeft}s`;
                    statusColor = "text-[#983695]";
                    borderClass = "bg-[#0A0A0A] border-[#983695]/40";
                 }

                 return (
                 <div 
                   onClick={(e) => task && !isClaimed && !isTimerRunning && handleTaskAction(e, task)}
                   className={`relative overflow-hidden border rounded-2xl transition-all group h-[300px] cursor-pointer ${borderClass}`}
                 >
                    <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors transform rotate-12 scale-150">
                        <FaInstagram size={200} />
                    </div>
                    <div className="relative p-8 flex flex-col justify-between h-full">
                       <div className="flex justify-between items-start">
                           <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#53FC18] via-[#983695] to-[#53FC18] flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                               <FaInstagram />
                           </div>
                           {isNew && !isClaimed && !isReadyToConfirm && !isTimerRunning && (
                               <span className="flex items-center gap-1 text-[#983695] bg-[#983695]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#983695]/20 animate-pulse">
                                   <Bell size={12} /> NEW REEL
                               </span>
                           )}
                       </div>
                       <div>
                           <h4 className="text-white font-bold text-2xl mb-2 group-hover:text-[#983695] transition-colors">Instagram</h4>
                           <p className="text-gray-400 text-sm max-w-[80%]">
                               <><span className="text-[#53FC18] font-bold">10 Points</span> - <span className="text-[#983695] font-bold">MANDATORY:</span> Comment your G-Code.</>
                           </p>
                       </div>
                       <div className={`flex items-center gap-2 text-sm font-bold ${statusColor} group-hover:gap-4 transition-all`}>
                           {statusText} <FaShareNodes />
                       </div>
                    </div>
                 </div>
                 );
             })()}

             {/* TikTok Widget */}
             {(() => {
                 const task = tasks.find(t => t.id === 8);
                 const isNew = feedStatus['tiktok']?.isNew;
                 const isClaimed = claimedTasks.includes(task.id);
                 const confirmState = confirmationTasks[task.id];
                 const isTimerRunning = confirmState && confirmState.timeLeft > 0;
                 const isReadyToConfirm = confirmState && confirmState.readyToConfirm;
                 
                let statusText = isNew ? "OPEN & EARN" : "VIEW FEED";
                let statusColor = "text-white";
                let borderClass = isNew ? 'bg-gradient-to-br from-[#983695]/20 to-black border-[#983695]/50 shadow-[0_0_30px_rgba(152,54,149,0.4)]' : 'bg-[#0A0A0A] border-white/5 hover:border-white/20';
                 
                if (isClaimed) {
                    statusText = "COMPLETED";
                    statusColor = "text-[#53FC18]";
                    borderClass = "bg-[#0A0A0A] border-[#53FC18]/30 opacity-60";
                 } else if (isReadyToConfirm) {
                     statusText = "CLAIM REWARD";
                     statusColor = "text-[#53FC18] animate-pulse";
                     borderClass = "bg-[#0A0A0A] border-[#53FC18] shadow-[0_0_30px_rgba(83,252,24,0.4)]";
                } else if (isTimerRunning) {
                    statusText = `WAIT ${confirmState.timeLeft}s`;
                    statusColor = "text-[#983695]";
                    borderClass = "bg-[#0A0A0A] border-[#983695]/40";
                 }

                 return (
                 <div 
                   onClick={(e) => task && !isClaimed && !isTimerRunning && handleTaskAction(e, task)}
                   className={`relative overflow-hidden border rounded-2xl transition-all group h-[300px] cursor-pointer ${borderClass}`}
                 >
                    <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors transform rotate-12 scale-150">
                        <FaTiktok size={200} />
                    </div>
                    <div className="relative p-8 flex flex-col justify-between h-full">
                       <div className="flex justify-between items-start">
                           <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                               <FaTiktok />
                           </div>
                           {isNew && !isClaimed && !isReadyToConfirm && !isTimerRunning && (
                               <span className="flex items-center gap-1 text-[#983695] bg-[#983695]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#983695]/20 animate-pulse">
                                   <Bell size={12} /> NEW VIDEO
                               </span>
                           )}
                       </div>
                       <div>
                           <h4 className="text-white font-bold text-2xl mb-2 group-hover:text-[#983695] transition-colors">TikTok</h4>
                           <p className="text-gray-400 text-sm max-w-[80%]">
                               <><span className="text-[#53FC18] font-bold">10 Points</span> - <span className="text-[#983695] font-bold">MANDATORY:</span> Comment your G-Code.</>
                           </p>
                       </div>
                       <div className={`flex items-center gap-2 text-sm font-bold ${statusColor} group-hover:gap-4 transition-all`}>
                           {statusText} <FaShareNodes />
                       </div>
                    </div>
                 </div>
                 );
             })()}

             {/* Threads Widget */}
             {(() => {
                 const task = tasks.find(t => t.id === 19);
                 const isNew = feedStatus['threads']?.isNew;
                 const isClaimed = claimedTasks.includes(task.id);
                 const confirmState = confirmationTasks[task.id];
                 const isTimerRunning = confirmState && confirmState.timeLeft > 0;
                 const isReadyToConfirm = confirmState && confirmState.readyToConfirm;
                 
                let statusText = isNew ? "OPEN & EARN" : "VIEW FEED";
                let statusColor = "text-white";
                let borderClass = isNew ? 'bg-gradient-to-br from-[#983695]/20 to-black border-[#983695]/50 shadow-[0_0_30px_rgba(152,54,149,0.4)]' : 'bg-[#0A0A0A] border-white/5 hover:border-white/20';
                 
                if (isClaimed) {
                    statusText = "COMPLETED";
                    statusColor = "text-[#53FC18]";
                    borderClass = "bg-[#0A0A0A] border-[#53FC18]/30 opacity-60";
                 } else if (isReadyToConfirm) {
                     statusText = "CLAIM REWARD";
                     statusColor = "text-[#53FC18] animate-pulse";
                     borderClass = "bg-[#0A0A0A] border-[#53FC18] shadow-[0_0_30px_rgba(83,252,24,0.4)]";
                } else if (isTimerRunning) {
                    statusText = `WAIT ${confirmState.timeLeft}s`;
                    statusColor = "text-[#983695]";
                    borderClass = "bg-[#0A0A0A] border-[#983695]/40";
                 }

                 return (
                 <div 
                   onClick={(e) => task && !isClaimed && !isTimerRunning && handleTaskAction(e, task)}
                   className={`relative overflow-hidden border rounded-2xl transition-all group h-[300px] cursor-pointer ${borderClass}`}
                 >
                    <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors transform rotate-12 scale-150">
                        <FaThreads size={200} />
                    </div>
                    <div className="relative p-8 flex flex-col justify-between h-full">
                       <div className="flex justify-between items-start">
                           <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                               <FaThreads />
                           </div>
                           {isNew && !isClaimed && !isReadyToConfirm && !isTimerRunning && (
                               <span className="flex items-center gap-1 text-[#983695] bg-[#983695]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#983695]/20 animate-pulse">
                                   <Bell size={12} /> NEW THREAD
                               </span>
                           )}
                       </div>
                       <div>
                           <h4 className="text-white font-bold text-2xl mb-2 group-hover:text-[#983695] transition-colors">Threads</h4>
                           <p className="text-gray-400 text-sm max-w-[80%]">
                               <><span className="text-[#53FC18] font-bold">10 Points</span> - <span className="text-[#983695] font-bold">MANDATORY:</span> Comment your G-Code.</>
                           </p>
                       </div>
                       <div className={`flex items-center gap-2 text-sm font-bold ${statusColor} group-hover:gap-4 transition-all`}>
                           {statusText} <FaShareNodes />
                       </div>
                    </div>
                 </div>
                 );
             })()}
          </div>
          </>
        )}

        {/* Task Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'mining' && (
            <div className="md:col-span-2 lg:col-span-3 mb-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Mining Boost NFTs</h3>
                  <p className="text-xs text-gray-400 mt-1">اختر مستوى المضاعف لزيادة قوة التعدين الخاصة بك.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {miningNftTiers.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setSelectedMiningTier(tier);
                      setShowMiningNftModal(true);
                    }}
                    className="relative flex flex-col items-center justify-between p-4 rounded-xl border border-[#53FC18]/30 bg-black/60 hover:bg-black/80 hover:border-[#53FC18] transition-all shadow-[0_0_20px_rgba(83,252,24,0.1)]"
                  >
                    <div className="mb-4">
                      <ProjectNFTIcon
                        color={
                          tier.id === 1 || tier.id === 2
                            ? '#983695'
                            : '#53FC18'
                        }
                        tier={`${tier.id}x`}
                        imageSrc={NFT_IMAGE_MINING}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white mb-1">{tier.label}</div>
                      <div className="text-xs text-[#53FC18] font-semibold">x{tier.multiplier} Mining Power</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {tasks.filter(t => (t.type === activeTab || (activeTab === 'social' && t.type === 'social') || (activeTab === 'NFTs' && t.type === 'nft')) && ![8, 9, 10, 19].includes(t.id)).map((task, index, array) => {
            const isClaimed = claimedTasks.includes(task.id);
            const isVerifying = verifyingTasks.includes(task.id);
            const isProcessing = processingTasks[task.id] !== undefined;
            const timeLeft = isProcessing ? processingTasks[task.id].timeLeft : 0;
            
            // Sequential Lock Logic (Skip for NFT tasks)
            const previousTask = index > 0 ? array[index - 1] : null;
            // const isLocked = task.type !== 'nft' && previousTask && !claimedTasks.includes(previousTask.id);
            const isLocked = false; // RESTRICTION REMOVED FOR TESTING
            
            const status = isClaimed ? 'completed' : (isLocked ? 'locked' : task.status);

            // New Post Logic
            let platformKey = task.platform.toLowerCase();
            if (platformKey.includes('twitter')) platformKey = 'twitter';
            const isNewContent = feedStatus[platformKey]?.isNew;
            const confirmState = confirmationTasks[task.id];
            const isTimerRunning = confirmState && confirmState.timeLeft > 0;
            const isReadyToConfirm = confirmState && confirmState.readyToConfirm;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={!isLocked && status !== 'disabled' ? { y: -5 } : {}}
                className={`glass-panel p-6 group ${
                  !isLocked && status !== 'disabled' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                } ${
                  task.type === 'mining' && task.isLive 
                    ? 'border-[#53FC18] shadow-[0_0_20px_rgba(83,252,24,0.2)] bg-[#53FC18]/5' 
                    : ''
                }`}
                onClick={(e) => {
                   if (status === 'disabled' || isClaimed || isLocked || isProcessing) return;
                   // If already verifying (claimed ready), do nothing on card click, wait for button
                   if (isVerifying || isTimerRunning || isReadyToConfirm) return; 
                   
                   handleTaskAction(e, task);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg transition-colors ${isLocked ? 'bg-white/5 text-gray-500' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    {isLocked ? <Lock size={24} /> : task.icon}
                  </div>
                  {isNewContent ? (
                     <span className="flex items-center gap-1 text-[#53FC18] bg-[#53FC18]/10 px-3 py-1 rounded-full text-xs font-medium border border-[#53FC18]/20 animate-pulse">
                       <Bell size={12} /> New Post
                     </span>
                  ) : status === 'new_content' ? (
                    <span className="flex items-center gap-1 text-[#983695] bg-[#983695]/10 px-3 py-1 rounded-full text-xs font-medium border border-[#983695]/20 animate-pulse">
                      {task.contentType === 'Reel' && <Video size={12} />}
                      {task.contentType === 'Post' && <ImageIcon size={12} />}
                      {task.contentType === 'Video' && <PlayCircle size={12} />}
                      New {task.contentType}
                    </span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'completed' 
                        ? 'bg-[#53FC18]/20 text-[#53FC18]' 
                        : status === 'disabled'
                        ? 'bg-[#983695]/20 text-[#983695]'
                        : status === 'locked'
                        ? 'bg-gray-500/20 text-gray-500'
                        : isProcessing
                        ? 'bg-[#983695]/20 text-[#983695]'
                        : task.type === 'mining'
                        ? 'bg-[#53FC18]/20 text-[#53FC18]'
                        : 'bg-[#53FC18]/20 text-[#53FC18]'
                    }`}>
                      {status === 'disabled' ? 'OFFLINE' : status === 'locked' ? 'LOCKED' : isProcessing ? `VERIFYING ${timeLeft}s` : task.type === 'mining' ? 'ONLINE' : status}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl md:text-2xl font-extrabold mb-3 text-white">{task.action}</h3>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-300 text-sm md:text-base">Platform: {task.platform}</p>
                </div>

                {task.instruction && (
                  <div className={`mb-4 p-3 rounded-lg text-xs md:text-sm font-bold border ${task.instruction.includes('MANDATORY') ? 'bg-[#983695]/15 border-[#983695] text-[#f3d9ff]' : 'bg-[#53FC18]/10 border-[#53FC18]/40 text-[#e8ffe9]'}`}>
                    {task.instruction}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className={`flex items-center gap-2 ${isLocked ? 'text-gray-500' : 'text-[#53FC18]'}`}>
                    <Coins size={16} />
                    <span className="font-bold">{task.reward}</span>
                  </div>
                  <button 
                    type="button"
                    disabled={status === 'disabled' || status === 'completed' || isLocked || isProcessing || isTimerRunning || (task.platform === 'Kick' && task.type === 'mining' && !miningUnlocked)}
                    onClick={(e) => handleTaskAction(e, task)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            status === 'completed' || status === 'disabled' || isLocked || isProcessing
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : isVerifying || isReadyToConfirm
              ? 'bg-[#53FC18] text-black hover:bg-[#45d612] animate-pulse'
              : isTimerRunning
              ? 'bg-[#983695]/20 text-[#983695] cursor-wait'
              : 'bg-[#53FC18] text-black hover:bg-[#45d612]'
          }`}>
            {status === 'completed' 
                ? 'Claimed' 
                : status === 'disabled' 
                ? 'Offline' 
                : status === 'locked' 
                ? 'Locked' 
                : isProcessing 
                ? `Wait ${timeLeft}s...` 
                : isTimerRunning
                ? `Wait ${confirmState.timeLeft}s...`
                : isReadyToConfirm
                ? 'Claim ' + task.reward
                : isVerifying 
                ? 'Claim ' + task.reward 
                : task.action}
          </button>
                </div>
              </motion.div>
            );
          })}
          
          {/* Coming Soon Card */}
          <div className="glass-panel p-6 border border-dashed border-white/20 flex flex-col items-center justify-center text-center opacity-50">
            <Clock size={32} className="mb-4 text-gray-500" />
            <h3 className="text-lg font-bold mb-2">More Tasks Loading</h3>
            <p className="text-gray-500 text-sm">New opportunities available in 23:45:12</p>
          </div>
        </div>
        {showMiningNftModal && selectedMiningTier && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#020617] border border-[#53FC18]/40 rounded-2xl max-w-lg w-full mx-4 p-6 shadow-[0_0_40px_rgba(83,252,24,0.3)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">مضاعف التعدين: {selectedMiningTier.label}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMiningNftModal(false);
                    setSelectedMiningTier(null);
                  }}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  إغلاق
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <ProjectNFTIcon
                  color={
                    selectedMiningTier.id === 1 || selectedMiningTier.id === 2
                      ? '#983695'
                      : '#53FC18'
                  }
                  tier={`${selectedMiningTier.id}x`}
                  imageSrc={NFT_IMAGE_MINING}
                />
                <div>
                  <p className="text-sm text-gray-300">
                    هذا الـ NFT يعطيك Boost خاص في نظام التعدين. كل مستوى يضيف مضاعف على نقاطك
                    في جلسات المشاهدة والتفاعل مع قناة Kick الرسمية.
                  </p>
                  <p className="text-sm text-[#53FC18] font-semibold mt-2">
                    مستوى {selectedMiningTier.id} يمنحك مضاعف تعدين بقيمة {selectedMiningTier.multiplier}x
                    على نقاطك الأساسية في الساعة.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  className="w-full flex flex-col items-start gap-2 px-4 py-3 rounded-xl border border-[#53FC18]/40 bg-[#041017] hover:bg-[#061b22] transition-all"
                >
                  <span className="text-sm font-bold text-white">شراء العملة كمستثمر</span>
                  <span className="text-xs text-gray-300">
                    امتلك توكن المشروع كمستثمر لتحصل على امتيازات خاصة، أولوية في المميزات الجديدة،
                    وزيادة في العوائد على المدى البعيد حسب أداء المنظومة.
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full flex flex-col items-start gap-2 px-4 py-3 rounded-xl border border-[#53FC18]/40 bg-[#020b06] hover:bg-[#041107] transition-all"
                >
                  <span className="text-sm font-bold text-white">اشتراك أو Gift Sub على Kick</span>
                  <span className="text-xs text-gray-300">
                    فعّل المستوى عن طريق Sub أو Gift Sub في قناة Kick. هذا الأسلوب مناسب إذا كنت
                    تفضل دعم البث مباشرة مع الحصول على نفس مضاعف النقاط داخل نظام التعدين.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Earn;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Coins, Lock, Crown, Percent, Zap, Shield, ShieldCheck, Gem, Bell, PlayCircle, Video, Image as ImageIcon, Plus, Wallet, Ghost } from 'lucide-react';
import fp from '@fingerprintjs/fingerprintjs';

const Earn = () => {
  const [activeTab, setActiveTab] = useState('social');
  const [isKickLive, setIsKickLive] = useState(false); // State for stream status
  const [timeLeft, setTimeLeft] = useState('');
  const [visitorId, setVisitorId] = useState(null);
  const [kickUsername, setKickUsername] = useState(() => localStorage.getItem('kickUsername') || '');
  const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem('walletAddress') || '');
  const [isProfileSaved, setIsProfileSaved] = useState(() => localStorage.getItem('isProfileSaved') === 'true');
  const [gCode, setGCode] = useState(() => localStorage.getItem('gCode') || '');
  const [points, setPoints] = useState(0); // User's Total Points
  const [showKickModal, setShowKickModal] = useState(false);
  const [tempKickUsername, setTempKickUsername] = useState('');
  
  const [showCopyCodeModal, setShowCopyCodeModal] = useState(false);
  const [currentTaskForModal, setCurrentTaskForModal] = useState(null);

  const [claimedTasks, setClaimedTasks] = useState(() => {
    const saved = localStorage.getItem('claimedTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [verifyingTasks, setVerifyingTasks] = useState([]); // Tasks ready to claim
  const [processingTasks, setProcessingTasks] = useState({}); // Tasks in 10s countdown: { id: { timeLeft: 10 } }
  const [feedStatus, setFeedStatus] = useState({}); // RSS Feed Status
  const [confirmationTasks, setConfirmationTasks] = useState({}); // { taskId: { timeLeft: 60, readyToConfirm: false } }

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
            const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
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

  // Initialize FingerprintJS
  useEffect(() => {
    const loadFp = async () => {
      try {
        const fpPromise = fp.load();
        const { visitorId } = await (await fpPromise).get();
        setVisitorId(visitorId);
        console.log('FingerprintJS Visitor ID:', visitorId);
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
          const response = await fetch('http://localhost:3001/api/init-user', {
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
    // User is starting task - Start 60s Timer
    window.open(task.link, '_blank');
    
    // Track click in backend
    try {
      fetch('http://localhost:3001/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, wallet_address: walletAddress, task_url: task.link })
      });
    } catch (e) { console.error(e); }

    setProcessingTasks(prev => ({
      ...prev,
      [task.id]: { timeLeft: 60 }
    }));
  };

  const proceedWithTask = async (task) => {
    // Check New Post Flow
    let platformKey = task.platform.toLowerCase();
    if (platformKey.includes('twitter')) platformKey = 'twitter';
    const isNewPost = feedStatus[platformKey]?.isNew;

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
            window.open(task.link, '_blank');
            setConfirmationTasks(prev => ({ ...prev, [task.id]: { timeLeft: 60, readyToConfirm: false } }));
             try {
                fetch('http://localhost:3001/api/track-click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visitor_id: visitorId, wallet_address: walletAddress, task_url: task.link })
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
     if (gCode) {
         navigator.clipboard.writeText(gCode);
         setShowCopyCodeModal(false);
         if (currentTaskForModal) {
             proceedWithTask(currentTaskForModal);
             setCurrentTaskForModal(null);
         }
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
        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
        const response = await fetch(`${API_BASE}/api/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            task_id: task.id,
            reward: task.reward,
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

  const handleTaskAction = async (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (task.status === 'disabled' || claimedTasks.includes(task.id)) return;

    // 1. Kick Task Dependency: Must have locked profile
    if (task.platform === 'Kick') {
        if (!isProfileLocked) {
            alert('⚠️ You must link and save your Kick Username before starting this task!');
            return;
        }
    }

    // 2. G-Code Requirement
    // Mandatory only for Watch Tasks
    const isMandatory = task.type === 'watch';

    // Check if we need to show the modal (only if not already in confirmation/verifying state)
    let platformKey = task.platform.toLowerCase();
    if (platformKey.includes('twitter')) platformKey = 'twitter';
    const isTimerRunning = confirmationTasks[task.id];
    
    if (isMandatory && !isTimerRunning && !verifyingTasks.includes(task.id)) {
         if (!gCode) {
             alert('Complete Social Tasks first to generate your G-Code!');
             return;
         }
         setCurrentTaskForModal(task);
         setShowCopyCodeModal(true);
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

  // Simulate stream status check (Replace with real API call)
  React.useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/feed-status');
        // const data = await response.json();
        // setIsKickLive(data.livestream !== null);
        
        // For demo purposes, we'll keep it offline or toggle it
        // setIsKickLive(true); // Uncomment to test Online mode
      } catch (error) {
        console.error('Error checking stream status:', error);
      }
    };
    
    checkStreamStatus();
    // Poll every 5 minutes
    const interval = setInterval(checkStreamStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const tasks = [
    { 
      id: 1, 
      type: 'social', 
      platform: 'Twitter (X)', 
      action: 'Follow on Twitter', 
      instruction: '🔴 MANDATORY: Comment your G-Code',
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://x.com/tv_ghostgaming',
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
      action: 'Join on Telegram', 
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://t.me/ghost_gamingtv',
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
      action: 'Follow on Instagram', 
      instruction: '🔴 MANDATORY: Comment your G-Code',
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://www.instagram.com/ghost.gamingtv/',
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
      action: 'Follow on TikTok', 
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://www.tiktok.com/@ghost.gamingtv',
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
      action: 'Follow on Kick', 
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://kick.com/ghost_gamingtv',
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
      action: 'Join on Discord', 
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://discord.gg/wMVJTrppXh',
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
      action: 'Follow on Threads', 
      reward: '10 Points', 
      status: 'pending', 
      link: 'https://www.threads.net/@ghost.gamingtv',
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
      action: 'Like & Share', 
      instruction: 'Optional: Comment G-Code (Required for 2-Platform Task)',
      reward: '100 Points', 
      status: 'new_content',
      contentType: 'Reel', 
      link: 'https://www.tiktok.com/@ghost.gamingtv',
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
      action: 'Like & Share', 
      instruction: '🔴 MANDATORY: Comment your G-Code',
      reward: '100 Points', 
      status: 'new_content',
      contentType: 'Reel', 
      link: 'https://www.instagram.com/ghost.gamingtv/',
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
      action: 'Like & Share', 
      instruction: '🔴 MANDATORY: Comment your G-Code',
      reward: '50 Points', 
      status: 'new_content',
      contentType: 'Post', 
      link: 'https://x.com/tv_ghostgaming',
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
      action: 'Like & Share', 
      instruction: 'Optional: Comment G-Code (Required for 2-Platform Task)',
      reward: '50 Points', 
      status: 'new_content',
      contentType: 'Post', 
      link: 'https://www.threads.net/@ghost.gamingtv',
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
      action: isKickLive ? 'Live Now' : 'Offline', 
      reward: '250 Points/Hour', 
      status: isKickLive ? 'pending' : 'disabled', 
      link: 'https://kick.com/ghost_gamingtv',
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
      link: 'https://kick.com/ghost_gamingtv',
      icon: <Gem size={24} className="text-purple-500" />
    },
    { 
      id: 15, 
      type: 'nft', 
      platform: 'Kick', 
      action: '2x Subs or Gift Subs', 
      reward: 'Tax: 3%', 
      status: 'pending', 
      link: 'https://kick.com/ghost_gamingtv',
      icon: <Percent size={24} className="text-blue-400" />
    },
    { 
      id: 16, 
      type: 'nft', 
      platform: 'Kick', 
      action: '3x Subs or Gift Subs', 
      reward: 'Tax: 2%', 
      status: 'pending', 
      link: 'https://kick.com/ghost_gamingtv',
      icon: <Shield size={24} className="text-green-400" />
    },
    { 
      id: 17, 
      type: 'nft', 
      platform: 'Kick', 
      action: '4x Subs or Gift Subs', 
      reward: 'Tax: 1%', 
      status: 'pending', 
      link: 'https://kick.com/ghost_gamingtv',
      icon: <Zap size={24} className="text-yellow-400" />
    },
    { 
      id: 18, 
      type: 'nft', 
      platform: 'Kick', 
      action: '5x Subs or Gift Subs', 
      reward: 'Tax: 0%', 
      status: 'pending', 
      link: 'https://kick.com/ghost_gamingtv',
      icon: <Crown size={24} className="text-[#53FC18]" />
    },
  ];

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
          await fetch('http://localhost:3001/api/update-profile', {
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

  const handleKickConnect = () => {
    setShowKickModal(true);
  };
  
  const submitKickLogin = () => {
     if (tempKickUsername.trim()) {
         // Simulate "Searching..." then "Found"
         const btn = document.getElementById('kick-login-btn');
         if(btn) btn.innerText = 'Connecting...';
         
         setTimeout(() => {
             setKickUsername(tempKickUsername);
             setShowKickModal(false);
             setTempKickUsername('');
         }, 1500);
     }
  };

  // Lock Profile Check
  const isProfileLocked = kickUsername && walletAddress && isProfileSaved;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-24">
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
                 <p className="text-[#53FC18] font-mono font-bold text-lg">{gCode}</p>
              </div>
              <p className="text-xs text-gray-400 mb-1">
                 Copy this code and paste it in the comments.
              </p>
              <p className="text-xs text-[#53FC18]" dir="rtl">
                 انسخ هذا الكود وضعه في التعليقات
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAndStart}
              className="w-full bg-[#53FC18] hover:bg-[#45d612] text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)] flex items-center justify-center gap-2"
            >
              <span>Copy & Open Link</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Kick Login Modal */}
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
                 <p className="text-[#53FC18] font-mono font-bold text-lg">{gCode}</p>
              </div>
              <p className="text-xs text-gray-400 mb-1">
                 Copy this code and paste it in the comments.
              </p>
              <p className="text-xs text-[#53FC18]" dir="rtl">
                 انسخ هذا الكود وضعه في التعليقات
              </p>
            </div>

            <button
              onClick={handleCopyAndStart}
              className="w-full bg-[#53FC18] hover:bg-[#45d612] text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)] flex items-center justify-center gap-2"
            >
              <span>Copy & Open Link</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Kick Login Modal */}
      {showKickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-[#53FC18]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_0_30px_rgba(83,252,24,0.1)]">
            <button 
              type="button"
              onClick={() => setShowKickModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#53FC18]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#53FC18]/20">
                 <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#53FC18]"><path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Connect Kick Account</h3>
              <p className="text-gray-400 text-sm mt-2">Enter your username to verify identity</p>
            </div>
            
            <div className="space-y-4">
              <div>
                 <input 
                   type="text" 
                   value={tempKickUsername}
                   onChange={(e) => setTempKickUsername(e.target.value)}
                   placeholder="Kick Username"
                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-[#53FC18] outline-none text-white text-center font-bold"
                 />
              </div>
              <button
                type="button"
                id="kick-login-btn"
                onClick={submitKickLogin}
                className="w-full bg-[#53FC18] hover:bg-[#45d612] text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)]"
              >
                Connect Account
              </button>
            </div>
          </div>
        </div>
      )}



      <div className="max-w-7xl mx-auto">
        
        {/* Profile & G-Code Section */}
        <div className="mb-8 grid md:grid-cols-2 gap-6">
          {/* Identity Card */}
          <div className="glass-panel p-6 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#53FC18]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-[#53FC18]" />
              User Identity
            </h2>
            
            {!gCode ? (
              !isProfileSaved ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kick Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={kickUsername}
                      readOnly
                      placeholder="Link Kick Account"
                      className={`w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-[#53FC18] outline-none text-white pr-24 ${isProfileLocked ? 'cursor-not-allowed opacity-70 text-gray-400' : ''}`}
                    />
                    {!kickUsername && !isProfileLocked && (
                       <button
                         type="button"
                         onClick={handleKickConnect}
                         className="absolute right-1 top-1 bottom-1 bg-[#53FC18] text-black text-xs font-bold px-3 rounded hover:bg-[#45d612] transition-colors flex items-center gap-1"
                       >
                         Link Kick
                       </button>
                    )}
                    {isProfileLocked && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Lock size={14} className="text-gray-500" />
                        </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Wallet Address (Polygon)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={walletAddress}
                      readOnly
                      placeholder="Connect Wallet to detect"
                      className={`w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-[#53FC18] outline-none text-white font-mono text-sm pr-20 ${isProfileLocked ? 'cursor-not-allowed opacity-70 text-gray-400' : ''}`}
                    />
                    {!walletAddress && !isProfileLocked && (
                      <button 
                        onClick={handleDirectConnect}
                        className="absolute right-1 top-1 bottom-1 bg-[#53FC18] text-black text-xs font-bold px-3 rounded hover:bg-[#45d612] transition-colors"
                      >
                        Connect
                      </button>
                    )}
                    {isProfileLocked && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Lock size={14} className="text-gray-500" />
                        </div>
                    )}
                  </div>
                </div>
                {!isProfileLocked && (
                  <button 
                    onClick={handleProfileSave}
                    className="w-full bg-white/10 hover:bg-[#53FC18] hover:text-black border border-white/10 text-white font-bold py-2 rounded-lg transition-all"
                  >
                    Claim Code
                  </button>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Required for G-Code generation & Leaderboard
                </p>
              </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#53FC18]/10 border border-[#53FC18]/30 rounded-xl text-center">
                    <p className="text-sm text-[#53FC18] mb-1">Identity Connected</p>
                    <p className="text-white font-bold">{kickUsername}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">{walletAddress.substr(0, 6)}...{walletAddress.substr(-4)}</p>
                    <button 
                      onClick={() => setIsProfileSaved(false)}
                      className="mt-3 text-[10px] text-gray-400 hover:text-white underline"
                    >
                      Edit Identity
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">G-Code Status</span>
                          <span className="text-yellow-500">Pending Tasks</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                        <div 
                           className="bg-yellow-500 h-full transition-all duration-500"
                           style={{ width: `${(claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length / tasks.filter(t => t.type === 'social').length) * 100}%` }}
                        />
                      </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#53FC18]/10 border border-[#53FC18]/30 rounded-xl text-center">
                  <p className="text-sm text-[#53FC18] mb-1">Identity Verified</p>
                  <p className="text-white font-bold">{kickUsername}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{walletAddress.substr(0, 6)}...{walletAddress.substr(-4)}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Status</span>
                        <span className="text-[#53FC18]">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Social Tasks</span>
                        <span className="text-[#53FC18]">Completed</span>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* G-Code Status */}
          <div className="glass-panel p-6 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {gCode ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-[#53FC18]/20 flex items-center justify-center mx-auto mb-4 border border-[#53FC18] shadow-[0_0_30px_rgba(83,252,24,0.3)]">
                  <Crown size={32} className="text-[#53FC18]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Unique G-Code</h2>
                <div className="bg-black/50 border border-[#53FC18] rounded-xl px-8 py-4 mb-2">
                  <span className="text-3xl font-mono font-bold text-[#53FC18] tracking-wider">{gCode}</span>
                </div>
                <p className="text-xs text-gray-400 mb-6">Permanent ID • Non-Renewable</p>

                {/* Referral Section */}
                <div className="w-full mt-4 pt-4 border-t border-white/10">
                   <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-2">
                     <Crown size={16} className="text-[#53FC18]" />
                     Referral Program
                   </h3>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate">
                        {`${window.location.origin}/?ref=${gCode}`}
                      </div>
                      <button 
                        onClick={copyReferralLink}
                        className="bg-[#53FC18]/10 hover:bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        Copy
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-500 mt-2">
                     Earn 10% of your friends' points forever
                   </p>
                </div>
              </div>
            ) : (
              <div className="opacity-50">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Lock size={32} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-300 mb-2">G-Code Locked</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
                  Complete all Social Tasks and verify your identity to reveal your unique G-Code.
                </p>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#53FC18] h-full transition-all duration-500"
                    style={{ width: `${(claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length / tasks.filter(t => t.type === 'social').length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {claimedTasks.filter(id => tasks.find(t => t.id === id && t.type === 'social')).length} / {tasks.filter(t => t.type === 'social').length} Tasks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Earn Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Start Earning</h1>
            <p className="text-gray-400">Complete tasks to earn AKGS tokens. Your time is your asset.</p>
            {activeTab === 'NFTs' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-1 bg-gradient-to-r from-[#53FC18]/20 via-transparent to-[#53FC18]/20 rounded-2xl"
              >
                <div className="bg-[#0a0a0a] rounded-xl p-6 border border-[#53FC18]/20 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#53FC18]/5 rounded-full blur-3xl -z-10"></div>
                  
                  <h3 className="text-[#53FC18] font-bold text-lg flex items-center gap-2 mb-4">
                    <Shield size={20} /> Token Tax & Staking Policy
                  </h3>
                  
                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-8 relative z-10">
                    {/* English Section */}
                    <div className="space-y-4">
                      <p className="text-sm text-gray-300 leading-relaxed font-light">
                        The standard tax is maintained at <span className="text-[#53FC18] font-bold">15%</span> to encourage long-term holding and staking rewards. However, on special days, the tax will be reduced!
                      </p>
                      <div className="pt-2">
                        <span className="text-white font-bold text-sm flex items-center gap-2 mb-2">
                          <Gem size={14} className="text-purple-400" /> 
                          Loyalty Rewards Program
                        </span>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Exclusive, high-utility NFTs will be airdropped as prestige gifts to our most dedicated members, directly rewarding engagement depth and staking duration.
                        </p>
                      </div>
                    </div>

                    {/* Arabic Section */}
                    <div className="space-y-4 text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8" dir="rtl">
                      <p className="text-sm text-gray-300 leading-relaxed font-arabic">
                        يتم الحفاظ على الضريبة القياسية عند <span className="text-[#53FC18] font-bold">15%</span> لتعزيز الاستثمار طويل الأجل وزيادة عوائد التخزين لمجتمعنا. ومع ذلك، في أيام خاصة، سيتم تخفيض الضريبة!
                      </p>
                      <div className="pt-2">
                        <span className="text-white font-bold text-sm flex items-center gap-2 mb-2 justify-end">
                          برنامج مكافآت الولاء 
                          <Gem size={14} className="text-purple-400" />
                        </span>
                        <p className="text-xs text-gray-400 leading-relaxed font-arabic">
                          سيتم توزيع NFTs حصرية وعالية القيمة كهدايا تقديرية لأعضاء مجتمعنا الأكثر ولاءً، مكافأةً لهم على عمق تفاعلهم ومدة تخزينهم للعملة.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div className="glass-panel px-6 py-3 flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase mb-1">All Points Balance</div>
              <div className="text-xl font-bold text-[#53FC18]">{points.toLocaleString()} Points</div>
              <div className="text-[10px] text-gray-500 font-mono mt-1">
                Resets in: <span className="text-[#53FC18]">{timeLeft}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#53FC18]/20 flex items-center justify-center text-[#53FC18]">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['social', 'watch', 'NFTs', 'mining'].map((tab) => {
            const isFirstTaskComplete = claimedTasks.includes(1);
            // Unlock Social (always) and NFT (as requested), others require Task 1
            // const isLocked = tab !== 'social' && tab !== 'NFTs' && !isFirstTaskComplete;
            const isLocked = false; // RESTRICTION REMOVED FOR TESTING

            return (
              <button
                type="button"
                key={tab}
                onClick={() => !isLocked && setActiveTab(tab)}
                disabled={isLocked}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 capitalize whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-[#53FC18] text-black shadow-[0_0_15px_rgba(83,252,24,0.3)]' 
                    : isLocked
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isLocked && <Lock size={14} />}
                {tab} Tasks
              </button>
            );
          })}
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

        {/* Task Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.filter(t => t.type === activeTab || (activeTab === 'social' && t.type === 'social') || (activeTab === 'NFTs' && t.type === 'nft')).map((task, index, array) => {
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
                className={`glass-panel p-6 group ${!isLocked && status !== 'disabled' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
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
                    <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-xs font-medium border border-blue-400/20 animate-pulse">
                      {task.contentType === 'Reel' && <Video size={12} />}
                      {task.contentType === 'Post' && <ImageIcon size={12} />}
                      {task.contentType === 'Video' && <PlayCircle size={12} />}
                      New {task.contentType}
                    </span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'completed' 
                        ? 'bg-green-500/20 text-green-500' 
                        : status === 'disabled'
                        ? 'bg-red-500/20 text-red-500'
                        : status === 'locked'
                        ? 'bg-gray-500/20 text-gray-500'
                        : isProcessing
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : task.type === 'mining'
                        ? 'bg-green-500/20 text-green-500' // Green for Online Mining
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {status === 'disabled' ? 'OFFLINE' : status === 'locked' ? 'LOCKED' : isProcessing ? `VERIFYING ${timeLeft}s` : task.type === 'mining' ? 'ONLINE' : status}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold mb-2">{task.action}</h3>
                <p className="text-gray-400 text-sm mb-6">Platform: {task.platform}</p>

                {task.instruction && (
                  <div className={`mb-4 p-2 rounded-lg text-xs font-bold border ${task.instruction.includes('MANDATORY') ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-yellow-500/10 border-yellow-500 text-yellow-500'}`}>
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
                    disabled={status === 'disabled' || status === 'completed' || isLocked || isProcessing || isTimerRunning}
                    onClick={(e) => handleTaskAction(e, task)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            status === 'completed' || status === 'disabled' || isLocked || isProcessing
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : isVerifying || isReadyToConfirm
              ? 'bg-[#53FC18] text-black hover:bg-[#45d612] animate-pulse'
              : isTimerRunning
              ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
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
                ? 'تأكيد المتابعة واللايك'
                : isVerifying 
                ? 'تأكيد المتابعة ✅' 
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
      </div>
    </div>
  );
};

export default Earn;

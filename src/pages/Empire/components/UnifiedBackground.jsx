import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ghost as GhostIcon } from 'lucide-react';
import MatrixBackground from './MatrixBackground';

// --- Code Particles Component ---
const CodeParticle = ({ x, delay, duration }) => {
  return (
    <motion.div
      className="absolute text-[#53FC18] font-mono text-opacity-30 pointer-events-none select-none"
      style={{ 
        left: `${x}%`,
        fontSize: Math.random() > 0.5 ? '12px' : '16px',
        textShadow: '0 0 4px rgba(83, 252, 24, 0.5)'
      }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ 
        y: "-10vh", 
        opacity: [0, 0.5, 0.5, 0] 
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {Math.random() > 0.5 ? '1' : '0'}
    </motion.div>
  );
};

// --- Isolated Ghost Component with Random Movement ---
const Ghost = ({ className = "", size = 64, showEyes = false, isOverload = false }) => {
  // Generate random path points
  const generateRandomPath = () => {
    // Generate 5-8 random points
    const points = [];
    const numPoints = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * 100 + "vw",
        y: Math.random() * 100 + "vh",
        scale: Math.random() * 0.4 + 0.8, // 0.8 to 1.2
        rotate: Math.random() * 30 - 15 // -15 to 15 degrees
      });
    }
    return points;
  };

  const pathPoints = useMemo(() => generateRandomPath(), []);

  // Determine colors based on isOverload state
  const bodyColors = isOverload 
    ? ["#FF0000", "#FF4500", "#FFFF00", "#FF0000"] // Red/Orange/Yellow for overload
    : ["#53FC18", "#FFFFFF", "#DFFF00", "#53FC18"]; // Standard Green/White

  // Desynchronize animations by adding random delays
  const randomDelay = useMemo(() => Math.random() * 5, []);

  return (
    <motion.div
      className={`fixed pointer-events-none z-10 ${className}`}
      initial={{ 
        x: Math.random() * 100 + "vw", 
        y: Math.random() * 100 + "vh",
        opacity: 0 
      }}
      animate={{
        x: pathPoints.map(p => p.x),
        y: pathPoints.map(p => p.y),
        rotate: pathPoints.map(p => p.rotate),
        scale: isOverload ? pathPoints.map(p => p.scale * 1.5) : pathPoints.map(p => p.scale), // Bigger scale on overload
        opacity: [0, 1, 1, 1, 1, 0] // Fade in/out at start/end of cycle
      }}
      transition={{
        duration: isOverload ? Math.random() * 5 + 5 : 40, // Slow constant speed normally (40s), fast on overload
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear",
        delay: randomDelay // Desync movement
      }}
    >
      <div className="relative">
        {/* Ghost Body - Cycling Colors */}
        <motion.div 
          style={{ opacity: 0.6, color: bodyColors[0] }} // Increased opacity from 0.2 to 0.6
          animate={{
            color: bodyColors,
            filter: isOverload 
                ? "drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))" 
                : "drop-shadow(0 0 5px rgba(83, 252, 24, 0.3))"
          }}
          transition={{
            duration: isOverload ? 0.5 : 8, // Much faster flash on overload
            repeat: Infinity,
            ease: "linear",
            delay: randomDelay // Desync colors
          }}
        >
             <GhostIcon size={size} strokeWidth={1.5} color="currentColor" />
        </motion.div>
        
        {/* Glowing Eyes */}
        {showEyes && (
          <motion.div
             animate={{
                 filter: isOverload
                   ? [
                       "drop-shadow(0 0 10px #FF0000) drop-shadow(0 0 20px #FF0000) drop-shadow(0 0 40px #FF0000)", 
                       "drop-shadow(0 0 10px #FF4500) drop-shadow(0 0 20px #FF4500) drop-shadow(0 0 40px #FF4500)", 
                       "drop-shadow(0 0 10px #FFFF00) drop-shadow(0 0 20px #FFFF00) drop-shadow(0 0 40px #FFFF00)" 
                     ]
                   : [
                       "drop-shadow(0 0 10px #53FC18) drop-shadow(0 0 20px #53FC18) drop-shadow(0 0 40px #53FC18)", 
                       "drop-shadow(0 0 10px #FFFFFF) drop-shadow(0 0 20px #FFFFFF) drop-shadow(0 0 40px #FFFFFF)", 
                       "drop-shadow(0 0 10px #DFFF00) drop-shadow(0 0 20px #DFFF00) drop-shadow(0 0 40px #DFFF00)" 
                     ]
             }}
             transition={{
                 duration: isOverload ? 0.5 : 8,
                 repeat: Infinity,
                 ease: "linear",
                 delay: randomDelay
             }}
          >
            <motion.div 
                className="absolute top-[35%] left-[25%] w-[25%] h-[25%] rounded-full"
                animate={{
                    backgroundColor: isOverload 
                      ? ["#FF0000", "#FF4500", "#FFFF00", "#FF0000"]
                      : ["#53FC18", "#FFFFFF", "#DFFF00", "#53FC18"]
                }}
                transition={{
                    duration: isOverload ? 0.5 : 8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: randomDelay
                }}
            />
            <motion.div 
                className="absolute top-[35%] right-[25%] w-[25%] h-[25%] rounded-full"
                animate={{
                    backgroundColor: isOverload 
                      ? ["#FF0000", "#FF4500", "#FFFF00", "#FF0000"]
                      : ["#53FC18", "#FFFFFF", "#DFFF00", "#53FC18"]
                }}
                transition={{
                    duration: isOverload ? 0.5 : 8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: randomDelay
                }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const UnifiedBackground = () => {
  // Always show eyes for Genesis as per prototype design
  const shouldShowEyes = true;
  const [ghostCount, setGhostCount] = useState(5); // Start with 5 ghosts

  // Handle click or keypress to increase ghosts
  const handleInteraction = (e) => {
    // Prevent typing from triggering
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Allow any key press (removed Space restriction)
    
    setGhostCount(prev => {
        if (prev >= 100) return 5; // Reset to 5 if reached 100
        return prev + 1;
    });
  };

  // Add event listener for global clicks and key presses
  useEffect(() => {
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Check if overload mode (reached 100)
  const isOverload = ghostCount === 100;

  // Generate ghosts array based on count
  const ghosts = useMemo(() => {
    return Array.from({ length: ghostCount }).map((_, i) => ({
      id: i,
      size: Math.random() * 40 + 40, 
    }));
  }, [ghostCount]);

  const particles = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 5
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        {/* Matrix Rain Background Layer */}
        <div className="absolute inset-0 z-0 opacity-40">
            <MatrixBackground />
        </div>

        {/* Cyber Grid - 3D Perspective Floor */}
        <div 
            className="absolute bottom-0 left-0 right-0 h-[40vh] z-0"
            style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(83, 252, 24, 0.1) 100%)',
                perspective: '500px',
                transformStyle: 'preserve-3d'
            }}
        >
            <div className="w-full h-full" 
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(83, 252, 24, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(83, 252, 24, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    backgroundPosition: 'center bottom',
                    transform: 'rotateX(45deg) scale(2)',
                    transformOrigin: 'bottom center',
                    opacity: 0.3
                }}
            />
        </div>

        {/* Toxic Green Fog */}
        <motion.div 
            className="absolute bottom-0 left-0 right-0 h-[60vh] z-0"
            style={{
                background: 'radial-gradient(ellipse at bottom, rgba(83, 252, 24, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)'
            }}
            animate={{
                opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        />

        {/* Code Particles */}
        <div className="absolute inset-0 z-0">
            {particles.map(p => (
                <CodeParticle key={p.id} {...p} />
            ))}
        </div>
        
        {/* Ghosts Layer */}
        <div className="relative z-10 w-full h-full">
            {ghosts.map(ghost => (
                <Ghost key={ghost.id} {...ghost} showEyes={shouldShowEyes} isOverload={isOverload} />
            ))}
        </div>
    </div>
  );
};

export default UnifiedBackground;

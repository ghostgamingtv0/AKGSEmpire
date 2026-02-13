import React from 'react';
import MatrixBackground from './MatrixBackground';

const ComingSoonBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        {/* Simple Matrix Rain - No Ghosts, No Heavy Effects */}
        <div className="absolute inset-0 z-0 opacity-30">
            <MatrixBackground />
        </div>
        
        {/* Radial Gradient for focus */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 z-10"></div>
    </div>
  );
};

export default ComingSoonBackground;

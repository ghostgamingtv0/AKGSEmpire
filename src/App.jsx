import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GhostGate from './pages/GhostGate/GhostGate';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Empire from './pages/Empire/Empire';

function App() {
  useEffect(() => {
    // 1. Disable Right Click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I/J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U (View Source)
      ) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Detect DevTools Opening (Console method)
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                // Optional: Action when DevTools detected
                console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
                console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam.', 'font-size: 20px;');
            }
            devtoolsOpen = true;
        } else {
            devtoolsOpen = false;
        }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    const interval = setInterval(checkDevTools, 1000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GhostGate />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/empire/*" element={<Empire />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import GhostGate from './pages/GhostGate/GhostGate';
import Empire from './pages/Empire/Empire';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Genesis Gate - Main Landing Page (Home) */}
        <Route path="/" element={<GhostGate />} />
        
        {/* 2. Coming Soon - Independent Page */}
        <Route path="/coming-soon" element={<ComingSoon />} />
        
        {/* 3. Main Site (AKGS Empire) - Isolated Module */}
        <Route path="/empire/*" element={<Empire />} />
      </Routes>
    </Router>
  );
}

export default App;
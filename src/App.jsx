import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GhostGate from './pages/GhostGate/GhostGate';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Empire from './pages/Empire/Empire';

function App() {
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

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GhostGate from './pages/GhostGate/GhostGate';
import Empire from './pages/Empire/Empire';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Empire />} />
        <Route path="/empire/*" element={<Empire />} />
      </Routes>
    </Router>
  );
}

export default App;

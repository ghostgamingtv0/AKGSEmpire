import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Empire from './pages/Empire/Empire';
import Login from './pages/Empire/components/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/empire/*" element={<Empire />} />
      </Routes>
    </Router>
  );
}

export default App;

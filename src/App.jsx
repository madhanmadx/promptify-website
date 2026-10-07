import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ParticipantPortal from './pages/ParticipantPortal';
import AdminPortal from './pages/AdminPortal';

function App() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/participant" element={<ParticipantPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </div>
  );
}

export default App;

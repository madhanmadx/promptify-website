import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, UserCheck, ArrowRight, Clock, Image as ImageIcon, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#080c14] text-slate-100">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-600/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-pink-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Bar - Participant Only */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gradient">PROMPTIFY</h1>
            <p className="text-[10px] tracking-widest uppercase text-cyan-400 font-medium">AI Image Generation</p>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center my-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-8 shadow-inner">
          <Zap className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
          <span>College Technical Event Competition</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
          PROMPTIFY <br />
          <span className="text-gradient">AI IMAGE GENERATION</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 font-light italic tracking-wide max-w-2xl mx-auto mb-10">
          “Imagine. Prompt. Create.”
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          <div className="glass-card p-5 rounded-2xl text-left border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="p-2.5 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">30-Minute Challenge</h3>
            <p className="text-xs text-slate-400">Timed session starts strictly when you begin the event after registration.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl text-left border border-slate-800/80 hover:border-purple-500/30 transition-all">
            <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400 mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Upload & Describe</h3>
            <p className="text-xs text-slate-400">Submit your AI artwork, tool used, exact prompt, and concept message.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl text-left border border-slate-800/80 hover:border-pink-500/30 transition-all">
            <div className="p-2.5 w-fit rounded-lg bg-pink-500/10 text-pink-400 mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Individual Entry</h3>
            <p className="text-xs text-slate-400">Open to all academic departments and years of study across participating colleges.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/participant')}
            className="w-full sm:w-auto px-10 py-4.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 font-extrabold text-black text-sm tracking-wide shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-3 transform hover:-translate-y-0.5 transition-all"
          >
            <span>ENTER COMPETITION PORTAL</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>© {new Date().getFullYear()} PROMPTIFY – College Technical Event. All rights reserved.</p>
      </footer>
    </div>
  );
}

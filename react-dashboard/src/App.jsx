import React, { useState } from 'react';
import { Camera, Mic, Activity, ShieldAlert } from 'lucide-react';
import Screenshots from './components/Screenshots';
import AudioLogs from './components/AudioLogs';
import History from './components/History';

function App() {
  const [activeTab, setActiveTab] = useState('screenshots');
  const childEmail = 'child@safeguard.local'; // Typically comes from context/prop

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 font-sans flex flex-col selection:bg-indigo-500/30">
      {/* Navbar - Glassmorphism */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse-slow">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
                SafeGuard <span className="font-light opacity-80">AI</span>
              </h1>
            </div>
            
            <div className="flex space-x-2 sm:space-x-4 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <button 
                onClick={() => setActiveTab('screenshots')}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'screenshots' ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Camera size={18} className="mr-2" /> Captures
              </button>
              <button 
                onClick={() => setActiveTab('audio')}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'audio' ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Mic size={18} className="mr-2" /> Audio
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'history' ? 'bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Activity size={18} className="mr-2" /> Monitor
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -z-10"></div>
        
        {activeTab === 'screenshots' && <Screenshots childEmail={childEmail} />}
        {activeTab === 'audio' && <AudioLogs childEmail={childEmail} />}
        {activeTab === 'history' && <History />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-900/40 backdrop-blur-md py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          &copy; 2026 SafeGuard AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;

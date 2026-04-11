import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Mail, User, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../api';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('parent');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      if (isRegistering) {
        await registerUser(name, email, password, role);
        onLogin(email, role);
      } else {
        await loginUser(email, password, role);
        onLogin(email, role);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3.5 rounded-2xl shadow-lg inline-flex mb-5 transform transition-transform hover:scale-105">
            <ShieldAlert size={34} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SafeGuard <span className="font-light text-gray-500">AI</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            {isRegistering ? 'Create your secure account.' : 'Sign in to your dashboard.'}
          </p>
        </div>

        <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl mb-8 relative z-10">
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${role === 'parent' ? 'bg-white text-blue-700 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-900 scale-95'}`}
            onClick={() => setRole('parent')}
          >
            Parent Account
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${role === 'child' ? 'bg-white text-blue-700 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-900 scale-95'}`}
            onClick={() => setRole('child')}
          >
            Paired Device
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-600 text-sm relative z-10 animate-in fade-in">
            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isRegistering && role === 'parent' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isRegistering}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium placeholder-gray-400"
                placeholder={role === 'parent' ? "parent@example.com" : "child@safeguard.local"}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Security PIN / Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.39)] transition-all duration-300 font-semibold group hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Authenticating...</span>
            ) : isRegistering ? (
              <><UserPlus size={18} className="mr-2 opacity-90" /> Create Account</>
            ) : (
              <><LogIn size={18} className="mr-2 opacity-90" /> Access Dashboard</>
            )}
          </button>
        </form>
        
        {role === 'parent' && (
          <div className="mt-6 text-center z-10 relative">
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-widest gap-2 bg-gray-50/50 py-2 rounded-lg border border-gray-100 z-10 relative">
          <ShieldCheck size={14} className="text-emerald-500" />
          End-to-End Encrypted
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, Image, ShieldAlert, Settings, LogOut, Search } from 'lucide-react';
import Dashboard from './components/Dashboard';
// Placeholders for components we will build next:
import Alerts from './components/Alerts';
import Media from './components/Media';
import SuspiciousChecker from './components/SuspiciousChecker';
import SettingsPage from './components/SettingsPage';
import Login from './components/Login';

function Sidebar({ onLogout }) {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/alerts', label: 'Live Alerts', icon: Bell },
    { path: '/media', label: 'Media Logs', icon: Image },
    { path: '/checker', label: 'Suspicious Check', icon: Search },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm hidden md:flex">
      <div className="h-20 flex items-center px-8 border-b border-gray-50">
        <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md mr-3">
          <ShieldAlert size={22} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          SafeGuard <span className="font-light text-gray-500">AI</span>
        </h1>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              location.pathname === item.path 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon size={18} className="mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-50">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={18} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MainLayout({ onLogout }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden selection:bg-blue-100">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/media" element={<Media />} />
            <Route path="/checker" element={<SuspiciousChecker />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      {!isAuthenticated ? (
        <Login onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <MainLayout onLogout={() => setIsAuthenticated(false)} />
      )}
    </Router>
  );
}

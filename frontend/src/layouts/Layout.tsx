import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-300 selection:bg-indigo-500/30 font-sans relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[40%] h-[60%] bg-indigo-600 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[-10%] right-[20%] w-[30%] h-[50%] bg-violet-600 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0F]/60 backdrop-blur-xl">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6 lg:px-12">
          
          <div className="flex items-center gap-8">
            <a className="flex items-center space-x-3 group" href="/">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                CyberSec <span className="text-indigo-400">Academy</span>
              </span>
            </a>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link to="/labs/sql-injection" className="hover:text-white transition-colors">Labs</Link>
              <a href="#" className="hover:text-white transition-colors">Learning Paths</a>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Admin Dashboard</Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              SYSTEM ONLINE
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white uppercase shadow-inner">
                  {user?.email?.substring(0,2) || <User className="w-4 h-4" />}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#12121A] rounded-xl border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-white/5 mb-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate mt-1">{user?.email}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Profile Settings
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>
      
      <main className="container max-w-screen-xl px-6 lg:px-12 py-10 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}

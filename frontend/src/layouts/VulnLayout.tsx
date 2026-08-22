import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function VulnLayout() {
  const [solved, setSolved] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleLabSolved = async () => {
      setSolved(true);
      
      const token = localStorage.getItem('token');
      if (token) {
        const labSlug = location.pathname.split('/').pop();
        try {
          await fetch('http://localhost:3000/api/progress/complete', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ labSlug })
          });
        } catch (e) {
          console.error('Failed to save progress', e);
        }
      }
    };
    
    window.addEventListener('lab-solved', handleLabSolved);
    return () => window.removeEventListener('lab-solved', handleLabSolved);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Premium PortSwigger-style Banner */}
      <div 
        className={`w-full py-2.5 px-6 flex justify-between items-center text-sm font-bold shadow-lg z-50 transition-colors duration-500 ${
          solved 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-[#FF6B2B] text-white shadow-orange-500/20'
        }`}
      >
        <div className="flex items-center space-x-4">
          <span className="uppercase tracking-[0.15em] text-xs font-black opacity-90">CyberSec Academy</span>
          <span className="hidden sm:inline opacity-50">|</span>
          <span className="font-medium tracking-wide">SQL injection vulnerability in login bypass</span>
        </div>
        <div>
          {solved ? (
            <span className="flex items-center space-x-2 bg-black/10 px-3 py-1 rounded-full border border-white/20 animate-in zoom-in duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="tracking-wide uppercase text-xs font-black">Solved!</span>
            </span>
          ) : (
            <span className="uppercase text-xs tracking-widest font-bold opacity-90">Not Solved</span>
          )}
        </div>
      </div>

      {/* The Actual Vulnerable Application renders here */}
      <div className="flex-1 relative">
        <Outlet />
      </div>
    </div>
  );
}

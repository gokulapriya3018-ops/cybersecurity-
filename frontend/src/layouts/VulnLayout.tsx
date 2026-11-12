import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BadgeUnlockModal, UnlockedBadge } from "../components/badges/BadgeUnlockModal";
import { MasterCertificateModal } from "../components/certificate/MasterCertificateModal";
import { ArrowLeft, Award } from "lucide-react";

const LAB_TITLES: Record<string, string> = {
  // SQL Injection Labs
  'sqli-01': 'SQLi Lab 1: Authentication Bypass',
  'sqli-02': 'SQLi Lab 2: UNION-Based Product Search Exfiltration',
  'sqli-03': 'SQLi Lab 3: Product Details & WAF Filter Bypass',
  'sqli-04': 'SQLi Lab 4: Numeric Context User Lookup',
  'sqli-05': 'SQLi Lab 5: Numeric Range Category Filter Bypass',
  'sqli-06': 'SQLi Lab 6: REST API JSON Payload Injection',
  'sqli-07': 'SQLi Lab 7: Cookie-Based Tracking Injection',
  'sqli-08': 'SQLi Lab 8: ORDER BY Parameter Injection',
  'sqli-09': 'SQLi Lab 9: HTTP Header-Based Injection',
  'sqli-10': 'SQLi Lab 10: Second-Order SQL Injection',

  // Cross-Site Scripting Labs
  'xss-reflected': 'XSS Lab 1: Reflected Cross-Site Scripting',
  'xss-stored': 'XSS Lab 2: Stored (Persistent) Cross-Site Scripting',
  'xss-dom': 'XSS Lab 3: DOM-Based Cross-Site Scripting',
  'xss-attribute': 'XSS Lab 4: Attribute Context & Javascript URI Schemes',
  'xss-blacklist': 'XSS Lab 5: Blacklist Filter Bypass',
  'xss-api': 'XSS Lab 6: REST API & JSON Payload XSS',
  'xss-header': 'XSS Lab 7: HTTP Header-Based XSS',
  'xss-csp': 'XSS Lab 8: Content Security Policy (CSP) Bypass',
  'xss-markdown': 'XSS Lab 9: Markdown Parser HTML Injection',
  'xss-second-order': 'XSS Lab 10: Second-Order Cross-Site Scripting',
  'chained-final-exam': 'Master Lab: Operation Titan Breach (Chained SQLi & XSS)',
};

export default function VulnLayout() {
  const [solved, setSolved] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[] | null>(null);
  const [showMasterCertificate, setShowMasterCertificate] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const labSlug = location.pathname.split('/').pop() || '';
  const currentTitle = LAB_TITLES[labSlug] || 'Vulnerability Sandbox Lab';

  useEffect(() => {
    // Reset solved state on lab change
    setSolved(false);

    // 1. Start lab timer when sandbox loads and check existing progress
    const token = localStorage.getItem('token');
    if (token && labSlug) {
      // Check if user already completed this lab
      fetch('http://localhost:3000/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          logout();
          navigate('/login?expired=true');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.ok && Array.isArray(data.progress)) {
          const isDone = data.progress.some((p: any) => p.lab?.slug === labSlug && p.completed);
          if (isDone) setSolved(true);
        }
      })
      .catch(() => {});

      // Record start time
      fetch('http://localhost:3000/api/progress/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ labSlug })
      }).catch(() => {});
    }

    // 2. Active training heartbeat (every 60s)
    const sendHeartbeat = async () => {
      if (token) {
        try {
          const res = await fetch('http://localhost:3000/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 401) {
            logout();
            navigate('/login?expired=true');
          }
        } catch (e) {}
      }
    };
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    const handleLabSolved = async () => {
      setSolved(true);
      
      // Broadcast solve across browser tabs
      try {
        localStorage.setItem('csa_lab_solved', JSON.stringify({ slug: labSlug, timestamp: Date.now() }));
      } catch (e) {
        // ignore storage errors
      }

      if (token) {
        try {
          const res = await fetch('http://localhost:3000/api/progress/complete', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ labSlug })
          });
          const data = await res.json();

          if (labSlug === 'chained-final-exam') {
            // Master lab completion: Show Master Certificate instead of generic badge!
            setShowMasterCertificate(true);
          } else {
            const badges = data.newlyUnlockedBadges || data.newlyEarnedBadges;
            if (data.ok && Array.isArray(badges) && badges.length > 0) {
              setUnlockedBadges(badges);
            }
          }
        } catch (e) {
          console.error('Failed to save progress', e);
        }
      }
    };
    
    window.addEventListener('lab-solved', handleLabSolved);
    return () => {
      window.removeEventListener('lab-solved', handleLabSolved);
      clearInterval(heartbeatInterval);
    };
  }, [location.pathname]);

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
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 opacity-75" />
            <span className="uppercase tracking-[0.15em] text-xs font-black opacity-90">CyberForge</span>
          </Link>
          <span className="hidden sm:inline opacity-50">|</span>
          <span className="font-medium tracking-wide">{currentTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          {solved && labSlug === 'chained-final-exam' && (
            <button
              onClick={() => setShowMasterCertificate(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-full text-xs transition-all shadow-md shadow-amber-500/30 hover:scale-105"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Claim Certificate</span>
            </button>
          )}

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

      {/* Master Lab Certificate Modal */}
      {showMasterCertificate && (
        <MasterCertificateModal
          onClose={() => setShowMasterCertificate(false)}
          studentName={user?.email ? user.email.split('@')[0].toUpperCase() : undefined}
        />
      )}

      {/* Achievement Unlock Celebration Modal (for standard curriculum labs) */}
      {unlockedBadges && labSlug !== 'chained-final-exam' && (
        <BadgeUnlockModal
          badges={unlockedBadges}
          onClose={() => setUnlockedBadges(null)}
        />
      )}
    </div>
  );
}

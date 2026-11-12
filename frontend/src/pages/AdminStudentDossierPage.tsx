import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, ShieldAlert, RefreshCw, Clock, Trophy, Target, Zap, 
  Terminal, CheckCircle2, AlertTriangle, Lock, Globe, Laptop, Check, X
} from 'lucide-react';
import { BadgeEmblem } from '../components/badges/BadgeEmblem';

export default function AdminStudentDossierPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'badges' | 'telemetry' | 'overrides'>('matrix');

  // Override Form State
  const [overrideLabSlug, setOverrideLabSlug] = useState('');
  const [overrideBonusXp, setOverrideBonusXp] = useState(100);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDossier = async () => {
    if (!token || !id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/students/${id}/dossier`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setDossier(data.dossier);
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Failed to load operator dossier' });
      }
    } catch (err) {
      console.error('Failed to fetch dossier:', err);
      setActionMessage({ type: 'error', text: 'Network error loading student dossier' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id, token]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Actions
  const handleApprove = async () => {
    if (!token || !dossier) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${dossier.user.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback('Operator clearance APPROVED');
        fetchDossier();
      }
    } catch (err) {
      showFeedback('Approval failed', 'error');
    }
  };

  const handleRevoke = async () => {
    if (!token || !dossier) return;
    if (!confirm('Freeze operator access and terminate all active sessions?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${dossier.user.id}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback('Operator access REVOKED');
        fetchDossier();
      }
    } catch (err) {
      showFeedback('Revocation failed', 'error');
    }
  };

  const handleKickSessions = async () => {
    if (!token || !dossier) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/students/${dossier.user.id}/kick`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback(data.message || 'Active sessions terminated');
        fetchDossier();
      }
    } catch (err) {
      showFeedback('Failed to kick sessions', 'error');
    }
  };

  const handleResetProgress = async () => {
    if (!token || !dossier) return;
    if (!confirm(`RESET PROGRESS: Are you sure you want to wipe all lab solves and badges for ${dossier.user.email}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/students/${dossier.user.id}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback('Student lab progress and achievements have been reset');
        fetchDossier();
      }
    } catch (err) {
      showFeedback('Failed to reset progress', 'error');
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !dossier) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/students/${dossier.user.id}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          labSlug: overrideLabSlug || undefined,
          bonusXp: Number(overrideBonusXp) || 0
        })
      });
      const data = await res.json();
      if (data.ok) {
        showFeedback(`Instructor override applied successfully! (+${overrideBonusXp} XP)`);
        setOverrideLabSlug('');
        fetchDossier();
      }
    } catch (err) {
      showFeedback('Failed to apply override', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07070C] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#0E0E17] border border-emerald-500/30 text-emerald-400 font-mono text-sm shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>DECRYPTING OPERATOR DOSSIER TELEMETRY...</span>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#07070C] text-slate-200 flex flex-col items-center justify-center p-6 space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Operator Dossier Not Found</h2>
        <p className="text-slate-400 text-sm">The requested operator could not be retrieved from the academy database.</p>
        <Link to="/admin" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors">
          ← Return to SOC Deck
        </Link>
      </div>
    );
  }

  const { user, loginAudits, badges, claimedBadges, labMatrix, activeSessions } = dossier;
  const sqliSolved = labMatrix.filter((l: any) => l.status === 'BREACHED' && l.track === 'SQLi').length;
  const xssSolved = labMatrix.filter((l: any) => l.status === 'BREACHED' && l.track === 'XSS').length;
  const totalSolved = sqliSolved + xssSolved;

  return (
    <div className="min-h-screen bg-[#07070C] text-slate-200 selection:bg-emerald-500/30 font-sans pb-16">
      
      {/* Top Breadcrumb & Quick Action Bar */}
      <div className="sticky top-0 z-40 bg-[#07070C]/90 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <Link 
              to="/admin" 
              className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>SOC COMMAND</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">OPERATORS</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-black">{user.email}</span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Online Ping */}
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 border ${
              user.isOnline 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{user.isOnline ? 'LIVE ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchDossier}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Refresh Dossier Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Approval Toggle */}
            {user.isApproved ? (
              <button
                onClick={handleRevoke}
                className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold transition-all"
              >
                Revoke Clearance
              </button>
            ) : (
              <button
                onClick={handleApprove}
                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black transition-all shadow-lg shadow-emerald-500/20"
              >
                Approve Operator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-12 mt-4">
          <div className={`p-4 rounded-2xl border text-xs font-mono font-bold flex items-center justify-between shadow-xl animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-rose-900/20'
          }`}>
            <span className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{actionMessage.text}</span>
            </span>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Main Dossier Content */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-12 py-8 space-y-8">

        {/* ─────────────────────────────────────────────────────────────
            HERO OPERATOR IDENTITY CARD
           ───────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C14] p-6 lg:p-8 shadow-2xl">
          {/* Ambient Cyber Halos */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            
            {/* Operator Identification */}
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[3px] shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                  <div className="w-full h-full rounded-3xl bg-[#090910] flex items-center justify-center text-3xl font-black text-white uppercase tracking-wider shadow-inner">
                    {user.email.substring(0, 2)}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black font-mono shadow-lg border border-emerald-300">
                  LVL {user.level}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                    {user.email}
                  </h1>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                    ID: #{user.id}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                    user.isApproved 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {user.isApproved ? 'OPERATOR CLEARANCE VERIFIED' : 'CLEARANCE PENDING'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-4 flex-wrap">
                  <span>Enrolled: <strong className="text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</strong></span>
                  <span>•</span>
                  <span>Last Seen: <strong className="text-slate-200">{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'Never'}</strong></span>
                  <span>•</span>
                  <span>Academy Rank: <strong className="text-amber-400 font-black">#{user.classRank || 1}</strong> of {user.totalStudentsCount || 1}</span>
                </p>
              </div>
            </div>

            {/* Tactical High-Impact Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-4 flex-shrink-0">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Labs Breached</span>
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white font-mono">{totalSolved}</span>
                  <span className="text-slate-500 text-sm font-mono"> / 20</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">SQLi: {sqliSolved} • XSS: {xssSolved}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Total XP</span>
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white font-mono">{user.xp}</span>
                  <span className="text-indigo-400 text-xs font-mono font-bold ml-1">XP</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">Level {user.level} Operator</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Active Training</span>
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white font-mono">{user.activeHours}</span>
                  <span className="text-slate-400 text-xs font-mono ml-1">hours</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">{user.activeMinutes || 0} real minutes</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Honors Claimed</span>
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white font-mono">{claimedBadges.length}</span>
                  <span className="text-slate-500 text-sm font-mono"> / {badges.length}</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono mt-1">3D Badges Earned</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            DOSSIER NAVIGATION TABS
           ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>20-Lab Progression Matrix ({totalSolved}/20)</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'badges'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>3D Badges & Honors ({claimedBadges.length}/{badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'telemetry'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Login Footprint & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'overrides'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Instructor Overrides & Emergency Controls</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: 20-LAB PROGRESSION MATRIX
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Curriculum Progression Matrix</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    20 Active Sandboxes
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time solve telemetry, timestamp tracking, and breach duration calculation.
                </p>
              </div>

              {/* Solved Progress Meter */}
              <div className="flex items-center gap-3">
                <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.round((totalSolved / 20) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round((totalSolved / 20) * 100)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {labMatrix.map((lab: any) => {
                const isBreached = lab.status === 'BREACHED';
                const isInProgress = lab.status === 'IN_PROGRESS';

                return (
                  <div
                    key={lab.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                      isBreached
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : isInProgress
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-[#0E0E17] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      {/* Top Track & Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${
                          lab.track === 'SQLi' 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}>
                          {lab.track}
                        </span>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isBreached
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-white/5 text-slate-500 border border-white/5'
                        }`}>
                          {isBreached ? <Check className="w-3 h-3" /> : isInProgress ? <Clock className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{lab.status}</span>
                        </span>
                      </div>

                      {/* Lab Title */}
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {lab.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        slug: {lab.slug}
                      </p>
                    </div>

                    {/* Solve Telemetry Footer */}
                    <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono flex items-center justify-between text-slate-400">
                      <span>Solve Duration:</span>
                      <strong className={`font-mono ${isBreached ? 'text-emerald-400 font-black' : 'text-slate-500'}`}>
                        {lab.duration}
                      </strong>
                    </div>

                    {lab.completedAt && (
                      <div className="text-[10px] font-mono text-slate-500 mt-1 text-right">
                        Breached {new Date(lab.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: 3D BADGES & HONORS SHOWCASE
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Honors & Achievement Emblems</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                  {claimedBadges.length} / {badges.length} Claimed
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                TryHackMe-style 3D hexagonal emblems earned for curriculum milestones and sandbox mastery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map((badge: any) => {
                const isEarned = badge.isEarned;

                return (
                  <div
                    key={badge.id}
                    className={`relative rounded-3xl border p-6 flex flex-col items-center text-center transition-all duration-300 ${
                      isEarned
                        ? 'bg-gradient-to-b from-[#11111E] to-[#0A0A12] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        : 'bg-[#0C0C14] border-white/5 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {/* Emblem Graphic */}
                    <div className="my-3 transform hover:scale-105 transition-transform">
                      <BadgeEmblem
                        iconGraphic={badge.iconGraphic}
                        tier={badge.tier}
                        isEarned={isEarned}
                        size={80}
                      />
                    </div>

                    {/* Badge Info */}
                    <h3 className="text-base font-black text-white tracking-tight mt-2">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {badge.description}
                    </p>

                    {/* Reward & Status */}
                    <div className="mt-4 pt-4 border-t border-white/5 w-full flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                        +{badge.xpReward} XP
                      </span>

                      {isEarned ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Earned {new Date(badge.earnedAt).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: TELEMETRY & LOGIN FOOTPRINT
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Device & Security Profile */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0C0C14] p-6 space-y-4">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Operator Telemetry Profile</span>
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Latest IP Address:</span>
                    <strong className="text-emerald-400">{loginAudits[0]?.ipAddress || '127.0.0.1'}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block mb-1">User Agent:</span>
                    <span className="text-slate-300 break-all text-[11px] leading-relaxed">
                      {loginAudits[0]?.userAgent || 'Unknown Browser Fingerprint'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Security Risk Rating:</span>
                    <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                      user.riskLevel === 'CLEAN'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {user.riskLevel} ({user.anomalyFlags} FLAGS)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Active Database Sessions:</span>
                    <strong className="text-white">{activeSessions.length} Tokens</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Login Audits Table */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#0C0C14] p-6 space-y-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Authentication Audit History</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 pb-2">
                      <th className="py-2.5 font-bold">TIMESTAMP</th>
                      <th className="py-2.5 font-bold">IP ADDRESS</th>
                      <th className="py-2.5 font-bold">CLIENT DEVICE / AGENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loginAudits.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500">
                          No authentication audit records recorded yet.
                        </td>
                      </tr>
                    ) : (
                      loginAudits.map((audit: any) => (
                        <tr key={audit.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 text-slate-300">
                            {new Date(audit.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-emerald-400 font-bold">
                            {audit.ipAddress}
                          </td>
                          <td className="py-3 text-slate-400 truncate max-w-xs" title={audit.userAgent}>
                            {audit.userAgent}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: INSTRUCTOR OVERRIDES & CONTROLS
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'overrides' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Manual Verification Tool */}
            <div className="rounded-3xl border border-white/10 bg-[#0C0C14] p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Manual Lab Verification & Bonus XP</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instructors can manually mark any lab as verified or grant custom bonus XP with real-time badge re-evaluation.
                </p>
              </div>

              <form onSubmit={handleApplyOverride} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Select Target Lab Module (Optional)
                  </label>
                  <select
                    value={overrideLabSlug}
                    onChange={(e) => setOverrideLabSlug(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Grant Bonus XP Only (No Lab) --</option>
                    {labMatrix.map((lab: any) => (
                      <option key={lab.id} value={lab.slug}>
                        [{lab.track}] {lab.title} ({lab.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Bonus XP Reward Amount
                  </label>
                  <input
                    type="number"
                    value={overrideBonusXp}
                    onChange={(e) => setOverrideBonusXp(parseInt(e.target.value) || 0)}
                    min="0"
                    step="50"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Instructor Override & Award XP</span>
                </button>
              </form>
            </div>

            {/* Emergency Kill Switches */}
            <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Emergency Controls & Retake Tools</span>
                </h3>
                <p className="text-xs text-rose-300/70 mt-1">
                  Restricted actions to manage suspected cheating, session hijacks, or student curriculum retakes.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Force Terminate All Sessions</h4>
                    <p className="text-[11px] text-slate-400">Instantly revoke all refresh tokens and log this student out.</p>
                  </div>
                  <button
                    onClick={handleKickSessions}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold transition-colors"
                  >
                    Kill Sessions
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 font-mono">Reset Lab Solves & Badges</h4>
                    <p className="text-[11px] text-slate-400">Wipe progress so the student can re-attempt all 20 labs from scratch.</p>
                  </div>
                  <button
                    onClick={handleResetProgress}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black transition-colors shadow-lg shadow-rose-600/20"
                  >
                    Reset Progress
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

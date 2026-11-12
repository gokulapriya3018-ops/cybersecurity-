import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Database, ShieldAlert, CheckCircle2, ArrowRight, Award, Flame, Trophy, Zap, Shield, Sparkles, Clock, Target, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BadgeEmblem } from '../components/badges/BadgeEmblem';
import { BadgeUnlockModal, UnlockedBadge } from '../components/badges/BadgeUnlockModal';
import { RewardFlightAnimation } from '../components/badges/RewardFlightAnimation';
import { MasterCertificateModal } from '../components/certificate/MasterCertificateModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Strict role separation: Admins are ALWAYS directed to SOC Command Center
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const [progress, setProgress] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'badges' | 'activity'>('badges');
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | 'CLAIMABLE' | 'UNLOCKED' | 'LOCKED'>('ALL');
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<UnlockedBadge[] | null>(null);
  const [flyingReward, setFlyingReward] = useState<{ badge: UnlockedBadge; updatedUser?: any } | null>(null);
  const [showMasterCertModal, setShowMasterCertModal] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Fetch Lab Progress
      const pRes = await fetch('http://localhost:3000/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.status === 401) {
        logout();
        navigate('/login?expired=true');
        return;
      }
      const pData = await pRes.json();
      if (pData.ok && Array.isArray(pData.progress)) {
        setProgress(pData.progress);
      }

      // 2. Fetch Gamification (XP, Levels, Badges)
      const gRes = await fetch('http://localhost:3000/api/gamification/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (gRes.status === 401) {
        logout();
        navigate('/login?expired=true');
        return;
      }
      const gData = await gRes.json();
      if (gData.ok) {
        setGamification(gData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time lab solve and badge claim events
    const handleRefresh = () => {
      fetchDashboardData();
    };
    window.addEventListener('lab-solved', handleRefresh);
    window.addEventListener('badge-claimed', handleRefresh);
    return () => {
      window.removeEventListener('lab-solved', handleRefresh);
      window.removeEventListener('badge-claimed', handleRefresh);
    };
  }, []);

  // Compute counts
  const sqliCompletedCount = progress.filter(p => p.completed && p.lab?.slug?.startsWith('sqli-')).length;
  const xssCompletedCount = progress.filter(p => p.completed && p.lab?.slug?.startsWith('xss-')).length;
  const totalCompleted = progress.filter(p => p.completed).length;
  const isMasterCompleted = progress.some(p => p.completed && p.lab?.slug === 'chained-final-exam');

  const userStats = gamification?.user;
  const badgesList = gamification?.badges || [];

  const earnedBadgesCount = badgesList.filter((b: any) => b.isEarned).length;
  const claimableBadgesCount = badgesList.filter((b: any) => b.isClaimable).length;

  // Filtered badges
  const filteredBadges = badgesList.filter((b: any) => {
    if (badgeFilter === 'CLAIMABLE') return b.isClaimable;
    if (badgeFilter === 'UNLOCKED') return b.isEarned;
    if (badgeFilter === 'LOCKED') return !b.isEarned && !b.isClaimable;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto py-2">
      
      {/* ─────────────────────────────────────────────────────────────
          TRYHACKME-STYLE OPERATOR PROFILE HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E17] p-6 lg:p-8 shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Left: Avatar & Operator Details */}
          <div className="flex items-center gap-6">
            {/* Hexagonal / Circular Avatar with glowing level ring */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-[3px] shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                <div className="w-full h-full rounded-2xl bg-[#0D0D14] flex items-center justify-center text-3xl font-black text-white uppercase tracking-wider shadow-inner">
                  {user?.email?.substring(0, 2) || 'OP'}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black font-mono shadow-lg border border-amber-300">
                LVL {userStats?.level || 1}
              </div>
            </div>

            {/* User Title & Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {user?.email?.split('@')[0] || 'Operator'}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-black tracking-wider uppercase">
                  {userStats?.rankTitle || '[CADET HACKER]'}
                </span>
                <span className="text-xs text-slate-500">🇺🇸 Online</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Offensive Application Security Researcher • Penetration Tester
              </p>

              {/* XP Progress Bar */}
              <div 
                id="hud-xp-widget"
                className={`pt-2 w-full max-w-md space-y-1.5 transition-all duration-500 ${
                  xpPulse ? 'scale-105 filter drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' : ''
                }`}
              >
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Level {userStats?.level || 1} Operator
                  </span>
                  <span className={`transition-all duration-300 ${xpPulse ? 'text-emerald-300 font-black scale-110' : 'text-slate-400'}`}>
                    {userStats?.xp || 0} / {userStats?.nextLevelXp || 400} XP
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
                  <div
                    className={`h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm ${
                      xpPulse ? 'from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_15px_rgba(52,211,153,0.9)]' : ''
                    }`}
                    style={{ width: `${userStats?.levelProgressPercent || 0}%` }}
                  />
                  {xpPulse && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-ping rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats Cards (TryHackMe Layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 xl:gap-4 flex-shrink-0">
            
            {/* Rank Card */}
            <div className="bg-[#141420] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Rank</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold">TOP 1%</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-xl font-black text-white font-mono">#1</span>
              </div>
            </div>

            {/* Badges Card */}
            <div 
              id="hud-badges-widget"
              onClick={() => setActiveTab('badges')}
              className={`bg-[#141420] border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-500 ${
                badgePulse
                  ? 'border-amber-400 bg-amber-500/20 scale-115 shadow-[0_0_35px_rgba(245,158,11,0.7)]'
                  : 'border-white/5 hover:border-indigo-500/30 hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Badges</span>
                <Sparkles className={`w-3.5 h-3.5 transition-all ${badgePulse ? 'text-amber-300 animate-spin' : 'text-indigo-400'}`} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Award className={`w-5 h-5 transition-all ${badgePulse ? 'text-amber-300 animate-bounce' : 'text-indigo-400'}`} />
                <span className={`text-xl font-black font-mono transition-all ${badgePulse ? 'text-amber-300 scale-110' : 'text-white'}`}>
                  {earnedBadgesCount} <span className="text-xs text-slate-500 font-normal">/ {badgesList.length}</span>
                </span>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-[#141420] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Streak</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-xl font-black text-white font-mono">3 Days</span>
              </div>
            </div>

            {/* Completed Rooms / Labs Card */}
            <div 
              onClick={() => setActiveTab('modules')}
              className="bg-[#141420] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/30 cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Completed Labs</span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xl font-black text-white font-mono">
                  {totalCompleted} <span className="text-xs text-slate-500 font-normal">/ 20</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          UNCLAIMED BADGES NOTIFICATION BANNER (When student has badges waiting to claim)
         ───────────────────────────────────────────────────────────── */}
      {claimableBadgesCount > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 p-5 lg:p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] animate-pulse">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/40 flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {claimableBadgesCount} Official Honor{claimableBadgesCount > 1 ? 's' : ''} Ready to Claim!
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black font-mono uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
                  You conquered the lab requirements! Claim your badges now to register your honors and award the bonus XP to your operator rank.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('badges');
                setBadgeFilter('CLAIMABLE');
                const firstClaimable = badgesList.find((b: any) => b.isClaimable);
                if (firstClaimable) setSelectedBadgeModal([firstClaimable]);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-mono font-black text-xs transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 flex-shrink-0 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Claim Badges (+XP)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB NAVIGATION (Curriculum Modules | Badges & Achievements | Activity)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-[#12121A] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Badges & Achievements</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
              {earnedBadgesCount}/{badgesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'modules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Curriculum Modules</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
              2 Tracks
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Activity History</span>
          </button>
        </div>

        {/* Badges Filter Pills (Only visible when on badges tab) */}
        {activeTab === 'badges' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setBadgeFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                badgeFilter === 'ALL'
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              All ({badgesList.length})
            </button>

            {claimableBadgesCount > 0 && (
              <button
                onClick={() => setBadgeFilter('CLAIMABLE')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all border ${
                  badgeFilter === 'CLAIMABLE'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Ready to Claim ({claimableBadgesCount})</span>
              </button>
            )}

            <button
              onClick={() => setBadgeFilter('UNLOCKED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                badgeFilter === 'UNLOCKED'
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              Unlocked ({earnedBadgesCount})
            </button>

            <button
              onClick={() => setBadgeFilter('LOCKED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                badgeFilter === 'LOCKED'
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              Locked ({badgesList.length - earnedBadgesCount - claimableBadgesCount})
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT: BADGES & ACHIEVEMENTS SHOWCASE (TryHackMe Style)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'badges' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Offensive Security Badges</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conquer sandbox environments and execute complex multi-stage exploits to unlock official platform badges.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              {claimableBadgesCount > 0 && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400 font-bold">{claimableBadgesCount} Ready to Claim</span>
                  <span className="mx-2">•</span>
                </>
              )}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{earnedBadgesCount} Unlocked</span>
              <span className="mx-2">•</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span>{badgesList.length - earnedBadgesCount - claimableBadgesCount} Locked</span>
            </div>
          </div>

          {/* Badges Hexagonal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBadges.map((badge: any) => (
              <div
                key={badge.id}
                id={`badge-card-${badge.slug}`}
                onClick={() => setSelectedBadgeModal([badge])}
                className={`group relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-500 cursor-pointer overflow-hidden ${
                  flyingReward?.badge?.slug === badge.slug
                    ? 'scale-105 border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.8)] z-20'
                    : badge.isClaimable
                    ? 'bg-gradient-to-b from-[#241A12] via-[#161218] to-[#0D0D14] border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/30 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(245,158,11,0.6)]'
                    : badge.isEarned
                    ? 'bg-gradient-to-b from-[#141424] to-[#0D0D14] border-white/10 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1'
                    : 'bg-[#0E0E16]/60 border-white/5 hover:border-white/15 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Continuous Glowing Aura for Claimable Badges */}
                {badge.isClaimable && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-amber-400/5 to-transparent pointer-events-none animate-pulse" />
                )}
                {badge.isClaimable && (
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/25 rounded-full blur-2xl pointer-events-none animate-pulse" />
                )}

                {/* Subtle Tier Backdrop Glow for earned */}
                {badge.isEarned && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
                )}

                {/* Floating Ready to Claim Ribbon */}
                {badge.isClaimable && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black font-mono shadow-lg shadow-amber-500/30 animate-bounce">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    <span>READY TO CLAIM!</span>
                  </div>
                )}

                <div>
                  {/* Top Header: Emblem & Tier */}
                  <div className="flex items-start justify-between">
                    <div id={`badge-emblem-${badge.slug}`}>
                      <BadgeEmblem
                        iconGraphic={badge.iconGraphic}
                        tier={badge.tier}
                        isEarned={badge.isEarned || badge.isClaimable}
                        size={80}
                        className={`transition-transform duration-300 ${
                          badge.isClaimable ? 'scale-105 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'group-hover:scale-105'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                        badge.tier === 'DIAMOND'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : badge.tier === 'PLATINUM'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : badge.tier === 'GOLD'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : badge.tier === 'SILVER'
                          ? 'bg-slate-400/10 text-slate-300 border-slate-400/20'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}>
                        {badge.tier}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        +{badge.xpReward} XP
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-4">
                    <h3 className={`text-base font-bold tracking-tight transition-colors ${
                      badge.isClaimable
                        ? 'text-amber-300 group-hover:text-amber-200'
                        : badge.isEarned 
                        ? 'text-white group-hover:text-indigo-400' 
                        : 'text-slate-300'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Footer Status / Progress / Direct Claim */}
                <div className="mt-5 pt-3.5 border-t border-white/5">
                  {badge.isClaimable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBadgeModal([badge]);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black font-mono text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>CLAIM BADGE (+{badge.xpReward} XP)</span>
                    </button>
                  ) : badge.isEarned ? (
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Unlocked</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Progress</span>
                        <span className="text-slate-300 font-bold">
                          {badge.progress?.current} / {badge.progress?.target}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-600 rounded-full transition-all duration-300"
                          style={{ width: `${badge.progress?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT: CURRICULUM MODULES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Active Curriculum Modules</span>
            </h2>
            <span className="text-xs text-slate-400">Dual-Track Hands-On Sandboxes</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* SQL Injection Module Card */}
            <Link 
              to="/labs/sql-injection"
              className="group relative rounded-3xl border border-white/10 bg-[#12121A] p-8 shadow-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-indigo-500/20">
                    <Database className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      10 LABS
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {sqliCompletedCount}/10
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                    SQL Injection (SQLi)
                  </h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                    Master server-side database exploitation techniques including Authentication Bypasses, UNION-based exfiltration, Blind timing inference, WAF filter evasions, and Second-Order SQLi.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {['Auth Bypass', 'UNION Select', 'Blind Time-Based', '2nd-Order SQLi', 'PostgreSQL'].map(tag => (
                    <span key={tag} className="text-[11px] font-semibold text-slate-300 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <span>Enter SQLi Track</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-slate-500 font-normal">CWE-89 • OWASP A03</span>
              </div>
            </Link>

            {/* Cross-Site Scripting Module Card */}
            <Link 
              to="/labs/xss"
              className="group relative rounded-3xl border border-white/10 bg-[#12121A] p-8 shadow-xl transition-all duration-300 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/20 transition-all" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner border border-violet-500/20">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                      10 LABS
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {xssCompletedCount}/10
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-violet-400 transition-colors">
                    Cross-Site Scripting (XSS)
                  </h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                    Explore client-side script execution vulnerabilities across Reflected queries, Stored guestbooks, DOM hash sinks, Attribute contexts, CSP bypasses, and multi-stage Second-Order ticket queues.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {['Reflected XSS', 'Stored Guestbook', 'DOM Sinks', 'CSP Bypass', '2nd-Order XSS'].map(tag => (
                    <span key={tag} className="text-[11px] font-semibold text-slate-300 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-xs font-bold text-violet-400 group-hover:text-violet-300">
                <span className="flex items-center gap-1.5">
                  <span>Enter XSS Track</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-slate-500 font-normal">CWE-79 • Client Security</span>
              </div>
            </Link>

            {/* Master Capstone Chained Lab Banner */}
            <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 p-8 shadow-2xl group hover:border-indigo-500/50 transition-all">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-widest">
                      ⚡ CAPSTONE MASTER LAB
                    </span>
                    <span className="text-xs font-mono text-slate-400">Chained Exploit Simulation</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Operation Titan Breach: Real-Time Enterprise Perimeter
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Test your end-to-end skills against a live enterprise target: Titan Dynamics. Chain SQL Injection database reconnaissance with Stored XSS execution against the SOC Compliance Auditor session. Zero walkthroughs — full realism.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                  {isMasterCompleted && (
                    <button
                      onClick={() => setShowMasterCertModal(true)}
                      className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-mono font-black text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Certificate</span>
                    </button>
                  )}
                  <Link
                    to="/vuln/chained-final-exam"
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group-hover:scale-105 transition-all"
                  >
                    <span>{isMasterCompleted ? 'Review Master Lab' : 'Launch Master Target'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT: ACTIVITY HISTORY
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Training Activity & Timeline</span>
            </h2>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-6 divide-y divide-white/5">
            {progress.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-mono">
                No lab solves recorded yet. Launch a sandbox to begin building your record.
              </div>
            ) : (
              progress.map((p: any) => (
                <div key={p.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {p.lab?.title || p.lab?.slug}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Completed on {p.completedAt ? new Date(p.completedAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      +100 XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ACHIEVEMENT DETAIL / UNLOCK CELEBRATION MODAL
         ───────────────────────────────────────────────────────────── */}
      {selectedBadgeModal && (
        <BadgeUnlockModal
          badges={selectedBadgeModal}
          isInspectMode={!selectedBadgeModal[0]?.isClaimable}
          onClaimSuccess={() => {
            // Prepared
          }}
          onGoToLabs={() => {
            setSelectedBadgeModal(null);
            setActiveTab('modules');
          }}
          onClose={(claimedBadge) => {
            setSelectedBadgeModal(null);
            if (claimedBadge) {
              setFlyingReward({ badge: claimedBadge });
            } else {
              fetchDashboardData();
            }
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          REWARD FLIGHT CELEBRATION ANIMATION (Badge -> Top Badges & +XP -> Profile XP)
         ───────────────────────────────────────────────────────────── */}
      {flyingReward && (
        <RewardFlightAnimation
          badge={flyingReward.badge}
          onBadgeImpact={() => {
            setBadgePulse(true);
            setTimeout(() => setBadgePulse(false), 800);
          }}
          onXpImpact={() => {
            setXpPulse(true);
            setTimeout(() => setXpPulse(false), 800);
          }}
          onComplete={() => {
            setFlyingReward(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* Official Master Certificate Modal */}
      {showMasterCertModal && (
        <MasterCertificateModal
          onClose={() => setShowMasterCertModal(false)}
          studentName={user?.email ? user.email.split('@')[0].toUpperCase() : undefined}
        />
      )}

    </div>
  );
}


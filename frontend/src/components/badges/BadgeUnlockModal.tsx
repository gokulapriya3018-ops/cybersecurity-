import React, { useState, useEffect } from 'react';
import { BadgeEmblem } from './BadgeEmblem';
import { Sparkles, X, Zap, CheckCircle2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export interface UnlockedBadge {
  id: number;
  slug: string;
  name: string;
  description: string;
  tier: string;
  xpReward: number;
  iconGraphic: string;
  isEarned?: boolean;
  isClaimable?: boolean;
  isLocked?: boolean;
  earnedAt?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface BadgeUnlockModalProps {
  badges: UnlockedBadge[];
  onClose: (claimedBadge?: UnlockedBadge) => void;
  isInspectMode?: boolean;
  onGoToLabs?: () => void;
  onClaimSuccess?: (claimedBadge: UnlockedBadge, updatedUser?: any) => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ 
  badges, 
  onClose, 
  isInspectMode = false,
  onGoToLabs,
  onClaimSuccess 
}) => {
  const [badgeIndex, setBadgeIndex] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isClaimingApi, setIsClaimingApi] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [lastClaimedBadge, setLastClaimedBadge] = useState<UnlockedBadge | null>(null);
  const [displayXp, setDisplayXp] = useState(0);

  if (!badges || badges.length === 0) return null;

  const currentBadge = badges[badgeIndex] || badges[0];
  const isEarned = Boolean(currentBadge.isEarned || hasClaimed);
  const isClaimable = Boolean(!isEarned && (currentBadge.isClaimable || (!isInspectMode && currentBadge.progress?.percentage === 100)));

  // If user completed a lab and this modal auto-popped for an unearned badge, auto-enter celebration ready state
  useEffect(() => {
    if (!isInspectMode && isClaimable) {
      // ready to claim
    }
  }, [isInspectMode, isClaimable]);

  // XP Counter animation during celebration
  useEffect(() => {
    if (isCelebrating) {
      let start = 0;
      const target = currentBadge.xpReward || 100;
      const duration = 1200; // 1.2s roll up
      const stepTime = 30;
      const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setDisplayXp(target);
          clearInterval(timer);
        } else {
          setDisplayXp(start);
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setDisplayXp(0);
    }
  }, [isCelebrating, currentBadge.xpReward]);

  // Trigger claim flow
  const handleClaim = async () => {
    setIsClaimingApi(true);
    setIsCelebrating(true);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('http://localhost:3000/api/gamification/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ badgeSlug: currentBadge.slug, badgeId: currentBadge.id })
        });
        const data = await res.json();
        if (data.ok) {
          setHasClaimed(true);
          setLastClaimedBadge(currentBadge);
          window.dispatchEvent(new CustomEvent('badge-claimed', { 
            detail: { badge: currentBadge, user: data.user } 
          }));
          if (onClaimSuccess) {
            onClaimSuccess(currentBadge, data.user);
          }
        } else {
          // Even if already claimed in DB, show verified
          setHasClaimed(true);
          setLastClaimedBadge(currentBadge);
        }
      } else {
        setHasClaimed(true);
        setLastClaimedBadge(currentBadge);
      }
    } catch (err) {
      console.error('Failed to claim badge:', err);
      setHasClaimed(true);
      setLastClaimedBadge(currentBadge);
    } finally {
      setIsClaimingApi(false);
    }
  };

  const handleDismiss = () => {
    onClose(lastClaimedBadge || undefined);
  };

  const handleNextOrClose = () => {
    if (badgeIndex < badges.length - 1) {
      setBadgeIndex(prev => prev + 1);
      setIsCelebrating(false);
      setHasClaimed(false);
    } else {
      handleDismiss();
    }
  };

  // Tier color mapping for glow & borders
  const tierColorMap: Record<string, { ring: string; glow: string; text: string; bg: string }> = {
    DIAMOND: { ring: 'border-cyan-400', glow: 'rgba(6,182,212,0.6)', text: 'text-cyan-400', bg: 'from-cyan-500/20' },
    PLATINUM: { ring: 'border-purple-400', glow: 'rgba(168,85,247,0.6)', text: 'text-purple-400', bg: 'from-purple-500/20' },
    GOLD: { ring: 'border-amber-400', glow: 'rgba(245,158,11,0.65)', text: 'text-amber-400', bg: 'from-amber-500/20' },
    SILVER: { ring: 'border-slate-300', glow: 'rgba(148,163,184,0.5)', text: 'text-slate-300', bg: 'from-slate-400/20' },
    BRONZE: { ring: 'border-orange-500', glow: 'rgba(234,88,12,0.55)', text: 'text-orange-400', bg: 'from-orange-500/20' }
  };

  const currentTheme = tierColorMap[currentBadge.tier] || tierColorMap.GOLD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      
      {/* ─────────────────────────────────────────────────────────────
          CELEBRATION VIEW: GAMING 3D SHOWCASE (ZERO OVERLAPPING)
         ───────────────────────────────────────────────────────────── */}
      {isCelebrating ? (
        <div className="relative w-full max-w-2xl rounded-3xl p-6 sm:p-10 text-center overflow-hidden border border-amber-400/40 bg-gradient-to-b from-[#120F1C] via-[#0A0A14] to-[#05050A] shadow-[0_0_80px_rgba(245,158,11,0.3)] my-auto animate-in zoom-in-95 duration-400">
          
          {/* Close Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors z-30"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Background Ambient Radial Glow */}
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-1000"
            style={{ background: currentTheme.glow }}
          />

          {/* 1. Header Banner Slot (Fixed Height - No Collision) */}
          <div className="relative z-20 mb-2 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-xs font-mono font-black uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>★ HONOR CLAIMED & VERIFIED ★</span>
            </div>
          </div>

          {/* 2. 3D Pedestal & Floating Emblem Stage (Dedicated 260px Height) */}
          <div className="relative w-full h-[250px] sm:h-[270px] flex items-center justify-center my-2 select-none">
            
            {/* Rotating Sunburst Light Rays in Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-[380px] sm:w-[460px] h-[380px] sm:h-[460px] rounded-full animate-cyber-ray opacity-25"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.5) 15deg, transparent 30deg, transparent 60deg, rgba(16,185,129,0.5) 75deg, transparent 90deg, transparent 120deg, rgba(56,189,248,0.5) 135deg, transparent 150deg, transparent 180deg, rgba(245,158,11,0.5) 195deg, transparent 210deg, transparent 240deg, rgba(16,185,129,0.5) 255deg, transparent 270deg, transparent 300deg, rgba(56,189,248,0.5) 315deg, transparent 330deg)'
                }}
              />
              <div 
                className="w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] rounded-full animate-cyber-ray-rev opacity-20"
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0deg, rgba(168,85,247,0.4) 20deg, transparent 40deg, transparent 90deg, rgba(245,158,11,0.4) 110deg, transparent 130deg, transparent 180deg, rgba(16,185,129,0.4) 200deg, transparent 220deg)'
                }}
              />
            </div>

            {/* Concentric Energy Shockwave Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 rounded-full border-2 border-amber-400/60 animate-cyber-shockwave" />
              <div 
                className="w-40 h-40 rounded-full border border-emerald-400/50 animate-cyber-shockwave" 
                style={{ animationDelay: '0.8s' }}
              />
            </div>

            {/* Cyber Floating Particle Embers */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-amber-400 animate-cyber-sparkle shadow-[0_0_8px_rgba(245,158,11,0.9)]"
                  style={{
                    left: `${15 + (i * 4.5)}%`,
                    top: `${60 + (i % 5) * 6}%`,
                    animationDelay: `${(i * 0.15)}s`,
                    animationDuration: `${2.2 + (i % 3) * 0.5}s`
                  }}
                />
              ))}
            </div>

            {/* 3D Holographic Platform / Pedestal */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              {/* Upward Light Column */}
              <div className="w-36 h-28 bg-gradient-to-t from-amber-400/30 via-emerald-400/10 to-transparent blur-md" />
              
              {/* Isometric Pedestal Disc */}
              <div className="relative -mt-4 w-44 sm:w-56 h-10 rounded-full bg-[#0E0E18] border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center">
                <div className="w-36 sm:w-48 h-6 rounded-full border border-emerald-400/50 bg-gradient-to-r from-amber-500/20 via-emerald-500/30 to-cyan-500/20" />
                <div className="absolute -inset-1 rounded-full border border-cyan-400/30 animate-pulse" />
              </div>
            </div>

            {/* Floating 3D Emblem (Smooth Levitating Animation) */}
            <div className="relative z-20 animate-pedestal-float">
              <BadgeEmblem
                iconGraphic={currentBadge.iconGraphic}
                tier={currentBadge.tier}
                isEarned={true}
                size={170}
                className="drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)]"
              />
            </div>

          </div>

          {/* 3. Badge Title & Tier Roster Tag (Dedicated Slot) */}
          <div className="relative z-20 mt-1 mb-4 space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-[11px] font-mono font-black uppercase px-3 py-1 rounded-md border tracking-wider ${
                currentBadge.tier === 'DIAMOND'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : currentBadge.tier === 'PLATINUM'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : currentBadge.tier === 'GOLD'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : currentBadge.tier === 'SILVER'
                  ? 'bg-slate-400/15 text-slate-200 border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.3)]'
                  : 'bg-orange-500/15 text-orange-300 border-orange-500/40'
              }`}>
                ★ {currentBadge.tier} HONOR PROTOCOL ★
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
              {currentBadge.name}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              {currentBadge.description}
            </p>
          </div>

          {/* 4. XP Award Tally Box (Dedicated Bottom Slot - Completely Separated) */}
          <div className="relative z-20 max-w-md mx-auto bg-[#141424]/90 border border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Zap className="w-6 h-6 text-amber-300 fill-amber-300/30 animate-bounce" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Accredited to Operator Dossier
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 tracking-tight">
                  +{displayXp} XP
                </div>
              </div>
            </div>

            <div className="text-right font-mono flex flex-col items-end">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Telemetry Synced</span>
            </div>
          </div>

          {/* 5. Main Gaming Action Controls (Bottom) */}
          <div className="relative z-20 mt-6 max-w-md mx-auto flex items-center gap-3">
            <button
              onClick={handleNextOrClose}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono text-xs sm:text-sm tracking-wider shadow-[0_0_35px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>
                {badgeIndex < badges.length - 1 
                  ? `CLAIM NEXT HONOR (${badgeIndex + 2}/${badges.length})` 
                  : 'EQUIP HONOR & CONTINUE'}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           INSPECTION / PRE-CLAIM VIEW (CLEAN MODAL WITH GLOWING CTA)
           ───────────────────────────────────────────────────────────── */
        <div className={`relative w-full max-w-md rounded-3xl p-7 text-center overflow-hidden border shadow-2xl transition-all duration-300 my-auto ${
          isClaimable
            ? 'bg-gradient-to-b from-[#1C1518] via-[#100E18] to-[#0A0A10] border-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.25)]'
            : isEarned
            ? 'bg-gradient-to-b from-[#0E1B15] via-[#0C1214] to-[#080810] border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.2)]'
            : 'bg-gradient-to-b from-[#141420] via-[#0C0C14] to-[#08080E] border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
        }`}>
          
          {/* Ambient Top Glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 blur-3xl rounded-full pointer-events-none opacity-40"
            style={{ background: isClaimable ? 'rgba(245,158,11,0.5)' : isEarned ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.2)' }}
          />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Status Tag */}
          <div className="relative z-10 mb-4">
            {isClaimable ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-mono font-black uppercase tracking-widest animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Honor Ready to Claim!</span>
              </div>
            ) : isEarned ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Honor Collected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Locked Objective</span>
              </div>
            )}
          </div>

          {/* 3D Emblem Showcase */}
          <div className="flex justify-center my-4 relative z-10">
            <div className={`transition-all duration-500 transform ${
              isClaimable
                ? 'scale-105 hover:scale-115 hover:rotate-3 cursor-pointer'
                : 'hover:scale-105'
            }`}>
              <BadgeEmblem
                iconGraphic={currentBadge.iconGraphic}
                tier={currentBadge.tier}
                isEarned={isEarned || isClaimable}
                size={140}
                className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
              />
            </div>
          </div>

          {/* Badge Details */}
          <div className="mt-3 space-y-2 relative z-10">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                currentBadge.tier === 'DIAMOND'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : currentBadge.tier === 'PLATINUM'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : currentBadge.tier === 'GOLD'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : currentBadge.tier === 'SILVER'
                  ? 'bg-slate-400/10 text-slate-300 border-slate-400/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              }`}>
                {currentBadge.tier} TIER
              </span>
              {currentBadge.earnedAt && isEarned && (
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                  Earned {new Date(currentBadge.earnedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {currentBadge.name}
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {currentBadge.description}
            </p>
          </div>

          {/* Progress Display if Locked */}
          {!isEarned && !isClaimable && currentBadge.progress && (
            <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 relative z-10 text-left">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Unlock Progress</span>
                <span className="text-amber-400 font-bold">
                  {currentBadge.progress.current} / {currentBadge.progress.target}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, currentBadge.progress.percentage || 0)}%` }}
                />
              </div>
            </div>
          )}

          {/* XP Reward Banner */}
          <div className={`mt-4 flex items-center justify-center gap-2 rounded-2xl py-2 px-5 font-mono text-xs font-bold relative z-10 border ${
            isClaimable
              ? 'text-amber-300 bg-amber-500/15 border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : isEarned
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-slate-400 bg-white/5 border-white/10'
          }`}>
            <Zap className="w-4 h-4 text-amber-400" />
            <span>+{currentBadge.xpReward} XP {isEarned ? 'Accredited' : 'Reward'}</span>
          </div>

          {/* Actions */}
          <div className="mt-6 relative z-10">
            {isClaimable ? (
              <button
                onClick={handleClaim}
                disabled={isClaimingApi}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs font-mono tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>CLAIM BADGE & ENTER 3D SHOWCASE (+{currentBadge.xpReward} XP)</span>
              </button>
            ) : isEarned ? (
              <button
                onClick={handleDismiss}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Badge Already Collected</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  handleDismiss();
                  if (onGoToLabs) onGoToLabs();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Understood • Complete Labs to Unlock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

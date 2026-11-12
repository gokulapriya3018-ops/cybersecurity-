import React, { useEffect, useRef, useState } from 'react';
import { BadgeEmblem } from './BadgeEmblem';
import { UnlockedBadge } from './BadgeUnlockModal';
import { Zap, Sparkles } from 'lucide-react';

interface RewardFlightAnimationProps {
  badge: UnlockedBadge;
  onComplete: () => void;
  onBadgeImpact?: () => void;
  onXpImpact?: () => void;
}

export const RewardFlightAnimation: React.FC<RewardFlightAnimationProps> = ({
  badge,
  onComplete,
  onBadgeImpact,
  onXpImpact
}) => {
  const badgeFlyerRef = useRef<HTMLDivElement>(null);
  const xpFlyerRef = useRef<HTMLDivElement>(null);
  const [badgeImpactPos, setBadgeImpactPos] = useState<{ x: number; y: number } | null>(null);
  const [xpImpactPos, setXpImpactPos] = useState<{ x: number; y: number } | null>(null);
  const [sourceShockwave, setSourceShockwave] = useState<{ x: number; y: number } | null>(null);

  const onCompleteRef = useRef(onComplete);
  const onBadgeImpactRef = useRef(onBadgeImpact);
  const onXpImpactRef = useRef(onXpImpact);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onBadgeImpactRef.current = onBadgeImpact;
    onXpImpactRef.current = onXpImpact;
  });

  useEffect(() => {
    // 1. Calculate Source Coordinates from badge card or emblem
    const sourceCard = document.getElementById(`badge-card-${badge.slug}`) || 
                       document.getElementById(`badge-emblem-${badge.slug}`);
    
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight * 0.65;

    if (sourceCard) {
      const rect = sourceCard.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height * 0.35;
      }
    }

    setSourceShockwave({ x: startX, y: startY });

    // 2. Calculate Target 1 (Top Badges Stat Widget) Coordinates
    const badgesWidget = document.getElementById('hud-badges-widget');
    let targetBadgeX = window.innerWidth * 0.72;
    let targetBadgeY = 150;

    if (badgesWidget) {
      const bRect = badgesWidget.getBoundingClientRect();
      targetBadgeX = bRect.left + bRect.width / 2;
      targetBadgeY = bRect.top + bRect.height / 2;
    }

    // 3. Calculate Target 2 (Profile XP Progress Bar Widget) Coordinates
    const xpWidget = document.getElementById('hud-xp-widget');
    let targetXpX = window.innerWidth * 0.35;
    let targetXpY = 150;

    if (xpWidget) {
      const xRect = xpWidget.getBoundingClientRect();
      targetXpX = xRect.left + xRect.width * 0.75;
      targetXpY = xRect.top + xRect.height / 2;
    }

    // Arc control offset for parabolic sky trajectory
    const badgeMidX = (startX + targetBadgeX) / 2 + 30;
    const badgeMidY = Math.min(startY, targetBadgeY) - 70;

    const xpMidX = (startX + targetXpX) / 2 - 30;
    const xpMidY = Math.min(startY, targetXpY) - 60;

    // 4. Launch Badge Emblem Flight via Web Animations API (Slower, Graceful Popup & Smooth Glide)
    if (badgeFlyerRef.current) {
      const badgeAnim = badgeFlyerRef.current.animate([
        {
          transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%) scale(0.6) rotate(0deg)`,
          opacity: 0
        },
        // Graceful, slower popup elevation
        {
          transform: `translate(${startX}px, ${startY - 45}px) translate(-50%, -50%) scale(1.22) rotate(0deg)`,
          opacity: 1,
          offset: 0.18
        },
        // Gentle hovering pause above card
        {
          transform: `translate(${startX}px, ${startY - 50}px) translate(-50%, -50%) scale(1.25) rotate(4deg)`,
          opacity: 1,
          offset: 0.32
        },
        // Smooth parabolic sky flight
        {
          transform: `translate(${badgeMidX}px, ${badgeMidY}px) translate(-50%, -50%) scale(0.95) rotate(180deg)`,
          opacity: 1,
          offset: 0.66
        },
        // Arrive at destination Top Badges card
        {
          transform: `translate(${targetBadgeX}px, ${targetBadgeY}px) translate(-50%, -50%) scale(0.45) rotate(360deg)`,
          opacity: 1,
          offset: 0.92
        },
        // Absorb & fade into impact flare
        {
          transform: `translate(${targetBadgeX}px, ${targetBadgeY}px) translate(-50%, -50%) scale(0.05) rotate(360deg)`,
          opacity: 0,
          offset: 1
        }
      ], {
        duration: 2100,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      });

      badgeAnim.onfinish = () => {
        setBadgeImpactPos({ x: targetBadgeX, y: targetBadgeY });
        if (onBadgeImpactRef.current) onBadgeImpactRef.current();
        setTimeout(() => setBadgeImpactPos(null), 600);
      };
    }

    // 5. Launch +XP Pill Flight with Stagger (Graceful Popup & Smooth Glide)
    if (xpFlyerRef.current) {
      const xpAnim = xpFlyerRef.current.animate([
        {
          transform: `translate(${startX + 35}px, ${startY}px) translate(-50%, -50%) scale(0.6)`,
          opacity: 0
        },
        // Slower popup beside emblem
        {
          transform: `translate(${startX + 35}px, ${startY - 30}px) translate(-50%, -50%) scale(1.18)`,
          opacity: 1,
          offset: 0.18
        },
        // Gentle hover pause
        {
          transform: `translate(${startX + 35}px, ${startY - 35}px) translate(-50%, -50%) scale(1.2)`,
          opacity: 1,
          offset: 0.32
        },
        // Smooth sky glide
        {
          transform: `translate(${xpMidX}px, ${xpMidY}px) translate(-50%, -50%) scale(0.95)`,
          opacity: 1,
          offset: 0.66
        },
        // Arrive at destination Profile XP Progress Bar
        {
          transform: `translate(${targetXpX}px, ${targetXpY}px) translate(-50%, -50%) scale(0.75)`,
          opacity: 1,
          offset: 0.92
        },
        // Absorb & fade into laser ripple
        {
          transform: `translate(${targetXpX}px, ${targetXpY}px) translate(-50%, -50%) scale(0.05)`,
          opacity: 0,
          offset: 1
        }
      ], {
        duration: 2150,
        delay: 200,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      });

      xpAnim.onfinish = () => {
        setXpImpactPos({ x: targetXpX, y: targetXpY });
        if (onXpImpactRef.current) onXpImpactRef.current();
        setTimeout(() => setXpImpactPos(null), 600);
      };
    }

    // 6. Hard completion timer: Guarantees complete unmount and cleanup
    const finishTimer = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 2500);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [badge.id, badge.slug]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────────
          1. SOURCE CARD BURST SHOCKWAVE (At origin card position)
         ───────────────────────────────────────────────────────────── */}
      {sourceShockwave && (
        <div 
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-out fade-out duration-700"
          style={{ left: `${sourceShockwave.x}px`, top: `${sourceShockwave.y}px` }}
        >
          <div className="w-48 h-48 rounded-full border-2 border-amber-400 animate-ping opacity-75" />
          <div className="w-32 h-32 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FLYING BADGE EMBLEM NODE (Animated via Web Animations API)
         ───────────────────────────────────────────────────────────── */}
      <div
        ref={badgeFlyerRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 rounded-full bg-amber-400/40 blur-xl animate-pulse" />
          <BadgeEmblem
            iconGraphic={badge.iconGraphic}
            tier={badge.tier}
            isEarned={true}
            size={88}
            className="drop-shadow-[0_15px_30px_rgba(245,158,11,0.9)]"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FLYING +XP REWARD ORB NODE (Animated via Web Animations API)
         ───────────────────────────────────────────────────────────── */}
      <div
        ref={xpFlyerRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none"
      >
        <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1E1B18] via-[#161426] to-[#121E18] border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.7)] text-emerald-300 font-black font-mono text-sm tracking-wider">
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300">
            +{badge.xpReward} XP
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. DESTINATION 1: TOP BADGES WIDGET IMPACT FLARE
         ───────────────────────────────────────────────────────────── */}
      {badgeImpactPos && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center animate-out fade-out duration-500"
          style={{ left: `${badgeImpactPos.x}px`, top: `${badgeImpactPos.y}px` }}
        >
          <div className="w-36 h-36 rounded-full border-2 border-amber-300 animate-ping opacity-90" />
          <div className="w-48 h-48 rounded-full border border-indigo-400 animate-ping opacity-60 delay-75" />
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360;
            const dist = 40;
            const x = Math.cos(angle * Math.PI / 180) * dist;
            const y = Math.sin(angle * Math.PI / 180) * dist;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  boxShadow: '0 0 10px rgba(245,158,11,1)'
                }}
              />
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. DESTINATION 2: PROFILE XP WIDGET IMPACT FLARE
         ───────────────────────────────────────────────────────────── */}
      {xpImpactPos && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center animate-out fade-out duration-600"
          style={{ left: `${xpImpactPos.x}px`, top: `${xpImpactPos.y}px` }}
        >
          <div className="w-40 h-20 rounded-2xl border-2 border-emerald-400 animate-ping opacity-90" />
          <div className="w-56 h-28 rounded-full bg-emerald-400/25 blur-xl animate-pulse" />
          <div className="absolute -top-8 text-xl font-black font-mono text-emerald-300 animate-out slide-out-to-top-8 fade-out duration-600 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]">
            +{badge.xpReward} XP GAINED!
          </div>
        </div>
      )}

    </div>
  );
};

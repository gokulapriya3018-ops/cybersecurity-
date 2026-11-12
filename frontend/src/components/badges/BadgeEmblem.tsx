import React from 'react';
import { Lock } from 'lucide-react';

export interface BadgeEmblemProps {
  iconGraphic: string;
  tier: string; // 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  isEarned?: boolean;
  size?: number; // pixel width/height (default 96)
  className?: string;
}

export const BadgeEmblem: React.FC<BadgeEmblemProps> = ({
  iconGraphic,
  tier,
  isEarned = true,
  size = 96,
  className = ''
}) => {
  // Color themes based on Tier
  const tierThemes: Record<string, { stroke: string; glow: string; fill: string; outerRing: string }> = {
    BRONZE: {
      stroke: '#CD7F32',
      glow: '#B87333',
      fill: '#2A1810',
      outerRing: 'url(#bronzeGrad)'
    },
    SILVER: {
      stroke: '#94A3B8',
      glow: '#38BDF8',
      fill: '#0F172A',
      outerRing: 'url(#silverGrad)'
    },
    GOLD: {
      stroke: '#F59E0B',
      glow: '#FBBF24',
      fill: '#241802',
      outerRing: 'url(#goldGrad)'
    },
    PLATINUM: {
      stroke: '#A855F7',
      glow: '#C084FC',
      fill: '#1E1035',
      outerRing: 'url(#platGrad)'
    },
    DIAMOND: {
      stroke: '#06B6D4',
      glow: '#22D3EE',
      fill: '#082535',
      outerRing: 'url(#diamondGrad)'
    }
  };

  const theme = tierThemes[tier] || tierThemes.BRONZE;

  // Render specific emblem graphic inside the hexagon
  const renderEmblemIcon = () => {
    switch (iconGraphic) {
      case 'first-blood':
        return (
          <g>
            {/* Target Crosshair */}
            <circle cx="50" cy="50" r="22" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.6" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="#EF4444" strokeWidth="2.5" />
            <line x1="50" y1="22" x2="50" y2="78" stroke="#EF4444" strokeWidth="2" strokeDasharray="3,3" />
            <line x1="22" y1="50" x2="78" y2="50" stroke="#EF4444" strokeWidth="2" strokeDasharray="3,3" />
            {/* Blood Dagger */}
            <path d="M50 30 L55 45 L50 62 L45 45 Z" fill="#DC2626" filter="url(#dropGlow)" />
            <path d="M48 62 L52 62 L50 72 Z" fill="#991B1B" />
            <circle cx="50" cy="74" r="3" fill="#EF4444" filter="url(#dropGlow)" />
          </g>
        );

      case 'sqli-novice':
        return (
          <g>
            {/* Database cylinders with crack */}
            <ellipse cx="50" cy="34" rx="20" ry="7" fill="#0D9488" />
            <path d="M30 34 V48 C30 52 70 52 70 48 V34 Z" fill="#0F766E" />
            <ellipse cx="50" cy="48" rx="20" ry="7" fill="#14B8A6" opacity="0.7" />
            <path d="M30 48 V62 C30 66 70 66 70 62 V48 Z" fill="#115E59" />
            <ellipse cx="50" cy="62" rx="20" ry="7" fill="#2DD4BF" opacity="0.5" />
            {/* Injected crack line */}
            <path d="M42 36 L53 47 L46 54 L58 64" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#dropGlow)" />
          </g>
        );

      case 'sqli-master':
        return (
          <g>
            {/* Database core */}
            <ellipse cx="50" cy="38" rx="22" ry="7" fill="#CA8A04" />
            <path d="M28 38 V64 C28 69 72 69 72 64 V38 Z" fill="#A16207" />
            <ellipse cx="50" cy="64" rx="22" ry="7" fill="#EAB308" />
            {/* Radiant Syringe */}
            <path d="M34 26 L44 36 L64 16 L54 6 Z" fill="#FACC15" filter="url(#dropGlow)" />
            <line x1="44" y1="36" x2="52" y2="44" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
            {/* Exploding sparks */}
            <circle cx="50" cy="52" r="4" fill="#FEF08A" filter="url(#dropGlow)" />
            <circle cx="38" cy="56" r="2" fill="#FACC15" />
            <circle cx="62" cy="56" r="2" fill="#FACC15" />
          </g>
        );

      case 'xss-apprentice':
        return (
          <g>
            {/* Tag brackets < / > */}
            <path d="M38 36 L26 50 L38 64" fill="none" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#dropGlow)" />
            <path d="M62 36 L74 50 L62 64" fill="none" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#dropGlow)" />
            <line x1="54" y1="34" x2="46" y2="66" stroke="#C084FC" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="#F472B6" filter="url(#dropGlow)" />
          </g>
        );

      case 'xss-slayer':
        return (
          <g>
            {/* Shield with sword */}
            <path d="M50 24 L68 32 C68 52 50 68 50 68 C50 68 32 52 32 32 Z" fill="#581C87" stroke="#C084FC" strokeWidth="2" />
            {/* Gleaming Sword */}
            <path d="M50 20 L50 62" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" filter="url(#dropGlow)" />
            <line x1="40" y1="32" x2="60" y2="32" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="20" r="2" fill="#FFFFFF" />
          </g>
        );

      case 'cookie-monster':
        return (
          <g>
            {/* Binary Cookie with a bite */}
            <path d="M50 26 C63 26 74 37 74 50 C74 53 71 55 68 53 C65 51 61 54 62 58 C63 62 59 66 55 64 C51 62 48 66 51 70 C47 73 40 73 36 71 C26 65 22 51 28 39 C33 31 41 26 50 26 Z" fill="#92400E" stroke="#D97706" strokeWidth="2" filter="url(#dropGlow)" />
            {/* Choc chip bits */}
            <circle cx="42" cy="40" r="3" fill="#451A03" />
            <circle cx="52" cy="44" r="2.5" fill="#451A03" />
            <circle cx="38" cy="54" r="3" fill="#451A03" />
            <circle cx="48" cy="58" r="2" fill="#451A03" />
            <circle cx="68" cy="42" r="2" fill="#FEF3C7" opacity="0.8" />
          </g>
        );

      case 'waf-bypass':
        return (
          <g>
            {/* Firewall grid */}
            <rect x="30" y="32" width="40" height="34" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
            <line x1="30" y1="43" x2="70" y2="43" stroke="#047857" strokeWidth="1.5" />
            <line x1="30" y1="55" x2="70" y2="55" stroke="#047857" strokeWidth="1.5" />
            <line x1="50" y1="32" x2="50" y2="43" stroke="#047857" strokeWidth="1.5" />
            <line x1="40" y1="43" x2="40" y2="55" stroke="#047857" strokeWidth="1.5" />
            <line x1="60" y1="43" x2="60" y2="55" stroke="#047857" strokeWidth="1.5" />
            {/* Electric Bypass Slash */}
            <path d="M28 66 L52 46 L46 42 L72 26" stroke="#34D399" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#dropGlow)" />
          </g>
        );

      case 'fast-learner':
        return (
          <g>
            {/* Speed lightning flame */}
            <path d="M52 22 L34 46 L48 46 L42 74 L64 48 L50 48 Z" fill="#F59E0B" stroke="#FBBF24" strokeWidth="2" filter="url(#dropGlow)" />
            <circle cx="50" cy="48" r="3" fill="#FFFFFF" />
          </g>
        );

      case 'web-defender':
        return (
          <g>
            {/* Castle fortress crest */}
            <path d="M50 22 L72 32 C72 56 50 74 50 74 C50 74 28 56 28 32 Z" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2.5" />
            {/* Crossed swords */}
            <line x1="36" y1="34" x2="64" y2="62" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            <line x1="64" y1="34" x2="36" y2="62" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="48" r="4" fill="#93C5FD" filter="url(#dropGlow)" />
          </g>
        );

      case 'second-order':
        return (
          <g>
            {/* Amethyst Spectre */}
            <path d="M50 24 C40 24 32 32 32 44 C32 58 36 66 38 72 C40 70 44 72 46 68 C48 72 52 72 54 68 C56 72 60 70 62 72 C64 66 68 58 68 44 C68 32 60 24 50 24 Z" fill="#6B21A8" stroke="#A855F7" strokeWidth="2" filter="url(#dropGlow)" />
            {/* Glowing phantom eyes */}
            <ellipse cx="44" cy="40" rx="3" ry="4" fill="#F43F5E" filter="url(#dropGlow)" />
            <ellipse cx="56" cy="40" rx="3" ry="4" fill="#F43F5E" filter="url(#dropGlow)" />
          </g>
        );

      case 'dual-threat':
        return (
          <g>
            {/* Split dual element: Blue (SQLi) & Purple (XSS) */}
            <path d="M50 22 L50 78 L26 64 L26 36 Z" fill="#0369A1" opacity="0.9" />
            <path d="M50 22 L74 36 L74 64 L50 78 Z" fill="#7E22CE" opacity="0.9" />
            {/* Lightning connector */}
            <path d="M48 28 L54 44 L44 50 L52 68" stroke="#38BDF8" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#dropGlow)" />
            <circle cx="50" cy="48" r="4" fill="#F472B6" filter="url(#dropGlow)" />
          </g>
        );

      case 'grandmaster':
        return (
          <g>
            {/* Royal Diamond Crown */}
            <path d="M30 62 L32 40 L42 50 L50 32 L58 50 L68 40 L70 62 Z" fill="#0891B2" stroke="#22D3EE" strokeWidth="2.5" filter="url(#dropGlow)" />
            <circle cx="50" cy="30" r="3.5" fill="#FEF08A" filter="url(#dropGlow)" />
            <circle cx="32" cy="38" r="2.5" fill="#FEF08A" />
            <circle cx="68" cy="38" r="2.5" fill="#FEF08A" />
            {/* Laurel wreath base */}
            <ellipse cx="50" cy="66" rx="20" ry="4" fill="#F59E0B" />
          </g>
        );

      default:
        return (
          <circle cx="50" cy="50" r="14" fill="#6366F1" filter="url(#dropGlow)" />
        );
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transition-all duration-300 ${
          isEarned ? 'filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]' : 'opacity-40 grayscale contrast-125'
        }`}
      >
        <defs>
          {/* Metallic Gradients */}
          <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E29E65" />
            <stop offset="40%" stopColor="#A85721" />
            <stop offset="70%" stopColor="#69300D" />
            <stop offset="100%" stopColor="#C9783E" />
          </linearGradient>

          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#94A3B8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#854D0E" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>

          <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D0FE" />
            <stop offset="40%" stopColor="#A855F7" />
            <stop offset="75%" stopColor="#581C87" />
            <stop offset="100%" stopColor="#D8B4FE" />
          </linearGradient>

          <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="40%" stopColor="#06B6D4" />
            <stop offset="75%" stopColor="#164E63" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>

          <linearGradient id="innerShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={theme.glow} floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Outer Hexagon (Thick Metallic Faceted Bevel) */}
        <polygon
          points="50,2 93.3,27 93.3,73 50,98 6.7,73 6.7,27"
          fill={theme.outerRing}
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Facet Inset Rim */}
        <polygon
          points="50,6 89,29 89,71 50,94 11,71 11,29"
          fill="#0D0D14"
          stroke={theme.stroke}
          strokeWidth="1"
        />

        {/* Inner Colored Core */}
        <polygon
          points="50,9 85,31 85,69 50,91 15,69 15,31"
          fill={theme.fill}
        />

        {/* Specular Top Shine Highlight */}
        <polygon
          points="50,9 85,31 85,50 50,55 15,50 15,31"
          fill="url(#innerShine)"
        />

        {/* Inner Graphic Emblem */}
        {renderEmblemIcon()}

        {/* Subtle Facet Lines */}
        <line x1="50" y1="2" x2="50" y2="9" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="93.3" y1="27" x2="85" y2="31" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="93.3" y1="73" x2="85" y2="69" stroke="#000000" strokeOpacity="0.6" strokeWidth="1" />
        <line x1="50" y1="98" x2="50" y2="91" stroke="#000000" strokeOpacity="0.6" strokeWidth="1" />
        <line x1="6.7" y1="73" x2="15" y2="69" stroke="#000000" strokeOpacity="0.6" strokeWidth="1" />
        <line x1="6.7" y1="27" x2="15" y2="31" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" />
      </svg>

      {/* Lock Overlay for Locked Badges */}
      {!isEarned && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-slate-400 shadow-xl backdrop-blur-sm">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';

interface DragonLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const DragonLogo: React.FC<DragonLogoProps> = ({ size = 28, className = '', glow = false }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${glow ? 'filter drop-shadow-[0_0_12px_rgba(230,57,70,0.6)]' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-current transition-transform duration-300 group-hover:scale-105"
      >
        {/* Dragon Shield / Back Silhouette */}
        <path
          d="M50 5 L88 22 C88 58 50 92 50 95 C50 92 12 58 12 22 Z"
          fill="url(#dragon_shield_grad)"
          stroke="#e63946"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Dragon Horns & Head */}
        <path
          d="M32 28 C36 16 46 12 48 10 C46 16 45 22 43 28 Z"
          fill="#d4af37"
        />
        <path
          d="M68 28 C64 16 54 12 52 10 C54 16 55 22 57 28 Z"
          fill="#d4af37"
        />
        
        {/* Dragon Snout & Brow */}
        <path
          d="M50 24 L60 38 L57 56 L50 62 L43 56 L40 38 Z"
          fill="#1c1f26"
          stroke="#e63946"
          strokeWidth="2"
        />

        {/* Dragon Eyes (Glowing Gold / Ruby) */}
        <circle cx="45" cy="40" r="2.5" fill="#d4af37" />
        <circle cx="55" cy="40" r="2.5" fill="#d4af37" />

        {/* Dragon Nose & Fang details */}
        <path d="M47 52 L50 49 L53 52" stroke="#e63946" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M46 56 L48 60 L50 56 L52 60 L54 56" fill="#e2e8f0" />

        {/* Draconic Rune Crest */}
        <circle cx="50" cy="74" r="5" stroke="#d4af37" strokeWidth="1.5" />
        <path d="M50 70 L50 78 M46 74 L54 74" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />

        <defs>
          <linearGradient id="dragon_shield_grad" x1="12" y1="5" x2="88" y2="95" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a1012" />
            <stop offset="0.5" stopColor="#12141a" />
            <stop offset="1" stopColor="#0d0f12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

import React from 'react';

interface SinkiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const SinkiLogo: React.FC<SinkiLogoProps> = ({
  size = 'lg',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const titleSizes = {
    sm: 'text-lg tracking-[0.2em]',
    md: 'text-2xl tracking-[0.25em]',
    lg: 'text-3xl tracking-[0.3em]',
    xl: 'text-4xl tracking-[0.35em]',
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Golden Lotus / S Stylized Emblem */}
      <div className={`relative ${iconSizes[size]} mb-2 filter drop-shadow-[0_4px_12px_rgba(212,163,89,0.35)]`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="25%" stopColor="#E5B55D" />
              <stop offset="60%" stopColor="#C9933B" />
              <stop offset="100%" stopColor="#87581B" />
            </linearGradient>
            <linearGradient id="goldHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C9933B" stopOpacity="0.1" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Stylized 'S' Petal Loop */}
          <path
            d="M60 12C60 12 72 32 72 48C72 62 58 68 50 76C42 84 46 96 60 98C74 100 84 88 84 88C84 88 74 104 58 104C42 104 32 90 34 76C36 62 52 54 60 46C68 38 66 22 60 12Z"
            fill="url(#goldGradient)"
            stroke="url(#goldHighlight)"
            strokeWidth="0.8"
          />

          {/* Left Floral Petal */}
          <path
            d="M54 28C54 28 38 38 32 54C26 68 32 84 46 92C36 86 24 74 24 58C24 44 38 32 54 28Z"
            fill="url(#goldGradient)"
            opacity="0.95"
          />

          {/* Right Floral Petal */}
          <path
            d="M66 28C66 28 82 38 88 54C94 68 88 84 74 92C84 86 96 74 96 58C96 44 82 32 66 28Z"
            fill="url(#goldGradient)"
            opacity="0.95"
          />

          {/* Lower Outer Curved Wings */}
          <path
            d="M26 64C34 78 48 88 64 88C48 86 36 76 26 64Z"
            fill="url(#goldGradient)"
            opacity="0.8"
          />
          <path
            d="M94 64C86 78 72 88 56 88C72 86 84 76 94 64Z"
            fill="url(#goldGradient)"
            opacity="0.8"
          />

          {/* Top Center Crown Peak */}
          <path
            d="M60 8L65 20H55L60 8Z"
            fill="url(#goldGradient)"
          />
        </svg>
      </div>

      {/* SINKI Wordmark */}
      <h1 className={`font-display font-bold gold-gradient-text ${titleSizes[size]} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
        SINKI
      </h1>

      {showSubtitle && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-amber-200/90 uppercase">
            Eau de Parfum
          </p>
          <p className="text-[8px] md:text-[9px] tracking-[0.2em] text-amber-400/60 uppercase font-medium">
            Amber Wood & Spice
          </p>
        </div>
      )}
    </div>
  );
};

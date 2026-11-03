import React from 'react';

interface PerfumeBottleIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const PerfumeBottleIcon: React.FC<PerfumeBottleIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.9,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Penutup botol parfum mewah (Cap/Stopper) */}
      <rect x="9.5" y="2" width="5" height="3.8" rx="0.9" />

      {/* Leher botol & cincin atomizer emas */}
      <path d="M10.5 5.8v2.2h3v-2.2" />
      <path d="M8.5 8h7" />

      {/* Flacon kaca utama (Perfume Bottle Body) */}
      <rect x="5.5" y="8" width="13" height="13.5" rx="2.5" />

      {/* Level bibit sari aroma / garis label elegan */}
      <path d="M9 14h6" strokeOpacity="0.55" strokeWidth={strokeWidth * 0.8} />
    </svg>
  );
};

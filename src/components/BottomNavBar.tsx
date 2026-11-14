import React from 'react';
import { Home, LayoutGrid, ShoppingBag, MessageSquareText } from 'lucide-react';
import { PerfumeBottleIcon } from './PerfumeBottleIcon';
import { playInteractionSound } from '../utils/soundEngine';
import { LuxuryThemeId } from '../utils/themeStorage';

export type TabType = 'home' | 'collection' | 'match' | 'order' | 'review';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  orderCount?: number;
  themeId?: LuxuryThemeId | string;
}

const Botanical3DNavIcon: React.FC<{ id: TabType; isActive: boolean }> = ({ id, isActive }) => {
  const glowClass = isActive
    ? 'drop-shadow-[0_2px_8px_rgba(255,244,200,0.65)] scale-[1.06]'
    : 'drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)] opacity-95 group-hover:opacity-100';

  switch (id) {
    case 'home':
      return (
        <svg viewBox="0 0 32 32" className={`w-[22px] h-[22px] transition-transform duration-200 ${glowClass}`} aria-hidden="true">
          <defs>
            <linearGradient id="bnHomeRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="50%" stopColor="#E6C36C" />
              <stop offset="100%" stopColor="#A67C2E" />
            </linearGradient>
            <linearGradient id="bnHomeWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8E2A0" />
              <stop offset="100%" stopColor="#B88E3D" />
            </linearGradient>
          </defs>
          <path d="M4.5 14.5L16 5L27.5 14.5H24.5V25.5C24.5 26.3 23.8 27 23 27H9C8.2 27 7.5 26.3 7.5 25.5V14.5H4.5Z" fill="url(#bnHomeWall)" />
          <path d="M3.2 15.2L16 4.4L28.8 15.2L26.8 17.1L16 8.2L5.2 17.1L3.2 15.2Z" fill="url(#bnHomeRoof)" />
          <rect x="13.2" y="17.5" width="5.6" height="9.5" rx="1.2" fill="#2A4A2E" stroke="#FFF4CE" strokeWidth="0.9" />
          <circle cx="17.3" cy="22.3" r="0.7" fill="#FFF7D6" />
        </svg>
      );

    case 'collection':
      return (
        <svg viewBox="0 0 32 32" className={`w-[22px] h-[22px] transition-transform duration-200 ${glowClass}`} aria-hidden="true">
          <defs>
            <linearGradient id="bnGridGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E0" />
              <stop offset="45%" stopColor="#E6C770" />
              <stop offset="100%" stopColor="#9C7A2D" />
            </linearGradient>
            <linearGradient id="bnGridInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="55%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <rect x="5" y="5" width="9.5" height="9.5" rx="2.2" fill="url(#bnGridGold)" />
          <rect x="6.5" y="6.5" width="6.5" height="6.5" rx="1.2" fill="url(#bnGridInner)" />
          <rect x="17.5" y="5" width="9.5" height="9.5" rx="2.2" fill="url(#bnGridGold)" />
          <rect x="19" y="6.5" width="6.5" height="6.5" rx="1.2" fill="url(#bnGridInner)" />
          <rect x="5" y="17.5" width="9.5" height="9.5" rx="2.2" fill="url(#bnGridGold)" />
          <rect x="6.5" y="19" width="6.5" height="6.5" rx="1.2" fill="url(#bnGridInner)" />
          <rect x="17.5" y="17.5" width="9.5" height="9.5" rx="2.2" fill="url(#bnGridGold)" />
          <rect x="19" y="19" width="6.5" height="6.5" rx="1.2" fill="url(#bnGridInner)" />
        </svg>
      );

    case 'match':
      return (
        <svg viewBox="0 0 32 32" className={`w-[23px] h-[23px] transition-transform duration-200 ${glowClass}`} aria-hidden="true">
          <defs>
            <linearGradient id="bnBottleCap" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="50%" stopColor="#E5C068" />
              <stop offset="100%" stopColor="#9A7228" />
            </linearGradient>
            <linearGradient id="bnBottleGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>
          <rect x="12" y="3.5" width="8" height="4.8" rx="1.2" fill="url(#bnBottleCap)" />
          <rect x="13.3" y="8.2" width="5.4" height="2.4" fill="#D4AF5A" />
          <rect x="7" y="10.5" width="18" height="17" rx="4" fill="url(#bnBottleGlass)" stroke="#F6E3A6" strokeWidth="1.3" />
          <rect x="10.2" y="13.5" width="4.2" height="11" rx="1.6" fill="#FFFFFF" opacity="0.22" />
          <rect x="11.5" y="17.5" width="9" height="4.8" rx="1" fill="#FFF7DC" opacity="0.88" />
        </svg>
      );

    case 'order':
      return (
        <svg viewBox="0 0 32 32" className={`w-[22px] h-[22px] transition-transform duration-200 ${glowClass}`} aria-hidden="true">
          <defs>
            <linearGradient id="bnCartGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="50%" stopColor="#E6C36C" />
              <stop offset="100%" stopColor="#A67C2E" />
            </linearGradient>
          </defs>
          <path d="M4 6.5H8.2L10.8 19.5H24.2L27 10H9.4" fill="none" stroke="url(#bnCartGold)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.4 11.2H25.2L23.2 18.2H11.6L10.4 11.2Z" fill="#22C55E" opacity="0.65" />
          <path d="M13 13.5H22.5M12.5 16H21.8" stroke="#FFF9E0" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="12.5" cy="24.5" r="2.2" fill="url(#bnCartGold)" />
          <circle cx="22.5" cy="24.5" r="2.2" fill="url(#bnCartGold)" />
        </svg>
      );

    case 'review':
      return (
        <svg viewBox="0 0 32 32" className={`w-[22px] h-[22px] transition-transform duration-200 ${glowClass}`} aria-hidden="true">
          <defs>
            <linearGradient id="bnDocGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8DE" />
              <stop offset="50%" stopColor="#E5C068" />
              <stop offset="100%" stopColor="#9E7628" />
            </linearGradient>
          </defs>
          <rect x="6.5" y="4.5" width="19" height="23" rx="3.2" fill="url(#bnDocGold)" />
          <rect x="8.8" y="6.8" width="14.4" height="18.4" rx="1.8" fill="#1A4D2E" />
          <rect x="11" y="10" width="10" height="2.2" rx="1.1" fill="#A7F3D0" />
          <rect x="11" y="14.5" width="10" height="2.2" rx="1.1" fill="#FDE68A" />
          <rect x="11" y="19" width="7" height="2.2" rx="1.1" fill="#A7F3D0" />
        </svg>
      );
  }
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  orderCount = 0,
  themeId,
}) => {
  const isBotanical = themeId === 'botanical-crystal';

  const navItems = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'collection' as TabType,
      label: 'Collection',
      icon: LayoutGrid,
    },
    {
      id: 'match' as TabType,
      label: 'Racik Aroma',
      icon: PerfumeBottleIcon,
    },
    {
      id: 'order' as TabType,
      label: 'Order',
      icon: ShoppingBag,
      count: orderCount,
    },
    {
      id: 'review' as TabType,
      label: 'Review',
      icon: MessageSquareText,
    },
  ];

  if (isBotanical) {
    return (
      <nav
        aria-label="Navigasi Utama SINKI"
        className="absolute left-0 right-0 z-50 max-w-[408px] mx-auto px-3 pointer-events-none select-none transition-all duration-300"
        style={{
          bottom: 'calc(0.95rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="pointer-events-auto relative rounded-[26px] backdrop-blur-xl border p-1.5 flex items-center justify-between gap-1 overflow-visible"
          style={{
            background:
              'linear-gradient(180deg, rgba(10, 26, 16, 0.72) 0%, rgba(5, 14, 9, 0.86) 100%)',
            borderColor: 'rgba(229, 210, 154, 0.58)',
            boxShadow:
              '0 10px 26px rgba(0, 0, 0, 0.74), inset 0 1px 0 0 rgba(255, 248, 224, 0.34)',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playInteractionSound('digitalSoft');
                  onTabChange(item.id);
                }}
                style={
                  isActive
                    ? {
                        background:
                          'radial-gradient(96% 96% at 50% 0%, rgba(235, 214, 152, 0.24) 0%, rgba(235, 214, 152, 0.08) 54%, rgba(10, 28, 17, 0.65) 100%)',
                        boxShadow:
                          'inset 0 1px 0 0 rgba(255, 248, 224, 0.45)',
                      }
                    : undefined
                }
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[20px] transition-all duration-200 ease-out group active:scale-95 focus:outline-none border ${
                  isActive
                    ? 'border-[#E5D29A]/55'
                    : 'border-transparent hover:bg-white/[0.06]'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full blur-sm opacity-45"
                    style={{ backgroundColor: 'rgba(235, 214, 152, 0.55)' }}
                  />
                )}

                <div className="relative flex items-center justify-center">
                  <Botanical3DNavIcon id={item.id} isActive={isActive} />

                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="font-body tabular-nums absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full leading-none shadow-md bg-[#FFF3CE] text-[#09180F] border border-[#E5D29A]">
                      {item.count}
                    </span>
                  )}
                </div>

                <span
                  className={`font-body text-[10.5px] min-[380px]:text-[11px] leading-tight tracking-[0.01em] mt-1 transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'font-semibold text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.92)]'
                      : 'font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[2px] inset-x-3 h-[3px] rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, #F4E0A2 18%, #FFFFFF 50%, #F4E0A2 82%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255, 249, 224, 0.95)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navigasi Utama SINKI"
      className="absolute left-0 right-0 z-50 max-w-[400px] mx-auto px-3.5 pointer-events-none select-none transition-all duration-300"
      style={{
        bottom: 'calc(1.15rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Wadah Bilah Navigasi: Luxury Architectural Floating Dock dengan elevasi anggun */}
      <div className="pointer-events-auto relative rounded-[14px] sinki-arch-bar backdrop-blur-2xl border p-1.5 flex items-center justify-between gap-1 shadow-[0_12px_40px_rgba(0,0,0,0.78),0_4px_16px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isMatchTab = item.id === 'match';
          const Icon = item.icon;
          if (!Icon) return null;

          const iconSize = isMatchTab ? (isActive ? 23 : 21) : 18;

          return (
            <button
              key={item.id}
              onClick={() => {
                playInteractionSound('digitalSoft');
                onTabChange(item.id);
              }}
              style={
                isActive
                  ? {
                      background:
                        'radial-gradient(85% 90% at 50% 105%, var(--arch-glow-tl) 0%, transparent 72%)',
                    }
                  : undefined
              }
              className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-[8px] transition-all duration-200 ease-out group active:scale-95 focus:outline-none bg-transparent hover:bg-white/[0.04] border border-transparent"
            >
              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                {/* Glow lembut hanya menyala saat tab Racik Aroma AKTIF */}
                {isMatchTab && isActive && (
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: 'var(--arch-badge-bg)' }}
                    className="absolute inset-0 -m-1.5 rounded-full blur-md opacity-100 pointer-events-none"
                  />
                )}

                <Icon
                  size={iconSize}
                  className={`relative transition-all duration-200 ease-out ${
                    isActive
                      ? 'text-[var(--arch-text-accent-bright)] drop-shadow-[0_1px_6px_var(--arch-glow-tl)]'
                      : 'text-white/62 group-hover:text-white/90'
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.8}
                />

                {/* Order Count Badge */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="font-body tabular-nums absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-[4px] leading-none shadow-sm bg-[var(--arch-text-accent-bright)] text-slate-950">
                    {item.count}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-body text-[10px] min-[360px]:text-[10.5px] min-[390px]:text-[11px] leading-tight tracking-[0.01em] mt-0.5 transition-colors duration-200 ease-out whitespace-nowrap ${
                  isActive
                    ? 'font-semibold text-[var(--arch-text-accent-bright)] drop-shadow-sm'
                    : 'font-medium text-white/62 group-hover:text-white/90'
                }`}
              >
                {item.label}
              </span>

              {/* Luminous Bottom Edge Bar pada Tab Aktif */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-[6px] inset-x-1.5 h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, var(--arch-gold) 20%, var(--arch-gold-soft) 50%, var(--arch-gold) 80%, transparent 100%)',
                    boxShadow: '0 -1px 8px var(--arch-gold-bright)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

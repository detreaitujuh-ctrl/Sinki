import React from 'react';
import { Home, LayoutGrid, ShoppingBag, MessageSquareText } from 'lucide-react';
import { PerfumeBottleIcon } from './PerfumeBottleIcon';

export type TabType = 'home' | 'collection' | 'match' | 'order' | 'review';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  orderCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  orderCount = 0,
}) => {
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

  return (
    <nav
      aria-label="Navigasi Utama SINKI"
      className="absolute left-0 right-0 z-50 max-w-md mx-auto px-3.5 pointer-events-none select-none transition-all duration-300"
      style={{
        bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Wadah Bilah Navigasi: Luxury Architectural Bar dengan border tipis Champagne Gold */}
      <div className="pointer-events-auto relative rounded-[10px] sinki-arch-bar backdrop-blur-2xl border p-1.5 flex items-center justify-between gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isMatchTab = item.id === 'match';
          const Icon = item.icon;
          if (!Icon) return null;

          const iconSize = isMatchTab ? (isActive ? 23 : 21) : 18;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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



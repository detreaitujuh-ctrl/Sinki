import React, { useState, useRef } from 'react';
import { Home, LayoutGrid, Compass, ShoppingBag, MessageSquareText } from 'lucide-react';

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
  // Efek Sentuhan/Klik Saja (Smooth Fade-Out 750ms + Gradasi Hitam-Emas)
  const [pulsingTab, setPulsingTab] = useState<TabType | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTabClick = (tabId: TabType) => {
    // Picu animasi kapsul emas menyala seketika
    setPulsingTab(tabId);
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
    }
    // Kapsul memudar perlahan & halus setelah 750ms
    pulseTimerRef.current = setTimeout(() => {
      setPulsingTab(null);
    }, 750);

    onTabChange(tabId);
  };

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
      label: 'Kuis Aroma',
      icon: Compass,
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
      className="fixed bottom-2.5 left-0 right-0 z-50 max-w-md mx-auto px-3.5 pointer-events-none select-none"
    >
      {/* Wadah Bilah Navigasi: Luxury Architectural Bar dengan border tipis Champagne Gold */}
      <div className="pointer-events-auto relative rounded-[10px] sinki-arch-bar backdrop-blur-2xl border p-1.5 flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isPulsing = pulsingTab === item.id;
          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={
                isActive && !isPulsing
                  ? {
                      background:
                        'radial-gradient(85% 90% at 50% 105%, var(--arch-glow-tl) 0%, transparent 72%)',
                    }
                  : undefined
              }
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-[8px] transition-all duration-700 ease-out group active:scale-95 focus:outline-none border ${
                isPulsing
                  ? 'bg-gradient-to-r from-[#382c16] via-[#8c6b29] to-[#D4AF57] text-[#F8EBCB] border-[#D4AF57]/60 shadow-[0_2px_12px_rgba(212,175,87,0.3)] scale-[0.98]'
                  : 'bg-transparent hover:bg-white/5 border-transparent'
              }`}
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon
                  size={18}
                  className={`transition-all duration-700 ease-out ${
                    isPulsing
                      ? 'text-[#F8EBCB]'
                      : isActive
                      ? 'text-[#E8C574] drop-shadow-[0_1px_6px_rgba(232,197,116,0.45)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                  strokeWidth={isPulsing || isActive ? 2.2 : 1.8}
                />

                {/* Order Count Badge */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`font-body tabular-nums absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-[4px] leading-none shadow-sm ${
                      isPulsing
                        ? 'bg-[#D4AF57] text-slate-950'
                        : 'bg-[#D4AF57] text-slate-950'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-body text-[11px] sm:text-[11.5px] leading-tight tracking-[0.01em] mt-0.5 transition-colors duration-700 ease-out whitespace-nowrap ${
                  isPulsing
                    ? 'font-semibold text-[#F8EBCB]'
                    : isActive
                    ? 'font-semibold text-[#E8C574] drop-shadow-sm'
                    : 'font-medium text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>

              {/* Luminous Bottom Edge Bar pada Tab Aktif (Persis Referensi) */}
              {isActive && !isPulsing && (
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



import React, { useState, useRef } from 'react';
import { Home, LayoutGrid, Sparkles, ShoppingBag, MessageSquareText } from 'lucide-react';

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
      label: 'Match',
      icon: Sparkles,
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
      {/* Wadah Bilah Navigasi: Pendaran emas luar dihapus total (bebas silau, pure deep noir shadow) */}
      <div className="pointer-events-auto relative rounded-[26px] bg-[#0d0f18]/95 backdrop-blur-2xl border border-white/12 shadow-[0_14px_45px_rgba(0,0,0,0.95)] p-1.5 flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isPulsing = pulsingTab === item.id;
          const isCenterpiece = item.id === 'match';

          // CENTERPIECE: Aroma Match
          if (isCenterpiece) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-700 ease-out group sinki-cushion-press focus:outline-none border ${
                  isPulsing
                    ? 'bg-gradient-to-r from-[#382c16] via-[#8c6b29] to-[#D4AF57] text-[#F8EBCB] border-[#D4AF57]/60 shadow-[0_2px_12px_rgba(212,175,87,0.3)] scale-[0.98]'
                    : 'bg-transparent hover:bg-white/5 border-transparent'
                }`}
                aria-label="Aroma Match - Rekomendasi Parfum Personal SINKI"
              >
                {/* Icon Container with Sparkles */}
                <div className="relative">
                  <Sparkles
                    size={18}
                    className={`transition-all duration-700 ease-out ${
                      isPulsing
                        ? 'text-[#F8EBCB]'
                        : isActive
                        ? 'text-[#E8C574] drop-shadow-[0_1px_6px_rgba(232,197,116,0.4)]'
                        : 'text-amber-400/80 group-hover:text-amber-300'
                    }`}
                    strokeWidth={isPulsing || isActive ? 2.3 : 1.8}
                  />
                </div>

                {/* Label: Match */}
                <span
                  className={`font-body text-[11px] sm:text-[11.5px] leading-tight tracking-[0.01em] mt-0.5 transition-colors duration-700 ease-out whitespace-nowrap ${
                    isPulsing
                      ? 'font-semibold text-[#F8EBCB]'
                      : isActive
                      ? 'font-semibold text-[#E8C574] drop-shadow-sm'
                      : 'font-medium text-amber-300/85 group-hover:text-amber-200'
                  }`}
                >
                  {item.label}
                </span>

                {/* Indikator Halus Tenang Tab Aktif */}
                {isActive && !isPulsing && (
                  <span className="w-1.5 h-0.5 rounded-full bg-[#E8C574] mt-0.5 shadow-[0_0_4px_rgba(232,197,116,0.6)]" />
                )}
              </button>
            );
          }

          // STANDARD TABS (Home, Collection, Order, Review)
          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-700 ease-out group active:scale-95 focus:outline-none border ${
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
                      ? 'text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.2)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                  strokeWidth={isPulsing || isActive ? 2.2 : 1.8}
                />

                {/* Order Count Badge */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`font-body tabular-nums absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full leading-none shadow-sm ${
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
                    ? 'font-semibold text-white drop-shadow-sm'
                    : 'font-medium text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>

              {/* Indikator Halus Tenang Tab Aktif (Hanya titik tipis, tanpa kapsul emas tebal) */}
              {isActive && !isPulsing && (
                <span className="w-1.5 h-0.5 rounded-full bg-white/70 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};



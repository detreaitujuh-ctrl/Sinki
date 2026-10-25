import React, { useState, useRef, useEffect } from 'react';
import { Home, LayoutGrid, ShoppingBag, MessageSquareText } from 'lucide-react';
import { getStoredTopPerfumes, fetchTopPerfumesFromServer } from '../utils/topPerfumesStorage';

export type TabType = 'home' | 'collection' | 'top11' | 'order' | 'review';

// HAUTE PARFUMERIE: The Golden Nectar Drop (Goutte d'Or - Tetesan Esens Parfum Emas)
const GoldenNectarDropIcon: React.FC<{ isPulsing: boolean; isActive: boolean }> = ({
  isPulsing,
  isActive,
}) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-700 ease-out ${
      isPulsing
        ? 'text-[#F8EBCB]'
        : isActive
        ? 'text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.2)]'
        : 'text-slate-400 group-hover:text-slate-200'
    }`}
    aria-hidden="true"
  >
    {/* Clean Golden Nectar Droplet Contour */}
    <path
      d="M12 2.8C11.3 3.9 5.8 12.2 5.8 15.8C5.8 19.2 8.6 22 12 22C15.4 22 18.2 19.2 18.2 15.8C18.2 12.2 12.7 3.9 12 2.8Z"
      stroke="currentColor"
      strokeWidth={isPulsing || isActive ? 2.3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isPulsing ? 'currentColor' : isActive ? 'currentColor' : 'none'}
      fillOpacity={isPulsing ? '0.2' : isActive ? '0.12' : '0'}
    />
  </svg>
);

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
  // CARA 1: Efek Sentuhan/Klik Saja (Smooth Fade-Out 750ms + Gradasi Hitam-Emas)
  const [pulsingTab, setPulsingTab] = useState<TabType | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [topCount, setTopCount] = useState<number>(() => getStoredTopPerfumes().length);

  useEffect(() => {
    // Sinkronisasi jumlah varian Top dari server / cloud
    fetchTopPerfumesFromServer().then((items) => {
      if (items && Array.isArray(items)) {
        setTopCount(items.length);
      }
    });

    const handleTopUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTopCount(e.detail.length);
      } else {
        setTopCount(getStoredTopPerfumes().length);
      }
    };
    window.addEventListener('sinki_top_perfumes_updated', handleTopUpdate);
    return () => {
      window.removeEventListener('sinki_top_perfumes_updated', handleTopUpdate);
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

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
      id: 'top11' as TabType,
      label: `Top ${topCount}`,
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
          const isCenterpiece = item.id === 'top11';

          // CENTERPIECE: Top 11
          if (isCenterpiece) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-700 ease-out group active:scale-95 focus:outline-none border ${
                  isPulsing
                    ? 'bg-gradient-to-r from-[#382c16] via-[#8c6b29] to-[#D4AF57] text-[#F8EBCB] border-[#D4AF57]/60 shadow-[0_2px_12px_rgba(212,175,87,0.3)] scale-[0.98]'
                    : 'bg-transparent hover:bg-white/5 border-transparent'
                }`}
                aria-label="Koleksi Top 11 SINKI"
              >
                {/* Icon Container with Golden Nectar Droplet */}
                <div className="relative">
                  <GoldenNectarDropIcon isPulsing={isPulsing} isActive={isActive} />
                </div>

                {/* Label: TOP 11 */}
                <span
                  className={`text-[9.5px] font-display tracking-wider uppercase mt-0.5 transition-colors duration-700 ease-out whitespace-nowrap ${
                    isPulsing
                      ? 'font-black text-[#F8EBCB]'
                      : isActive
                      ? 'font-extrabold text-white drop-shadow-sm'
                      : 'font-semibold text-slate-400 group-hover:text-slate-200'
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
          }

          // STANDARD TABS (Home, Collection, Order, Review)
          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-700 ease-out group active:scale-95 focus:outline-none border ${
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
                  strokeWidth={isPulsing || isActive ? 2.3 : 1.8}
                />

                {/* Order Count Badge */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center text-[9px] font-black rounded-full leading-none shadow-sm ${
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
                className={`text-[9.5px] font-display tracking-wider uppercase mt-0.5 transition-colors duration-700 ease-out whitespace-nowrap ${
                  isPulsing
                    ? 'font-black text-[#F8EBCB]'
                    : isActive
                    ? 'font-extrabold text-white drop-shadow-sm'
                    : 'font-semibold text-slate-400 group-hover:text-slate-200'
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



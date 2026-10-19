import React from 'react';
import { Home, LayoutGrid, ShoppingBag, MessageSquareText } from 'lucide-react';

export type TabType = 'home' | 'collection' | 'top11' | 'order' | 'review';

// HAUTE PARFUMERIE: The Golden Nectar Drop (Goutte d'Or - Tetesan Esens Parfum Emas)
const GoldenNectarDropIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-200 ${
      isActive
        ? 'text-[#F0DFB6] drop-shadow-[0_2px_8px_rgba(223,183,108,0.6)]'
        : 'text-slate-400 group-hover:text-slate-200'
    }`}
    aria-hidden="true"
  >
    {/* Clean Golden Nectar Droplet Contour */}
    <path
      d="M12 2.8C11.3 3.9 5.8 12.2 5.8 15.8C5.8 19.2 8.6 22 12 22C15.4 22 18.2 19.2 18.2 15.8C18.2 12.2 12.7 3.9 12 2.8Z"
      stroke="currentColor"
      strokeWidth={isActive ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.15" : "0"}
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
      label: 'Top 11',
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
      <div className="pointer-events-auto relative rounded-[26px] bg-[#0d0f18]/92 backdrop-blur-2xl border border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(197,160,89,0.08)] px-2 py-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isCenterpiece = item.id === 'top11';

          // CENTERPIECE: Top 11 (Clean & In-Line with other menu tabs, no extra light effects)
          if (isCenterpiece) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 group active:scale-95 focus:outline-none"
                aria-label="Koleksi Top 11 SINKI"
              >
                {/* Parisian Spotlight Aura when Active */}
                {isActive && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-b from-[#DFB76C]/15 to-transparent rounded-2xl pointer-events-none border border-[#DFB76C]/25"
                    aria-hidden="true"
                  />
                )}

                {/* Icon Container with Golden Nectar Droplet (Sejajar dengan icon menu lain) */}
                <div className="relative">
                  <GoldenNectarDropIcon isActive={isActive} />
                </div>

                {/* Unified Label: TOP 11 (Sejajar 100% dengan Home, Collection, Order, Review) */}
                <span
                  className={`text-[9.5px] font-display tracking-wider uppercase mt-1 transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'font-black text-[#F0DFB6]'
                      : 'font-semibold text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Golden Gem Indicator Dot (Sejajar dengan tab lain) */}
                {isActive && (
                  <span className="w-1.5 h-0.5 rounded-full bg-gradient-to-r from-[#DFB76C] to-[#F0DFB6] mt-0.5 shadow-[0_0_6px_rgba(223,183,108,0.8)]" />
                )}
              </button>
            );
          }

          // STANDARD TABS (Home, Collection, Order, Review) with Parisian Spotlight Aura
          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 group active:scale-95 focus:outline-none"
            >
              {/* Parisian Spotlight Aura when Active */}
              {isActive && (
                <span 
                  className="absolute inset-0 bg-gradient-to-b from-[#DFB76C]/15 to-transparent rounded-2xl pointer-events-none border border-[#DFB76C]/25"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container */}
              <div className="relative">
                <Icon
                  size={19}
                  className={`transition-all duration-200 ${
                    isActive
                      ? 'text-[#F0DFB6] drop-shadow-[0_2px_8px_rgba(223,183,108,0.6)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                {/* Order Count Badge */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center text-[9px] font-black text-slate-950 bg-[#DFB76C] rounded-full leading-none shadow-sm">
                    {item.count}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9.5px] font-display tracking-wider uppercase mt-1 transition-colors duration-200 whitespace-nowrap ${
                  isActive
                    ? 'font-black text-[#F0DFB6]'
                    : 'font-semibold text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>

              {/* Active Golden Gem Indicator Dot */}
              {isActive && (
                <span className="w-1.5 h-0.5 rounded-full bg-gradient-to-r from-[#DFB76C] to-[#F0DFB6] mt-0.5 shadow-[0_0_6px_rgba(223,183,108,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

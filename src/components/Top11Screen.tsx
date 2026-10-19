import React, { useState, useEffect, useRef } from 'react';
import { Crown, MessageCircle, ChevronLeft, ChevronRight, LayoutGrid, Clock, Flame, ArrowLeft, Heart } from 'lucide-react';
import { TOP_11_DATA, Top11Item } from '../data/top11';
import { PerfumeBottleVisual, loadedPhotoSet } from './PerfumeBottleVisual';
import { PricingConfig, DEFAULT_PRICING, getStoredPricing } from '../utils/pricingStorage';

interface Top11ScreenProps {
  top11Photos: Record<string, string>;
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
  isActive?: boolean;
  pricing?: PricingConfig;
}

export const Top11Screen: React.FC<Top11ScreenProps> = ({
  top11Photos,
  onBackToHome,
  onShowToast,
  isActive = false,
  pricing,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');
  const fitMode = 'cover'; // Dikunci permanen ke Mode Penuh sesuai proporsi kotak

  // Swipe Gesture Ref untuk kemudahan geser botol dengan jempol
  const bottleTouchStartX = useRef<number | null>(null);
  const bottleTouchEndX = useRef<number | null>(null);

  const handleBottleTouchStart = (e: React.TouchEvent) => {
    bottleTouchStartX.current = e.targetTouches[0].clientX;
    bottleTouchEndX.current = null;
  };

  const handleBottleTouchMove = (e: React.TouchEvent) => {
    bottleTouchEndX.current = e.targetTouches[0].clientX;
  };

  const handleBottleTouchEnd = () => {
    if (bottleTouchStartX.current === null || bottleTouchEndX.current === null) return;
    const diff = bottleTouchStartX.current - bottleTouchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    bottleTouchStartX.current = null;
    bottleTouchEndX.current = null;
  };

  // Setiap kali masuk ke halaman Top 11, otomatis kembali segar ke Juara #1
  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0);
    }
  }, [isActive]);

  // Preload semua foto botol ke memori browser agar saat digeser atau dibuka muncul instan 0 detik
  useEffect(() => {
    Object.values(top11Photos).forEach((url) => {
      if (url && typeof url === 'string') {
        const img = new Image();
        img.onload = () => loadedPhotoSet.add(url);
        img.src = url;
      }
    });
  }, [top11Photos]);

  // Preload foto botol saat ini, sebelum, dan sesudahnya secara prioritas tinggi
  useEffect(() => {
    const nextIdx = currentIndex < TOP_11_DATA.length - 1 ? currentIndex + 1 : 0;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : TOP_11_DATA.length - 1;
    [TOP_11_DATA[currentIndex], TOP_11_DATA[nextIdx], TOP_11_DATA[prevIdx]].forEach((item) => {
      const url = top11Photos[item.id];
      if (url) {
        const img = new Image();
        img.onload = () => loadedPhotoSet.add(url);
        img.src = url;
      }
    });
  }, [currentIndex, top11Photos]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sinki_top11_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentItem = TOP_11_DATA[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < TOP_11_DATA.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : TOP_11_DATA.length - 1));
  };

  const toggleFavorite = (id: string, name: string) => {
    const exists = favorites.includes(id);
    const updated = exists ? favorites.filter((item) => item !== id) : [...favorites, id];
    try {
      localStorage.setItem('sinki_top11_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setFavorites(updated);
    onShowToast(exists ? `${name} dihapus dari favorit` : `${name} ditambahkan ke favorit ❤️`);
  };

  // Bottle Size Selection (10ml, 15ml, 20ml, 30ml, 50ml, 100ml) - Default 30ml
  const [selectedBottleSize, setSelectedBottleSize] = useState<number>(30);

  // Active pricing config for Top 11 (Option B: Mykonos series vs Premium quality)
  const activePricing = pricing || getStoredPricing();
  const currentPremiumRate = activePricing.premiumRatePerMl || DEFAULT_PRICING.premiumRatePerMl;
  const currentMykonosRate = activePricing.mykonosRatePerMl || DEFAULT_PRICING.mykonosRatePerMl;

  // Option B: Mykonos items (Top #1, #2) use Mykonos rate (Rp 3.000/ml), all other items (Top #3 - #11) use Premium rate (Rp 4.000/ml)
  const getItemPricingInfo = (item: Top11Item, size: number) => {
    const isMykonos = item.id === 'top-1' || item.id === 'top-2' || item.name.toLowerCase().includes('mykonos');
    const ratePerMl = isMykonos ? currentMykonosRate : currentPremiumRate;
    const categoryName = isMykonos ? 'Mykonos Series' : 'Premium Quality';
    const totalPrice = size * ratePerMl;
    return {
      isMykonos,
      ratePerMl,
      categoryName,
      totalPrice,
    };
  };

  const handleOrderWhatsApp = (item: Top11Item, customSize?: number) => {
    const sizeToUse = customSize || selectedBottleSize;
    const info = getItemPricingInfo(item, sizeToUse);

    const message = [
      `*PESANAN PARFUM SINKI - TOP 11*`,
      `------------------------------------------`,
      `• Varian: *Top #${item.rank} - ${item.name}*`,
      `• Tipe: *${item.type}*`,
      `• Kategori: *${info.categoryName} (Rp ${info.ratePerMl.toLocaleString('id-ID')}/ml)*`,
      `• Ukuran Botol: *${sizeToUse}ml*`,
      `• Total Harga: *Rp ${info.totalPrice.toLocaleString('id-ID')}*`,
      `------------------------------------------`,
      `Halo SINKI Parfums, saya ingin memesan parfum Top #${item.rank} di atas. Mohon info ketersediaan & cara pengirimannya ya. Terima kasih!`,
    ].join('\n');

    const url = `https://wa.me/6289636824552?text=${encodeURIComponent(message)}`;
    const win = window.open(url, '_blank');
    if (!win) {
      window.location.href = url;
    }
    onShowToast(`Menghubungkan ke WhatsApp: Top #${item.rank} ${item.name} (${sizeToUse}ml - Rp ${info.totalPrice.toLocaleString('id-ID')})...`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden">
      {/* Dynamic Ambient Background Glow - dibuat sangat tipis & halus */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] opacity-[0.09] pointer-events-none transition-colors duration-500"
        style={{
          backgroundColor:
            viewMode === 'spotlight' ? currentItem.bottleThemeColor : '#F59E0B',
        }}
      />

      {/* TOP HEADER */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 shrink-0 bg-[#0f111a]/95 border-b border-white/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <Crown size={16} className="text-[#C5A059]" />
              <h2 className="font-display text-sm font-extrabold text-white tracking-wider uppercase">
                Top 11 Parfum
              </h2>
            </div>
          </div>

          {/* Toggle View Mode: Spotlight vs Grid */}
          <div className="flex items-center bg-[#12141e] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('spotlight')}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                viewMode === 'spotlight'
                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 shadow-sm font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Spotlight
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 shadow-sm font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid size={11} />
              <span>Semua</span>
            </button>
          </div>
        </div>

        {/* Quick Rank Number Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
          {TOP_11_DATA.map((item, idx) => {
            const isActive = viewMode === 'spotlight' && currentIndex === idx;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setViewMode('spotlight');
                }}
                className={`shrink-0 w-7 h-7 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-br from-[#DFB76C] to-[#A07C3A] text-slate-950 scale-105 shadow-sm font-black'
                    : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                #{item.rank}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-24">
        {/* ==========================================
           VIEW 1: LUXURY SPOTLIGHT HERO CARD VIEW
           ========================================== */}
        <div
          className={`space-y-3.5 transition-opacity duration-200 ${
            viewMode === 'spotlight' ? 'block' : 'hidden'
          }`}
        >
            {/* Spotlight Card with Glassmorphism Border & Deep Royal Charcoal Gradient */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#1e2235]/95 via-[#181a2b]/95 to-[#131524]/95 border border-white/12 hover:border-[#C5A059]/40 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-md transition-colors">
              {/* Top Card Bar: Rank Badge + Heart */}
              {/* Top Card Bar: Rank Badge + Heart & Counter (Bersih & Elegan) */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[9.5px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full border shadow-sm ${currentItem.accentBadge}`}
                >
                  {currentItem.badge}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toggleFavorite(currentItem.id, currentItem.name)
                    }
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-red-400 transition-colors active:scale-90 border border-white/10"
                    title="Favorit"
                  >
                    <Heart
                      size={15}
                      className={
                        favorites.includes(currentItem.id)
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }
                    />
                  </button>

                  <span className="text-[10.5px] font-mono font-bold text-[#DFB76C] bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15 shadow-sm">
                    {currentIndex + 1} / {TOP_11_DATA.length}
                  </span>
                </div>
              </div>

              {/* Perfume Bottle Visual with Navigation Arrows & Touch Swipe Support */}
              <div
                onTouchStart={handleBottleTouchStart}
                onTouchMove={handleBottleTouchMove}
                onTouchEnd={handleBottleTouchEnd}
                className="relative w-full h-56 flex items-center justify-center my-1 select-none cursor-grab active:cursor-grabbing"
              >
                {/* Prev Arrow */}
                <button
                  onClick={handlePrev}
                  className="absolute left-1 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-[#C5A059] hover:text-slate-950 text-slate-100 border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-md"
                  aria-label="Sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Bottle Display (100% Clean Mode Penuh) */}
                <div className="w-52 h-full">
                  <PerfumeBottleVisual
                    item={currentItem}
                    customPhoto={top11Photos[currentItem.id]}
                    size="lg"
                    fitMode="cover"
                  />
                </div>

                {/* Next Arrow */}
                <button
                  onClick={handleNext}
                  className="absolute right-1 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-[#C5A059] hover:text-slate-950 text-slate-100 border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-md"
                  aria-label="Berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 11 Dots Pagination Carousel */}
              <div className="flex items-center justify-center gap-1.5 py-1 mb-1.5 select-none">
                {TOP_11_DATA.map((item, idx) => {
                  const isActiveDot = currentIndex === idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isActiveDot
                          ? 'w-5 bg-gradient-to-r from-[#DFB76C] to-[#C5A059] shadow-[0_0_8px_rgba(223,183,108,0.6)]'
                          : 'w-1.5 bg-white/25 hover:bg-white/45'
                      }`}
                      title={`Peringkat #${idx + 1} - ${item.name}`}
                      aria-label={`Peringkat ${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Title & Subtitle with Pure White Crisp and Soft Champagne Accent */}
              <div className="text-center space-y-1 pt-1 pb-2">
                <span className="text-[9.5px] font-mono uppercase tracking-[0.25em] text-[#DFB76C] font-bold block">
                  {currentItem.type}
                </span>
                <h3 className="font-display text-xl font-black text-white leading-tight drop-shadow-sm">
                  {currentItem.name}
                </h3>
                <p className="text-[11px] text-zinc-300 font-medium italic">
                  “{currentItem.subtitle}”
                </p>
                <p className="text-[10.5px] text-zinc-200 font-medium leading-relaxed pt-1 max-w-xs mx-auto drop-shadow-sm">
                  {currentItem.description}
                </p>
              </div>

              {/* Fragrance Pyramid Notes Breakdown with High Contrast & Calm Aesthetics */}
              <div className="mt-2 p-3.5 rounded-2xl bg-[#121422] border border-white/12 space-y-2 text-[10.5px] shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="w-16 text-[#DFB76C] font-semibold shrink-0">
                    Top Notes:
                  </span>
                  <span className="text-zinc-100 flex-1 font-medium">
                    {currentItem.topNotes}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-16 text-[#DFB76C] font-semibold shrink-0">
                    Heart:
                  </span>
                  <span className="text-zinc-100 flex-1 font-medium">
                    {currentItem.middleNotes}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-16 text-[#DFB76C] font-semibold shrink-0">
                    Base:
                  </span>
                  <span className="text-zinc-100 flex-1 font-medium">
                    {currentItem.baseNotes}
                  </span>
                </div>

                {/* Performance Metrics */}
                <div className="pt-2 border-t border-white/12 flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Clock size={13} />
                    <span>Ketahanan: {currentItem.longevity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                    <Flame size={13} />
                    <span>Sillage: {currentItem.sillage}</span>
                  </div>
                </div>
              </div>

              {/* Bottle Size Selector & Option B Pricing (Pilihan Ukuran Botol & Harga) */}
              <div className="mt-3 p-3 rounded-2xl bg-[#11131c] border border-white/10 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white font-bold flex items-center gap-1.5 tracking-wide">
                    <span>Pilih Ukuran Botol:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15 uppercase tracking-wider">
                      {getItemPricingInfo(currentItem, selectedBottleSize).categoryName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-200 font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {selectedBottleSize}ml
                    </span>
                  </div>
                </div>

                {/* 6 Pilihan Ukuran Botol */}
                <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                  {[10, 15, 20, 30, 50, 100].map((size) => {
                    const isSelected = selectedBottleSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedBottleSize(size)}
                        className={`relative py-1.5 rounded-xl text-center font-mono text-[11px] font-black transition-all active:scale-95 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 border-[#F0DFB6] shadow-sm scale-[1.03]'
                            : size === 30
                            ? 'bg-[#DFB76C]/10 hover:bg-[#DFB76C]/20 text-[#F0DFB6] border-[#DFB76C]/40'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                      >
                        {size}ml
                        {size === 30 && (
                          <span
                            className={`block text-[7px] leading-tight font-sans tracking-tight ${
                              isSelected ? 'text-slate-950 font-black' : 'text-[#DFB76C]'
                            }`}
                          >
                            Favorit
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Real-time Pricing Summary Banner */}
                {(() => {
                  const pricingInfo = getItemPricingInfo(currentItem, selectedBottleSize);
                  return (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-400 text-[10px] block leading-tight">Tarif Resmi:</span>
                        <span className="font-mono text-[11px] text-slate-200 font-semibold">
                          Rp {pricingInfo.ratePerMl.toLocaleString('id-ID')}/ml
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          Total Harga ({selectedBottleSize}ml):
                        </span>
                        <span className="text-base font-extrabold text-[#DFB76C] font-mono tracking-tight drop-shadow-sm">
                          Rp {pricingInfo.totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Order WhatsApp Button: Metallic Champagne Gold */}
              {(() => {
                const pricingInfo = getItemPricingInfo(currentItem, selectedBottleSize);
                return (
                  <div className="pt-2">
                    <button
                      onClick={() => handleOrderWhatsApp(currentItem)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#9E7834] text-slate-950 font-black text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all shadow-md uppercase tracking-wider"
                    >
                      <MessageCircle size={15} />
                      <span>
                        Pesan Top #{currentItem.rank} ({selectedBottleSize}ml • Rp {pricingInfo.totalPrice.toLocaleString('id-ID')})
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
        </div>

        {/* ==========================================
           VIEW 2: GRID SHOWCASE 2x2 (1 BARIS 2 KOTAK)
           ========================================== */}
        <div
          className={`space-y-3 transition-opacity duration-200 ${
            viewMode === 'grid' ? 'block' : 'hidden'
          }`}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {TOP_11_DATA.map((item) => {
              const isFav = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const idx = TOP_11_DATA.findIndex((d) => d.id === item.id);
                    if (idx !== -1) setCurrentIndex(idx);
                    setViewMode('spotlight');
                  }}
                  className="relative flex flex-col justify-between p-3 rounded-2xl bg-gradient-to-b from-[#1c1f32] to-[#141626] hover:from-[#22263d] hover:to-[#171a2c] border border-white/10 hover:border-[#C5A059]/50 shadow-[0_8px_25px_rgba(0,0,0,0.55)] transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Top Row: Rank Tag + Heart */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-200 border border-white/15 shadow-sm">
                      #{item.rank}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id, item.name);
                      }}
                      className="p-1 rounded-full text-slate-300 hover:text-red-400 transition-colors"
                      title="Favorit"
                    >
                      <Heart
                        size={13}
                        className={isFav ? 'fill-red-500 text-red-500' : ''}
                      />
                    </button>
                  </div>

                  {/* Bottle Visual Container (100% Clean) */}
                  <div className="w-full h-32 my-1">
                    <PerfumeBottleVisual
                      item={item}
                      customPhoto={top11Photos[item.id]}
                      size="sm"
                      fitMode={fitMode}
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-mono text-[#DFB76C] font-semibold uppercase tracking-widest block">
                        {item.type}
                      </span>
                      {(() => {
                        const gridPricing = getItemPricingInfo(item, selectedBottleSize);
                        return (
                          <span className="text-[7.5px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                            {gridPricing.isMykonos ? 'Mykonos' : 'Premium'}
                          </span>
                        );
                      })()}
                    </div>
                    <h4 className="font-display text-xs font-black text-white leading-tight line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[8.5px] text-zinc-300 font-medium italic line-clamp-2 leading-tight">
                      {item.subtitle}
                    </p>
                    {(() => {
                      const gridPricing = getItemPricingInfo(item, selectedBottleSize);
                      return (
                        <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[9px]">
                          <span className="text-slate-400 font-mono text-[8.5px]">{selectedBottleSize}ml:</span>
                          <span className="font-mono font-bold text-[#DFB76C] text-[10.5px]">
                            Rp {gridPricing.totalPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Order Button: Champagne Gold */}
                  {(() => {
                    const gridPricing = getItemPricingInfo(item, selectedBottleSize);
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderWhatsApp(item);
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 hover:brightness-105 border border-[#DFB76C]/30 text-[9px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <MessageCircle size={11} />
                        <span>Pesan {selectedBottleSize}ml (Rp {gridPricing.totalPrice.toLocaleString('id-ID')})</span>
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

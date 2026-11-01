import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, ChevronLeft, ChevronRight, LayoutGrid, Clock, Flame, ArrowLeft, Heart } from 'lucide-react';
import { Top11Item } from '../data/top11';
import { getStoredTopPerfumes, fetchTopPerfumesFromServer } from '../utils/topPerfumesStorage';
import { PerfumeBottleVisual, loadedPhotoSet } from './PerfumeBottleVisual';
import { PricingConfig, DEFAULT_PRICING, getStoredPricing } from '../utils/pricingStorage';
import { openWhatsAppDirect } from '../utils/whatsappHelper';

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
  const [topItems, setTopItems] = useState<Top11Item[]>(getStoredTopPerfumes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');
  const fitMode = 'cover'; // Dikunci permanen ke Mode Penuh sesuai proporsi kotak

  // Ambil data terbaru dari server / Supabase Cloud saat halaman dibuka atau aktif
  useEffect(() => {
    fetchTopPerfumesFromServer().then((items) => {
      if (items && Array.isArray(items) && items.length > 0) {
        setTopItems(items);
      }
    });
  }, [isActive]);

  // Sinkronisasi data parfum teratas saat ada penambahan/edit dari admin
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTopItems(e.detail);
      } else {
        setTopItems(getStoredTopPerfumes());
      }
    };
    window.addEventListener('sinki_top_perfumes_updated', handleUpdate);
    return () => window.removeEventListener('sinki_top_perfumes_updated', handleUpdate);
  }, []);

  const rankButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Setiap kali masuk ke halaman Top, otomatis kembali segar ke Juara 1
  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0);
    }
  }, [isActive]);

  // Otomatis scroll bilah nomor urut (1..50) agar nomor aktif selalu berada di tengah layar
  useEffect(() => {
    const activeBtn = rankButtonsRef.current[currentIndex];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

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

  const getBottlePhoto = (item?: Top11Item | null): string => {
    if (!item) return '';
    return (
      top11Photos[item.id] ||
      top11Photos[`top-${item.id}`] ||
      top11Photos[item.id.replace(/^top-/, '')] ||
      top11Photos[`top-${item.rank}`] ||
      top11Photos[String(item.rank)] ||
      item.photo ||
      ''
    );
  };

  // Preload foto botol saat ini, sebelum, dan sesudahnya secara prioritas tinggi
  useEffect(() => {
    if (topItems.length === 0) return;
    const nextIdx = currentIndex < topItems.length - 1 ? currentIndex + 1 : 0;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : topItems.length - 1;
    [topItems[currentIndex], topItems[nextIdx], topItems[prevIdx]].forEach((item) => {
      if (!item) return;
      const url = getBottlePhoto(item);
      if (url) {
        const img = new Image();
        img.onload = () => loadedPhotoSet.add(url);
        img.src = url;
      }
    });
  }, [currentIndex, top11Photos, topItems]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sinki_top11_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentItem = topItems[currentIndex] || topItems[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < topItems.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : topItems.length - 1));
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

  // Option B: Mykonos items (Top 1, 2) use Mykonos rate (Rp 3.000/ml), all other items use Premium rate (Rp 4.000/ml)
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
      `*PESANAN PARFUM SINKI - BESTSELLER*`,
      `------------------------------------------`,
      `• Varian: *Top ${item.rank} - ${item.name}*`,
      `• Tipe: *${item.type}*`,
      `• Kategori: *${info.categoryName} (Rp ${info.ratePerMl.toLocaleString('id-ID')}/ml)*`,
      `• Ukuran Botol: *${sizeToUse}ml*`,
      `• Total Harga: *Rp ${info.totalPrice.toLocaleString('id-ID')}*`,
      `------------------------------------------`,
      `Halo SINKI Parfums, saya ingin memesan parfum Top ${item.rank} di atas. Mohon info ketersediaan & cara pengirimannya ya. Terima kasih!`,
    ].join('\n');

    onShowToast(`Menghubungkan langsung ke WhatsApp SINKI...`);
    openWhatsAppDirect('6289636824552', message);
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
            <h2 className="font-heading text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em] leading-[1.2]">
              Top {topItems.length} Parfum
            </h2>
          </div>

          {/* Toggle View Mode: Spotlight vs Grid */}
          <div className="flex items-center bg-[#12141e] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('spotlight')}
              className={`py-1 px-2.5 rounded-lg font-body text-[11.5px] font-semibold leading-tight transition-all ${
                viewMode === 'spotlight'
                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              Spotlight
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`py-1 px-2.5 rounded-lg font-body text-[11.5px] font-semibold leading-tight transition-all flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              <LayoutGrid size={12} />
              <span>Semua</span>
            </button>
          </div>
        </div>

        {/* Quick Rank Number Pills (Clean numbers 1, 2, 3... up to 50) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 pb-0.5 scroll-smooth">
          {topItems.map((item, idx) => {
            const isActive = viewMode === 'spotlight' && currentIndex === idx;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  rankButtonsRef.current[idx] = el;
                }}
                onClick={() => {
                  setCurrentIndex(idx);
                  setViewMode('spotlight');
                }}
                className={`shrink-0 w-7 h-7 rounded-lg font-body text-xs tabular-nums transition-all flex items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-br from-[#DFB76C] to-[#A07C3A] text-slate-950 scale-105 shadow-sm font-semibold'
                    : 'bg-white/5 text-slate-300 hover:text-white border border-white/10 font-medium'
                }`}
              >
                {item.rank}
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
          className={`space-y-3 transition-opacity duration-200 ${
            viewMode === 'spotlight' ? 'block' : 'hidden'
          }`}
        >
            {/* Spotlight Card with Glassmorphism Border & Deep Royal Charcoal Gradient */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#1e2235]/95 via-[#181a2b]/95 to-[#131524]/95 border border-white/12 hover:border-[#C5A059]/40 p-3.5 sm:p-4 shadow-[0_15px_45px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-md transition-colors">
              {/* Top Card Bar: Rank Badge + Heart & Counter (Bersih & Elegan) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`font-body text-[11px] font-semibold tracking-normal py-0.5 px-2.5 rounded-full border shadow-sm leading-snug truncate ${currentItem.accentBadge}`}
                >
                  {currentItem.badge}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      toggleFavorite(currentItem.id, currentItem.name)
                    }
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-red-400 transition-colors active:scale-90 border border-white/10"
                    title="Favorit"
                  >
                    <Heart
                      size={14}
                      className={
                        favorites.includes(currentItem.id)
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }
                    />
                  </button>

                  <span className="font-body text-[11px] font-medium tabular-nums text-[#DFB76C] bg-white/10 px-2 py-0.5 rounded-md border border-white/15 shadow-sm leading-snug">
                    {currentIndex + 1} / {topItems.length}
                  </span>
                </div>
              </div>

              {/* Perfume Bottle Visual with Navigation Arrows */}
              <div
                className="relative w-full h-56 flex items-center justify-center my-1 select-none"
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
                    customPhoto={getBottlePhoto(currentItem)}
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

              {/* Dots Pagination Carousel */}
              <div className="flex items-center justify-center gap-1.5 py-1 mb-1 select-none">
                {topItems.map((item, idx) => {
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
                      title={`Peringkat ${idx + 1} - ${item.name}`}
                      aria-label={`Peringkat ${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Title & Subtitle with Pure White Crisp and Soft Champagne Accent */}
              <div className="text-center space-y-1 pt-0.5 pb-1">
                <span className="font-body text-[11px] font-medium tracking-[0.04em] text-[#DFB76C] block leading-tight">
                  {currentItem.type}
                </span>
                <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.2] break-words px-1 drop-shadow-sm">
                  {currentItem.name}
                </h3>
                <p className="font-body text-xs text-zinc-300 font-normal italic leading-[1.42]">
                  “{currentItem.subtitle}”
                </p>
                <p className="font-body text-[12.5px] sm:text-[13px] text-zinc-200 font-normal leading-[1.48] pt-0.5 max-w-sm mx-auto drop-shadow-sm">
                  {currentItem.description}
                </p>
              </div>

              {/* Fragrance Pyramid Notes Breakdown with High Contrast & Calm Aesthetics */}
              <div className="mt-2 p-2.5 rounded-2xl bg-[#121422] border border-white/12 space-y-1 font-body text-xs shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="w-[72px] text-[#DFB76C] font-medium shrink-0 leading-[1.45]">
                    Top Notes:
                  </span>
                  <span className="text-zinc-100 flex-1 font-normal leading-[1.45]">
                    {currentItem.topNotes}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-[72px] text-[#DFB76C] font-medium shrink-0 leading-[1.45]">
                    Heart:
                  </span>
                  <span className="text-zinc-100 flex-1 font-normal leading-[1.45]">
                    {currentItem.middleNotes}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-[72px] text-[#DFB76C] font-medium shrink-0 leading-[1.45]">
                    Base:
                  </span>
                  <span className="text-zinc-100 flex-1 font-normal leading-[1.45]">
                    {currentItem.baseNotes}
                  </span>
                </div>

                {/* Performance Metrics */}
                <div className="pt-1.5 border-t border-white/12 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Clock size={12} className="shrink-0" />
                    <span>Ketahanan: {currentItem.longevity}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sky-300 font-medium">
                    <Flame size={12} className="shrink-0" />
                    <span>Sillage: {currentItem.sillage}</span>
                  </div>
                </div>
              </div>

              {/* Bottle Size Selector & Option B Pricing (Pilihan Ukuran Botol & Harga) */}
              <div className="mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#11131c] border border-white/10 space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-2 font-body">
                  <span className="text-xs text-white font-semibold flex items-center gap-1.5 leading-tight">
                    <span>Pilih Ukuran Botol</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-body text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 leading-tight">
                      {getItemPricingInfo(currentItem, selectedBottleSize).categoryName}
                    </span>
                    <span className="font-body text-[11px] text-slate-200 font-medium tabular-nums px-2 py-0.5 rounded-full bg-white/5 border border-white/10 leading-tight">
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
                        className={`relative py-1.5 rounded-xl text-center font-body text-[11.5px] font-semibold leading-tight tabular-nums transition-all active:scale-95 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#DFC07B] to-[#C09B50] text-slate-950 border-[#F5E6C4]/85 shadow-sm scale-[1.02]'
                            : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 font-medium'
                        }`}
                      >
                        {size}ml
                        {size === 30 && (
                          <span
                            className={`block text-[9.5px] leading-none font-body mt-0.5 ${
                              isSelected ? 'text-slate-950 font-semibold' : 'text-slate-400 font-normal'
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
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 font-body">
                      <div>
                        <span className="text-slate-400 text-[11px] font-normal block leading-tight">Tarif Resmi:</span>
                        <span className="text-xs sm:text-[13px] text-slate-200 font-medium tabular-nums leading-snug">
                          Rp {pricingInfo.ratePerMl.toLocaleString('id-ID')}/ml
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-normal block leading-tight">
                          Total Harga ({selectedBottleSize}ml):
                        </span>
                        <span className="text-[17px] sm:text-lg font-bold text-[#DFB76C] tabular-nums tracking-tight leading-snug drop-shadow-sm">
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
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#9E7834] text-slate-950 font-body font-semibold text-[13px] sm:text-[13.5px] tabular-nums flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all shadow-md"
                    >
                      <MessageCircle size={15} className="shrink-0" />
                      <span>
                        Pesan Top {currentItem.rank} ({selectedBottleSize}ml • Rp {pricingInfo.totalPrice.toLocaleString('id-ID')})
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
          <div className="grid grid-cols-2 gap-2.5">
            {topItems.map((item) => {
              const isFav = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const idx = topItems.findIndex((d) => d.id === item.id);
                    if (idx !== -1) setCurrentIndex(idx);
                    setViewMode('spotlight');
                  }}
                  className="relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#1c1f32] to-[#141626] hover:from-[#22263d] hover:to-[#171a2c] border border-white/10 hover:border-[#C5A059]/50 shadow-[0_8px_25px_rgba(0,0,0,0.55)] transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Top Row: Rank Tag + Heart (Clean Number 1, 2, 3...) */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-200 border border-white/15 shadow-sm leading-tight">
                      {item.rank}
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
                      customPhoto={getBottlePhoto(item)}
                      size="sm"
                      fitMode={fitMode}
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1 mb-2 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-body text-[10.5px] text-[#DFB76C] font-medium leading-tight truncate">
                        {item.type}
                      </span>
                      {(() => {
                        const gridPricing = getItemPricingInfo(item, selectedBottleSize);
                        return (
                          <span className="font-body text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15 leading-none shrink-0">
                            {gridPricing.isMykonos ? 'Mykonos' : 'Premium'}
                          </span>
                        );
                      })()}
                    </div>
                    <h4 className="font-heading text-[13px] sm:text-[13.5px] font-semibold text-white tracking-[-0.015em] leading-[1.22] line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="font-body text-[11px] text-zinc-300 font-normal italic line-clamp-2 leading-[1.35]">
                      {item.subtitle}
                    </p>
                    {(() => {
                      const gridPricing = getItemPricingInfo(item, selectedBottleSize);
                      return (
                        <div className="pt-1.5 flex items-center justify-between border-t border-white/10 font-body">
                          <span className="text-slate-400 text-[11px] tabular-nums leading-tight">{selectedBottleSize}ml:</span>
                          <span className="font-semibold text-[#DFB76C] text-xs sm:text-[13px] tabular-nums leading-tight">
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
                        className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 hover:brightness-105 border border-[#DFB76C]/30 font-body text-[11px] font-semibold leading-tight tabular-nums flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <MessageCircle size={12} className="shrink-0" />
                        <span className="truncate">Pesan {selectedBottleSize}ml • Rp {gridPricing.totalPrice.toLocaleString('id-ID')}</span>
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

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, X, ArrowLeft, Filter } from 'lucide-react';
import { PerfumeCategory, PerfumeItem } from '../data/perfumes';
import { getStoredPerfumes } from '../utils/perfumeStorage';

interface CollectionScreenProps {
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
  onSelectPerfumeToOrder?: (item: PerfumeItem) => void;
  scrollToTopTrigger?: number;
  perfumes?: PerfumeItem[];
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({
  onBackToHome,
  onShowToast,
  onSelectPerfumeToOrder,
  scrollToTopTrigger,
  perfumes,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<PerfumeCategory | 'all'>('all');

  // Responsif jika ada trigger scroll ke paling atas
  useEffect(() => {
    if (scrollToTopTrigger) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopTrigger]);

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sinki_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, name: string) => {
    const exists = favorites.includes(id);
    const updated = exists ? favorites.filter((item) => item !== id) : [...favorites, id];
    try {
      localStorage.setItem("sinki_favorites", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setFavorites(updated);
    onShowToast(exists ? `${name} dihapus dari favorit` : `${name} ditambahkan ke favorit ❤️`);
  };

  // Seluruh parfum aktif (yang tidak disembunyikan admin)
  const activePerfumes = useMemo(() => {
    const source = perfumes && perfumes.length > 0 ? perfumes : getStoredPerfumes();
    return source.filter((item) => item.isActive !== false);
  }, [perfumes]);

  // Hitung jumlah varian aktif per kategori secara real-time
  const categoryCounts = useMemo(() => {
    return {
      women: activePerfumes.filter((p) => p.category === 'women').length,
      men: activePerfumes.filter((p) => p.category === 'men').length,
      powdery: activePerfumes.filter((p) => p.category === 'powdery').length,
      unisex: activePerfumes.filter((p) => p.category === 'unisex').length,
    };
  }, [activePerfumes]);

  const filteredPerfumes = useMemo(() => {
    return activePerfumes.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.accords.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [activePerfumes, selectedCategory, searchQuery]);

  const getWhatsAppUrl = (item: PerfumeItem) => {
    const text = `Halo SINKI Parfums, saya ingin memesan varian: *${item.name}* (${item.categoryLabel}). Mohon info harga dan ketersediaannya ya. Terima kasih!`;
    return `https://wa.me/6289636824552?text=${encodeURIComponent(text)}`;
  };

  const getCategoryColor = (cat: PerfumeCategory) => {
    switch (cat) {
      case 'women':
        return {
          bg: 'bg-pink-500/10',
          border: 'border-pink-500/30',
          text: 'text-pink-300',
          badge: 'bg-pink-500/20 text-pink-300',
        };
      case 'men':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-300',
          badge: 'bg-blue-500/20 text-blue-300',
        };
      case 'powdery':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'unisex':
      default:
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300',
        };
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#161824] via-[#12131e] to-[#0c0d15] text-slate-100 overflow-hidden">
      {/* Pendar Cahaya Halus & Sejuk */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a059]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* TOP BAR / HEADER */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 shrink-0 bg-[#0f111a]/95 border-b border-white/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={16} />
            </button>
            <div onClick={handleScrollToTop} className="cursor-pointer select-none">
              <h2 className="font-display text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                Koleksi Parfum
                <span className="text-[10px] font-mono text-slate-300 font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/15 shadow-sm">
                  {activePerfumes.length} Varian
                </span>
              </h2>
            </div>
          </div>

          <span className="text-[10px] text-slate-300 font-mono tracking-widest font-bold uppercase">
            SINKI
          </span>
        </div>

        {/* Live Search Bar with High Legibility */}
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari varian parfum (cth: Dior, Scandalous, Zwitsal)..."
            className="w-full py-2 pl-9 pr-8 rounded-xl bg-[#141624] border border-white/15 text-xs font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Buttons: Pas 4 Kategori Simetris (Tanpa Tombol 'Semua' & Zero Horizontal Scroll) */}
        <div className="grid grid-cols-4 gap-1.5 w-full pt-2 pb-0.5">
          <button
            onClick={() => setSelectedCategory((prev) => (prev === 'women' ? 'all' : 'women'))}
            className={`py-1.5 px-1 rounded-xl text-[10.5px] font-bold tracking-tight transition-all flex flex-col items-center justify-center leading-none ${
              selectedCategory === 'women'
                ? 'bg-pink-600 text-white shadow-[0_2px_10px_rgba(219,39,119,0.4)] font-black scale-[1.02]'
                : 'bg-white/5 text-slate-300 hover:text-pink-300 border border-white/10'
            }`}
          >
            <span>Women</span>
            <span
              className={`text-[8.5px] font-mono mt-0.5 ${
                selectedCategory === 'women' ? 'text-pink-100 font-bold' : 'text-slate-400'
              }`}
            >
              ({categoryCounts.women})
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory((prev) => (prev === 'men' ? 'all' : 'men'))}
            className={`py-1.5 px-1 rounded-xl text-[10.5px] font-bold tracking-tight transition-all flex flex-col items-center justify-center leading-none ${
              selectedCategory === 'men'
                ? 'bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.4)] font-black scale-[1.02]'
                : 'bg-white/5 text-slate-300 hover:text-blue-300 border border-white/10'
            }`}
          >
            <span>Men</span>
            <span
              className={`text-[8.5px] font-mono mt-0.5 ${
                selectedCategory === 'men' ? 'text-blue-100 font-bold' : 'text-slate-400'
              }`}
            >
              ({categoryCounts.men})
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory((prev) => (prev === 'powdery' ? 'all' : 'powdery'))}
            className={`py-1.5 px-1 rounded-xl text-[10.5px] font-bold tracking-tight transition-all flex flex-col items-center justify-center leading-none ${
              selectedCategory === 'powdery'
                ? 'bg-emerald-600 text-white shadow-[0_2px_10px_rgba(5,150,105,0.4)] font-black scale-[1.02]'
                : 'bg-white/5 text-slate-300 hover:text-emerald-300 border border-white/10'
            }`}
          >
            <span>Powdery</span>
            <span
              className={`text-[8.5px] font-mono mt-0.5 ${
                selectedCategory === 'powdery' ? 'text-emerald-100 font-bold' : 'text-slate-400'
              }`}
            >
              ({categoryCounts.powdery})
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory((prev) => (prev === 'unisex' ? 'all' : 'unisex'))}
            className={`py-1.5 px-1 rounded-xl text-[10.5px] font-bold tracking-tight transition-all flex flex-col items-center justify-center leading-none ${
              selectedCategory === 'unisex'
                ? 'bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 shadow-[0_2px_10px_rgba(223,183,108,0.35)] font-black scale-[1.02]'
                : 'bg-white/5 text-slate-300 hover:text-[#DFB76C] border border-white/10'
            }`}
          >
            <span>Unisex</span>
            <span
              className={`text-[8.5px] font-mono mt-0.5 ${
                selectedCategory === 'unisex' ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              ({categoryCounts.unisex})
            </span>
          </button>
        </div>
      </div>

      {/* PARFUM GRID CONTAINER:
          Format 2x2 (1 baris isi 2 kotak), tersusun rapi dengan Glassmorphism Border & Super Terang
      */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3.5 pb-24 no-scrollbar">
        {filteredPerfumes.length === 0 ? (
          <div className="py-16 text-center text-slate-200 flex flex-col items-center justify-center">
            <Filter size={28} className="text-amber-400 mb-2" />
            <p className="text-xs font-bold text-white">Varian tidak ditemukan</p>
            <p className="text-[10.5px] text-slate-300 mt-1">
              Coba kata kunci lain atau pilih tab Semua
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {filteredPerfumes.map((perfume) => {
              const theme = getCategoryColor(perfume.category);
              const isFav = favorites.includes(perfume.id);

              return (
                <div
                  key={perfume.id}
                  className="group relative flex flex-col justify-between p-3 rounded-2xl bg-gradient-to-b from-[#181a28]/95 to-[#12131e]/95 hover:from-[#1e2235] hover:to-[#161824] border border-white/10 hover:border-[#C5A059]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-200 backdrop-blur-md"
                >
                  {/* Top card bar: Category badge + Favorite heart */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[8.5px] font-black uppercase tracking-wider py-0.5 px-2 rounded-md ${theme.badge} shadow-sm`}
                    >
                      {perfume.categoryLabel}
                    </span>

                    <button
                      onClick={() => toggleFavorite(perfume.id, perfume.name)}
                      className="p-1 rounded-full text-slate-400 hover:text-red-400 transition-colors active:scale-90"
                      title="Simpan favorit"
                    >
                      <Heart
                        size={13}
                        className={isFav ? 'fill-red-500 text-red-500' : ''}
                      />
                    </button>
                  </div>

                  {/* Bottle Label & Varian Name */}
                  <div className="space-y-1.5 mb-2.5">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-semibold block">
                      Eau De Parfum
                    </span>

                    <h3 className="font-display text-[12.5px] sm:text-[13.5px] font-black text-white group-hover:text-[#F0DFB6] transition-colors leading-snug line-clamp-2 min-h-[34px] drop-shadow-sm">
                      {perfume.name}
                    </h3>

                    <p className="text-[10px] text-slate-300 font-medium italic line-clamp-2 leading-tight min-h-[24px]">
                      {perfume.tagline}
                    </p>

                    {/* Accords tags with High Contrast Crisp Badges */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {perfume.accords.slice(0, 2).map((accord, idx) => (
                        <span
                          key={idx}
                          className="text-[8.5px] py-0.5 px-1.5 rounded-md bg-white/10 text-slate-200 border border-white/15 font-semibold"
                        >
                          {accord}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action: Direct to Order Screen in Champagne Gold */}
                  <button
                    onClick={() => {
                      if (onSelectPerfumeToOrder) {
                        onSelectPerfumeToOrder(perfume);
                      }
                    }}
                    className="w-full mt-auto py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 text-[10px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm hover:shadow-[0_2px_10px_rgba(197,160,89,0.25)] text-center"
                    title={`Pesan parfum ${perfume.name}`}
                  >
                    <ShoppingBag size={11} className="shrink-0" />
                    <span>Pesan Sekarang</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

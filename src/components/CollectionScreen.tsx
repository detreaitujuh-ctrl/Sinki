import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  X,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Star,
  ArrowRight,
} from 'lucide-react';
import {
  PerfumeItem,
  CollectionCategoryKey,
  COLLECTION_CATEGORIES,
  CollectionCategoryMeta,
} from '../data/perfumes';
import { getStoredPerfumes, fetchPerfumesFromServer } from '../utils/perfumeStorage';
import {
  COLLECTION_BOTTLE_SIZES,
  COLLECTION_FIXED_PRICES,
  CollectionBottleSize,
  addToCart,
} from '../utils/cartStorage';
import { ReviewItem, getCachedReviews, fetchReviewsFromSupabase } from '../utils/reviewStorage';
import { PerfumeDetailModal } from './PerfumeDetailModal';

interface CollectionScreenProps {
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
  onCartUpdated?: () => void;
  onNavigateToReview?: () => void;
  scrollToTopTrigger?: number;
  perfumes?: PerfumeItem[];
}

/**
 * Frameless 3D Layered Category Icons (Icon Only — No Background Box or Frame)
 */
const Category3DIcon: React.FC<{ id: CollectionCategoryKey; sizeClass?: string }> = ({
  id,
  sizeClass = 'w-5 h-5',
}) => {
  switch (id) {
    case 'daily_fresh':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="dfDropOrig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="dfSunOrig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7E0" />
              <stop offset="100%" stopColor="#DFB76C" />
            </linearGradient>
          </defs>
          <circle cx="21" cy="10.5" r="4.8" fill="url(#dfSunOrig)" />
          <path
            d="M13.5 5.5C13.5 5.5 6.5 14.2 6.5 19.2C6.5 23.1 9.6 26.2 13.5 26.2C17.4 26.2 20.5 23.1 20.5 19.2C20.5 14.2 13.5 5.5 13.5 5.5Z"
            fill="url(#dfDropOrig)"
          />
          <path
            d="M10.2 16.4C9.5 18.3 10.1 20.8 11.8 22.0"
            stroke="#ffffff"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <circle cx="11.2" cy="13.6" r="1.1" fill="#ffffff" opacity="0.9" />
        </svg>
      );

    case 'professional':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="proCaseOrig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E6C8" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6826" />
            </linearGradient>
            <linearGradient id="proTopOrig" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF7E6" />
              <stop offset="100%" stopColor="#C5A059" />
            </linearGradient>
          </defs>
          <path
            d="M12 9.5V7.6C12 6.6 12.8 5.8 13.8 5.8H18.2C19.2 5.8 20 6.6 20 7.6V9.5"
            stroke="url(#proTopOrig)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="4.5" y="9.5" width="23" height="16.5" rx="3.5" fill="url(#proCaseOrig)" />
          <path
            d="M4.5 13C4.5 11.067 6.067 9.5 8 9.5H24C25.933 9.5 27.5 11.067 27.5 13V15.6C20.2 17.5 11.8 17.5 4.5 15.6V13Z"
            fill="url(#proTopOrig)"
            opacity="0.92"
          />
          <rect x="14" y="14" width="4" height="4.2" rx="1" fill="#10121a" />
          <rect x="14.8" y="14.8" width="2.4" height="2.6" rx="0.5" fill="#FFF7E0" />
        </svg>
      );

    case 'attraction':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="attHeartOrig" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <path
            d="M15.2 25.6C14.8 25.6 14.4 25.45 14.05 25.2C8.7 21.4 4.8 17.2 4.8 12.6C4.8 9.2 7.4 6.6 10.6 6.6C12.6 6.6 14.3 7.6 15.2 9.1C16.1 7.6 17.8 6.6 19.8 6.6C23.0 6.6 25.6 9.2 25.6 12.6C25.6 17.2 21.7 21.4 16.35 25.2C16.0 25.45 15.6 25.6 15.2 25.6Z"
            fill="url(#attHeartOrig)"
          />
          <path
            d="M8.3 11.6C8.3 10.1 9.5 9.0 10.9 9.0"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M25 4.8L25.8 7.3L28.3 8.1L25.8 8.9L25 11.4L24.2 8.9L21.7 8.1L24.2 7.3L25 4.8Z"
            fill="#F3E6C8"
          />
        </svg>
      );

    case 'luxury':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="luxCrownOrig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E7" />
              <stop offset="45%" stopColor="#DFB76C" />
              <stop offset="100%" stopColor="#9A742F" />
            </linearGradient>
          </defs>
          <path
            d="M5 21.5L3.2 10.2L10.3 14.8L16 7L21.7 14.8L28.8 10.2L27 21.5H5Z"
            fill="url(#luxCrownOrig)"
          />
          <rect x="5" y="22.8" width="22" height="3.1" rx="1.3" fill="url(#luxCrownOrig)" />
          <circle cx="16" cy="6" r="1.7" fill="#FFFBEB" />
          <circle cx="3.5" cy="9.2" r="1.4" fill="#F3E6C8" />
          <circle cx="28.5" cy="9.2" r="1.4" fill="#F3E6C8" />
          <polygon points="16,14 18.1,17 16,20 13.9,17" fill="#FFFBEB" />
        </svg>
      );

    case 'viral_hits':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="vfOuterOrig" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="vfInnerOrig" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
          </defs>
          <path
            d="M17 3.8C17.6 8.3 14.3 11.1 14.3 11.1C14.3 11.1 20 9.6 22.3 14.2C24.3 18.2 22.4 23.6 18.3 25.9C14.2 28.1 8.6 26.1 7.3 21.1C6.3 17.0 8.9 12.9 11.4 11.1C11.0 13.2 12.1 14.6 12.1 14.6C11.5 10.0 14.0 6.0 17 3.8Z"
            fill="url(#vfOuterOrig)"
          />
          <path
            d="M16 14.2C17.9 16.1 18.8 19.0 17.5 21.7C16.4 24.0 13.5 24.6 11.9 22.5C10.6 20.8 11.5 18.1 13.5 16.8C13.5 18.0 14.3 18.8 14.3 18.8C14.1 16.9 14.8 15.4 16 14.2Z"
            fill="url(#vfInnerOrig)"
          />
        </svg>
      );

    case 'new_trending':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
          aria-hidden="true"
        >
          <path
            d="M17.2 4.5L7.4 17.2H14.5L12.7 27L22.9 14.1H15.8L17.2 4.5Z"
            fill="#00f2fe"
            opacity="0.88"
          />
          <path
            d="M18.9 5.3L9.1 18.0H16.2L14.4 27.8L24.6 14.9H17.5L18.9 5.3Z"
            fill="#fe2c55"
            opacity="0.82"
          />
          <path
            d="M18.0 4.9L8.2 17.6H15.3L13.5 27.4L23.7 14.5H16.6L18.0 4.9Z"
            fill="#ffffff"
          />
          <path
            d="M25 5.2L25.6 7.1L27.5 7.7L25.6 8.3L25 10.2L24.4 8.3L22.5 7.7L24.4 7.1L25 5.2Z"
            fill="#DFB76C"
          />
        </svg>
      );
  }
};

export const CollectionScreen: React.FC<CollectionScreenProps> = ({
  onBackToHome,
  onShowToast,
  onCartUpdated,
  onNavigateToReview,
  scrollToTopTrigger,
  perfumes,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategoryKey | null>(null);
  const [detailPerfume, setDetailPerfume] = useState<PerfumeItem | null>(null);
  const [selectedBottleSize, setSelectedBottleSize] = useState<CollectionBottleSize | null>(null);
  const [bottleQty, setBottleQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  // Reviews for the live customer feedback marquee (Option A)
  const [collectionReviews, setCollectionReviews] = useState<ReviewItem[]>(() => {
    const cached = getCachedReviews();
    if (cached && cached.length > 0) return cached;
    return [
      { id: 'rev-1', name: 'Dimas P.', comment: 'Aroma mewah & tahan seharian di AC', variant: 'Luxury', emoji: '💎', emojiLabel: 'Mewah', date: 'Baru saja', likes: 12 },
      { id: 'rev-2', name: 'Rian A.', comment: 'Segar dan bersih buat kerja harian', variant: 'Daily Fresh', emoji: '🔥', emojiLabel: 'Awet', date: 'Baru saja', likes: 9 },
      { id: 'rev-3', name: 'Maya S.', comment: 'Wangi floral lembut bikin percaya diri', variant: 'Attraction', emoji: '😍', emojiLabel: 'Puas', date: 'Baru saja', likes: 15 },
      { id: 'rev-4', name: 'Aldi K.', comment: 'Kualitas bibit Eropa murni, mantap!', variant: 'Viral Hits', emoji: '💖', emojiLabel: 'Favorit', date: 'Baru saja', likes: 8 },
    ];
  });

  useEffect(() => {
    const sync = () => {
      fetchReviewsFromSupabase()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            setCollectionReviews(list);
          }
        })
        .catch(() => {});
    };

    sync();

    const handleReviewsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setCollectionReviews(e.detail);
      }
    };

    window.addEventListener('sinki_reviews_updated', handleReviewsUpdated);
    window.addEventListener('focus', sync);

    return () => {
      window.removeEventListener('sinki_reviews_updated', handleReviewsUpdated);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const [catalogPerfumes, setCatalogPerfumes] = useState<PerfumeItem[]>(() =>
    perfumes && perfumes.length > 0 ? perfumes : getStoredPerfumes()
  );

  // Sync external prop updates immediately from App / Admin
  useEffect(() => {
    if (perfumes && perfumes.length > 0) {
      setCatalogPerfumes(perfumes);
    }
  }, [perfumes]);

  // Fetch latest variants from server & listen to live Admin updates
  useEffect(() => {
    fetchPerfumesFromServer().then((list) => {
      if (list && Array.isArray(list) && list.length > 0) {
        setCatalogPerfumes(list);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCatalogPerfumes(e.detail);
      } else {
        setCatalogPerfumes(getStoredPerfumes());
      }
    };
    window.addEventListener('sinki_perfumes_updated', handleUpdate);
    return () => window.removeEventListener('sinki_perfumes_updated', handleUpdate);
  }, []);

  // Scroll to top when bottom nav re-taps Collection
  useEffect(() => {
    if (scrollToTopTrigger) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopTrigger]);

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      localStorage.setItem('sinki_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setFavorites(updated);
    onShowToast(exists ? `${name} dihapus dari favorit` : `${name} disimpan ke favorit`);
  };

  // Active perfumes only (not hidden by Admin)
  const activePerfumes = useMemo(() => {
    const source = catalogPerfumes && catalogPerfumes.length > 0 ? catalogPerfumes : getStoredPerfumes();
    return source.filter((item) => item.isActive !== false);
  }, [catalogPerfumes]);

  // Live variant counts per 6 Collection Categories
  const categoryCounts = useMemo(() => {
    const counts: Record<CollectionCategoryKey, number> = {
      daily_fresh: 0,
      professional: 0,
      attraction: 0,
      luxury: 0,
      viral_hits: 0,
      new_trending: 0,
    };

    for (const p of activePerfumes) {
      const cats = Array.isArray(p.collectionCategories) ? p.collectionCategories : [];
      for (const c of cats) {
        if (counts[c] !== undefined) {
          counts[c] += 1;
        }
      }
    }
    return counts;
  }, [activePerfumes]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const activeCategoryMeta: CollectionCategoryMeta | undefined = useMemo(() => {
    if (!selectedCategory) return undefined;
    return COLLECTION_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  // Filtered variants when inside a selected category or actively searching
  const displayedPerfumes = useMemo(() => {
    return activePerfumes.filter((item) => {
      const itemCats = Array.isArray(item.collectionCategories) ? item.collectionCategories : [];
      const matchesCategory = selectedCategory ? itemCats.includes(selectedCategory) : true;

      if (!trimmedQuery) {
        return selectedCategory ? matchesCategory : false;
      }

      const matchesSearch =
        item.name.toLowerCase().includes(trimmedQuery) ||
        item.tagline.toLowerCase().includes(trimmedQuery) ||
        (item.usageRecommendation || '').toLowerCase().includes(trimmedQuery) ||
        item.accords.some((a) => a.toLowerCase().includes(trimmedQuery));

      return selectedCategory ? matchesCategory && matchesSearch : matchesSearch;
    });
  }, [activePerfumes, selectedCategory, trimmedQuery]);

  const handleSelectCategory = (catId: CollectionCategoryKey) => {
    setSelectedCategory(catId);
    setViewTransitionKey((prev) => prev + 1);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setViewTransitionKey((prev) => prev + 1);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetail = (perfume: PerfumeItem) => {
    setDetailPerfume(perfume);
    setSelectedBottleSize(null); // Harga hanya muncul setelah ukuran dipilih
    setBottleQty(1);
  };

  const handleCloseDetail = () => {
    setDetailPerfume(null);
    setSelectedBottleSize(null);
    setBottleQty(1);
  };

  const selectedUnitPrice = selectedBottleSize ? COLLECTION_FIXED_PRICES[selectedBottleSize] : null;
  const selectedTotalPrice = selectedUnitPrice ? selectedUnitPrice * bottleQty : null;

  const handleAddToCartSubmit = () => {
    if (!detailPerfume || !selectedBottleSize) return;

    const unitPrice = COLLECTION_FIXED_PRICES[selectedBottleSize];
    const totalPrice = unitPrice * bottleQty;

    addToCart({
      perfumeId: detailPerfume.id,
      name: detailPerfume.name,
      size: selectedBottleSize,
      quantity: bottleQty,
    });

    onCartUpdated?.();
    onShowToast(
      `Berhasil masuk keranjang: ${detailPerfume.name} (${selectedBottleSize} ml × ${bottleQty} — Rp${totalPrice.toLocaleString('id-ID')})`
    );
    handleCloseDetail();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendar Cahaya Emas Halus & Tipis (Original SINKI Ambient Glow) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* TOP BAR / ORIGINAL SINKI HEADER (No Repeated Category Tabs) */}
      <div className="relative z-10 px-4 pt-3 pb-3 shrink-0 bg-[#10121b]/95 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={selectedCategory ? handleBackToCategories : onBackToHome}
              className="w-8 h-8 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95 shrink-0"
              title={selectedCategory ? 'Kembali ke Kategori' : 'Kembali ke Beranda'}
            >
              <ArrowLeft size={16} />
            </button>

            <div onClick={handleScrollToTop} className="cursor-pointer select-none min-w-0">
              {selectedCategory && activeCategoryMeta ? (
                <div className="flex items-baseline gap-1.5 truncate">
                  <h2 className="font-heading text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em] leading-[1.2] truncate">
                    {activeCategoryMeta.title}
                  </h2>
                  <span className="font-body text-[11px] font-medium tabular-nums text-[#C5A059] shrink-0">
                    {displayedPerfumes.length} varian
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <h2 className="font-heading text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em] leading-[1.2]">
                    Collection
                  </h2>
                  <span className="font-body text-[11px] font-medium tabular-nums text-slate-400">
                    · {activePerfumes.length} varian
                  </span>
                </div>
              )}
            </div>
          </div>

          {selectedCategory && (
            <button
              onClick={handleBackToCategories}
              className="font-body py-1 px-2.5 rounded-md bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[11.5px] font-semibold text-[#DFB76C] hover:text-amber-200 transition-colors shrink-0"
            >
              Semua Kategori
            </button>
          )}
        </div>

        {/* Clean Precision Search Input */}
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              selectedCategory && activeCategoryMeta
                ? `Cari aroma di ${activeCategoryMeta.title}...`
                : 'Cari nama parfum atau karakter aroma...'
            }
            className="font-body w-full py-2 pl-9 pr-8 rounded-md bg-[#151824] border border-white/12 text-base sm:text-sm leading-normal text-white font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#C5A059] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Bersihkan pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* MAIN SCROLLABLE CONTENT */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 no-scrollbar"
      >
        {/* VIEW A: HEADING + 6 COMPACT CATEGORY CARDS (Option A: Frameless Inline Icon + Uniform 3-Row Layout) */}
        {!selectedCategory && !isSearching && (
          <div key={`categories-view-${viewTransitionKey}`} className="pt-3 pb-4">
            <div className="sinki-heading-anim flex items-center justify-center gap-2 mb-4 px-1 text-center">
              <span
                aria-hidden="true"
                className="sinki-amber-dot inline-block w-1.5 h-1.5 rounded-full bg-[#FBBF24] shrink-0"
              />
              <h1 className="font-heading text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em] leading-[1.2]">
                Temukan Aroma Karaktermu
              </h1>
              <span
                aria-hidden="true"
                className="sinki-amber-dot inline-block w-1.5 h-1.5 rounded-full bg-[#FBBF24] shrink-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5">
              {COLLECTION_CATEGORIES.map((cat, idx) => {
                const count = categoryCounts[cat.id];
                const rateNote =
                  cat.id === 'viral_hits'
                    ? 'Rp3.000/ml'
                    : cat.id === 'new_trending'
                    ? 'Rp4.000/ml'
                    : null;

                const rowIdx = Math.floor(idx / 2); // 0, 1, 2
                const cascadeClass =
                  rowIdx === 0
                    ? 'sinki-cascade-row-0'
                    : rowIdx === 1
                    ? 'sinki-cascade-row-1'
                    : 'sinki-cascade-row-2';

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`${cascadeClass} group relative text-left p-3 rounded-lg bg-gradient-to-b from-[#1e2235]/95 to-[#141722]/95 hover:from-[#24283f] hover:to-[#181c29] border border-white/10 hover:border-[#C5A059]/50 shadow-[0_6px_18px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(223,183,108,0.14)] transition-all duration-200 active:scale-[0.96] flex flex-col justify-between min-h-[86px] overflow-hidden`}
                  >
                    <div>
                      {/* Row 1: Frameless 3D Icon + Category Name Inline + Arrow */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Category3DIcon id={cat.id} sizeClass="w-4 h-4" />
                          <h3 className="font-heading text-[12.5px] sm:text-[13px] font-semibold text-white group-hover:text-[#F3E6C8] tracking-[-0.01em] leading-[1.22] truncate">
                            {cat.title}
                          </h3>
                        </div>
                        <ChevronRight
                          size={13}
                          className="text-slate-500 group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>

                      {/* Row 2: Concise 1-Line Description */}
                      <p className="font-body text-[11px] text-slate-300/95 font-normal leading-[1.35] mt-1.5 line-clamp-1">
                        {cat.subtitle}
                      </p>
                    </div>

                    {/* Row 3: Single-Line Footer (Variant Count on Left, Rate Note on Right — 100% Equal Card Height) */}
                    <div className="mt-2.5 pt-2 border-t border-white/[0.07] flex items-center justify-between gap-1.5 w-full">
                      <span className="font-body text-[10.5px] sm:text-[11px] font-medium leading-none tabular-nums text-slate-300 group-hover:text-[#F3E6C8] transition-colors">
                        {count} varian
                      </span>
                      {rateNote && (
                        <span className="font-body text-[10.5px] sm:text-[11px] font-medium leading-none tabular-nums text-[#DFB76C] shrink-0">
                          {rateNote}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SECTION ULASAN TESTIMONI: TEKS BERJALAN 100% LEBAR + TAUTAN TEKS RATA KANAN (TANPA KOTAK) */}
            <div className="mt-6 sm:mt-7">
              {/* Baris 1: Teks Berjalan Ulasan (Full-Width, Sangat Ramping & Halus) */}
              <div
                onClick={onNavigateToReview}
                className="luxury-ticker-container relative w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#171926]/90 via-[#131520]/90 to-[#0f111a]/90 border border-white/8 hover:border-[#DFB76C]/30 shadow-md shadow-black/30 flex items-center gap-2 cursor-pointer overflow-hidden group transition-all"
                title="Ketuk untuk melihat ulasan pembeli"
              >
                {/* Micro Gold Star Icon */}
                <div className="w-5 h-5 rounded-md bg-[#DFB76C]/15 border border-[#DFB76C]/25 flex items-center justify-center text-[#DFB76C] shrink-0">
                  <Star size={11} className="fill-[#DFB76C] text-[#DFB76C]" />
                </div>

                {/* Full Width Marquee Track */}
                <div className="relative overflow-hidden flex-1 ticker-mask-fade">
                  <div className="luxury-ticker-track font-body text-[11px] text-slate-200 leading-tight">
                    {/* Track 1 */}
                    <div className="flex items-center gap-4 pr-4">
                      {collectionReviews.map((r, i) => (
                        <span key={`rev-a-${i}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-[#DFB76C] font-semibold">{r.emoji || '★'}</span>
                          <span className="text-zinc-200 font-normal">"{r.comment}"</span>
                          <span className="inline-flex items-center gap-1 text-amber-200 font-bold bg-[#DFB76C]/15 border border-[#DFB76C]/30 px-1.5 py-0.5 rounded-md text-[10.5px] tracking-wide shadow-xs">
                            <span className="text-[#DFB76C] text-[10px]">👤</span>
                            <span>{r.name}</span>
                          </span>
                          <span className="text-[#DFB76C]/80 text-[10px] font-medium">({r.variant})</span>
                          <span className="text-slate-600 px-1">•</span>
                        </span>
                      ))}
                    </div>
                    {/* Track 2 (Duplicate for Seamless Loop) */}
                    <div className="flex items-center gap-4 pr-4" aria-hidden="true">
                      {collectionReviews.map((r, i) => (
                        <span key={`rev-b-${i}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-[#DFB76C] font-semibold">{r.emoji || '★'}</span>
                          <span className="text-zinc-200 font-normal">"{r.comment}"</span>
                          <span className="inline-flex items-center gap-1 text-amber-200 font-bold bg-[#DFB76C]/15 border border-[#DFB76C]/30 px-1.5 py-0.5 rounded-md text-[10.5px] tracking-wide shadow-xs">
                            <span className="text-[#DFB76C] text-[10px]">👤</span>
                            <span>{r.name}</span>
                          </span>
                          <span className="text-[#DFB76C]/80 text-[10px] font-medium">({r.variant})</span>
                          <span className="text-slate-600 px-1">•</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Baris 2: Teks Navigasi Murni Rata Kanan (Tanpa Kotak) */}
              {onNavigateToReview && (
                <div className="flex justify-end mt-1.5 px-0.5">
                  <button
                    type="button"
                    onClick={onNavigateToReview}
                    className="font-body text-[11px] text-[#DFB76C] hover:text-amber-200 active:opacity-70 transition-colors flex items-center gap-1 cursor-pointer select-none group"
                    title="Buka menu ulasan pembeli lengkap"
                  >
                    <span className="group-hover:underline underline-offset-2">Semua ulasan pembeli</span>
                    <ArrowRight size={11} className="stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW B: COMPACT VARIANT LIST (Original SINKI Colors, No Price on Card, No Gender/EDP Label) */}
        {(selectedCategory || isSearching) && (
          <div
            key={`variants-view-${selectedCategory || 'search'}-${viewTransitionKey}`}
            className="pt-2.5 space-y-2 sinki-screen-soft-fade"
          >
            {/* Category Contextual Subheader */}
            {selectedCategory && activeCategoryMeta && !isSearching && (
              <div
                style={{
                  animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                  willChange: 'transform, opacity, filter',
                }}
                className="pb-2 mb-1 border-b border-white/10 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Category3DIcon id={activeCategoryMeta.id} sizeClass="w-5 h-5" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-white tracking-[-0.015em] leading-[1.22]">
                      {activeCategoryMeta.title}
                    </h3>
                    <p className="font-body text-[11.5px] text-slate-300 font-normal leading-[1.35] truncate">
                      {activeCategoryMeta.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSearching && !selectedCategory && (
              <div
                style={{
                  animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                  willChange: 'transform, opacity, filter',
                }}
                className="pb-1.5 flex items-center justify-between gap-2"
              >
                <p className="font-body text-xs text-slate-300 font-normal min-w-0 truncate">
                  Hasil pencarian{' '}
                  <span className="text-white font-semibold">"{searchQuery}"</span>
                </p>
                <span className="font-body text-[11px] font-medium tabular-nums text-[#C5A059] shrink-0">
                  {displayedPerfumes.length} ditemukan
                </span>
              </div>
            )}

            {displayedPerfumes.length === 0 ? (
              <div
                style={{
                  animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                  willChange: 'transform, opacity, filter',
                }}
                className="py-9 px-4 text-center border border-white/10 rounded-xl bg-[#131620]"
              >
                <p className="font-heading text-[15px] font-semibold text-white leading-[1.25]">
                  Belum ada varian pada pencarian atau kategori ini
                </p>
                <p className="font-body text-xs text-slate-400 font-normal leading-[1.5] mt-1">
                  Silakan coba kata kunci lain atau kembali ke pilihan kategori.
                </p>
                {selectedCategory && (
                  <button
                    onClick={handleBackToCategories}
                    className="font-body mt-3 py-1.5 px-3.5 rounded-md bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                  >
                    Kembali ke 6 Kategori
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedPerfumes.map((perfume, idx) => {
                  const isFav = favorites.includes(perfume.id);
                  const characterText =
                    perfume.tagline ||
                    (perfume.accords && perfume.accords.length > 0
                      ? perfume.accords.slice(0, 3).join(' · ')
                      : '');
                  const usageText = (perfume.usageRecommendation || '').trim();
                  // Staggered cadence formula identik dengan 6 kategori (75ms cadence per baris, capped 450ms)
                  const cascadeDelayMs = Math.min(idx * 75, 450);

                  return (
                    <div
                      key={perfume.id}
                      onClick={() => handleOpenDetail(perfume)}
                      style={{
                        animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${cascadeDelayMs}ms both`,
                        willChange: 'transform, opacity, filter',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                      className="group p-2.5 sm:p-3 rounded-lg bg-[#141722] hover:bg-[#181c29] border border-white/10 hover:border-[#C5A059]/45 shadow-[0_4px_14px_rgba(0,0,0,0.35)] cursor-pointer transition-all duration-200 active:scale-[0.97]"
                    >
                      {/* Compact Header Row: Clear Perfume Name + Favorite Button */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading text-[14.5px] sm:text-[15px] font-semibold text-white group-hover:text-[#F3E6C8] tracking-[-0.015em] leading-[1.25] min-w-0 flex-1 break-words">
                          {perfume.name}
                        </h3>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(perfume.id, perfume.name);
                          }}
                          className="p-1 -mr-1 -mt-0.5 rounded-md text-slate-400 hover:text-rose-400 transition-colors shrink-0 active:scale-90"
                          title="Simpan ke favorit"
                        >
                          <Heart
                            size={14}
                            className={isFav ? 'fill-rose-500 text-rose-500' : ''}
                          />
                        </button>
                      </div>

                      {/* Concise Aroma & Usage Info */}
                      <div className="mt-1 space-y-0.5 font-body text-xs leading-[1.45]">
                        {characterText && (
                          <p className="text-slate-200 font-normal line-clamp-1">
                            <span className="text-[#C5A059] font-medium">Aroma: </span>
                            {characterText}
                          </p>
                        )}
                        {usageText && (
                          <p className="text-slate-400 font-normal line-clamp-1">
                            <span className="text-slate-300 font-medium">Cocok: </span>
                            {usageText}
                          </p>
                        )}
                      </div>

                      {/* Persuasive Action Footer */}
                      <div className="mt-2.5 pt-2 border-t border-white/[0.07] flex items-center justify-between gap-2.5">
                        <span className="font-body text-[11px] text-slate-400 font-normal leading-tight truncate min-w-0 flex-1">
                          {perfume.accords && perfume.accords.length > 0
                            ? perfume.accords.slice(0, 3).join(' · ')
                            : 'Koleksi Eksklusif SINKI'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(perfume);
                          }}
                          className="font-body py-1.5 px-2.5 rounded-md bg-white/[0.05] hover:bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E2C27F] hover:text-[#F3E6C8] text-[11.5px] font-semibold leading-none flex items-center gap-1 shrink-0 transition-all duration-200 active:scale-[0.95]"
                        >
                          <span>Ambil Aroma Ini</span>
                          <ChevronRight size={12} className="text-[#DFB76C]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REUSABLE PERFUME DETAIL SHEET (100% Identik di Collection, Order & Review) */}
      <PerfumeDetailModal
        perfume={detailPerfume}
        onClose={handleCloseDetail}
        onShowToast={onShowToast}
        onCartUpdated={onCartUpdated}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

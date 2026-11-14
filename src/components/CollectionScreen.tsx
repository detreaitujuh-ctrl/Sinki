import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  X,
  ArrowLeft,
  ChevronRight,
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
import { ReviewItem, getCachedReviews, fetchReviewsFromSupabase } from '../utils/reviewStorage';
import { useConstantTickerSpeed } from '../utils/useConstantTickerSpeed';
import { PerfumeDetailModal } from './PerfumeDetailModal';
import { playInteractionSound } from '../utils/soundEngine';
import { LuxuryThemeId } from '../utils/themeStorage';

import catDailyFreshImg from '../assets/images/cat_daily_fresh.webp';
import catProfessionalImg from '../assets/images/cat_professional.webp';
import catAttractionImg from '../assets/images/cat_attraction.webp';
import catLuxuryImg from '../assets/images/cat_luxury.webp';
import catViralHitsImg from '../assets/images/cat_viral_hits.webp';
import catNewTrendingImg from '../assets/images/cat_new_trending.webp';

export const CATEGORY_ARTWORK: Record<CollectionCategoryKey, string> = {
  daily_fresh: catDailyFreshImg,
  professional: catProfessionalImg,
  attraction: catAttractionImg,
  luxury: catLuxuryImg,
  viral_hits: catViralHitsImg,
  new_trending: catNewTrendingImg,
};

export const CATEGORY_VISUAL_STYLE: Record<
  CollectionCategoryKey,
  { glow: string; catPos: string; varPos: string; isDarkSubject?: boolean }
> = {
  daily_fresh: {
    glow: 'radial-gradient(85% 95% at 88% 82%, rgba(56, 189, 248, 0.16) 0%, rgba(16, 185, 129, 0.14) 48%, transparent 82%)',
    catPos: 'object-[92%_86%]',
    varPos: 'object-[84%_74%]',
  },
  professional: {
    glow: 'radial-gradient(85% 95% at 90% 62%, rgba(242, 186, 102, 0.16) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 82%)',
    catPos: 'object-[92%_68%]',
    varPos: 'object-[86%_62%]',
    isDarkSubject: true,
  },
  attraction: {
    glow: 'radial-gradient(85% 95% at 86% 78%, rgba(244, 63, 94, 0.18) 0%, rgba(16, 185, 129, 0.12) 48%, transparent 82%)',
    catPos: 'object-[86%_72%]',
    varPos: 'object-[80%_62%]',
  },
  luxury: {
    glow: 'radial-gradient(85% 95% at 88% 76%, rgba(253, 224, 130, 0.2) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 82%)',
    catPos: 'object-[94%_78%]',
    varPos: 'object-[88%_70%]',
  },
  viral_hits: {
    glow: 'radial-gradient(85% 95% at 88% 78%, rgba(245, 158, 11, 0.18) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 82%)',
    catPos: 'object-[92%_82%]',
    varPos: 'object-[86%_74%]',
  },
  new_trending: {
    glow: 'radial-gradient(85% 95% at 88% 82%, rgba(163, 230, 53, 0.18) 0%, rgba(16, 185, 129, 0.14) 48%, transparent 82%)',
    catPos: 'object-[92%_84%]',
    varPos: 'object-[86%_74%]',
  },
};

interface CollectionScreenProps {
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
  onCartUpdated?: () => void;
  onNavigateToReview?: () => void;
  scrollToTopTrigger?: number;
  perfumes?: PerfumeItem[];
  targetCategory?: CollectionCategoryKey | 'overview' | null;
  onClearTargetCategory?: () => void;
  themeId?: LuxuryThemeId | string;
}

/**
 * Frameless 3D Layered Category Icons (Icon Only — No Background Box or Frame)
 */
export const Category3DIcon: React.FC<{
  id: CollectionCategoryKey;
  sizeClass?: string;
  idPrefix?: string;
}> = ({ id, sizeClass = 'w-5 h-5', idPrefix = 'col' }) => {
  switch (id) {
    case 'daily_fresh':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${idPrefix}-dfDrop`} x1="15%" y1="5%" x2="85%" y2="95%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path
            d="M16 4.2C16 4.2 7.4 14.5 7.4 20.1C7.4 24.8 11.2 28.4 16 28.4C20.8 28.4 24.6 24.8 24.6 20.1C24.6 14.5 16 4.2 16 4.2Z"
            fill={`url(#${idPrefix}-dfDrop)`}
          />
          <path
            d="M11.8 16.8C10.9 19.0 11.6 22.0 13.7 23.6"
            stroke="#ffffff"
            strokeWidth="2.1"
            strokeLinecap="round"
            fill="none"
            opacity="0.88"
          />
          <circle cx="13.2" cy="13.5" r="1.35" fill="#ffffff" opacity="0.92" />
        </svg>
      );

    case 'professional':
      return (
        <svg
          viewBox="0 0 32 32"
          className={`${sizeClass} shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${idPrefix}-proCase`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E39752" />
              <stop offset="52%" stopColor="#A65822" />
              <stop offset="100%" stopColor="#5E2C0C" />
            </linearGradient>
            <linearGradient id={`${idPrefix}-proTop`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F0AC6A" />
              <stop offset="100%" stopColor="#8A4517" />
            </linearGradient>
            <linearGradient id={`${idPrefix}-proHandle`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4CE" />
              <stop offset="100%" stopColor="#C89B42" />
            </linearGradient>
          </defs>
          <path
            d="M12 9.5V7.6C12 6.6 12.8 5.8 13.8 5.8H18.2C19.2 5.8 20 6.6 20 7.6V9.5"
            stroke={`url(#${idPrefix}-proHandle)`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="4.5" y="9.5" width="23" height="16.5" rx="3.5" fill={`url(#${idPrefix}-proCase)`} />
          <path
            d="M4.5 13C4.5 11.067 6.067 9.5 8 9.5H24C25.933 9.5 27.5 11.067 27.5 13V15.6C20.2 17.5 11.8 17.5 4.5 15.6V13Z"
            fill={`url(#${idPrefix}-proTop)`}
            opacity="0.96"
          />
          <rect x="14" y="14" width="4" height="4.2" rx="1" fill="#3B1A06" />
          <rect x="14.8" y="14.8" width="2.4" height="2.6" rx="0.5" fill="#FFE6A3" />
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
            <linearGradient id={`${idPrefix}-attHeart`} x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <path
            d="M15.2 25.6C14.8 25.6 14.4 25.45 14.05 25.2C8.7 21.4 4.8 17.2 4.8 12.6C4.8 9.2 7.4 6.6 10.6 6.6C12.6 6.6 14.3 7.6 15.2 9.1C16.1 7.6 17.8 6.6 19.8 6.6C23.0 6.6 25.6 9.2 25.6 12.6C25.6 17.2 21.7 21.4 16.35 25.2C16.0 25.45 15.6 25.6 15.2 25.6Z"
            fill={`url(#${idPrefix}-attHeart)`}
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
            <linearGradient id={`${idPrefix}-luxCrown`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E7" />
              <stop offset="45%" stopColor="#DFB76C" />
              <stop offset="100%" stopColor="#9A742F" />
            </linearGradient>
          </defs>
          <path
            d="M5 21.5L3.2 10.2L10.3 14.8L16 7L21.7 14.8L28.8 10.2L27 21.5H5Z"
            fill={`url(#${idPrefix}-luxCrown)`}
          />
          <rect x="5" y="22.8" width="22" height="3.1" rx="1.3" fill={`url(#${idPrefix}-luxCrown)`} />
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
            <linearGradient id={`${idPrefix}-vfOuter`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id={`${idPrefix}-vfInner`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
          </defs>
          <path
            d="M17 3.8C17.6 8.3 14.3 11.1 14.3 11.1C14.3 11.1 20 9.6 22.3 14.2C24.3 18.2 22.4 23.6 18.3 25.9C14.2 28.1 8.6 26.1 7.3 21.1C6.3 17.0 8.9 12.9 11.4 11.1C11.0 13.2 12.1 14.6 12.1 14.6C11.5 10.0 14.0 6.0 17 3.8Z"
            fill={`url(#${idPrefix}-vfOuter)`}
          />
          <path
            d="M16 14.2C17.9 16.1 18.8 19.0 17.5 21.7C16.4 24.0 13.5 24.6 11.9 22.5C10.6 20.8 11.5 18.1 13.5 16.8C13.5 18.0 14.3 18.8 14.3 18.8C14.1 16.9 14.8 15.4 16 14.2Z"
            fill={`url(#${idPrefix}-vfInner)`}
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
          <defs>
            <linearGradient id={`${idPrefix}-ntBolt`} x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="38%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path
            d="M18.6 3.8L7.2 17.8H14.8L12.6 28.2L24.8 13.8H17.2L18.6 3.8Z"
            fill={`url(#${idPrefix}-ntBolt)`}
            stroke="#bae6fd"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <path
            d="M17.2 6.2L10.4 16.0H15.4"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
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
  targetCategory,
  onClearTargetCategory,
  themeId,
}) => {
  const isBotanical = themeId === 'botanical-crystal';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategoryKey | null>(null);
  const [detailPerfume, setDetailPerfume] = useState<PerfumeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  // Reviews for the live customer feedback marquee
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

  const collectionTickerTrackRef = useConstantTickerSpeed(26);
  const marqueeReviews = useMemo(
    () =>
      collectionReviews.length === 1
        ? [...collectionReviews, ...collectionReviews]
        : collectionReviews,
    [collectionReviews]
  );

  const [catalogPerfumes, setCatalogPerfumes] = useState<PerfumeItem[]>(() =>
    perfumes && perfumes.length > 0 ? perfumes : getStoredPerfumes()
  );

  useEffect(() => {
    if (perfumes && perfumes.length > 0) {
      setCatalogPerfumes(perfumes);
    }
  }, [perfumes]);

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

  useEffect(() => {
    if (scrollToTopTrigger) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopTrigger]);

  useEffect(() => {
    if (!targetCategory) return;
    setSearchQuery('');
    setSelectedCategory(targetCategory === 'overview' ? null : targetCategory);
    setViewTransitionKey((k) => k + 1);
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
    onClearTargetCategory?.();
  }, [targetCategory, onClearTargetCategory]);

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

  const activePerfumes = useMemo(() => {
    const source = catalogPerfumes && catalogPerfumes.length > 0 ? catalogPerfumes : getStoredPerfumes();
    return source.filter((item) => item.isActive !== false);
  }, [catalogPerfumes]);

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

  const displayedPerfumes = useMemo(() => {
    return activePerfumes.filter((item) => {
      const itemCats = Array.isArray(item.collectionCategories) ? item.collectionCategories : [];
      const matchesCategory = selectedCategory ? itemCats.includes(selectedCategory) : true;

      if (!trimmedQuery) {
        return selectedCategory ? matchesCategory : false;
      }

      const normalizedItemText = `${item.name} ${item.tagline} ${item.usageRecommendation || ''} ${item.accords.join(' ')}`
        .toLowerCase()
        .replace(/bvlgari/g, 'bvlgari bulgari')
        .replace(/hmns/g, 'hmns hnms hms');

      const matchesSearch = normalizedItemText.includes(trimmedQuery);

      return selectedCategory ? matchesCategory && matchesSearch : matchesSearch;
    });
  }, [activePerfumes, selectedCategory, trimmedQuery]);

  const handleSelectCategory = (catId: CollectionCategoryKey) => {
    playInteractionSound('glassTap');
    setSelectedCategory(catId);
    setViewTransitionKey((prev) => prev + 1);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    playInteractionSound('digitalSoft');
    setSelectedCategory(null);
    setSearchQuery('');
    setViewTransitionKey((prev) => prev + 1);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetail = (perfume: PerfumeItem) => {
    playInteractionSound('glassTap');
    setDetailPerfume(perfume);
  };

  const handleCloseDetail = () => {
    setDetailPerfume(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {!isBotanical && (
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
      )}

      <div className={`relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden ${isBotanical ? 'sinki-botanical-collection' : ''}`}>
      {/* TOP BAR / HEADER (Transparent in Botanical so Sunlit Leaves Shine Through) */}
      <div
        className={`relative z-20 px-4 pt-3 pb-2 shrink-0 ${
          isBotanical
            ? 'bg-transparent lg:pt-6'
            : 'sinki-arch-header border-b backdrop-blur-md pb-3'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={selectedCategory ? handleBackToCategories : onBackToHome}
              className={`w-8 h-8 flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                isBotanical
                  ? 'rounded-[10px] sinki-botanical-back-btn text-white hover:border-[#FFF6D4]'
                  : 'rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border text-[#E8C782] hover:text-[#F3E6C8]'
              }`}
              title={selectedCategory ? 'Kembali ke Kategori' : 'Kembali ke Beranda'}
            >
              <ArrowLeft size={16} />
            </button>

            <div onClick={handleScrollToTop} className="cursor-pointer select-none min-w-0">
              {selectedCategory && activeCategoryMeta ? (
                <div className="flex items-baseline gap-1.5 truncate">
                  <h2
                    className={`font-heading text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] leading-[1.2] truncate ${
                      isBotanical ? 'text-white' : 'text-white'
                    }`}
                  >
                    {activeCategoryMeta.title}
                  </h2>
                  <span
                    className={`font-body text-[11.5px] font-semibold tabular-nums shrink-0 ${
                      isBotanical
                        ? 'sinki-botanical-variant-count'
                        : 'text-[#E8C574]'
                    }`}
                  >
                    · {displayedPerfumes.length > 0 || isSearching
                      ? `${displayedPerfumes.length} varian`
                      : 'Segera Hadir'}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <h2
                    className={`font-heading text-[17px] sm:text-[18px] font-semibold tracking-[-0.015em] leading-[1.2] text-white`}
                  >
                    Collection
                  </h2>
                  <span
                    className={`font-body text-[12px] font-semibold tabular-nums ${
                      isBotanical
                        ? 'text-white'
                        : 'text-slate-300/90'
                    }`}
                  >
                    · {activePerfumes.length} varian
                  </span>
                </div>
              )}
            </div>
          </div>

          {selectedCategory && (
            <button
              onClick={handleBackToCategories}
              className={`font-body py-1 px-2.5 text-[11.5px] font-semibold transition-all shrink-0 active:scale-95 ${
                isBotanical
                  ? 'rounded-full sinki-botanical-pill text-white'
                  : 'rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border text-[#DFB76C] hover:text-amber-200'
              }`}
            >
              Semua Kategori
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full mt-0.5">
          <div
            className={`relative w-full ${
              isBotanical
                ? 'rounded-full sinki-botanical-pill overflow-hidden'
                : 'rounded-[8px]'
            }`}
          >
            <Search
              size={15}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${
                isBotanical ? 'text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]' : 'text-[#D4AF6A]'
              }`}
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
              className={`relative z-10 font-body w-full pl-10 pr-8 text-base sm:text-sm leading-normal font-medium focus:outline-none transition-colors ${
                isBotanical
                  ? 'py-2 bg-transparent text-white placeholder:text-white/90'
                  : 'py-2.5 rounded-[8px] sinki-arch-input border text-white placeholder:text-slate-400 font-normal'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 ${
                  isBotanical
                    ? 'text-white/90 hover:text-white bg-black/35 rounded-full p-0.5'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bersihkan pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN SCROLLABLE CONTENT */}
      <div
        ref={scrollContainerRef}
        className={`relative z-10 flex-1 overflow-y-auto px-4 no-scrollbar ${
          isBotanical ? 'pb-36' : 'pb-28'
        }`}
      >
        {/* VIEW A: HEADING + 6 CATEGORY CARDS */}
        {!selectedCategory && !isSearching && (
          <div key={`categories-view-${viewTransitionKey}`} className="pt-1 pb-2">
            <div className="sinki-heading-anim flex items-center justify-center gap-2.5 mb-2.5 px-1 text-center">
              <span
                aria-hidden="true"
                className="sinki-tapered-line-left h-[1px] flex-1 max-w-[68px]"
              />
              <h1 className="sinki-collection-heading font-heading text-[15px] sm:text-[16px] font-semibold tracking-[-0.015em] leading-[1.2] shrink-0">
                Temukan Aroma Karaktermu
              </h1>
              <span
                aria-hidden="true"
                className="sinki-tapered-line-right h-[1px] flex-1 max-w-[68px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {COLLECTION_CATEGORIES.map((cat, idx) => {
                const count = categoryCounts[cat.id];
                const rateNote =
                  cat.id === 'viral_hits'
                    ? 'Rp3.000/ml'
                    : cat.id === 'new_trending'
                    ? 'Rp4.000/ml'
                    : null;

                const rowIdx = Math.floor(idx / 2);
                const cascadeClass =
                  rowIdx === 0
                    ? 'sinki-cascade-row-0'
                    : rowIdx === 1
                    ? 'sinki-cascade-row-1'
                    : 'sinki-cascade-row-2';

                const catImage = CATEGORY_ARTWORK[cat.id];
                const catVisual = CATEGORY_VISUAL_STYLE[cat.id];

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`${cascadeClass} group relative text-left flex flex-col justify-between overflow-hidden transition-transform duration-150 active:scale-[0.96] ${
                      isBotanical
                        ? 'p-2.5 sm:p-3 rounded-[15px] sinki-botanical-card min-h-[92px]'
                        : 'p-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border min-h-[86px]'
                    }`}
                  >
                    {/* Menyatu Lembut dengan Gambar Pendukung Kategori */}
                    {isBotanical && catImage && (
                      <>
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-45"
                          style={{ background: catVisual.glow }}
                        />
                        <img
                          src={catImage}
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className={`pointer-events-none absolute inset-0 w-full h-full object-cover ${catVisual.catPos} sinki-botanical-art-cat ${
                            catVisual.isDarkSubject ? 'sinki-botanical-art-pro' : ''
                          }`}
                        />
                      </>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Category3DIcon id={cat.id} sizeClass={isBotanical ? 'w-5 h-5' : 'w-4 h-4'} />
                          <h3
                            className={`font-heading text-[13px] sm:text-[13.5px] font-semibold tracking-[-0.01em] leading-[1.22] truncate ${
                              isBotanical
                                ? 'text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]'
                                : 'text-white group-hover:text-[#F3E6C8]'
                            }`}
                          >
                            {cat.title}
                          </h3>
                        </div>
                        <ChevronRight
                          size={14}
                          className={`transition-transform shrink-0 ${
                            isBotanical
                              ? 'text-white group-hover:translate-x-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                              : 'text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>

                      <p
                        className={`font-body text-[11px] leading-[1.35] mt-1 line-clamp-1 ${
                          isBotanical
                            ? 'font-medium text-white'
                            : 'font-normal text-slate-300/95'
                        }`}
                      >
                        {cat.subtitle}
                      </p>
                    </div>

                    <div className="relative z-10 mt-2.5 w-full">
                      <div
                        className={
                          isBotanical
                            ? 'sinki-botanical-divider mb-1.5'
                            : 'border-t border-[#D4AF6A]/20 mb-2'
                        }
                      />
                      <div className="flex items-center justify-between gap-1.5 w-full">
                        <span
                          className={`font-body text-[11px] font-semibold leading-none tabular-nums transition-colors ${
                            isBotanical
                              ? count > 0
                                ? 'sinki-botanical-variant-count'
                                : 'sinki-botanical-variant-count italic'
                              : count > 0
                              ? 'font-medium text-[#E8C574] group-hover:text-[#F3E6C8]'
                              : 'font-medium text-[#DFB76C]/85 italic'
                          }`}
                        >
                          {count > 0 ? `${count} varian` : 'Segera Hadir'}
                        </span>
                        {rateNote && count > 0 && (
                          <span
                            className={`font-body text-[10.5px] font-semibold leading-none tabular-nums shrink-0 ${
                              isBotanical
                                ? 'text-white'
                                : 'text-[#DFB76C]'
                            }`}
                          >
                            {rateNote}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SECTION ULASAN TESTIMONI: HORIZONTAL MINIMALIS */}
            <div className="mt-3.5 relative">
              <div
                onClick={onNavigateToReview}
                className={`luxury-ticker-container relative w-full py-2 px-3 flex items-center gap-2 cursor-pointer overflow-hidden group transition-colors ${
                  isBotanical
                    ? 'rounded-full sinki-botanical-pill hover:border-[#F2E0A8]/80'
                    : 'py-1.5 px-2.5 rounded-[8px] sinki-arch-bar hover:border-[#E8C782]/65 border'
                }`}
                title="Ketuk untuk melihat ulasan pembeli"
              >
                <div
                  className={`relative z-10 w-5 h-5 flex items-center justify-center shrink-0 ${
                    isBotanical
                      ? 'rounded-[7px] bg-[#1E5631]/75 border border-[#E5D29A]/60 text-white'
                      : 'rounded-[6px] bg-[#DFB76C]/15 border border-[#DFB76C]/35 text-[#DFB76C]'
                  }`}
                >
                  <Star size={11} className="fill-current" />
                </div>

                <div className="relative z-10 overflow-hidden flex-1 ticker-mask-fade">
                  <div
                    ref={collectionTickerTrackRef}
                    className={`luxury-ticker-track font-body text-[11px] leading-tight ${
                      isBotanical ? 'text-white font-medium' : 'text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 pr-4">
                      {marqueeReviews.map((r, i) => (
                        <span key={`rev-a-${i}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {isBotanical ? (
                            <span className="font-semibold text-white">{r.name}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-[5px] text-[10.5px] tracking-wide shadow-xs text-amber-200 bg-[#DFB76C]/15 border border-[#DFB76C]/30">
                              <span className="text-[10px]">👤</span>
                              <span>{r.name}</span>
                            </span>
                          )}
                          {r.variant && (
                            <span className={isBotanical ? 'text-white text-[10.5px] font-medium' : 'text-[#DFB76C]/80 text-[10px] font-medium'}>
                              ({r.variant})
                            </span>
                          )}
                          <span className="font-semibold">{r.emoji || '★'}</span>
                          <span className={isBotanical ? 'text-white font-medium' : 'text-zinc-200 font-normal'}>
                            "{r.comment}"
                          </span>
                          <span className="text-white/75 px-1">•</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 pr-4" aria-hidden="true">
                      {marqueeReviews.map((r, i) => (
                        <span key={`rev-b-${i}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {isBotanical ? (
                            <span className="font-semibold text-white">{r.name}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-[5px] text-[10.5px] tracking-wide shadow-xs text-amber-200 bg-[#DFB76C]/15 border border-[#DFB76C]/30">
                              <span className="text-[10px]">👤</span>
                              <span>{r.name}</span>
                            </span>
                          )}
                          {r.variant && (
                            <span className={isBotanical ? 'text-white text-[10.5px] font-medium' : 'text-[#DFB76C]/80 text-[10px] font-medium'}>
                              ({r.variant})
                            </span>
                          )}
                          <span className="font-semibold">{r.emoji || '★'}</span>
                          <span className={isBotanical ? 'text-white font-medium' : 'text-zinc-200 font-normal'}>
                            "{r.comment}"
                          </span>
                          <span className="text-white/75 px-1">•</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {onNavigateToReview && (
                <div className="flex justify-end mt-1.5 px-0.5">
                  <button
                    type="button"
                    onClick={onNavigateToReview}
                    className={`font-body text-[11.5px] active:opacity-70 transition-colors flex items-center gap-1 cursor-pointer select-none group ${
                      isBotanical
                        ? 'text-white font-semibold'
                        : 'text-[#DFB76C] hover:text-amber-200'
                    }`}
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

        {/* VIEW B: VARIANT LIST (OPSI A: SETIAP KOTAK VARIAN MENAMPILKAN GAMBAR KATEGORI MASING-MASING, RINGAN 60FPS) */}
        {(selectedCategory || isSearching) && (
          <div
            key={`variants-view-${selectedCategory || 'search'}-${viewTransitionKey}`}
            className="pt-2 space-y-2.5 sinki-screen-soft-fade"
          >
            {selectedCategory && activeCategoryMeta && !isSearching && (
              <div
                style={{
                  animation: 'sinkiCardCascade 320ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                }}
                className={`pb-2.5 mb-1 flex items-center justify-between gap-2.5 ${
                  isBotanical
                    ? 'border-b border-[#E5D29A]/35'
                    : 'border-b border-[#D4AF6A]/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Category3DIcon id={activeCategoryMeta.id} sizeClass="w-5 h-5" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-[14.5px] sm:text-[15.5px] font-semibold text-white tracking-[-0.015em] leading-[1.22] drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                      {activeCategoryMeta.title}
                    </h3>
                    <p
                      className={`font-body text-[11.5px] leading-[1.35] truncate ${
                        isBotanical
                          ? 'text-white font-medium'
                          : 'text-slate-300 font-normal'
                      }`}
                    >
                      {activeCategoryMeta.subtitle}
                    </p>
                  </div>
                </div>
                {(activeCategoryMeta.id === 'viral_hits' ||
                  activeCategoryMeta.id === 'new_trending') && (
                  <span
                    className={`font-body text-[11px] font-semibold tabular-nums px-2.5 py-0.5 shrink-0 ${
                      isBotanical
                        ? 'rounded-full sinki-botanical-pill text-white'
                        : 'rounded-[6px] bg-[#C5A059]/15 border border-[#DFB76C]/35 text-[#F3E6C8]'
                    }`}
                  >
                    {activeCategoryMeta.id === 'viral_hits' ? 'Rp3.000/ml' : 'Rp4.000/ml'}
                  </span>
                )}
              </div>
            )}

            {isSearching && !selectedCategory && (
              <div
                style={{
                  animation: 'sinkiCardCascade 320ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                }}
                className="pb-1.5 flex items-center justify-between gap-2"
              >
                <p
                  className={`font-body text-xs min-w-0 truncate ${
                    isBotanical ? 'text-white font-medium' : 'text-slate-300 font-normal'
                  }`}
                >
                  Hasil pencarian{' '}
                  <span className="text-white font-semibold">"{searchQuery}"</span>
                </p>
                <span
                  className={`font-body text-[11px] font-semibold tabular-nums shrink-0 ${
                    isBotanical ? 'sinki-botanical-variant-count' : 'text-[#E8C574] font-medium'
                  }`}
                >
                  {displayedPerfumes.length} ditemukan
                </span>
              </div>
            )}

            {displayedPerfumes.length === 0 ? (
              <div
                style={{
                  animation: 'sinkiCardCascade 320ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                }}
                className={`py-9 px-4 text-center ${
                  isBotanical ? 'rounded-[16px] sinki-botanical-card' : 'border rounded-[8px] sinki-arch-card'
                }`}
              >
                <p className="font-heading text-[15px] font-semibold text-white leading-[1.25]">
                  {!isSearching && selectedCategory
                    ? `Koleksi ${activeCategoryMeta?.title || ''} Segera Hadir`
                    : 'Belum ada varian pada pencarian ini'}
                </p>
                <p className="font-body text-xs text-slate-400 font-normal leading-[1.5] mt-1">
                  {!isSearching && selectedCategory
                    ? 'Kurasi aroma terbaik untuk kategori ini sedang kami siapkan. Silakan jelajahi 4 kategori utama lainnya.'
                    : 'Silakan coba kata kunci lain atau kembali ke pilihan kategori.'}
                </p>
                {selectedCategory && (
                  <button
                    onClick={handleBackToCategories}
                    className={`font-body mt-3 py-1.5 px-3.5 text-xs font-medium text-white transition-colors ${
                      isBotanical
                        ? 'rounded-full sinki-botanical-pill'
                        : 'rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border text-slate-200'
                    }`}
                  >
                    Kembali ke Semua Kategori
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedPerfumes.map((perfume, idx) => {
                  const isFav = favorites.includes(perfume.id);
                  const characterText =
                    perfume.tagline ||
                    (perfume.accords && perfume.accords.length > 0
                      ? perfume.accords.slice(0, 3).join(' · ')
                      : '');
                  const cascadeDelayMs = Math.min(idx * 35, 240);

                  const resolvedArtCategory: CollectionCategoryKey =
                    selectedCategory ||
                    (Array.isArray(perfume.collectionCategories) && perfume.collectionCategories[0]) ||
                    'luxury';
                  const variantArtImg = CATEGORY_ARTWORK[resolvedArtCategory];
                  const variantVisual = CATEGORY_VISUAL_STYLE[resolvedArtCategory];

                  return (
                    <div
                      key={perfume.id}
                      onClick={() => handleOpenDetail(perfume)}
                      style={{
                        animation: `sinkiCardCascade 320ms cubic-bezier(0.22, 1, 0.36, 1) ${cascadeDelayMs}ms both`,
                      }}
                      className={`group relative overflow-hidden cursor-pointer transition-transform duration-150 active:scale-[0.97] ${
                        isBotanical
                          ? 'p-3 sm:p-3.5 rounded-[15px] sinki-botanical-card'
                          : 'p-2.5 sm:p-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border'
                      }`}
                    >
                      {isBotanical && variantArtImg && (
                        <>
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={{ background: variantVisual.glow }}
                          />
                          <img
                            src={variantArtImg}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className={`pointer-events-none absolute right-0 inset-y-0 w-[58%] sm:w-[50%] h-full object-cover ${variantVisual.varPos} sinki-botanical-art-variant ${
                              variantVisual.isDarkSubject ? 'sinki-botanical-art-pro' : ''
                            }`}
                          />
                        </>
                      )}

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          {isBotanical && (
                            <Category3DIcon
                              id={resolvedArtCategory}
                              sizeClass="w-[18px] h-[18px]"
                              idPrefix={`var-${perfume.id}`}
                            />
                          )}
                          <h3
                            className={`font-heading text-[14.5px] sm:text-[15.5px] font-semibold tracking-[-0.015em] leading-[1.25] min-w-0 flex-1 break-words ${
                              isBotanical
                                ? 'text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]'
                                : 'text-white group-hover:text-[#F3E6C8]'
                            }`}
                          >
                            {perfume.name}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(perfume.id, perfume.name);
                          }}
                          className={`p-1 -mr-1 -mt-0.5 rounded-full transition-colors shrink-0 active:scale-90 ${
                            isBotanical
                              ? 'text-white/95 hover:text-rose-400 bg-black/35'
                              : 'rounded-[6px] text-slate-400 hover:text-rose-400'
                          }`}
                          title="Simpan ke favorit"
                        >
                          <Heart
                            size={14}
                            className={isFav ? 'fill-rose-500 text-rose-500' : ''}
                          />
                        </button>
                      </div>

                      {characterText && (
                        <div className={`relative z-10 mt-1.5 font-body text-xs leading-[1.45] ${isBotanical ? 'pr-[22%] sm:pr-[20%]' : ''}`}>
                          <p
                            className={`line-clamp-1 ${
                              isBotanical
                                ? 'text-white font-medium'
                                : 'text-slate-200 font-normal'
                            }`}
                          >
                            <span
                              className={
                                isBotanical ? 'text-white font-bold' : 'text-[#C5A059] font-medium'
                              }
                            >
                              Aroma:{' '}
                            </span>
                            {characterText}
                          </p>
                        </div>
                      )}

                      <div className="relative z-10 mt-2.5">
                        <div
                          className={
                            isBotanical
                              ? 'sinki-botanical-divider-wide mb-2'
                              : 'border-t border-[#D4AF6A]/20 mb-2'
                          }
                        />
                        <div className="flex items-center justify-between gap-2.5">
                          <span
                            className={`font-body text-[11px] font-medium leading-tight truncate min-w-0 flex-1 ${
                              isBotanical
                                ? 'text-white'
                                : 'text-slate-400 font-normal'
                            }`}
                          >
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
                            className={`font-body py-1.5 px-3 text-[11.5px] font-semibold leading-none flex items-center gap-1 shrink-0 transition-transform duration-150 active:scale-[0.95] ${
                              isBotanical
                                ? 'rounded-full bg-[#06180d]/78 border border-[#F2DF9F]/90 hover:border-white text-white shadow-[0_3px_12px_rgba(0,0,0,0.75)]'
                                : 'px-2.5 rounded-[6px] sinki-arch-subbox hover:bg-[var(--arch-badge-bg)] border border-[var(--arch-border-default)] hover:border-[var(--arch-border-hover)] text-[var(--arch-text-accent-bright)] hover:text-white'
                            }`}
                          >
                            <span>Ambil Aroma Ini</span>
                            <ChevronRight
                              size={12}
                              className={isBotanical ? 'text-white' : 'text-[var(--arch-text-accent-bright)]'}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* REUSABLE PERFUME DETAIL SHEET */}
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

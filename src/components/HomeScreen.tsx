import defaultHeroBottles from '../assets/images/sinki_hero_bottles_1791873562398.jpg';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExternalLink, Menu, ArrowRight, Share2, Check, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import {
  DEFAULT_CHIBI,
  HeroStageEffect,
  DEFAULT_HERO_BOTTLES,
  getStoredHeroBottles,
  getStoredHeroStageEffect,
  getStoredHeroStageEnabled,
  getStoredHeroMediaType,
  getStoredHeroVideoUrl,
  getStoredHeroVideoPoster,
  getStoredHeroVideoFit,
  getStoredHeroVideoPosition,
  getStoredHeroHeightMode,
  HeroVideoFit,
  HeroVideoPosition,
  HeroHeightMode,
} from '../utils/assetStorage';
import { getShortShareUrl } from '../utils/shareUtils';
import { TickerConfig, TICKER_FONTS, getStoredTicker } from '../utils/tickerStorage';
import { useConstantTickerSpeed } from '../utils/useConstantTickerSpeed';
import {
  SocialLinks,
  getStoredSocialLinks,
  extractTikTokHandle,
  extractInstagramHandle,
} from '../utils/socialStorage';

interface HomeScreenProps {
  onShowToast: (message: string) => void;
  onNavigateToCollection: () => void;
  onOpenDrawer: () => void;
  onOpenOwnerPin?: () => void;
  customLogo: string | null;
  customChibi: string | null;
  heroBottles?: string[];
  heroStageEffect?: HeroStageEffect;
  heroStageEnabled?: boolean;
  heroMediaType?: 'image' | 'video';
  heroVideoUrl?: string | null;
  heroVideoPoster?: string | null;
  heroVideoFit?: HeroVideoFit;
  heroVideoPosition?: HeroVideoPosition;
  heroHeightMode?: HeroHeightMode;
  tickerConfig?: TickerConfig;
  socialLinks?: SocialLinks;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onShowToast,
  onNavigateToCollection,
  onOpenDrawer,
  onOpenOwnerPin,
  customLogo,
  customChibi,
  heroBottles: propHeroBottles,
  heroStageEffect: propHeroStageEffect,
  heroStageEnabled: propHeroStageEnabled,
  heroMediaType: propHeroMediaType,
  heroVideoUrl: propHeroVideoUrl,
  heroVideoPoster: propHeroVideoPoster,
  heroVideoFit: propHeroVideoFit,
  heroVideoPosition: propHeroVideoPosition,
  heroHeightMode: propHeroHeightMode,
  tickerConfig,
  socialLinks: propSocialLinks,
}) => {
  const currentSocial = propSocialLinks || getStoredSocialLinks();
  const [copied, setCopied] = useState(false);

  // Hero Video & Poster Crossfade State
  const activeMediaType = propHeroMediaType || getStoredHeroMediaType();
  const activeVideoUrl = propHeroVideoUrl || getStoredHeroVideoUrl();
  const activePoster = propHeroVideoPoster || getStoredHeroVideoPoster() || customChibi || defaultHeroBottles;
  const isVideoMode = activeMediaType === 'video' && Boolean(activeVideoUrl);

  // Layout fitting attributes
  const activeFit = propHeroVideoFit || getStoredHeroVideoFit();
  const activePos = propHeroVideoPosition || getStoredHeroVideoPosition();
  const activeHeight = propHeroHeightMode || getStoredHeroHeightMode();

  const heightClass =
    activeHeight === 'compact'
      ? 'h-[60%]'
      : activeHeight === 'tall'
      ? 'h-[76%]'
      : activeHeight === 'full'
      ? 'inset-0 h-full w-full'
      : 'h-[68%]';
  const fitClass = activeFit === 'contain' ? 'object-contain' : 'object-cover';
  const posClass =
    activePos === 'top' ? 'object-top' : activePos === 'bottom' ? 'object-bottom' : 'object-center';

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoPlaying(false);
    setVideoFailed(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may need user interaction on some mobile browsers
      });
    }
  }, [activeVideoUrl, isVideoMode]);

  // 3D Stage Bottle State - Hanya aktif jika Owner menyalakan sakelar & mengunggah PNG botol kustom
  const isStageEnabled = propHeroStageEnabled !== undefined
    ? propHeroStageEnabled
    : getStoredHeroStageEnabled();

  const rawBottles = (propHeroBottles && propHeroBottles.length > 0)
    ? propHeroBottles
    : getStoredHeroBottles();
  const activeBottles = Array.isArray(rawBottles)
    ? rawBottles.filter((b) => typeof b === 'string' && b.trim() !== '' && !b.includes('top11/top-'))
    : [];
  const hasCustomHeroBottles = isStageEnabled && activeBottles.length > 0;
  const currentEffect: HeroStageEffect = propHeroStageEffect || getStoredHeroStageEffect();

  const [activeBottleIdx, setActiveBottleIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const nextBottle = useCallback(() => {
    if (!hasCustomHeroBottles) return;
    setActiveBottleIdx((prev) => (prev + 1) % activeBottles.length);
    setAnimKey((prev) => prev + 1);
  }, [hasCustomHeroBottles, activeBottles.length]);

  const prevBottle = useCallback(() => {
    if (!hasCustomHeroBottles) return;
    setActiveBottleIdx((prev) => (prev - 1 + activeBottles.length) % activeBottles.length);
    setAnimKey((prev) => prev + 1);
  }, [hasCustomHeroBottles, activeBottles.length]);

  const selectBottle = (idx: number) => {
    if (idx !== activeBottleIdx && idx < activeBottles.length) {
      setActiveBottleIdx(idx);
      setAnimKey((prev) => prev + 1);
    }
  };

  // Auto-slide every 4 seconds only if custom bottles are uploaded
  useEffect(() => {
    if (!hasCustomHeroBottles || activeBottles.length <= 1) return;

    autoPlayTimerRef.current = setInterval(() => {
      nextBottle();
    }, 4000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [hasCustomHeroBottles, activeBottles.length, nextBottle]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        nextBottle();
      } else {
        // Swiped right -> prev
        prevBottle();
      }
    }
    touchStartXRef.current = null;
  };

  const copyToClipboard = async () => {
    const publicUrl = await getShortShareUrl();
    let copiedSuccess = false;

    // 1. Try modern clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(publicUrl);
        copiedSuccess = true;
      } catch (clipErr) {
        // Suppress and fallback
      }
    }

    // 2. Fallback using temporary textarea
    if (!copiedSuccess && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = publicUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copiedSuccess = true;
      } catch (fallbackErr) {
        // Fallback suppressed
      }
    }

    setCopied(true);
    onShowToast('Tautan SINKI berhasil disalin!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    const publicUrl = await getShortShareUrl();
    const shareData = {
      title: 'Sinki parfum | Define your presence',
      text: 'Sinki parfum | Define your presence',
      url: publicUrl,
    };

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        onShowToast('Tautan SINKI berhasil dibagikan!');
        setTimeout(() => setCopied(false), 2200);
        return;
      } catch (err) {
        const error = err as Error;
        if (error && error.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback directly to clipboard
    await copyToClipboard();
  };

  const handleSocialClick = (platform: 'instagram' | 'tiktok') => {
    onShowToast(`Membuka ${platform === 'instagram' ? 'Instagram' : 'TikTok'} SINKI...`);
  };


  const currentTicker = tickerConfig || getStoredTicker();
  const activeFont = TICKER_FONTS.find((f) => f.id === currentTicker.font) || TICKER_FONTS[0];
  const tickerText = currentTicker.text.trim() || 'Tahan 8 jam, dia aja yang gak tahan 😏';
  const homeTickerTrackRef = useConstantTickerSpeed(26);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 pb-24 sm:pb-28 sinki-arch-canvas sinki-home-stage-canvas text-slate-100 overflow-y-auto no-scrollbar">
      {/* LAYER 2: HERO BACKDROP BOTOL PARFUM & VIDEO SINEMATIK (Panggung Tengah di bawah Teks Judul) */}
      <div className={`absolute inset-x-0 top-0 ${heightClass} pointer-events-none overflow-hidden z-0`}>
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#08080b]" />

        {/* 1. Video Layer: Diputar autoplay, loop, muted di latar belakang */}
        {isVideoMode && activeVideoUrl && (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            poster={activePoster}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onCanPlay={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onPlaying={() => {
              setVideoPlaying(true);
              setVideoFailed(false);
            }}
            onError={() => {
              setVideoFailed(true);
              setVideoPlaying(false);
            }}
            className={`absolute inset-0 w-full h-full ${fitClass} ${posClass} filter contrast-[1.03] brightness-100`}
          />
        )}

        {/* 2. Gambar Botol Parfum Hero / Poster:
            Awalnya tampil 100% langsung (zero delay, zero layar hitam).
            Ketika video mulai berputar, gambar memudar (dissolve fade-out) secara halus
            sehingga video masuk dengan mulus & elegan. */}
        <img
          src={activePoster}
          alt="SINKI Luxury Perfume Bottles Backdrop"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={`absolute inset-0 w-full h-full ${fitClass} ${posClass} filter contrast-[1.03] brightness-100 transition-opacity duration-1000 ease-in-out ${
            isVideoMode && videoPlaying && !videoFailed ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Pelindung Halus Area Judul & Menu (Ringan agar tidak meredupkan video) */}
        <div
          className={`absolute inset-x-0 top-0 ${
            activeHeight === 'full'
              ? 'h-24 bg-gradient-to-b from-black/50 via-black/18 to-transparent'
              : 'h-20 bg-gradient-to-b from-[#08080b]/75 via-[#08080b]/30 to-transparent'
          }`}
        />

        {/* Transisi Halus Bagian Bawah Video */}
        <div
          className={`absolute inset-x-0 bottom-0 ${
            activeHeight === 'full'
              ? 'h-28 bg-gradient-to-t from-[#08080b]/82 via-[#08080b]/35 to-transparent'
              : 'h-14 bg-gradient-to-t from-[#08080b] via-[#08080b]/55 to-transparent'
          }`}
        />

        {/* Tombol Mute / Unmute Interaktif saat video aktif & berputar */}
        {isVideoMode && videoPlaying && !videoFailed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((prev) => !prev);
              onShowToast(!isMuted ? 'Suara video dinonaktifkan (hening)' : 'Suara video sinematik aktif 🔊');
            }}
            className="pointer-events-auto absolute bottom-4 right-4 z-10 p-2 rounded-[8px] sinki-arch-bar backdrop-blur-md border text-white/80 hover:text-white transition-all shadow-md active:scale-95"
            title={isMuted ? 'Nyalakan Suara Video' : 'Matikan Suara Video'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-amber-400" />}
          </button>
        )}
      </div>

      {/* LAYER 1 (TERDEPAN / Z-20): TOP BAR MELAYANG ELEGAN */}
      <header className="relative z-20 flex items-center justify-between pt-2 sm:pt-2.5 pb-1 shrink-0">
        {/* Top-Left: Pure Typography "SINKI" (Selaras dengan Warna Tema Aktif SINKI) */}
        <div
          className="flex items-center select-none py-0.5 px-1"
          title="SINKI Parfums"
        >
          <span className="font-heading text-2xl sm:text-3xl font-bold tracking-[0.22em] text-[var(--arch-gold)] uppercase transition-colors duration-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.92)]">
            SINKI
          </span>
        </div>

        {/* Top-Right: 3-line hamburger menu button ("Garis 3" Selaras dengan Warna Tema Aktif SINKI) */}
        <button
          onClick={onOpenDrawer}
          className="p-1.5 text-[var(--arch-gold)] hover:text-[var(--arch-gold-bright)] flex items-center justify-center transition-all duration-200 active:scale-90 select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
          title="Menu Utama"
          aria-label="Menu"
        >
          <Menu size={22} className="stroke-[2.2]" />
        </button>
      </header>

      {/* CENTER STAGE: Jika belum ada botol PNG kustom yang diunggah, tetap bersih seperti semula */}
      {!hasCustomHeroBottles ? (
        <div className="relative z-10 flex-1 w-full my-auto min-h-[190px]" />
      ) : (
        /* LAYER 1 (Z-10): 3D LUXURY BOTTLE STAGE PEDESTAL */
        <div
          className="relative z-10 flex-1 w-full my-auto min-h-[220px] max-h-[300px] flex flex-col items-center justify-center select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Stage Bottle Frame */}
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Subtle Pedestal Halo Behind Bottle */}
            <div className="stage-pedestal-crystal absolute bottom-6 w-48 h-16 rounded-[100%] pointer-events-none filter blur-[1px]" />
            
            {/* Contact Shadow Under Bottle Base */}
            <div className="absolute bottom-5 w-24 sm:w-28 h-3.5 bg-black/75 rounded-[100%] blur-[5px] pointer-events-none" />

            {/* Active 3D Bottle with Selected Transition Effect */}
            <div
              key={animKey}
              className={`relative flex items-center justify-center stage-effect-${currentEffect} stage-bottle-float cursor-pointer`}
              onClick={nextBottle}
              title="Ketuk untuk melihat botol berikutnya"
            >
              <img
                src={activeBottles[activeBottleIdx]}
                alt={`SINKI Eau De Parfum Edition ${activeBottleIdx + 1}`}
                className="max-h-[195px] sm:max-h-[225px] w-auto max-w-[80%] object-contain select-none filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.85)] drop-shadow-[0_0_15px_rgba(223,183,108,0.18)]"
                draggable={false}
              />
            </div>

            {/* Discreet Micro Indicators if more than 1 bottle */}
            {activeBottles.length > 1 && (
              <div className="absolute bottom-0 flex items-center gap-1.5 py-1 px-2.5 rounded-[6px] sinki-arch-subbox border backdrop-blur-xs">
                {activeBottles.map((_, idx) => {
                  const isActive = activeBottleIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectBottle(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        isActive
                          ? 'w-4 h-1.5 bg-gradient-to-r from-[#DFB76C] to-[#F0DFB6] shadow-[0_0_8px_rgba(223,183,108,0.7)]'
                          : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                      }`}
                      aria-label={`Lihat Botol #${idx + 1}`}
                      title={`Botol #${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOWER SECTION:
          1. Story Card "Define your presence" + Icon-Only Share Button
          2. Equal-Sized Instagram & TikTok
          3. Minimalist swipe indicator
      */}
      <section className="relative z-10 space-y-2 shrink-0">
        {/* Slogan "Define your presence" with Floating Quiet Luxury Typography */}
        <div className="flex items-center justify-between gap-3 px-1 py-1">
          {/* Story Text */}
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-[14.5px] sm:text-[15px] font-semibold tracking-[-0.015em] text-white leading-[1.22] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Define your presence
            </h2>
            <p className="font-body text-xs text-slate-300 font-normal italic leading-[1.42] mt-0.5 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              “Aroma yang di tinggal lebih lama dari pada kesan pertama”
            </p>
          </div>

          {/* Standalone Model 1: 3 Bulatan Terhubung Garis (Share2) Berukuran Kecil Berwarna Putih */}
          <button
            onClick={handleShare}
            className="group shrink-0 relative p-1.5 text-white hover:text-slate-200 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center select-none"
            title="Bagikan SINKI"
            aria-label="Bagikan"
          >
            {copied ? (
              <Check
                size={16}
                className="text-white stroke-[2.5] filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] animate-in zoom-in-75 duration-200"
              />
            ) : (
              <Share2
                size={16}
                className="text-white group-hover:text-slate-200 stroke-[2.2] filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-colors"
              />
            )}
          </button>
        </div>

        {/* Follow Sinki Section with Equal-Sized Logos & Luxury Architectural Borders */}
        <div className="space-y-1.5">
          <span className="font-body text-[11px] font-medium tracking-[0.02em] text-slate-300 pl-1 block leading-tight">
            Follow Sinki
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Instagram Box */}
            <a
              href={currentSocial.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick('instagram')}
              className="group flex items-center justify-between py-2 px-2.5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border transition-all active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-[6px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-1.5 shrink-0 shadow-md">
                  <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="font-body block text-xs sm:text-[13px] font-semibold text-white leading-tight truncate">
                    {extractInstagramHandle(currentSocial.instagram)}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] shrink-0 ml-1" />
            </a>

            {/* TikTok Box */}
            <a
              href={currentSocial.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick('tiktok')}
              className="group flex items-center justify-between py-2 px-2.5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border transition-all active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-[6px] bg-black border border-[#D4AF6A]/30 flex items-center justify-center p-1.5 shrink-0 shadow-md">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#00f2fe"/>
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#fe2c55" opacity="0.7"/>
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#ffffff" opacity="0.85"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="font-body block text-xs sm:text-[13px] font-semibold text-white leading-tight truncate">
                    {extractTikTokHandle(currentSocial.tiktok)}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] shrink-0 ml-1" />
            </a>
          </div>
        </div>

        {/* Luxury Micro-Badge Marquee Box (Replaces Swipe to Collection) */}
        <button
          onClick={onNavigateToCollection}
          aria-label="Lihat Koleksi Parfum SINKI"
          className="luxury-ticker-container w-full py-2 px-3 rounded-[8px] sinki-arch-bar hover:border-[#E8C782]/65 border flex items-center gap-2 text-slate-100 transition-all active:scale-[0.98] backdrop-blur-md group overflow-hidden"
        >
          {/* Running Text Area with Mask Fade */}
          <div className="flex-1 overflow-hidden relative ticker-mask-fade py-0.5 min-w-0">
            <div
              ref={homeTickerTrackRef}
              className={`luxury-ticker-track font-body text-xs leading-tight text-slate-200 ${activeFont.styleClass}`}
            >
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span key={idx} className="inline-block pr-6 text-zinc-200 font-normal">
                  <span className="text-[#DFB76C] font-semibold mr-1.5">•</span> {tickerText}
                </span>
              ))}
            </div>
          </div>

          {/* Action indicator button/arrow */}
          <div className="shrink-0 flex items-center gap-1 font-body text-[11px] font-semibold leading-none text-[#DFB76C] group-hover:text-[#F0DFB6] pl-2.5 border-l border-[#D4AF6A]/25">
            <span className="hidden xs:inline">Koleksi</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform text-[#DFB76C]" />
          </div>
        </button>
      </section>
    </div>
  );
};

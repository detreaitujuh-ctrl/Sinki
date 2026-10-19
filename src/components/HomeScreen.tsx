import defaultHeroBottles from '../assets/images/sinki_hero_bottles_1791873562398.jpg';
import React, { useState, useRef } from 'react';
import { ExternalLink, Menu, ArrowRight, Share2, Check } from 'lucide-react';
import { DEFAULT_CHIBI } from '../utils/assetStorage';
import { getPublicShareUrl } from '../utils/shareUtils';
import { TickerConfig, TICKER_FONTS, getStoredTicker } from '../utils/tickerStorage';

interface HomeScreenProps {
  onShowToast: (message: string) => void;
  onNavigateToCollection: () => void;
  onOpenDrawer: () => void;
  onOpenOwnerPin: () => void;
  customLogo: string | null;
  customChibi: string | null;
  tickerConfig?: TickerConfig;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onShowToast,
  onNavigateToCollection,
  onOpenDrawer,
  onOpenOwnerPin,
  customLogo,
  customChibi,
  tickerConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async () => {
    const publicUrl = getPublicShareUrl();
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
    const publicUrl = getPublicShareUrl();
    const shareData = {
      title: 'SINKI Parfums - Define your presence',
      text: 'SINKI Parfums: Aroma yang di tinggal lebih lama dari pada kesan pertama.',
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

  // Secret door: Tap emblem 5 times to open owner mode
  const handleEmblemClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1800);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      onOpenOwnerPin();
      return;
    }

    onShowToast("SINKI Parfums - Haute Parfumerie");
  };

  const currentTicker = tickerConfig || getStoredTicker();
  const activeFont = TICKER_FONTS.find((f) => f.id === currentTicker.font) || TICKER_FONTS[0];
  const tickerText = currentTicker.text.trim() || 'Tahan 8 jam, dia aja yang gak tahan 😏';

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 pb-20 bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-y-auto no-scrollbar">
      {/* LAYER 2: HERO BACKDROP BOTOL PARFUM (Panggung Tengah di bawah Teks Judul) */}
      <div className="absolute inset-x-0 top-0 h-[68%] pointer-events-none overflow-hidden z-0">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#0e1017]" />

        {/* Gambar Botol Parfum Hero / Chibi: Diposisikan pas di panggung tengah tanpa menabrak judul */}
        <img
          src={customChibi || defaultHeroBottles}
          alt="SINKI Luxury Perfume Bottles Backdrop"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-center filter contrast-[1.04] brightness-[0.98]"
        />

        {/* Ambient Top Glow from top-right corner like soft champagne dawn light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a059]/[0.05] rounded-full blur-[120px]" />

        {/* Pelindung Area Judul & Menu (Gradasi gelap lembut agar tulisan SINKI selalu berkilau tajam & tidak tertutup foto) */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0d0f18] via-[#0d0f18]/85 to-transparent" />

        {/* Bottom Water Ripple Exposure Fade */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0f18] via-[#0d0f18]/70 to-transparent" />
      </div>

      {/* LAYER 1 (TERDEPAN / Z-20): TOP BAR MELAYANG ELEGAN */}
      <header className="relative z-20 flex items-center justify-between pt-0 pb-1 shrink-0">
        {/* Top-Left: Clean Floating Brand Emblem (Pilihan A - Tanpa Kotak) */}
        <div
          onClick={handleEmblemClick}
          className="group cursor-pointer flex items-center gap-2 select-none active:scale-95 transition-transform py-0.5 px-0.5"
          title="SINKI Parfums"
        >
          <div className="relative w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
            {customLogo ? (
              <img
                src={customLogo}
                alt="Lambang Logo SINKI"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] drop-shadow-[0_0_8px_rgba(197,160,89,0.2)]"
              />
            ) : (
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] drop-shadow-[0_0_8px_rgba(197,160,89,0.25)]"
              >
                <defs>
                  <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F0DFB6" />
                    <stop offset="45%" stopColor="#C5A059" />
                    <stop offset="100%" stopColor="#8C6826" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 15C50 15 62 30 62 44C62 56 50 62 42 70C34 78 40 88 50 90C62 92 72 80 72 80C72 80 62 96 48 96C34 96 26 82 28 70C30 58 44 50 50 42C56 34 54 22 50 15Z"
                  fill="url(#emblemGrad)"
                />
                <path
                  d="M44 30C44 30 30 38 25 50C20 62 25 76 38 84C28 78 18 66 18 52C18 40 30 32 44 30Z"
                  fill="url(#emblemGrad)"
                  opacity="0.9"
                />
                <path
                  d="M56 30C56 30 70 38 75 50C80 62 75 76 62 84C72 78 82 66 82 52C82 40 70 32 56 30Z"
                  fill="url(#emblemGrad)"
                  opacity="0.9"
                />
              </svg>
            )}
          </div>
          <span className="text-[10.5px] font-mono tracking-widest text-slate-200 group-hover:text-[#F0DFB6] font-bold uppercase transition-colors drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            SINKI
          </span>
        </div>

        {/* Top-Right: 3-line hamburger menu button ("Garis 3") */}
        <button
          onClick={onOpenDrawer}
          className="w-8 h-8 rounded-xl bg-black/60 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-lg backdrop-blur-xs"
          title="Menu Utama"
          aria-label="Menu"
        >
          <Menu size={16} />
        </button>
      </header>

      {/* LAYER 1 (TERDEPAN / Z-20): HAUTE PARFUMERIE EDITORIAL TITLE (TIDAK BOLEH MENABRAK ATAU TERTUTUP BOTOL) */}
      <div className="text-center pt-1 pb-0 shrink-0 relative z-20 flex flex-col items-center justify-center select-none">
        {/* Brand Container with Diamond Flare Alignment */}
        <div className="relative inline-flex flex-col items-center">
          {/* Moving Diamond Glint & Optical Lens Flare - Pure Linear Horizontal (Y=0) & Ultra-Soft */}
          <div
            aria-hidden="true"
            className="diamond-glint-flare absolute top-[18px] left-3 pointer-events-none z-30 flex items-center justify-center w-0 h-0"
          >
            {/* Soft Ambient Core Halo */}
            <div className="absolute w-8 h-8 rounded-full bg-white/60 blur-[8px]" />
            <div className="absolute w-14 h-14 rounded-full bg-[#E4C373]/25 blur-[12px]" />
            {/* Horizontal & Vertical Optical Light Needles (Soft Satin) */}
            <div className="absolute w-16 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[0.3px]" />
            <div className="absolute h-10 w-[1px] bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[0.3px]" />
            {/* Diagonal Anamorphic Flare */}
            <div className="absolute w-8 h-[1px] rotate-45 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute w-8 h-[1px] -rotate-45 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            {/* 4-Point Diamond Star Core */}
            <svg
              viewBox="0 0 24 24"
              fill="white"
              className="relative w-3.5 h-3.5 filter drop-shadow-[0_0_5px_rgba(251,242,213,0.9)]"
            >
              <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" />
            </svg>
          </div>

          {/* SINKI in Soft 24K Royal Gold Typography */}
          <h1 className="sinki-white-diamond font-display text-[34px] md:text-4xl font-black tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-b from-[#FBF2D5] via-[#E4C373] to-[#A3772C] drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] px-3 leading-tight inline-block">
            SINKI
          </h1>

          {/* EAU DE PARFUM in Pure Crystal White with 24K Gold Glowing Aura */}
          <div className="relative inline-flex items-center justify-center -mt-0.5">
            <span className="gold-eaudeparfum-pulse font-display text-[9.5px] md:text-[10.5px] font-bold tracking-[0.32em] -mr-[0.32em] uppercase text-white drop-shadow-[0_1.5px_6px_rgba(0,0,0,0.9)]">
              EAU DE PARFUM
            </span>

            {/* Micro Gold Sparkle on Eau De Parfum */}
            <div
              aria-hidden="true"
              className="gold-micro-sparkle absolute -right-3 top-0 pointer-events-none"
            >
              <svg viewBox="0 0 24 24" fill="#FFE5A3" className="w-2.5 h-2.5 filter drop-shadow-[0_0_4px_#DFB76C]">
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER STAGE SPACER: Ruang panggung tengah untuk botol parfum berdiri elegan */}
      <div className="relative z-10 flex-1 w-full my-auto min-h-[190px]" />

      {/* LOWER SECTION:
          1. Story Card "Define your presence" + Icon-Only Share Button
          2. Equal-Sized Instagram & TikTok
          3. Minimalist swipe indicator
      */}
      <section className="relative z-10 space-y-2 shrink-0">
        {/* Story Box "Define your presence" with Quiet Luxury Clean Typography */}
        <div className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#171926]/95 via-[#131520]/95 to-[#0f111a]/95 border border-white/10 hover:border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.65)] flex items-center justify-between gap-3 backdrop-blur-md transition-all">
          {/* Story Text */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-[11px] font-extrabold tracking-wider text-slate-100 uppercase leading-tight">
              Define your presence
            </h2>
            <p className="text-[10.5px] text-slate-300 font-medium italic leading-snug mt-0.5 line-clamp-2">
              “Aroma yang di tinggal lebih lama dari pada kesan pertama”
            </p>
          </div>

          {/* Standalone Model 1: 3 Bulatan Terhubung Garis (Share2) Berukuran Kecil */}
          <button
            onClick={handleShare}
            className="group shrink-0 relative p-1.5 text-[#DFB76C] hover:text-[#F0DFB6] hover:scale-115 active:scale-90 transition-all duration-200 flex items-center justify-center select-none"
            title="Bagikan SINKI"
            aria-label="Bagikan"
          >
            {copied ? (
              <Check
                size={13}
                className="text-[#DFB76C] stroke-[2.6] filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] animate-in zoom-in-75 duration-200"
              />
            ) : (
              <Share2
                size={13}
                className="text-[#DFB76C] group-hover:text-[#F0DFB6] stroke-[2.2] filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-colors"
              />
            )}
          </button>
        </div>

        {/* Follow Sinki Section with Equal-Sized Logos & Glassmorphism Borders */}
        <div className="space-y-1.5">
          <span className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-slate-300 pl-1 block">
            Follow Sinki
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Instagram Box */}
            <a
              href="https://www.instagram.com/sinki_official/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick('instagram')}
              className="group flex items-center justify-between py-2 px-2.5 rounded-2xl bg-gradient-to-b from-[#1e2235]/95 to-[#141626]/95 hover:from-[#24283f] hover:to-[#171a2c] border border-pink-500/30 hover:border-pink-400/60 transition-all active:scale-98 shadow-[0_4px_15px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-1.5 shrink-0 shadow-md">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[8.5px] text-pink-300 font-bold uppercase leading-none">Instagram</span>
                  <span className="block text-[10.5px] font-bold text-white truncate">@Sinki_official</span>
                </div>
              </div>
              <ExternalLink size={11} className="text-slate-300 group-hover:text-pink-300 shrink-0 ml-1" />
            </a>

            {/* TikTok Box */}
            <a
              href="https://www.tiktok.com/@sinki_official"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialClick('tiktok')}
              className="group flex items-center justify-between py-2 px-2.5 rounded-2xl bg-gradient-to-b from-[#1e2235]/95 to-[#141626]/95 hover:from-[#24283f] hover:to-[#171a2c] border border-cyan-500/35 hover:border-cyan-400/60 transition-all active:scale-98 shadow-[0_4px_15px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-black border border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-md">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#00f2fe"/>
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#fe2c55" opacity="0.7"/>
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#ffffff" opacity="0.85"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[8.5px] text-cyan-300 font-bold uppercase leading-none">TikTok</span>
                  <span className="block text-[10.5px] font-bold text-white truncate">@Sinki_official</span>
                </div>
              </div>
              <ExternalLink size={11} className="text-slate-300 group-hover:text-cyan-300 shrink-0 ml-1" />
            </a>
          </div>
        </div>

        {/* Luxury Micro-Badge Marquee Box (Replaces Swipe to Collection) */}
        <button
          onClick={onNavigateToCollection}
          aria-label="Lihat Koleksi Parfum SINKI"
          className="luxury-ticker-container w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#171927]/95 via-[#1d2238]/95 to-[#131625]/95 hover:from-[#21263d] hover:to-[#181c2f] border border-white/12 hover:border-[#DFB76C]/40 flex items-center gap-2 text-slate-100 transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-md group overflow-hidden"
        >
          {/* Running Text Area with Mask Fade */}
          <div className="flex-1 overflow-hidden relative ticker-mask-fade py-0.5 min-w-0">
            <div className={`luxury-ticker-track text-[9.5px] text-slate-300 ${activeFont.styleClass}`}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span key={idx} className="inline-block pr-6 text-zinc-200 font-medium">
                  <span className="text-[#DFB76C] font-bold mr-1.5">•</span> {tickerText}
                </span>
              ))}
            </div>
          </div>

          {/* Action indicator button/arrow */}
          <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-medium tracking-wider text-[#DFB76C] group-hover:text-[#F0DFB6] pl-2 border-l border-white/10">
            <span className="hidden xs:inline">Koleksi</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform text-[#DFB76C]" />
          </div>
        </button>
      </section>
    </div>
  );
};

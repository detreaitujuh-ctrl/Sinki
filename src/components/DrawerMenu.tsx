import { BookOpen, ChevronRight, Shield, Volume2, VolumeX } from 'lucide-react';
import { getStoredArticles, fetchArticlesFromServer, ArticleItem } from '../utils/articleStorage';
import React from 'react';
import { X, LayoutGrid, MessageCircle, ShoppingBag, ExternalLink } from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsappHelper';
import {
  getSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
  playInteractionSound,
} from '../utils/soundEngine';
import {
  SocialLinks,
  getStoredSocialLinks,
  extractTikTokHandle,
  extractInstagramHandle,
} from '../utils/socialStorage';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCollection: () => void;
  onOpenDimensiSinki?: () => void;
  socialLinks?: SocialLinks;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToCollection,
  onOpenDimensiSinki,
  socialLinks: propSocialLinks,
}) => {
  const currentSocial = propSocialLinks || getStoredSocialLinks();
  const [isJournalOpen, setIsJournalOpen] = React.useState(false);
  const [selectedArticle, setSelectedArticle] = React.useState<ArticleItem | null>(null);
  const [articles, setArticles] = React.useState<ArticleItem[]>(() => getStoredArticles());
  const [soundActive, setSoundActive] = React.useState<boolean>(() => getSoundEnabled());
  const [soundVolume, setSoundVolumeState] = React.useState<number>(() => getSoundVolume());

  React.useEffect(() => {
    const handleSoundChange = (e: any) => {
      if (e?.detail && typeof e.detail.enabled === 'boolean') {
        setSoundActive(e.detail.enabled);
      } else {
        setSoundActive(getSoundEnabled());
      }
    };
    const handleVolumeChange = (e: any) => {
      if (e?.detail && typeof e.detail.volume === 'number') {
        setSoundVolumeState(e.detail.volume);
      } else {
        setSoundVolumeState(getSoundVolume());
      }
    };
    window.addEventListener('sinki_sound_changed', handleSoundChange);
    window.addEventListener('sinki_volume_changed', handleVolumeChange);
    return () => {
      window.removeEventListener('sinki_sound_changed', handleSoundChange);
      window.removeEventListener('sinki_volume_changed', handleVolumeChange);
    };
  }, []);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playInteractionSound('glassTap');
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value) / 100;
    setSoundVolumeState(newVol);
    setSoundVolume(newVol);
    playInteractionSound('glassTap');
  };

  React.useEffect(() => {
    if ((isOpen || isJournalOpen) && articles.length === 0) {
      fetchArticlesFromServer().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setArticles(list);
        }
      });
    }
    const handleArticlesEvent = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setArticles(e.detail);
      } else {
        setArticles(getStoredArticles());
      }
    };
    window.addEventListener('sinki_articles_updated', handleArticlesEvent);
    return () => window.removeEventListener('sinki_articles_updated', handleArticlesEvent);
  }, [isOpen, isJournalOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/80 backdrop-blur-xs sinki-backdrop-in">
      <div className="w-[280px] max-w-[85vw] h-full sinki-arch-modal border-l p-5 flex flex-col justify-between sinki-drawer-slide-in overflow-y-auto no-scrollbar font-body">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D4AF6A]/25 sinki-heading-anim">
            <div>
              <span className="font-heading font-bold text-base tracking-[0.16em] block text-[var(--arch-gold)] transition-colors duration-200 drop-shadow-sm select-none">
                SINKI
              </span>
              <span className="font-body text-[11px] tracking-[0.06em] font-medium block mt-0.5 text-slate-300 select-none">
                Eau de Parfum
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[6px] sinki-arch-subbox border hover:border-[#E8C782]/60 flex items-center justify-center text-slate-200 hover:text-white transition-colors sinki-cushion-press-sm"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="mt-4 space-y-2">
            <span className="font-body text-[11px] font-medium text-[#DFB76C] pl-1 block mb-1.5 drop-shadow-sm">
              Menu Navigasi
            </span>

            {/* Koleksi Parfum */}
            <button
              onClick={() => {
                onClose();
                onNavigateToCollection();
              }}
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-left transition-all group sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={15} className="text-[#DFB76C]" />
                <span className="text-[13px] font-medium text-white group-hover:text-[#F0DFB6]">
                  Koleksi Parfum
                </span>
              </div>
              <ChevronRight size={14} className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8]" />
            </button>

            {/* Panduan Aroma & Jurnal SINKI (Terhubung ke Konten Dimensi-Sinki) */}
            <button
              onClick={() => setIsJournalOpen(true)}
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-left transition-all group sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} className="text-[#DFB76C]" />
                <span className="text-[13px] font-medium text-white group-hover:text-[#F0DFB6]">
                  Panduan Aroma & Tips
                </span>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-[#DFB76C] bg-[#C5A059]/20 px-2 py-0.5 rounded-[5px]">
                {articles.length}
              </span>
            </button>


            {/* WhatsApp Pemesanan */}
            <button
              type="button"
              onClick={() => {
                onClose();
                openWhatsAppDirect(
                  '6289636824552',
                  'Halo SINKI Parfum, saya tertarik dengan koleksi parfumnya'
                );
              }}
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-left transition-all group cursor-pointer sinki-cushion-press"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={15} className="text-emerald-400" />
                <span className="text-[13px] font-medium text-white group-hover:text-emerald-200">
                  WhatsApp Resmi
                </span>
              </div>
              <ExternalLink size={13} className="text-[#D4AF6A]/80 group-hover:text-emerald-400" />
            </button>

            {/* Shopee Official */}
            <a
              href={currentSocial.shopee || 'https://shopee.co.id'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-left transition-all group sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={15} className="text-orange-400" />
                <span className="text-[13px] font-medium text-white group-hover:text-orange-200">
                  Shopee Official
                </span>
              </div>
              <ExternalLink size={13} className="text-[#D4AF6A]/80 group-hover:text-orange-400" />
            </a>
          </div>

          {/* Social Links */}
          <div className="mt-4 space-y-2">
            <span className="font-body text-[11px] font-medium text-[#DFB76C] pl-1 block mb-1.5 drop-shadow-sm">
              Media Sosial Resmi
            </span>

            <a
              href={currentSocial.instagram}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both',
              }}
              className="flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-[13px] text-white hover:text-[#F3E6C8] transition-colors font-medium sinki-cushion-press cursor-pointer"
            >
              <span className="truncate pr-2">Instagram {extractInstagramHandle(currentSocial.instagram)}</span>
              <ExternalLink size={12} className="shrink-0 text-[#D4AF6A]/80" />
            </a>

            <a
              href={currentSocial.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both',
              }}
              className="flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border text-[13px] text-slate-200 hover:text-[#F3E6C8] transition-colors font-medium sinki-cushion-press cursor-pointer"
            >
              <span className="truncate pr-2">TikTok {extractTikTokHandle(currentSocial.tiktok)}</span>
              <ExternalLink size={12} className="shrink-0 text-[#D4AF6A]/80" />
            </a>
          </div>

          {/* Pengaturan Efek Suara Interaksi (Sound ON/OFF) */}
          <div className="mt-4 space-y-1.5">
            <span className="font-body text-[11px] font-medium text-[#DFB76C] pl-1 block drop-shadow-sm">
              Pengaturan Suara
            </span>
            <div
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 250ms both',
              }}
              className="p-3 rounded-[8px] sinki-arch-card border space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors ${
                      soundActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {soundActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-white block leading-tight">
                      Suara Interaksi
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                      {soundActive ? `Aktif (${Math.round(soundVolume * 100)}%)` : 'Suara dimatikan'}
                    </span>
                  </div>
                </div>

                {/* iOS Luxury Style Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  role="switch"
                  aria-checked={soundActive}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title={soundActive ? 'Matikan efek suara' : 'Aktifkan efek suara'}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      soundActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Volume Range Slider (Hanya muncul saat suara ON) */}
              {soundActive && (
                <div className="pt-2 border-t border-[#D4AF6A]/15 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-body text-slate-300">
                    <span className="text-slate-400">Kekuatan Suara</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      {Math.round(soundVolume * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={Math.round(soundVolume * 100)}
                      onChange={handleSliderChange}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
                      title="Geser untuk mengatur volume suara"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-[#D4AF6A]/20 mt-5 space-y-2">

          {onOpenDimensiSinki && (
            <button
              onClick={() => {
                onClose();
                onOpenDimensiSinki();
              }}
              style={{
                animation: 'sinkiCardCascade 380ms cubic-bezier(0.22, 1, 0.36, 1) 280ms both',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[8px] sinki-arch-card-selected border text-[#F3E6C8] text-[13px] font-semibold transition-all group sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#DFB76C]" />
                <span>Dimensi Sinki (Panel Admin)</span>
              </div>
              <ChevronRight size={14} className="text-[#DFB76C] group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <p className="text-[11px] text-slate-400 text-center font-normal">
            SINKI Parfums • 100% Original
          </p>
        </div>

        {/* JOURNAL & ARTICLES MODAL (BACAAN TIPS & ARTIKEL) */}
        {isJournalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs sinki-backdrop-in">
            <div className="w-full max-w-md max-h-[85vh] sinki-arch-modal border rounded-[10px] p-5 flex flex-col justify-between overflow-hidden font-body sinki-sheet-elevation">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D4AF6A]/25 shrink-0 sinki-heading-anim">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#DFB76C]" />
                  <span className="font-heading text-[15px] sm:text-base font-bold tracking-[-0.015em] leading-[1.25] text-[#F3E6C8]">
                    Panduan Aroma SINKI
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsJournalOpen(false);
                    setSelectedArticle(null);
                  }}
                  className="w-7 h-7 rounded-[6px] sinki-arch-subbox border hover:border-[#E8C782]/60 flex items-center justify-center text-slate-300 hover:text-white sinki-cushion-press-sm"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                {selectedArticle ? (
                  // Article Detail View
                  <div className="space-y-3 sinki-heading-anim">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="text-xs text-[#DFB76C] font-medium hover:underline flex items-center gap-1"
                    >
                      ← Kembali ke Daftar Tips
                    </button>
                    <div>
                      <span className="text-[11px] font-medium text-[#F3E6C8] bg-[#C5A059]/15 border border-[#D4AF6A]/35 px-2 py-0.5 rounded-[5px] inline-block leading-tight">
                        {selectedArticle.categoryLabel}
                      </span>
                      <h3 className="font-heading text-base sm:text-[17px] font-bold text-white tracking-[-0.015em] mt-2 leading-[1.25]">
                        {selectedArticle.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>Oleh: {selectedArticle.author}</span>
                        <span>•</span>
                        <span>{selectedArticle.date}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-[8px] sinki-arch-subbox border text-[13px] sm:text-sm text-slate-200 font-normal leading-[1.55] whitespace-pre-line">
                      {selectedArticle.content}
                    </div>
                    <button
                      onClick={() => {
                        setIsJournalOpen(false);
                        onClose();
                        onNavigateToCollection();
                      }}
                      className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs sm:text-[13px] shadow-md sinki-cushion-press cursor-pointer"
                    >
                      Jelajahi Koleksi Parfum
                    </button>
                  </div>
                ) : (
                  // Article List View
                  <div className="space-y-2">
                    {articles.map((art, idx) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        style={{
                          animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(idx * 60, 300)}ms both`,
                          willChange: 'transform, opacity, filter',
                        }}
                        className="p-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer space-y-1 group sinki-cushion-press"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-[#F3E6C8] bg-[#C5A059]/15 px-2 py-0.5 rounded-[5px] leading-tight">
                            {art.categoryLabel}
                          </span>
                          <span className="text-[11px] text-slate-400">{art.readTime}</span>
                        </div>
                        <h4 className="font-heading text-[14px] font-semibold text-white tracking-[-0.015em] group-hover:text-[#F3E6C8] leading-[1.25]">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-[1.45]">
                          {art.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
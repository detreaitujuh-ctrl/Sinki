import { BookOpen, ChevronRight, Shield } from 'lucide-react';
import { getStoredArticles, fetchArticlesFromServer, ArticleItem } from '../utils/articleStorage';
import React from 'react';
import { X, LayoutGrid, MessageCircle, ShoppingBag, ExternalLink } from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsappHelper';
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

  React.useEffect(() => {
    if (isOpen || isJournalOpen) {
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
      <div className="w-[280px] max-w-[85vw] h-full bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] border-l border-white/10 p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.85)] sinki-drawer-slide-in overflow-y-auto no-scrollbar font-body">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-white/15 sinki-heading-anim">
            <div>
              <span className="font-heading font-bold text-base tracking-[0.16em] block text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#C5A059] to-[#8C6826] drop-shadow-sm select-none">
                SINKI
              </span>
              <span className="font-body text-[11px] tracking-[0.06em] font-medium block mt-0.5 text-slate-300 select-none">
                Eau de Parfum
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors sinki-cushion-press-sm"
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
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#DFB76C]/40 text-left transition-all group shadow-sm sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={15} className="text-[#DFB76C]" />
                <span className="text-[13px] font-medium text-white group-hover:text-[#F0DFB6]">
                  Koleksi Parfum
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
            </button>

            {/* Panduan Aroma & Jurnal SINKI (Terhubung ke Konten Dimensi-Sinki) */}
            <button
              onClick={() => setIsJournalOpen(true)}
              style={{
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 110ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#DFB76C]/40 text-left transition-all group shadow-sm sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} className="text-[#DFB76C]" />
                <span className="text-[13px] font-medium text-white group-hover:text-[#F0DFB6]">
                  Panduan Aroma & Tips
                </span>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-[#DFB76C] bg-[#C5A059]/20 px-2 py-0.5 rounded-full">
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
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 text-left transition-all group shadow-sm cursor-pointer sinki-cushion-press"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={15} className="text-emerald-400" />
                <span className="text-[13px] font-medium text-white group-hover:text-emerald-200">
                  WhatsApp Resmi
                </span>
              </div>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-emerald-400" />
            </button>

            {/* Shopee Official */}
            <a
              href={currentSocial.shopee || 'https://shopee.co.id'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 210ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-orange-500/20 border border-white/10 hover:border-orange-400/50 text-left transition-all group shadow-sm sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={15} className="text-orange-400" />
                <span className="text-[13px] font-medium text-white group-hover:text-orange-200">
                  Shopee Official
                </span>
              </div>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-orange-400" />
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
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-pink-500/15 border border-white/10 text-[13px] text-white hover:text-pink-300 transition-colors font-medium sinki-cushion-press cursor-pointer"
            >
              <span className="truncate pr-2">Instagram {extractInstagramHandle(currentSocial.instagram)}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>

            <a
              href={currentSocial.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 310ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 text-[13px] text-slate-300 hover:text-cyan-300 transition-colors font-medium sinki-cushion-press cursor-pointer"
            >
              <span className="truncate pr-2">TikTok {extractTikTokHandle(currentSocial.tiktok)}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-white/10 mt-5 space-y-2.5">
          {onOpenDimensiSinki && (
            <button
              onClick={() => {
                onClose();
                onOpenDimensiSinki();
              }}
              style={{
                animation: 'sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both',
                willChange: 'transform, opacity, filter',
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[13px] font-semibold transition-all group shadow-sm sinki-cushion-press cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-amber-400" />
                <span>Dimensi Sinki (Panel Admin)</span>
              </div>
              <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <p className="text-[11px] text-slate-400 text-center font-normal">
            SINKI Parfums • 100% Original
          </p>
        </div>

        {/* JOURNAL & ARTICLES MODAL (BACAAN TIPS & ARTIKEL) */}
        {isJournalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs sinki-backdrop-in">
            <div className="w-full max-w-md max-h-[85vh] bg-[#10121d] border border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden font-body sinki-sheet-elevation">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0 sinki-heading-anim">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-400" />
                  <span className="font-heading text-[15px] sm:text-base font-bold tracking-[-0.015em] leading-[1.25] text-amber-300">
                    Panduan Aroma SINKI
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsJournalOpen(false);
                    setSelectedArticle(null);
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white sinki-cushion-press-sm"
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
                      className="text-xs text-amber-400 font-medium hover:underline flex items-center gap-1"
                    >
                      ← Kembali ke Daftar Tips
                    </button>
                    <div>
                      <span className="text-[11px] font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block leading-tight">
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
                    <div className="p-3 rounded-2xl bg-black/50 border border-white/10 text-[13px] sm:text-sm text-slate-200 font-normal leading-[1.55] whitespace-pre-line">
                      {selectedArticle.content}
                    </div>
                    <button
                      onClick={() => {
                        setIsJournalOpen(false);
                        onClose();
                        onNavigateToCollection();
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs sm:text-[13px] shadow-md sinki-cushion-press cursor-pointer"
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
                        className="p-3 rounded-2xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/40 cursor-pointer space-y-1 group sinki-cushion-press"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full leading-tight">
                            {art.categoryLabel}
                          </span>
                          <span className="text-[11px] text-slate-400">{art.readTime}</span>
                        </div>
                        <h4 className="font-heading text-[14px] font-semibold text-white tracking-[-0.015em] group-hover:text-amber-200 leading-[1.25]">
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
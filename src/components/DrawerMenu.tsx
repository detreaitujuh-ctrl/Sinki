import { BookOpen, ChevronRight, Shield } from 'lucide-react';
import { getStoredArticles, ArticleItem } from '../utils/articleStorage';
import React from 'react';
import { X, LayoutGrid, MessageCircle, ShoppingBag, ExternalLink } from 'lucide-react';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCollection: () => void;
  onOpenDimensiSinki?: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToCollection,
  onOpenDimensiSinki,
}) => {
  const [isJournalOpen, setIsJournalOpen] = React.useState(false);
  const [selectedArticle, setSelectedArticle] = React.useState<ArticleItem | null>(null);
  const articles = getStoredArticles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[280px] max-w-[85vw] h-full bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] border-l border-white/10 p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.85)] animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/15">
            <div>
              <span className="font-display font-extrabold text-lg tracking-[0.2em] block text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#C5A059] to-[#8C6826] drop-shadow-sm select-none">
                SINKI
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold block mt-0.5 text-slate-300 select-none">
                Eau de Parfum
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="mt-5 space-y-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-[#DFB76C] pl-1 block mb-2 drop-shadow-sm">
              Menu Navigasi
            </span>

            {/* Koleksi Parfum */}
            <button
              onClick={() => {
                onClose();
                onNavigateToCollection();
              }}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#DFB76C]/40 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={16} className="text-[#DFB76C]" />
                <span className="text-xs font-bold text-white group-hover:text-[#F0DFB6]">
                  Koleksi Parfum
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
            </button>

            {/* Panduan Aroma & Jurnal SINKI (Terhubung ke Konten Dimensi-Sinki) */}
            <button
              onClick={() => setIsJournalOpen(true)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#DFB76C]/40 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-[#DFB76C]" />
                <span className="text-xs font-bold text-white group-hover:text-[#F0DFB6]">
                  Panduan Aroma & Tips
                </span>
              </div>
              <span className="text-[9px] font-bold text-[#DFB76C] bg-[#C5A059]/20 px-1.5 py-0.5 rounded-full">
                {articles.length}
              </span>
            </button>

            {/* WhatsApp Pemesanan */}
            <a
              href="https://wa.me/6289636824552?text=Halo%20SINKI%20Parfums%2C%20saya%20tertarik%20dengan%20koleksi%20parfumnya"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-white group-hover:text-emerald-200">
                  WhatsApp Resmi
                </span>
              </div>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-emerald-400" />
            </a>

            {/* Shopee Official */}
            <a
              href="https://shopee.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-orange-500/20 border border-white/10 hover:border-orange-400/50 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-white group-hover:text-orange-200">
                  Shopee Official
                </span>
              </div>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-orange-400" />
            </a>
          </div>

          {/* Social Links */}
          <div className="mt-5 space-y-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-[#DFB76C] pl-1 block mb-2 drop-shadow-sm">
              Media Sosial Resmi
            </span>

            <a
              href="https://www.instagram.com/sinki_official/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-pink-500/15 border border-white/10 text-xs text-white hover:text-pink-300 transition-colors font-medium"
            >
              <span>Instagram @Sinki_official</span>
              <ExternalLink size={12} />
            </a>

            <a
              href="https://www.tiktok.com/@sinki_official"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <span>TikTok @Sinki_official</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-white/10 mt-6 space-y-3">
          {onOpenDimensiSinki && (
            <button
              onClick={() => {
                onClose();
                onOpenDimensiSinki();
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all group active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-amber-400" />
                <span>Dimensi Sinki (Panel Admin)</span>
              </div>
              <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <p className="text-[10px] text-slate-400 text-center font-mono">
            SINKI Parfums • 100% Original
          </p>
        </div>

        {/* JOURNAL & ARTICLES MODAL (BACAAN TIPS & ARTIKEL) */}
        {isJournalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md max-h-[85vh] bg-[#10121d] border border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-amber-400" />
                  <span className="font-display text-sm font-extrabold tracking-wider text-amber-300">
                    Panduan Aroma SINKI
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsJournalOpen(false);
                    setSelectedArticle(null);
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3">
                {selectedArticle ? (
                  // Article Detail View
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="text-xs text-amber-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      ← Kembali ke Daftar Tips
                    </button>
                    <div>
                      <span className="text-[9.5px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                        {selectedArticle.categoryLabel}
                      </span>
                      <h3 className="font-display text-base font-bold text-white mt-1.5 leading-snug">
                        {selectedArticle.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>Oleh: {selectedArticle.author}</span>
                        <span>•</span>
                        <span>{selectedArticle.date}</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                      {selectedArticle.content}
                    </div>
                    <button
                      onClick={() => {
                        setIsJournalOpen(false);
                        onClose();
                        onNavigateToCollection();
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
                    >
                      Jelajahi Koleksi Parfum
                    </button>
                  </div>
                ) : (
                  // Article List View
                  <div className="space-y-2.5">
                    {articles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/40 cursor-pointer transition-all active:scale-98 space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full">
                            {art.categoryLabel}
                          </span>
                          <span className="text-[9.5px] text-slate-400">{art.readTime}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-200 leading-snug">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
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
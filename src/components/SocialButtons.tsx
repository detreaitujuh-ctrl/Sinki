import React, { useState } from 'react';
import { Share2, Check, ExternalLink } from 'lucide-react';
import { getPublicShareUrl } from '../utils/shareUtils';

interface SocialButtonsProps {
  onShowToast: (message: string) => void;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ onShowToast }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const publicUrl = getPublicShareUrl();
    const shareData = {
      title: 'SINKI Parfums - Haute Parfumerie',
      text: 'Rasakan kemewahan aroma Amber Wood & Spice dan mahakarya parfum SINKI!',
      url: publicUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onShowToast('Terima kasih telah membagikan SINKI!');
      } catch (err) {
        // User cancelled share or fallback to copy
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const publicUrl = getPublicShareUrl();
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    onShowToast('Tautan SINKI berhasil disalin ke papan klip!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-3">
      {/* Social Media Links (Instagram & TikTok) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Instagram Button */}
        <a
          href="https://www.instagram.com/Sinki_official"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-[#1c1f26] to-[#14161c] border border-pink-500/25 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all duration-300 active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            {/* Instagram Official Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-2 shadow-md">
              <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-pink-300/80 font-medium uppercase tracking-wider">Instagram</span>
              <span className="block text-xs font-bold text-white tracking-wide">@Sinki_official</span>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-400 group-hover:text-pink-300 transition-colors" />
        </a>

        {/* TikTok Button */}
        <a
          href="https://www.tiktok.com/@Sinki_official"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-[#1c1f26] to-[#14161c] border border-cyan-500/25 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-300 active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            {/* TikTok Official Icon */}
            <div className="w-9 h-9 rounded-xl bg-black border border-slate-700/80 flex items-center justify-center p-2 shadow-md">
              <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#00f2fe"/>
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#fe2c55" opacity="0.6"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-cyan-300/80 font-medium uppercase tracking-wider">TikTok</span>
              <span className="block text-xs font-bold text-white tracking-wide">@Sinki_official</span>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-400 group-hover:text-cyan-300 transition-colors" />
        </a>
      </div>

      {/* Prominent Working Share Button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,163,89,0.35)] hover:shadow-[0_6px_25px_rgba(212,163,89,0.5)] active:scale-98 transition-all duration-200"
      >
        {copied ? (
          <>
            <Check size={16} className="text-slate-950 stroke-[2.5]" />
            <span>Tautan Berhasil Disalin!</span>
          </>
        ) : (
          <>
            <Share2 size={16} className="text-slate-950 stroke-[2.5]" />
            <span>Bagikan SINKI Parfums</span>
          </>
        )}
      </button>
    </div>
  );
};

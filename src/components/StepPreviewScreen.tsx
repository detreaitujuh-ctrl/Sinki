import React from 'react';
import { TabType } from './BottomNavBar';
import { Home, LayoutGrid, Crown, ShoppingBag, MessageSquareText, ArrowLeft } from 'lucide-react';

interface StepPreviewScreenProps {
  tab: TabType;
  onBackToHome: () => void;
}

export const StepPreviewScreen: React.FC<StepPreviewScreenProps> = ({
  tab,
  onBackToHome,
}) => {
  const configs = {
    home: {
      title: 'Home',
      icon: Home,
      desc: 'Beranda utama SINKI',
    },
    collection: {
      title: 'Collection',
      icon: LayoutGrid,
      step: 'Langkah Berikutnya',
      desc: 'Katalog lengkap varian parfum SINKI (Amber Wood & Spice, Oud Royal, Vanilla Gourmand, Floral Blanche) beserta filter aroma dan piramida aroma.',
    },
    top11: {
      title: 'Top 11',
      icon: Crown,
      step: 'Langkah Berikutnya',
      desc: 'Deretan 11 parfum terbaik & terlaris SINKI dengan sistem swipe kartu eksklusif dan peringkat #01 hingga #11.',
    },
    order: {
      title: 'Order',
      icon: ShoppingBag,
      step: 'Langkah Berikutnya',
      desc: 'Keranjang belanja, form alamat pengiriman, opsi pembayaran Indonesia (QRIS, Transfer Bank, E-Wallet, COD), dan nomor pesanan.',
    },
    review: {
      title: 'Review',
      icon: MessageSquareText,
      step: 'Langkah Berikutnya',
      desc: 'Ulasan pembeli, kepuasan pelanggan terbaik, foto ulasan pelanggan, dan rating ketahanan aroma SINKI.',
    },
  };

  const current = configs[tab] || configs.collection;
  const Icon = current.icon;

  return (
    <div className="relative w-full min-h-full flex flex-col justify-between py-6 px-4 pb-24 overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium py-1 px-2 rounded-lg bg-white/5"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Home</span>
        </button>
        <span className="text-[10px] font-mono text-amber-400/80 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          Step-by-Step
        </span>
      </div>

      {/* Main Content Card */}
      <div className="my-auto py-8 px-6 rounded-3xl bg-[#14161f]/90 border border-amber-500/25 text-center flex flex-col items-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-4 shadow-[0_0_20px_rgba(212,163,89,0.2)]">
          <Icon size={32} />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
          Halaman {current.title}
        </span>
        <h2 className="text-xl font-display font-bold text-white mb-3">
          Siap Dibuat Setelah Home
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mb-6">
          {current.desc}
        </p>

        <button
          onClick={onBackToHome}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          Periksa Halaman Home Dulu
        </button>
      </div>

      {/* Footer hint */}
      <p className="text-center text-[10px] text-slate-500">
        Navigasi aktif: Gunakan menu bawah atau geser layar untuk berpindah.
      </p>
    </div>
  );
};

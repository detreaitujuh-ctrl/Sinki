import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  ShoppingBag,
  Clock,
  Flame,
  Check,
  ChevronRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { PerfumeItem } from '../data/perfumes';
import { getStoredPerfumes } from '../utils/perfumeStorage';

interface AromaMatchScreenProps {
  onBackToHome: () => void;
  onNavigateToOrder: (perfume: { name: string; category?: string; pricePerMl?: number }) => void;
  onShowToast: (msg: string) => void;
  perfumes?: PerfumeItem[];
  top11Photos?: Record<string, string>;
}

// 3 Pilihan Bersih & Lapang untuk Persona (Langkah 1)
const PERSONA_OPTIONS = [
  {
    id: 'pria',
    title: 'Pria (Gentleman)',
    subtitle: 'Karakter maskulin, berkarisma, dan tegas',
    icon: '👔',
    badge: 'Maskulin & Berwibawa',
  },
  {
    id: 'wanita',
    title: 'Wanita (Feminine)',
    subtitle: 'Karakter anggun, mempesona, dan manis',
    icon: '👗',
    badge: 'Anggun & Memikat',
  },
  {
    id: 'unisex',
    title: 'Netral (Unisex)',
    subtitle: 'Karakter segar, bersih, dan fleksibel',
    icon: '✨',
    badge: 'Universal & Bersih',
  },
];

// 3 Pilihan Bersih & Lapang untuk Suasana Penggunaan (Langkah 2)
const OCCASION_OPTIONS = [
  {
    id: 'harian',
    title: 'Harian & Kerja Kantor',
    subtitle: 'Ruangan ber-AC, rapi, dan tidak bikin pusing',
    icon: '💼',
    badge: 'Daily & Office Pro',
  },
  {
    id: 'malam',
    title: 'Kencan & Acara Malam',
    subtitle: 'Makan malam romantis, hangat, dan intim',
    icon: '🌙',
    badge: 'Date & Night Out',
  },
  {
    id: 'siang',
    title: 'Santai & Hangout Siang',
    subtitle: 'Siang cerah, luar ruangan, dan udara segar',
    icon: '☀️',
    badge: 'Casual & Outdoor',
  },
];

// 3 Pilihan Bersih & Lapang untuk Kesan Wangi Utama (Langkah 3)
const SCENT_VIBE_OPTIONS = [
  {
    id: 'segar',
    title: 'Segar Dingin & Bersih',
    subtitle: 'Sensasi semilir laut, citrus segar, dan bersih',
    icon: '🌊',
    badge: 'Aquatic Citrus Fresh',
  },
  {
    id: 'manis',
    title: 'Manis Mewah & Menggoda',
    subtitle: 'Sensasi vanila lembut, creamy, dan bikin rindu',
    icon: '🍦',
    badge: 'Warm Vanilla Gourmand',
  },
  {
    id: 'hangat',
    title: 'Hangat & Berkarisma',
    subtitle: 'Sensasi amber berkelas, rempah, dan kayu cedar',
    icon: '🪵',
    badge: 'Smoky Amber Woody',
  },
];

// Kurasi Cerdas Hasil Pencocokan Berdasarkan Kombinasi Sensorik
interface MatchResult {
  perfumeName: string;
  categoryLabel: string;
  matchScore: number;
  reason: string;
  accords: string;
  longevity: string;
  sillage: string;
  photoUrl: string;
  pricePerMl: number;
}

const resolveBestMatch = (
  persona: string,
  occasion: string,
  vibe: string,
  catalog: PerfumeItem[],
  photos: Record<string, string>
): MatchResult => {
  // Database Rekomendasi Terkurasi SINKI
  let candidateName = 'Baccarat Rouge 540';
  let reason =
    'Sentuhan Amber & Jasmine menghasilkan proyeksi mewah dan karisma hangat yang memikat lawan bicara.';
  let categoryLabel = 'SINKI Luxury Signature';
  let longevity = '12+ Jam';
  let sillage = 'Proyeksi 2 Meter';
  let accords = 'Warm Amber · Jasmine · Cedarwood';
  let photo =
    photos['top-1'] ||
    photos['1'] ||
    'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/top11/top-1.jpg';
  let pricePerMl = 4000;

  if (persona === 'pria') {
    if (vibe === 'segar') {
      candidateName = 'Dior Sauvage Elixir';
      reason =
        'Perpaduan Bergamot segar dan rempah maskulin sangat ideal untuk aktivitas harian pria yang aktif dan berwibawa.';
      accords = 'Calabrian Bergamot · Sichuan Pepper · Ambroxan';
      photo = photos['top-2'] || photos['2'] || photo;
    } else if (vibe === 'manis') {
      candidateName = 'Tom Ford Tobacco Vanille';
      reason =
        'Kombinasi vanila premium dan tembakau hangat memberikan kesan pria mapan, misterius, dan memikat di malam hari.';
      accords = 'Creamy Vanilla · Tobacco Leaf · Spices';
      photo = photos['top-5'] || photos['5'] || photo;
    } else {
      candidateName = 'Creed Aventus';
      reason =
        'Aroma smoky pineapple dan kayu birch yang legendaris, memancarkan aura pemimpin dan karisma tak terbantahkan.';
      accords = 'Smoky Birch · Pineapple · Oakmoss';
      photo = photos['top-3'] || photos['3'] || photo;
    }
  } else if (persona === 'wanita') {
    if (vibe === 'segar') {
      candidateName = 'Jo Malone English Pear & Freesia';
      reason =
        'Kesegaran buah pir musim gugur dan bunga freesia putih yang bersih, menghadirkan pesona wanita anggun tanpa menyengat.';
      accords = 'King William Pear · White Freesia · Patchouli';
      photo = photos['top-4'] || photos['4'] || photo;
    } else if (vibe === 'manis') {
      candidateName = 'YSL Black Opium';
      reason =
        'Sentuhan kopi hitam dan vanila manis yang menggoda, sangat sempurna untuk acara kencan malam dan dinner romantis.';
      accords = 'Black Coffee · Sweet Vanilla · White Flowers';
      photo = photos['top-6'] || photos['6'] || photo;
    } else {
      candidateName = 'Chanel Coco Mademoiselle';
      reason =
        'Perpaduan mawar Prancis dan amber lembut yang anggun, memberikan rasa percaya diri tinggi di segala suasana formal.';
      accords = 'Orange Blossom · Grasse Rose · Patchouli Amber';
      photo = photos['top-7'] || photos['7'] || photo;
    }
  } else {
    // Unisex
    if (vibe === 'segar') {
      candidateName = 'Mykonos Matcha Latte';
      reason =
        'Kehangatan teh matcha Jepang berpadu susu segar yang menenangkan pikiran, sangat nyaman dipakai siapa saja sepanjang hari.';
      accords = 'Japanese Matcha · Warm Milk · White Musk';
      photo = photos['top-1'] || photos['1'] || photo;
      pricePerMl = 3000;
    } else if (vibe === 'manis') {
      candidateName = 'Baccarat Rouge 540';
      reason =
        'Aroma manis amber kristal yang menempel erat seharian penuh dan selalu meninggalkan jejak harum yang dirindukan orang.';
      accords = 'Saffron · Ambergris · Cedarwood';
      photo = photos['top-1'] || photo;
    } else {
      candidateName = 'Le Labo Santal 33';
      reason =
        'Karakter kayu cendana Australia dan iris yang estetik, sangat digemari kaum urban modern yang menyukai wewangian berkelas.';
      accords = 'Sandalwood · Cardamom · Violet Iris';
      photo = photos['top-8'] || photos['8'] || photo;
    }
  }

  // Cek apakah varian ada di katalog asli SINKI
  const matchInCatalog = catalog.find(
    (p) => p.name.toLowerCase().includes(candidateName.toLowerCase()) || candidateName.toLowerCase().includes(p.name.toLowerCase())
  );

  if (matchInCatalog) {
    candidateName = matchInCatalog.name;
    if (matchInCatalog.tagline) reason = matchInCatalog.tagline;
    if (matchInCatalog.accords && matchInCatalog.accords.length > 0) {
      accords = matchInCatalog.accords.join(' · ');
    }
  }

  return {
    perfumeName: candidateName,
    categoryLabel,
    matchScore: 98,
    reason,
    accords,
    longevity,
    sillage,
    photoUrl: photo,
    pricePerMl,
  };
};

export const AromaMatchScreen: React.FC<AromaMatchScreenProps> = ({
  onBackToHome,
  onNavigateToOrder,
  onShowToast,
  perfumes = [],
  top11Photos = {},
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 'calculating' | 'result'>(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  const catalog = perfumes.length > 0 ? perfumes : getStoredPerfumes();

  // Reset kuis ke Langkah 1
  const handleReset = () => {
    setStep(1);
    setSelectedPersona(null);
    setSelectedOccasion(null);
    setSelectedVibe(null);
    setMatchResult(null);
    setViewTransitionKey((k) => k + 1);
  };

  // Handler Langkah 1
  const handleSelectPersona = (id: string) => {
    setSelectedPersona(id);
    setTimeout(() => {
      setStep(2);
    }, 220);
  };

  // Handler Langkah 2
  const handleSelectOccasion = (id: string) => {
    setSelectedOccasion(id);
    setTimeout(() => {
      setStep(3);
    }, 220);
  };

  // Handler Langkah 3 -> Analisis Mikro 1.2 detik
  const handleSelectVibe = (id: string) => {
    setSelectedVibe(id);
    setStep('calculating');

    setTimeout(() => {
      const result = resolveBestMatch(
        selectedPersona || 'unisex',
        selectedOccasion || 'harian',
        id,
        catalog,
        top11Photos
      );
      setMatchResult(result);
      setStep('result');
    }, 1200);
  };

  const handleOrderResult = () => {
    if (!matchResult) return;
    onShowToast(`Membuka form pemesanan untuk ${matchResult.perfumeName}... ✨`);
    onNavigateToOrder({
      name: matchResult.perfumeName,
      category: matchResult.categoryLabel,
      pricePerMl: matchResult.pricePerMl,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendaran Cahaya Halo Emas Lembut di Belakang */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#C5A059]/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* TOP HEADER MINIMALIS */}
      <div className="relative z-10 px-4 pt-3.5 pb-3 shrink-0 sinki-arch-header border-b backdrop-blur-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={step === 1 ? onBackToHome : () => setStep((prev) => (prev === 2 ? 1 : 2))}
            className="w-8 h-8 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border flex items-center justify-center text-[#E8C782] hover:text-[#F3E6C8] transition-colors sinki-cushion-press-sm shrink-0"
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Compass size={15} className="text-[#DFB76C] shrink-0" />
              <h2 className="font-heading text-[15px] sm:text-base font-bold text-white tracking-[-0.015em] leading-[1.2] truncate">
                Kuis Aroma
              </h2>
            </div>
            <p className="font-body text-[11px] text-slate-300 font-normal leading-tight truncate">
              Bingung pilih aroma? Biar SINKI bantu temukan aroma yang pas!
            </p>
          </div>
        </div>

        {/* Indikator Langkah Ramping (1 / 2 / 3) */}
        {step !== 'calculating' && step !== 'result' && (
          <div className="flex items-center gap-1.5 sinki-arch-subbox px-2.5 py-1 rounded-[6px] border shrink-0 font-body">
            <span className="text-[11px] font-semibold tabular-nums text-[#DFB76C]">
              Langkah {step}
            </span>
            <span className="text-[10px] text-slate-400">/ 3</span>
          </div>
        )}

        {step === 'result' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 py-1 px-2.5 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border text-[11.5px] font-semibold text-slate-200 hover:text-white transition-colors sinki-cushion-press-sm shrink-0 font-body"
            title="Ulangi kuis pencarian aroma"
          >
            <RotateCcw size={12} className="text-[#DFB76C]" />
            <span>Ulangi Kuis</span>
          </button>
        )}
      </div>

      {/* KONTEN UTAMA: RUANG LAPANG (AIRY ZEN LUXURY - TIDAK PADAT) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* ==========================================
            LANGKAH 1: PERSONA & KARAKTER DIRI
            ========================================== */}
        {step === 1 && (
          <div key={`step-1-${viewTransitionKey}`} className="space-y-4">
            <div className="text-center space-y-1 sinki-heading-anim pb-1">
              <span className="font-body text-[11px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                Langkah 1 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Bingung Pilih Aroma?
              </h3>
              <p className="font-body text-xs sm:text-[13px] text-amber-200 font-medium leading-[1.4]">
                Biar SINKI bantu temukan aroma yang pas!
              </p>
              <p className="font-body text-[11.5px] text-slate-400 font-normal pt-0.5">
                Untuk siapa parfum ini diracik? Pilih karakter persona Anda:
              </p>
            </div>

            {/* 3 Kartu Lapang, Bersih & Lega (Cascade 0ms / 75ms / 150ms identik Collection) */}
            <div className="space-y-3">
              {PERSONA_OPTIONS.map((item, idx) => {
                const isSelected = selectedPersona === item.id;
                const cascadeClass =
                  idx === 0
                    ? 'sinki-cascade-row-0'
                    : idx === 1
                    ? 'sinki-cascade-row-1'
                    : 'sinki-cascade-row-2';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPersona(item.id)}
                    className={`${cascadeClass} w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-cushion-press ${
                      isSelected
                        ? 'sinki-arch-card-selected'
                        : 'sinki-arch-card sinki-arch-card-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 drop-shadow-sm select-none">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-sm sm:text-[15px] font-bold text-white tracking-[-0.01em] leading-tight">
                            {item.title}
                          </h4>
                        </div>
                        <p className="font-body text-xs text-slate-300 font-normal leading-[1.4] mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-[#DFB76C] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            LANGKAH 2: SUASANA & MOMEN PENGGUNAAN
            ========================================== */}
        {step === 2 && (
          <div key={`step-2-${viewTransitionKey}`} className="space-y-4">
            <div className="text-center space-y-1 sinki-heading-anim pb-1">
              <span className="font-body text-[11.5px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                Langkah 2 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Akan dipakai untuk momen apa?
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                Pilih suasana aktivitas utama pemakaian Anda
              </p>
            </div>

            {/* 3 Kartu Lapang, Bersih & Lega (Cascade 0ms / 75ms / 150ms identik Collection) */}
            <div className="space-y-3">
              {OCCASION_OPTIONS.map((item, idx) => {
                const isSelected = selectedOccasion === item.id;
                const cascadeClass =
                  idx === 0
                    ? 'sinki-cascade-row-0'
                    : idx === 1
                    ? 'sinki-cascade-row-1'
                    : 'sinki-cascade-row-2';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectOccasion(item.id)}
                    className={`${cascadeClass} w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-cushion-press ${
                      isSelected
                        ? 'sinki-arch-card-selected'
                        : 'sinki-arch-card sinki-arch-card-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 drop-shadow-sm select-none">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-heading text-sm sm:text-[15px] font-bold text-white tracking-[-0.01em] leading-tight">
                          {item.title}
                        </h4>
                        <p className="font-body text-xs text-slate-300 font-normal leading-[1.4] mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-[#DFB76C] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            LANGKAH 3: KESAN WANGI UTAMA
            ========================================== */}
        {step === 3 && (
          <div key={`step-3-${viewTransitionKey}`} className="space-y-4">
            <div className="text-center space-y-1 sinki-heading-anim pb-1">
              <span className="font-body text-[11.5px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                Langkah 3 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Kesan aroma seperti apa yang Anda sukai?
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                Pilih sensasi wangi yang paling menenangkan hidung Anda
              </p>
            </div>

            {/* 3 Kartu Lapang, Bersih & Lega (Cascade 0ms / 75ms / 150ms identik Collection) */}
            <div className="space-y-3">
              {SCENT_VIBE_OPTIONS.map((item, idx) => {
                const isSelected = selectedVibe === item.id;
                const cascadeClass =
                  idx === 0
                    ? 'sinki-cascade-row-0'
                    : idx === 1
                    ? 'sinki-cascade-row-1'
                    : 'sinki-cascade-row-2';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectVibe(item.id)}
                    className={`${cascadeClass} w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-cushion-press ${
                      isSelected
                        ? 'sinki-arch-card-selected'
                        : 'sinki-arch-card sinki-arch-card-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 drop-shadow-sm select-none">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-heading text-sm sm:text-[15px] font-bold text-white tracking-[-0.01em] leading-tight">
                          {item.title}
                        </h4>
                        <p className="font-body text-xs text-slate-300 font-normal leading-[1.4] mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-[#DFB76C] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            MOMEN ANALISIS KRISTAL (1.2 DETIK)
            ========================================== */}
        {step === 'calculating' && (
          <div className="py-16 text-center space-y-4 sinki-heading-anim">
            <div className="w-16 h-16 mx-auto rounded-[10px] sinki-arch-card border flex items-center justify-center text-[#DFB76C] animate-pulse">
              <Compass size={28} className="animate-spin" style={{ animationDuration: '3.5s' }} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white tracking-[-0.01em]">
                Menavigasi Aroma Terbaik Karakter Anda...
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                Kompas SINKI sedang mencari racikan parfum yang paling pas
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            HASIL JUARA REKOMENDASI TUNGGAL (GRAND REVEAL)
            ========================================== */}
        {step === 'result' && matchResult && (
          <div key={`step-result-${viewTransitionKey}`} className="space-y-3.5 pb-6">
            {/* Kartu Megah Rekomendasi Utama (1 Botol Juara, Bersih & Tidak Padat) */}
            <div className="sinki-cascade-row-0 relative rounded-[10px] sinki-arch-card border p-4 text-center space-y-3">
              {/* Badge Persentase Kecocokan */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#C5A059]/20 border border-[#DFB76C]/50 text-[#F0DFB6] font-body text-xs font-semibold shadow-sm">
                <Sparkles size={12} className="text-[#DFB76C]" />
                <span>{matchResult.matchScore}% Sangat Cocok untuk Karakter Anda</span>
              </div>

              {/* Foto Botol Visual Megah dengan Pendaran Emas */}
              <div className="relative w-36 h-48 mx-auto my-1 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#C5A059]/15 rounded-full blur-2xl pointer-events-none" />
                <img
                  src={matchResult.photoUrl}
                  alt={matchResult.perfumeName}
                  className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] relative z-10 transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback jika foto lokal belum ada
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Identitas Parfum */}
              <div className="space-y-1">
                <span className="font-body text-[11px] font-semibold text-[#DFB76C] tracking-[0.06em] uppercase block">
                  {matchResult.categoryLabel}
                </span>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-[-0.015em] leading-[1.2]">
                  {matchResult.perfumeName}
                </h3>
                <p className="font-body text-xs sm:text-[13px] text-slate-200 font-normal leading-[1.48] max-w-xs mx-auto pt-1">
                  “{matchResult.reason}”
                </p>
              </div>

              {/* Piramida Notes & Ketahanan */}
              <div className="p-2.5 rounded-[8px] sinki-arch-subbox border space-y-1 text-left font-body text-[11.5px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-[#DFB76C] font-semibold">Komposisi:</span>
                  <span className="text-white truncate">{matchResult.accords}</span>
                </div>
                <div className="pt-1 border-t border-[#D4AF6A]/20 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Clock size={11} /> {matchResult.longevity}
                  </span>
                  <span className="text-sky-300 font-medium flex items-center gap-1">
                    <Flame size={11} /> {matchResult.sillage}
                  </span>
                </div>
              </div>

              {/* Tombol Utama: Ambil Aroma Ini */}
              <button
                type="button"
                onClick={handleOrderResult}
                className="w-full py-3 px-4 rounded-[8px] champagne-gold-btn text-slate-950 font-body text-sm font-bold tracking-[0.01em] flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(197,160,89,0.32)] hover:brightness-105 sinki-cushion-press cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>Ambil Aroma Ini Sekarang</span>
              </button>

              {/* Tautan Tipis untuk Ulangi */}
              <button
                type="button"
                onClick={handleReset}
                className="font-body text-xs text-slate-400 hover:text-slate-200 font-normal pt-0.5 underline-offset-4 hover:underline transition-colors block mx-auto"
              >
                ↺ Cari karakter aroma lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

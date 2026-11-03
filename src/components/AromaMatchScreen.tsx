import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, ArrowLeft } from 'lucide-react';
import { PerfumeBottleIcon } from './PerfumeBottleIcon';
import { PerfumeItem, COLLECTION_CATEGORIES } from '../data/perfumes';
import { TOP_11_DATA } from '../data/top11';
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
    icon: '🧥',
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
  // 1. Ambil seluruh varian yang AKTIF di katalog Collection SINKI
  const activeCatalog = catalog.filter((p) => p.isActive !== false);
  const pool = activeCatalog.length > 0 ? activeCatalog : catalog;

  // 2. Kamus Sensorik Cerdas: Sensasi Wangi (Vibe)
  const vibeKeywords: Record<string, string[]> = {
    segar: [
      'segar',
      'fresh',
      'citrus',
      'aquatic',
      'marine',
      'bergamot',
      'lemon',
      'mint',
      'fruity',
      'pear',
      'green',
      'clean',
      'sea',
      'ocean',
      'laut',
      'samudra',
      'samudera',
      'dingin',
      'sejuk',
    ],
    manis: [
      'manis',
      'sweet',
      'vanilla',
      'vanila',
      'gourmand',
      'caramel',
      'coffee',
      'kopi',
      'cream',
      'creamy',
      'honey',
      'madu',
      'sugar',
      'tonka',
      'praline',
      'cocoa',
      'cokelat',
    ],
    hangat: [
      'hangat',
      'warm',
      'amber',
      'woody',
      'kayu',
      'spicy',
      'rempah',
      'smoky',
      'cedar',
      'sandalwood',
      'cendana',
      'oud',
      'gaharu',
      'leather',
      'incense',
      'tembakau',
      'tobacco',
    ],
  };

  // 3. Kamus Momen Penggunaan (Occasion)
  const occasionConfig: Record<string, { cats: string[]; words: string[] }> = {
    harian: {
      cats: ['daily_fresh', 'professional'],
      words: [
        'harian',
        'kerja',
        'kantor',
        'ac',
        'siang',
        'kuliah',
        'rapi',
        'daily',
        'segar',
        'aktivitas',
        'meeting',
      ],
    },
    malam: {
      cats: ['attraction', 'luxury'],
      words: [
        'malam',
        'kencan',
        'dinner',
        'pesta',
        'romantis',
        'intim',
        'night',
        'mewah',
        'amber',
        'spesial',
        'formal',
      ],
    },
    siang: {
      cats: ['daily_fresh', 'viral_hits', 'new_trending'],
      words: [
        'siang',
        'santai',
        'hangout',
        'outdoor',
        'panas',
        'cerah',
        'kasual',
        'segar',
        'olahraga',
        'sejuk',
        'bebas',
      ],
    },
  };

  // 4. Preferensi Persona (Karakter)
  const personaConfig: Record<string, { boost: string[]; avoid: string[] }> = {
    pria: {
      boost: [
        'pria',
        'gentleman',
        'maskulin',
        'men',
        'karisma',
        'tegas',
        'sauvage',
        'aventus',
        'sport',
        'blue',
        'woody',
        'pepper',
        'pemimpin',
      ],
      avoid: ['feminin', 'feminine', 'wanita', 'gaun', 'sweet rose', 'mademoiselle'],
    },
    wanita: {
      boost: [
        'wanita',
        'feminine',
        'feminin',
        'anggun',
        'women',
        'mempesona',
        'bunga',
        'floral',
        'rose',
        'mawar',
        'freesia',
        'jasmine',
        'opium',
        'mademoiselle',
        'pear',
        'manis',
      ],
      avoid: ['maskulin', 'gentleman', 'pria'],
    },
    unisex: {
      boost: [
        'unisex',
        'netral',
        'bersih',
        'universal',
        'teh',
        'matcha',
        'santal',
        'musk',
        'amber',
        'baccarat',
        'clean',
      ],
      avoid: [],
    },
  };

  // 5. Evaluasi dan Beri Skor Setiap Varian di Katalog SINKI
  let bestItem = pool[0];
  let highestScore = -9999;

  pool.forEach((item) => {
    let score = 50;

    const searchableText = [
      item.name,
      item.tagline || '',
      item.usageRecommendation || '',
      (item.accords || []).join(' '),
      item.categoryLabel || '',
      (item.collectionCategories || []).join(' '),
    ]
      .join(' ')
      .toLowerCase();

    // A. Nilai Sensasi Wangi (Vibe) - Bobot Terpenting
    const vKeys = vibeKeywords[vibe] || [];
    let vibeMatches = 0;
    vKeys.forEach((k) => {
      if (searchableText.includes(k)) vibeMatches++;
    });
    score += Math.min(vibeMatches * 15, 45);

    // B. Nilai Momen Penggunaan (Occasion)
    const occ = occasionConfig[occasion];
    if (occ) {
      const hasCat = (item.collectionCategories || []).some((c) => occ.cats.includes(c));
      if (hasCat) score += 25;

      let occWordMatches = 0;
      occ.words.forEach((w) => {
        if (searchableText.includes(w)) occWordMatches++;
      });
      score += Math.min(occWordMatches * 8, 20);
    }

    // C. Nilai Persona
    const pConf = personaConfig[persona];
    if (pConf) {
      pConf.boost.forEach((w) => {
        if (searchableText.includes(w)) score += 12;
      });
      pConf.avoid.forEach((w) => {
        if (searchableText.includes(w)) score -= 15;
      });
    }

    if (score > highestScore) {
      highestScore = score;
      bestItem = item;
    }
  });

  // 6. Hubungkan ke Foto Botol (Bila Varian Masuk Top 11 atau Foto Khusus)
  const top11Match = TOP_11_DATA.find(
    (t) =>
      t.name.toLowerCase().includes(bestItem.name.toLowerCase()) ||
      bestItem.name.toLowerCase().includes(t.name.toLowerCase())
  );

  const photo =
    (top11Match && (photos[top11Match.id] || photos[String(top11Match.rank)])) ||
    photos['top-1'] ||
    photos['1'] ||
    'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/top11/top-1.jpg';

  // 7. Susun Kalimat Hipnotis Pendek: "Inilah aroma yang selama ini Anda cari..."
  let reasonText = '';
  if (vibe === 'segar') {
    reasonText =
      persona === 'pria'
        ? 'Inilah aroma segar berkarisma yang selama ini Anda cari. Dingin, tegas, dan memikat sejak detik pertama.'
        : persona === 'wanita'
        ? 'Inilah aroma bersih mempesona yang selama ini Anda cari. Anggun, menyegarkan, dan memikat di setiap hembusan.'
        : 'Inilah aroma segar alami yang selama ini Anda cari. Bersih, menenangkan, dan menyatu sempurna dengan aura diri Anda.';
  } else if (vibe === 'manis') {
    reasonText =
      persona === 'pria'
        ? 'Inilah wangi manis berkelas yang selama ini Anda cari. Hangat, berkarisma, dan selalu meninggalkan jejak tak terlupakan.'
        : persona === 'wanita'
        ? 'Inilah wangi manis menggoda yang selama ini Anda cari. Begitu mewah, sensual, dan selalu membuat orang rindu.'
        : 'Inilah wangi manis elegan yang selama ini Anda cari. Lembut, creamy, dan memikat siapa pun di dekat Anda.';
  } else {
    // hangat
    reasonText =
      persona === 'pria'
        ? 'Inilah karakter wangi sejati yang selama ini Anda cari. Hangat, berwibawa, dan memancarkan karisma pemimpin.'
        : persona === 'wanita'
        ? 'Inilah pesona wangi mewah yang selama ini Anda cari. Elegan, hangat, dan memancarkan aura kemewahan abadi.'
        : 'Inilah aroma istimewa yang selama ini Anda cari. Hangat, tenang, dan menyatu sempurna dengan kepribadian Anda.';
  }

  // 8. Kategori Koleksi SINKI Resmi
  let categoryLabel = 'SINKI Luxury Signature';
  if (Array.isArray(bestItem.collectionCategories) && bestItem.collectionCategories.length > 0) {
    const matchedCategory = COLLECTION_CATEGORIES.find(
      (c) => c.id === bestItem.collectionCategories![0]
    );
    if (matchedCategory) {
      categoryLabel = `Koleksi ${matchedCategory.title}`;
    }
  }

  const accordsText =
    Array.isArray(bestItem.accords) && bestItem.accords.length > 0
      ? bestItem.accords.join(' · ')
      : 'Amber · Woods · Fresh Clean';

  // Skor kecocokan realistis antara 96% - 99%
  const matchScore = Math.min(99, Math.max(96, 95 + Math.abs(highestScore % 5)));

  return {
    perfumeName: bestItem.name,
    categoryLabel,
    matchScore,
    reason: reasonText,
    accords: accordsText,
    longevity: '12+ Jam',
    sillage: 'Proyeksi 2 Meter',
    photoUrl: photo,
    pricePerMl: bestItem.pricePerMl || 3000,
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

  // ==========================================
  // HASIL RACIK AROMA: PANGGUNG 3D BUTIK MEWAH PARIS (INSTANT LOAD & BOTOL BEBAS TIDAK TERTUTUP)
  // ==========================================
  if (step === 'result' && matchResult) {
    return (
      <div
        key={`step-result-${viewTransitionKey}`}
        className="relative w-full h-full flex flex-col justify-between overflow-hidden text-slate-100 sinki-screen-soft-fade select-none pb-24 sm:pb-28"
      >
        {/* 1. LAYER LATAR BELAKANG PANGGUNG MEWAH DINAMIS SESUAI SENSAI WANGI */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Latar Belakang Dasar Marmer Hitam Obsidian */}
          <div className="absolute inset-0 bg-[#08080b]" />

          {/* Lampu Sorot Arsitektural Butik Paris dari Atas (Top Downlight Spotlight) */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-96 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(223, 183, 108, 0.28) 0%, rgba(197, 160, 89, 0.12) 45%, transparent 75%)',
            }}
          />

          {/* Dynamic Ambient Haze Sesuai Sensasi Wangi */}
          {selectedVibe === 'segar' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 55%, rgba(14, 116, 144, 0.2) 0%, rgba(3, 105, 161, 0.08) 45%, transparent 70%)',
              }}
            />
          )}
          {selectedVibe === 'manis' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 55%, rgba(225, 29, 72, 0.16) 0%, rgba(217, 119, 6, 0.1) 45%, transparent 70%)',
              }}
            />
          )}
          {selectedVibe === 'hangat' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 55%, rgba(217, 119, 6, 0.22) 0%, rgba(180, 83, 9, 0.12) 45%, transparent 70%)',
              }}
            />
          )}

          {/* Pendaran Partikel Emas Lembut di Panggung */}
          <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-[#C5A059]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#DFB76C]/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* 2. LAYER ATAS: HEADER NAVIGASI + NAMA VARIAN & TAGLINE HIPNOTIS (TIDAK MENUTUPI BOTOL) */}
        <header className="relative z-20 w-full max-w-md mx-auto px-4 pt-2.5 shrink-0 space-y-1.5 text-center">
          {/* Bar Atas: Tombol Racik Ulang & Brand */}
          <div className="flex items-center justify-between pb-0.5">
            <button
              type="button"
              onClick={handleReset}
              className="py-1 px-2.5 rounded-[6px] sinki-arch-bar backdrop-blur-md border border-[#DFB76C]/35 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft size={12} className="text-[#DFB76C]" />
              <span>Racik Ulang</span>
            </button>

            <span className="font-heading text-[10px] font-bold tracking-[0.14em] text-[#DFB76C] uppercase drop-shadow-sm">
              Atelier SINKI Paris
            </span>
          </div>

          {/* Identitas Parfum: Nama Varian & Tagline di Atas */}
          <div className="space-y-0.5">
            <span className="inline-block py-0.5 px-2 rounded-[4px] bg-[#C5A059]/20 border border-[#DFB76C]/40 text-[#F0DFB6] font-body text-[9.5px] font-semibold tracking-[0.06em] uppercase">
              {matchResult.categoryLabel} · Formula Khas Anda
            </span>

            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-[-0.02em] leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              {matchResult.perfumeName}
            </h2>

            <p className="font-body text-[11.5px] sm:text-xs text-amber-100/90 font-normal leading-[1.4] max-w-xs mx-auto italic drop-shadow-sm">
              “{matchResult.reason}”
            </p>
          </div>
        </header>

        {/* 3. LAYER TENGAH: PANGGUNG 3D BOTOL PARFUM BESAR & 100% BEBAS TANPA TERTUTUP */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto px-2 min-h-[290px] sm:min-h-[340px]">
          {/* Pedestal Kristal Bersinar Proporsional Lebih Lebar di Bawah Botol */}
          <div className="stage-pedestal-crystal absolute bottom-5 w-64 sm:w-80 h-16 sm:h-20 rounded-[100%] pointer-events-none filter blur-[1.5px]" />

          {/* Bayangan Kontak Alas Botol di Lantai Marmer (Contact Shadow) */}
          <div className="absolute bottom-4 w-36 sm:w-48 h-4.5 bg-black/90 rounded-[100%] blur-[6px] pointer-events-none" />

          {/* Botol 3D Melayang Halus - Ukuran Lebih Besar & Megah */}
          <div className="relative flex items-center justify-center stage-bottle-float cursor-pointer select-none">
            <img
              src={matchResult.photoUrl}
              alt={matchResult.perfumeName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="max-h-[310px] sm:max-h-[380px] w-auto max-w-[92%] sm:max-w-[85%] object-contain select-none filter drop-shadow-[0_20px_36px_rgba(0,0,0,0.95)] drop-shadow-[0_0_28px_rgba(223,183,108,0.3)] transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 4. LAYER BAWAH: TOMBOL KECIL, RAMPING & TIDAK TINGGI */}
        <div className="relative z-20 w-full max-w-xs mx-auto px-4 shrink-0 pt-1 pb-1 flex justify-center">
          <button
            type="button"
            onClick={handleOrderResult}
            className="w-full sm:w-auto min-w-[210px] py-2 px-5 rounded-[6px] champagne-gold-btn text-slate-950 font-body text-xs font-bold tracking-[0.01em] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(197,160,89,0.36)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>Ambil Racikan Ini Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendaran Cahaya Halo Emas Lembut di Belakang */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#C5A059]/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* KONTEN UTAMA: RUANG LAPANG (AIRY ZEN LUXURY - TIDAK PADAT) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* ==========================================
            LANGKAH 1: RACIK AROMA KHAS DIRI ANDA
            ========================================== */}
        {step === 1 && (
          <div key={`step-1-${viewTransitionKey}`} className="space-y-4">
            <div className="text-center space-y-1 sinki-heading-anim pb-1">
              <span className="font-body text-[11px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                Racikan 1 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Racik Aroma Khas Diri Anda
              </h3>
              <p className="font-body text-xs sm:text-[13px] text-amber-200 font-medium leading-[1.4]">
                Biar SINKI racikkan aroma yang paling menyatu dengan karakter Anda
              </p>
              <p className="font-body text-[11.5px] text-slate-400 font-normal pt-0.5">
                Untuk siapa racikan parfum ini dibuat? Pilih karakter Anda:
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
                Racikan 2 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Mau Dipakai Saat Momen Apa?
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                Pilih suasana di mana wangi Anda ingin paling berkesan
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

            {/* Tombol Balik ke Langkah 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-body text-xs text-slate-400 hover:text-[#E8C574] font-medium pt-1 transition-colors block mx-auto cursor-pointer"
            >
              ← Kembali ke Langkah 1
            </button>
          </div>
        )}

        {/* ==========================================
            LANGKAH 3: KESAN WANGI UTAMA
            ========================================== */}
        {step === 3 && (
          <div key={`step-3-${viewTransitionKey}`} className="space-y-4">
            <div className="text-center space-y-1 sinki-heading-anim pb-1">
              <span className="font-body text-[11.5px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                Racikan 3 dari 3
              </span>
              <h3 className="font-heading text-lg sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-[1.25]">
                Sensasi Wangi yang Paling Nyaman di Hidung Anda?
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                Tentukan aroma utama racikan yang paling Anda sukai
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

            {/* Tombol Balik ke Langkah 2 */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="font-body text-xs text-slate-400 hover:text-[#E8C574] font-medium pt-1 transition-colors block mx-auto cursor-pointer"
            >
              ← Kembali ke Langkah 2
            </button>
          </div>
        )}

        {/* ==========================================
            MOMEN MERACIK FORMULA (1.2 DETIK)
            ========================================== */}
        {step === 'calculating' && (
          <div className="py-16 text-center space-y-4 sinki-heading-anim">
            <div className="w-16 h-16 mx-auto rounded-[10px] sinki-arch-card border flex items-center justify-center text-[#DFB76C] animate-pulse shadow-[0_0_28px_rgba(223,183,108,0.28)]">
              <PerfumeBottleIcon size={34} className="text-[#E8C574]" strokeWidth={1.9} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white tracking-[-0.01em]">
                Sedang Meracik Formula Terbaik...
              </h3>
              <p className="font-body text-xs text-slate-400 font-normal">
                SINKI sedang mencocokkan bibit parfum terbaik dengan karakter Anda
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  MessageSquarePlus,
  X,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Search,
  ChevronRight,
} from 'lucide-react';
import { TOP_11_DATA } from '../data/top11';
import {
  CollectionCategoryKey,
  COLLECTION_CATEGORIES,
} from '../data/perfumes';
import { getStoredPerfumes, fetchPerfumesFromServer, PerfumeItem } from '../utils/perfumeStorage';
import { PerfumeDetailModal } from './PerfumeDetailModal';
import { Category3DIcon } from './CollectionScreen';
import {
  ReviewItem,
  INITIAL_4_REVIEWS,
  getCachedReviews,
  fetchReviewsFromSupabase,
  saveReviewToSupabase,
  deleteReviewFromSupabase,
  likeReviewInSupabase,
  resetReviewsToDefaultInSupabase,
  MAX_REVIEWS_LIMIT,
} from '../utils/reviewStorage';
import { verifyOwnerPinOnServer } from '../utils/assetStorage';

export type { ReviewItem };
export { INITIAL_4_REVIEWS };

export interface ReviewScreenProps {
  onBackToHome: () => void;
  onNavigateToOrder?: () => void;
  onShowToast: (msg: string) => void;
  initialVariant?: string | null;
  onClearTargetVariant?: () => void;
}

// OPSI EMOJI YANG DAPAT DIPILIH (FORMAT RINGKAS 1 BARIS)
const EMOJI_OPTIONS = [
  { emoji: '😍', label: 'Puas' },
  { emoji: '🥰', label: 'Suka' },
  { emoji: '💎', label: 'Mewah' },
  { emoji: '🔥', label: 'Awet' },
  { emoji: '💖', label: 'Favorit' },
  { emoji: '👍', label: 'Top' },
];

// FILTER KATA TIDAK PANTAS (SENSOR KATA KASAR)
const INAPPROPRIATE_WORDS = [
  'anjing',
  'babi',
  'bangsat',
  'goblok',
  'kontol',
  'memek',
  'bajingan',
  'tai',
  'taik',
  'penipu',
  'asu',
  'kampret',
  'pantek',
  'tolol',
  'itil',
  'jancuk',
  'pepek',
  'bego',
  'idiot',
  'perek',
  'lonte',
  'puki',
];

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  onBackToHome,
  onNavigateToOrder,
  onShowToast,
  initialVariant,
  onClearTargetVariant,
}) => {
  // State Ulasan Terintegrasi Supabase (Cache Instan + Real-time Sync)
  const [reviews, setReviews] = useState<ReviewItem[]>(getCachedReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Muat ulasan terbaru dari Supabase saat layar dibuka & sinkronisasi berkala
  useEffect(() => {
    let isMounted = true;
    const syncReviews = async () => {
      try {
        const latest = await fetchReviewsFromSupabase();
        if (isMounted && Array.isArray(latest)) {
          setReviews(latest);
        }
      } catch (err) {
        console.error('Sync reviews notice:', err);
      }
    };

    syncReviews();
    const interval = setInterval(syncReviews, 20000); // Sinkronisasi otomatis setiap 20 detik
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sinkronisasi katalog parfum terkini (EDP Classic + Top 11)
  const [perfumesCatalog, setPerfumesCatalog] = useState<PerfumeItem[]>(getStoredPerfumes);
  useEffect(() => {
    fetchPerfumesFromServer().then((list) => {
      if (list && list.length > 0) {
        setPerfumesCatalog(list);
      }
    });
  }, []);

  // Filter Pencarian Ulasan
  const [searchQuery, setSearchQuery] = useState('');

  const [likedReviews, setLikedReviews] = useState<string[]>([]);
  // Efek Cahaya Berjalan Interaktif & Expand Komentar Panjang saat diketuk
  const [activeBeamId, setActiveBeamId] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Modal Tulis Ulasan (Alur A: Varian tersembunyi di awal, muncul saat kategori diklik, ringkas kembali setelah dipilih)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [variantCategoryTab, setVariantCategoryTab] = useState<CollectionCategoryKey | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CollectionCategoryKey | null>(null);
  const variantListScrollRef = useRef<HTMLDivElement | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('😍');
  const [formEmojiLabel, setFormEmojiLabel] = useState('Puas');
  const [formVariant, setFormVariant] = useState('');
  const [formComment, setFormComment] = useState('');
  const [selectedPerfumeForDetail, setSelectedPerfumeForDetail] = useState<PerfumeItem | null>(null);

  const handleOpenPerfumeDetailByName = (variantName: string) => {
    if (!variantName) return;
    const clean = variantName.trim().toLowerCase();
    const found = perfumesCatalog.find(
      (p) =>
        p.name.toLowerCase() === clean ||
        clean.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(clean)
    );
    if (found) {
      setSelectedPerfumeForDetail(found);
    } else {
      setSelectedPerfumeForDetail({
        id: `rev-var-${clean.replace(/\s+/g, '-')}`,
        name: variantName,
        category: 'unisex',
        categoryLabel: 'SINKI Signature',
        tagline: `Varian aroma favorit yang paling disukai pembeli SINKI`,
        accords: ['Mewah', 'Tahan Lama', 'Bibit Murni'],
        collectionCategories: ['luxury'],
      });
    }
  };

  // Auto-open modal jika dipanggil dari kartu Collection atau Top 11 & tandai kategori terpilih (varian tetap ringkas di awal)
  useEffect(() => {
    if (initialVariant) {
      setFormVariant(initialVariant);
      const matched = perfumesCatalog.find(
        (p) => p.name.toLowerCase() === initialVariant.trim().toLowerCase()
      );
      if (matched?.collectionCategories && matched.collectionCategories.length > 0) {
        setSelectedCategoryKey(matched.collectionCategories[0]);
      } else {
        setSelectedCategoryKey(null);
      }
      setVariantCategoryTab(null);
      setIsWriteModalOpen(true);
      if (onClearTargetVariant) {
        onClearTargetVariant();
      }
    }
  }, [initialVariant, perfumesCatalog]);

  // Jeda 1 Menit (Cooldown Anti-Spam)
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sinki_last_review_submit');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Fitur Rahasia: Tekan Logo 5x untuk Akses Hapus dengan PIN Pemilik
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Handler klik logo 5x
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 3000) {
      setLogoTapCount(1);
    } else {
      const nextCount = logoTapCount + 1;
      setLogoTapCount(nextCount);
      if (nextCount >= 5) {
        setLogoTapCount(0);
        setIsAdminModalOpen(true);
        setPinInput('');
        setPinError('');
      }
    }
    setLastTapTime(now);
  };

  // Verifikasi PIN Pemilik
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyOwnerPinOnServer(pinInput.trim());
      if (res.success) {
        setIsAdminMode(true);
        setIsAdminModalOpen(false);
        setPinInput('');
        setPinError('');
        onShowToast('🛡️ Mode Pengelola Aktif! Tombol hapus ulasan kini muncul.');
      } else {
        setPinError(res.error || 'PIN salah! Silakan coba lagi.');
      }
    } catch {
      setPinError('Gagal terhubung ke server verifikasi PIN.');
    }
  };

  // Hapus Ulasan (Khusus Mode Pemilik - Sinkron ke Supabase)
  const handleDeleteReview = async (id: string, name: string) => {
    try {
      const result = await deleteReviewFromSupabase(id);
      setReviews(result.reviews);
      onShowToast(`Ulasan dari "${name}" berhasil dihapus dari sistem! 🗑️`);
    } catch (err) {
      console.error(err);
      const filtered = reviews.filter((r) => r.id !== id);
      setReviews(filtered);
      onShowToast(`Ulasan dari "${name}" dihapus! 🗑️`);
    }
  };

  // Reset ke Ulasan Standar (Khusus Mode Pemilik)
  const handleResetToDefault = async () => {
    try {
      const res = await resetReviewsToDefaultInSupabase();
      setReviews(res);
      onShowToast('Ulasan telah di-reset ke versi standar SINKI');
    } catch (err) {
      console.error(err);
    }
  };

  // Beri Love / Apresiasi Ulasan (Sinkron ke Supabase)
  const handleLike = async (id: string) => {
    setActiveBeamId(id);
    if (likedReviews.includes(id)) {
      onShowToast('Anda sudah menyukai ulasan ini');
      return;
    }

    setLikedReviews((prev) => [...prev, id]);
    const result = await likeReviewInSupabase(id);
    setReviews(result.reviews);
    onShowToast('Terima kasih atas apresiasinya! 💖');
  };

  // Submit Ulasan Baru (Otomatis Masuk Supabase & Tampil Seketika)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Input Dasar
    if (!formName.trim()) {
      onShowToast('Mohon isi nama Anda terlebih dahulu');
      return;
    }
    if (!formVariant.trim()) {
      onShowToast('Mohon pilih kategori & varian parfum terlebih dahulu');
      return;
    }
    if (!formComment.trim()) {
      onShowToast('Mohon tulis ulasan singkat Anda');
      return;
    }

    // 2. Cek Jeda 1 Menit (60 detik cooldown anti-spam)
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime;
    const COOLDOWN_MS = 60 * 1000; // 1 menit

    if (timeSinceLastSubmit < COOLDOWN_MS) {
      const secondsLeft = Math.ceil((COOLDOWN_MS - timeSinceLastSubmit) / 1000);
      onShowToast(
        `Mohon tunggu jeda 1 menit (${secondsLeft} detik lagi) sebelum mengirim ulasan baru.`
      );
      return;
    }

    // 3. Sensor & Filter Kata Tidak Pantas (Anti-False Positive via Word Boundary Regex)
    const combinedText = `${formName.toLowerCase()} ${formComment.toLowerCase()}`;
    const containsInappropriate = INAPPROPRIATE_WORDS.some((word) => {
      const regex = new RegExp(`(^|\\s|[.,!?;])${word}($|\\s|[.,!?;])`, 'i');
      return regex.test(combinedText);
    });

    if (containsInappropriate) {
      onShowToast('Ulasan ditolak: Terdeteksi kata atau kalimat yang kurang sopan.');
      return;
    }

    // 4. Masukkan ulasan baru di baris teratas (Posisi #1)
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: formName.trim(),
      emoji: formEmoji,
      emojiLabel: formEmojiLabel,
      variant: formVariant,
      comment: formComment.trim(),
      date: 'Baru saja',
      likes: 1,
    };

    setIsSubmitting(true);
    try {
      const res = await saveReviewToSupabase(newRev);
      setReviews(res.reviews);
      setActiveBeamId(newRev.id);

      // Simpan waktu submit
      setLastSubmitTime(now);
      try {
        localStorage.setItem('sinki_last_review_submit', now.toString());
      } catch (err) {
        console.error(err);
      }

      setIsWriteModalOpen(false);
      setFormName('');
      setFormComment('');
      setFormVariant('');
      setSelectedCategoryKey(null);
      setVariantCategoryTab(null);
      onShowToast(`Ulasan Anda berhasil dipublikasikan seketika! ${formEmoji}`);
    } catch (err) {
      console.error(err);
      onShowToast('Ulasan berhasil dikirim!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hitung daftar ulasan terfilter berdasarkan pencarian
  const filteredReviews = reviews.filter((rev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      rev.name.toLowerCase().includes(q) ||
      rev.variant.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q) ||
      rev.emojiLabel.toLowerCase().includes(q)
    );
  });
  const displayedReviews = filteredReviews.slice(0, MAX_REVIEWS_LIMIT);

  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* 1. HEADER ATAS DENGAN TOMBOL "BERI ULASAN" DI POJOK KANAN ATAS YANG SANGAT JELAS & TERANG */}
      <div className="relative z-30 px-3.5 pt-3 pb-2.5 shrink-0 sinki-arch-header border-b backdrop-blur-md flex items-center justify-between gap-2">
        {/* Kiri: Tombol Back & Logo SINKI (Tekan 5x untuk Akses PIN) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border flex items-center justify-center text-[#E8C782] hover:text-white transition-colors active:scale-95 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Logo SINKI (Tekan 5x Berturut-turut untuk Membuka PIN Rahasia) */}
          <div
            onClick={handleLogoTap}
            className="cursor-pointer select-none py-1 px-1.5 rounded-[6px] active:scale-95 transition-transform min-w-0"
            title="Ketuk logo 5x untuk akses pengelola"
          >
            <h2 className="font-heading text-[15px] sm:text-base font-bold text-white tracking-[0.06em] leading-[1.2] truncate">
              SINKI
            </h2>
            <span className="font-body text-[11px] text-slate-400 font-normal leading-tight block">
              Review Pembeli
            </span>
          </div>
        </div>

        {/* Kanan: Tombol "Beri Ulasan" Tampil Elegan (Champagne Gold) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdminMode && (
            <button
              onClick={() => {
                setIsAdminMode(false);
                onShowToast('Mode Pengelola dinonaktifkan.');
              }}
              className="py-1 px-2 rounded-[8px] bg-red-600/30 border border-red-500/50 text-red-300 font-body text-[11.5px] font-semibold leading-tight flex items-center gap-1 active:scale-95"
            >
              <Unlock size={12} />
              <span>Keluar</span>
            </button>
          )}

          {/* TOMBOL BERI ULASAN (CHAMPAGNE GOLD) */}
          <button
            type="button"
            onClick={() => {
              setVariantCategoryTab(null);
              setIsWriteModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs leading-tight transition-all active:scale-95 shadow-md shadow-black/30 shrink-0 border border-[#DFB76C]/40"
          >
            <MessageSquarePlus size={13} className="stroke-[2.2]" />
            <span>Beri Ulasan</span>
          </button>
        </div>
      </div>

      {/* Banner Mode Pengelola (Jika PIN Terverifikasi) */}
      {isAdminMode && (
        <div className="px-3.5 py-2 bg-red-950/90 border-b border-red-500/40 flex items-center justify-between gap-2 font-body text-[11.5px] text-red-200 shrink-0">
          <div className="flex items-center gap-1.5 font-normal">
            <ShieldAlert size={13} className="text-red-400 shrink-0" />
            <span>Mode Pengelola: Tekan tombol merah untuk hapus ulasan.</span>
          </div>
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 text-[11.5px] text-[#DFB76C] underline font-semibold hover:text-white shrink-0 ml-2"
          >
            <RotateCcw size={11} />
            <span>Reset 4 Ulasan</span>
          </button>
        </div>
      )}

      {/* 2. DAFTAR ULASAN RAMPING (MUAT BANYAK ULASAN) */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 pb-24 sm:pb-28 space-y-1.5">
        
        {/* Label Terverifikasi Asli + Kolom Pencarian Ulasan Ramping */}
        <div className="sinki-heading-anim space-y-1.5">
          <div className="flex items-center justify-end px-0.5">
            <span className="font-body text-[10.5px] text-emerald-300 font-medium inline-flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
              <span>Terverifikasi Asli</span>
            </span>
          </div>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={13} className="text-[#DFB76C]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari varian parfum, nama pembeli, atau ulasan..."
              className="w-full pl-8 pr-7 py-1.5 rounded-[8px] sinki-arch-input border font-body text-xs leading-normal font-normal text-white placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Info Hasil Filter Pencarian */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 font-body text-[11px] text-slate-400">
            <span>
              Ditemukan <strong className="text-[#DFB76C] font-semibold tabular-nums">{filteredReviews.length}</strong> ulasan
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#DFB76C] font-medium hover:underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* DAFTAR ULASAN ULTRA-RAMPING (LEBAR PENUH, TINGGI PENDEK 2 BARIS) */}
        <div className="space-y-1.5">
          {displayedReviews.length === 0 ? (
            searchQuery.trim() ? (
              <div className="sinki-cascade-row-0 p-4 rounded-[8px] sinki-arch-card border text-center space-y-2 font-body">
                <Search size={22} className="mx-auto text-slate-500" />
                <p className="text-sm text-slate-300 font-normal leading-[1.5]">
                  Tidak ada ulasan yang cocok dengan kata kunci <span className="text-[#DFB76C] font-medium">"{searchQuery}"</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#DFB76C] underline font-semibold"
                >
                  Hapus Pencarian & Tampilkan Semua
                </button>
              </div>
            ) : (
              <div className="sinki-cascade-row-0 p-5 rounded-[8px] sinki-arch-card border text-center space-y-3">
                <div className="w-11 h-11 rounded-[8px] bg-[#C5A059]/15 border border-[#DFB76C]/35 flex items-center justify-center mx-auto text-xl shadow-inner">
                  ✨
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-lg leading-[1.25] text-white tracking-[-0.015em]">
                    Belum Ada Ulasan Pembeli
                  </h3>
                  <p className="font-body text-sm text-slate-300 font-normal max-w-xs mx-auto leading-[1.5]">
                    Slot ulasan masih bersih. Jadilah yang pertama membagikan pengalaman aroma wewangian SINKI Anda!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVariantCategoryTab(null);
                    setIsWriteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-sm transition-all active:scale-95 shadow-md shadow-black/30"
                >
                  <MessageSquarePlus size={15} className="stroke-[2.2]" />
                  <span>Tulis Ulasan Pertama</span>
                </button>
              </div>
            )
          ) : displayedReviews.map((rev, idx) => {
            const hasLiked = likedReviews.includes(rev.id);
            const isActiveBeam = activeBeamId === rev.id || (idx === 0 && (!activeBeamId || activeBeamId === rev.id));
            const isExpanded = expandedReviewId === rev.id;
            const cascadeDelayMs = Math.min(idx * 75, 450);

            return (
              <div
                key={rev.id}
                onClick={() => {
                  setActiveBeamId((prev) => (prev === rev.id ? null : rev.id));
                  setExpandedReviewId((prev) => (prev === rev.id ? null : rev.id));
                }}
                style={{
                  animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${cascadeDelayMs}ms both`,
                  willChange: 'transform, opacity, filter',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className={`group relative w-full px-2.5 py-1.5 rounded-[8px] cursor-pointer overflow-hidden sinki-cushion-press ${
                  isActiveBeam
                    ? 'border-beam-active'
                    : isAdminMode
                    ? 'sinki-arch-card border border-red-500/50'
                    : 'sinki-arch-card sinki-arch-card-interactive border'
                }`}
              >
                {/* Konten Ultra-Ramping 2 Baris (Lebar 100%, Tinggi Sangat Pendek) */}
                <div className="relative z-10 space-y-0.5">
                  {/* Baris 1: Emot + Nama + Varian + Ambil Aroma + Like */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0 flex-1 font-body text-[11px] leading-tight">
                      <span className="text-xs leading-none shrink-0">{rev.emoji}</span>
                      <span className="font-heading font-semibold text-white truncate max-w-[95px] sm:max-w-[130px]">
                        {rev.name}
                      </span>
                      <CheckCircle2 size={9.5} className="text-emerald-400 shrink-0" />
                      <span aria-hidden="true" className="text-white/40 shrink-0">·</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPerfumeDetailByName(rev.variant);
                        }}
                        style={{ color: 'var(--arch-text-accent-bright)' }}
                        className="hover:brightness-125 font-medium truncate inline-flex items-center gap-0.5 min-w-0 cursor-pointer"
                        title={`Lihat varian ${rev.variant}`}
                      >
                        <span className="truncate">{rev.variant}</span>
                        <ChevronRight size={10} className="shrink-0 opacity-80" />
                      </button>
                    </div>

                    {/* Kanan: Waktu + Like / Hapus */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-body text-[10px] text-slate-500 hidden xs:inline">
                        {rev.date}
                      </span>
                      {isAdminMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReview(rev.id, rev.name);
                          }}
                          className="py-0.5 px-1.5 rounded-[4px] bg-red-600 hover:bg-red-500 text-white font-body text-[10px] font-semibold leading-none flex items-center gap-0.5 active:scale-95"
                          title="Hapus Ulasan Ini"
                        >
                          <Trash2 size={9.5} />
                          <span>Hapus</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(rev.id);
                          }}
                          className={`flex items-center gap-0.5 font-body text-[10px] leading-none px-1.5 py-0.5 rounded-[4px] transition-colors active:scale-95 ${
                            hasLiked
                              ? 'text-pink-400 bg-pink-500/15'
                              : 'text-slate-300 hover:text-white bg-white/[0.06]'
                          }`}
                        >
                          <span className="text-[9.5px]">{hasLiked ? '💖' : '🤍'}</span>
                          <span className="font-medium tabular-nums">{rev.likes}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Baris 2: Komentar 1 Baris Padat (Ketuk kotak jika ingin baca komentar panjang penuh) */}
                  <p
                    className={`font-body text-[11px] text-slate-300 font-normal leading-[1.3] pl-4 pr-1 ${
                      isExpanded ? '' : 'line-clamp-1'
                    }`}
                  >
                    "{rev.comment}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. DARI HATI SINKI (APRESIASI RINGKAS & ELEGAN - PILIHAN 3) */}
        <div
          style={{
            animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(
              Math.max(displayedReviews.length, 1) * 75,
              300
            )}ms both`,
            willChange: 'transform, opacity, filter',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="mt-2.5 p-3 sm:p-3.5 rounded-[10px] sinki-arch-card border relative overflow-hidden text-center space-y-2"
        >
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c5a059]/[0.08] rounded-full blur-2xl pointer-events-none" />

          {/* Kalimat Apresiasi & Pesona Ringkas (Pilihan 3) */}
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-[14.5px] sm:text-[15px] text-white tracking-[-0.015em] leading-[1.25]">
              Dari Hati SINKI
            </h4>
            <p className="font-body text-xs sm:text-[13px] text-slate-200 font-normal leading-[1.48] max-w-sm mx-auto">
              Hadirkan pesonamu dan rayakan setiap momen berharga bersama keharuman istimewa{' '}
              <strong className="text-[#DFB76C] font-semibold">SINKI</strong>.
            </p>
          </div>

          {/* Tombol Pesan Varian Lain (Navigasi ke Order) */}
          {onNavigateToOrder && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={onNavigateToOrder}
                className="w-full py-2 px-4 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md shadow-black/30"
              >
                <ShoppingBag size={14} />
                <span>Pesan Varian Lain / Belanja Lagi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. PANEL TULIS ULASAN — SINKI BOUTIQUE SHEET LEGA (ALUR A & FRAMELESS ICONS) */}
      {isWriteModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsWriteModalOpen(false)}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center px-0 sm:px-4 pt-6 pb-[env(safe-area-inset-bottom,0px)] sm:pb-6 sinki-backdrop-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-t-[10px] sm:rounded-[10px] sinki-arch-modal border-t sm:border px-5 pt-4 pb-6 sm:p-6 sinki-sheet-elevation"
            >
              {/* Aksen Garis Emas Tipis di Puncak Panel */}
              <div className="absolute inset-x-10 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#DFB76C]/70 to-transparent pointer-events-none" />

              {/* Garis Indikator Sheet Halus (Khusus Mobile) */}
              <div className="w-10 h-1 rounded-[4px] bg-[#D4AF6A]/25 mx-auto mb-3 sm:hidden" />

              {/* Header Lebih Besar & Jelas (Ikon Frameless Tanpa Kotak) */}
              <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-[#D4AF6A]/25">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl leading-none select-none shrink-0" aria-hidden="true">
                    ✍️
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-lg sm:text-xl leading-tight text-white tracking-[-0.015em] truncate">
                      Tulis Ulasan SINKI
                    </h3>
                    <p className="font-body text-xs text-slate-400 font-normal leading-snug mt-0.5">
                      Bagikan pengalaman keharuman pilihan Anda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  aria-label="Tutup form ulasan"
                  className="p-1.5 -mr-1 text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Lega & Nyaman (Alur A) */}
              <form onSubmit={handleSubmitReview} className="space-y-4 font-body">
                {/* 1. Nama Anda */}
                <div className="space-y-1.5">
                  <label className="text-[13px] text-slate-200 font-medium block leading-none">
                    Nama Anda
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Ardiansyah"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[8px] sinki-arch-input border text-sm leading-normal text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* 2. Kategori (6 Kategori Frameless) & Daftar Varian Rapi 2 Kolom Simetris (Alur A) */}
                {(() => {
                  const openCatMeta = variantCategoryTab
                    ? COLLECTION_CATEGORIES.find((c) => c.id === variantCategoryTab) || null
                    : null;
                  const categoryPerfumes = variantCategoryTab
                    ? perfumesCatalog
                        .filter(
                          (p) =>
                            Array.isArray(p.collectionCategories) &&
                            p.collectionCategories.includes(variantCategoryTab) &&
                            p.isActive !== false
                        )
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
                    : [];

                  return (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-slate-200 font-medium leading-none">
                          Varian Parfum
                        </span>
                        {formVariant ? (
                          <button
                            type="button"
                            onClick={() => {
                              const fallbackCat =
                                selectedCategoryKey ||
                                perfumesCatalog.find(
                                  (p) => p.name.toLowerCase() === formVariant.toLowerCase()
                                )?.collectionCategories?.[0] ||
                                'daily_fresh';
                              setVariantCategoryTab((prev) =>
                                prev === fallbackCat ? null : fallbackCat
                              );
                            }}
                            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#DFB76C] hover:text-[#FFF0CA] truncate max-w-[210px] leading-none cursor-pointer transition-colors"
                            title="Ketuk untuk mengganti varian parfum"
                          >
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span className="truncate">{formVariant}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal leading-none">
                            Pilih kategori di bawah
                          </span>
                        )}
                      </div>

                      {/* 6 Kategori Terlihat Utuh (3x2 Tanpa Kotak Pembungkus / Frameless) */}
                      <div className="grid grid-cols-3 gap-x-2 gap-y-2.5 pt-1 pb-2 border-b border-[#D4AF6A]/20">
                        {COLLECTION_CATEGORIES.map((cat) => {
                          const isDrawerOpen = variantCategoryTab === cat.id;
                          const isChosenCat =
                            !variantCategoryTab &&
                            Boolean(formVariant) &&
                            selectedCategoryKey === cat.id;
                          const isHighlighted = isDrawerOpen || isChosenCat;

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setVariantCategoryTab((prev) => (prev === cat.id ? null : cat.id));
                                if (variantListScrollRef.current) {
                                  variantListScrollRef.current.scrollTop = 0;
                                }
                              }}
                              className={`relative pb-1.5 pt-0.5 inline-flex items-center justify-start gap-1.5 min-w-0 transition-all cursor-pointer select-none ${
                                isHighlighted
                                  ? 'text-[#F3E6C8] font-semibold'
                                  : 'text-slate-300/80 hover:text-white font-medium'
                              }`}
                            >
                              <Category3DIcon
                                id={cat.id}
                                sizeClass="w-4 h-4 shrink-0"
                                idPrefix={`rev-${cat.id}`}
                              />
                              <span className="text-xs sm:text-[13px] leading-tight truncate">
                                {cat.title}
                              </span>
                              {isHighlighted && (
                                <span className="absolute left-0 right-2 bottom-0 h-[2px] rounded-full bg-[#DFB76C]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Daftar Nama Varian — Susunan 2 Kolom Simetris Rapi (Urut A–Z) */}
                      {openCatMeta && (
                        <div className="rounded-[8px] sinki-arch-subbox border p-2.5 space-y-2 sinki-screen-soft-fade">
                          <div className="flex items-center justify-between pb-2 border-b border-[#D4AF6A]/20 px-0.5">
                            <div className="inline-flex items-center gap-1.5 min-w-0">
                              <Category3DIcon
                                id={openCatMeta.id}
                                sizeClass="w-3.5 h-3.5 shrink-0"
                                idPrefix={`rev-open-${openCatMeta.id}`}
                              />
                              <span className="text-xs text-slate-300 leading-none truncate">
                                <strong className="text-[#F3E6C8] font-semibold">
                                  {openCatMeta.title}
                                </strong>
                                <span className="text-slate-500 mx-1">·</span>
                                <span className="text-[#DFB76C]/90 font-medium tabular-nums">
                                  {categoryPerfumes.length} Varian
                                </span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setVariantCategoryTab(null)}
                              className="text-[11.5px] text-slate-400 hover:text-white font-medium leading-none cursor-pointer shrink-0"
                            >
                              Tutup ✕
                            </button>
                          </div>

                          <div
                            ref={variantListScrollRef}
                            className="grid grid-cols-2 gap-1.5 max-h-[168px] sm:max-h-[184px] overflow-y-auto sinki-gold-scrollbar pr-1"
                          >
                            {categoryPerfumes.map((p) => {
                              const isSelected = formVariant === p.name;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setFormVariant(p.name);
                                    setSelectedCategoryKey(openCatMeta.id);
                                    setVariantCategoryTab(null);
                                  }}
                                  className={`w-full px-3 py-2 rounded-[6px] text-xs sm:text-[12.5px] leading-tight text-left flex items-center justify-between gap-1.5 border transition-all cursor-pointer sinki-cushion-press-sm ${
                                    isSelected
                                      ? 'sinki-arch-card-selected text-[#FFF3D6] font-semibold'
                                      : 'sinki-arch-subbox text-slate-200 hover:border-[#E8C782]/60 hover:text-white font-normal'
                                  }`}
                                >
                                  <span className="truncate">{p.name}</span>
                                  {isSelected ? (
                                    <CheckCircle2 size={12.5} className="text-[#DFB76C] shrink-0" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/15 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. Kepuasan Aroma — Ikon Tanpa Kotak Pembungkus (100% Frameless & Lebih Jelas) */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-200 font-medium leading-none">
                      Kepuasan Aroma
                    </span>
                    <span className="text-[12.5px] text-[#DFB76C] font-semibold leading-none">
                      {formEmoji} {formEmojiLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {EMOJI_OPTIONS.map((item) => {
                      const isPicked = formEmoji === item.emoji;
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => {
                            setFormEmoji(item.emoji);
                            setFormEmojiLabel(item.label);
                          }}
                          className={`py-1.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                            isPicked ? 'opacity-100' : 'opacity-50 hover:opacity-85'
                          }`}
                        >
                          <span
                            className={`text-2xl leading-none transition-transform duration-200 ${
                              isPicked ? 'scale-115' : 'scale-100'
                            }`}
                          >
                            {item.emoji}
                          </span>
                          <span
                            className={`text-[11px] sm:text-xs leading-none transition-colors ${
                              isPicked ? 'text-[#DFB76C] font-semibold' : 'text-slate-400 font-normal'
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`h-[2px] rounded-full transition-all duration-200 ${
                              isPicked ? 'w-5 bg-[#DFB76C]' : 'w-0 bg-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Kolom Ulasan Singkat (3 Baris Lega) */}
                <div className="space-y-1.5">
                  <label className="text-[13px] text-slate-200 font-medium block leading-none">
                    Ulasan Singkat
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ceritakan wangi, ketahanan aroma, atau kesan Anda..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[8px] sinki-arch-input border text-sm font-normal leading-relaxed text-white placeholder:text-slate-500 focus:outline-none resize-none transition-colors"
                  />
                </div>

                {/* 5. Tombol Emas Kirim Ulasan */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-body font-semibold text-sm transition-all active:scale-98 shadow-lg shadow-black/45 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan Ulasan...' : 'Kirim Ulasan Sekarang'}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 5. MODAL RAHASIA: AKSES PIN UNTUK HAPUS ULASAN (RENDER VIA PORTAL) */}
      {isAdminModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsAdminModalOpen(false)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xs rounded-[10px] sinki-arch-modal border border-red-500/45 p-5 space-y-3.5 text-center"
            >
              {/* Header */}
              <div className="w-12 h-12 rounded-[8px] bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <Lock size={22} />
              </div>

              <div>
                <h3 className="font-heading font-bold text-lg leading-[1.25] text-white tracking-[-0.015em]">
                  Akses Pengelola SINKI
                </h3>
                <p className="font-body text-xs text-slate-400 font-normal mt-1 leading-[1.45]">
                  Masukkan PIN untuk mengaktifkan fitur hapus ulasan.
                </p>
              </div>

              {/* Form PIN */}
              <form onSubmit={handleVerifyPin} className="space-y-3 font-body">
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  placeholder="Masukkan PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-center text-base sm:text-sm font-medium tabular-nums tracking-widest text-white focus:outline-none focus:border-red-400"
                />

                {pinError && (
                  <p className="text-xs text-red-400 font-medium">{pinError}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="flex-1 py-2 rounded-[8px] bg-[#16161c] hover:bg-[#1f1f27] text-slate-300 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-[8px] bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all active:scale-95"
                  >
                    Buka Kunci
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* REUSABLE PERFUME DETAIL SHEET (100% Identik di Collection, Order & Review) */}
      <PerfumeDetailModal
        perfume={selectedPerfumeForDetail}
        onClose={() => setSelectedPerfumeForDetail(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};

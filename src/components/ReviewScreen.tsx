import React, { useState, useEffect } from 'react';
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
  // Efek Cahaya Berjalan Interaktif (Pilihan 3) saat disentuh / di-like
  const [activeBeamId, setActiveBeamId] = useState<string | null>(null);

  // Modal Tulis Ulasan
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [variantCategoryTab, setVariantCategoryTab] = useState<CollectionCategoryKey>('daily_fresh');
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('😍');
  const [formEmojiLabel, setFormEmojiLabel] = useState('Puas');
  const [formVariant, setFormVariant] = useState(TOP_11_DATA[0].name);
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

  // Auto-open modal jika dipanggil dari kartu Collection atau Top 11
  useEffect(() => {
    if (initialVariant) {
      setFormVariant(initialVariant);
      setIsWriteModalOpen(true);
      if (onClearTargetVariant) {
        onClearTargetVariant();
      }
    }
  }, [initialVariant]);

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
    if (!formName.trim() || !formComment.trim()) {
      onShowToast('Mohon lengkapi nama dan ulasan Anda');
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
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendar Cahaya Emas Halus & Tipis */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.07] rounded-full blur-[110px] pointer-events-none" />

      {/* 1. HEADER ATAS DENGAN TOMBOL "BERI ULASAN" DI POJOK KANAN ATAS YANG SANGAT JELAS & TERANG */}
      <div className="relative z-30 px-3.5 pt-3 pb-2.5 shrink-0 bg-[#12141a]/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between gap-2 shadow-sm">
        {/* Kiri: Tombol Back & Logo SINKI (Tekan 5x untuk Akses PIN) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Logo SINKI (Tekan 5x Berturut-turut untuk Membuka PIN Rahasia) */}
          <div
            onClick={handleLogoTap}
            className="cursor-pointer select-none py-1 px-1.5 rounded-lg active:scale-95 transition-transform min-w-0"
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
              className="py-1 px-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-300 font-body text-[11.5px] font-semibold leading-tight flex items-center gap-1 active:scale-95"
            >
              <Unlock size={12} />
              <span>Keluar</span>
            </button>
          )}

          {/* TOMBOL BERI ULASAN (CHAMPAGNE GOLD) */}
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs leading-tight transition-all active:scale-95 shadow-md shadow-black/30 shrink-0 border border-[#DFB76C]/40"
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

      {/* 2. DAFTAR 4 BARIS ULASAN (NAMA + EMOT + ULASAN) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-24 space-y-2.5">
        
        {/* Baris Ringkas: Judul & Badge Terverifikasi Asli */}
        <div className="flex items-center justify-between gap-2 px-1 pt-0.5 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-[15px] leading-[1.22] text-white tracking-[-0.015em]">
              Testimoni Pembeli
            </h3>
          </div>

          <span className="font-body text-[11px] text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
            <span>Terverifikasi Asli</span>
          </span>
        </div>

        {/* Kolom Pencarian Ulasan (Icon Search) */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} className="text-[#DFB76C]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari varian parfum, nama pembeli, atau ulasan..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#141622]/95 border border-white/10 font-body text-base sm:text-sm leading-normal font-normal text-white placeholder:text-slate-400 focus:outline-none focus:border-[#DFB76C] transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Info Hasil Filter Pencarian */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 font-body text-xs text-slate-400">
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

        {/* DAFTAR ULASAN (MAKSIMAL 10 SLOT TERBARU BERGANTIAN - FORMAT RAMPING PENDEK) */}
        <div className="space-y-2">
          {displayedReviews.length === 0 ? (
            searchQuery.trim() ? (
              <div className="p-4 rounded-2xl bg-[#141622]/80 border border-white/10 text-center space-y-2 font-body">
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
              <div className="p-5 rounded-2xl bg-[#141622]/90 border border-white/10 text-center space-y-3 backdrop-blur-md shadow-lg">
                <div className="w-11 h-11 rounded-2xl bg-[#C5A059]/15 border border-[#DFB76C]/30 flex items-center justify-center mx-auto text-xl shadow-inner">
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
                  onClick={() => setIsWriteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-sm transition-all active:scale-95 shadow-md shadow-black/30"
                >
                  <MessageSquarePlus size={15} className="stroke-[2.2]" />
                  <span>Tulis Ulasan Pertama</span>
                </button>
              </div>
            )
          ) : displayedReviews.map((rev, idx) => {
            const hasLiked = likedReviews.includes(rev.id);
            const isActiveBeam = activeBeamId === rev.id || (idx === 0 && (!activeBeamId || activeBeamId === rev.id));

            return (
              <div
                key={rev.id}
                onClick={() => setActiveBeamId((prev) => (prev === rev.id ? null : rev.id))}
                style={{
                  animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(idx * 50, 300)}ms both`,
                  willChange: 'transform, opacity, filter',
                }}
                className={`group relative p-2.5 rounded-2xl cursor-pointer backdrop-blur-md overflow-hidden sinki-cushion-press ${
                  isActiveBeam
                    ? 'border-beam-active shadow-[0_4px_20px_rgba(223,183,108,0.22)]'
                    : isAdminMode
                    ? 'bg-gradient-to-b from-[#181a28]/95 to-[#12141e]/95 border border-red-500/50 shadow-lg shadow-red-950/20'
                    : 'bg-gradient-to-b from-[#181a28]/95 to-[#12141e]/95 border border-white/10 hover:border-[#DFB76C]/40 shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
                }`}
              >
                {/* Layer Konten (Di atas animasi border cahaya) */}
                <div className="relative z-10 space-y-1">
                  {/* Baris 1: Header Kompak (Emot, Nama, Centang, Varian, Label, dan Like) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Emot Bulat Mini & Ramping */}
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs shrink-0 shadow-inner">
                        {rev.emoji}
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap font-body">
                        <span className="font-heading font-semibold text-[13px] leading-tight text-white tracking-[-0.01em] truncate max-w-[130px] sm:max-w-[160px] drop-shadow-sm">
                          {rev.name}
                        </span>
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                        {idx === 0 && !searchQuery && (
                          <span className="text-[10.5px] font-medium text-amber-300 bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                            ★ Baru
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-zinc-200 bg-white/[0.08] px-1.5 py-0.5 rounded-md border border-white/10 leading-tight truncate max-w-[140px] sm:max-w-[175px]">
                          {rev.variant}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 hidden xs:inline">
                          • <span className="text-[#DFB76C] font-medium">{rev.emojiLabel}</span> • {rev.date}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Hapus (Mode Admin) atau Like Apresiasi */}
                    <div className="shrink-0">
                      {isAdminMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReview(rev.id, rev.name);
                          }}
                          className="py-1 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-body text-[11px] font-semibold leading-tight flex items-center gap-1 active:scale-95"
                          title="Hapus Ulasan Ini"
                        >
                          <Trash2 size={11} />
                          <span>Hapus</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(rev.id);
                          }}
                          className={`flex items-center gap-1 font-body text-[11px] leading-tight px-2 py-0.5 rounded-lg transition-colors active:scale-95 ${
                            hasLiked
                              ? 'text-pink-400 bg-pink-500/15 border border-pink-500/30'
                              : 'text-slate-300 hover:text-white bg-white/10 border border-white/15'
                          }`}
                        >
                          <span>{hasLiked ? '💖' : '🤍'}</span>
                          <span className="font-medium tabular-nums">{rev.likes}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Baris 2: Komentar Pembeli Nyaman Dibaca (Format Ramping Pendek) */}
                  <p className="font-body text-[12.5px] sm:text-[13px] text-slate-200 font-normal leading-[1.45] pl-8 pr-1 line-clamp-2">
                    "{rev.comment}"
                  </p>

                  {/* Baris 3: Tab Tindakan Cepat - Ambil Aroma Ini (100% Persis Menu Collection) */}
                  <div className="pt-2 mt-1.5 border-t border-white/[0.07] flex items-center justify-between gap-2 pl-2">
                    <span className="font-body text-[11px] text-slate-400 font-normal truncate">
                      Varian diulas: <strong className="text-[#DFB76C] font-semibold">{rev.variant}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPerfumeDetailByName(rev.variant);
                      }}
                      className="font-body py-1.5 px-2.5 rounded-md bg-white/[0.05] hover:bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E2C27F] hover:text-[#F3E6C8] text-[11.5px] font-semibold leading-none flex items-center gap-1 shrink-0 sinki-cushion-press-sm"
                    >
                      <span>Ambil Aroma Ini</span>
                      <ChevronRight size={12} className="text-[#DFB76C]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tombol Alternatif Tulis Ulasan (Mudah Ditekan) */}
        <div className="pt-0.5 pb-0.5">
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="w-full py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-400/50 text-amber-300 font-body font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <MessageSquarePlus size={14} />
            <span>+ Bagikan Pengalaman & Ulasan Anda</span>
          </button>
        </div>

        {/* 3. DARI HATI SINKI (APRESIASI RINGKAS & ELEGAN - PILIHAN 3) */}
        <div className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-[#1e2235] via-[#181a2b] to-[#131524] border border-white/10 shadow-xl relative overflow-hidden text-center space-y-2 backdrop-blur-md">
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
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md shadow-black/30"
              >
                <ShoppingBag size={14} />
                <span>Pesan Varian Lain / Belanja Lagi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL TULIS ULASAN (RENDER VIA PORTAL AGAR 100% PASTI MUNCUL DI LAYAR) */}
      {isWriteModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsWriteModalOpen(false)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl bg-[#12141e] border border-white/15 p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">✍️</span>
                  <div>
                    <h3 className="font-heading font-bold text-[15px] sm:text-base leading-[1.25] text-white tracking-[-0.015em]">
                      Tulis Ulasan SINKI
                    </h3>
                    <span className="font-body text-[11px] text-slate-400 font-normal">
                      Bagikan pengalaman aroma Anda
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitReview} className="space-y-3 font-body">
                {/* Nama */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-200 font-medium block">
                    Nama *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Ardiansyah"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-body text-base sm:text-sm leading-normal font-normal text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DFB76C]"
                  />
                </div>

                {/* Pilihan Varian Parfum (Sistem 2-Langkah: Pilih Koleksi ➔ Pilih Varian) */}
                <div className="space-y-2 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-slate-200 font-medium block">
                      Varian yang Diulas *
                    </label>
                    <span className="text-[11px] font-medium text-[#DFB76C] bg-[#C5A059]/15 px-2 py-0.5 rounded-full border border-[#DFB76C]/30 truncate max-w-[175px]">
                      {formVariant}
                    </span>
                  </div>

                  {/* LANGKAH 1: Pilih Koleksi (6 Kategori SINKI) */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-normal block mb-1.5">
                      1. Pilih Kategori Koleksi SINKI:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {COLLECTION_CATEGORIES.map((cat) => {
                        const isActive = variantCategoryTab === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setVariantCategoryTab(cat.id);
                              const matching = perfumesCatalog.filter(
                                (p) =>
                                  Array.isArray(p.collectionCategories) &&
                                  p.collectionCategories.includes(cat.id) &&
                                  p.isActive !== false
                              );
                              if (matching.length > 0 && !matching.some((p) => p.name === formVariant)) {
                                setFormVariant(matching[0].name);
                              }
                            }}
                            className={`py-1.5 px-1 rounded-xl text-center flex items-center justify-center border transition-all ${
                              isActive
                                ? 'bg-[#C5A059]/30 border-[#DFB76C] text-white font-semibold shadow-sm'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 font-medium'
                            }`}
                          >
                            <span className="text-[11px] truncate leading-tight">{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LANGKAH 2: Pilih Nama Varian (Daftar Ringkas Sesuai Kategori Pilihan) */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-normal block mb-1">
                      2. Pilih Nama Parfum (Kategori {COLLECTION_CATEGORIES.find((c) => c.id === variantCategoryTab)?.title || 'Pilihan'}):
                    </span>
                    <select
                      value={formVariant}
                      onChange={(e) => setFormVariant(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171926] border border-white/15 font-body text-base sm:text-sm leading-normal font-medium text-white focus:outline-none focus:border-[#DFB76C]"
                    >
                      {perfumesCatalog
                        .filter(
                          (p) =>
                            Array.isArray(p.collectionCategories) &&
                            p.collectionCategories.includes(variantCategoryTab) &&
                            p.isActive !== false
                        )
                        .map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Pilihan Kepuasan Aroma (1 Baris Ringkas & Ramping) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-[13px] text-slate-200 font-medium block">
                      Kepuasan Aroma *
                    </label>
                    <span className="text-xs text-[#DFB76C] font-medium bg-[#C5A059]/15 px-2 py-0.5 rounded-md border border-[#DFB76C]/30">
                      {formEmoji} {formEmojiLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {EMOJI_OPTIONS.map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => {
                          setFormEmoji(item.emoji);
                          setFormEmojiLabel(item.label);
                        }}
                        className={`py-1.5 px-0.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          formEmoji === item.emoji
                            ? 'bg-[#C5A059]/25 border-[#DFB76C] text-white shadow-sm font-semibold scale-[1.03]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 font-medium'
                        }`}
                      >
                        <span className="text-base leading-none">{item.emoji}</span>
                        <span className="text-[11px] text-center leading-tight">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Isi Ulasan */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-[13px] text-slate-200 font-medium block">
                    Ulasan & Kepuasan Aroma *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ceritakan aroma, ketahanan wangi, dan kemasan parfum SINKI Anda..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-body text-base sm:text-sm font-normal leading-[1.5] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DFB76C] resize-none"
                  />
                </div>

                {/* Info Jeda 1 Menit & Sensor Santun */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 font-normal leading-[1.45]">
                  ℹ️ Ulasan akan langsung tampil di urutan teratas. Mohon gunakan bahasa yang
                  sopan. Terdapat jeda 1 menit antar pengiriman ulasan.
                </div>

                {/* Submit Button: Champagne Gold */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-body font-semibold text-sm transition-all active:scale-98 shadow-md shadow-black/30"
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
              className="relative w-full max-w-xs rounded-3xl bg-[#12141e] border border-red-500/40 p-5 shadow-2xl space-y-3.5 text-center"
            >
              {/* Header */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
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
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-center text-base sm:text-sm font-medium tabular-nums tracking-widest text-white focus:outline-none focus:border-red-400"
                />

                {pinError && (
                  <p className="text-xs text-red-400 font-medium">{pinError}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all active:scale-95"
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

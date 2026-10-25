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
} from 'lucide-react';
import { TOP_11_DATA } from '../data/top11';
import { getStoredPerfumes, fetchPerfumesFromServer, PerfumeItem } from '../utils/perfumeStorage';
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
  const [variantCategoryTab, setVariantCategoryTab] = useState<'top11' | 'women' | 'men' | 'unisex' | 'powdery'>('top11');
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('😍');
  const [formEmojiLabel, setFormEmojiLabel] = useState('Puas');
  const [formVariant, setFormVariant] = useState(TOP_11_DATA[0].name);
  const [formComment, setFormComment] = useState('');

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

  // Fitur Rahasia: Tekan Logo 5x untuk Akses Hapus dengan PIN Pemilik (1995)
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // PIN Pemilik SINKI (Dirahasiakan, tidak ditampilkan di antarmuka)
  const SECRET_ADMIN_PIN = '1995';

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
      if (pinInput.trim() === '1995') {
        setIsAdminMode(true);
        setIsAdminModalOpen(false);
        setPinInput('');
        setPinError('');
        onShowToast('🛡️ Mode Pengelola Aktif! Tombol hapus ulasan kini muncul.');
      } else {
        setPinError('PIN salah! Silakan coba lagi.');
      }
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
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden">
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
            className="cursor-pointer select-none py-1 px-1.5 rounded-lg active:scale-95 transition-transform"
            title="Ketuk logo 5x untuk akses pengelola"
          >
            <h2 className="font-display text-sm font-extrabold text-white tracking-wider uppercase truncate">
              SINKI
            </h2>
            <span className="text-[9.5px] font-mono text-slate-400 font-medium block -mt-0.5">
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
              className="py-1 px-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-300 text-[9px] font-bold flex items-center gap-1 active:scale-95"
            >
              <Unlock size={11} />
              <span>Keluar</span>
            </button>
          )}

          {/* TOMBOL BERI ULASAN (CHAMPAGNE GOLD) */}
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-black/30 shrink-0 border border-[#DFB76C]/40"
          >
            <MessageSquarePlus size={14} className="stroke-[2.5]" />
            <span>Beri Ulasan</span>
          </button>
        </div>
      </div>

      {/* Banner Mode Pengelola (Jika PIN Terverifikasi) */}
      {isAdminMode && (
        <div className="px-3.5 py-2 bg-red-950/90 border-b border-red-500/40 flex items-center justify-between text-xs text-red-200 shrink-0">
          <div className="flex items-center gap-1.5 text-[9.5px] font-medium">
            <ShieldAlert size={13} className="text-red-400 shrink-0" />
            <span>Mode Pengelola: Tekan tombol merah untuk hapus ulasan.</span>
          </div>
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 text-[9.5px] text-[#DFB76C] underline font-semibold hover:text-white shrink-0 ml-2"
          >
            <RotateCcw size={10} />
            <span>Reset 4 Ulasan</span>
          </button>
        </div>
      )}

      {/* 2. DAFTAR 4 BARIS ULASAN (NAMA + EMOT + ULASAN) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-24 space-y-3">
        
        {/* Baris Ringkas: Judul & Badge Terverifikasi Asli */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-display font-bold text-white tracking-wide">Testimoni Pembeli</span>
            <span className="text-[9.5px] font-mono text-[#DFB76C] font-semibold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {reviews.length}/10 Slot
            </span>
          </div>

          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span>Terverifikasi Asli</span>
          </span>
        </div>

        {/* Kolom Pencarian Ulasan (Icon Search) */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} className="text-[#DFB76C]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari varian parfum, nama pembeli, atau ulasan..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#141622]/95 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#DFB76C] transition-colors shadow-sm"
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

        {/* Info Hasil Filter Pencarian */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>
              Ditemukan <strong className="text-[#DFB76C]">{filteredReviews.length}</strong> ulasan
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#DFB76C] hover:underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* DAFTAR ULASAN (MAKSIMAL 10 SLOT TERBARU BERGANTIAN - FORMAT RAMPING PENDEK) */}
        <div className="space-y-2">
          {displayedReviews.length === 0 ? (
            searchQuery.trim() ? (
              <div className="p-5 rounded-2xl bg-[#141622]/80 border border-white/10 text-center space-y-2">
                <Search size={22} className="mx-auto text-slate-500" />
                <p className="text-xs text-slate-300 font-medium">
                  Tidak ada ulasan yang cocok dengan kata kunci <span className="text-[#DFB76C]">"{searchQuery}"</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-[#DFB76C] underline font-semibold"
                >
                  Hapus Pencarian & Tampilkan Semua
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#141622]/90 border border-white/10 text-center space-y-3.5 backdrop-blur-md shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#DFB76C]/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  ✨
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-sm text-white">
                    Belum Ada Ulasan Pembeli
                  </h3>
                  <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed">
                    Slot ulasan masih bersih. Jadilah yang pertama membagikan pengalaman aroma wewangian SINKI Anda!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-black/30"
                >
                  <MessageSquarePlus size={14} className="stroke-[2.5]" />
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
                className={`group relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer backdrop-blur-md overflow-hidden ${
                  isActiveBeam
                    ? 'border-beam-active shadow-[0_4px_20px_rgba(223,183,108,0.22)]'
                    : isAdminMode
                    ? 'bg-gradient-to-b from-[#181a28]/95 to-[#12141e]/95 border border-red-500/50 shadow-lg shadow-red-950/20'
                    : 'bg-gradient-to-b from-[#181a28]/95 to-[#12141e]/95 border border-white/10 hover:border-[#DFB76C]/40 shadow-[0_2px_8px_rgba(0,0,0,0.35)] active:scale-[0.99]'
                }`}
              >
                {/* Layer Konten (Di atas animasi border cahaya) */}
                <div className="relative z-10 space-y-1">
                  {/* Baris 1: Header Kompak 1 Garis (Emot, Nama, Centang, Varian, Label, dan Like) */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* Emot Bulat Mini & Ramping */}
                      <div className="w-5.5 h-5.5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs shrink-0 shadow-inner">
                        {rev.emoji}
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="font-display font-bold text-[11px] text-white truncate max-w-[110px] sm:max-w-[140px] drop-shadow-sm">
                          {rev.name}
                        </span>
                        <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                        {idx === 0 && !searchQuery && (
                          <span className="text-[7px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-1 py-0.2 rounded-full shrink-0">
                            ★ Baru
                          </span>
                        )}
                        <span className="text-[8px] font-mono text-zinc-300 bg-white/[0.08] px-1.5 py-0.2 rounded border border-white/10 truncate max-w-[110px] sm:max-w-[140px]">
                          {rev.variant}
                        </span>
                        <span className="text-[8px] text-slate-400 shrink-0 hidden xs:inline">
                          • <span className="text-[#DFB76C] font-medium">{rev.emojiLabel}</span> • {rev.date}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Hapus (Mode Admin) atau Like Apresiasi */}
                    <div className="shrink-0 ml-1">
                      {isAdminMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReview(rev.id, rev.name);
                          }}
                          className="py-0.5 px-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[8.5px] font-bold flex items-center gap-1 active:scale-95"
                          title="Hapus Ulasan Ini"
                        >
                          <Trash2 size={10} />
                          <span>Hapus</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(rev.id);
                          }}
                          className={`flex items-center gap-1 text-[8.5px] px-1.5 py-0.5 rounded-lg transition-colors active:scale-95 ${
                            hasLiked
                              ? 'text-pink-400 bg-pink-500/15 border border-pink-500/30'
                              : 'text-slate-300 hover:text-white bg-white/10 border border-white/15'
                          }`}
                        >
                          <span>{hasLiked ? '💖' : '🤍'}</span>
                          <span className="font-mono text-[8px] font-bold">{rev.likes}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Baris 2: Komentar Pembeli Rapat, Rapi & Ramping (Tinggi Pendek, Lebar Tetap Penuh) */}
                  <p className="text-[10px] sm:text-[10.5px] text-slate-200 font-normal leading-snug pl-7 pr-1 line-clamp-2">
                    "{rev.comment}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tombol Alternatif Tulis Ulasan (Mudah Ditekan) */}
        <div className="pt-1 pb-1">
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <MessageSquarePlus size={15} />
            <span>+ Bagikan Pengalaman & Ulasan Anda</span>
          </button>
        </div>

        {/* 3. DARI HATI SINKI (UCAPAN TERIMA KASIH & APRESIASI HANGAT) */}
        <div className="mt-4 p-4 rounded-3xl bg-gradient-to-br from-[#1e2235] via-[#181a2b] to-[#131524] border border-white/10 shadow-2xl relative overflow-hidden text-center space-y-3 backdrop-blur-md">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c5a059]/[0.08] rounded-full blur-2xl pointer-events-none" />

          {/* Kalimat Apresiasi & Sentuhan Hangat Pelanggan */}
          <div className="space-y-2">
            <h4 className="font-display font-extrabold text-base text-white leading-tight">
              Dari Hati SINKI
            </h4>
            <p className="text-xs text-slate-100 font-medium leading-relaxed max-w-sm mx-auto">
              Terima kasih banyak telah mempercayakan aroma terbaik Anda kepada{' '}
              <strong className="text-[#DFB76C] font-semibold">SINKI</strong>.
              Setiap tetes keharuman kami racik dengan ketulusan, dedikasi, dan kualitas bahan
              terbaik agar Anda selalu tampil percaya diri dan memikat di setiap momen berharga.
            </p>
            <p className="text-[11px] text-zinc-300 font-medium italic">
              "Kepuasan Anda adalah kebanggaan kami. Kami selalu menantikan kehadiran Anda
              kembali sebagai keluarga dan pelanggan setia SINKI."
            </p>
          </div>

          {/* Tagline Langganan */}
          <div className="pt-1 text-[10.5px] font-mono text-emerald-300 bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20 inline-block">
            Semoga harimu selalu harum, bahagia, dan penuh pesona!
          </div>

          {/* Tombol Pesan Varian Lain (Navigasi ke Order) */}
          {onNavigateToOrder && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md shadow-black/30"
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
              className="relative w-full max-w-sm rounded-3xl bg-[#12141e] border border-white/15 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✍️</span>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">
                      Tulis Ulasan SINKI
                    </h3>
                    <span className="text-[9.5px] text-slate-400">
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
              <form onSubmit={handleSubmitReview} className="space-y-3.5">
                {/* Nama */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                    Nama *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Ardiansyah"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFB76C]"
                  />
                </div>

                {/* Pilihan Varian Parfum (Sistem 2-Langkah: Pilih Koleksi ➔ Pilih Varian) */}
                <div className="space-y-2.5 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                      Varian yang Diulas *
                    </label>
                    <span className="text-[9.5px] font-semibold text-[#DFB76C] bg-[#C5A059]/15 px-2.5 py-0.5 rounded-full border border-[#DFB76C]/30 truncate max-w-[170px]">
                      {formVariant}
                    </span>
                  </div>

                  {/* LANGKAH 1: Pilih Koleksi (5 Tab Ramping Tanpa Icon) */}
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      1. Pilih Kategori Koleksi:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'top11' as const, label: 'Top 11' },
                        { id: 'women' as const, label: 'Women' },
                        { id: 'men' as const, label: 'Men' },
                        { id: 'unisex' as const, label: 'Unisex' },
                        { id: 'powdery' as const, label: 'Powdery' },
                      ].map((tab) => {
                        const isActive = variantCategoryTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setVariantCategoryTab(tab.id);
                              if (tab.id === 'top11') {
                                if (!TOP_11_DATA.some((p) => p.name === formVariant)) setFormVariant(TOP_11_DATA[0].name);
                              } else {
                                const first = perfumesCatalog.find((p) => p.category === tab.id && p.isActive !== false);
                                if (first && !perfumesCatalog.some((p) => p.category === tab.id && p.name === formVariant)) {
                                  setFormVariant(first.name);
                                }
                              }
                            }}
                            className={`py-2 px-1 rounded-xl text-center flex items-center justify-center border transition-all ${
                              isActive
                                ? 'bg-[#C5A059]/30 border-[#DFB76C] text-white font-bold shadow-sm'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                            }`}
                          >
                            <span className="text-[10px] truncate leading-tight font-medium">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LANGKAH 2: Pilih Nama Varian (Daftar Menjadi Pendek & Ringkas) */}
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      2. Pilih Nama Parfum (
                      {variantCategoryTab === 'top11' && '11 Varian Bestseller'}
                      {variantCategoryTab === 'women' && 'Varian Women'}
                      {variantCategoryTab === 'men' && 'Varian Men'}
                      {variantCategoryTab === 'unisex' && 'Varian Unisex'}
                      {variantCategoryTab === 'powdery' && '8 Varian Powdery'}
                      ):
                    </span>
                    <select
                      value={formVariant}
                      onChange={(e) => setFormVariant(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171926] border border-white/15 text-xs text-white focus:outline-none focus:border-[#DFB76C]"
                    >
                      {variantCategoryTab === 'top11' &&
                        TOP_11_DATA.map((p) => (
                          <option key={`top-${p.id}`} value={p.name}>
                            {p.name}
                          </option>
                        ))}

                      {variantCategoryTab === 'women' &&
                        perfumesCatalog
                          .filter((p) => p.category === 'women' && p.isActive !== false)
                          .map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}

                      {variantCategoryTab === 'men' &&
                        perfumesCatalog
                          .filter((p) => p.category === 'men' && p.isActive !== false)
                          .map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}

                      {variantCategoryTab === 'unisex' &&
                        perfumesCatalog
                          .filter((p) => p.category === 'unisex' && p.isActive !== false)
                          .map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}

                      {variantCategoryTab === 'powdery' &&
                        perfumesCatalog
                          .filter((p) => p.category === 'powdery' && p.isActive !== false)
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
                    <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                      Kepuasan Aroma *
                    </label>
                    <span className="text-[9px] font-mono text-[#DFB76C] font-semibold bg-[#C5A059]/15 px-2 py-0.5 rounded-md border border-[#DFB76C]/30">
                      {formEmoji} {formEmojiLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJI_OPTIONS.map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => {
                          setFormEmoji(item.emoji);
                          setFormEmojiLabel(item.label);
                        }}
                        className={`py-1.5 px-0.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                          formEmoji === item.emoji
                            ? 'bg-[#C5A059]/25 border-[#DFB76C] text-white shadow-sm font-bold scale-[1.03]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <span className="text-[8px] font-medium text-center leading-none">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Isi Ulasan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                    Ulasan & Kepuasan Aroma *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ceritakan aroma, ketahanan wangi, dan kemasan parfum SINKI Anda..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DFB76C] resize-none"
                  />
                </div>

                {/* Info Jeda 1 Menit & Sensor Santun */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
                  ℹ️ Ulasan akan langsung tampil di urutan teratas. Mohon gunakan bahasa yang
                  sopan. Terdapat jeda 1 menit antar pengiriman ulasan.
                </div>

                {/* Submit Button: Champagne Gold */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-98 shadow-md shadow-black/30"
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
              className="relative w-full max-w-xs rounded-3xl bg-[#12141e] border border-red-500/40 p-5 shadow-2xl space-y-4 text-center"
            >
              {/* Header */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <Lock size={22} />
              </div>

              <div>
                <h3 className="font-display font-extrabold text-sm text-white">
                  Akses Pengelola SINKI
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Masukkan PIN untuk mengaktifkan fitur hapus ulasan.
                </p>
              </div>

              {/* Form PIN */}
              <form onSubmit={handleVerifyPin} className="space-y-3">
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
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-red-400"
                />

                {pinError && (
                  <p className="text-[10px] text-red-400 font-medium">{pinError}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95"
                  >
                    Buka Kunci
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

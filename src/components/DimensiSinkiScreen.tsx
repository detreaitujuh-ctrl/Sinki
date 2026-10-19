import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Bell,
  Crown,
  Upload,
  ArrowRight,
  Trash2,
  Check,
  Save,
  RotateCcw,
  Eye,
  LogOut,
  Sliders,
  DollarSign,
  ShieldCheck,
  Lock,
  ExternalLink,
  Search,
  Plus,
  Edit,
  EyeOff,
  Package,
  X,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import {
  saveAssetToServer,
  saveQrisToServer,
  saveTop11PhotoToServer,
  verifyOwnerPinOnServer,
} from '../utils/assetStorage';
import { CardFittingModal } from './CardFittingModal';
import {
  ArticleItem,
  getStoredArticles,
  saveArticlesToStorage,
  INITIAL_ARTICLES,
} from '../utils/articleStorage';
import { PricingConfig, DEFAULT_PRICING, savePricingToServer } from '../utils/pricingStorage';
import { TOP_11_DATA } from '../data/top11';
import {
  ReviewItem,
  getCachedReviews,
  deleteReviewFromSupabase,
  resetReviewsToDefaultInSupabase,
} from '../utils/reviewStorage';
import {
  TickerConfig,
  TickerFont,
  TICKER_FONTS,
  DEFAULT_TICKER,
  getStoredTicker,
  saveTickerToServer,
  resetTickerToDefault,
} from '../utils/tickerStorage';
import { PerfumeCategory, PerfumeItem } from '../data/perfumes';
import {
  getStoredPerfumes,
  savePerfumesToServer,
  resetPerfumesToDefault,
} from '../utils/perfumeStorage';

interface DimensiSinkiScreenProps {
  onExitToPublic: () => void;
  onShowToast: (msg: string) => void;
  currentLogo: string | null;
  currentChibi: string | null;
  currentQris: string | null;
  top11Photos: Record<string, string>;
  pricing?: PricingConfig;
  tickerConfig?: TickerConfig;
  perfumes?: PerfumeItem[];
  onAssetsUpdated: (newLogo: string | null, newChibi: string | null) => void;
  onQrisUpdated: (newQris: string | null) => void;
  onTop11PhotoUpdated: (variantId: string, newPhoto: string) => void;
  onPricingUpdated: (newPricing: PricingConfig) => void;
  onTickerUpdated?: (newTicker: TickerConfig) => void;
  onPerfumesUpdated?: (newList: PerfumeItem[]) => void;
}

type MenuKey =
  | 'dashboard'
  | 'variants'
  | 'media'
  | 'banner'
  | 'content'
  | 'reviews'
  | 'settings';

export const DimensiSinkiScreen: React.FC<DimensiSinkiScreenProps> = ({
  onExitToPublic,
  onShowToast,
  currentLogo,
  currentChibi,
  currentQris,
  top11Photos,
  pricing,
  tickerConfig,
  perfumes,
  onAssetsUpdated,
  onQrisUpdated,
  onTop11PhotoUpdated,
  onPricingUpdated,
  onTickerUpdated,
  onPerfumesUpdated,
}) => {
  // Authentication Barrier state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  // Sidebar toggle state (for mobile drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');

  // Interactive Image Adjuster State (Zoom In / Zoom Out / Pan / Crop)
  const [adjusterState, setAdjusterState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    target: 'hero' | 'logo' | 'qris' | string;
    title: string;
    targetType: 'logo' | 'hero' | 'qris' | 'bottle';
  }>({
    isOpen: false,
    imageSrc: '',
    target: '',
    title: '',
    targetType: 'bottle',
  });

  // Ticker (Running Text) State & Handlers
  const [tickerForm, setTickerForm] = useState<TickerConfig>(() => tickerConfig || getStoredTicker());
  const [isSavingTicker, setIsSavingTicker] = useState(false);

  useEffect(() => {
    if (tickerConfig) {
      setTickerForm(tickerConfig);
    }
  }, [tickerConfig]);

  const handleSaveTicker = async () => {
    if (!tickerForm.text.trim()) {
      onShowToast('Teks berjalan tidak boleh kosong!');
      return;
    }
    try {
      setIsSavingTicker(true);
      onShowToast('Menyimpan teks berjalan dan font pilihan...');
      const saved = await saveTickerToServer(tickerForm);
      setTickerForm(saved);
      onTickerUpdated?.(saved);
      onShowToast('Teks berjalan & font Beranda berhasil diperbarui! ✅');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan teks berjalan.');
    } finally {
      setIsSavingTicker(false);
    }
  };

  const handleResetTicker = async () => {
    if (confirm('Kembalikan teks berjalan dan font ke pengaturan bawaan (default)?')) {
      try {
        setIsSavingTicker(true);
        const def = await resetTickerToDefault();
        setTickerForm(def);
        onTickerUpdated?.(def);
        onShowToast('Teks berjalan dikembalikan ke default!');
      } catch (err) {
        console.error(err);
      } finally {
        setIsSavingTicker(false);
      }
    }
  };

  // Perfumes Catalog State & Handlers
  const [perfumesList, setPerfumesList] = useState<PerfumeItem[]>(() => perfumes || getStoredPerfumes());
  const [perfumeSearchQuery, setPerfumeSearchQuery] = useState('');
  const [perfumeCategoryFilter, setPerfumeCategoryFilter] = useState<PerfumeCategory>('women');
  const [isAddingPerfume, setIsAddingPerfume] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<PerfumeItem | null>(null);
  const [newPerfumeForm, setNewPerfumeForm] = useState<{
    name: string;
    category: PerfumeCategory;
    tagline: string;
    accordsStr: string;
  }>({
    name: '',
    category: 'unisex',
    tagline: '',
    accordsStr: 'Warm, Floral, Woody',
  });

  useEffect(() => {
    if (perfumes) {
      setPerfumesList(perfumes);
    }
  }, [perfumes]);

  const handleTogglePerfumeStatus = async (id: string) => {
    const target = perfumesList.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.isActive === false ? true : false;
    const updated = perfumesList.map((p) => (p.id === id ? { ...p, isActive: nextStatus } : p));
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    onShowToast(
      nextStatus
        ? `"${target.name}" diaktifkan di katalog publik`
        : `"${target.name}" disembunyikan (stok habis)`
    );
    await savePerfumesToServer(updated);
  };

  const handleSaveEditPerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerfume || !editingPerfume.name.trim()) return;
    const catLabels: Record<PerfumeCategory, string> = {
      women: 'Women',
      men: 'Men',
      powdery: 'Powdery',
      unisex: 'Unisex',
    };
    const updatedItem: PerfumeItem = {
      ...editingPerfume,
      name: editingPerfume.name.trim(),
      categoryLabel: catLabels[editingPerfume.category] || 'Unisex',
    };
    const updated = perfumesList.map((p) => (p.id === updatedItem.id ? updatedItem : p));
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    setEditingPerfume(null);
    onShowToast(`Varian "${updatedItem.name}" berhasil diperbarui!`);
    await savePerfumesToServer(updated);
  };

  const handleAddNewPerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerfumeForm.name.trim()) {
      onShowToast('Nama varian tidak boleh kosong!');
      return;
    }
    const catLabels: Record<PerfumeCategory, string> = {
      women: 'Women',
      men: 'Men',
      powdery: 'Powdery',
      unisex: 'Unisex',
    };
    const accords = newPerfumeForm.accordsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const newItem: PerfumeItem = {
      id: `p-${Date.now()}`,
      name: newPerfumeForm.name.trim(),
      category: newPerfumeForm.category,
      categoryLabel: catLabels[newPerfumeForm.category] || 'Unisex',
      tagline: newPerfumeForm.tagline.trim() || 'Aroma Mewah Khas SINKI',
      accords: accords.length > 0 ? accords : ['Luxury', 'Signature'],
      isActive: true,
    };
    const updated = [newItem, ...perfumesList];
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    setIsAddingPerfume(false);
    setNewPerfumeForm({
      name: '',
      category: 'unisex',
      tagline: '',
      accordsStr: 'Warm, Floral, Woody',
    });
    onShowToast(`Varian baru "${newItem.name}" berhasil ditambahkan!`);
    await savePerfumesToServer(updated);
  };

  const handleDeletePerfume = async (id: string, name: string) => {
    if (confirm(`Hapus permanen varian "${name}" dari katalog?`)) {
      const updated = perfumesList.filter((p) => p.id !== id);
      setPerfumesList(updated);
      onPerfumesUpdated?.(updated);
      onShowToast(`Varian "${name}" berhasil dihapus.`);
      await savePerfumesToServer(updated);
    }
  };

  const handleResetPerfumes = async () => {
    if (confirm('Kembalikan seluruh varian ke 60 varian bawaan asli SINKI?')) {
      try {
        const def = await resetPerfumesToDefault();
        setPerfumesList(def);
        onPerfumesUpdated?.(def);
        onShowToast('Katalog berhasil di-reset ke 60 varian bawaan!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Real-time Pricing State
  const [pricingForm, setPricingForm] = useState<PricingConfig>(pricing || DEFAULT_PRICING);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Reviews State
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(getCachedReviews);
  const [articlesList, setArticlesList] = useState<ArticleItem[]>(() => getStoredArticles());
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'tips' | 'men' | 'women' | 'promo' | 'story'>('tips');
  const [newContent, setNewContent] = useState('');

  const handleAddArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      onShowToast('Judul dan isi konten tidak boleh kosong!');
      return;
    }
    const catLabels: Record<string, string> = {
      tips: 'Tips Perawatan',
      men: 'Panduan Pria',
      women: 'Panduan Wanita',
      promo: 'Info & Promo',
      story: 'Edukasi Aroma',
    };
    const newArt: ArticleItem = {
      id: 'art-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      categoryLabel: catLabels[newCategory] || 'Tips Aroma',
      readTime: '2 mnt baca',
      content: newContent.trim(),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      author: 'SINKI Perfumer',
    };
    const updated = [newArt, ...articlesList];
    setArticlesList(updated);
    saveArticlesToStorage(updated);
    setIsAddingArticle(false);
    setNewTitle('');
    setNewContent('');
    onShowToast('Konten baru berhasil diterbitkan ke website!');
  };

  const handleDeleteArticle = (id: string, title: string) => {
    if (confirm(`Hapus konten "${title}"?`)) {
      const updated = articlesList.filter((a) => a.id !== id);
      setArticlesList(updated);
      saveArticlesToStorage(updated);
      onShowToast(`Konten "${title}" berhasil dihapus.`);
    }
  };

  // PIN validation handler with server security
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await verifyOwnerPinOnServer(enteredPin.trim());
      if (res.success) {
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
      } else {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        setPinError(res.error || 'PIN Rahasia salah!');
        setEnteredPin('');
        if (nextAttempt >= 3) {
          onShowToast('Akses ditolak! Mengalihkan ke halaman publik...');
          onExitToPublic();
        }
      }
    } catch {
      if (enteredPin.trim() === '1995') {
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
      } else {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        setPinError('PIN Rahasia salah!');
        setEnteredPin('');
        if (nextAttempt >= 3) {
          onShowToast('Akses ditolak! Mengalihkan ke halaman publik...');
          onExitToPublic();
        }
      }
    }
  };

  // Image Upload handler: Opens CardFittingModal with Zoom / Pan controls
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'hero' | 'logo' | 'qris' | string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Harap pilih file gambar (JPG/PNG)!');
      return;
    }

    const titles: Record<string, string> = {
      hero: 'Atur Posisi & Zoom Foto Utama Beranda',
      logo: 'Atur Posisi & Zoom Logo SINKI',
      qris: 'Atur Posisi & Zoom Barcode QRIS',
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const targetType = (target === 'hero' ? 'hero' : target === 'logo' ? 'logo' : target === 'qris' ? 'qris' : 'bottle') as 'logo' | 'hero' | 'qris' | 'bottle';
      setAdjusterState({
        isOpen: true,
        imageSrc: rawBase64,
        target,
        title: titles[target] || `Pas-kan Foto Botol #${target}`,
        targetType,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAdjusterConfirm = async (adjustedBase64: string) => {
    const { target } = adjusterState;
    setAdjusterState((prev) => ({ ...prev, isOpen: false }));
    try {
      if (target === 'hero') {
        onShowToast('Menyimpan foto utama beranda ke server...');
        await saveAssetToServer('chibi', adjustedBase64, '1995');
        onAssetsUpdated(currentLogo, adjustedBase64);
        onShowToast('Foto Utama Beranda berhasil disimpan permanen! ✅');
      } else if (target === 'logo') {
        onShowToast('Menyimpan logo resmi ke server...');
        await saveAssetToServer('logo', adjustedBase64, '1995');
        onAssetsUpdated(adjustedBase64, currentChibi);
        onShowToast('Logo SINKI berhasil disimpan permanen! ✅');
      } else if (target === 'qris') {
        onShowToast('Menyimpan barcode QRIS ke server...');
        await saveQrisToServer(adjustedBase64, '1995');
        onQrisUpdated(adjustedBase64);
        onShowToast('Barcode QRIS berhasil disimpan permanen! ✅');
      } else if (target) {
        onShowToast(`Menyimpan foto botol #${target} ke server...`);
        await saveTop11PhotoToServer(target, adjustedBase64, '1995');
        onTop11PhotoUpdated(target, adjustedBase64);
        onShowToast(`Foto botol #${target} berhasil disimpan permanen! ✅`);
      }
    } catch (err) {
      console.error('Error saving asset:', err);
      onShowToast('Terjadi kesalahan saat menyimpan foto.');
    }
  };

  const handleSavePricing = () => {
    setIsSavingPricing(true);
    savePricingToServer(pricingForm);
    onPricingUpdated(pricingForm);
    setTimeout(() => {
      setIsSavingPricing(false);
      onShowToast('Daftar harga berhasil disimpan permanen! ✅');
    }, 400);
  };

  const handleDeleteReview = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus ulasan dari "${name}"?`)) {
      const res = await deleteReviewFromSupabase(id);
      setReviewsList(res.reviews);
      onShowToast(`Ulasan "${name}" berhasil dihapus.`);
    }
  };

  const handleResetReviews = async () => {
    if (confirm('Kembalikan semua ulasan ke 4 ulasan bawaan asli?')) {
      const res = await resetReviewsToDefaultInSupabase();
      setReviewsList(res);
      onShowToast('Ulasan berhasil direset ke setelan awal.');
    }
  };

  // ========================================================
  // LATAR BELAKANG ELEGAN HAUTE PARFUMERIE (TERLIHAT, MEWAH & TIDAK MENGGANGGU)
  // ========================================================
  const AdminLuxuryBackground: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#131726_0%,#0c0e18_45%,#06070b_100%)]">
      {/* 1. Ambient Golden Blooms - Warm Champagne Highlights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-b from-amber-400/[0.14] via-amber-500/[0.05] to-transparent rounded-full blur-[100px]" />
      <div className="absolute top-1/4 -right-20 w-[550px] h-[550px] bg-amber-400/[0.08] rounded-full blur-[130px]" />
      <div className="absolute -bottom-24 -left-20 w-[600px] h-[600px] bg-gradient-to-tr from-amber-700/[0.08] via-amber-600/[0.04] to-transparent rounded-full blur-[130px]" />

      {/* 2. Haute Parfumerie Gold Hairline Drafting Grid with Soft Vignette Mask */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(217,170,75,0.065)_1px,transparent_1px),linear-gradient(to_bottom,rgba(217,170,75,0.065)_1px,transparent_1px)] bg-[size:44px_44px]"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 35%, black 40%, rgba(0,0,0,0.45) 75%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 35%, black 40%, rgba(0,0,0,0.45) 75%, transparent 100%)',
        }}
      />

      {/* 3. Watermark Geometris Flacon Parfumerie (Terlihat Jelas tapi Halus di Belakang Konten) */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] max-w-none text-amber-400/[0.075] pointer-events-none select-none"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Faceted octagonal cut */}
        <polygon
          points="150,50 350,50 450,150 450,350 350,450 150,450 50,350 50,150"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="8 6"
        />
        {/* Concentric diamond facets */}
        <polygon
          points="250,70 430,250 250,430 70,250"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="250,110 390,250 250,390 110,250"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="4 4"
        />
        {/* Concentric circles */}
        <circle cx="250" cy="250" r="170" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.8" />
        <circle cx="250" cy="250" r="95" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="250" cy="250" r="35" stroke="currentColor" strokeWidth="0.8" />
        {/* Center Starburst Emblem */}
        <path
          d="M250 160 L258 242 L340 250 L258 258 L250 340 L242 258 L160 250 L242 242 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <path
          d="M250 195 L288 212 L305 250 L288 288 L250 305 L212 288 L195 250 L212 212 Z"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 3"
        />
        {/* Precision drafting crosshairs */}
        <line x1="250" y1="20" x2="250" y2="480" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 8" opacity="0.6" />
        <line x1="20" y1="250" x2="480" y2="250" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 8" opacity="0.6" />
      </svg>

      {/* 4. Fine Atelier Corner Marks */}
      <div className="absolute top-4 left-6 flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-amber-400/20 uppercase">
        <span>+</span>
        <span className="hidden sm:inline">HAUTE PARFUMERIE SINKI</span>
      </div>
      <div className="absolute top-4 right-6 flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-amber-400/20 uppercase">
        <span className="hidden sm:inline">ATELIER PRIVÉ</span>
        <span>+</span>
      </div>
      <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-amber-400/20 uppercase">
        <span>+</span>
        <span className="hidden sm:inline">CONTROL SECURE</span>
      </div>
      <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-amber-400/20 uppercase">
        <span className="hidden sm:inline">EST. 1995</span>
        <span>+</span>
      </div>
    </div>
  );

  // ========================================================
  // 1. GERBANG KUNCI PIN OTENTIKASI (SIMPEL, ELEGAN & PROFESIONAL)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#08090e] flex flex-col items-center justify-center p-4 text-slate-100 select-none overflow-hidden">
        <AdminLuxuryBackground />

        <div className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0f1118]/95 backdrop-blur-xl border border-amber-500/35 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center space-y-5">
          {/* Sinki Lock Emblem */}
          <div className="relative mx-auto w-14 h-14 rounded-2xl bg-black/60 border border-amber-500/40 p-3 flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,186,73,0.4)]" />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-amber-400/90 uppercase font-semibold block mb-1">
              HAUTE PARFUMERIE CONTROL
            </span>
            <h1 className="font-display text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5C2] via-[#E8B960] to-[#B3791B]">
              DIMENSI-SINKI
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Gerbang Khusus Pengendali Utama SINKI
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Masukkan PIN Rahasia"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                setPinError('');
              }}
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-black/50 border border-amber-500/30 text-center font-mono text-xl tracking-[0.4em] text-amber-200 focus:outline-none focus:border-amber-400 placeholder:tracking-normal placeholder:text-slate-500 placeholder:text-xs transition-colors"
            />

            {pinError && (
              <p className="text-xs text-red-400 font-semibold animate-pulse">
                {pinError} ({3 - attemptCount} kesempatan tersisa)
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-950/40"
            >
              Buka Dimensi Sinki
            </button>
          </form>

          <button
            onClick={onExitToPublic}
            className="text-[11px] text-slate-400 hover:text-amber-300 font-medium tracking-wide transition-colors"
          >
            ← Kembali ke Website Publik
          </button>
        </div>
      </div>
    );
  }

  // Label Menu Dinamis untuk Header Breadcrumb
  const menuLabels: Record<MenuKey, string> = {
    dashboard: 'Dashboard Ringkasan',
    variants: `Katalog Varian (${perfumesList.length})`,
    media: 'Media, Hero & 11 Botol Bestseller',
    banner: 'Teks Berjalan & Daftar Harga',
    content: `Konten & Edukasi (${articlesList.length})`,
    reviews: `Ulasan Pembeli (${reviewsList.length})`,
    settings: 'Pengaturan & Keamanan',
  };

  interface NavItemDef {
    id: MenuKey;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }

  // Nav Items Definitions
  const navItems: NavItemDef[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'variants', label: 'Katalog Varian', badge: perfumesList.length.toString(), icon: Package },
    { id: 'media', label: 'Media & Galeri', badge: '14', icon: ImageIcon },
    { id: 'banner', label: 'Teks & Harga', icon: Sliders },
    { id: 'content', label: 'Konten Website', badge: articlesList.length.toString(), icon: FileText },
    { id: 'reviews', label: 'Ulasan Masuk', badge: reviewsList.length.toString(), icon: MessageSquare },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  // ========================================================
  // 2. TAMPILAN DASHBOARD PROFESIONAL: ADAPTIVE DESKTOP + MOBILE
  // ========================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#08090e] text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans select-none">
      {/* Latar Belakang Elegan Haute Parfumerie (Terlihat, Mewah & Tidak Mengganggu) */}
      <AdminLuxuryBackground />

      {/* OVERLAY BACKDROP DI MOBILE JIKA DRAWER TERBUKA */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* ========================================================
          SIDEBAR KIRI (DESKTOP: Pinned Permanen; MOBILE: Slide Drawer)
         ======================================================== */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 lg:w-64 xl:w-72 bg-[#0d0f17] border-r border-white/10 flex flex-col justify-between p-4 sm:p-5 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Top Brand Block */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-500/35 p-1.5 flex items-center justify-center shadow-md">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Sparkles size={20} className="text-amber-400" />
                )}
              </div>
              <div>
                <span className="font-display text-sm font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5C2] via-[#E8B960] to-[#B3791B] block">
                  DIMENSI-SINKI
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block -mt-0.5">
                  Portal Kendali Owner
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2 font-mono">
              Menu Utama
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id as MenuKey);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-98 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-amber-500/25 text-amber-200'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Status & Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                Sistem Terhubung
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-slate-400">v1.2.0</span>
          </div>

          <button
            onClick={onExitToPublic}
            className="w-full py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogOut size={13} />
            <span>Kunci & Keluar</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          AREA KONTEN UTAMA (Widescreen di Desktop, Responsive di Mobile)
         ======================================================== */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
        {/* TOP BAR HEADER */}
        <header className="sticky top-0 z-30 bg-[#0d0f17]/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile only) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 active:scale-95 transition-all shrink-0"
              title="Buka Menu"
            >
              <ChevronRight size={16} />
            </button>

            {/* Breadcrumb Display */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-display font-bold text-amber-400">DIMENSI-SINKI</span>
                <span>/</span>
                <span className="text-slate-200 font-medium truncate">{menuLabels[activeMenu]}</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Web Preview Shortcut */}
            <button
              onClick={onExitToPublic}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95"
              title="Buka Website Publik"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Lihat Web Publik</span>
            </button>

            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-300 shadow-inner">
              <Bell size={15} />
            </div>
          </div>
        </header>

        {/* CONTAINER ISI KONTEN (Widescreen di Laptop: max-w-7xl, fluid p-6) */}
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-12">
          
          {/* ========================================================
              TAB 1: DASHBOARD UTAMA
             ======================================================== */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#121422] to-[#16192a] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
                      PORTAL PENGELOLA
                    </span>
                    <Crown size={15} className="text-amber-400" />
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                    Selamat Datang, Owner
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Kelola stok katalog, foto media, teks berjalan, ulasan, dan harga secara real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-2.5 rounded-2xl shrink-0 self-start sm:self-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">
                      {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Status Server: Normal</span>
                  </div>
                </div>
              </div>

              {/* 4 GRID KARTU METRIK STATISTIK (DESKTOP: 4 KOLOM, MOBILE: 2 KOLOM) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                <div
                  onClick={() => setActiveMenu('content')}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-98 shadow-lg group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
                    <FileText size={20} className="text-amber-400" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Konten Aktif</span>
                    <span className="text-2xl font-display font-extrabold text-white">{articlesList.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Artikel & tips wewangian</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('media')}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-98 shadow-lg group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
                    <ImageIcon size={20} className="text-amber-400" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Media & Galeri</span>
                    <span className="text-2xl font-display font-extrabold text-white">14</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Hero, Logo, QRIS & 11 Botol</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('banner')}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-98 shadow-lg group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
                    <Sliders size={20} className="text-amber-400" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Tier Harga</span>
                    <span className="text-2xl font-display font-extrabold text-white">3</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Classic, Premium, Mykonos</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('reviews')}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all active:scale-98 shadow-lg group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
                    <MessageSquare size={20} className="text-amber-400" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Ulasan Masuk</span>
                    <span className="text-2xl font-display font-extrabold text-white">{reviewsList.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Ulasan pembeli terverifikasi</span>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS (DESKTOP: 3 KOLOM) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Pintasan Manajemen Cepat
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div
                    onClick={() => setActiveMenu('variants')}
                    className="p-4 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                        <Package size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Kelola Varian ({perfumesList.length})
                        </span>
                        <span className="text-[10.5px] text-slate-400 block">
                          Atur stok aktif & edit aroma
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-amber-400" />
                  </div>

                  <div
                    onClick={() => setActiveMenu('media')}
                    className="p-4 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                        <Upload size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Ganti Foto & Media</span>
                        <span className="text-[10.5px] text-slate-400 block">
                          Upload foto botol utama & 11 botol
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-amber-400" />
                  </div>

                  <div
                    onClick={() => setActiveMenu('banner')}
                    className="p-4 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                        <Sliders size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Teks Berjalan & Harga</span>
                        <span className="text-[10.5px] text-slate-400 block">
                          Ubah running text & tarif botol
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-amber-400" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              TAB 2: KATALOG VARIAN PARFUM
             ======================================================== */}
          {activeMenu === 'variants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-amber-300">
                    Katalog Varian ({perfumesList.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Kelola ketersediaan stok, ubah deskripsi aroma, atau tambahkan varian baru.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingPerfume(true)}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-105 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Plus size={15} />
                    <span>Tambah Varian Baru</span>
                  </button>
                  <button
                    onClick={handleResetPerfumes}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 flex items-center gap-1 transition-colors"
                    title="Reset ke 60 Varian Bawaan"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">Reset Default</span>
                  </button>
                </div>
              </div>

              {/* Filter & Live Search Toolbar */}
              <div className="p-4 rounded-2xl bg-[#0e111d] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={perfumeSearchQuery}
                      onChange={(e) => setPerfumeSearchQuery(e.target.value)}
                      placeholder="Cari varian (cth: Dior, Scandal, Oud, Vanilla)..."
                      className="w-full py-2.5 pl-10 pr-8 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                    />
                    {perfumeSearchQuery && (
                      <button
                        onClick={() => setPerfumeSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {(['women', 'men', 'powdery', 'unisex'] as const).map((cat) => {
                      const isSelected = perfumeCategoryFilter === cat;
                      const count = perfumesList.filter((p) => p.category === cat).length;
                      const labels: Record<PerfumeCategory, string> = {
                        women: 'Women',
                        men: 'Men',
                        powdery: 'Powdery',
                        unisex: 'Unisex',
                      };
                      return (
                        <button
                          key={cat}
                          onClick={() => setPerfumeCategoryFilter(cat)}
                          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
                          }`}
                        >
                          {labels[cat]} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* GRID VARIAN (DESKTOP: 3 KOLOM, MOBILE: 1 KOLOM) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {perfumesList
                  .filter((item) => {
                    const matchCategory = perfumeSearchQuery ? true : item.category === perfumeCategoryFilter;
                    const matchSearch =
                      item.name.toLowerCase().includes(perfumeSearchQuery.toLowerCase()) ||
                      item.tagline.toLowerCase().includes(perfumeSearchQuery.toLowerCase()) ||
                      item.accords.some((a) => a.toLowerCase().includes(perfumeSearchQuery.toLowerCase()));
                    return matchCategory && matchSearch;
                  })
                  .map((item) => {
                    const isItemActive = item.isActive !== false;
                    const catColors: Record<PerfumeCategory, string> = {
                      women: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
                      men: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                      powdery: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      unisex: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isItemActive
                            ? 'bg-[#0f111a] border-white/10 hover:border-amber-500/30'
                            : 'bg-[#0d0e14] border-rose-500/20 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-bold uppercase ${
                                  catColors[item.category] || catColors.unisex
                                }`}
                              >
                                {item.categoryLabel}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                                  isItemActive
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                {isItemActive ? 'Aktif di Web' : 'Stok Habis'}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-sm text-white mt-1.5">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.tagline}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleTogglePerfumeStatus(item.id)}
                              className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                                isItemActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                              title={isItemActive ? 'Sembunyikan dari Publik' : 'Tampilkan di Publik'}
                            >
                              {isItemActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => setEditingPerfume(item)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                              title="Edit Varian"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePerfume(item.id, item.name)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10"
                              title="Hapus Varian"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Accords tags */}
                        <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-white/5">
                          {item.accords.map((a, i) => (
                            <span
                              key={i}
                              className="text-[9.5px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-md"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* MODAL EDIT VARIAN */}
              {editingPerfume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="w-full max-w-md rounded-3xl bg-[#0f1118] border border-white/15 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="font-display font-bold text-sm text-white">Edit Varian Parfum</h3>
                      <button
                        onClick={() => setEditingPerfume(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditPerfume} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Nama Varian
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPerfume.name}
                          onChange={(e) =>
                            setEditingPerfume({ ...editingPerfume, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Kategori
                        </label>
                        <select
                          value={editingPerfume.category}
                          onChange={(e) =>
                            setEditingPerfume({
                              ...editingPerfume,
                              category: e.target.value as PerfumeCategory,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="unisex">Unisex</option>
                          <option value="men">Men</option>
                          <option value="women">Women</option>
                          <option value="powdery">Powdery</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Tagline / Karakter
                        </label>
                        <input
                          type="text"
                          value={editingPerfume.tagline}
                          onChange={(e) =>
                            setEditingPerfume({ ...editingPerfume, tagline: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPerfume(null)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL TAMBAH VARIAN BARU */}
              {isAddingPerfume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="w-full max-w-md rounded-3xl bg-[#0f1118] border border-white/15 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="font-display font-bold text-sm text-white">Tambah Varian Baru</h3>
                      <button
                        onClick={() => setIsAddingPerfume(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleAddNewPerfume} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Nama Parfum *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Mykonos Slow Dance"
                          value={newPerfumeForm.name}
                          onChange={(e) =>
                            setNewPerfumeForm({ ...newPerfumeForm, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Kategori
                        </label>
                        <select
                          value={newPerfumeForm.category}
                          onChange={(e) =>
                            setNewPerfumeForm({
                              ...newPerfumeForm,
                              category: e.target.value as PerfumeCategory,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="unisex">Unisex</option>
                          <option value="men">Men</option>
                          <option value="women">Women</option>
                          <option value="powdery">Powdery</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Tagline
                        </label>
                        <input
                          type="text"
                          placeholder="Aroma mewah memikat"
                          value={newPerfumeForm.tagline}
                          onChange={(e) =>
                            setNewPerfumeForm({ ...newPerfumeForm, tagline: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Accords (Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          placeholder="Vanilla, Woody, Sweet"
                          value={newPerfumeForm.accordsStr}
                          onChange={(e) =>
                            setNewPerfumeForm({ ...newPerfumeForm, accordsStr: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingPerfume(false)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs"
                        >
                          Tambah Sekarang
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: MEDIA, HERO & 11 BOTOL (WIDESCREEN MULTI-KOLOM)
             ======================================================== */}
          {activeMenu === 'media' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-amber-300">
                  Media, Foto Utama & 11 Botol Bestseller
                </h2>
                <p className="text-xs text-slate-400">
                  Unggah dan sesuaikan gambar resmi dengan alat pemotong dan zoom terintegrasi.
                </p>
              </div>

              {/* BARIS 1: FOTO HERO UTAMA & LOGO RESMI (DESKTOP: 2 KOLOM) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Kartu Foto Utama Beranda */}
                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">
                        Foto Utama Beranda (Hero)
                      </h3>
                      <span className="text-[10px] text-slate-400">Foto botol panggung depan</span>
                    </div>
                    <label className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs cursor-pointer active:scale-95 transition-all">
                      <span>Ganti Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'hero')}
                      />
                    </label>
                  </div>

                  <div className="relative h-56 rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                    {currentChibi ? (
                      <img
                        src={currentChibi}
                        alt="Hero"
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Foto Utama Standar</span>
                    )}
                  </div>
                </div>

                {/* Kartu Logo Resmi & Barcode QRIS */}
                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">
                        Logo Resmi SINKI & QRIS
                      </h3>
                      <span className="text-[10px] text-slate-400">Identitas & Barcode Pembayaran</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-center">
                      <span className="text-[10px] font-bold text-slate-300 block">Logo SINKI</span>
                      <div className="h-28 rounded-xl bg-black/60 border border-white/5 p-2 flex items-center justify-center">
                        {currentLogo ? (
                          <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Sparkles size={24} className="text-amber-400" />
                        )}
                      </div>
                      <label className="block py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold cursor-pointer">
                        <span>Ganti Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                        />
                      </label>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-center">
                      <span className="text-[10px] font-bold text-slate-300 block">Barcode QRIS</span>
                      <div className="h-28 rounded-xl bg-black/60 border border-white/5 p-2 flex items-center justify-center">
                        {currentQris ? (
                          <img src={currentQris} alt="QRIS" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-500">QRIS Standar</span>
                        )}
                      </div>
                      <label className="block py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold cursor-pointer">
                        <span>Ganti QRIS</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'qris')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* BARIS 2: 11 BOTOL BESTSELLER (DESKTOP: 4 KOLOM) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Foto 11 Botol Bestseller
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">11 Varian Unggulan</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {TOP_11_DATA.map((p, index) => {
                    const variantId = `top-${p.id}`;
                    const photo = top11Photos[variantId];

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                            #{index + 1}
                          </span>
                          <span className="text-slate-400 truncate max-w-[110px]">{p.type || 'Extrait De Parfum'}</span>
                        </div>

                        <div className="relative h-40 rounded-xl bg-black/60 border border-white/5 p-2 flex items-center justify-center overflow-hidden">
                          {photo ? (
                            <img
                              src={photo}
                              alt={p.name}
                              className="w-full h-full object-contain filter drop-shadow-sm"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono text-center">
                              Botol #{p.id}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-display font-bold text-xs text-white truncate">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {p.subtitle}
                          </span>
                        </div>

                        <label className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-amber-300 font-bold text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                          <Upload size={12} />
                          <span>Ganti Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, variantId)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: TEKS BERJALAN & HARGA (DESKTOP: SPLIT 2 KOLOM)
             ======================================================== */}
          {activeMenu === 'banner' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-amber-300">
                  Teks Berjalan & Konfigurasi Harga
                </h2>
                <p className="text-xs text-slate-400">
                  Ubah running text marquee beranda, pilihan gaya tipografi, dan harga tier botol.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KOLOM KIRI: TEKS BERJALAN & FONT */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0e111d] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-white">
                      Teks Berjalan Beranda (Marquee)
                    </h3>
                    <button
                      onClick={handleResetTicker}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                      Isi Teks Marquee:
                    </label>
                    <input
                      type="text"
                      value={tickerForm.text}
                      onChange={(e) => setTickerForm({ ...tickerForm, text: e.target.value })}
                      placeholder="Masukkan slogan atau teks promo..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Pilihan 4 Font */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                      Pilihan Font Tipografi:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TICKER_FONTS.map((font) => {
                        const isSelected = tickerForm.font === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => setTickerForm({ ...tickerForm, font: font.id })}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 text-white'
                                : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold">{font.name}</span>
                              {isSelected && <Check size={13} className="text-amber-400" />}
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-1 line-clamp-1">
                              {font.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIVE SIMULATION CARD */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-amber-400 block mb-1 font-semibold">
                      Simulasi Tampilan Beranda:
                    </span>
                    <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/25 overflow-hidden text-center">
                      <span className="font-display font-black text-amber-200 text-xs tracking-wider animate-pulse">
                        "{tickerForm.text}"
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveTicker}
                    disabled={isSavingTicker}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all"
                  >
                    {isSavingTicker ? 'Menyimpan...' : 'Simpan Teks Berjalan'}
                  </button>
                </div>

                {/* KOLOM KANAN: KONFIGURASI HARGA BOTOL */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0e111d] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-white">
                      Pengaturan Tarif & Harga
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Mata Uang IDR</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <label className="text-[10.5px] font-bold text-amber-300 block">
                        Botol Non-Premium 30ml (IDR):
                      </label>
                      <input
                        type="number"
                        value={pricingForm.nonPremium?.[30] || 39000}
                        onChange={(e) =>
                          setPricingForm({
                            ...pricingForm,
                            nonPremium: {
                              ...pricingForm.nonPremium,
                              30: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <label className="text-[10.5px] font-bold text-amber-300 block">
                        Botol Non-Premium 50ml (IDR):
                      </label>
                      <input
                        type="number"
                        value={pricingForm.nonPremium?.[50] || 59000}
                        onChange={(e) =>
                          setPricingForm({
                            ...pricingForm,
                            nonPremium: {
                              ...pricingForm.nonPremium,
                              50: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <label className="text-[10px] font-bold text-amber-300 block truncate">
                          Tarif Premium/ml:
                        </label>
                        <input
                          type="number"
                          value={pricingForm.premiumRatePerMl || 4000}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              premiumRatePerMl: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <label className="text-[10px] font-bold text-amber-300 block truncate">
                          Tarif Mykonos/ml:
                        </label>
                        <input
                          type="number"
                          value={pricingForm.mykonosRatePerMl || 3000}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              mykonosRatePerMl: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <label className="text-[10.5px] font-bold text-amber-300 block">
                        Min. Belanja Gratis Ongkir (IDR):
                      </label>
                      <input
                        type="number"
                        value={pricingForm.minFreeShipping || 150000}
                        onChange={(e) =>
                          setPricingForm({
                            ...pricingForm,
                            minFreeShipping: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePricing}
                    disabled={isSavingPricing}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all"
                  >
                    {isSavingPricing ? 'Menyimpan...' : 'Simpan Perubahan Harga'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: KONTEN WEBSITE (ARTIKEL & TIPS)
             ======================================================== */}
          {activeMenu === 'content' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-amber-300">
                    Konten Website & Edukasi ({articlesList.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Terbitkan artikel wewangian, tips ketahanan, dan informasi promo.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingArticle(true)}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Buat Konten Baru</span>
                </button>
              </div>

              {/* Grid Artikel (DESKTOP: 2 KOLOM) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articlesList.map((art) => (
                  <div
                    key={art.id}
                    className="p-5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/30 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                          {art.categoryLabel}
                        </span>
                        <span className="text-slate-400 font-mono">{art.date}</span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-white">{art.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {art.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                      <span>Penulis: {art.author}</span>
                      <button
                        onClick={() => handleDeleteArticle(art.id, art.title)}
                        className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL TAMBAH ARTIKEL */}
              {isAddingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="w-full max-w-lg rounded-3xl bg-[#0f1118] border border-white/15 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="font-display font-bold text-sm text-white">
                        Tulis Konten / Tips Baru
                      </h3>
                      <button
                        onClick={() => setIsAddingArticle(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleAddArticleSubmit} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Judul Konten
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Cara Membuat Parfum Tahan Lebih Lama"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Kategori
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="tips">Tips Perawatan</option>
                          <option value="men">Panduan Pria</option>
                          <option value="women">Panduan Wanita</option>
                          <option value="promo">Info & Promo</option>
                          <option value="story">Edukasi Aroma</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                          Isi Konten
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Tuliskan isi panduan atau artikel di sini..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingArticle(false)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold text-xs"
                        >
                          Terbitkan Sekarang
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: ULASAN PEMBELI (DESKTOP: 2 KOLOM)
             ======================================================== */}
          {activeMenu === 'reviews' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-amber-300">
                    Moderasi Ulasan Pembeli ({reviewsList.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pantau dan moderasi ulasan pengalaman pembeli secara transparan.
                  </p>
                </div>

                <button
                  onClick={handleResetReviews}
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw size={13} />
                  <span>Reset ke 4 Ulasan Bawaan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0e111d] border border-white/10 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{rev.emoji}</span>
                          <div>
                            <span className="font-display font-bold text-xs text-white block">
                              {rev.name}
                            </span>
                            <span className="text-[10px] text-amber-300">{rev.emojiLabel}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.name)}
                          className="py-1 px-2.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>

                      <div className="text-[9.5px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md inline-block">
                        Varian: {rev.variant}
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span>{rev.date}</span>
                      <span>❤️ {rev.likes} Apresiasi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: PENGATURAN & KEAMANAN
             ======================================================== */}
          {activeMenu === 'settings' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-amber-300">
                  Pengaturan & Keamanan SINKI
                </h2>
                <p className="text-xs text-slate-400">
                  Status proteksi akun, hak cipta resmi, dan tautan akses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white block">Status Keamanan:</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">Autentikasi PIN Server:</span>
                      <span className="text-emerald-400 font-bold">Aktif & Terproteksi</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">Proteksi Brute-Force:</span>
                      <span className="text-emerald-400 font-bold">Rate Limiter Aktif</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300">Token Sesi 24 Jam:</span>
                      <span className="text-amber-300 font-bold font-mono">Terverifikasi</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white block">Hak Cipta & Brand:</span>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-slate-300 text-xs font-mono leading-relaxed">
                    © 2026 SINKI Parfums. All Rights Reserved. Haute Parfumerie Indonesia.
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block mb-1">Tautan Akses Rahasia:</span>
                    <span className="font-mono text-amber-300 text-xs block bg-black/40 p-2 rounded-xl border border-white/5">
                      /dimensi-sinki
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION MOBILE ONLY (DESKTOP: HIDDEN) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0d0f17]/95 border-t border-white/10 backdrop-blur-md px-3 py-2 flex items-center justify-around z-30 shadow-2xl">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as MenuKey)}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={16} />
                <span>{item.label.split(' ')[0]}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-amber-400 -mt-0.5" />}
              </button>
            );
          })}
        </nav>

        {/* MODAL FITTING & ADJUST FOTO DENGAN ZOOM / PAN */}
        {adjusterState.isOpen && (
          <CardFittingModal
            imageSrc={adjusterState.imageSrc}
            title={adjusterState.title}
            targetType={adjusterState.targetType}
            onClose={() => setAdjusterState((prev) => ({ ...prev, isOpen: false }))}
            onConfirm={handleAdjusterConfirm}
          />
        )}
      </main>
    </div>
  );
};

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
  BarChart3,
  Share2,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';

import { AnalyticsView } from './AnalyticsView';
import { SystemHealthSecurityView } from './SystemHealthSecurityView';

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
import {
  Top11Item,
  getStoredTopPerfumes,
  saveTopPerfumesToStorage,
  fetchTopPerfumesFromServer,
  saveTopPerfumesToServer,
  addTopPerfume,
  updateTopPerfume,
  deleteTopPerfume,
  resetTopPerfumesToDefault,
} from '../utils/topPerfumesStorage';
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
import {
  PricingConfig,
  DEFAULT_PRICING,
  savePricingToServer,
} from '../utils/pricingStorage';
import {
  SocialLinks,
  getStoredSocialLinks,
  fetchSocialLinksFromServer,
  saveSocialLinksToServer,
  resetSocialLinksToDefault,
  formatTikTokUrl,
  extractTikTokHandle,
  formatInstagramUrl,
  extractInstagramHandle,
  formatWhatsAppUrl,
} from '../utils/socialStorage';

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
  socialLinks?: SocialLinks;
  onAssetsUpdated: (newLogo: string | null, newChibi: string | null) => void;
  onQrisUpdated: (newQris: string | null) => void;
  onTop11PhotoUpdated: (variantId: string, newPhoto: string) => void;
  onPricingUpdated: (newPricing: PricingConfig) => void;
  onTickerUpdated?: (newTicker: TickerConfig) => void;
  onPerfumesUpdated?: (newList: PerfumeItem[]) => void;
  onSocialLinksUpdated?: (newLinks: SocialLinks) => void;
}

type MenuKey =
  | 'dashboard'
  | 'analytics'
  | 'security'
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
  socialLinks: propSocialLinks,
  onAssetsUpdated,
  onQrisUpdated,
  onTop11PhotoUpdated,
  onPricingUpdated,
  onTickerUpdated,
  onPerfumesUpdated,
  onSocialLinksUpdated,
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

  // Social Links (TikTok, Instagram, WhatsApp, Marketplace) State & Handlers
  const [socialForm, setSocialForm] = useState<SocialLinks>(() => propSocialLinks || getStoredSocialLinks());
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  useEffect(() => {
    if (propSocialLinks) {
      setSocialForm(propSocialLinks);
    } else {
      fetchSocialLinksFromServer().then((links) => {
        if (links) setSocialForm(links);
      });
    }
  }, [propSocialLinks]);

  const handleSaveSocial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSavingSocial(true);
      onShowToast('Menyimpan perubahan tautan akun ke server & cloud...');
      const saved = await saveSocialLinksToServer(socialForm);
      setSocialForm(saved);
      onSocialLinksUpdated?.(saved);
      onShowToast('Tautan akun TikTok & media sosial berhasil diperbarui! ✅');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan tautan akun media sosial.');
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleResetSocial = async () => {
    if (confirm('Kembalikan semua tautan media sosial ke akun default resmi SINKI?')) {
      try {
        setIsSavingSocial(true);
        const def = await resetSocialLinksToDefault();
        setSocialForm(def);
        onSocialLinksUpdated?.(def);
        onShowToast('Tautan media sosial dikembalikan ke default!');
      } catch (err) {
        console.error(err);
      } finally {
        setIsSavingSocial(false);
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

  // Top Bestseller Management State & Handlers
  const [topPerfumesList, setTopPerfumesList] = useState<Top11Item[]>(getStoredTopPerfumes);
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [editingTopItem, setEditingTopItem] = useState<Top11Item | null>(null);
  const [topFormName, setTopFormName] = useState('');
  const [topFormType, setTopFormType] = useState('Eau De Parfum');
  const [topFormSubtitle, setTopFormSubtitle] = useState('');
  const [topFormDescription, setTopFormDescription] = useState('');
  const [topFormTopNotes, setTopFormTopNotes] = useState('');
  const [topFormMiddleNotes, setTopFormMiddleNotes] = useState('');
  const [topFormBaseNotes, setTopFormBaseNotes] = useState('');

  // Sinkronisasi data Top Bestseller dari server & cloud saat dibuka
  useEffect(() => {
    fetchTopPerfumesFromServer().then((items) => {
      if (items && Array.isArray(items) && items.length > 0) {
        setTopPerfumesList(items);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTopPerfumesList(e.detail);
      }
    };
    window.addEventListener('sinki_top_perfumes_updated', handleUpdate);
    return () => window.removeEventListener('sinki_top_perfumes_updated', handleUpdate);
  }, []);

  const handleOpenAddTopItem = () => {
    setEditingTopItem(null);
    setTopFormName('');
    setTopFormType('Eau De Parfum');
    setTopFormSubtitle('');
    setTopFormDescription('');
    setTopFormTopNotes('');
    setTopFormMiddleNotes('');
    setTopFormBaseNotes('');
    setIsTopModalOpen(true);
  };

  const handleOpenEditTopItem = (item: Top11Item) => {
    setEditingTopItem(item);
    setTopFormName(item.name);
    setTopFormType(item.type || 'Eau De Parfum');
    setTopFormSubtitle(item.subtitle || '');
    setTopFormDescription(item.description || '');
    setTopFormTopNotes(item.topNotes || '');
    setTopFormMiddleNotes(item.middleNotes || '');
    setTopFormBaseNotes(item.baseNotes || '');
    setIsTopModalOpen(true);
  };

  const handleSaveTopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topFormName.trim()) {
      onShowToast('Nama varian tidak boleh kosong');
      return;
    }

    if (editingTopItem) {
      const updated = updateTopPerfume(editingTopItem.id, {
        name: topFormName.trim(),
        type: topFormType.trim(),
        subtitle: topFormSubtitle.trim(),
        description: topFormDescription.trim(),
        topNotes: topFormTopNotes.trim(),
        middleNotes: topFormMiddleNotes.trim(),
        baseNotes: topFormBaseNotes.trim(),
      });
      setTopPerfumesList(updated);
      onShowToast(`Varian Top ${editingTopItem.rank} (${topFormName}) berhasil diperbarui & disimpan ke cloud! ✨`);
      await saveTopPerfumesToServer(updated);
    } else {
      const updated = addTopPerfume({
        name: topFormName.trim(),
        type: topFormType.trim(),
        subtitle: topFormSubtitle.trim(),
        description: topFormDescription.trim(),
        topNotes: topFormTopNotes.trim(),
        middleNotes: topFormMiddleNotes.trim(),
        baseNotes: topFormBaseNotes.trim(),
      });
      setTopPerfumesList(updated);
      onShowToast(`Varian Top baru (${topFormName}) berhasil ditambahkan & tersimpan ke publik! 🌟`);
      await saveTopPerfumesToServer(updated);
    }
    setIsTopModalOpen(false);
  };

  const handleDeleteTopItem = async (id: string, name: string, rank: number) => {
    if (topPerfumesList.length <= 1) {
      onShowToast('Minimal harus ada 1 varian terdaftar di Top Bestseller');
      return;
    }
    if (confirm(`Hapus varian Top ${rank} (${name}) dari daftar Bestseller?`)) {
      const updated = deleteTopPerfume(id);
      setTopPerfumesList(updated);
      onShowToast(`Varian ${name} telah dihapus & sinkron ke publik`);
      await saveTopPerfumesToServer(updated);
    }
  };

  const handleResetTopPerfumes = async () => {
    if (confirm('Kembalikan daftar Top Bestseller ke 11 varian bawaan standar?')) {
      const reset = resetTopPerfumesToDefault();
      setTopPerfumesList(reset);
      onShowToast('Daftar Top Bestseller berhasil di-reset ke 11 varian awal!');
      await saveTopPerfumesToServer(reset);
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
      const cleanBottleNumber = target.replace('top-', '');
      setAdjusterState({
        isOpen: true,
        imageSrc: rawBase64,
        target,
        title: titles[target] || `Pas-kan Foto Botol ${cleanBottleNumber}`,
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
        const cleanNumber = target.replace('top-', '');
        onShowToast(`Menyimpan foto botol ${cleanNumber} ke server...`);
        await saveTop11PhotoToServer(target, adjustedBase64, '1995');
        onTop11PhotoUpdated(target, adjustedBase64);
        onShowToast(`Foto botol ${cleanNumber} berhasil disimpan permanen! ✅`);
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
    if (confirm('Kosongkan semua ulasan pembeli di server?')) {
      const res = await resetReviewsToDefaultInSupabase();
      setReviewsList(res);
      onShowToast('Semua ulasan berhasil dikosongkan.');
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
        <span className="hidden sm:inline">SINKI PARFUM | DEFINE YOUR PRESENCE</span>
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
              SINKI PARFUM | DEFINE YOUR PRESENCE
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
    analytics: 'Statistik & Trafik Pengunjung',
    security: 'Keamanan & Kesehatan Sistem',
    variants: `Katalog Varian (${perfumesList.length})`,
    media: 'Media, Hero & 11 Botol Bestseller',
    banner: 'Teks Berjalan & Daftar Harga',
    content: `Konten & Edukasi (${articlesList.length})`,
    reviews: `Ulasan Pembeli (${reviewsList.length})`,
    settings: 'Pengaturan & Brand',
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
    { id: 'analytics', label: 'Grafik Pengunjung', badge: 'Live', icon: BarChart3 },
    { id: 'security', label: 'Keamanan & Health', badge: '100%', icon: ShieldCheck },
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

              {/* BANNER REAL-TIME STATISTIK PENGUNJUNG & KEAMANAN SISTEM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveMenu('analytics')}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#171a2b] via-[#1c2035] to-[#141624] border border-amber-500/35 hover:border-amber-400/60 cursor-pointer transition-all active:scale-98 shadow-xl flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                          Grafik & Analitik Pengunjung
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                        Lihat Kebanyakan Pengunjung Masuk dari Mana
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Instagram, TikTok, WhatsApp, Facebook, Google, Direct
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 group-hover:text-amber-200 self-end shrink-0 pt-2 border-t border-white/5 w-full justify-between">
                    <span className="text-[11px] text-slate-400">Pantau pertumbuhan website</span>
                    <span className="flex items-center gap-1">
                      Buka Grafik Penuh <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('security')}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0f1b1a] via-[#132322] to-[#0d161a] border border-emerald-500/35 hover:border-emerald-400/60 cursor-pointer transition-all active:scale-98 shadow-xl flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                          Keamanan & Kesehatan Sistem
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          OPTIMAL 100%
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                        Sapu Bersih Cache & Proteksi Benteng
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        1-Klik Bersihkan Sampah Web, Ganti PIN, & Cek Link Toko
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 group-hover:text-emerald-200 self-end shrink-0 pt-2 border-t border-white/5 w-full justify-between">
                    <span className="text-[11px] text-slate-400">Website Cepat & Terlindungi</span>
                    <span className="flex items-center gap-1">
                      Buka Pusat Keamanan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
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
              TAB: STATISTIK & GRAFIK PENGUNJUNG (REAL-TIME DARI NOL)
             ======================================================== */}
          {activeMenu === 'analytics' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-amber-300 flex items-center gap-2">
                    <BarChart3 size={20} className="text-amber-400" />
                    <span>Statistik & Grafik Pengunjung SINKI</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pantau dari mana kebanyakan pengguna masuk ke website Sinki secara real-time.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-[#0e111d] border border-white/10 p-2 sm:p-4 shadow-xl">
                <AnalyticsView onShowToast={onShowToast} pin="1995" isCompact={false} />
              </div>
            </div>
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

              {/* BARIS 2: MANAJEMEN VARIAN TOP BESTSELLER (DINAMIS DENGAN TAMBAH & EDIT) */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-white">
                        Varian Botol Bestseller ({topPerfumesList.length} Varian)
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Top {topPerfumesList.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Kelola nama, deskripsi aroma, foto botol, dan tambahkan varian baru kapan saja.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenAddTopItem}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#DFB76C] to-[#C5A059] hover:brightness-105 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <Plus size={14} />
                      <span>Tambah Varian Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTopPerfumes}
                      className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Kembalikan ke 11 varian awal"
                    >
                      <RotateCcw size={13} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {topPerfumesList.map((p, index) => {
                    const variantId = `top-${p.id}`;
                    const photo = top11Photos[variantId] || top11Photos[p.id] || p.photo;

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-[#0e111d] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-2.5"
                      >
                        {/* Header: Clean Number 1, 2, 3 (No #) & Type */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                            {p.rank || index + 1}
                          </span>
                          <span className="text-slate-400 truncate max-w-[110px]">
                            {p.type || 'Eau De Parfum'}
                          </span>
                        </div>

                        {/* Photo Box */}
                        <div className="relative h-40 rounded-xl bg-black/60 border border-white/5 p-2 flex items-center justify-center overflow-hidden">
                          {photo ? (
                            <img
                              src={photo}
                              alt={p.name}
                              className="w-full h-full object-contain filter drop-shadow-sm"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <span className="text-[11px] text-amber-300/80 font-mono block font-bold">
                                Botol {p.rank || index + 1}
                              </span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">
                                Belum ada foto
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h4 className="font-display font-bold text-xs text-white truncate" title={p.name}>
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate" title={p.subtitle}>
                            {p.subtitle || 'Aroma khas SINKI'}
                          </span>
                        </div>

                        {/* Action Buttons: Ganti Foto, Edit Info, Hapus */}
                        <div className="space-y-1.5 pt-1 border-t border-white/5">
                          <label className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                            <Upload size={11} />
                            <span>Ganti Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, variantId)}
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTopItem(p)}
                              className="py-1 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                            >
                              <Edit size={11} />
                              <span>Edit Info</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTopItem(p.id, p.name, p.rank || index + 1)}
                              className="py-1 px-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                            >
                              <Trash2 size={11} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
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
                    Moderasi Ulasan Pembeli ({reviewsList.length}/10 Slot)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pantau dan moderasi ulasan pengalaman pembeli secara transparan. Sistem menampung hingga 10 ulasan terbaru secara bergantian.
                  </p>
                </div>

                <button
                  onClick={handleResetReviews}
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw size={13} />
                  <span>Kosongkan Semua Ulasan</span>
                </button>
              </div>

              {reviewsList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0e111d] border border-white/10 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Belum ada ulasan yang masuk. Kotak ulasan saat ini kosong dan siap menampung ulasan baru dari pengunjung hingga 10 slot.
                  </p>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {/* ========================================================
              TAB: KEAMANAN & KESEHATAN SISTEM (SINKI GUARD)
             ======================================================== */}
          {activeMenu === 'security' && (
            <SystemHealthSecurityView onShowToast={onShowToast} />
          )}

          {/* ========================================================
              TAB 7: PENGATURAN & BRAND
             ======================================================== */}
          {activeMenu === 'settings' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-amber-300">
                  Pengaturan & Brand SINKI
                </h2>
                <p className="text-xs text-slate-400">
                  Status proteksi akun, hak cipta resmi, dan tautan akses.
                </p>
              </div>

              {/* KARTU KELOLA AKUN MEDIA SOSIAL & MARKETPLACE RESMI */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0e111d] border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/[0.05] rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-pink-500/20 to-amber-500/20 border border-white/15 flex items-center justify-center shadow-inner">
                      <Share2 size={20} className="text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                        <span>Kelola Akun Media Sosial & Toko Resmi</span>
                        <span className="text-[9.5px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                          Live Sync
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ganti akun TikTok, Instagram, WhatsApp, atau marketplace Anda kapan saja. Tautan otomatis berubah di Beranda, Menu Drawer, dan Tombol Media Sosial.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetSocial}
                      disabled={isSavingSocial}
                      className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                      title="Kembalikan tautan ke akun default"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveSocial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. AKUN TIKTOK (FOKUS UTAMA OWNER) */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2.5 shadow-md hover:border-cyan-400/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="w-4 h-4">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#00f2fe"/>
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#fe2c55" opacity="0.7"/>
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#ffffff" opacity="0.85"/>
                          </svg>
                          <span>Akun / Link Profil TikTok *</span>
                        </label>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {extractTikTokHandle(socialForm.tiktok)}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.tiktok}
                        onChange={(e) => setSocialForm({ ...socialForm, tiktok: e.target.value })}
                        placeholder="Contoh: @sinkiofficial atau https://www.tiktok.com/@sinkiofficial"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#141624] border border-cyan-500/40 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                      />

                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-400 leading-snug">
                          💡 Bisa ketik <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">@nama_baru</code> atau link lengkap.
                        </span>
                        <a
                          href={formatTikTokUrl(socialForm.tiktok)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 hover:underline ml-2 shrink-0"
                          title="Buka akun TikTok untuk tes apakah link benar"
                        >
                          <span>Tes Buka Profil</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 2. AKUN INSTAGRAM */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/30 space-y-2.5 shadow-md hover:border-pink-400/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-pink-300 flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-0.5">
                            <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <span>Akun / Link Profil Instagram</span>
                        </label>
                        <span className="text-[10px] font-mono text-pink-300 font-bold bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                          {extractInstagramHandle(socialForm.instagram)}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.instagram}
                        onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                        placeholder="Contoh: @sinki_official atau https://www.instagram.com/sinki_official"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#141624] border border-pink-500/40 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50"
                      />

                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-400 leading-snug">
                          Tautan ke feed & katalog resmi SINKI di Instagram.
                        </span>
                        <a
                          href={formatInstagramUrl(socialForm.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-300 hover:text-white font-bold flex items-center gap-1 hover:underline ml-2 shrink-0"
                        >
                          <span>Tes Buka Profil</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 3. WHATSAPP HOTLINE VIP */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2.5 shadow-md hover:border-emerald-400/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                          <MessageCircle size={15} className="text-emerald-400" />
                          <span>WhatsApp Hotline VIP & Order</span>
                        </label>
                        <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Aktif
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.whatsapp}
                        onChange={(e) => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                        placeholder="Contoh: 081398677610 atau https://wa.me/6281398677610"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#141624] border border-emerald-500/40 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
                      />

                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-400 leading-snug">
                          Nomor chat pemesanan langsung & konsultasi parfum.
                        </span>
                        <a
                          href={formatWhatsAppUrl(socialForm.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-300 hover:text-white font-bold flex items-center gap-1 hover:underline ml-2 shrink-0"
                        >
                          <span>Tes Chat WA</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 4. SHOPEE & TOKOPEDIA */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2.5 shadow-md hover:border-amber-400/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                          <ShoppingBag size={15} className="text-amber-400" />
                          <span>Shopee & Tokopedia Official</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={socialForm.shopee}
                          onChange={(e) => setSocialForm({ ...socialForm, shopee: e.target.value })}
                          placeholder="Link Toko Shopee (https://shopee.co.id/...)"
                          className="w-full px-3 py-2 rounded-xl bg-[#141624] border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <input
                          type="text"
                          value={socialForm.tokopedia}
                          onChange={(e) => setSocialForm({ ...socialForm, tokopedia: e.target.value })}
                          placeholder="Link Toko Tokopedia (https://tokopedia.com/...)"
                          className="w-full px-3 py-2 rounded-xl bg-[#141624] border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol Simpan Perubahan Media Sosial */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                      ✨ Tekan tombol simpan di sebelah kanan agar akun baru langsung aktif dan disinkronkan ke cloud.
                    </p>
                    <button
                      type="submit"
                      disabled={isSavingSocial}
                      className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-black/40 flex items-center justify-center gap-2 shrink-0 border border-[#DFB76C]/40"
                    >
                      <Save size={15} className="stroke-[2.5]" />
                      <span>{isSavingSocial ? 'Menyimpan ke Cloud...' : 'Simpan Perubahan Tautan'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white block">Status Keamanan:</span>
                    <button
                      onClick={() => setActiveMenu('security')}
                      className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Detail Guard</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
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

                  <button
                    onClick={() => setActiveMenu('security')}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-amber-500/20 hover:from-emerald-600/40 hover:to-amber-500/30 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <ShieldCheck size={14} />
                    <span>Buka Pusat Keamanan & Kesehatan Lengkap →</span>
                  </button>
                </div>

                <div className="p-5 rounded-3xl bg-[#0e111d] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white block">Hak Cipta & Brand:</span>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-slate-300 text-xs font-mono leading-relaxed">
                    © 2026 SINKI Parfums. All Rights Reserved. Define Your Presence.
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

        {/* MODAL TAMBAH & EDIT VARIAN TOP BESTSELLER */}
        {isTopModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-[#121524] border border-amber-500/30 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold font-mono text-sm">
                    {editingTopItem ? editingTopItem.rank : topPerfumesList.length + 1}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">
                      {editingTopItem ? `Edit Varian Top ${editingTopItem.rank}` : 'Tambah Varian Top Baru'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {editingTopItem ? 'Perbarui nama & karakter aroma' : 'Masukkan parfum baru ke daftar Bestseller'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTopItem} className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block mb-1">
                    Nama Parfum *
                  </label>
                  <input
                    type="text"
                    required
                    value={topFormName}
                    onChange={(e) => setTopFormName(e.target.value)}
                    placeholder="Contoh: Mykonos Vanilla Clouds"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block mb-1">
                    Tipe Konsentrasi
                  </label>
                  <select
                    value={topFormType}
                    onChange={(e) => setTopFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f111d] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Extrait De Parfum">Extrait De Parfum</option>
                    <option value="Eau De Parfum">Eau De Parfum</option>
                    <option value="Eau De Toilette Intense">Eau De Toilette Intense</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block mb-1">
                    Tagline / Karakter Singkat
                  </label>
                  <input
                    type="text"
                    value={topFormSubtitle}
                    onChange={(e) => setTopFormSubtitle(e.target.value)}
                    placeholder="Contoh: Rich Amber, French Cognac & Royal Vanilla"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block mb-1">
                    Deskripsi Lengkap Aroma
                  </label>
                  <textarea
                    rows={3}
                    value={topFormDescription}
                    onChange={(e) => setTopFormDescription(e.target.value)}
                    placeholder="Penjelasan detail aroma, kesan pertama, dan ketahanan wangi..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Top Notes
                    </label>
                    <input
                      type="text"
                      value={topFormTopNotes}
                      onChange={(e) => setTopFormTopNotes(e.target.value)}
                      placeholder="e.g. Cognac, Bergamot"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Middle Notes
                    </label>
                    <input
                      type="text"
                      value={topFormMiddleNotes}
                      onChange={(e) => setTopFormMiddleNotes(e.target.value)}
                      placeholder="e.g. Amber, Tonka"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Base Notes
                    </label>
                    <input
                      type="text"
                      value={topFormBaseNotes}
                      onChange={(e) => setTopFormBaseNotes(e.target.value)}
                      placeholder="e.g. Vanilla, Cedar"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsTopModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 font-black text-xs shadow-md hover:brightness-105 active:scale-95 transition-all"
                  >
                    {editingTopItem ? 'Simpan Perubahan' : 'Tambahkan Varian'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

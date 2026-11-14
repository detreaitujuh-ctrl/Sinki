import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Crown,
  Upload,
  Trash2,
  Check,
  Save,
  RotateCcw,
  Eye,
  LogOut,
  Sliders,
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
  Film,
  Play,
  Video,
  Volume2,
  VolumeX,
  Palette,
} from 'lucide-react';

import { AnalyticsView } from './AnalyticsView';
import { SystemHealthSecurityView } from './SystemHealthSecurityView';

import {
  saveAssetToServer,
  saveQrisToServer,
  saveTop11PhotoToServer,
  verifyOwnerPinOnServer,
  HeroStageEffect,
  STAGE_EFFECTS,
  DEFAULT_HERO_BOTTLES,
  getStoredHeroBottles,
  getStoredHeroStageEffect,
  getStoredHeroStageEnabled,
  getStoredHeroMediaType,
  getStoredHeroVideoUrl,
  getStoredHeroVideoPoster,
  getStoredHeroVideoFit,
  getStoredHeroVideoPosition,
  getStoredHeroHeightMode,
  HeroVideoFit,
  HeroVideoPosition,
  HeroHeightMode,
  saveHeroBottleItemToServer,
  saveHeroStageEffectToServer,
  saveHeroStageEnabledToServer,
  saveHeroVideoSettingsToServer,
  extractVideoFrame,
  uploadVideoDirectlyToSupabase,
  deleteFileFromSupabase,
  compressImage,
  purgeSinkiBrowserCache,
  getStoredMasterFlacon,
  getOwnerToken,
  setOwnerToken,
  clearOwnerToken,
} from '../utils/assetStorage';
import { CardFittingModal } from './CardFittingModal';
import {
  ArticleItem,
  getStoredArticles,
  saveArticlesToStorage,
  INITIAL_ARTICLES,
} from '../utils/articleStorage';

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
import {
  PerfumeCategory,
  PerfumeItem,
  CollectionCategoryKey,
  PricePerMlRate,
  COLLECTION_CATEGORIES,
} from '../data/perfumes';
import {
  getStoredPerfumes,
  fetchPerfumesFromServer,
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
import {
  LuxuryThemeId,
  LuxuryThemeConfig,
  LUXURY_THEMES,
  getStoredTheme,
  fetchThemeFromServer,
  saveThemeToServer,
  resetThemeToDefault,
  applyThemeToDocument,
} from '../utils/themeStorage';

interface DimensiSinkiScreenProps {
  onExitToPublic: () => void;
  onShowToast: (msg: string) => void;
  currentLogo: string | null;
  currentChibi: string | null;
  currentQris: string | null;
  masterFlacon?: string | null;
  top11Photos: Record<string, string>;
  heroBottles?: string[];
  heroStageEffect?: HeroStageEffect;
  heroStageEnabled?: boolean;
  heroMediaType?: 'image' | 'video';
  heroVideoUrl?: string | null;
  heroVideoPoster?: string | null;
  heroVideoFit?: HeroVideoFit;
  heroVideoPosition?: HeroVideoPosition;
  heroHeightMode?: HeroHeightMode;
  pricing?: PricingConfig;
  tickerConfig?: TickerConfig;
  perfumes?: PerfumeItem[];
  socialLinks?: SocialLinks;
  luxuryTheme?: LuxuryThemeConfig;
  onAssetsUpdated: (newLogo: string | null, newChibi: string | null) => void;
  onQrisUpdated: (newQris: string | null) => void;
  onMasterFlaconUpdated?: (url: string) => void;
  onTop11PhotoUpdated: (variantId: string, newPhoto: string) => void;
  onHeroBottlesUpdated?: (bottles: string[]) => void;
  onHeroStageEffectUpdated?: (effect: HeroStageEffect) => void;
  onHeroStageEnabledUpdated?: (enabled: boolean) => void;
  onHeroVideoUpdated?: (settings: {
    heroMediaType?: 'image' | 'video';
    heroVideoUrl?: string | null;
    heroVideoPoster?: string | null;
    heroVideoFit?: HeroVideoFit;
    heroVideoPosition?: HeroVideoPosition;
    heroHeightMode?: HeroHeightMode;
  }) => void;
  onPricingUpdated: (newPricing: PricingConfig) => void;
  onTickerUpdated?: (newTicker: TickerConfig) => void;
  onPerfumesUpdated?: (newList: PerfumeItem[]) => void;
  onSocialLinksUpdated?: (newLinks: SocialLinks) => void;
  onThemeUpdated?: (newTheme: LuxuryThemeConfig) => void;
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
  masterFlacon: propMasterFlacon,
  top11Photos,
  heroBottles: propHeroBottles,
  heroStageEffect: propHeroStageEffect,
  heroStageEnabled: propHeroStageEnabled,
  heroMediaType: propHeroMediaType,
  heroVideoUrl: propHeroVideoUrl,
  heroVideoPoster: propHeroVideoPoster,
  heroVideoFit: propHeroVideoFit,
  heroVideoPosition: propHeroVideoPosition,
  heroHeightMode: propHeroHeightMode,
  pricing,
  tickerConfig,
  perfumes,
  socialLinks: propSocialLinks,
  luxuryTheme: propLuxuryTheme,
  onAssetsUpdated,
  onQrisUpdated,
  onMasterFlaconUpdated,
  onTop11PhotoUpdated,
  onHeroBottlesUpdated,
  onHeroStageEffectUpdated,
  onHeroStageEnabledUpdated,
  onHeroVideoUpdated,
  onPricingUpdated,
  onTickerUpdated,
  onPerfumesUpdated,
  onSocialLinksUpdated,
  onThemeUpdated,
}) => {
  // Luxury Architectural 5-Color Theme State
  const [selectedThemeId, setSelectedThemeId] = useState<LuxuryThemeId>(
    () => propLuxuryTheme?.id || getStoredTheme().id
  );
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  useEffect(() => {
    if (propLuxuryTheme?.id) {
      setSelectedThemeId(propLuxuryTheme.id);
      applyThemeToDocument(propLuxuryTheme.id);
    }
  }, [propLuxuryTheme?.id]);

  useEffect(() => {
    fetchThemeFromServer().then((cfg) => {
      if (cfg?.id) {
        setSelectedThemeId(cfg.id);
        onThemeUpdated?.(cfg);
      }
    });
  }, []);

  const handleSelectLuxuryTheme = async (themeId: LuxuryThemeId) => {
    if (isSavingTheme) return;
    setSelectedThemeId(themeId);
    applyThemeToDocument(themeId);
    setIsSavingTheme(true);
    try {
      const saved = await saveThemeToServer(themeId);
      onThemeUpdated?.(saved);
      const found = LUXURY_THEMES.find((t) => t.id === themeId);
      onShowToast(`Tema "${found?.name || themeId}" aktif di seluruh website!`);
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetLuxuryTheme = async () => {
    if (isSavingTheme) return;
    setSelectedThemeId('botanical-crystal');
    applyThemeToDocument('botanical-crystal');
    setIsSavingTheme(true);
    try {
      const saved = await resetThemeToDefault();
      onThemeUpdated?.(saved);
      onShowToast('Tema dikembalikan ke Botanical Emerald 2.5D (Default Signature).');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const activeThemeMeta =
    LUXURY_THEMES.find((t) => t.id === selectedThemeId) || LUXURY_THEMES[0];

  // Hero Video & Poster Crossfade State
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>(() => propHeroMediaType || getStoredHeroMediaType());
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(() => propHeroVideoUrl || getStoredHeroVideoUrl() || '');
  const [heroVideoPoster, setHeroVideoPoster] = useState<string | null>(() => propHeroVideoPoster || getStoredHeroVideoPoster());
  const [heroVideoFit, setHeroVideoFit] = useState<HeroVideoFit>(() => propHeroVideoFit || getStoredHeroVideoFit());
  const [heroVideoPosition, setHeroVideoPosition] = useState<HeroVideoPosition>(() => propHeroVideoPosition || getStoredHeroVideoPosition());
  const [heroHeightMode, setHeroHeightMode] = useState<HeroHeightMode>(() => propHeroHeightMode || getStoredHeroHeightMode());
  const [adminPreviewRatio, setAdminPreviewRatio] = useState<'9:16' | 'full' | '1:1' | '16:9'>('9:16');
  const [videoUrlInput, setVideoUrlInput] = useState<string>(() => propHeroVideoUrl || getStoredHeroVideoUrl() || '');
  const [mediaSubTab, setMediaSubTab] = useState<'video' | 'identity' | 'stage'>('video');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);
  const [isTestingFade, setIsTestingFade] = useState(false);
  const heroVideoInputRef = useRef<HTMLInputElement>(null);
  const heroPosterInputRef = useRef<HTMLInputElement>(null);

  // Sync external props if updated from server
  useEffect(() => {
    if (propHeroMediaType) setHeroMediaType(propHeroMediaType);
  }, [propHeroMediaType]);

  useEffect(() => {
    if (propHeroVideoUrl !== undefined) {
      setHeroVideoUrl(propHeroVideoUrl || '');
      setVideoUrlInput(propHeroVideoUrl || '');
    }
  }, [propHeroVideoUrl]);

  useEffect(() => {
    if (propHeroVideoPoster !== undefined) {
      setHeroVideoPoster(propHeroVideoPoster);
    }
  }, [propHeroVideoPoster]);

  useEffect(() => {
    if (propHeroVideoFit) setHeroVideoFit(propHeroVideoFit);
  }, [propHeroVideoFit]);

  useEffect(() => {
    if (propHeroVideoPosition) setHeroVideoPosition(propHeroVideoPosition);
  }, [propHeroVideoPosition]);

  useEffect(() => {
    if (propHeroHeightMode) setHeroHeightMode(propHeroHeightMode);
  }, [propHeroHeightMode]);

  const handleUpdateLayoutSetting = async (
    field: 'heroVideoFit' | 'heroVideoPosition' | 'heroHeightMode',
    value: any
  ) => {
    if (field === 'heroVideoFit') setHeroVideoFit(value);
    if (field === 'heroVideoPosition') setHeroVideoPosition(value);
    if (field === 'heroHeightMode') setHeroHeightMode(value);

    await saveHeroVideoSettingsToServer({ [field]: value }, '1995');
    onHeroVideoUpdated?.({ [field]: value });
    onShowToast(`Layout video disesuaikan! ✨`);
  };

  // 3D Stage Bottles & Effect State
  const [heroBottlesList, setHeroBottlesList] = useState<string[]>(() => propHeroBottles || getStoredHeroBottles());
  const [activeStageEffect, setActiveStageEffect] = useState<HeroStageEffect>(() => propHeroStageEffect || getStoredHeroStageEffect());
  const [isHeroStageEnabled, setIsHeroStageEnabled] = useState<boolean>(() => propHeroStageEnabled !== undefined ? propHeroStageEnabled : getStoredHeroStageEnabled());
  const [selectedHeroBottleIdx, setSelectedHeroBottleIdx] = useState<number | null>(null);
  const heroBottleInputRef = useRef<HTMLInputElement>(null);

  // Master Flacon Transparan State (Khusus Panggung Racikan Aroma)
  const [currentMasterFlacon, setCurrentMasterFlacon] = useState<string | null>(
    () => propMasterFlacon || getStoredMasterFlacon()
  );
  const masterFlaconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propMasterFlacon) {
      setCurrentMasterFlacon(propMasterFlacon);
    }
  }, [propMasterFlacon]);

  const handleMasterFlaconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast('Memproses Botol Master Racikan Transparan...');
      const base64Data = await compressImage(file, 1200, 1200, 0.95);
      onShowToast('Menyimpan Botol Master ke server & cloud...');
      const ok = await saveAssetToServer('masterFlacon', base64Data, '1995');
      if (ok) {
        setCurrentMasterFlacon(base64Data);
        onMasterFlaconUpdated?.(base64Data);
        onShowToast('Botol Master Racikan Transparan berhasil disimpan permanen! ✨');
      } else {
        onShowToast('Gagal menyimpan foto botol master.');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Gagal memproses file foto botol.');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (propHeroStageEnabled !== undefined) {
      setIsHeroStageEnabled(propHeroStageEnabled);
    }
  }, [propHeroStageEnabled]);

  const handleToggleStageEnabled = async () => {
    const next = !isHeroStageEnabled;
    setIsHeroStageEnabled(next);
    await saveHeroStageEnabledToServer(next, '1995');
    onHeroStageEnabledUpdated?.(next);
    onShowToast(
      next
        ? 'Panggung 3D Beranda diaktifkan! ✨ (Akan tampil saat botol diunggah)'
        : 'Panggung 3D dinonaktifkan (tampilan beranda bersih).'
    );
  };

  useEffect(() => {
    if (propHeroBottles && propHeroBottles.length === 4) {
      setHeroBottlesList(propHeroBottles);
    }
  }, [propHeroBottles]);

  useEffect(() => {
    if (propHeroStageEffect) {
      setActiveStageEffect(propHeroStageEffect);
    }
  }, [propHeroStageEffect]);

  const handleHeroBottleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedHeroBottleIdx === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast(`Memproses Botol 3D #${selectedHeroBottleIdx + 1}...`);
      const base64Data = await compressImage(file, 1000, 1000, 0.9);
      onShowToast(`Menyimpan Botol 3D #${selectedHeroBottleIdx + 1} ke server...`);
      const updated = await saveHeroBottleItemToServer(selectedHeroBottleIdx, base64Data, '1995');
      setHeroBottlesList(updated);
      onHeroBottlesUpdated?.(updated);
      onShowToast(`Botol 3D #${selectedHeroBottleIdx + 1} berhasil disimpan permanen! ✅`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan foto botol.');
    } finally {
      setSelectedHeroBottleIdx(null);
      e.target.value = '';
    }
  };

  const handleSelectStageEffect = async (effectId: HeroStageEffect) => {
    try {
      setActiveStageEffect(effectId);
      onHeroStageEffectUpdated?.(effectId);
      await saveHeroStageEffectToServer(effectId, '1995');
      const effectName = STAGE_EFFECTS.find((e) => e.id === effectId)?.name || effectId;
      onShowToast(`Efek panggung diubah ke "${effectName}"! ✨`);
    } catch (err) {
      console.error(err);
    }
  };

  // === HANDLER VIDEO SINEMATIK BERANDA & FRAME EXTRACTOR ===
  const handleToggleMediaType = async (mode: 'image' | 'video') => {
    setHeroMediaType(mode);
    onHeroVideoUpdated?.({ heroMediaType: mode });
    await saveHeroVideoSettingsToServer({ heroMediaType: mode }, '1995');
    onShowToast(
      mode === 'video'
        ? 'Mode Video Sinematik Beranda diaktifkan! 🎬'
        : 'Mode Gambar Statis Beranda diaktifkan.'
    );
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      onShowToast('Format file harus berupa video (.mp4, .webm, .mov)!');
      return;
    }

    try {
      setIsUploadingVideo(true);
      onShowToast('Memproses video & mengambil gambar awal otomatis...');

      // 1. Ekstrak frame awal otomatis sebagai gambar poster awalan
      let extractedPoster: string | null = null;
      try {
        setIsExtractingFrame(true);
        extractedPoster = await extractVideoFrame(file, 0.5);
      } catch (extractErr) {
        console.warn('Frame extraction notice:', extractErr);
      } finally {
        setIsExtractingFrame(false);
      }

      // Referensi video lama untuk dibersihkan dari storage Supabase
      const previousVideoUrl = heroVideoUrl;

      // 2. Upload video ke Supabase Storage (sinki-media/hero_video.mp4) dan otomatis hapus video lama
      onShowToast('Menghapus video lama & mengunggah video baru ke Supabase Cloud...');
      const cloudVideoUrl = await uploadVideoDirectlyToSupabase('hero_video.mp4', file, file.type, previousVideoUrl);
      const finalVideoUrl = cloudVideoUrl || URL.createObjectURL(file);

      setHeroVideoUrl(finalVideoUrl);
      setVideoUrlInput(finalVideoUrl);
      setHeroMediaType('video');

      if (extractedPoster) {
        setHeroVideoPoster(extractedPoster);
      }

      await saveHeroVideoSettingsToServer(
        {
          heroMediaType: 'video',
          heroVideoUrl: finalVideoUrl,
          oldVideoUrlToDelete: previousVideoUrl,
          ...(extractedPoster ? { heroVideoPoster: extractedPoster } : {}),
        },
        '1995'
      );

      onHeroVideoUpdated?.({
        heroMediaType: 'video',
        heroVideoUrl: finalVideoUrl,
        ...(extractedPoster ? { heroVideoPoster: extractedPoster } : {}),
      });

      onShowToast('Video baru aktif & video lama di Supabase otomatis terhapus! ✅');
    } catch (err) {
      console.error('Error uploading video:', err);
      onShowToast('Gagal mengunggah video.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSaveVideoUrl = async () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) {
      onShowToast('Tautan URL video tidak boleh kosong!');
      return;
    }

    try {
      setIsUploadingVideo(true);
      onShowToast('Menyimpan tautan video & menyinkronkan frame cover...');

      let extractedPoster: string | null = null;
      try {
        extractedPoster = await extractVideoFrame(trimmed, 0.5);
      } catch (extractErr) {
        console.warn('Remote URL extraction notice:', extractErr);
      }

      setHeroVideoUrl(trimmed);
      setHeroMediaType('video');
      if (extractedPoster) {
        setHeroVideoPoster(extractedPoster);
      }

      await saveHeroVideoSettingsToServer(
        {
          heroMediaType: 'video',
          heroVideoUrl: trimmed,
          ...(extractedPoster ? { heroVideoPoster: extractedPoster } : {}),
        },
        '1995'
      );

      onHeroVideoUpdated?.({
        heroMediaType: 'video',
        heroVideoUrl: trimmed,
        ...(extractedPoster ? { heroVideoPoster: extractedPoster } : {}),
      });

      onShowToast(
        extractedPoster
          ? 'Video tersimpan & cover otomatis mengikuti gambar video baru! ✅'
          : 'Tautan video berhasil disimpan! ✅'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan URL video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleCustomPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast('Mengompresi foto cover kustom...');
      const base64Data = await compressImage(file, 1080, 1080, 0.9);
      setHeroVideoPoster(base64Data);

      await saveHeroVideoSettingsToServer({ heroVideoPoster: base64Data }, '1995');
      onHeroVideoUpdated?.({ heroVideoPoster: base64Data });
      onShowToast('Foto cover kustom berhasil disimpan permanen! ✅');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan foto cover.');
    } finally {
      e.target.value = '';
    }
  };

  const handleExtractFrameNow = async () => {
    if (!heroVideoUrl) {
      onShowToast('Belum ada video yang aktif untuk diambil gambarnya.');
      return;
    }
    try {
      setIsExtractingFrame(true);
      onShowToast('Mengambil frame gambar dari video saat ini...');
      const frameData = await extractVideoFrame(heroVideoUrl, 0.5);
      setHeroVideoPoster(frameData);
      await saveHeroVideoSettingsToServer({ heroVideoPoster: frameData }, '1995');
      onHeroVideoUpdated?.({ heroVideoPoster: frameData });
      onShowToast('Gambar cover berhasil diperbarui mengikuti video saat ini! ✅');
    } catch (err) {
      console.warn('Manual extraction notice:', err);
      onShowToast('Tidak dapat mengambil frame langsung (CORS link eksternal). Silakan pilih "Ganti Foto Cover" manual.');
    } finally {
      setIsExtractingFrame(false);
    }
  };

  const handleRemoveHeroVideo = async () => {
    if (confirm('Hapus video hero dan kembali ke mode gambar botol standar?')) {
      const oldUrl = heroVideoUrl;
      setHeroVideoUrl('');
      setVideoUrlInput('');
      setHeroMediaType('image');

      if (oldUrl) {
        deleteFileFromSupabase(oldUrl).catch(() => {});
      }

      await saveHeroVideoSettingsToServer(
        {
          heroMediaType: 'image',
          heroVideoUrl: null,
          oldVideoUrlToDelete: oldUrl,
        },
        '1995'
      );
      onHeroVideoUpdated?.({
        heroMediaType: 'image',
        heroVideoUrl: null,
      });
      onShowToast('Video dinonaktifkan & file lama di Supabase berhasil dibersihkan.');
    }
  };

  // Authentication Barrier state (Auto-authenticate if valid owner token exists)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getOwnerToken()));
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
  const [perfumeCategoryFilter, setPerfumeCategoryFilter] = useState<
    CollectionCategoryKey | 'all'
  >('all');
  const [isAddingPerfume, setIsAddingPerfume] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<PerfumeItem | null>(null);
  const [editingAccordsStr, setEditingAccordsStr] = useState('');
  const [newPerfumeForm, setNewPerfumeForm] = useState<{
    name: string;
    tagline: string;
    accordsStr: string;
    collectionCategories: CollectionCategoryKey[];
    pricePerMl?: PricePerMlRate;
    usageRecommendation: string;
  }>({
    name: '',
    tagline: '',
    accordsStr: 'Warm, Floral, Woody',
    collectionCategories: ['daily_fresh'],
    usageRecommendation: '',
  });
  const [deleteConfirmPerfume, setDeleteConfirmPerfume] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isResetPerfumesConfirmOpen, setIsResetPerfumesConfirmOpen] = useState(false);

  useEffect(() => {
    if (perfumes) {
      setPerfumesList(perfumes);
    }
  }, [perfumes]);

  // Also fetch latest from server when Admin opens
  useEffect(() => {
    fetchPerfumesFromServer()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setPerfumesList(list);
          onPerfumesUpdated?.(list);
        }
      })
      .catch(() => {});
  }, []);

  const toggleCollectionCategoryInList = (
    current: CollectionCategoryKey[] | undefined,
    key: CollectionCategoryKey
  ): CollectionCategoryKey[] => {
    const arr = Array.isArray(current) ? [...current] : [];
    return arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];
  };

  const handleOpenEditPerfume = (item: PerfumeItem) => {
    const cats = Array.isArray(item.collectionCategories) ? [...item.collectionCategories] : [];
    setEditingPerfume({
      ...item,
      collectionCategories: cats,
      pricePerMl: cats.includes('new_trending')
        ? 4000
        : cats.includes('viral_hits')
        ? 3000
        : undefined,
      usageRecommendation: item.usageRecommendation || '',
    });
    setEditingAccordsStr((item.accords || []).join(', '));
  };

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
        : `"${target.name}" disembunyikan dari publik`
    );
    await savePerfumesToServer(updated);
  };

  const handleRemoveFromCurrentCategory = async (
    item: PerfumeItem,
    catKey: CollectionCategoryKey
  ) => {
    const catMeta = COLLECTION_CATEGORIES.find((c) => c.id === catKey);
    const currentCats = Array.isArray(item.collectionCategories) ? item.collectionCategories : [];
    const nextCats = currentCats.filter((c) => c !== catKey);
    const updated = perfumesList.map((p) =>
      p.id === item.id ? { ...p, collectionCategories: nextCats } : p
    );
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    onShowToast(
      `"${item.name}" dikeluarkan dari kategori ${catMeta?.title || catKey}`
    );
    await savePerfumesToServer(updated);
  };

  const handleSaveEditPerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerfume || !editingPerfume.name.trim()) return;
    const parsedAccords = editingAccordsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const resolvedCats = Array.isArray(editingPerfume.collectionCategories)
      ? editingPerfume.collectionCategories
      : [];
    const resolvedRate: PricePerMlRate | undefined = resolvedCats.includes('new_trending')
      ? 4000
      : resolvedCats.includes('viral_hits')
      ? 3000
      : undefined;

    const updatedItem: PerfumeItem = {
      ...editingPerfume,
      name: editingPerfume.name.trim(),
      category: editingPerfume.category || 'unisex',
      categoryLabel: editingPerfume.categoryLabel || 'SINKI Signature',
      tagline: editingPerfume.tagline.trim(),
      accords: parsedAccords.length > 0 ? parsedAccords : editingPerfume.accords,
      collectionCategories: resolvedCats,
      pricePerMl: resolvedRate,
      usageRecommendation: (editingPerfume.usageRecommendation || '').trim(),
    };
    const updated = perfumesList.map((p) => (p.id === updatedItem.id ? updatedItem : p));
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    setEditingPerfume(null);
    onShowToast(`Varian "${updatedItem.name}" berhasil diperbarui & tersinkron ke Collection!`);
    await savePerfumesToServer(updated);
  };

  const handleAddNewPerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerfumeForm.name.trim()) {
      onShowToast('Nama varian tidak boleh kosong!');
      return;
    }
    const accords = newPerfumeForm.accordsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const resolvedCats = newPerfumeForm.collectionCategories;
    const resolvedRate: PricePerMlRate | undefined = resolvedCats.includes('new_trending')
      ? 4000
      : resolvedCats.includes('viral_hits')
      ? 3000
      : undefined;

    const newItem: PerfumeItem = {
      id: `p-${Date.now()}`,
      name: newPerfumeForm.name.trim(),
      category: 'unisex',
      categoryLabel: 'SINKI Signature',
      tagline: newPerfumeForm.tagline.trim() || 'Aroma Mewah Khas SINKI',
      accords: accords.length > 0 ? accords : ['Luxury', 'Signature'],
      isActive: true,
      collectionCategories: resolvedCats,
      pricePerMl: resolvedRate,
      usageRecommendation: newPerfumeForm.usageRecommendation.trim(),
    };
    const updated = [newItem, ...perfumesList];
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    setIsAddingPerfume(false);
    setNewPerfumeForm({
      name: '',
      tagline: '',
      accordsStr: 'Warm, Floral, Woody',
      collectionCategories: ['daily_fresh'],
      usageRecommendation: '',
    });
    onShowToast(`Varian baru "${newItem.name}" berhasil ditambahkan & tampil di Collection!`);
    await savePerfumesToServer(updated);
  };

  const handleDeletePerfume = (id: string, name: string) => {
    setDeleteConfirmPerfume({ id, name });
  };

  const confirmDeletePerfumeNow = async () => {
    if (!deleteConfirmPerfume) return;
    const { id, name } = deleteConfirmPerfume;
    setDeleteConfirmPerfume(null);
    const updated = perfumesList.filter((p) => p.id !== id);
    setPerfumesList(updated);
    onPerfumesUpdated?.(updated);
    onShowToast(`Menghapus varian "${name}" dari cloud...`);
    await savePerfumesToServer(updated);
    onShowToast(`Varian "${name}" berhasil dihapus & tersinkron ke publik!`);
  };

  const handleResetPerfumes = () => {
    setIsResetPerfumesConfirmOpen(true);
  };

  const confirmResetPerfumesNow = async () => {
    setIsResetPerfumesConfirmOpen(false);
    try {
      onShowToast('Mereset katalog ke 68 varian awal...');
      const def = await resetPerfumesToDefault();
      setPerfumesList(def);
      onPerfumesUpdated?.(def);
      onShowToast('Katalog berhasil di-reset ke 68 varian & tersinkron ke cloud publik!');
    } catch (err) {
      console.error(err);
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
  const [newCategory, setNewCategory] = useState<'tips' | 'promo' | 'story'>('tips');
  const [newContent, setNewContent] = useState('');

  const handleAddArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      onShowToast('Judul dan isi konten tidak boleh kosong!');
      return;
    }
    const catLabels: Record<string, string> = {
      tips: 'Tips Perawatan',
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

  const [isPurgingCache, setIsPurgingCache] = useState(false);

  const handlePurgeAndSyncCache = async () => {
    setIsPurgingCache(true);
    onShowToast('Membersihkan seluruh cache & menyinkronkan data cloud...');
    try {
      await purgeSinkiBrowserCache();
      const freshPerfumes = await fetchPerfumesFromServer();
      if (freshPerfumes && Array.isArray(freshPerfumes)) {
        setPerfumesList(freshPerfumes);
        onPerfumesUpdated?.(freshPerfumes);
      }
      onShowToast('Pembersihan cache tuntas! Website publik sinkiparfum.my.id 100% segar & tersinkron. ✨');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membersihkan cache. Silakan coba kembali.');
    } finally {
      setIsPurgingCache(false);
    }
  };

  // PIN validation handler with server security & master PIN safeguard
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pinVal = enteredPin.trim();
    if (!pinVal) return;

    if (pinVal === '1995') {
      setOwnerToken('token-owner-1995');
      setIsAuthenticated(true);
      setPinError('');
      onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
      return;
    }

    try {
      const res = await verifyOwnerPinOnServer(pinVal);
      if (res.success && res.token) {
        setOwnerToken(res.token);
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
        return;
      }
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);
      setPinError(res.error || 'PIN Rahasia salah!');
      setEnteredPin('');
      if (nextAttempt >= 5) {
        onShowToast('Akses ditolak! Mengalihkan ke halaman publik...');
        onExitToPublic();
      }
    } catch {
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);
      setPinError('PIN Rahasia salah atau koneksi bermasalah!');
      setEnteredPin('');
      if (nextAttempt >= 5) {
        onShowToast('Akses ditolak! Mengalihkan ke halaman publik...');
        onExitToPublic();
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
        const savedUrl = await saveTop11PhotoToServer(target, adjustedBase64, '1995');
        const photoToUse = savedUrl || adjustedBase64;
        onTop11PhotoUpdated?.(target, photoToUse);
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
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% -10%, var(--arch-card-top) 0%, var(--arch-canvas-mid) 48%, var(--arch-canvas-bot) 100%)',
      }}
    >
      {/* 0. Ethereal Haute Parfumerie Silk Smoke Wisps (Tinted by Active Luxury Theme) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'linear-gradient(140deg, var(--arch-gold-soft) 0%, var(--arch-gold-bright) 35%, var(--arch-gold) 75%, var(--arch-gold-deep) 100%)',
          WebkitMaskImage: 'url("/assets/smoke/sinki-canvas-smoke.webp")',
          maskImage: 'url("/assets/smoke/sinki-canvas-smoke.webp")',
          WebkitMaskSize: 'cover',
          maskSize: 'cover',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />

      {/* 1. Ambient Metallic Blooms */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[380px] rounded-full blur-[100px]"
        style={{ background: 'var(--arch-glow-tl)' }}
      />
      <div
        className="absolute top-1/4 -right-20 w-[550px] h-[550px] rounded-full blur-[130px]"
        style={{ background: 'var(--arch-badge-bg-soft)' }}
      />
      <div
        className="absolute -bottom-24 -left-20 w-[600px] h-[600px] rounded-full blur-[130px]"
        style={{ background: 'var(--arch-glow-br)' }}
      />

      {/* 4. Fine Atelier Corner Marks */}
      <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-body tracking-[0.14em] text-amber-400/15 uppercase">
        <span>+</span>
        <span className="hidden sm:inline">SINKI PARFUM | DEFINE YOUR PRESENCE</span>
      </div>
      <div className="absolute top-4 right-6 flex items-center gap-2 text-xs font-body tracking-[0.14em] text-amber-400/15 uppercase">
        <span className="hidden sm:inline">ATELIER PRIVÉ</span>
        <span>+</span>
      </div>
      <div className="absolute bottom-4 left-6 flex items-center gap-2 text-xs font-body tracking-[0.14em] text-amber-400/15 uppercase">
        <span>+</span>
        <span className="hidden sm:inline">CONTROL SECURE</span>
      </div>
      <div className="absolute bottom-4 right-6 flex items-center gap-2 text-xs font-body tracking-[0.14em] text-amber-400/15 uppercase">
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
      <div className="fixed inset-0 z-50 bg-[#060609] sinki-admin-calm font-body flex flex-col items-center justify-center p-4 text-slate-100 select-none overflow-hidden">
        <AdminLuxuryBackground />

        <div className="relative z-10 w-full max-w-sm rounded-[10px] sinki-arch-modal backdrop-blur-xl border p-6 sm:p-7 text-center space-y-5">
          {/* Sinki Lock Emblem */}
          <div className="relative mx-auto w-14 h-14 rounded-[8px] sinki-arch-subbox border p-3 flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7 text-[#E8C782] drop-shadow-[0_2px_8px_rgba(212,175,106,0.4)]" />
          </div>

          <div>
            <span className="text-xs tracking-[0.14em] text-[#D4AF6A] uppercase font-semibold block mb-1">
              SINKI PARFUM · DEFINE YOUR PRESENCE
            </span>
            <h1 className="font-heading text-2xl font-bold tracking-[0.06em] leading-[1.2] text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5C2] via-[#E8B960] to-[#B3791B]">
              DIMENSI-SINKI
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
              Gerbang Khusus Pengendali Utama SINKI
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN Rahasia (1995)"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value;
                setEnteredPin(val);
                setPinError('');
                if (val.trim() === '1995') {
                  setOwnerToken('token-owner-1995');
                  setIsAuthenticated(true);
                  onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
                }
              }}
              autoFocus
              className="w-full py-2.5 px-4 rounded-[8px] sinki-arch-input border text-center tabular-nums text-xl font-semibold tracking-[0.35em] text-[#F3E6C8] focus:outline-none placeholder:tracking-normal placeholder:text-slate-500 placeholder:text-sm transition-colors"
            />

            <button
              type="button"
              onClick={() => {
                setOwnerToken('token-owner-1995');
                setIsAuthenticated(true);
                onShowToast('Selamat datang di Dimensi-Sinki, Owner 👑');
              }}
              className="w-full py-2 px-3 rounded-[6px] bg-[#DFB76C]/15 hover:bg-[#DFB76C]/25 border border-[#DFB76C]/35 text-[#F3E6C8] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles size={14} className="text-[#DFB76C]" />
              <span>Masuk Cepat dengan PIN 1995</span>
            </button>

            {pinError && (
              <p className="text-xs text-red-400 font-semibold animate-pulse">
                {pinError} ({3 - attemptCount} kesempatan tersisa)
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-110 active:scale-98 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-black/50"
            >
              Buka Dimensi Sinki
            </button>
          </form>

          <button
            onClick={onExitToPublic}
            className="text-xs text-slate-400 hover:text-[#E8C782] font-medium transition-colors"
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

  interface NavGroupDef {
    groupTitle: string;
    items: NavItemDef[];
  }

  // Nav Groups Definitions (Terorganisir Rapi Sesuai Kategori)
  const navGroups: NavGroupDef[] = [
    {
      groupTitle: 'Ringkasan & Analitik',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Grafik Pengunjung', badge: 'Live', icon: BarChart3 },
        { id: 'security', label: 'Keamanan Sistem', badge: '100%', icon: ShieldCheck },
      ],
    },
    {
      groupTitle: 'Katalog & Tampilan',
      items: [
        { id: 'media', label: 'Media & Video Hero', icon: ImageIcon },
        { id: 'variants', label: 'Katalog Varian', badge: perfumesList.length.toString(), icon: Package },
        { id: 'banner', label: 'Teks & Harga', icon: Sliders },
      ],
    },
    {
      groupTitle: 'Pelanggan & Konten',
      items: [
        { id: 'reviews', label: 'Ulasan Masuk', badge: reviewsList.length.toString(), icon: MessageSquare },
        { id: 'content', label: 'Artikel Edukasi', badge: articlesList.length.toString(), icon: FileText },
      ],
    },
    {
      groupTitle: 'Sistem',
      items: [
        { id: 'settings', label: 'Pengaturan & Brand', icon: Settings },
      ],
    },
  ];

  const navItems: NavItemDef[] = navGroups.flatMap((g) => g.items);

  // ========================================================
  // 2. TAMPILAN DASHBOARD PROFESIONAL: ADAPTIVE DESKTOP + MOBILE
  // ========================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#060609] sinki-admin-calm text-slate-100 flex flex-col lg:flex-row overflow-hidden font-body select-none">
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 lg:w-64 xl:w-72 sinki-arch-modal border-r flex flex-col justify-between p-4 sm:p-5 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Top Brand Block */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D4AF6A]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] sinki-arch-subbox border p-1.5 flex items-center justify-center shadow-md shrink-0">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Sparkles size={20} className="text-[#E8C782]" />
                )}
              </div>
              <div>
                <span className="font-heading text-base font-bold tracking-[0.06em] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5C2] via-[#E8B960] to-[#B3791B] block">
                  DIMENSI-SINKI
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  Portal Kendali Owner
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden w-7 h-7 rounded-[6px] sinki-arch-subbox border hover:border-[#D4AF6A]/55 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>


          {/* Navigation Menu Terorganisir per Kategori */}
          <nav className="space-y-4 overflow-y-auto no-scrollbar max-h-[calc(100vh-250px)] pr-1">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-xs font-semibold text-[#D4AF6A] px-2 block">
                  {group.groupTitle}
                </span>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu(item.id as MenuKey);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-[8px] text-xs sm:text-sm font-medium transition-all active:scale-98 ${
                          isActive
                            ? 'sinki-arch-card-selected text-[#F3E6C8] border font-semibold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className={isActive ? 'text-[#E8C782]' : 'text-slate-400'} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-xs tabular-nums px-2 py-0.5 rounded-[4px] font-semibold leading-none ${
                              isActive
                                ? 'bg-[#D4AF6A]/25 text-[#F3E6C8]'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Status & Logout */}
        <div className="pt-4 border-t border-[#D4AF6A]/20 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-semibold">
                Sistem Terhubung
              </span>
            </div>
            <span className="text-xs text-slate-400 tabular-nums">v1.2.0</span>
          </div>

          <button
            onClick={onExitToPublic}
            className="w-full py-2 px-3 rounded-[8px] bg-red-950/30 hover:bg-red-950/50 border border-red-500/35 text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogOut size={14} />
            <span>Kunci & Keluar</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          AREA KONTEN UTAMA (Widescreen di Desktop, Responsive di Mobile)
         ======================================================== */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
        {/* TOP BAR HEADER */}
        <header className="sticky top-0 z-30 sinki-arch-header backdrop-blur-md px-4 sm:px-6 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile only) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden h-8 px-2.5 rounded-[6px] sinki-arch-subbox border hover:border-[#D4AF6A]/55 flex items-center justify-center gap-1.5 text-[#E8C782] active:scale-95 transition-all shrink-0 text-xs font-semibold"
              title="Buka Menu"
            >
              <ChevronRight size={15} />
              <span>Menu</span>
            </button>

            {/* Breadcrumb Display */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400">
                <span className="font-heading font-bold text-[#E8C782] shrink-0">DIMENSI-SINKI</span>
                <span>/</span>
                <span className="text-slate-200 font-medium truncate">{menuLabels[activeMenu]}</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bersihkan Cache & Force Sync */}
            <button
              onClick={handlePurgeAndSyncCache}
              disabled={isPurgingCache}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-[8px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="Bersihkan cache browser & sinkronkan ulang seluruh data publik"
            >
              <RefreshCw size={13} className={isPurgingCache ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">
                {isPurgingCache ? 'Membersihkan...' : 'Bersihkan Cache'}
              </span>
            </button>

            {/* Pintasan Tema Warna Luxury */}
            <button
              type="button"
              onClick={() => setActiveMenu('settings')}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-[8px] sinki-arch-subbox hover:border-[#D4AF6A]/65 border text-[#E8C782] text-xs font-semibold transition-all active:scale-95"
              title={`Tema Aktif: ${activeThemeMeta.name} — Klik untuk ganti warna tema`}
            >
              <span
                className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                style={{
                  backgroundColor: activeThemeMeta.brightHex,
                  boxShadow: `0 0 6px ${activeThemeMeta.accentHex}`,
                }}
              />
              <Palette size={13} />
              <span className="hidden md:inline">{activeThemeMeta.name}</span>
            </button>

            {/* Live Web Preview Shortcut */}
            <button
              onClick={onExitToPublic}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-[8px] sinki-arch-subbox hover:border-[#D4AF6A]/65 border text-[#E8C782] text-xs font-semibold transition-all active:scale-95"
              title="Buka Website Publik"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Lihat Web Publik</span>
            </button>
          </div>
        </header>

        {/* HORIZONTAL QUICK TAB BAR (MOBILE ONLY — DESKTOP SUDAH PAKAI SIDEBAR KIRI) */}
        <div className="lg:hidden sticky top-[53px] z-20 bg-[#09090d]/95 backdrop-blur-md border-b border-[#D4AF6A]/25 px-3 py-2 shadow-md">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id as MenuKey)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[8px] text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 active:scale-95 select-none ${
                    isActive
                      ? 'sinki-arch-card-selected text-[#F3E6C8] border font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent font-medium'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#E8C782]' : 'text-slate-400'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-xs tabular-nums px-1.5 py-0.5 rounded-[4px] font-semibold leading-none ${
                        isActive
                          ? 'bg-[#D4AF6A]/25 text-[#F3E6C8] border border-[#D4AF6A]/40'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTAINER ISI KONTEN (Widescreen di Laptop: max-w-7xl, fluid p-6) */}
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 pb-12">
          
          {/* ========================================================
              TAB 1: DASHBOARD UTAMA
             ======================================================== */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#E8C782] uppercase tracking-[0.12em] font-semibold">
                      Portal Pengelola
                    </span>
                    <Crown size={15} className="text-[#E8C782]" />
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-[1.2] text-white mt-1 tracking-[-0.015em]">
                    Selamat Datang, Owner
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md leading-[1.5]">
                    Kelola stok katalog, foto media, teks berjalan, ulasan, dan harga secara real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 sinki-arch-subbox border px-3.5 py-2.5 rounded-[8px] shrink-0 self-start sm:self-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <span className="text-xs text-slate-400">Status Server: Normal</span>
                  </div>
                </div>
              </div>

              {/* Ringkasan Cepat 6 Kartu Utama (Langsung buka fungsi masing-masing) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div
                  onClick={() => setActiveMenu('variants')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#E8C782]">
                    <Package size={20} className="text-[#E8C782]" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Katalog Varian</span>
                    <span className="text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-[1.15] block mt-0.5">{perfumesList.length}</span>
                    <span className="text-xs text-slate-400 block mt-1">Atur stok & edit aroma</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('media')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#E8C782]">
                    <ImageIcon size={20} className="text-[#E8C782]" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Media & Galeri</span>
                    <span className="text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-[1.15] block mt-0.5">{Object.keys(top11Photos).length + 3}</span>
                    <span className="text-xs text-slate-400 block mt-1">Video hero, logo, QRIS & botol</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('banner')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#E8C782]">
                    <Sliders size={20} className="text-[#E8C782]" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Teks & Harga</span>
                    <span className="text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-[1.15] block mt-0.5">3 Tier</span>
                    <span className="text-xs text-slate-400 block mt-1">Running text & tarif botol</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('reviews')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#E8C782]">
                    <MessageSquare size={20} className="text-[#E8C782]" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Ulasan Masuk</span>
                    <span className="text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-[1.15] block mt-0.5">{reviewsList.length}</span>
                    <span className="text-xs text-slate-400 block mt-1">Ulasan pembeli terverifikasi</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('analytics')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-[#E8C782]">
                    <BarChart3 size={20} className="text-[#E8C782]" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Grafik Pengunjung</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-300 leading-[1.2] block mt-0.5">Live</span>
                    <span className="text-xs text-slate-400 block mt-1">Sumber trafik IG, TikTok & WA</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu('security')}
                  className="p-4 sm:p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border cursor-pointer transition-all active:scale-98 group space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-300">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">Keamanan & Cache</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-300 leading-[1.2] block mt-0.5">100%</span>
                    <span className="text-xs text-slate-400 block mt-1">Ganti PIN, cache & cek link</span>
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
                  <h2 className="font-heading text-xl font-bold leading-[1.25] text-[#F3E6C8] flex items-center gap-2 tracking-[-0.015em]">
                    <BarChart3 size={20} className="text-[#E8C782] shrink-0" />
                    <span>Statistik & Grafik Pengunjung SINKI</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Pantau dari mana kebanyakan pengguna masuk ke website Sinki secara real-time.
                  </p>
                </div>
              </div>

              <div className="rounded-[10px] sinki-arch-card border p-2 sm:p-4">
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
                  <h2 className="font-heading text-xl font-bold leading-[1.25] text-[#F3E6C8] tracking-[-0.015em]">
                    Katalog Varian & 6 Kategori Collection ({perfumesList.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-[1.45]">
                    Kelola 4 Kategori Utama (Daily Fresh, Professional, Attraction, Luxury), Viral Hits (Rp3.000/ml), dan New & Trending (Rp4.000/ml).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const isSixCat = COLLECTION_CATEGORIES.some(
                        (c) => c.id === perfumeCategoryFilter
                      );
                      setNewPerfumeForm((prev) => ({
                        ...prev,
                        collectionCategories: isSixCat
                          ? [perfumeCategoryFilter as CollectionCategoryKey]
                          : ['daily_fresh'],
                      }));
                      setIsAddingPerfume(true);
                    }}
                    className="py-2 px-3.5 rounded-[6px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Plus size={15} />
                    <span>Tambah Varian Baru</span>
                  </button>
                  <button
                    onClick={handleResetPerfumes}
                    className="py-2 px-3 rounded-[6px] sinki-arch-subbox hover:border-[#D4AF6A]/55 text-slate-300 hover:text-white text-xs sm:text-sm font-medium border flex items-center gap-1.5 transition-colors"
                    title="Reset ke 68 Varian Bawaan"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">Reset Default</span>
                  </button>
                </div>
              </div>

              {/* 6 COLLECTION CATEGORY FILTER CARDS (ARCHITECTURAL ANTI-CAPSULE) */}
              <div className="p-4 rounded-[8px] sinki-arch-card border space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-heading text-sm font-semibold text-slate-200">
                    Filter 6 Kategori Halaman Collection
                  </span>
                  <div className="flex items-center gap-2">
                    {COLLECTION_CATEGORIES.some((c) => c.id === perfumeCategoryFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPerfumeForm((prev) => ({
                            ...prev,
                            collectionCategories: [perfumeCategoryFilter as CollectionCategoryKey],
                          }));
                          setIsAddingPerfume(true);
                        }}
                        className="py-1.5 px-2.5 rounded-[6px] text-xs font-semibold sinki-arch-subbox hover:border-[#D4AF6A]/65 text-[#E8C782] border flex items-center gap-1 transition-colors"
                      >
                        <Plus size={12} />
                        <span>
                          Tambah ke{' '}
                          {COLLECTION_CATEGORIES.find((c) => c.id === perfumeCategoryFilter)?.title}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPerfumeCategoryFilter('all')}
                      className={`py-1.5 px-2.5 rounded-[6px] text-xs font-semibold border transition-colors tabular-nums ${
                        perfumeCategoryFilter === 'all'
                          ? 'bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 border-[#E8C782]'
                          : 'sinki-arch-subbox text-slate-300 hover:text-white'
                      }`}
                    >
                      Semua Varian ({perfumesList.length})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {COLLECTION_CATEGORIES.map((cat) => {
                    const isSelected = perfumeCategoryFilter === cat.id;
                    const count = perfumesList.filter(
                      (p) =>
                        Array.isArray(p.collectionCategories) &&
                        p.collectionCategories.includes(cat.id)
                    ).length;
                    const catRateBadge =
                      cat.id === 'viral_hits'
                        ? 'Rp3.000/ml'
                        : cat.id === 'new_trending'
                        ? 'Rp4.000/ml'
                        : null;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setPerfumeCategoryFilter((prev) => (prev === cat.id ? 'all' : cat.id))
                        }
                        className={`text-left p-2.5 rounded-[6px] border transition-all flex flex-col justify-between min-h-[64px] ${
                          isSelected
                            ? 'sinki-arch-card-selected text-white shadow-sm'
                            : 'sinki-arch-subbox hover:border-[#D4AF6A]/55 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-heading text-xs sm:text-[13px] font-semibold truncate">
                            {cat.title}
                          </span>
                          <span
                            className={`text-xs tabular-nums ${
                              isSelected ? 'text-[#E8C782] font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 line-clamp-1 mt-1">
                          {catRateBadge ? `${catRateBadge} · ${cat.subtitle}` : cat.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Base Gender Filter Row */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[#D4AF6A]/20">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF6A]/80" />
                    <input
                      type="text"
                      value={perfumeSearchQuery}
                      onChange={(e) => setPerfumeSearchQuery(e.target.value)}
                      placeholder="Cari nama varian, karakter aroma, atau rekomendasi penggunaan..."
                      className="w-full py-2 pl-9 pr-8 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
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
                </div>
              </div>

              {/* GRID VARIAN (SERAGAM DI SEMUA 6 KATEGORI DENGAN EDIT, HIDE/SHOW, & HAPUS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {perfumesList
                  .filter((item) => {
                    let matchCategory = true;
                    if (perfumeCategoryFilter !== 'all') {
                      matchCategory =
                        Array.isArray(item.collectionCategories) &&
                        item.collectionCategories.includes(
                          perfumeCategoryFilter as CollectionCategoryKey
                        );
                    }

                    const q = perfumeSearchQuery.trim().toLowerCase();
                    const matchSearch =
                      !q ||
                      item.name.toLowerCase().includes(q) ||
                      item.tagline.toLowerCase().includes(q) ||
                      (item.usageRecommendation || '').toLowerCase().includes(q) ||
                      item.accords.some((a) => a.toLowerCase().includes(q));

                    return matchCategory && matchSearch;
                  })
                  .map((item) => {
                    const isItemActive = item.isActive !== false;
                    const itemCats = Array.isArray(item.collectionCategories)
                      ? item.collectionCategories
                      : [];
                    const activeSixCatFilter = COLLECTION_CATEGORIES.find(
                      (c) => c.id === perfumeCategoryFilter
                    );

                    // Keterangan tarif per ml HANYA tampil untuk Viral Hits (Rp3.000/ml) & New & Trending (Rp4.000/ml)
                    const cardPerMlBadge =
                      perfumeCategoryFilter === 'new_trending'
                        ? `Rp ${(pricingForm.premiumRatePerMl || 4000).toLocaleString('id-ID')}/ml`
                        : perfumeCategoryFilter === 'viral_hits'
                        ? `Rp ${(pricingForm.mykonosRatePerMl || 3000).toLocaleString('id-ID')}/ml`
                        : perfumeCategoryFilter === 'all'
                        ? itemCats.includes('new_trending')
                          ? `Rp ${(pricingForm.premiumRatePerMl || 4000).toLocaleString('id-ID')}/ml`
                          : itemCats.includes('viral_hits')
                          ? `Rp ${(pricingForm.mykonosRatePerMl || 3000).toLocaleString('id-ID')}/ml`
                          : null
                        : null;

                    const primaryCategoryTitle = activeSixCatFilter
                      ? activeSixCatFilter.title
                      : itemCats.length > 0
                      ? COLLECTION_CATEGORIES.find((m) => m.id === itemCats[0])?.title || 'Collection'
                      : 'Aroma Signature';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-[8px] border transition-all flex flex-col justify-between gap-3 ${
                          isItemActive
                            ? 'sinki-arch-card sinki-arch-card-interactive'
                            : 'bg-[#0b0b0f] border-rose-500/25 opacity-75'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Top metadata + Uniform 3 Action Buttons (Show/Hide, Edit, Delete) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                                <span className="text-[#E8C782] font-semibold">
                                  {primaryCategoryTitle}
                                </span>
                                {cardPerMlBadge && (
                                  <>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-slate-200 font-semibold">
                                      {cardPerMlBadge}
                                    </span>
                                  </>
                                )}
                                <span className="text-slate-600">·</span>
                                <span
                                  className={
                                    isItemActive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'
                                  }
                                >
                                  {isItemActive ? 'Aktif' : 'Disembunyikan'}
                                </span>
                              </div>

                              <h4 className="font-heading font-semibold text-base text-white mt-1 leading-[1.3]">
                                {item.name}
                              </h4>
                            </div>

                            {/* Uniform Actions across ALL 6 cards */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPerfume(item)}
                                className="p-1.5 rounded-[5px] sinki-arch-subbox hover:border-[#D4AF6A]/65 text-slate-300 hover:text-[#E8C782] border transition-colors"
                                title="Edit Info & Kategori"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePerfumeStatus(item.id)}
                                className={`p-1.5 rounded-[5px] border transition-colors ${
                                  isItemActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                                }`}
                                title={
                                  isItemActive
                                    ? 'Sembunyikan sementara dari publik'
                                    : 'Tampilkan kembali di publik'
                                }
                              >
                                {isItemActive ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePerfume(item.id, item.name)}
                                className="p-1.5 rounded-[5px] sinki-arch-subbox hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 border transition-colors"
                                title="Hapus Varian Permanen"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Character & Usage Recommendation */}
                          <div className="text-xs space-y-1 sinki-arch-subbox p-2.5 rounded-[6px] border leading-[1.45]">
                            <p className="text-slate-200">
                              <span className="text-slate-400">Karakter: </span>
                              {item.tagline || '-'}
                            </p>
                            {item.usageRecommendation && (
                              <p className="text-slate-300">
                                <span className="text-slate-400">Penggunaan: </span>
                                {item.usageRecommendation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Assigned Collection Categories + Quick Remove from Active Category */}
                        <div className="pt-2 border-t border-[#D4AF6A]/15 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400">Collection:</span>
                            {itemCats.length === 0 ? (
                              <span className="text-slate-500 italic">Belum masuk kategori</span>
                            ) : (
                              <span className="text-[#F3E6C8] font-medium">
                                {itemCats
                                  .map(
                                    (cid) =>
                                      COLLECTION_CATEGORIES.find((m) => m.id === cid)?.title || cid
                                  )
                                  .join(' · ')}
                              </span>
                            )}
                          </div>

                          {activeSixCatFilter && itemCats.includes(activeSixCatFilter.id) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFromCurrentCategory(item, activeSixCatFilter.id)
                              }
                              className="w-full py-1.5 px-2.5 rounded-[6px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <X size={12} />
                              <span>Keluarkan dari {activeSixCatFilter.title}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* MODAL EDIT VARIAN */}
              {editingPerfume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-body">
                  <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[10px] sinki-arch-modal border p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D4AF6A]/20">
                      <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                        Edit Varian & Kategori Collection
                      </h3>
                      <button
                        onClick={() => setEditingPerfume(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditPerfume} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Nama Varian *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPerfume.name}
                          onChange={(e) =>
                            setEditingPerfume({ ...editingPerfume, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      {/* 4 Kategori Kebutuhan (Multi-Pilihan — Harga Paket Botol Reguler) */}
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">
                          4 Kategori Utama (Harga Paket Botol Reguler)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {COLLECTION_CATEGORIES.filter((c) => c.group === 'need').map((cat) => {
                            const checked = (editingPerfume.collectionCategories || []).includes(
                              cat.id
                            );
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() =>
                                  setEditingPerfume({
                                    ...editingPerfume,
                                    collectionCategories: toggleCollectionCategoryInList(
                                      editingPerfume.collectionCategories,
                                      cat.id
                                    ),
                                  })
                                }
                                className={`p-2 rounded-[6px] border text-left flex items-center justify-between text-xs transition-colors ${
                                  checked
                                    ? 'sinki-arch-card-selected text-white font-semibold'
                                    : 'sinki-arch-subbox text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{cat.title}</span>
                                {checked && <Check size={13} className="text-[#E8C782] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2 Kategori Tren & Popularitas (Khusus Tarif per ml: Viral Hits 3.000/ml & New & Trending 4.000/ml) */}
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">
                          Kategori Khusus Tarif per ml (Opsional)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {COLLECTION_CATEGORIES.filter((c) => c.group === 'trend').map((cat) => {
                            const checked = (editingPerfume.collectionCategories || []).includes(
                              cat.id
                            );
                            const rateNote = cat.id === 'viral_hits' ? 'Rp3.000/ml' : 'Rp4.000/ml';
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() =>
                                  setEditingPerfume({
                                    ...editingPerfume,
                                    collectionCategories: toggleCollectionCategoryInList(
                                      editingPerfume.collectionCategories,
                                      cat.id
                                    ),
                                  })
                                }
                                className={`p-2 rounded-[6px] border text-left flex items-center justify-between gap-1 text-xs transition-colors ${
                                  checked
                                    ? 'sinki-arch-card-selected text-white font-semibold'
                                    : 'sinki-arch-subbox text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="truncate">
                                  {cat.title} · {rateNote}
                                </span>
                                {checked && <Check size={13} className="text-[#E8C782] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Karakter Aroma
                        </label>
                        <input
                          type="text"
                          value={editingPerfume.tagline}
                          onChange={(e) =>
                            setEditingPerfume({ ...editingPerfume, tagline: e.target.value })
                          }
                          placeholder="Contoh: Calabrian Bergamot & Sichuan Pepper"
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Rekomendasi Penggunaan
                        </label>
                        <input
                          type="text"
                          value={editingPerfume.usageRecommendation || ''}
                          onChange={(e) =>
                            setEditingPerfume({
                              ...editingPerfume,
                              usageRecommendation: e.target.value,
                            })
                          }
                          placeholder="Contoh: Aktivitas harian, rapat formal, atau kencan malam"
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Notes / Accords (Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          value={editingAccordsStr}
                          onChange={(e) => setEditingAccordsStr(e.target.value)}
                          placeholder="Fresh Spicy, Amber, Citrus"
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPerfume(null)}
                          className="flex-1 py-2 rounded-[6px] bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-[6px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-body">
                  <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[10px] sinki-arch-modal border p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D4AF6A]/20">
                      <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                        Tambah Varian Baru ke Katalog & Collection
                      </h3>
                      <button
                        onClick={() => setIsAddingPerfume(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleAddNewPerfume} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
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
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      {/* 4 Kategori Utama (Harga Paket Botol Reguler) */}
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">
                          4 Kategori Utama (Harga Paket Botol Reguler)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {COLLECTION_CATEGORIES.filter((c) => c.group === 'need').map((cat) => {
                            const checked = newPerfumeForm.collectionCategories.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() =>
                                  setNewPerfumeForm({
                                    ...newPerfumeForm,
                                    collectionCategories: toggleCollectionCategoryInList(
                                      newPerfumeForm.collectionCategories,
                                      cat.id
                                    ),
                                  })
                                }
                                className={`p-2 rounded-[6px] border text-left flex items-center justify-between text-xs transition-colors ${
                                  checked
                                    ? 'sinki-arch-card-selected text-white font-semibold'
                                    : 'sinki-arch-subbox text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{cat.title}</span>
                                {checked && <Check size={13} className="text-[#E8C782] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kategori Khusus Tarif per ml (Viral Hits 3.000/ml & New & Trending 4.000/ml) */}
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">
                          Kategori Khusus Tarif per ml (Opsional)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {COLLECTION_CATEGORIES.filter((c) => c.group === 'trend').map((cat) => {
                            const checked = newPerfumeForm.collectionCategories.includes(cat.id);
                            const rateNote = cat.id === 'viral_hits' ? 'Rp3.000/ml' : 'Rp4.000/ml';
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() =>
                                  setNewPerfumeForm({
                                    ...newPerfumeForm,
                                    collectionCategories: toggleCollectionCategoryInList(
                                      newPerfumeForm.collectionCategories,
                                      cat.id
                                    ),
                                  })
                                }
                                className={`p-2 rounded-[6px] border text-left flex items-center justify-between gap-1 text-xs transition-colors ${
                                  checked
                                    ? 'sinki-arch-card-selected text-white font-semibold'
                                    : 'sinki-arch-subbox text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="truncate">
                                  {cat.title} · {rateNote}
                                </span>
                                {checked && <Check size={13} className="text-[#E8C782] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Karakter Aroma
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Sweet Floral & Red Berries"
                          value={newPerfumeForm.tagline}
                          onChange={(e) =>
                            setNewPerfumeForm({ ...newPerfumeForm, tagline: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Rekomendasi Penggunaan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Aktivitas harian, kencan sore, atau rapat formal"
                          value={newPerfumeForm.usageRecommendation}
                          onChange={(e) =>
                            setNewPerfumeForm({
                              ...newPerfumeForm,
                              usageRecommendation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Accords (Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          placeholder="Vanilla, Woody, Sweet"
                          value={newPerfumeForm.accordsStr}
                          onChange={(e) =>
                            setNewPerfumeForm({ ...newPerfumeForm, accordsStr: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-[6px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingPerfume(false)}
                          className="flex-1 py-2 rounded-[6px] bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-[6px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm"
                        >
                          Tambah Sekarang
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL KONFIRMASI HAPUS VARIAN PERMANEN */}
              {deleteConfirmPerfume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-body">
                  <div className="w-full max-w-sm rounded-[10px] sinki-arch-modal border border-rose-500/40 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                      <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                        Hapus Varian Parfum?
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmPerfume(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-[1.5]">
                      Anda yakin ingin menghapus permanen varian{' '}
                      <span className="font-semibold text-white">"{deleteConfirmPerfume.name}"</span>{' '}
                      dari seluruh katalog & halaman Collection?
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmPerfume(null)}
                        className="flex-1 py-2 rounded-[6px] bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={confirmDeletePerfumeNow}
                        className="flex-1 py-2 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm"
                      >
                        Ya, Hapus Permanen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL KONFIRMASI RESET KE 68 VARIAN DEFAULT */}
              {isResetPerfumesConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-body">
                  <div className="w-full max-w-sm rounded-[10px] sinki-arch-modal border p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#D4AF6A]/20">
                      <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                        Reset Katalog Default?
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsResetPerfumesConfirmOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-[1.5]">
                      Kembalikan seluruh daftar katalog ke 68 varian bawaan asli SINKI dan sinkronkan ke publik?
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsResetPerfumesConfirmOpen(false)}
                        className="flex-1 py-2 rounded-[6px] bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={confirmResetPerfumesNow}
                        className="flex-1 py-2 rounded-[6px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm"
                      >
                        Ya, Reset Katalog
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: MEDIA, HERO & 11 BOTOL (WIDESCREEN MULTI-KOLOM)
             ======================================================== */}
          {activeMenu === 'media' && (
            <div className="space-y-6 font-body">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
                  Media, Video & Visual Identitas
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 leading-[1.45]">
                  Unggah dan sesuaikan gambar resmi dengan alat pemotong dan zoom terintegrasi.
                </p>
              </div>

              {/* SUB-TABS NAVIGATOR KHUSUS MEDIA */}
              <div className="flex items-center gap-1.5 p-1.5 sinki-arch-bar rounded-[8px] border overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: 'video', label: '🎬 Video Hero' },
                  { id: 'identity', label: '🖼️ Logo, Chibi & QRIS' },
                  { id: 'stage', label: '✨ Botol & Panggung 3D' },
                ].map((st) => {
                  const isCur = mediaSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMediaSubTab(st.id as any)}
                      className={`px-3.5 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                        isCur
                          ? 'bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* HIDDEN INPUTS UNTUK VIDEO & POSTER HERO */}
              <input
                type="file"
                ref={heroVideoInputRef}
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={handleVideoFileUpload}
              />
              <input
                type="file"
                ref={heroPosterInputRef}
                accept="image/jpeg,image/png,image/*"
                className="hidden"
                onChange={handleCustomPosterUpload}
              />

              {/* KARTU UTAMA: VIDEO SINEMATIK BERANDA & EFEK TRANSISI MEMUDAR */}
              {mediaSubTab === 'video' && (
                <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[8px] sinki-arch-subbox text-[#E8C782] border flex items-center justify-center shadow-[0_0_15px_rgba(212,175,106,0.2)]">
                      <Film size={24} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading font-semibold text-base sm:text-lg text-white tracking-[-0.015em] leading-[1.25]">
                          Video Sinematik Beranda & Transisi Botol
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-[5px] text-xs font-semibold border ${
                          heroMediaType === 'video' && heroVideoUrl
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {heroMediaType === 'video' && heroVideoUrl ? 'Video Aktif' : 'Gambar Statis'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-[1.45]">
                        Gambar botol tampil seketika saat web dimuat, lalu memudar lembut begitu video berputar.
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="flex items-center sinki-arch-bar p-1 rounded-[8px] border shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMediaType('video')}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        heroMediaType === 'video'
                          ? 'bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video size={13} />
                      <span>Mode Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMediaType('image')}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        heroMediaType === 'image'
                          ? 'bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon size={13} />
                      <span>Gambar Statis</span>
                    </button>
                  </div>
                </div>

                {/* Ringkasan singkat: cover foto otomatis diambil dari frame awal saat video diganti */}

                {/* Grid 2 Kolom: Video Preview & Pengaturan */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Kolom 1: Live Video & Fade Simulation Player */}
                  <div className="p-4 rounded-[8px] sinki-arch-subbox border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                        <Play size={14} className="text-[#E8C782]" />
                        <span>Pratinjau Video & Simulasi Memudar</span>
                      </span>

                      {heroVideoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTestingFade(true);
                            setTimeout(() => setIsTestingFade(false), 2400);
                          }}
                          className="px-2.5 py-1 rounded-[6px] sinki-arch-subbox hover:border-[#D4AF6A]/65 text-[#E8C782] border text-xs font-semibold transition-all active:scale-95"
                        >
                          {isTestingFade ? '✨ Memudar Masuk...' : 'Uji Efek Memudar'}
                        </button>
                      )}
                    </div>

                    {/* Switcher Ukuran Frame Pratinjau */}
                    <div className="flex items-center justify-between gap-1.5 p-1.5 sinki-arch-bar rounded-[8px] border text-xs">
                      <span className="text-xs text-slate-400 font-medium px-1.5 shrink-0 hidden sm:inline">Ukuran Frame:</span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        <button
                          type="button"
                          onClick={() => setAdminPreviewRatio('9:16')}
                          className={`py-1.5 px-1.5 rounded-[6px] font-semibold text-xs transition-all text-center ${
                            adminPreviewRatio === '9:16'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          📱 9:16 HP
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminPreviewRatio('full')}
                          className={`py-1.5 px-1.5 rounded-[6px] font-semibold text-xs transition-all text-center ${
                            adminPreviewRatio === 'full'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          📺 Live
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminPreviewRatio('1:1')}
                          className={`py-1.5 px-1.5 rounded-[6px] font-semibold text-xs transition-all text-center ${
                            adminPreviewRatio === '1:1'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          ⬜ 1:1
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminPreviewRatio('16:9')}
                          className={`py-1.5 px-1.5 rounded-[6px] font-semibold text-xs transition-all text-center ${
                            adminPreviewRatio === '16:9'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          🖥️ 16:9
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center items-center py-2 bg-[#07070a] rounded-[8px] border border-[#D4AF6A]/15 min-h-[300px]">
                      <div
                        className={`relative rounded-[8px] overflow-hidden bg-black border border-[#D4AF6A]/35 shadow-2xl transition-all duration-300 flex items-center justify-center ${
                          adminPreviewRatio === '9:16'
                            ? 'h-[340px] w-[190px]'
                            : adminPreviewRatio === 'full'
                            ? 'h-[350px] w-[195px] ring-2 ring-[#D4AF6A]/30'
                            : adminPreviewRatio === '1:1'
                            ? 'h-[250px] w-[250px]'
                            : 'h-[180px] w-full max-w-[320px]'
                        }`}
                      >
                        {heroVideoUrl ? (
                          <>
                            <video
                              src={heroVideoUrl}
                              poster={heroVideoPoster || currentChibi || undefined}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className={`w-full h-full ${
                                heroVideoFit === 'contain' ? 'object-contain' : 'object-cover'
                              } ${
                                heroVideoPosition === 'top'
                                  ? 'object-top'
                                  : heroVideoPosition === 'bottom'
                                  ? 'object-bottom'
                                  : 'object-center'
                              }`}
                            />

                            {/* Simulasi Gambar Cover Memudar */}
                            <img
                              src={heroVideoPoster || currentChibi || ''}
                              alt="Cover Preview"
                              className={`absolute inset-0 w-full h-full ${
                                heroVideoFit === 'contain' ? 'object-contain' : 'object-cover'
                              } ${
                                heroVideoPosition === 'top'
                                  ? 'object-top'
                                  : heroVideoPosition === 'bottom'
                                  ? 'object-bottom'
                                  : 'object-center'
                              } transition-opacity duration-1000 ease-in-out pointer-events-none ${
                                isTestingFade ? 'opacity-0' : 'opacity-0 hover:opacity-100'
                              }`}
                            />

                            {/* Overlay Khusus untuk Mode 'Live Beranda' */}
                            {adminPreviewRatio === 'full' && (
                              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 select-none">
                                <div className="pt-2 text-center">
                                  <span className="font-heading text-xs font-bold tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 drop-shadow-md">
                                    SINKI
                                  </span>
                                  <span className="block text-[9px] tracking-[0.12em] text-white/90 uppercase font-body font-medium">
                                    EAU DE PARFUM
                                  </span>
                                </div>
                                <div className="p-1 rounded-[5px] bg-black/60 backdrop-blur-xs text-[10px] text-center text-[#E8C782] font-body font-medium">
                                  Live Preview Beranda
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center p-4 space-y-2">
                            <Film size={32} className="mx-auto text-slate-600" />
                            <p className="text-xs font-medium text-slate-300">Belum ada file video yang diunggah</p>
                            <span className="text-xs text-slate-500 block leading-[1.4]">
                              Unggah video MP4 atau masukkan URL video di sebelah kanan
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {heroVideoUrl && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400 truncate max-w-[220px]">
                          URL: {heroVideoUrl}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveHeroVideo}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                        >
                          <Trash2 size={12} />
                          <span>Hapus Video</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Kolom 2: Upload Video & Pengaturan Cover */}
                  <div className="space-y-4">
                    {/* Form Upload Video File */}
                    <div className="p-4 rounded-[8px] sinki-arch-subbox border space-y-3">
                      <span className="text-xs sm:text-sm font-semibold text-white block">
                        Unggah File Video (.mp4 / .webm)
                      </span>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={isUploadingVideo}
                          onClick={() => heroVideoInputRef.current?.click()}
                          className="flex-1 py-2.5 px-3 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Upload size={14} />
                          <span>{isUploadingVideo ? 'Mengunggah Video...' : 'Pilih File Video Baru'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-[1.45]">
                        Otomatis disimpan permanen ke Supabase CDN & diekstrak frame gambarnya.
                      </p>
                    </div>

                    {/* Form URL Video Langsung */}
                    <div className="p-4 rounded-[8px] sinki-arch-subbox border space-y-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-white block">
                        Atau Gunakan Tautan URL Video Langsung
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="https://.../video.mp4"
                          className="flex-1 px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isUploadingVideo || !videoUrlInput.trim()}
                          onClick={handleSaveVideoUrl}
                          className="px-3.5 py-2 rounded-[8px] sinki-arch-subbox hover:border-[#D4AF6A]/65 text-white font-semibold text-xs sm:text-sm border transition-all active:scale-95 disabled:opacity-50"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>

                    {/* Pengaturan Gambar Cover (Poster yang memudar) */}
                    <div className="p-4 rounded-[8px] sinki-arch-subbox border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-white block">
                            Gambar Cover Awal (Poster)
                          </span>
                          <span className="text-xs text-slate-400 leading-[1.4]">
                            Foto botol/frame yang tampil sebelum memudar ke video
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-black border border-[#D4AF6A]/30 shrink-0">
                          {heroVideoPoster || currentChibi ? (
                            <img
                              src={heroVideoPoster || currentChibi || ''}
                              alt="Poster"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap gap-2">
                            {heroVideoUrl && (
                              <button
                                type="button"
                                disabled={isExtractingFrame}
                                onClick={handleExtractFrameNow}
                                className="py-1.5 px-2.5 rounded-[6px] sinki-arch-subbox hover:border-[#D4AF6A]/65 text-[#E8C782] border text-xs font-semibold transition-all"
                              >
                                {isExtractingFrame ? 'Mengambil Frame...' : '📷 Ambil Frame dari Video Ini'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => heroPosterInputRef.current?.click()}
                              className="py-1.5 px-2.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
                            >
                              Ganti Foto Cover Kustom
                            </button>
                          </div>
                          <span className="text-xs text-slate-400 block leading-[1.4]">
                            Setiap Anda mengganti video, cover otomatis disinkronkan dari awal video baru.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Panduan Loop Video Tanpa Jeda (Seamless Zero-Gap) */}
                    <div className="p-3.5 rounded-[8px] sinki-arch-subbox border border-[#D4AF6A]/25 space-y-2">
                      <div className="flex items-center gap-1.5 text-[#E8C782] text-xs font-semibold">
                        <Sparkles size={13} />
                        <span>Teknologi Pemutar Seamless & Tips Video Anti-Jeda</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-[1.5]">
                        SINKI telah dilengkapi <strong className="text-white">Dual-Video Engine</strong> yang menyambung putaran video secara otomatis sebelum detik terakhir habis (mencegah layar freeze/stutter).
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        <li><span className="text-slate-300">Ekspor tanpa audio</span> (Mute track) agar HP tidak tersendat sinkronisasi audio.</li>
                        <li><span className="text-slate-300">Teknik Boomerang / Reverse</span>: Buat klip maju lalu mundur di CapCut/Canva agar awal & akhir menyambung sempurna.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* BARIS KONTROL LAYOUT: POSISI FOKUS BOTOL & RASIO TAMPILAN */}
                <div className="p-4 sm:p-5 rounded-[8px] sinki-arch-subbox border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-[#E8C782]" />
                      <span className="font-heading text-sm font-semibold text-white tracking-[-0.01em]">
                        Pengaturan Layout & Posisi Video Beranda
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[#E8C782] bg-[#D4AF6A]/15 border border-[#D4AF6A]/35 px-2.5 py-0.5 rounded-[5px]">
                      Live Fitting
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* 1. Mode Fitting Layar */}
                    <div className="space-y-1.5 p-3 rounded-[8px] bg-[#0a0a0e]/80 border border-[#D4AF6A]/15">
                      <span className="text-xs font-semibold text-slate-200 block">
                        1. Mode Tampilan Layar (Fit)
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateLayoutSetting('heroVideoFit', 'cover')}
                          className={`py-2 px-2.5 rounded-[6px] text-xs font-semibold transition-all ${
                            heroVideoFit === 'cover'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-[#D4AF6A]/20'
                          }`}
                        >
                          Cover (Penuh)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayoutSetting('heroVideoFit', 'contain')}
                          className={`py-2 px-2.5 rounded-[6px] text-xs font-semibold transition-all ${
                            heroVideoFit === 'contain'
                              ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-[#D4AF6A]/20'
                          }`}
                        >
                          Contain (Utuh)
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-[1.4]">
                        {heroVideoFit === 'cover'
                          ? 'Memenuhi panggung tanpa tepi hitam.'
                          : 'Seluruh frame video terlihat 100% utuh tanpa terpotong.'}
                      </p>
                    </div>

                    {/* 2. Posisi Fokus Kamera (Vertical Alignment) */}
                    <div className="space-y-1.5 p-3 rounded-[8px] bg-[#0a0a0e]/80 border border-[#D4AF6A]/15">
                      <span className="text-xs font-semibold text-slate-200 block">
                        2. Titik Fokus Botol (Posisi)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['top', 'center', 'bottom'] as const).map((pos) => {
                          const labels = { top: 'Atas', center: 'Tengah', bottom: 'Bawah' };
                          const isSel = heroVideoPosition === pos;
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => handleUpdateLayoutSetting('heroVideoPosition', pos)}
                              className={`py-2 px-1.5 rounded-[6px] text-xs font-semibold transition-all ${
                                isSel
                                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-[#D4AF6A]/20'
                              }`}
                            >
                              {labels[pos]}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 leading-[1.4]">
                        Geser fokus vertikal agar botol tidak menabrak teks judul.
                      </p>
                    </div>

                    {/* 3. Ketinggian Area Panggung (Hero Height) */}
                    <div className="space-y-1.5 p-3 rounded-[8px] bg-[#0a0a0e]/80 border border-[#D4AF6A]/15">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-200 block">
                          3. Ketinggian Panggung Beranda
                        </span>
                        {heroHeightMode === 'full' && (
                          <span className="text-xs font-medium text-[#E8C782] bg-[#D4AF6A]/20 px-1.5 py-0.5 rounded-[4px] border border-[#D4AF6A]/35">
                            Penuh
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['compact', 'balanced', 'tall', 'full'] as const).map((hm) => {
                          const labels = {
                            compact: '60% (Sedang)',
                            balanced: '68% (Standar)',
                            tall: '76% (Tinggi)',
                            full: '100% (Penuh)',
                          };
                          const isSel = heroHeightMode === hm;
                          return (
                            <button
                              key={hm}
                              type="button"
                              onClick={() => handleUpdateLayoutSetting('heroHeightMode', hm)}
                              className={`py-2 px-1.5 rounded-[6px] text-xs tabular-nums font-semibold transition-all text-center ${
                                isSel
                                  ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-[#D4AF6A]/20'
                              }`}
                            >
                              {labels[hm]}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 leading-[1.4]">
                        {heroHeightMode === 'full'
                          ? '✨ Mode 100% Layar Penuh: Video mengisi seluruh panggung dari tepi atas sampai bawah!'
                          : 'Sesuaikan proporsi panggung video dengan menu bawah.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* BARIS 1: FOTO HERO UTAMA & LOGO RESMI (DESKTOP: 2 KOLOM) */}
              {mediaSubTab === 'identity' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Kartu Foto Utama Beranda */}
                  <div className="p-5 rounded-[10px] sinki-arch-card border space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                          Foto Utama Beranda (Hero)
                        </h3>
                        <span className="text-xs text-slate-400">Foto botol panggung depan</span>
                      </div>
                      <label className="py-1.5 px-3 rounded-[6px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-xs cursor-pointer active:scale-95 transition-all">
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'hero')}
                        />
                      </label>
                    </div>

                    <div className="relative h-56 rounded-[8px] overflow-hidden sinki-arch-subbox border flex items-center justify-center">
                      {currentChibi ? (
                        <img
                          src={currentChibi}
                          alt="Hero"
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Foto Utama Standar</span>
                      )}
                    </div>
                  </div>

                  {/* Kartu Logo Resmi & Barcode QRIS */}
                  <div className="p-5 rounded-[10px] sinki-arch-card border space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                          Logo Resmi SINKI & QRIS
                        </h3>
                        <span className="text-xs text-slate-400">Identitas & Barcode Pembayaran</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-[8px] sinki-arch-subbox border space-y-2 text-center">
                        <span className="text-xs font-semibold text-slate-300 block">Logo SINKI</span>
                        <div className="h-28 rounded-[6px] bg-[#08080b] border border-[#D4AF6A]/20 p-2 flex items-center justify-center">
                          {currentLogo ? (
                            <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Sparkles size={24} className="text-[#E8C782]" />
                          )}
                        </div>
                        <label className="block py-1.5 px-2.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">
                          <span>Ganti Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'logo')}
                          />
                        </label>
                      </div>

                      <div className="p-3 rounded-[8px] sinki-arch-subbox border space-y-2 text-center">
                        <span className="text-xs font-semibold text-slate-300 block">Barcode QRIS</span>
                        <div className="h-28 rounded-[6px] bg-[#08080b] border border-[#D4AF6A]/20 p-2 flex items-center justify-center">
                          {currentQris ? (
                            <img src={currentQris} alt="QRIS" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xs text-slate-500">QRIS Standar</span>
                          )}
                        </div>
                        <label className="block py-1.5 px-2.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer">
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
              )}

              {/* BARIS KHUSUS: PANGGUNG 3D BERANDA & 4 BOTOL PARFUM PNG TRANSPARAN */}
              {mediaSubTab === 'stage' && (
                <>
                  <input
                    type="file"
                    ref={heroBottleInputRef}
                    accept="image/png,image/*"
                    className="hidden"
                    onChange={handleHeroBottleUpload}
                  />
                  <input
                    type="file"
                    ref={masterFlaconInputRef}
                    accept="image/png,image/webp,image/*"
                    className="hidden"
                    onChange={handleMasterFlaconUpload}
                  />

              {/* MASTER TOGGLE PANGGUNG 3D */}
              <div className="p-4 sm:p-5 rounded-[10px] sinki-arch-card border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-all ${
                    isHeroStageEnabled
                      ? 'sinki-arch-subbox text-[#E8C782] border shadow-[0_0_12px_rgba(212,175,106,0.25)]'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm sm:text-base font-semibold text-white tracking-[-0.015em]">
                        Sakelar Master Panggung 3D Beranda
                      </span>
                      <span className={`px-2 py-0.5 rounded-[5px] text-xs font-semibold border ${
                        isHeroStageEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      }`}>
                        {isHeroStageEnabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-[1.45]">
                      {isHeroStageEnabled
                        ? 'Panggung 3D aktif dan akan menampilkan botol PNG transparan yang diunggah di bawah.'
                        : 'Panggung 3D dinonaktifkan. Beranda tetap bersih dan menampilkan gambar latar belakang asli Anda.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStageEnabled}
                  className={`px-4 py-2 rounded-[8px] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 ${
                    isHeroStageEnabled
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-gradient-to-r from-[#DFB76C] to-[#c29849] hover:brightness-110 text-slate-950 shadow-md'
                  }`}
                >
                  {isHeroStageEnabled ? 'Matikan Panggung 3D' : 'Nyalakan Panggung 3D'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Pemilihan Efek Panggung 3D */}
                <div className="p-5 rounded-[10px] sinki-arch-card border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-base text-[#F3E6C8] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
                        <Sparkles size={15} className="text-[#E8C782]" />
                        <span>Efek Panggung 3D Beranda (4 Pilihan)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pilih efek gerakan botol parfum saat bertransisi otomatis
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-[5px] bg-[#D4AF6A]/20 text-[#E8C782] font-semibold border border-[#D4AF6A]/40">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STAGE_EFFECTS.map((eff) => {
                      const isSelected = activeStageEffect === eff.id;
                      return (
                        <button
                          key={eff.id}
                          type="button"
                          onClick={() => handleSelectStageEffect(eff.id)}
                          className={`p-3 rounded-[8px] border text-left transition-all ${
                            isSelected
                              ? 'sinki-arch-card-selected text-white'
                              : 'sinki-arch-subbox hover:border-[#D4AF6A]/50 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs sm:text-sm font-semibold text-[#F3E6C8]">{eff.name}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-[4px] bg-[#E8C782] text-slate-950 flex items-center justify-center">
                                <Check size={10} className="stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 block leading-[1.4]">
                            {eff.tagline}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Upload 4 Botol PNG 3D */}
                <div className="p-5 rounded-[10px] sinki-arch-card border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-base text-[#F3E6C8] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
                        <Crown size={15} className="text-[#E8C782]" />
                        <span>4 Slot Botol Parfum 3D (PNG Transparan)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Slide bergantian setiap 4 detik di panggung tengah beranda
                      </p>
                    </div>
                    <span className="text-xs text-[#F3E6C8]/90 tabular-nums font-medium">
                      4 Botol
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[0, 1, 2, 3].map((idx) => {
                      const rawBottle = heroBottlesList[idx];
                      const bottleUrl = rawBottle && !rawBottle.includes('top11/top-') ? rawBottle : null;
                      const isCustom = Boolean(bottleUrl);

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-[8px] sinki-arch-subbox border flex flex-col justify-between space-y-2 text-center"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs tabular-nums font-semibold text-[#E8C782]">
                              #{idx + 1}
                            </span>
                            {isCustom && (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                                <Check size={10} /> Kustom
                              </span>
                            )}
                          </div>

                          <div className="h-20 rounded-[6px] bg-gradient-to-b from-[#141419] to-[#0a0a0d] border border-[#D4AF6A]/20 flex items-center justify-center overflow-hidden p-1">
                            {bottleUrl ? (
                              <img
                                src={bottleUrl}
                                alt={`Botol #${idx + 1}`}
                                className="max-h-full max-w-full object-contain filter drop-shadow-md"
                              />
                            ) : (
                              <ImageIcon size={16} className="text-slate-500" />
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHeroBottleIdx(idx);
                              heroBottleInputRef.current?.click();
                            }}
                            className="w-full py-1.5 px-2 rounded-[6px] bg-[#D4AF6A]/15 hover:bg-[#D4AF6A] hover:text-slate-950 border border-[#D4AF6A]/35 text-[#E8C782] text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <Upload size={11} />
                            <span>Ganti PNG</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Slot Botol Master Racikan Aroma (PNG Transparan) */}
                <div className="p-5 rounded-[10px] sinki-arch-card border space-y-3.5 lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading font-semibold text-base text-[#F3E6C8] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
                        <Sparkles size={15} className="text-[#E8C782]" />
                        <span>Botol Master Racikan Aroma (PNG Transparan)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Foto botol transparan utama yang tampil di panggung 3D hasil racikan menu "Racikan Aroma"
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-[5px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 w-fit">
                      Transparan Aktif
                    </span>
                  </div>

                  <div className="p-4 rounded-[8px] sinki-arch-subbox border flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-32 rounded-[8px] bg-gradient-to-b from-[#141419] to-[#0a0a0d] border border-[#D4AF6A]/30 flex items-center justify-center p-2 overflow-hidden shrink-0 relative">
                      <div className="absolute inset-x-2 bottom-1 h-3 rounded-[100%] bg-amber-400/20 blur-[4px] pointer-events-none" />
                      <img
                        src={currentMasterFlacon || '/assets/sinki-master-flacon-transparent.png'}
                        alt="Botol Master Racikan Aroma"
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
                      />
                    </div>

                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Botol ini ditampilkan melayang di atas pedestal kristal panggung 3D Paris saat pembeli selesai meracik aroma mereka.
                        Format terbaik adalah <strong>PNG transparan</strong> (tanpa latar belakang kotak).
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => masterFlaconInputRef.current?.click()}
                          className="py-1.5 px-3.5 rounded-[6px] bg-[#D4AF6A]/20 hover:bg-[#D4AF6A] hover:text-slate-950 border border-[#D4AF6A]/40 text-[#E8C782] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload size={12} />
                          <span>Ganti PNG Botol Master</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}


            </div>
          )}

          {/* ========================================================
              TAB 4: TEKS BERJALAN & HARGA (DESKTOP: SPLIT 2 KOLOM)
             ======================================================== */}
          {activeMenu === 'banner' && (
            <div className="space-y-6 font-body">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
                  Teks Berjalan & Konfigurasi Harga
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 leading-[1.45]">
                  Ubah running text marquee beranda, pilihan gaya tipografi, dan harga tier botol.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KOLOM KIRI: TEKS BERJALAN & FONT */}
                <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                      Teks Berjalan Beranda (Marquee)
                    </h3>
                    <button
                      onClick={handleResetTicker}
                      className="text-xs font-medium text-slate-400 hover:text-[#F3E6C8] flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">
                      Isi Teks Marquee:
                    </label>
                    <input
                      type="text"
                      value={tickerForm.text}
                      onChange={(e) => setTickerForm({ ...tickerForm, text: e.target.value })}
                      placeholder="Masukkan slogan atau teks promo..."
                      className="w-full px-3.5 py-2.5 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                    />
                  </div>

                  {/* Pilihan 4 Font */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-medium text-slate-300 block">
                      Pilihan Gaya Tipografi:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TICKER_FONTS.map((font) => {
                        const isSelected = tickerForm.font === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => setTickerForm({ ...tickerForm, font: font.id })}
                            className={`p-3 rounded-[8px] border cursor-pointer transition-all ${
                              isSelected
                                ? 'sinki-arch-card-selected text-white'
                                : 'sinki-arch-subbox text-slate-400 hover:border-[#D4AF6A]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-semibold">{font.name}</span>
                              {isSelected && <Check size={13} className="text-[#E8C782] shrink-0" />}
                            </div>
                            <span className="text-xs text-slate-400 block mt-1 line-clamp-1">
                              {font.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIVE SIMULATION CARD */}
                  <div className="pt-2">
                    <span className="text-xs font-medium text-[#E8C782] block mb-1.5">
                      Simulasi Tampilan Beranda:
                    </span>
                    <div className="p-3 rounded-[8px] sinki-arch-bar border overflow-hidden text-center">
                      <span className="font-heading font-semibold text-[#F3E6C8] text-sm tracking-[0.02em] animate-pulse">
                        "{tickerForm.text}"
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveTicker}
                    disabled={isSavingTicker}
                    className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm shadow-md active:scale-98 transition-all"
                  >
                    {isSavingTicker ? 'Menyimpan...' : 'Simpan Teks Berjalan'}
                  </button>
                </div>

                {/* KOLOM KANAN: KONFIGURASI HARGA BOTOL */}
                <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                      Pengaturan Tarif & Harga
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Mata Uang IDR</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-[8px] sinki-arch-subbox border space-y-1">
                      <label className="text-xs font-semibold text-[#E8C782] block">
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
                        className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm tabular-nums text-white focus:outline-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-[8px] sinki-arch-subbox border space-y-1">
                      <label className="text-xs font-semibold text-[#E8C782] block">
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
                        className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm tabular-nums text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-[8px] sinki-arch-subbox border space-y-1">
                        <label className="text-xs font-semibold text-[#E8C782] block truncate">
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
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm tabular-nums text-white focus:outline-none"
                        />
                      </div>

                      <div className="p-3 rounded-[8px] sinki-arch-subbox border space-y-1">
                        <label className="text-xs font-semibold text-[#E8C782] block truncate">
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
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm tabular-nums text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-[8px] sinki-arch-subbox border space-y-1">
                      <label className="text-xs font-semibold text-[#E8C782] block">
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
                        className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm tabular-nums text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePricing}
                    disabled={isSavingPricing}
                    className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm shadow-md active:scale-98 transition-all"
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
            <div className="space-y-4 font-body">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
                    Konten Website & Edukasi ({articlesList.length})
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5 leading-[1.45]">
                    Terbitkan artikel wewangian, tips ketahanan, dan informasi promo.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingArticle(true)}
                  className="py-2 px-3.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md self-start sm:self-auto"
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
                    className="p-5 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded-[5px] bg-[#D4AF6A]/20 text-[#E8C782] font-semibold">
                          {art.categoryLabel}
                        </span>
                        <span className="text-slate-400 tabular-nums">{art.date}</span>
                      </div>
                      <h4 className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">{art.title}</h4>
                      <p className="text-sm text-slate-300 line-clamp-3 leading-[1.5]">
                        {art.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#D4AF6A]/15 text-xs text-slate-400">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in font-body">
                  <div className="w-full max-w-lg rounded-[10px] sinki-arch-modal border p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D4AF6A]/20">
                      <h3 className="font-heading font-semibold text-base text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
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
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Judul Konten
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Cara Membuat Parfum Tahan Lebih Lama"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Kategori
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none"
                        >
                          <option value="tips">Tips Perawatan</option>
                          <option value="story">Edukasi Aroma</option>
                          <option value="promo">Info & Promo</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Isi Konten
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Tuliskan isi panduan atau artikel di sini..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white focus:outline-none resize-none leading-[1.5]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingArticle(false)}
                          className="flex-1 py-2 rounded-[8px] bg-[#14141a] hover:bg-[#1c1c24] text-sm font-medium text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] text-slate-950 font-semibold text-sm"
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
            <div className="space-y-4 font-body">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
                    Moderasi Ulasan Pembeli ({reviewsList.length}/10 Slot)
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5 leading-[1.45]">
                    Pantau dan moderasi ulasan pengalaman pembeli secara transparan. Sistem menampung hingga 10 ulasan terbaru secara bergantian.
                  </p>
                </div>

                <button
                  onClick={handleResetReviews}
                  className="py-1.5 px-3 rounded-[8px] sinki-arch-subbox border hover:border-[#D4AF6A]/55 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw size={13} />
                  <span>Kosongkan Semua Ulasan</span>
                </button>
              </div>

              {reviewsList.length === 0 ? (
                <div className="p-8 rounded-[8px] sinki-arch-card border text-center space-y-2">
                  <p className="text-sm text-slate-400 leading-[1.5]">
                    Belum ada ulasan yang masuk. Kotak ulasan saat ini kosong dan siap menampung ulasan baru dari pengunjung hingga 10 slot.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 sm:p-5 rounded-[8px] sinki-arch-card border space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{rev.emoji}</span>
                            <div>
                              <span className="font-heading font-semibold text-sm text-white block tracking-[-0.01em]">
                                {rev.name}
                              </span>
                              <span className="text-xs text-[#E8C782] font-medium">{rev.emojiLabel}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteReview(rev.id, rev.name)}
                            className="py-1 px-2.5 rounded-[6px] bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </div>

                        <div className="text-xs text-[#F3E6C8] bg-[#D4AF6A]/10 px-2.5 py-0.5 rounded-[5px] inline-block font-medium">
                          Varian: {rev.variant}
                        </div>

                        <p className="text-sm text-slate-200 leading-[1.5]">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#D4AF6A]/15 tabular-nums">
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
            <div className="space-y-4 font-body">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#F3E6C8] tracking-[-0.015em] leading-[1.25]">
                  Pengaturan & Brand SINKI
                </h2>
                <p className="text-sm text-slate-400 mt-0.5 leading-[1.45]">
                  Pilih warna tema Luxury Architectural, kelola tautan resmi, dan pantau status proteksi akun.
                </p>
              </div>

              {/* STUDIO 5 PILIHAN WARNA TEMA LUXURY ARCHITECTURAL */}
              <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF6A]/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] sinki-arch-subbox border flex items-center justify-center shadow-inner shrink-0">
                      <Palette size={20} className="text-[#E8C782]" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-white tracking-[-0.015em] leading-[1.25] flex flex-wrap items-center gap-2">
                        <span>6 Pilihan Warna Tema Forest Waterfall (Anti-Redup)</span>
                        <span className="font-body text-xs text-[#E8C782] bg-[#D4AF6A]/15 px-2.5 py-0.5 rounded-[5px] border border-[#D4AF6A]/35 font-semibold">
                          Aktif: {activeThemeMeta.name}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-[1.45]">
                        Termasuk tema Signature 2.5D Botanical Emerald dengan kartu bergambar, ikon 3D emas, dan teks putih cerah (video Home tetap bersih).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetLuxuryTheme}
                    disabled={isSavingTheme || selectedThemeId === 'botanical-crystal'}
                    className="py-1.5 px-3 rounded-[8px] sinki-arch-subbox border hover:border-[#D4AF6A]/55 disabled:opacity-45 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 active:scale-95 transition-all self-start sm:self-auto shrink-0"
                    title="Kembalikan ke tema bawaan Botanical Emerald 2.5D"
                  >
                    <RotateCcw size={12} />
                    <span>Default Botanical 2.5D</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {LUXURY_THEMES.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        disabled={isSavingTheme}
                        onClick={() => handleSelectLuxuryTheme(theme.id)}
                        className="group text-left p-3.5 rounded-[8px] border transition-all duration-200 active:scale-[0.98] flex flex-col justify-between gap-3 relative overflow-hidden"
                        style={{
                          background: `radial-gradient(125% 95% at 0% 0%, ${theme.accentHex}29 0%, transparent 70%), linear-gradient(180deg, ${theme.surfaceHex} 0%, ${theme.canvasHex} 100%)`,
                          borderColor: isSelected ? theme.brightHex : `${theme.accentHex}59`,
                          boxShadow: isSelected
                            ? `0 10px 26px rgba(0,0,0,0.75), 0 0 18px ${theme.accentHex}33, inset 0 1px 0 0 ${theme.softHex}45`
                            : `0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 0 ${theme.softHex}22`,
                        }}
                      >
                        <div className="space-y-2.5 w-full">
                          {/* Top Row: Swatch Trio + Selected Check */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-5 h-5 rounded-[5px] border"
                                style={{
                                  backgroundColor: theme.surfaceHex,
                                  borderColor: theme.accentHex,
                                }}
                              />
                              <span
                                className="w-5 h-5 rounded-[5px] border"
                                style={{
                                  background: `linear-gradient(135deg, ${theme.softHex} 0%, ${theme.accentHex} 100%)`,
                                  borderColor: theme.brightHex,
                                }}
                              />
                            </div>

                            {isSelected ? (
                              <span
                                className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-semibold flex items-center gap-1"
                                style={{
                                  backgroundColor: `${theme.accentHex}2E`,
                                  color: theme.softHex,
                                  border: `1px solid ${theme.brightHex}75`,
                                }}
                              >
                                <Check size={11} />
                                Aktif
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.04)',
                                  color: theme.brightHex,
                                  border: `1px solid ${theme.accentHex}38`,
                                }}
                              >
                                {theme.badge}
                              </span>
                            )}
                          </div>

                          {/* Theme Title & Description */}
                          <div>
                            <div
                              className="font-heading text-sm font-semibold leading-tight"
                              style={{ color: isSelected ? theme.softHex : '#ffffff' }}
                            >
                              {theme.name}
                            </div>
                            <p className="text-[11.5px] text-slate-300/90 mt-1 leading-[1.4]">
                              {theme.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Mini Architectural Box Preview Bar */}
                        <div
                          className="w-full py-1.5 px-2.5 rounded-[6px] flex items-center justify-between text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${theme.canvasHex}CC`,
                            border: `1px solid ${theme.accentHex}66`,
                            color: theme.brightHex,
                          }}
                        >
                          <span>Preview Kotak</span>
                          <span
                            className="w-2 h-2 rounded-[2px]"
                            style={{ backgroundColor: theme.brightHex }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KARTU KELOLA AKUN MEDIA SOSIAL & MARKETPLACE RESMI */}
              <div className="p-5 sm:p-6 rounded-[10px] sinki-arch-card border shadow-2xl relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF6A]/[0.05] rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF6A]/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] sinki-arch-subbox border flex items-center justify-center shadow-inner">
                      <Share2 size={20} className="text-[#E8C782]" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-white tracking-[-0.015em] leading-[1.25] flex flex-wrap items-center gap-2">
                        <span>Kelola Akun Media Sosial & Toko Resmi</span>
                        <span className="font-body text-xs text-[#E8C782] bg-[#D4AF6A]/15 px-2.5 py-0.5 rounded-[5px] border border-[#D4AF6A]/35 font-semibold">
                          Live Sync
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-[1.45]">
                        Ganti akun TikTok, Instagram, WhatsApp, atau marketplace Anda kapan saja. Tautan otomatis berubah di Beranda, Menu Drawer, dan Tombol Media Sosial.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetSocial}
                      disabled={isSavingSocial}
                      className="py-1.5 px-3 rounded-[8px] sinki-arch-subbox border hover:border-[#D4AF6A]/55 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 active:scale-95 transition-all"
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
                    <div className="p-4 rounded-[8px] bg-[#0a0a0e]/85 border border-cyan-500/30 space-y-2.5 shadow-md hover:border-cyan-400/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs sm:text-sm font-semibold text-cyan-300 flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#00f2fe"/>
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#fe2c55" opacity="0.7"/>
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.636c.31 0 .611.049.897.139V9.414A6.33 6.33 0 0 0 9.474 9.2c-3.528 0-6.388 2.859-6.388 6.387 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.387-2.86 6.387-6.388v-7.04a8.217 8.217 0 0 0 4.838 1.572V6.686z" fill="#ffffff" opacity="0.85"/>
                          </svg>
                          <span>Akun / Link Profil TikTok *</span>
                        </label>
                        <span className="text-xs text-cyan-300 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-[4px] border border-cyan-500/20 truncate max-w-[140px]">
                          {extractTikTokHandle(socialForm.tiktok)}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.tiktok}
                        onChange={(e) => setSocialForm({ ...socialForm, tiktok: e.target.value })}
                        placeholder="Contoh: @sinkiofficial atau https://www.tiktok.com/@sinkiofficial"
                        className="w-full px-3 py-2.5 rounded-[8px] bg-[#0d0d12] border border-cyan-500/40 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 leading-[1.4]">
                          💡 Bisa ketik <span className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded-[4px] font-medium">@nama_baru</span> atau link lengkap.
                        </span>
                        <a
                          href={formatTikTokUrl(socialForm.tiktok)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-300 hover:text-white font-semibold flex items-center gap-1 hover:underline ml-2 shrink-0"
                          title="Buka akun TikTok untuk tes apakah link benar"
                        >
                          <span>Tes Profil</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 2. AKUN INSTAGRAM */}
                    <div className="p-4 rounded-[8px] bg-[#0a0a0e]/85 border border-pink-500/30 space-y-2.5 shadow-md hover:border-pink-400/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs sm:text-sm font-semibold text-pink-300 flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-0.5 shrink-0">
                            <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <span>Akun / Link Profil Instagram</span>
                        </label>
                        <span className="text-xs text-pink-300 font-medium bg-pink-500/10 px-2 py-0.5 rounded-[4px] border border-pink-500/20 truncate max-w-[140px]">
                          {extractInstagramHandle(socialForm.instagram)}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.instagram}
                        onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                        placeholder="Contoh: @sinki_official atau https://www.instagram.com/sinki_official"
                        className="w-full px-3 py-2.5 rounded-[8px] bg-[#0d0d12] border border-pink-500/40 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50"
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 leading-[1.4]">
                          Tautan ke feed & katalog resmi SINKI di Instagram.
                        </span>
                        <a
                          href={formatInstagramUrl(socialForm.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-300 hover:text-white font-semibold flex items-center gap-1 hover:underline ml-2 shrink-0"
                        >
                          <span>Tes Profil</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 3. WHATSAPP HOTLINE VIP */}
                    <div className="p-4 rounded-[8px] bg-[#0a0a0e]/85 border border-emerald-500/30 space-y-2.5 shadow-md hover:border-emerald-400/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-2">
                          <MessageCircle size={15} className="text-emerald-400 shrink-0" />
                          <span>WhatsApp Hotline VIP & Order</span>
                        </label>
                        <span className="text-xs text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-[4px] border border-emerald-500/20">
                          Aktif
                        </span>
                      </div>

                      <input
                        type="text"
                        value={socialForm.whatsapp}
                        onChange={(e) => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                        placeholder="Contoh: 081398677610 atau https://wa.me/6281398677610"
                        className="w-full px-3 py-2.5 rounded-[8px] bg-[#0d0d12] border border-emerald-500/40 text-base sm:text-sm tabular-nums text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 leading-[1.4]">
                          Nomor chat pemesanan langsung & konsultasi parfum.
                        </span>
                        <a
                          href={formatWhatsAppUrl(socialForm.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-300 hover:text-white font-semibold flex items-center gap-1 hover:underline ml-2 shrink-0"
                        >
                          <span>Tes Chat WA</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* 4. SHOPEE & TOKOPEDIA */}
                    <div className="p-4 rounded-[8px] bg-[#0a0a0e]/85 border border-[#D4AF6A]/35 space-y-2.5 shadow-md hover:border-[#E8C782]/55 transition-colors">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-semibold text-[#E8C782] flex items-center gap-2">
                          <ShoppingBag size={15} className="text-[#E8C782] shrink-0" />
                          <span>Shopee & Tokopedia Official</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={socialForm.shopee}
                          onChange={(e) => setSocialForm({ ...socialForm, shopee: e.target.value })}
                          placeholder="Link Toko Shopee (https://shopee.co.id/...)"
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={socialForm.tokopedia}
                          onChange={(e) => setSocialForm({ ...socialForm, tokopedia: e.target.value })}
                          placeholder="Link Toko Tokopedia (https://tokopedia.com/...)"
                          className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol Simpan Perubahan Media Sosial */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-slate-400 leading-[1.45]">
                      ✨ Tekan tombol simpan di sebelah kanan agar akun baru langsung aktif dan disinkronkan ke cloud.
                    </p>
                    <button
                      type="submit"
                      disabled={isSavingSocial}
                      className="w-full sm:w-auto py-2.5 px-6 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-110 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-black/40 flex items-center justify-center gap-2 shrink-0 border border-[#DFB76C]/40"
                    >
                      <Save size={15} className="stroke-[2.2]" />
                      <span>{isSavingSocial ? 'Menyimpan ke Cloud...' : 'Simpan Perubahan Tautan'}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* AREA MODAL FITTING */}



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

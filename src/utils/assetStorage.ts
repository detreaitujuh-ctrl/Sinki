import { PricingConfig, getStoredPricing } from './pricingStorage';

// Utility to compress images and store them reliably on Supabase and in LocalStorage
const LOGO_STORAGE_KEY = 'sinki_custom_logo_data';
const CHIBI_STORAGE_KEY = 'sinki_custom_chibi_data';
const QRIS_STORAGE_KEY = 'sinki_custom_qris_data';
const TOP11_STORAGE_KEY = 'sinki_custom_top11_data';
const HERO_BOTTLES_STORAGE_KEY = 'sinki_hero_bottles_v1';
const HERO_STAGE_EFFECT_STORAGE_KEY = 'sinki_hero_stage_effect_v1';
const HERO_STAGE_ENABLED_STORAGE_KEY = 'sinki_hero_stage_enabled_v1';
const HERO_VIDEO_URL_KEY = 'sinki_hero_video_url_v1';
const HERO_VIDEO_POSTER_KEY = 'sinki_hero_video_poster_v1';
const HERO_MEDIA_TYPE_KEY = 'sinki_hero_media_type_v1';
const HERO_VIDEO_FIT_KEY = 'sinki_hero_video_fit_v1';
const HERO_VIDEO_POS_KEY = 'sinki_hero_video_pos_v1';
const HERO_HEIGHT_MODE_KEY = 'sinki_hero_height_mode_v1';
const SESSION_TOKEN_KEY = 'sinki_owner_auth_token';

export type HeroVideoFit = 'cover' | 'contain';
export type HeroVideoPosition = 'center' | 'top' | 'bottom';
export type HeroHeightMode = 'compact' | 'balanced' | 'tall' | 'full'; // compact: 60%, balanced: 68%, tall: 76%, full: 100% full-bleed mentok atas

// Public CDN Base URL for reading public images (safe for frontend)
export const SUPABASE_STORAGE_BASE = 'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/';

export const DEFAULT_LOGO = `${SUPABASE_STORAGE_BASE}sinki_logo.png`;
export const DEFAULT_CHIBI = `${SUPABASE_STORAGE_BASE}sinki_chibi.png`;
export const DEFAULT_QRIS = `${SUPABASE_STORAGE_BASE}sinki_qris.jpg`;
export const DEFAULT_HERO_VIDEO_URL = `${SUPABASE_STORAGE_BASE}hero_video.mp4`;
export const DEFAULT_HERO_VIDEO_POSTER = `${SUPABASE_STORAGE_BASE}sinki_hero_poster.jpg`;

export type HeroStageEffect = 'royal-elevation' | 'parisian-turntable' | 'golden-aura' | 'horizon-slide';

export interface StageEffectOption {
  id: HeroStageEffect;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
}

export const STAGE_EFFECTS: StageEffectOption[] = [
  {
    id: 'royal-elevation',
    name: 'Royal Elevation',
    tagline: 'Naik Anggun Dari Bawah',
    description: 'Botol meluncur naik dari lantai panggung kristal dengan pendaran kilau cahaya emas',
    iconName: 'ArrowUpCircle',
  },
  {
    id: 'parisian-turntable',
    name: 'Parisian Turntable',
    tagline: 'Rotasi Panggung 3D',
    description: 'Botol berputar 3D halus dengan sudut perspektif mewah seperti di butik Paris',
    iconName: 'RotateCw',
  },
  {
    id: 'golden-aura',
    name: 'Golden Aura Bloom',
    tagline: 'Pendar Cahaya Lensa',
    description: 'Botol memudar masuk dengan pendaran specular flare dan zoom halus',
    iconName: 'Sparkles',
  },
  {
    id: 'horizon-slide',
    name: 'Horizon Slide',
    tagline: 'Geser 3D Elegan',
    description: 'Botol meluncur horizontal dengan pelacakan bayangan lantai dan kedalaman 3D',
    iconName: 'MoveHorizontal',
  },
];

// Default initial bottles: empty array. Panggung 3D hanya aktif saat Owner mengunggah PNG transparan.
export const DEFAULT_HERO_BOTTLES: string[] = [];

export const getDefaultTop11Map = (): Record<string, string> => {
  const map: Record<string, string> = {};
  for (let i = 1; i <= 50; i++) {
    map[`top-${i}`] = `${SUPABASE_STORAGE_BASE}top11/top-${i}.jpg`;
  }
  return map;
};

// Authentication session token helpers
export const getOwnerToken = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setOwnerToken = (token: string): void => {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {}
};

export const clearOwnerToken = (): void => {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
};

// Verify Owner PIN via secure server endpoint
export const verifyOwnerPinOnServer = async (
  pin: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const res = await fetch('/api/owner/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setOwnerToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'PIN Pemilik tidak valid!' };
  } catch (err) {
    // Offline / dev fallback: verify locally if offline
    if (pin.trim() === '1995') {
      return { success: true, token: 'local-offline-session' };
    }
    return { success: false, error: 'Koneksi ke server gagal' };
  }
};

// Compress image to ensure it never exceeds browser storage quotas
export const compressImage = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.88
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isPng = file.type === 'image/png';
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // For PNG, keep transparent background; for others, draw as usual
        if (!isPng) {
          ctx.fillStyle = '#0e1017';
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if original is PNG!
        const compressedBase64 = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (e) => reject(e);
      img.src = event.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export interface ServerAssetsResponse {
  logo: string | null;
  chibi: string | null;
  qrisImage?: string | null;
  top11?: Record<string, string>;
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
  ticker?: any;
}

// Fetch public assets from server or cache
export const fetchServerAssets = async (): Promise<ServerAssetsResponse> => {
  try {
    const res = await fetch(`/api/public-assets?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.logo) localStorage.setItem(LOGO_STORAGE_KEY, data.logo);
        if (data.chibi) localStorage.setItem(CHIBI_STORAGE_KEY, data.chibi);
        if (data.qrisImage) localStorage.setItem(QRIS_STORAGE_KEY, data.qrisImage);
        if (data.top11) localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(data.top11));
        if (Array.isArray(data.heroBottles) && data.heroBottles.length > 0) {
          localStorage.setItem(HERO_BOTTLES_STORAGE_KEY, JSON.stringify(data.heroBottles));
        }
        if (data.heroStageEffect) {
          localStorage.setItem(HERO_STAGE_EFFECT_STORAGE_KEY, data.heroStageEffect);
        }
        if (data.heroStageEnabled !== undefined) {
          localStorage.setItem(HERO_STAGE_ENABLED_STORAGE_KEY, data.heroStageEnabled ? 'true' : 'false');
        }
        if (data.heroMediaType) {
          localStorage.setItem(HERO_MEDIA_TYPE_KEY, data.heroMediaType);
        }
        if (data.heroVideoUrl !== undefined) {
          if (data.heroVideoUrl) {
            localStorage.setItem(HERO_VIDEO_URL_KEY, data.heroVideoUrl);
          } else if (data.heroVideoUrl === '') {
            localStorage.removeItem(HERO_VIDEO_URL_KEY);
          }
        }
        if (data.heroVideoPoster !== undefined) {
          if (data.heroVideoPoster) {
            localStorage.setItem(HERO_VIDEO_POSTER_KEY, data.heroVideoPoster);
          } else if (data.heroVideoPoster === '') {
            localStorage.removeItem(HERO_VIDEO_POSTER_KEY);
          }
        }
        if (data.heroVideoFit) {
          localStorage.setItem(HERO_VIDEO_FIT_KEY, data.heroVideoFit);
        }
        if (data.heroVideoPosition) {
          localStorage.setItem(HERO_VIDEO_POS_KEY, data.heroVideoPosition);
        }
        if (data.heroHeightMode) {
          localStorage.setItem(HERO_HEIGHT_MODE_KEY, data.heroHeightMode);
        }
        if (data.pricing) localStorage.setItem('sinki_custom_pricing_config', JSON.stringify(data.pricing));
        if (data.ticker && data.ticker.text) {
          localStorage.setItem('sinki_ticker_config_v1', JSON.stringify(data.ticker));
        }

        return {
          logo: data.logo || DEFAULT_LOGO,
          chibi: data.chibi || DEFAULT_CHIBI,
          qrisImage: data.qrisImage || DEFAULT_QRIS,
          top11: {
            ...getDefaultTop11Map(),
            ...(data.top11 || {}),
          },
          heroBottles: Array.isArray(data.heroBottles) && data.heroBottles.length > 0
            ? data.heroBottles
            : getStoredHeroBottles(),
          heroStageEffect: data.heroStageEffect || getStoredHeroStageEffect(),
          heroStageEnabled: data.heroStageEnabled !== undefined ? data.heroStageEnabled : getStoredHeroStageEnabled(),
          heroMediaType: data.heroMediaType || getStoredHeroMediaType(),
          heroVideoUrl: data.heroVideoUrl || getStoredHeroVideoUrl(),
          heroVideoPoster: data.heroVideoPoster || getStoredHeroVideoPoster(),
          heroVideoFit: data.heroVideoFit || getStoredHeroVideoFit(),
          heroVideoPosition: data.heroVideoPosition || getStoredHeroVideoPosition(),
          heroHeightMode: data.heroHeightMode || getStoredHeroHeightMode(),
          pricing: data.pricing || getStoredPricing(),
          ticker: data.ticker,
        };
      }
    }
  } catch {
    // Expected on static hosting or offline
  }

  return {
    logo: getStoredLogo(),
    chibi: getStoredChibi(),
    qrisImage: getStoredQris(),
    top11: getStoredTop11(),
    heroBottles: getStoredHeroBottles(),
    heroStageEffect: getStoredHeroStageEffect(),
    heroStageEnabled: getStoredHeroStageEnabled(),
    heroMediaType: getStoredHeroMediaType(),
    heroVideoUrl: getStoredHeroVideoUrl(),
    heroVideoPoster: getStoredHeroVideoPoster(),
    heroVideoFit: getStoredHeroVideoFit(),
    heroVideoPosition: getStoredHeroVideoPosition(),
    heroHeightMode: getStoredHeroHeightMode(),
    pricing: getStoredPricing(),
  };
};

// Save Home assets (Logo & Chibi) securely through server endpoint
export const saveAssetToServer = async (
  type: 'logo' | 'chibi',
  base64Data: string,
  pin = '1995'
): Promise<boolean> => {
  try {
    const storageKey = type === 'logo' ? LOGO_STORAGE_KEY : CHIBI_STORAGE_KEY;
    localStorage.setItem(storageKey, base64Data);

    const token = getOwnerToken();
    try {
      const res = await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, [type]: base64Data, token }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data[type]) {
          localStorage.setItem(storageKey, json.data[type]);
        }
      }
    } catch {
      // Ignored if offline
    }

    return true;
  } catch (err) {
    console.error('Failed to sync asset:', err);
    return true;
  }
};

const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

/**
 * Unggah aset gambar langsung ke Supabase Storage Cloud (sinki-media bucket).
 * Berfungsi di static hosting, Cloudflare Pages, maupun server Node.js.
 */
export const uploadAssetDirectlyToSupabase = async (
  storagePath: string,
  base64Data: string
): Promise<string | null> => {
  try {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0]?.replace('data:', '') || 'image/png';
    const raw = window.atob(parts[1] || parts[0]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });

    const uploadUrl = `https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/${storagePath}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (res.ok) {
      return `${SUPABASE_STORAGE_BASE}${storagePath}?v=${Date.now()}`;
    }
  } catch (err) {
    console.warn('[Direct Supabase Asset Upload Notice]:', err);
  }
  return null;
};

// Save Top 11 bottle photo securely through server endpoint and direct Supabase Cloud CDN
export const saveTop11PhotoToServer = async (
  variantId: string,
  base64Data: string,
  pin = '1995'
): Promise<string | null> => {
  try {
    const cleanVariantId = variantId.replace(/^top-top-/, 'top-');
    const baseId = cleanVariantId.replace(/^top-/, '');
    const current = getStoredTop11();
    current[variantId] = base64Data;
    current[cleanVariantId] = base64Data;
    current[`top-${baseId}`] = base64Data;
    current[baseId] = base64Data;
    localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(current));

    let finalUploadedUrl: string | null = null;

    // 1. Coba upload via Node.js API server
    const token = getOwnerToken();
    try {
      const res = await fetch('/api/owner/update-top11', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pin,
          variantId,
          photoData: base64Data,
          token,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.photoUrl) {
          finalUploadedUrl = json.photoUrl;
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. Direct Supabase Storage Cloud Upload (Menjamin foto botol Top 13 s/d 50 langsung terbit di CDN publik)
    if (base64Data.startsWith('data:')) {
      const ext = base64Data.includes('image/png') ? 'png' : 'jpg';
      const cloudUrl = await uploadAssetDirectlyToSupabase(`top11/${cleanVariantId}.${ext}`, base64Data);
      if (cloudUrl) {
        finalUploadedUrl = cloudUrl;
      }
    }

    if (finalUploadedUrl) {
      current[variantId] = finalUploadedUrl;
      current[cleanVariantId] = finalUploadedUrl;
      current[`top-${baseId}`] = finalUploadedUrl;
      current[baseId] = finalUploadedUrl;
      localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(current));
    }

    return finalUploadedUrl || base64Data;
  } catch (err) {
    console.error('Failed to save Top bottle photo:', err);
    return null;
  }
};

export const getStoredLogo = (): string => {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY) || DEFAULT_LOGO;
  } catch {
    return DEFAULT_LOGO;
  }
};

export const getStoredChibi = (): string => {
  try {
    return localStorage.getItem(CHIBI_STORAGE_KEY) || DEFAULT_CHIBI;
  } catch {
    return DEFAULT_CHIBI;
  }
};

export const getStoredTop11 = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(TOP11_STORAGE_KEY);
    return raw ? { ...getDefaultTop11Map(), ...JSON.parse(raw) } : getDefaultTop11Map();
  } catch {
    return getDefaultTop11Map();
  }
};

export const getStoredQris = (): string => {
  try {
    return localStorage.getItem(QRIS_STORAGE_KEY) || DEFAULT_QRIS;
  } catch {
    return DEFAULT_QRIS;
  }
};

export const saveQrisToServer = async (
  base64Data: string,
  pin = '1995'
): Promise<boolean> => {
  try {
    localStorage.setItem(QRIS_STORAGE_KEY, base64Data);

    const token = getOwnerToken();
    try {
      const res = await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, qrisImage: base64Data, token }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.qrisImage) {
          localStorage.setItem(QRIS_STORAGE_KEY, json.data.qrisImage);
        }
      }
    } catch {
      // Ignored if offline
    }

    return true;
  } catch (err) {
    console.error('Failed to sync QRIS asset:', err);
    return true;
  }
};

export const getStoredHeroBottles = (): string[] => {
  try {
    const raw = localStorage.getItem(HERO_BOTTLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any legacy top11/ catalog fallback links
        const validList = parsed.filter(
          (item) => typeof item === 'string' && item.trim() !== '' && !item.includes('top11/top-')
        );
        return validList;
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const getStoredHeroStageEffect = (): HeroStageEffect => {
  try {
    const raw = localStorage.getItem(HERO_STAGE_EFFECT_STORAGE_KEY) as HeroStageEffect;
    if (raw && ['royal-elevation', 'parisian-turntable', 'golden-aura', 'horizon-slide'].includes(raw)) {
      return raw;
    }
    return 'royal-elevation';
  } catch {
    return 'royal-elevation';
  }
};

export const getStoredHeroStageEnabled = (): boolean => {
  try {
    const raw = localStorage.getItem(HERO_STAGE_ENABLED_STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
};

export const saveHeroStageEnabledToServer = async (
  enabled: boolean,
  pin = '1995'
): Promise<boolean> => {
  try {
    localStorage.setItem(HERO_STAGE_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');

    const token = getOwnerToken();
    try {
      await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, heroStageEnabled: enabled, token }),
      });
    } catch {
      // Offline fallback
    }

    return true;
  } catch (err) {
    console.error('Failed to save hero stage enabled status:', err);
    return true;
  }
};

export const saveHeroBottleItemToServer = async (
  index: number,
  base64Data: string,
  pin = '1995'
): Promise<string[]> => {
  try {
    const current = [...getStoredHeroBottles()];
    current[index] = base64Data;
    localStorage.setItem(HERO_BOTTLES_STORAGE_KEY, JSON.stringify(current));

    const token = getOwnerToken();
    try {
      const res = await fetch('/api/owner/update-hero-bottles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, index, bottleData: base64Data, heroBottles: current, token }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.heroBottles && Array.isArray(json.heroBottles)) {
          localStorage.setItem(HERO_BOTTLES_STORAGE_KEY, JSON.stringify(json.heroBottles));
          return json.heroBottles;
        }
      }
    } catch {
      // Offline fallback
    }

    return current;
  } catch (err) {
    console.error('Failed to save hero bottle:', err);
    return getStoredHeroBottles();
  }
};

export const saveHeroStageEffectToServer = async (
  effect: HeroStageEffect,
  pin = '1995'
): Promise<boolean> => {
  try {
    localStorage.setItem(HERO_STAGE_EFFECT_STORAGE_KEY, effect);

    const token = getOwnerToken();
    try {
      await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, heroStageEffect: effect, token }),
      });
    } catch {
      // Offline fallback
    }

    return true;
  } catch (err) {
    console.error('Failed to save hero stage effect:', err);
    return true;
  }
};

export const resetStoredAssets = async (pin = '1995'): Promise<void> => {
  try {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    localStorage.removeItem(CHIBI_STORAGE_KEY);
    localStorage.removeItem(QRIS_STORAGE_KEY);
    localStorage.removeItem(TOP11_STORAGE_KEY);
    localStorage.removeItem(HERO_BOTTLES_STORAGE_KEY);
    localStorage.removeItem(HERO_STAGE_EFFECT_STORAGE_KEY);

    const token = getOwnerToken();
    try {
      await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pin,
          token,
          logo: null,
          chibi: null,
          qrisImage: null,
          top11: {},
          heroBottles: DEFAULT_HERO_BOTTLES,
          heroStageEffect: 'royal-elevation',
        }),
      });
    } catch {
      // Ignored on static hosting
    }
  } catch (e) {
    console.error('Failed to reset storage', e);
  }
};

/**
 * Menghapus foto botol spesifik dari storage lokal
 */
export const removeTop11PhotoFromStorage = (variantIdOrRank: string | number): void => {
  try {
    const raw = localStorage.getItem(TOP11_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      const idStr = String(variantIdOrRank).trim();
      const cleanId = idStr.replace(/^top-/, '');
      delete map[idStr];
      delete map[cleanId];
      delete map[`top-${cleanId}`];
      delete map[`top-${idStr}`];
      localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(map));
    }
  } catch (err) {
    console.warn('Failed removing top11 photo from storage:', err);
  }
};

/**
 * Membersihkan semua cache browser, service worker & memori sementara
 * Memastikan website publik sinkiparfum.my.id memuat versi paling mutakhir 100%.
 */
export const purgeSinkiBrowserCache = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((k) => window.caches.delete(k)));
    }
  } catch (err) {
    console.warn('Purge browser caches notice:', err);
  }
};

export const getStoredHeroVideoUrl = (): string | null => {
  try {
    const val = localStorage.getItem(HERO_VIDEO_URL_KEY);
    if (val !== null) return val || null;
    return DEFAULT_HERO_VIDEO_URL;
  } catch {
    return DEFAULT_HERO_VIDEO_URL;
  }
};

export const getStoredHeroVideoPoster = (): string | null => {
  try {
    const val = localStorage.getItem(HERO_VIDEO_POSTER_KEY);
    if (val !== null) return val || null;
    return DEFAULT_HERO_VIDEO_POSTER;
  } catch {
    return DEFAULT_HERO_VIDEO_POSTER;
  }
};

export const getStoredHeroMediaType = (): 'image' | 'video' => {
  try {
    const val = localStorage.getItem(HERO_MEDIA_TYPE_KEY);
    if (val === 'image') return 'image';
    return 'video';
  } catch {
    return 'video';
  }
};

export const getStoredHeroVideoFit = (): HeroVideoFit => {
  try {
    const val = localStorage.getItem(HERO_VIDEO_FIT_KEY);
    return val === 'contain' ? 'contain' : 'cover';
  } catch {
    return 'cover';
  }
};

export const getStoredHeroVideoPosition = (): HeroVideoPosition => {
  try {
    const val = localStorage.getItem(HERO_VIDEO_POS_KEY);
    return val === 'top' || val === 'bottom' ? val : 'center';
  } catch {
    return 'center';
  }
};

export const getStoredHeroHeightMode = (): HeroHeightMode => {
  try {
    const val = localStorage.getItem(HERO_HEIGHT_MODE_KEY);
    return val === 'compact' || val === 'tall' || val === 'full' ? val : 'full';
  } catch {
    return 'full';
  }
};

/**
 * Menghapus file secara permanen dari Supabase Storage (sinki-media)
 * Mencegah file lama menumpuk saat owner mengganti video atau poster baru.
 */
export const deleteFileFromSupabase = async (fileUrlOrPath: string): Promise<boolean> => {
  try {
    if (!fileUrlOrPath) return false;
    // Bersihkan query string and ambil filename / relative path
    const clean = fileUrlOrPath.replace(SUPABASE_STORAGE_BASE, '').split('?')[0];
    const filename = clean.split('/').pop();
    if (!filename || filename.length < 3) return false;

    const token = getOwnerToken();

    // 1. Coba hapus melalui server endpoint
    try {
      await fetch('/api/owner/delete-storage-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ path: clean, token }),
      });
    } catch {}

    // 2. Direct Supabase Storage REST API DELETE (Bekerja langsung di frontend)
    try {
      await fetch(`https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: [clean, filename] }),
      });
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Supabase Storage Delete File Notice]:', err);
    return false;
  }
};

export const saveHeroVideoSettingsToServer = async (
  settings: {
    heroMediaType?: 'image' | 'video';
    heroVideoUrl?: string | null;
    heroVideoPoster?: string | null;
    heroVideoFit?: HeroVideoFit;
    heroVideoPosition?: HeroVideoPosition;
    heroHeightMode?: HeroHeightMode;
    oldVideoUrlToDelete?: string | null;
  },
  pin = '1995'
): Promise<boolean> => {
  try {
    if (settings.heroMediaType !== undefined) {
      localStorage.setItem(HERO_MEDIA_TYPE_KEY, settings.heroMediaType);
    }
    if (settings.heroVideoUrl !== undefined) {
      if (settings.heroVideoUrl) {
        localStorage.setItem(HERO_VIDEO_URL_KEY, settings.heroVideoUrl);
      } else {
        localStorage.removeItem(HERO_VIDEO_URL_KEY);
      }
    }
    if (settings.heroVideoPoster !== undefined) {
      if (settings.heroVideoPoster) {
        localStorage.setItem(HERO_VIDEO_POSTER_KEY, settings.heroVideoPoster);
      } else {
        localStorage.removeItem(HERO_VIDEO_POSTER_KEY);
      }
    }
    if (settings.heroVideoFit !== undefined) {
      localStorage.setItem(HERO_VIDEO_FIT_KEY, settings.heroVideoFit);
    }
    if (settings.heroVideoPosition !== undefined) {
      localStorage.setItem(HERO_VIDEO_POS_KEY, settings.heroVideoPosition);
    }
    if (settings.heroHeightMode !== undefined) {
      localStorage.setItem(HERO_HEIGHT_MODE_KEY, settings.heroHeightMode);
    }

    const token = getOwnerToken();
    try {
      await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pin,
          token,
          ...settings,
        }),
      });
    } catch {
      // Offline fallback
    }

    return true;
  } catch (err) {
    console.error('Failed to save hero video settings:', err);
    return false;
  }
};

/**
 * Ekstrak frame gambar awal secara otomatis dari video (file atau URL)
 * Menjamin cover/poster otomatis mengikuti gambar video baru tanpa harus potong manual!
 */
export const extractVideoFrame = (
  source: File | string,
  timeSec = 0.5
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let objectUrl: string | null = null;
    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    } else {
      video.src = source;
    }

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const seekTime = Math.min(timeSec, Math.max(0, (video.duration || 1) / 2));
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Canvas capture error (likely CORS for external URL):', err);
      }
      cleanup();
      reject(new Error('Gagal mengekstrak frame video'));
    };

    video.onerror = (e) => {
      cleanup();
      reject(e);
    };

    // Safety timeout
    setTimeout(() => {
      cleanup();
      reject(new Error('Waktu pengambilan frame video habis'));
    }, 10000);
  });
};

/**
 * Unggah video langsung ke Supabase Storage (sinki-media/hero_video.mp4).
 * Otomatis menghapus video lama dari Supabase sebelum mengunggah video baru (Zero Waste Storage).
 */
export const uploadVideoDirectlyToSupabase = async (
  storagePath: string,
  fileOrBlob: Blob,
  contentType = 'video/mp4',
  oldVideoUrlOrPath?: string | null
): Promise<string | null> => {
  try {
    // 1. Hapus video lama dari Supabase jika ada URL video lama
    if (oldVideoUrlOrPath) {
      await deleteFileFromSupabase(oldVideoUrlOrPath);
    }

    // 2. Hapus varian file video lama yang sering digunakan agar storage Supabase tetap ramping
    if (storagePath.includes('hero_video')) {
      const candidates = ['hero_video.webm', 'hero_video.mov', 'sinki_hero.mp4', 'sinki_hero_video.mp4'];
      for (const stale of candidates) {
        if (stale !== storagePath) {
          deleteFileFromSupabase(stale).catch(() => {});
        }
      }
    }

    const uploadUrl = `https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/${storagePath}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: fileOrBlob,
    });

    if (res.ok) {
      return `${SUPABASE_STORAGE_BASE}${storagePath}?v=${Date.now()}`;
    }
  } catch (err) {
    console.warn('[Direct Supabase Video Upload Notice]:', err);
  }
  return null;
};




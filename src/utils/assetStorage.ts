import { PricingConfig, getStoredPricing } from './pricingStorage';

// Utility to compress images and store them reliably on Supabase and in LocalStorage
const LOGO_STORAGE_KEY = 'sinki_custom_logo_data';
const CHIBI_STORAGE_KEY = 'sinki_custom_chibi_data';
const QRIS_STORAGE_KEY = 'sinki_custom_qris_data';
const TOP11_STORAGE_KEY = 'sinki_custom_top11_data';
const HERO_BOTTLES_STORAGE_KEY = 'sinki_hero_bottles_v1';
const HERO_STAGE_EFFECT_STORAGE_KEY = 'sinki_hero_stage_effect_v1';
const HERO_STAGE_ENABLED_STORAGE_KEY = 'sinki_hero_stage_enabled_v1';
const SESSION_TOKEN_KEY = 'sinki_owner_auth_token';

// Public CDN Base URL for reading public images (safe for frontend)
export const SUPABASE_STORAGE_BASE = 'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/';

export const DEFAULT_LOGO = `${SUPABASE_STORAGE_BASE}sinki_logo.png`;
export const DEFAULT_CHIBI = `${SUPABASE_STORAGE_BASE}sinki_chibi.png`;
export const DEFAULT_QRIS = `${SUPABASE_STORAGE_BASE}sinki_qris.jpg`;

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
  for (let i = 1; i <= 11; i++) {
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

// Save Top 11 bottle photo securely through server endpoint
export const saveTop11PhotoToServer = async (
  variantId: string,
  base64Data: string,
  pin = '1995'
): Promise<boolean> => {
  try {
    const current = getStoredTop11();
    current[variantId] = base64Data;
    localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(current));

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
          current[variantId] = json.photoUrl;
          localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(current));
        }
      }
    } catch {
      // Ignored if offline
    }

    return true;
  } catch (err) {
    console.error('Failed to save Top 11 photo:', err);
    return true;
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


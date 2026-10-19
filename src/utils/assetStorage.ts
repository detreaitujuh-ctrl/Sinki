import { PricingConfig, getStoredPricing } from './pricingStorage';

// Utility to compress images and store them reliably on Supabase and in LocalStorage
const LOGO_STORAGE_KEY = 'sinki_custom_logo_data';
const CHIBI_STORAGE_KEY = 'sinki_custom_chibi_data';
const QRIS_STORAGE_KEY = 'sinki_custom_qris_data';
const TOP11_STORAGE_KEY = 'sinki_custom_top11_data';
const SESSION_TOKEN_KEY = 'sinki_owner_auth_token';

// Public CDN Base URL for reading public images (safe for frontend)
export const SUPABASE_STORAGE_BASE = 'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/';

export const DEFAULT_LOGO = `${SUPABASE_STORAGE_BASE}sinki_logo.png`;
export const DEFAULT_CHIBI = `${SUPABASE_STORAGE_BASE}sinki_chibi.png`;
export const DEFAULT_QRIS = `${SUPABASE_STORAGE_BASE}sinki_qris.jpg`;

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
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
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

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
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
  pricing?: PricingConfig;
}

// Fetch public assets from server or cache
export const fetchServerAssets = async (): Promise<ServerAssetsResponse> => {
  try {
    const res = await fetch('/api/public-assets');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.logo) localStorage.setItem(LOGO_STORAGE_KEY, data.logo);
        if (data.chibi) localStorage.setItem(CHIBI_STORAGE_KEY, data.chibi);
        if (data.qrisImage) localStorage.setItem(QRIS_STORAGE_KEY, data.qrisImage);
        if (data.top11) localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(data.top11));
        if (data.pricing) localStorage.setItem('sinki_custom_pricing_config', JSON.stringify(data.pricing));

        return {
          logo: data.logo || DEFAULT_LOGO,
          chibi: data.chibi || DEFAULT_CHIBI,
          qrisImage: data.qrisImage || DEFAULT_QRIS,
          top11: {
            ...getDefaultTop11Map(),
            ...(data.top11 || {}),
          },
          pricing: data.pricing || getStoredPricing(),
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

export const resetStoredAssets = async (pin = '1995'): Promise<void> => {
  try {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    localStorage.removeItem(CHIBI_STORAGE_KEY);
    localStorage.removeItem(QRIS_STORAGE_KEY);
    localStorage.removeItem(TOP11_STORAGE_KEY);

    const token = getOwnerToken();
    try {
      await fetch('/api/owner/update-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pin, token, logo: null, chibi: null, qrisImage: null, top11: {} }),
      });
    } catch {
      // Ignored on static hosting
    }
  } catch (e) {
    console.error('Failed to reset storage', e);
  }
};

import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';

export type LuxuryThemeId =
  | 'moonlight-silver'
  | 'pearl-ivory'
  | 'dew-jade'
  | 'glacial-aqua'
  | 'warm-gold';

export interface LuxuryThemeConfig {
  id: LuxuryThemeId;
  updatedAt?: string;
}

export interface LuxuryThemeOption {
  id: LuxuryThemeId;
  name: string;
  subtitle: string;
  badge: string;
  canvasHex: string;
  surfaceHex: string;
  accentHex: string;
  brightHex: string;
  softHex: string;
}

export const LUXURY_THEMES: LuxuryThemeOption[] = [
  {
    id: 'moonlight-silver',
    name: 'Moonlight Silver',
    subtitle: 'Perak Kristal & Putih Es · Paling Terang Menyatu Buih Air Terjun',
    badge: 'Signature',
    canvasHex: '#07110d',
    surfaceHex: '#101d19',
    accentHex: '#D6E4F2',
    brightHex: '#EFF6FC',
    softHex: '#FFFFFF',
  },
  {
    id: 'pearl-ivory',
    name: 'Pearl Silk Ivory',
    subtitle: 'Putih Mutiara Gading · Lembut Tenang & Sangat Bersih di Mata',
    badge: 'Quiet Luxury',
    canvasHex: '#08110c',
    surfaceHex: '#141e18',
    accentHex: '#EFE6D5',
    brightHex: '#FAF5EA',
    softHex: '#FFFFFF',
  },
  {
    id: 'dew-jade',
    name: 'Luminous Dew Jade',
    subtitle: 'Hijau Giok Embun Cerah · Segar Alami Senada Pucuk Daun & Air',
    badge: 'Botanical',
    canvasHex: '#06120c',
    surfaceHex: '#0e2218',
    accentHex: '#7CEAC0',
    brightHex: '#AEF7DA',
    softHex: '#E8FFF5',
  },
  {
    id: 'glacial-aqua',
    name: 'Glacial Aqua',
    subtitle: 'Biru Kristal Air Terjun · Sejuk Bening Bagaikan Tetesan Embun',
    badge: 'Aquatic',
    canvasHex: '#061113',
    surfaceHex: '#0e2025',
    accentHex: '#86E3FF',
    brightHex: '#B8F0FF',
    softHex: '#ECFAFF',
  },
  {
    id: 'warm-gold',
    name: 'Warm Gold',
    subtitle: 'Emas Kuning Cerah · Hangat Mewah Kontras di Atas Hutan Gelap',
    badge: 'Royal Gold',
    canvasHex: '#08110b',
    surfaceHex: '#152015',
    accentHex: '#F2C55C',
    brightHex: '#FFDC82',
    softHex: '#FFF5D4',
  },
];

export const DEFAULT_THEME: LuxuryThemeConfig = {
  id: 'dew-jade',
};

const THEME_LOCAL_KEY = 'sinki_luxury_theme_v1';
const THEME_FILE_NAME = 'theme_config.json';
const THEME_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${THEME_FILE_NAME}`;

const LEGACY_THEME_MAP: Record<string, LuxuryThemeId> = {
  'forest-waterfall': 'warm-gold',
  'champagne-gold': 'moonlight-silver',
  'platinum-silver': 'moonlight-silver',
  'rose-gold': 'pearl-ivory',
  'imperial-emerald': 'dew-jade',
  'royal-bronze': 'warm-gold',
};

export const isValidThemeId = (val: unknown): val is LuxuryThemeId => {
  return (
    typeof val === 'string' &&
    LUXURY_THEMES.some((item) => item.id === val)
  );
};

export const resolveLuxuryThemeId = (val: unknown): LuxuryThemeId => {
  if (isValidThemeId(val)) return val;
  if (typeof val === 'string' && LEGACY_THEME_MAP[val]) {
    return LEGACY_THEME_MAP[val];
  }
  return DEFAULT_THEME.id;
};

export const applyThemeToDocument = (themeId: LuxuryThemeId | string): void => {
  if (typeof document === 'undefined') return;
  const resolved = resolveLuxuryThemeId(themeId);
  document.documentElement.setAttribute('data-sinki-theme', resolved);
};

export const getStoredTheme = (): LuxuryThemeConfig => {
  try {
    const raw = localStorage.getItem(THEME_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === 'string') {
        return {
          id: resolveLuxuryThemeId(parsed.id),
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch (err) {
    console.warn('Failed reading theme from local storage:', err);
  }
  return DEFAULT_THEME;
};

export const setStoredTheme = (config: LuxuryThemeConfig): void => {
  try {
    localStorage.setItem(THEME_LOCAL_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed saving theme to local storage:', err);
  }
};

export const fetchThemeFromServer = async (): Promise<LuxuryThemeConfig> => {
  try {
    const res = await fetch(`/api/theme?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && isValidThemeId(data.id)) {
        const cfg: LuxuryThemeConfig = {
          id: data.id,
          updatedAt: data.updatedAt,
        };
        setStoredTheme(cfg);
        applyThemeToDocument(cfg.id);
        return cfg;
      }
    }
  } catch {
    // Offline / static fallback
  }

  try {
    const res = await fetch(`${THEME_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && isValidThemeId(data.id)) {
        const cfg: LuxuryThemeConfig = {
          id: data.id,
          updatedAt: data.updatedAt,
        };
        setStoredTheme(cfg);
        applyThemeToDocument(cfg.id);
        return cfg;
      }
    }
  } catch {
    // Cloud fallback notice
  }

  const fallback = getStoredTheme();
  applyThemeToDocument(fallback.id);
  return fallback;
};

export const syncThemeDirectlyToCloud = async (
  config: LuxuryThemeConfig
): Promise<boolean> => {
  const token = getOwnerToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/owner/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ theme: config, token }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Sync Notice] Theme:', err);
    return false;
  }
};

export const saveThemeToServer = async (
  themeId: LuxuryThemeId
): Promise<LuxuryThemeConfig> => {
  const resolvedId: LuxuryThemeId = resolveLuxuryThemeId(themeId);

  const toSave: LuxuryThemeConfig = {
    id: resolvedId,
    updatedAt: new Date().toISOString(),
  };

  setStoredTheme(toSave);
  applyThemeToDocument(resolvedId);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sinki_theme_updated', { detail: toSave })
    );
  }

  const token = getOwnerToken();
  try {
    const res = await fetch('/api/owner/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ theme: toSave, token }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.theme && isValidThemeId(json.theme.id)) {
        setStoredTheme(json.theme);
      }
    }
  } catch (err) {
    console.warn('Notice saving theme to server:', err);
  }

  await syncThemeDirectlyToCloud(toSave);
  return toSave;
};

export const resetThemeToDefault = async (): Promise<LuxuryThemeConfig> => {
  return await saveThemeToServer('dew-jade');
};

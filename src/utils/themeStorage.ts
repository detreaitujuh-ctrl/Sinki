import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';

export type LuxuryThemeId =
  | 'champagne-gold'
  | 'platinum-silver'
  | 'rose-gold'
  | 'imperial-emerald'
  | 'royal-bronze';

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
    id: 'champagne-gold',
    name: 'Champagne Gold',
    subtitle: 'Klasik Haute Parfumerie · Emas Sampanye & Obsidian',
    badge: 'Signature',
    canvasHex: '#08080b',
    surfaceHex: '#131318',
    accentHex: '#D4AF6A',
    brightHex: '#E8C782',
    softHex: '#F3E6C8',
  },
  {
    id: 'platinum-silver',
    name: 'Platinum Argent',
    subtitle: 'Monokrom Horlogerie · Perak Platinum & Onyx',
    badge: 'Horlogerie',
    canvasHex: '#07080b',
    surfaceHex: '#111319',
    accentHex: '#A9B8CB',
    brightHex: '#CEDAE8',
    softHex: '#EDF2F8',
  },
  {
    id: 'rose-gold',
    name: 'Rose Cuivre',
    subtitle: 'Couture Paris · Emas Mawar & Velvet Noir',
    badge: 'Couture',
    canvasHex: '#0a0709',
    surfaceHex: '#161114',
    accentHex: '#D49A8D',
    brightHex: '#E8B6AA',
    softHex: '#F7DFDA',
  },
  {
    id: 'imperial-emerald',
    name: 'Imperial Emerald',
    subtitle: 'Royal Niche Atelier · Zamrud Malachite & Emas Sage',
    badge: 'Royal Atelier',
    canvasHex: '#060a09',
    surfaceHex: '#0e1613',
    accentHex: '#66B598',
    brightHex: '#8AD2B7',
    softHex: '#D6F3E7',
  },
  {
    id: 'royal-bronze',
    name: 'Royal Oud Bronze',
    subtitle: 'Private Reserve · Perunggu Cognac & Kayu Oud',
    badge: 'Reserve',
    canvasHex: '#0b0806',
    surfaceHex: '#17120e',
    accentHex: '#C88954',
    brightHex: '#E2A773',
    softHex: '#F6DEC8',
  },
];

export const DEFAULT_THEME: LuxuryThemeConfig = {
  id: 'champagne-gold',
};

const THEME_LOCAL_KEY = 'sinki_luxury_theme_v1';
const THEME_FILE_NAME = 'theme_config.json';
const THEME_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${THEME_FILE_NAME}`;

const SUPABASE_THEME_UPLOAD_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/theme_config.json';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

export const isValidThemeId = (val: unknown): val is LuxuryThemeId => {
  return (
    typeof val === 'string' &&
    LUXURY_THEMES.some((item) => item.id === val)
  );
};

export const applyThemeToDocument = (themeId: LuxuryThemeId): void => {
  if (typeof document === 'undefined') return;
  const resolved = isValidThemeId(themeId) ? themeId : 'champagne-gold';
  document.documentElement.setAttribute('data-sinki-theme', resolved);
};

export const getStoredTheme = (): LuxuryThemeConfig => {
  try {
    const raw = localStorage.getItem(THEME_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && isValidThemeId(parsed.id)) {
        return {
          id: parsed.id,
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
  try {
    const res = await fetch(SUPABASE_THEME_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
        'cache-control': 'no-cache, no-store, max-age=0',
      },
      body: JSON.stringify(config, null, 2),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Direct Cloud Sync Notice] Theme:', err);
    return false;
  }
};

export const saveThemeToServer = async (
  themeId: LuxuryThemeId
): Promise<LuxuryThemeConfig> => {
  const resolvedId: LuxuryThemeId = isValidThemeId(themeId)
    ? themeId
    : 'champagne-gold';

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
  return await saveThemeToServer('champagne-gold');
};

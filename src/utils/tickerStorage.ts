import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';

export type TickerFont = 'cinzel' | 'playfair' | 'jakarta' | 'cormorant';

export interface TickerConfig {
  text: string;
  font: TickerFont;
  updatedAt?: string;
}

export interface TickerFontOption {
  id: TickerFont;
  name: string;
  fontFamily: string;
  styleClass: string;
  badge: string;
  desc: string;
  previewSample: string;
}

export const TICKER_FONTS: TickerFontOption[] = [
  {
    id: 'cinzel',
    name: 'Manrope Bold',
    fontFamily: 'var(--font-heading)',
    styleClass: 'font-heading font-semibold tracking-[0.04em]',
    badge: 'Luxury Heading',
    desc: 'Tegas, modern & eksklusif khas butik parfum premium',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
  {
    id: 'playfair',
    name: 'Inter Editorial Italic',
    fontFamily: 'var(--font-body)',
    styleClass: 'font-body font-medium italic tracking-[0.01em]',
    badge: 'Modern Italic',
    desc: 'Halus, elegan & nyaman dibaca di layar ponsel',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
  {
    id: 'jakarta',
    name: 'Inter Clean Medium',
    fontFamily: 'var(--font-body)',
    styleClass: 'font-body font-medium tracking-[0.01em]',
    badge: 'Clean UI',
    desc: 'Sangat bersih, jernih & paling mudah dibaca cepat di HP',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
  {
    id: 'cormorant',
    name: 'Manrope Refined',
    fontFamily: 'var(--font-heading)',
    styleClass: 'font-heading font-medium tracking-[0.02em]',
    badge: 'Refined Modern',
    desc: 'Proporsional, rapi & selaras dengan identitas SINKI',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
];

export const DEFAULT_TICKER: TickerConfig = {
  text: 'Min. Rp150.000, gratis ongkir se-Jabodetabek! 😍',
  font: 'cormorant',
};

const TICKER_LOCAL_KEY = 'sinki_ticker_config_v1';
const TICKER_FILE_NAME = 'ticker_config.json';
const TICKER_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${TICKER_FILE_NAME}`;

export const getStoredTicker = (): TickerConfig => {
  try {
    const raw = localStorage.getItem(TICKER_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
        return {
          text: parsed.text.trim(),
          font: parsed.font || 'cormorant',
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch (err) {
    console.error('Failed reading ticker from local storage:', err);
  }
  return DEFAULT_TICKER;
};

export const setStoredTicker = (config: TickerConfig) => {
  try {
    localStorage.setItem(TICKER_LOCAL_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed setting ticker in local storage:', err);
  }
};

export const fetchTickerFromServer = async (): Promise<TickerConfig> => {
  try {
    const res = await fetch(`/api/ticker?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim()) {
        const config: TickerConfig = {
          text: data.text.trim(),
          font: data.font || 'cinzel',
          updatedAt: data.updatedAt,
        };
        setStoredTicker(config);
        return config;
      }
    }
  } catch {
    // Offline / static
  }

  try {
    const res = await fetch(`${TICKER_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim()) {
        const config: TickerConfig = {
          text: data.text.trim(),
          font: data.font || 'cinzel',
          updatedAt: data.updatedAt,
        };
        setStoredTicker(config);
        return config;
      }
    }
  } catch (err) {
    console.warn('CDN ticker fetch notice:', err);
  }

  return getStoredTicker();
};

/**
 * Menyinkronkan teks berjalan (ticker) melalui backend API yang aman.
 * Menjamin perubahan ticker tersimpan ke cloud tanpa mengekspos kredensial di frontend.
 */
export const syncTickerDirectlyToCloud = async (config: TickerConfig): Promise<boolean> => {
  const token = getOwnerToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/owner/update-ticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticker: config, token }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Sync Notice] Ticker:', err);
    return false;
  }
};

export const saveTickerToServer = async (config: TickerConfig): Promise<TickerConfig> => {
  const toSave: TickerConfig = {
    text: config.text.trim() || DEFAULT_TICKER.text,
    font: config.font || 'cormorant',
    updatedAt: new Date().toISOString(),
  };

  setStoredTicker(toSave);

  const token = getOwnerToken();
  try {
    const res = await fetch('/api/owner/update-ticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ticker: toSave, token }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.ticker) {
        setStoredTicker(json.ticker);
      }
    }
  } catch (err) {
    console.warn('Notice saving ticker to server:', err);
  }

  // Sync langsung ke Supabase Cloud Storage
  await syncTickerDirectlyToCloud(toSave);

  return toSave;
};

export const resetTickerToDefault = async (): Promise<TickerConfig> => {
  return await saveTickerToServer(DEFAULT_TICKER);
};

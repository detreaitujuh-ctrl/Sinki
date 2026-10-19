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
    name: 'Cinzel',
    fontFamily: "'Cinzel', serif",
    styleClass: 'font-cinzel tracking-[0.16em]',
    badge: 'Royal Roman',
    desc: 'Mewah klasik, tajam & berwibawa khas brand kerajaan',
    previewSample: 'TAHAN 8 JAM, DIA AJA GAK TAHAN',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    fontFamily: "'Playfair Display', Georgia, serif",
    styleClass: 'font-playfair tracking-[0.06em] italic',
    badge: 'Haute Vogue',
    desc: 'Anggun, puitis & berkelas editorial majalah Paris',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    styleClass: 'font-jakarta tracking-[0.08em] font-semibold',
    badge: 'Modern Clean',
    desc: 'Sangat bersih, jelas & paling mudah dibaca cepat di HP',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond',
    fontFamily: "'Cormorant Garamond', Garamond, serif",
    styleClass: 'font-cormorant tracking-[0.11em] text-[10.5px] font-semibold',
    badge: 'Parisian Niche',
    desc: 'Ramping, aristokrat & eksotis ala botol parfum vintage',
    previewSample: 'Tahan 8 jam, dia aja yang gak tahan',
  },
];

export const DEFAULT_TICKER: TickerConfig = {
  text: 'Tahan 8 jam, dia aja yang gak tahan 😏',
  font: 'cinzel',
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
          font: parsed.font || 'cinzel',
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
    const res = await fetch('/api/ticker', { cache: 'no-store' });
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

export const saveTickerToServer = async (config: TickerConfig): Promise<TickerConfig> => {
  const toSave: TickerConfig = {
    text: config.text.trim() || DEFAULT_TICKER.text,
    font: config.font || 'cinzel',
    updatedAt: new Date().toISOString(),
  };

  setStoredTicker(toSave);

  const token = getOwnerToken();
  try {
    await fetch('/api/owner/update-ticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ticker: toSave, token, pin: '1995' }),
    });
  } catch (err) {
    console.warn('Notice saving ticker to server:', err);
  }

  return toSave;
};

export const resetTickerToDefault = async (): Promise<TickerConfig> => {
  return await saveTickerToServer(DEFAULT_TICKER);
};

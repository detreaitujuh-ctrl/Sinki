// Utility to track, persist, and visualize real-time visitor analytics for Sinki
// Records origin/referrer (Instagram, TikTok, WhatsApp, Google, Direct, etc.), devices, and pages.

export interface VisitorEvent {
  id: string;
  timestamp: string; // ISO string
  source: string; // 'Instagram' | 'TikTok' | 'WhatsApp' | 'Facebook' | 'Google' | 'Shopee' | 'X (Twitter)' | 'Direct' | 'Lainnya'
  sourceDetail: string; // Raw referrer or UTM info
  page: string; // 'Beranda' | 'Top 11' | 'Katalog Koleksi' | 'Review Pembeli' | 'Order VIP' | 'Dimensi Sinki'
  device: 'Mobile' | 'Desktop' | 'Tablet';
  os: 'Android' | 'iOS' | 'Windows' | 'Mac' | 'Lainnya';
  path: string;
}

export interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  startedAt: string;
  sources: {
    instagram: number;
    tiktok: number;
    whatsapp: number;
    facebook: number;
    google: number;
    shopee: number;
    tokopedia: number;
    direct: number;
    other: number;
  };
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  os: {
    android: number;
    ios: number;
    windows: number;
    mac: number;
    other: number;
  };
  pages: Record<string, number>;
  dailyTrends: Record<string, number>; // "YYYY-MM-DD" -> count
  hourlyTrends: number[]; // 24 hours [0..23] -> count
  recentVisitors: VisitorEvent[];
}

export const EMPTY_ANALYTICS: AnalyticsData = {
  totalVisits: 0,
  uniqueVisitors: 0,
  startedAt: new Date().toISOString(),
  sources: {
    instagram: 0,
    tiktok: 0,
    whatsapp: 0,
    facebook: 0,
    google: 0,
    shopee: 0,
    tokopedia: 0,
    direct: 0,
    other: 0,
  },
  devices: {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  },
  os: {
    android: 0,
    ios: 0,
    windows: 0,
    mac: 0,
    other: 0,
  },
  pages: {
    Beranda: 0,
    'Top 11 Bestseller': 0,
    'Katalog Koleksi': 0,
    'Review Pembeli': 0,
    'Order VIP': 0,
  },
  dailyTrends: {},
  hourlyTrends: Array(24).fill(0),
  recentVisitors: [],
};

const STORAGE_KEY = 'sinki_visitor_analytics_v1';
const VISITOR_ID_KEY = 'sinki_analytics_vid';
const SESSION_TIMESTAMP_KEY = 'sinki_last_session_time';

/**
 * Mendeteksi sumber pengunjung dari referrer atau parameter UTM
 */
export function detectSource(referrer: string, searchParams: URLSearchParams): { source: string; detail: string; key: keyof AnalyticsData['sources'] } {
  const utmSource = (searchParams.get('utm_source') || searchParams.get('source') || searchParams.get('ref') || '').toLowerCase();
  const utmMedium = (searchParams.get('utm_medium') || '').toLowerCase();
  const ref = (referrer || '').toLowerCase();

  // 1. Cek parameter UTM jika ada promosi terarah
  if (utmSource.includes('instagram') || utmMedium.includes('instagram')) {
    return { source: 'Instagram', detail: 'Link Bio/Story IG (UTM)', key: 'instagram' };
  }
  if (utmSource.includes('tiktok') || utmMedium.includes('tiktok')) {
    return { source: 'TikTok', detail: 'Link Bio TikTok (UTM)', key: 'tiktok' };
  }
  if (utmSource.includes('wa') || utmSource.includes('whatsapp') || utmMedium.includes('wa')) {
    return { source: 'WhatsApp', detail: 'Chat / Broadcast WA (UTM)', key: 'whatsapp' };
  }
  if (utmSource.includes('facebook') || utmSource.includes('fb') || utmMedium.includes('fb')) {
    return { source: 'Facebook', detail: 'Post/Ads Facebook (UTM)', key: 'facebook' };
  }
  if (utmSource.includes('google')) {
    return { source: 'Google', detail: 'Google Ads/Search (UTM)', key: 'google' };
  }
  if (utmSource.includes('shopee')) {
    return { source: 'Shopee', detail: 'Shopee Link (UTM)', key: 'shopee' };
  }
  if (utmSource.includes('tokopedia')) {
    return { source: 'Tokopedia', detail: 'Tokopedia Link (UTM)', key: 'tokopedia' };
  }

  // 2. Cek HTTP Referrer browser asli
  if (ref) {
    if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
      return { source: 'Instagram', detail: 'Aplikasi / Web Instagram', key: 'instagram' };
    }
    if (ref.includes('tiktok.com') || ref.includes('link.tiktok.com')) {
      return { source: 'TikTok', detail: 'Aplikasi / Bio TikTok', key: 'tiktok' };
    }
    if (ref.includes('whatsapp.com') || ref.includes('wa.me') || ref.includes('api.whatsapp.com')) {
      return { source: 'WhatsApp', detail: 'Chat WhatsApp', key: 'whatsapp' };
    }
    if (ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('l.facebook.com') || ref.includes('m.facebook.com')) {
      return { source: 'Facebook', detail: 'Aplikasi / Beranda Facebook', key: 'facebook' };
    }
    if (ref.includes('google.') || ref.includes('googleusercontent.com')) {
      return { source: 'Google', detail: 'Pencarian Google Search', key: 'google' };
    }
    if (ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) {
      return { source: 'X (Twitter)', detail: 'Aplikasi / Web X', key: 'other' };
    }
    if (ref.includes('shopee.')) {
      return { source: 'Shopee', detail: 'Aplikasi Shopee', key: 'shopee' };
    }
    if (ref.includes('tokopedia.')) {
      return { source: 'Tokopedia', detail: 'Aplikasi Tokopedia', key: 'tokopedia' };
    }
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      return { source: 'YouTube', detail: 'Deskripsi / Link Video YouTube', key: 'other' };
    }
    try {
      const parsedUrl = new URL(ref);
      return { source: 'Website Lain', detail: parsedUrl.hostname, key: 'other' };
    } catch {
      return { source: 'Website Lain', detail: ref.slice(0, 30), key: 'other' };
    }
  }

  // 3. Tanpa Referrer = Langsung / Direct
  return { source: 'Direct / Langsung', detail: 'Ketik URL / Bookmark / Kontak', key: 'direct' };
}

/**
 * Mendeteksi tipe perangkat pengguna
 */
export function detectDevice(): { device: 'Mobile' | 'Desktop' | 'Tablet'; os: 'Android' | 'iOS' | 'Windows' | 'Mac' | 'Lainnya' } {
  if (typeof navigator === 'undefined') {
    return { device: 'Mobile', os: 'Lainnya' };
  }
  const ua = navigator.userAgent || '';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua);
  const isMobile = /Mobile|iPhone|Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let device: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  if (isTablet) device = 'Tablet';
  else if (isMobile) device = 'Mobile';

  let os: 'Android' | 'iOS' | 'Windows' | 'Mac' | 'Lainnya' = 'Lainnya';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';

  return { device, os };
}

/**
 * Mengambil data analitik lokal
 */
export function getLocalAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...EMPTY_ANALYTICS,
        ...parsed,
        sources: { ...EMPTY_ANALYTICS.sources, ...(parsed.sources || {}) },
        devices: { ...EMPTY_ANALYTICS.devices, ...(parsed.devices || {}) },
        os: { ...EMPTY_ANALYTICS.os, ...(parsed.os || {}) },
        pages: { ...EMPTY_ANALYTICS.pages, ...(parsed.pages || {}) },
        dailyTrends: { ...(parsed.dailyTrends || {}) },
        hourlyTrends: Array.isArray(parsed.hourlyTrends) && parsed.hourlyTrends.length === 24
          ? parsed.hourlyTrends
          : Array(24).fill(0),
        recentVisitors: Array.isArray(parsed.recentVisitors) ? parsed.recentVisitors : [],
      };
    }
  } catch (err) {
    console.error('Failed to parse local analytics:', err);
  }
  return EMPTY_ANALYTICS;
}

/**
 * Menyimpan data analitik lokal
 */
export function saveLocalAnalytics(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save analytics to localStorage:', e);
  }
}

/**
 * Mencatat Kunjungan Real-Time (Mulai dari Nol, Akurat & Real)
 */
export function recordVisit(pageName: string = 'Beranda'): AnalyticsData {
  if (typeof window === 'undefined') return EMPTY_ANALYTICS;

  // Jangan rekam kunjungan jika sedang di panel admin internal dimensi-sinki
  const currentPath = window.location.pathname;
  if (currentPath.includes('dimensi-sinki') || window.location.hash.includes('dimensi-sinki')) {
    return getLocalAnalytics();
  }

  const referrer = document.referrer || '';
  const searchParams = new URLSearchParams(window.location.search);
  const detected = detectSource(referrer, searchParams);
  const { device, os } = detectDevice();

  // Pengunjung Unik Tracker
  let isUnique = false;
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    isUnique = true;
  } else {
    // Jika sesi sebelumnya sudah lebih dari 4 jam, hitung sebagai kunjungan baru
    const lastSession = Number(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0');
    if (Date.now() - lastSession > 4 * 60 * 60 * 1000) {
      isUnique = true;
    }
  }
  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());

  // Ambil state terkini
  const current = getLocalAnalytics();

  // Update angka
  const updatedTotal = current.totalVisits + 1;
  const updatedUnique = current.uniqueVisitors + (isUnique ? 1 : 0);

  const updatedSources = {
    ...current.sources,
    [detected.key]: (current.sources[detected.key] || 0) + 1,
  };

  const deviceKey = device.toLowerCase() as 'mobile' | 'desktop' | 'tablet';
  const updatedDevices = {
    ...current.devices,
    [deviceKey]: (current.devices[deviceKey] || 0) + 1,
  };

  const osKey = os.toLowerCase() as 'android' | 'ios' | 'windows' | 'mac' | 'other';
  const updatedOs = {
    ...current.os,
    [osKey]: (current.os[osKey] || 0) + 1,
  };

  const updatedPages = {
    ...current.pages,
    [pageName]: (current.pages[pageName] || 0) + 1,
  };

  // Tanggal & Jam
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const hour = now.getHours();

  const updatedDaily = {
    ...current.dailyTrends,
    [dateStr]: (current.dailyTrends[dateStr] || 0) + 1,
  };

  const updatedHourly = [...current.hourlyTrends];
  updatedHourly[hour] = (updatedHourly[hour] || 0) + 1;

  // New Event Feed
  const newEvent: VisitorEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: now.toISOString(),
    source: detected.source,
    sourceDetail: detected.detail,
    page: pageName,
    device,
    os,
    path: window.location.pathname + window.location.search,
  };

  // Keep last 40 visitor logs
  const updatedRecent = [newEvent, ...current.recentVisitors].slice(0, 40);

  const finalData: AnalyticsData = {
    totalVisits: updatedTotal,
    uniqueVisitors: updatedUnique,
    startedAt: current.startedAt || now.toISOString(),
    sources: updatedSources,
    devices: updatedDevices,
    os: updatedOs,
    pages: updatedPages,
    dailyTrends: updatedDaily,
    hourlyTrends: updatedHourly,
    recentVisitors: updatedRecent,
  };

  saveLocalAnalytics(finalData);

  // Sync secara asinkron ke server & Supabase tanpa memblokir UI
  syncVisitToServer(newEvent, finalData).catch(() => {});

  return finalData;
}

/**
 * Sync visit data ke server backend
 */
async function syncVisitToServer(event: VisitorEvent, snapshot: AnalyticsData): Promise<void> {
  try {
    await fetch('/api/analytics/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, snapshot }),
    });
  } catch {
    // Silent fail jika offline / static mode
  }
}

/**
 * Fetch analytics dari server atau Supabase
 */
export async function fetchAnalyticsFromServer(): Promise<AnalyticsData> {
  try {
    const res = await fetch('/api/analytics', { cache: 'no-store' });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData.totalVisits === 'number') {
        saveLocalAnalytics(serverData);
        return serverData;
      }
    }
  } catch {
    // Fallback ke localStorage
  }
  return getLocalAnalytics();
}

/**
 * Reset data analitik kembali murni ke 0 (Hanya Owner/Pengelola dengan PIN 1995)
 */
export async function resetAnalyticsData(pin = '1995'): Promise<AnalyticsData> {
  const freshZeroData: AnalyticsData = {
    ...EMPTY_ANALYTICS,
    startedAt: new Date().toISOString(),
  };

  saveLocalAnalytics(freshZeroData);

  try {
    await fetch('/api/owner/reset-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
  } catch (err) {
    console.warn('Notice resetting server analytics:', err);
  }

  return freshZeroData;
}

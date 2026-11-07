import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';
import {
  PERFUMES_DATA,
  PerfumeItem,
  PerfumeCategory,
  CollectionCategoryKey,
  PricePerMlRate,
  COLLECTION_CATEGORIES,
} from '../data/perfumes';

export type { PerfumeItem, PerfumeCategory, CollectionCategoryKey, PricePerMlRate };
export { COLLECTION_CATEGORIES };

const PERFUMES_LOCAL_KEY = 'sinki_perfumes_catalog_v5';
const PERFUMES_FILE_NAME = 'perfumes_catalog.json';
const PERFUMES_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${PERFUMES_FILE_NAME}`;

const DEFAULT_BY_ID = new Map<string, PerfumeItem>(PERFUMES_DATA.map((p) => [p.id, p]));
const DEFAULT_BY_NAME = new Map<string, PerfumeItem>(
  PERFUMES_DATA.map((p) => [p.name.trim().toLowerCase(), p])
);

const VALID_COLLECTION_KEYS = new Set<string>([
  'daily_fresh',
  'professional',
  'attraction',
  'luxury',
  'viral_hits',
  'new_trending',
]);

/**
 * Menyinkronkan seluruh daftar parfum melalui backend API yang aman.
 * Menjamin perubahan / penghapusan varian tersimpan ke cloud tanpa mengekspos kredensial di frontend.
 */
export const syncPerfumesDirectlyToCloud = async (list: PerfumeItem[]): Promise<boolean> => {
  const token = getOwnerToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/owner/update-perfumes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ perfumes: list, token }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Sync Notice] Perfumes Catalog:', err);
    return false;
  }
};

/**
 * Normalisasi data parfum:
 * - Memastikan field isActive ada
 * - Memetakan otomatis 68 varian lama yang belum memiliki collectionCategories / pricePerMl (Opsi A)
 * - Tetap menghormati pilihan kosong [] jika Admin memang sengaja mencabut semua kategori dari suatu varian
 */
export const normalizePerfumes = (list: PerfumeItem[]): PerfumeItem[] => {
  return list.map((item) => {
    const fallback =
      DEFAULT_BY_ID.get(item.id) || DEFAULT_BY_NAME.get((item.name || '').trim().toLowerCase());

    let resolvedCategories: CollectionCategoryKey[];
    if (Array.isArray(item.collectionCategories)) {
      resolvedCategories = item.collectionCategories.filter((c) =>
        VALID_COLLECTION_KEYS.has(c)
      ) as CollectionCategoryKey[];
    } else if (fallback?.collectionCategories) {
      resolvedCategories = [...fallback.collectionCategories];
    } else {
      resolvedCategories = [];
    }

    const resolvedPrice: PricePerMlRate | undefined = resolvedCategories.includes('new_trending')
      ? 4000
      : resolvedCategories.includes('viral_hits')
      ? 3000
      : undefined;

    const resolvedUsage =
      item.usageRecommendation !== undefined
        ? item.usageRecommendation
        : fallback?.usageRecommendation || '';

    const normalizedItem: PerfumeItem = {
      ...item,
      isActive: item.isActive !== false,
      collectionCategories: resolvedCategories,
      usageRecommendation: resolvedUsage,
    };

    if (resolvedPrice !== undefined) {
      normalizedItem.pricePerMl = resolvedPrice;
    } else {
      delete normalizedItem.pricePerMl;
    }

    return normalizedItem;
  });
};

/**
 * Mengambil daftar varian dari local storage (instan 0 detik)
 */
export const getStoredPerfumes = (): PerfumeItem[] => {
  try {
    const raw = localStorage.getItem(PERFUMES_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizePerfumes(parsed);
      }
    }
  } catch (err) {
    console.error('Failed reading perfumes from local storage:', err);
  }
  return normalizePerfumes(PERFUMES_DATA);
};

/**
 * Simpan daftar varian ke local storage
 */
export const setStoredPerfumes = (list: PerfumeItem[]) => {
  try {
    localStorage.setItem(PERFUMES_LOCAL_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('sinki_perfumes_updated', { detail: list }));
  } catch (err) {
    console.error('Failed setting perfumes in local storage:', err);
  }
};

/**
 * Mengambil data varian terkini dari server atau CDN publik dengan cache-buster
 */
export const fetchPerfumesFromServer = async (): Promise<PerfumeItem[]> => {
  try {
    const res = await fetch(`/api/perfumes?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = normalizePerfumes(data);
        setStoredPerfumes(normalized);
        return normalized;
      }
    }
  } catch {
    // Offline / static
  }

  try {
    const res = await fetch(`${PERFUMES_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = normalizePerfumes(data);
        setStoredPerfumes(normalized);
        return normalized;
      }
    }
  } catch (err) {
    console.warn('CDN perfumes fetch notice:', err);
  }

  return getStoredPerfumes();
};

/**
 * Simpan seluruh daftar varian ke server, Cloud Storage & LocalStorage
 */
export const savePerfumesToServer = async (list: PerfumeItem[]): Promise<PerfumeItem[]> => {
  const normalized = normalizePerfumes(list);
  setStoredPerfumes(normalized);

  // 1. Simpan ke server Express jika Node aktif
  const token = getOwnerToken();
  try {
    await fetch('/api/owner/update-perfumes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ perfumes: normalized, token }),
    });
  } catch (err) {
    console.warn('Notice saving perfumes to server:', err);
  }

  // 2. Selalu sinkronkan langsung ke Supabase Storage agar cloud publik langsung terupdate
  await syncPerfumesDirectlyToCloud(normalized);

  return normalized;
};

/**
 * Reset seluruh varian kembali ke 68 varian bawaan SINKI
 */
export const resetPerfumesToDefault = async (): Promise<PerfumeItem[]> => {
  return await savePerfumesToServer(PERFUMES_DATA);
};

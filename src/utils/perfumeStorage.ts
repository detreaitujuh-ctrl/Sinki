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
const SUPABASE_STORAGE_UPLOAD_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/perfumes_catalog.json';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

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
 * Menyinkronkan seluruh daftar parfum langsung ke Supabase Cloud Storage (sinki-media bucket).
 * Menjamin perubahan / penghapusan varian langsung tersimpan ke cloud pada static hosting & Cloudflare.
 */
export const syncPerfumesDirectlyToCloud = async (list: PerfumeItem[]): Promise<boolean> => {
  try {
    const res = await fetch(SUPABASE_STORAGE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
        'cache-control': 'no-cache, no-store, max-age=0',
      },
      body: JSON.stringify(list, null, 2),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Direct Cloud Sync Notice] Perfumes Catalog:', err);
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

    const resolvedPrice: PricePerMlRate =
      item.pricePerMl === 4000
        ? 4000
        : item.pricePerMl === 3000
        ? 3000
        : fallback?.pricePerMl || 3000;

    const resolvedUsage =
      item.usageRecommendation !== undefined
        ? item.usageRecommendation
        : fallback?.usageRecommendation || '';

    return {
      ...item,
      isActive: item.isActive !== false,
      collectionCategories: resolvedCategories,
      pricePerMl: resolvedPrice,
      usageRecommendation: resolvedUsage,
    };
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

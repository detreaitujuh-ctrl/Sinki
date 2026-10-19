import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';
import { PERFUMES_DATA, PerfumeItem, PerfumeCategory } from '../data/perfumes';

export type { PerfumeItem, PerfumeCategory };

const PERFUMES_LOCAL_KEY = 'sinki_perfumes_catalog_v1';
const PERFUMES_FILE_NAME = 'perfumes_catalog.json';
const PERFUMES_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${PERFUMES_FILE_NAME}`;

/**
 * Normalisasi data parfum memastikan field isActive ada
 */
export const normalizePerfumes = (list: PerfumeItem[]): PerfumeItem[] => {
  return list.map((item) => ({
    ...item,
    isActive: item.isActive !== false, // default true jika belum diset
  }));
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
  } catch (err) {
    console.error('Failed setting perfumes in local storage:', err);
  }
};

/**
 * Mengambil data varian terkini dari server atau CDN publik
 */
export const fetchPerfumesFromServer = async (): Promise<PerfumeItem[]> => {
  try {
    const res = await fetch('/api/perfumes', { cache: 'no-store' });
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
 * Simpan seluruh daftar varian ke server & LocalStorage
 */
export const savePerfumesToServer = async (list: PerfumeItem[]): Promise<PerfumeItem[]> => {
  const normalized = normalizePerfumes(list);
  setStoredPerfumes(normalized);

  const token = getOwnerToken();
  try {
    await fetch('/api/owner/update-perfumes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ perfumes: normalized, token, pin: '1995' }),
    });
  } catch (err) {
    console.warn('Notice saving perfumes to server:', err);
  }

  return normalized;
};

/**
 * Reset seluruh varian kembali ke 60 varian bawaan SINKI
 */
export const resetPerfumesToDefault = async (): Promise<PerfumeItem[]> => {
  return await savePerfumesToServer(PERFUMES_DATA);
};

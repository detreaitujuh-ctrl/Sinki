import { Top11Item, TOP_11_DATA } from '../data/top11';
import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';

export type { Top11Item } from '../data/top11';

const STORAGE_KEY = 'sinki_top_perfumes_v2';
const TOP_PERFUMES_FILE_NAME = 'top_perfumes.json';
const TOP_PERFUMES_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${TOP_PERFUMES_FILE_NAME}`;
const SUPABASE_STORAGE_UPLOAD_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/top_perfumes.json';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

/**
 * Menyinkronkan daftar Top Bestseller langsung ke Supabase Storage Cloud (Metode Upsert Permanen).
 * Memastikan bahwa perubahan varian langsung tersimpan ke cloud bahkan saat aplikasi dibuka di Cloudflare / static hosting tanpa backend Node.js aktif.
 */
export const syncTopPerfumesDirectlyToCloud = async (items: Top11Item[]): Promise<boolean> => {
  try {
    const res = await fetch(SUPABASE_STORAGE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: JSON.stringify(items, null, 2),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Direct Cloud Sync Notice] Top Perfumes:', err);
    return false;
  }
};

/**
 * Normalisasi varian Top Bestseller:
 * - Menghilangkan tanda '#' pada badge dan rank (karena aturan wajib tanpa '#')
 * - Memastikan ranking berurutan 1, 2, 3 ...
 */
export const cleanTopPerfumes = (items: Top11Item[]): Top11Item[] => {
  return items.map((item, idx) => {
    const rank = item.rank || idx + 1;
    let badge = item.badge || `TOP ${rank}`;
    // Hapus tanda pagar '#' jika ada
    badge = badge.replace(/^#\s*/, '').replace(/^#(\d+)/, '$1');
    return {
      ...item,
      rank,
      badge,
    };
  });
};

// Format awal varian dengan angka murni (tanpa tanda #)
export const INITIAL_TOP_PERFUMES: Top11Item[] = cleanTopPerfumes(TOP_11_DATA);

/**
 * Mengambil daftar varian Top dari LocalStorage secara instan (0 detik)
 */
export const getStoredTopPerfumes = (): Top11Item[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_TOP_PERFUMES.length) {
        return cleanTopPerfumes(parsed);
      }
    }
  } catch (err) {
    console.error('Error loading top perfumes from storage:', err);
  }
  return INITIAL_TOP_PERFUMES;
};

/**
 * Simpan ke LocalStorage dan picu event UI
 */
export const setStoredTopPerfumes = (items: Top11Item[]): void => {
  try {
    const cleaned = cleanTopPerfumes(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('sinki_top_perfumes_updated', { detail: cleaned }));
  } catch (err) {
    console.error('Error setting top perfumes in local storage:', err);
  }
};

/**
 * Mengambil data Top Bestseller terkini dari Server atau Supabase Cloud CDN.
 * Digunakan oleh publik & pemilik agar daftar selalu sinkron secara global.
 */
export const fetchTopPerfumesFromServer = async (): Promise<Top11Item[]> => {
  // 1. Coba ambil dari Server Node.js / Express API
  try {
    const res = await fetch(`/api/top-perfumes?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = cleanTopPerfumes(data);
        setStoredTopPerfumes(cleaned);
        return cleaned;
      }
    }
  } catch {
    // Offline atau mode statis
  }

  // 2. Fallback: Coba ambil langsung dari Supabase Storage CDN
  try {
    const res = await fetch(`${TOP_PERFUMES_PUBLIC_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = cleanTopPerfumes(data);
        setStoredTopPerfumes(cleaned);
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('CDN top perfumes fetch notice:', err);
  }

  // 3. Fallback terakhir ke cache browser lokal
  return getStoredTopPerfumes();
};

/**
 * Simpan daftar Top Bestseller ke Server & Supabase Cloud Storage
 */
export const saveTopPerfumesToServer = async (items: Top11Item[]): Promise<Top11Item[]> => {
  const cleaned = cleanTopPerfumes(items);
  setStoredTopPerfumes(cleaned);

  // 1. Coba simpan via API server Express jika backend Node aktif
  const token = getOwnerToken();
  try {
    const res = await fetch('/api/owner/update-top-perfumes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ topPerfumes: cleaned, token, pin: '1995' }),
    });

    if (!res.ok) {
      console.warn('Server notice when updating top perfumes:', res.statusText);
    }
  } catch (err) {
    console.warn('Notice saving top perfumes to server:', err);
  }

  // 2. Selalu sinkronkan langsung ke Supabase Cloud Storage (bekerja 100% di Cloudflare & static hosting)
  await syncTopPerfumesDirectlyToCloud(cleaned);

  return cleaned;
};

/**
 * Simpan perubahan Top Bestseller:
 * Menulis ke LocalStorage sekaligus menyinkronkan ke server dan cloud.
 */
export const saveTopPerfumesToStorage = (items: Top11Item[]): void => {
  const cleaned = cleanTopPerfumes(items);
  setStoredTopPerfumes(cleaned);
  // Sinkronkan ke server & cloud di latar belakang
  saveTopPerfumesToServer(cleaned).catch((err) => {
    console.warn('Async cloud sync notice:', err);
  });
};

export const addTopPerfume = (
  newItem: Partial<Top11Item> & { name: string }
): Top11Item[] => {
  const current = getStoredTopPerfumes();
  const nextRank = current.length + 1;
  let cleanBadge = newItem.badge ? newItem.badge.replace(/^#\s*/, '') : `TOP ${nextRank}`;

  const newEntry: Top11Item = {
    id: `top-${Date.now()}`,
    name: newItem.name.trim(),
    type: newItem.type || 'Extrait De Parfum',
    subtitle: newItem.subtitle || 'Koleksi Bestseller SINKI',
    description: newItem.description || 'Varian aroma eksklusif pilihan kurasi SINKI Parfums.',
    topNotes: newItem.topNotes || 'Bergamot, Fresh Citrus',
    middleNotes: newItem.middleNotes || 'Floral Bloom, Warm Spices',
    baseNotes: newItem.baseNotes || 'Amber, Cedarwood, Musk',
    longevity: newItem.longevity || '10 - 14 Jam',
    sillage: newItem.sillage || 'Kuat & Semerbak',
    rank: nextRank,
    badge: cleanBadge,
    colorGradient: newItem.colorGradient || 'from-amber-500 via-amber-600 to-yellow-700',
    bottleThemeColor: newItem.bottleThemeColor || '#DFB76C',
    accentBadge: newItem.accentBadge || 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    accentBorder: newItem.accentBorder || 'border-amber-500/40',
    ...(newItem.photo ? { photo: newItem.photo } : {}),
  };

  const updated = [...current, newEntry];
  saveTopPerfumesToStorage(updated);
  return updated;
};

export const updateTopPerfume = (
  id: string,
  updates: Partial<Top11Item>
): Top11Item[] => {
  const current = getStoredTopPerfumes();
  const updated = current.map((item) => {
    if (item.id === id) {
      let badge = updates.badge !== undefined ? updates.badge : item.badge;
      if (badge) badge = badge.replace(/^#\s*/, '');
      return {
        ...item,
        ...updates,
        badge,
      };
    }
    return item;
  });
  saveTopPerfumesToStorage(updated);
  return updated;
};

export const deleteTopPerfume = (id: string): Top11Item[] => {
  const current = getStoredTopPerfumes();
  const filtered = current.filter((item) => item.id !== id);
  // Re-index ranks murni 1, 2, 3 ...
  const reIndexed = filtered.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    badge: item.badge ? item.badge.replace(/^#\s*/, '') : `TOP ${idx + 1}`,
  }));
  saveTopPerfumesToStorage(reIndexed);
  return reIndexed;
};

export const resetTopPerfumesToDefault = (): Top11Item[] => {
  saveTopPerfumesToStorage(INITIAL_TOP_PERFUMES);
  return INITIAL_TOP_PERFUMES;
};

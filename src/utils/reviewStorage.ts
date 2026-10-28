import { SUPABASE_STORAGE_BASE, getOwnerToken } from './assetStorage';

export interface ReviewItem {
  id: string;
  name: string;
  emoji: string;
  emojiLabel: string;
  variant: string;
  comment: string;
  date: string;
  likes: number;
}

export const INITIAL_4_REVIEWS: ReviewItem[] = [];

const LOCAL_STORAGE_KEY = 'sinki_reviews_v5';
const RECENT_SUBMISSIONS_KEY = 'sinki_recent_reviews_cache_v5';
const REVIEWS_FILE_NAME = 'reviews.json';
const REVIEWS_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${REVIEWS_FILE_NAME}`;

export const MAX_REVIEWS_LIMIT = 10;

/**
 * Menghitung jumlah ulasan riil untuk suatu varian parfum (+ base count wajar yang bertambah real-time saat diulas)
 */
export const getVariantReviewCount = (variantName: string, reviewsList?: ReviewItem[]): number => {
  if (!variantName) return 15;
  const list = reviewsList || getCachedReviews();
  const vLower = variantName.toLowerCase();
  const realCount = list.filter((r) => r.variant && (r.variant.toLowerCase().includes(vLower) || vLower.includes(r.variant.toLowerCase()))).length;
  let hash = 0;
  for (let i = 0; i < variantName.length; i++) {
    hash = (hash * 31 + variantName.charCodeAt(i)) % 18;
  }
  const baseCount = 12 + Math.abs(hash);
  return baseCount + realCount;
};

// Helper: ambil ulasan yang baru disubmit di perangkat ini (agar tidak ditimpa oleh delay CDN)
const getRecentLocalSubmissions = (): ReviewItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_SUBMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const now = Date.now();
        // Simpan hanya ulasan dari 10 menit terakhir
        return parsed.filter((item: any) => item && item.id && (!item._savedAt || now - item._savedAt < 10 * 60 * 1000));
      }
    }
  } catch {}
  return [];
};

const recordLocalSubmission = (review: ReviewItem) => {
  try {
    const current = getRecentLocalSubmissions();
    const updated = [{ ...review, _savedAt: Date.now() }, ...current.filter((r) => r.id !== review.id)].slice(0, 5);
    localStorage.setItem(RECENT_SUBMISSIONS_KEY, JSON.stringify(updated));
  } catch {}
};



/**
 * Mengambil ulasan dari penyimpanan lokal (instant cache)
 */
export const getCachedReviews = (): ReviewItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_REVIEWS_LIMIT);
      }
    }
  } catch (err) {
    console.error('Failed reading reviews cache:', err);
  }
  return [];
};

/**
 * Menyimpan ulasan ke cache lokal browser
 */
export const setCachedReviews = (reviews: ReviewItem[]) => {
  try {
    const trimmed = reviews.slice(0, MAX_REVIEWS_LIMIT);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed setting reviews cache:', err);
  }
};

/**
 * Helper: Hapus ulasan duplikat berdasarkan ID maupun kombinasi nama + isi komentar
 */
export const deduplicateReviews = (list: ReviewItem[]): ReviewItem[] => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: ReviewItem[] = [];

  for (const item of list) {
    if (!item) continue;
    const trimmedName = (item.name || '').trim().toLowerCase();
    const trimmedComment = (item.comment || '').trim().toLowerCase();
    const contentKey = `${trimmedName}:::${trimmedComment}`;

    if (item.id && seenIds.has(item.id)) continue;
    if (trimmedName && trimmedComment && seenContent.has(contentKey)) continue;

    if (item.id) seenIds.add(item.id);
    if (trimmedName && trimmedComment) seenContent.add(contentKey);
    result.push(item);
  }
  return result;
};

/**
 * Menggabungkan ulasan cloud dengan ulasan lokal terkini (Smart Merge tanpa duplikasi)
 */
const smartMergeReviews = (cloudReviews: ReviewItem[]): ReviewItem[] => {
  if (!Array.isArray(cloudReviews)) cloudReviews = [];
  const localRecents = getRecentLocalSubmissions();
  if (localRecents.length === 0) {
    return deduplicateReviews(cloudReviews).slice(0, MAX_REVIEWS_LIMIT);
  }

  // Cek apakah submission lokal sudah ada di cloud (berdasarkan ID atau Nama+Ulasan)
  const isAlreadyInCloud = (localItem: ReviewItem) => {
    const locName = (localItem.name || '').trim().toLowerCase();
    const locComment = (localItem.comment || '').trim().toLowerCase();
    return cloudReviews.some(
      (c) =>
        (c.id && localItem.id && c.id === localItem.id) ||
        (locName &&
          locComment &&
          (c.name || '').trim().toLowerCase() === locName &&
          (c.comment || '').trim().toLowerCase() === locComment)
    );
  };

  const missingLocals = localRecents.filter((r) => !isAlreadyInCloud(r));
  const merged = deduplicateReviews([...missingLocals, ...cloudReviews]).slice(0, MAX_REVIEWS_LIMIT);
  return merged;
};

/**
 * Mengambil ulasan publik dari server atau CDN publik secara real-time
 */
export const fetchReviewsFromSupabase = async (): Promise<ReviewItem[]> => {
  // 1. Coba ambil dari endpoint backend resmi jika aktif
  try {
    const res = await fetch('/api/reviews', { cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const merged = smartMergeReviews(data);
        setCachedReviews(merged);
        return merged;
      }
    }
  } catch {}

  // 2. Fetch langsung dari CDN publik Supabase Storage
  try {
    const res = await fetch(`${REVIEWS_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && (contentType.includes('application/json') || contentType.includes('text/plain'))) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const merged = smartMergeReviews(data);
        setCachedReviews(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('CDN reviews fallback notice:', err);
  }

  return getCachedReviews();
};

/**
 * Menyimpan ulasan baru (Otomatis rotasi 10 slot ulasan)
 */
export const saveReviewToSupabase = async (
  newReview: ReviewItem
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  // Hitung state terbaru secara instan (Rolling 10 Slots: ulasan baru paling atas, maks 10)
  const cached = getCachedReviews();
  const trimmedName = (newReview.name || '').trim().toLowerCase();
  const trimmedComment = (newReview.comment || '').trim().toLowerCase();

  const filtered = cached.filter(
    (r) =>
      r.id !== newReview.id &&
      !(
        trimmedName &&
        trimmedComment &&
        (r.name || '').trim().toLowerCase() === trimmedName &&
        (r.comment || '').trim().toLowerCase() === trimmedComment
      )
  );
  const updated = deduplicateReviews([newReview, ...filtered]).slice(0, MAX_REVIEWS_LIMIT);
  setCachedReviews(updated);
  recordLocalSubmission(newReview);

  // Kirim via API backend resmi (Node / Cloudflare Worker)
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        const trimmed = deduplicateReviews(data.reviews).slice(0, MAX_REVIEWS_LIMIT);
        setCachedReviews(trimmed);
        return { success: true, reviews: trimmed };
      }
    }
  } catch (err) {
    console.warn('Server review submission notice:', err);
  }

  return { success: true, reviews: updated };
};

/**
 * Menghapus ulasan secara aman (Khusus Pemilik)
 */
export const deleteReviewFromSupabase = async (
  reviewId: string
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  const token = getOwnerToken();
  const currentList = getCachedReviews();
  const updated = currentList.filter((r) => r.id !== reviewId);
  setCachedReviews(updated);

  try {
    const res = await fetch('/api/owner/delete-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: reviewId, token }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        const trimmed = data.reviews.slice(0, MAX_REVIEWS_LIMIT);
        setCachedReviews(trimmed);
        return { success: true, reviews: trimmed };
      }
    }
  } catch (err) {
    console.error('Exception deleting review via backend:', err);
  }

  return { success: true, reviews: updated };
};

/**
 * Menyukai ulasan (Like) dan menyinkronkannya
 */
export const likeReviewInSupabase = async (
  reviewId: string
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  const currentList = getCachedReviews();
  const updated = currentList.map((r) =>
    r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
  );
  setCachedReviews(updated);

  try {
    const res = await fetch('/api/reviews/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reviewId }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        const trimmed = data.reviews.slice(0, MAX_REVIEWS_LIMIT);
        setCachedReviews(trimmed);
        return { success: true, reviews: trimmed };
      }
    }
  } catch (err) {
    console.warn('Server like notice:', err);
  }

  return { success: true, reviews: updated };
};

/**
 * Reset ulasan ke kosong (Khusus Pemilik)
 */
export const resetReviewsToDefaultInSupabase = async (): Promise<ReviewItem[]> => {
  const token = getOwnerToken();
  setCachedReviews([]);

  try {
    const res = await fetch('/api/owner/reset-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ token }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        const trimmed = data.reviews.slice(0, MAX_REVIEWS_LIMIT);
        setCachedReviews(trimmed);
        return trimmed;
      }
    }
  } catch (e) {
    console.error('Error resetting reviews:', e);
  }

  return [];
};

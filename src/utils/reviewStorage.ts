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

export const INITIAL_4_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Rian Ardiansyah',
    emoji: '😍',
    emojiLabel: 'Sangat Puas & Mewah',
    variant: 'Mykonos Monaco Royale',
    comment:
      'Gila sih wanginya beneran mewah banget! Semprot pagi sebelum ngantor, malem pas pulang masih nempel kuat di kemeja. Rekan kerja cowo & cewe pada nanya pake parfum apa. Auto langganan terus di SINKI!',
    date: 'Hari ini',
    likes: 42,
  },
  {
    id: 'rev-2',
    name: 'Clarissa Putri',
    emoji: '🥰',
    emojiLabel: 'Suka Parah',
    variant: 'Mykonos Isfahan',
    comment:
      'Rose oud-nya berkelas parah, nggak bikin pusing sama sekali. Wanginya kalem tapi ninggalin jejak harum pas lewat. Semprotan botolnya juga halus banget kayak parfum jutaan. Puas pol!',
    date: 'Kemarin',
    likes: 38,
  },
  {
    id: 'rev-3',
    name: 'Bagus Wicaksono',
    emoji: '🔥',
    emojiLabel: 'Tahan Seharian',
    variant: 'Mykonos French Cognac',
    comment:
      'Packingnya tebel banget bubble wrap berlapis jadi botol kaca aman 100%. Aroma cognac dan kayu manisnya hangat maskulin elegan, cocok banget buat date night atau acara formal.',
    date: '2 hari lalu',
    likes: 29,
  },
  {
    id: 'rev-4',
    name: 'Nadia Safitri',
    emoji: '💎',
    emojiLabel: 'Wangi Mewah',
    variant: 'Mykonos Blanche De Sinki',
    comment:
      'Buat yang suka wangi clean, fresh, aroma baju bersih mewah ala hotel mewah kelas dunia wajib coba varian ini. Lembut banget ga nusuk hidung. Pasangan suka banget nyiumin terus.',
    date: '3 hari lalu',
    likes: 25,
  },
];

const LOCAL_STORAGE_KEY = 'sinki_reviews_v4';
const REVIEWS_FILE_NAME = 'reviews.json';
const REVIEWS_PUBLIC_URL = `${SUPABASE_STORAGE_BASE}${REVIEWS_FILE_NAME}`;
export const MAX_REVIEWS_LIMIT = 6;

/**
 * Mengambil ulasan dari penyimpanan lokal (instant cache agar tampilan langsung muncul tanpa loading lama)
 */
export const getCachedReviews = (): ReviewItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading reviews cache:', err);
  }
  return INITIAL_4_REVIEWS;
};

/**
 * Menyimpan ulasan ke cache lokal browser
 */
export const setCachedReviews = (reviews: ReviewItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error('Failed setting reviews cache:', err);
  }
};

/**
 * Mengambil ulasan publik dari server atau CDN publik secara real-time
 */
export const fetchReviewsFromSupabase = async (): Promise<ReviewItem[]> => {
  // 1. Coba ambil dari endpoint backend resmi
  try {
    const res = await fetch('/api/reviews', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCachedReviews(data);
        return data;
      }
    }
  } catch {
    // Backend offline / static preview mode
  }

  // 2. Fallback fetch publik CDN jika backend offline
  try {
    const res = await fetch(`${REVIEWS_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCachedReviews(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('CDN reviews fallback notice:', err);
  }

  return getCachedReviews();
};

/**
 * Menyimpan ulasan baru melalui server endpoint yang terproteksi rate-limiting & sensor
 */
export const saveReviewToSupabase = async (
  newReview: ReviewItem
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setCachedReviews(data.reviews);
        return { success: true, reviews: data.reviews };
      }
    }
  } catch (err) {
    console.warn('Server review submission notice:', err);
  }

  // Offline fallback
  const cached = getCachedReviews();
  const updated = [newReview, ...cached.filter((r) => r.id !== newReview.id)].slice(0, MAX_REVIEWS_LIMIT);
  setCachedReviews(updated);
  return { success: true, reviews: updated };
};

/**
 * Menghapus ulasan secara aman melalui backend
 */
export const deleteReviewFromSupabase = async (
  reviewId: string
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  const token = getOwnerToken();
  try {
    const res = await fetch('/api/owner/delete-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: reviewId, token, pin: '1995' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setCachedReviews(data.reviews);
        return { success: true, reviews: data.reviews };
      }
    }
  } catch (err) {
    console.error('Exception deleting review:', err);
  }

  const currentList = getCachedReviews();
  let updated = currentList.filter((r) => r.id !== reviewId);
  if (updated.length === 0) updated = [...INITIAL_4_REVIEWS];
  setCachedReviews(updated);
  return { success: true, reviews: updated };
};

/**
 * Menyukai ulasan (Like) dan menyinkronkannya ke server
 */
export const likeReviewInSupabase = async (
  reviewId: string
): Promise<{ success: boolean; reviews: ReviewItem[] }> => {
  try {
    const res = await fetch('/api/reviews/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reviewId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setCachedReviews(data.reviews);
        return { success: true, reviews: data.reviews };
      }
    }
  } catch (err) {
    console.warn('Server like notice:', err);
  }

  const currentList = getCachedReviews();
  const updated = currentList.map((r) =>
    r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
  );
  setCachedReviews(updated);
  return { success: true, reviews: updated };
};

/**
 * Reset ulasan ke 4 ulasan standar SINKI di server (Khusus Pemilik)
 */
export const resetReviewsToDefaultInSupabase = async (): Promise<ReviewItem[]> => {
  const token = getOwnerToken();
  try {
    const res = await fetch('/api/owner/reset-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ token, pin: '1995' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setCachedReviews(data.reviews);
        return data.reviews;
      }
    }
  } catch (e) {
    console.error('Error resetting reviews:', e);
  }

  setCachedReviews(INITIAL_4_REVIEWS);
  return INITIAL_4_REVIEWS;
};

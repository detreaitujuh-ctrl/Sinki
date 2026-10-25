export interface SocialLinks {
  tiktok: string;
  instagram: string;
  shopee: string;
  tokopedia: string;
  whatsapp: string;
  updatedAt?: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  tiktok: 'https://www.tiktok.com/@sinki_official',
  instagram: 'https://www.instagram.com/sinki_official',
  shopee: 'https://shopee.co.id',
  tokopedia: 'https://tokopedia.com',
  whatsapp: 'https://wa.me/6281398677610',
};

const SOCIAL_STORAGE_KEY = 'sinki_social_links_v1';
const SUPABASE_STORAGE_UPLOAD_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/social_links.json';
const SUPABASE_PUBLIC_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/social_links.json';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

/**
 * Format input TikTok: jika user hanya memasukkan username atau @handle,
 * otomatis diubah menjadi tautan URL lengkap https://www.tiktok.com/@username
 */
export const formatTikTokUrl = (input: string): string => {
  let val = (input || '').trim();
  if (!val) return DEFAULT_SOCIAL_LINKS.tiktok;
  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    if (val.startsWith('@')) {
      val = `https://www.tiktok.com/${val}`;
    } else {
      val = `https://www.tiktok.com/@${val}`;
    }
  }
  return val;
};

/**
 * Ambil display handle TikTok: contoh "https://www.tiktok.com/@sinki_official" -> "@sinki_official"
 */
export const extractTikTokHandle = (url: string): string => {
  if (!url) return '@sinki_official';
  const match = url.match(/@([a-zA-Z0-9_.-]+)/);
  if (match) return `@${match[1]}`;
  const clean = url
    .replace('https://www.tiktok.com/', '')
    .replace('http://www.tiktok.com/', '')
    .replace('https://tiktok.com/', '')
    .replace('http://tiktok.com/', '')
    .replace('/', '');
  return clean ? (clean.startsWith('@') ? clean : `@${clean}`) : '@sinki_official';
};

/**
 * Format input Instagram ke URL resmi https://www.instagram.com/username
 */
export const formatInstagramUrl = (input: string): string => {
  let val = (input || '').trim();
  if (!val) return DEFAULT_SOCIAL_LINKS.instagram;
  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    const clean = val.replace(/^@+/, '');
    val = `https://www.instagram.com/${clean}`;
  }
  return val;
};

export const extractInstagramHandle = (url: string): string => {
  if (!url) return '@sinki_official';
  const match = url.match(/instagram\.com\/([a-zA-Z0-9_.-]+)/);
  if (match) return `@${match[1]}`;
  return '@sinki_official';
};

/**
 * Format nomor WhatsApp ke URL link wa.me
 */
export const formatWhatsAppUrl = (input: string): string => {
  let val = (input || '').trim();
  if (!val) return DEFAULT_SOCIAL_LINKS.whatsapp;
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val;
  }
  // Ambil hanya digit
  let digits = val.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  }
  return digits ? `https://wa.me/${digits}` : DEFAULT_SOCIAL_LINKS.whatsapp;
};

export const getStoredSocialLinks = (): SocialLinks => {
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SOCIAL_LINKS, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_SOCIAL_LINKS;
};

export const setStoredSocialLinks = (links: SocialLinks): void => {
  try {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(links));
  } catch {}
};

/**
 * Mengambil tautan sosial dari backend server atau Supabase Storage Cloud
 */
export const fetchSocialLinksFromServer = async (): Promise<SocialLinks> => {
  // 1. Coba dari server Express
  try {
    const res = await fetch('/api/social-links', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const merged: SocialLinks = { ...DEFAULT_SOCIAL_LINKS, ...data };
        setStoredSocialLinks(merged);
        return merged;
      }
    }
  } catch {}

  // 2. Fallback ambil dari Supabase CDN
  try {
    const res = await fetch(`${SUPABASE_PUBLIC_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const merged: SocialLinks = { ...DEFAULT_SOCIAL_LINKS, ...data };
        setStoredSocialLinks(merged);
        return merged;
      }
    }
  } catch {}

  return getStoredSocialLinks();
};

/**
 * Menyimpan tautan sosial ke server & Supabase Storage (Khusus Pemilik)
 */
export const saveSocialLinksToServer = async (
  newLinks: Partial<SocialLinks>,
  pin = '1995'
): Promise<SocialLinks> => {
  const current = getStoredSocialLinks();
  const updated: SocialLinks = {
    tiktok: newLinks.tiktok !== undefined ? formatTikTokUrl(newLinks.tiktok) : current.tiktok,
    instagram: newLinks.instagram !== undefined ? formatInstagramUrl(newLinks.instagram) : current.instagram,
    shopee: newLinks.shopee !== undefined ? (newLinks.shopee.trim() || DEFAULT_SOCIAL_LINKS.shopee) : current.shopee,
    tokopedia: newLinks.tokopedia !== undefined ? (newLinks.tokopedia.trim() || DEFAULT_SOCIAL_LINKS.tokopedia) : current.tokopedia,
    whatsapp: newLinks.whatsapp !== undefined ? formatWhatsAppUrl(newLinks.whatsapp) : current.whatsapp,
    updatedAt: new Date().toISOString(),
  };

  setStoredSocialLinks(updated);

  // 1. Kirim ke Server Express
  try {
    const token =
      sessionStorage.getItem('sinki_owner_auth_token') ||
      localStorage.getItem('sinki_owner_auth_token');

    const res = await fetch('/api/owner/update-social-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin, socialLinks: updated }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.socialLinks) {
        setStoredSocialLinks(json.socialLinks);
        return json.socialLinks;
      }
    }
  } catch (err) {
    console.warn('Backend social link notice:', err);
  }

  // 2. Direct Sync ke Supabase Storage (Metode Permanen Cloudflare/SPA)
  try {
    await fetch(SUPABASE_STORAGE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: JSON.stringify(updated, null, 2),
    });
  } catch (err) {
    console.warn('Supabase direct social sync notice:', err);
  }

  return updated;
};

/**
 * Reset tautan sosial ke default
 */
export const resetSocialLinksToDefault = async (pin = '1995'): Promise<SocialLinks> => {
  return saveSocialLinksToServer(DEFAULT_SOCIAL_LINKS, pin);
};

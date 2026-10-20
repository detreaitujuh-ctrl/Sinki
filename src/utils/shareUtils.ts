/**
 * Mengambil URL publik yang ringkas dan aman untuk dibagikan ke siapapun.
 * - Menghilangkan parameter URL panjang (?query=..., hash, subpath) agar link rapi dan tidak kepanjangan.
 * - Mengonversi lingkungan internal AI Studio (ais-dev-...) ke URL publik (ais-pre-...).
 * - Menyediakan fitur URL pendek (Short URL) otomatis.
 */

let cachedShortUrl: string | null = null;

export const getPublicShareUrl = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const parsed = new URL(window.location.href);
    let base = parsed.origin;
    if (base.includes('ais-dev-')) {
      base = base.replace('ais-dev-', 'ais-pre-');
    }
    return base;
  } catch {
    const raw = window.location.href.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return raw.replace('ais-dev-', 'ais-pre-');
  }
};

export const getShortShareUrl = async (): Promise<string> => {
  if (cachedShortUrl) return cachedShortUrl;
  const fallbackUrl = getPublicShareUrl();

  try {
    const res = await fetch('/api/short-url');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.shortUrl === 'string' && data.shortUrl.startsWith('http')) {
        const urlStr: string = data.shortUrl;
        cachedShortUrl = urlStr;
        return urlStr;
      }
    }
  } catch {
    // Graceful fallback to clean public origin
  }

  return fallbackUrl;
};

// Prefetch URL pendek secara asinkron saat aplikasi dimuat agar instan saat tombol bagikan ditekan
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getShortShareUrl().catch(() => {});
  }, 1000);
}

/**
 * Mengambil URL publik yang aman untuk dibagikan ke siapapun.
 * Jika aplikasi sedang dibuka di lingkungan internal AI Studio (ais-dev-...),
 * otomatis dikonversi ke URL publik resmi (ais-pre-...) agar orang lain yang membuka
 * tautan tidak terkena Error 403 Forbidden dari Google Cloud Run.
 */
export const getPublicShareUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const currentUrl = window.location.href;

  if (currentUrl.includes('ais-dev-')) {
    return currentUrl.replace('ais-dev-', 'ais-pre-');
  }

  return currentUrl;
};

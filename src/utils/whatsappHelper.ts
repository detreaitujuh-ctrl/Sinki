/**
 * Helper WhatsApp Instan & Berkecepatan Tinggi
 * Menghilangkan jeda/loading lama akibat redirect lambat wa.me
 */

export const SINKI_OFFICIAL_WA = '6289636824552';

export const getWhatsAppNativeUrl = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
};

export const getWhatsAppWebFallbackUrl = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
};

/**
 * Membuka WhatsApp secara instan tanpa jeda redirect wa.me
 * Di HP: langsung membuka aplikasi WhatsApp native (0.2 detik)
 * Di Desktop: membuka api.whatsapp.com secara cepat
 */
export const openWhatsAppDirect = (phone: string = SINKI_OFFICIAL_WA, text: string = '') => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // 1. Prioritas Utama di HP: Native App Protocol (Langsung loncat ke aplikasi WA tanpa loading web)
    const nativeAppUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    const fallbackWebUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    // Jalankan native intent seketika
    window.location.href = nativeAppUrl;

    // Cadangan jika aplikasi belum terpasang di HP (fallback ke web dalam 1.2 detik)
    setTimeout(() => {
      if (typeof document !== 'undefined' && document.hasFocus()) {
        window.location.href = fallbackWebUrl;
      }
    }, 1200);
  } else {
    // 2. Di Desktop/Laptop: Buka api.whatsapp.com (jauh lebih cepat dari wa.me karena tanpa perantara)
    const desktopUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(desktopUrl, '_blank', 'noopener,noreferrer');
  }
};

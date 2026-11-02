import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  X,
  Upload,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { getStoredQris, saveQrisToServer, verifyOwnerPinOnServer } from '../utils/assetStorage';
import { ImageAdjusterModal } from './ImageAdjusterModal';
import { openWhatsAppDirect } from '../utils/whatsappHelper';

interface QrisPaymentCardProps {
  amount?: number;
  onShowToast?: (msg: string) => void;
  customQrisProp?: string | null;
}

export const QrisPaymentCard: React.FC<QrisPaymentCardProps> = ({
  amount,
  onShowToast,
  customQrisProp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customQris, setCustomQris] = useState<string | null>(() => customQrisProp || getStoredQris());

  useEffect(() => {
    if (customQrisProp) {
      setCustomQris(customQrisProp);
    }
  }, [customQrisProp]);

  // Fitur Rahasia: Ketuk Kotak QRIS 5x untuk Membuka Modal Unggah Foto Asli
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Modal Upload QRIS Khusus Pemilik Toko
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ownerPin, setOwnerPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // States untuk Fitur Zoom & Geser Foto QRIS
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [adjusterImageSrc, setAdjusterImageSrc] = useState<string | null>(null);

  // Payload Standar Nasional EMVCo jika belum ada foto yang diunggah
  const fallbackPayload =
    '00020101021126580016ID.CO.QRIS.WWW01189360091510266021839680215ID10266021839680303A0151440014ID.LINKAJA.WWW01189360091510266021839680215ID10266021839680303A015204599953033605802ID5905SINKI6007JAKARTA61051011062070703A0163043816';

  useEffect(() => {
    if (!customQris && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, fallbackPayload, {
        width: 270,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((err) => {
        console.error('Error rendering QR canvas:', err);
      });
    }
  }, [customQris, fallbackPayload]);

  // Handler Tombol Rahasia: Ketuk 5x pada Kotak QRIS
  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 3000) {
      setTapCount(1);
    } else {
      const nextCount = tapCount + 1;
      setTapCount(nextCount);
      if (nextCount >= 5) {
        setTapCount(0);
        setIsUploadModalOpen(true);
        setIsPinVerified(false);
        setOwnerPin('');
        setPinError('');
      }
    }
    setLastTapTime(now);
  };

  // Verifikasi PIN Pemilik Toko via Server
  const handleVerifyOwnerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyOwnerPinOnServer(ownerPin.trim());
      if (res.success) {
        setIsPinVerified(true);
        setPinError('');
      } else {
        setPinError(res.error || 'PIN salah! Silakan coba lagi.');
      }
    } catch {
      setPinError('Gagal terhubung ke server verifikasi PIN.');
    }
  };

  // Upload Foto QRIS Asli: Buka Zoom & Geser Terlebih Dahulu
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      setAdjusterImageSrc(rawDataUrl);
      setIsAdjusterOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAdjusterConfirm = async (croppedBase64: string) => {
    setIsAdjusterOpen(false);
    try {
      setIsUploading(true);
      await saveQrisToServer(croppedBase64);
      setCustomQris(croppedBase64);
      setIsUploadModalOpen(false);
      setIsPinVerified(false);
      setOwnerPin('');
      if (onShowToast) {
        onShowToast('Foto QRIS Asli SINKI berhasil disimpan permanen! ✅');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast('Gagal menyimpan foto QRIS.');
      }
    } finally {
      setIsUploading(false);
      setAdjusterImageSrc(null);
    }
  };

  // Reset QRIS
  const handleResetQris = async () => {
    try {
      await saveQrisToServer('');
      setCustomQris(null);
      setIsUploadModalOpen(false);
      setIsPinVerified(false);
      setOwnerPin('');
      if (onShowToast) {
        onShowToast('Foto QRIS dikembalikan ke setelan awal.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler WhatsApp Konfirmasi Pembayaran Cepat Tanpa Loading
  const confirmMessage = `Halo Admin SINKI, saya sudah melakukan pembayaran pesanan parfum${
    amount ? ` sebesar Rp ${amount.toLocaleString('id-ID')}` : ''
  }. Berikut saya lampirkan bukti transfernya. Mohon segera diproses dan dikirim ya, terima kasih!`;

  const handleSendProof = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onShowToast) {
      onShowToast('Menghubungkan langsung ke WhatsApp SINKI...');
    }
    openWhatsAppDirect('6289636824552', confirmMessage);
  };

  return (
    <div className="space-y-2.5">
      {/* 1. KOTAK KHUSUS FULL BUAT FOTO QRIS ASLI (TAMPIL UTUH & JERNIH) */}
      <div
        onClick={handleSecretTap}
        className="relative mx-auto w-full max-w-[310px] rounded-[10px] bg-white text-slate-900 shadow-2xl overflow-hidden border border-[#D4AF6A]/45 select-none cursor-pointer"
        title="Ketuk 5x untuk akses unggah pemilik"
      >
        {customQris ? (
          /* FOTO QRIS ASLI YANG DIUNGGAH PEMILIK (FULL MENYESUAIKAN KOTAK) */
          <div className="w-full bg-white flex flex-col items-center justify-center p-2.5">
            <img
              src={customQris}
              alt="QRIS Resmi SINKI"
              className="w-full h-auto max-h-[380px] object-contain rounded-[8px] block mx-auto shadow-sm"
            />
          </div>
        ) : (
          /* TAMPILAN BAWAAN JIKA BELUM ADA FOTO YANG DIUNGGAH */
          <div className="p-3 bg-white flex flex-col items-center justify-center text-center">
            <div className="pb-1 text-center">
              <span className="font-heading font-bold text-sm tracking-[0.04em] text-slate-900 block leading-tight">
                QRIS Resmi SINKI
              </span>
              <span className="font-body text-xs tabular-nums text-slate-500 font-normal block leading-snug">
                NMID: ID1026602183968 • A01
              </span>
            </div>

            <div className="p-2 bg-white rounded-[8px] border border-slate-100 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="block mx-auto rounded-[6px] max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <span className="font-body text-xs text-slate-500 font-normal mt-1 block leading-[1.4]">
              Scan dengan BCA, Mandiri, BRI, GoPay, OVO, Dana & ShopeePay
            </span>
          </div>
        )}

        {/* Footer Total Tagihan (Kecil & Rapi) */}
        {amount && amount > 0 && (
          <div className="bg-[#E51B24] text-white px-3.5 py-2 flex items-center justify-between font-body shadow-inner">
            <span className="text-xs font-medium leading-tight">
              Total Pembayaran:
            </span>
            <span className="font-body font-semibold text-sm tabular-nums bg-black/20 px-2.5 py-0.5 rounded-[5px] leading-tight">
              Rp {amount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>

      {/* 2. KETERANGAN & TOMBOL KIRIM BUKTI PEMBAYARAN LEWAT WHATSAPP (UKURAN LEBIH KECIL & RAPI) */}
      <div className="p-2.5 rounded-[8px] sinki-arch-card border max-w-[310px] mx-auto text-center space-y-2">
        <p className="font-body text-xs text-slate-300 font-normal leading-[1.45]">
          Setelah transfer, kirim bukti bayar lewat WhatsApp agar pesanan segera diproses.
        </p>

        <button
          type="button"
          onClick={handleSendProof}
          className="w-full py-2 px-3.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white font-body font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm cursor-pointer"
        >
          <MessageCircle size={14} className="shrink-0" />
          <span>Kirim Bukti Bayar via WhatsApp</span>
        </button>
      </div>

      {/* 3. MODAL RAHASIA: UNGGAH FOTO QRIS ASLI PEMILIK TOKO (DIBUKA DENGAN KETUK KOTAK 5X) */}
      {isUploadModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsUploadModalOpen(false)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xs rounded-[10px] sinki-arch-modal border p-5 space-y-4 text-center cursor-default"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D4AF6A]/25">
                <span className="font-heading font-semibold text-base text-white tracking-[-0.015em] leading-[1.25]">
                  Unggah Foto QRIS Asli SINKI
                </span>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="w-7 h-7 rounded-[6px] sinki-arch-subbox border hover:border-[#E8C782]/60 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {!isPinVerified ? (
                /* Form Verifikasi PIN Pemilik */
                <form onSubmit={handleVerifyOwnerPin} className="space-y-3">
                  <p className="font-body text-xs text-slate-300 font-normal leading-[1.45]">
                    Masukkan PIN Pemilik Toko untuk memasang foto barcode QRIS resmi toko Anda:
                  </p>
                  <input
                    type="password"
                    maxLength={12}
                    autoFocus
                    placeholder="Masukkan PIN Pemilik"
                    value={ownerPin}
                    onChange={(e) => {
                      setOwnerPin(e.target.value);
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 rounded-[8px] sinki-arch-input border text-center text-base sm:text-sm font-body font-medium tabular-nums tracking-[0.15em] text-white focus:outline-none"
                  />
                  {pinError && (
                    <p className="font-body text-xs text-red-400 font-medium">{pinError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-sm transition-all active:scale-95 shadow-md shadow-black/30"
                  >
                    Buka Akses Unggah
                  </button>
                </form>
              ) : (
                /* Form Pilih File Foto QRIS dari Galeri */
                <div className="space-y-3">
                  <p className="font-body text-xs text-slate-300 font-normal leading-[1.45]">
                    Pilih file foto atau tangkapan layar (screenshot) barcode QRIS resmi toko Anda dari galeri HP:
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-body font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Upload size={15} />
                    <span>{isUploading ? 'Menyimpan Foto...' : 'Pilih File Foto QRIS Asli'}</span>
                  </button>

                  {customQris && (
                    <button
                      type="button"
                      onClick={handleResetQris}
                      className="w-full py-2 rounded-[8px] sinki-arch-subbox hover:bg-red-500/20 border hover:border-red-500/40 text-slate-300 hover:text-red-300 font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={12} />
                      <span>Kembalikan ke Bawaan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Modal Zoom & Geser Barcode QRIS */}
      <ImageAdjusterModal
        isOpen={isAdjusterOpen}
        imageSrc={adjusterImageSrc}
        aspectRatio="square"
        title="Atur Posisi & Zoom Barcode QRIS"
        onClose={() => {
          setIsAdjusterOpen(false);
          setAdjusterImageSrc(null);
        }}
        onConfirm={handleAdjusterConfirm}
      />
    </div>
  );
};

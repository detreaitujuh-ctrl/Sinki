import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  X,
  Upload,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { getStoredQris, saveQrisToServer } from '../utils/assetStorage';
import { ImageAdjusterModal } from './ImageAdjusterModal';

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

  // Verifikasi PIN Pemilik Toko
  const handleVerifyOwnerPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPin === '1995') {
      setIsPinVerified(true);
      setPinError('');
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
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
      await saveQrisToServer(croppedBase64, '1995');
      setCustomQris(croppedBase64);
      setIsUploadModalOpen(false);
      setIsPinVerified(false);
      setOwnerPin('');
      if (onShowToast) {
        onShowToast('Foto QRIS Asli SINKI berhasil disimpan permanen! ✅');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan foto QRIS.');
    } finally {
      setIsUploading(false);
      setAdjusterImageSrc(null);
    }
  };

  // Reset QRIS
  const handleResetQris = async () => {
    try {
      await saveQrisToServer('', '1995');
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

  // URL WhatsApp Konfirmasi Pembayaran
  const waConfirmUrl = `https://wa.me/6289636824552?text=${encodeURIComponent(
    `Halo Admin SINKI, saya sudah melakukan pembayaran pesanan parfum${
      amount ? ` sebesar Rp ${amount.toLocaleString('id-ID')}` : ''
    }. Berikut saya lampirkan bukti transfernya. Mohon segera diproses dan dikirim ya, terima kasih!`
  )}`;

  return (
    <div className="space-y-2.5">
      {/* 1. KOTAK KHUSUS FULL BUAT FOTO QRIS ASLI (TAMPIL UTUH & JERNIH) */}
      <div
        onClick={handleSecretTap}
        className="relative mx-auto w-full max-w-[310px] rounded-3xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200 select-none cursor-pointer"
        title="Ketuk 5x untuk akses unggah pemilik"
      >
        {customQris ? (
          /* FOTO QRIS ASLI YANG DIUNGGAH PEMILIK (FULL MENYESUAIKAN KOTAK) */
          <div className="w-full bg-white flex flex-col items-center justify-center p-2.5">
            <img
              src={customQris}
              alt="QRIS Resmi SINKI"
              className="w-full h-auto max-h-[380px] object-contain rounded-2xl block mx-auto shadow-sm"
            />
          </div>
        ) : (
          /* TAMPILAN BAWAAN JIKA BELUM ADA FOTO YANG DIUNGGAH */
          <div className="p-3 bg-white flex flex-col items-center justify-center text-center">
            <div className="pb-1 text-center">
              <span className="font-display font-black text-sm tracking-widest text-slate-900 uppercase block">
                QRIS RESMI SINKI
              </span>
              <span className="text-[8.5px] text-slate-500 font-mono block">
                NMID: ID1026602183968 • A01
              </span>
            </div>

            <div className="p-2 bg-white rounded-2xl border border-slate-100 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="block mx-auto rounded-lg max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <span className="text-[9px] text-slate-400 font-medium mt-1 block">
              Scan dengan BCA, Mandiri, BRI, GoPay, OVO, Dana & ShopeePay
            </span>
          </div>
        )}

        {/* Footer Total Tagihan (Kecil & Rapi) */}
        {amount && amount > 0 && (
          <div className="bg-[#E51B24] text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold shadow-inner">
            <span className="text-[9px] uppercase tracking-wider font-semibold">
              Total Pembayaran:
            </span>
            <span className="font-display font-black text-xs bg-black/20 px-2 py-0.5 rounded-md">
              Rp {amount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>

      {/* 2. KETERANGAN & TOMBOL KIRIM BUKTI PEMBAYARAN LEWAT WHATSAPP (UKURAN LEBIH KECIL & RAPI) */}
      <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 max-w-[310px] mx-auto text-center space-y-1.5 shadow-md">
        <p className="text-[9.5px] text-slate-300 leading-snug">
          Setelah transfer, kirim bukti bayar lewat WhatsApp agar pesanan segera diproses.
        </p>

        <a
          href={waConfirmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm"
        >
          <MessageCircle size={13} />
          <span>Kirim Bukti Bayar via WhatsApp</span>
        </a>
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
              className="relative w-full max-w-xs rounded-3xl bg-[#12141e] border border-white/15 p-5 shadow-2xl space-y-4 text-center cursor-default"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-display font-extrabold text-xs text-white">
                  Unggah Foto QRIS Asli SINKI
                </span>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {!isPinVerified ? (
                /* Form Verifikasi PIN Pemilik */
                <form onSubmit={handleVerifyOwnerPin} className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Masukkan PIN Pemilik Toko untuk memasang foto barcode QRIS resmi toko Anda:
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="Masukkan PIN Pemilik"
                    value={ownerPin}
                    onChange={(e) => {
                      setOwnerPin(e.target.value);
                      setPinError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-[#DFB76C]"
                  />
                  {pinError && (
                    <p className="text-[10px] text-red-400 font-medium">{pinError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-black/30"
                  >
                    Buka Akses Unggah
                  </button>
                </form>
              ) : (
                /* Form Pilih File Foto QRIS dari Galeri */
                <div className="space-y-3">
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
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
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Upload size={15} />
                    <span>{isUploading ? 'Menyimpan Foto...' : 'Pilih File Foto QRIS Asli'}</span>
                  </button>

                  {customQris && (
                    <button
                      type="button"
                      onClick={handleResetQris}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
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

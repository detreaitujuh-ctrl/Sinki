import React, { useRef, useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, RotateCcw, Loader2 } from 'lucide-react';
import { Top11Item } from '../data/top11';
import { compressImage, saveTop11PhotoToServer } from '../utils/assetStorage';

interface Top11UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Top11Item | null;
  currentPhoto: string | null;
  onPhotoUpdated: (variantId: string, newPhoto: string | null) => void;
  onShowToast: (msg: string) => void;
}

export const Top11UploadModal: React.FC<Top11UploadModalProps> = ({
  isOpen,
  onClose,
  item,
  currentPhoto,
  onPhotoUpdated,
  onShowToast,
}) => {
  const [preview, setPreview] = useState<string | null>(currentPhoto);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !item) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      onShowToast(`Mengoptimalkan foto botol ${item.name}...`);

      const optimized = await compressImage(file, 900, 900, 0.88);
      const success = await saveTop11PhotoToServer(item.id, optimized, '1995');

      if (success) {
        setPreview(optimized);
        onPhotoUpdated(item.id, optimized);
        onShowToast(`Foto botol ${item.name} berhasil disimpan permanen!`);
      } else {
        onShowToast('Gagal menyimpan foto. Coba lagi.');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Terjadi kendala saat membaca file gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsProcessing(true);
      // Remove from server
      await saveTop11PhotoToServer(item.id, '', '1995');
      setPreview(null);
      onPhotoUpdated(item.id, null);
      onShowToast(`Foto botol ${item.name} dikembalikan ke botol bawaan.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#141620] border border-white/15 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-1.5 text-[#DFB76C]">
              <ImageIcon size={16} />
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Ganti Foto Botol #{item.rank}
              </h3>
            </div>
            <p className="text-[11px] text-white font-medium mt-0.5 truncate max-w-[220px]">
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Preview */}
        <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-white/10 flex flex-col items-center justify-center space-y-3">
          <div className="w-32 h-44 rounded-xl bg-black/50 border border-amber-500/30 flex items-center justify-center overflow-hidden p-2">
            {preview ? (
              <img
                src={preview}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-2 text-slate-500">
                <ImageIcon size={28} className="mx-auto text-amber-500/40 mb-1" />
                <span className="text-[9px] block">Menggunakan botol 3D resmi bawaan</span>
              </div>
            )}
          </div>

          {preview && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Check size={12} /> Foto botol kustom terpasang
            </span>
          )}
        </div>

        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>{preview ? 'Pilih Foto Botol Lain' : 'Unggah Foto Botol Asli'}</span>
        </button>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-1">
          {preview && (
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

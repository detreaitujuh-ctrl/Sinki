import React, { useState } from 'react';
import { X, Heart, Check, Plus, ShoppingBag } from 'lucide-react';
import { PerfumeItem } from '../data/perfumes';
import {
  COLLECTION_BOTTLE_SIZES,
  CollectionBottleSize,
  getPerfumeBottleUnitPrice,
  addToCart,
} from '../utils/cartStorage';

interface PerfumeDetailModalProps {
  perfume: PerfumeItem | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  onCartUpdated?: () => void;
  favorites?: string[];
  onToggleFavorite?: (id: string, name: string) => void;
}

export const PerfumeDetailModal: React.FC<PerfumeDetailModalProps> = ({
  perfume,
  onClose,
  onShowToast,
  onCartUpdated,
  favorites = [],
  onToggleFavorite,
}) => {
  const [selectedBottleSize, setSelectedBottleSize] = useState<CollectionBottleSize | null>(null);
  const [bottleQty, setBottleQty] = useState<number>(1);

  if (!perfume) return null;

  const isFav = favorites.includes(perfume.id);
  const perMlBadge = perfume.collectionCategories?.includes('new_trending')
    ? 'Rp4.000/ml'
    : perfume.collectionCategories?.includes('viral_hits')
    ? 'Rp3.000/ml'
    : null;
  const selectedUnitPrice = selectedBottleSize
    ? getPerfumeBottleUnitPrice(selectedBottleSize, perfume)
    : null;
  const selectedTotalPrice = selectedUnitPrice ? selectedUnitPrice * bottleQty : null;

  const handleAddToCart = () => {
    if (!selectedBottleSize) return;

    const unitPrice = getPerfumeBottleUnitPrice(selectedBottleSize, perfume);
    const totalPrice = unitPrice * bottleQty;

    addToCart({
      perfumeId: perfume.id,
      name: perfume.name,
      size: selectedBottleSize,
      quantity: bottleQty,
      unitPrice,
    });

    onCartUpdated?.();
    onShowToast?.(
      `Berhasil masuk keranjang: ${perfume.name} (${selectedBottleSize} ml × ${bottleQty} — Rp${totalPrice.toLocaleString('id-ID')})`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center px-0 sm:px-3 pt-3 pb-[calc(80px+env(safe-area-inset-bottom,0px))] sinki-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[calc(100dvh-96px)] md:max-h-[calc(92dvh-96px)] sinki-arch-modal border-t border-b sm:border rounded-t-[10px] sm:rounded-[10px] flex flex-col overflow-hidden sinki-sheet-elevation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ZONE 1: Fixed Top Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-4 pt-3 pb-2.5 border-b border-[#D4AF6A]/25 sinki-arch-header">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-body text-[11px] font-medium tracking-[0.03em] text-[#DFB76C] leading-tight">
                SINKI Signature Detail
              </span>
              {perMlBadge && (
                <span className="font-body text-[10.5px] font-semibold tabular-nums px-1.5 py-0.5 rounded-[5px] bg-[#C5A059]/15 border border-[#DFB76C]/35 text-[#F3E6C8] leading-none">
                  {perMlBadge}
                </span>
              )}
            </div>
            <h3 className="font-heading text-base sm:text-[17px] font-bold text-white tracking-[-0.015em] leading-[1.22] break-words">
              {perfume.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(perfume.id, perfume.name)}
                className="w-8 h-8 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors sinki-cushion-press-sm"
                title="Simpan ke favorit"
              >
                <Heart
                  size={15}
                  className={isFav ? 'fill-rose-500 text-rose-500' : ''}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border flex items-center justify-center text-slate-300 hover:text-white transition-colors sinki-cushion-press-sm"
              title="Tutup detail"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ZONE 2: Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-3.5 space-y-2">
          {/* Fragrance Profile */}
          <div className="space-y-2 font-body">
            <div className="p-2.5 rounded-[8px] sinki-arch-subbox border space-y-0.5">
              <span className="text-[11px] font-medium text-[#DFB76C] block leading-tight">
                Karakter Aroma
              </span>
              <p className="text-[13px] text-slate-100 font-normal leading-[1.48]">
                {perfume.tagline || '-'}
              </p>
            </div>

            {perfume.usageRecommendation && perfume.usageRecommendation.trim() !== '' && (
              <div className="p-2.5 rounded-[8px] sinki-arch-subbox border space-y-0.5">
                <span className="text-[11px] font-medium text-[#DFB76C] block leading-tight">
                  Rekomendasi Penggunaan
                </span>
                <p className="text-[13px] text-slate-200 font-normal leading-[1.48]">
                  {perfume.usageRecommendation}
                </p>
              </div>
            )}

            {perfume.accords && perfume.accords.length > 0 && (
              <div className="p-2.5 rounded-[8px] sinki-arch-subbox border space-y-1.5">
                <span className="text-[11px] font-medium text-[#DFB76C] block leading-tight">
                  Komposisi Notes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {perfume.accords.map((note, idx) => (
                    <span
                      key={`${note}-${idx}`}
                      className="font-body px-2 py-0.5 rounded-[5px] bg-[#14141a] border border-[#D4AF6A]/25 text-[11.5px] font-normal text-slate-200 leading-tight"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottle Size Selector (10 ml, 20 ml, 30 ml, 50 ml, 100 ml) */}
          <div className="pt-0.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-xs font-semibold text-[#DFB76C] leading-tight">
                Pilih Ukuran Botol
              </span>
              {selectedBottleSize ? (
                <span className="font-body text-[11px] font-medium tabular-nums text-[#F3E6C8] flex items-center gap-1 leading-tight">
                  <Check size={12} className="text-[#DFB76C]" /> {selectedBottleSize} ml dipilih
                </span>
              ) : (
                <span className="font-body text-[11px] text-slate-400 font-normal leading-tight">
                  Ketuk ukuran di bawah
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {COLLECTION_BOTTLE_SIZES.map((size) => {
                const isSelected = selectedBottleSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedBottleSize(size)}
                    className={`font-body py-2 px-1 rounded-[6px] border text-center tabular-nums whitespace-nowrap sinki-cushion-press-sm ${
                      isSelected
                        ? 'sinki-arch-card-selected text-white font-semibold'
                        : 'sinki-arch-subbox hover:border-[#E8C782]/55 text-slate-200 font-medium'
                    }`}
                  >
                    <span className="text-xs block leading-none font-medium">{size} ml</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ZONE 3: Sticky Bottom Action Bar */}
        <div className="shrink-0 bg-[#0b0b0f]/98 border-t border-[#D4AF6A]/25 px-4 pt-2.5 pb-3 shadow-[0_-10px_28px_rgba(0,0,0,0.75)] space-y-2">
          {selectedBottleSize && selectedUnitPrice && selectedTotalPrice ? (
            <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-[8px] sinki-arch-card border">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-body text-[11px] font-medium text-slate-300 tabular-nums leading-tight">
                  <span>Ukuran {selectedBottleSize} ml</span>
                  {bottleQty > 1 && (
                    <span className="text-slate-400 font-normal">
                      · Rp{selectedUnitPrice.toLocaleString('id-ID')}/btl
                    </span>
                  )}
                </div>
                <span className="font-body text-[17px] sm:text-lg font-bold tabular-nums text-[#F3E6C8] leading-tight block mt-0.5">
                  Rp{selectedTotalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2 sinki-arch-subbox px-2 py-1 rounded-[6px] border shrink-0">
                <button
                  type="button"
                  onClick={() => setBottleQty((prev) => Math.max(1, prev - 1))}
                  aria-label="Kurangi jumlah botol"
                  className="font-body w-6 h-6 rounded-[5px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
                >
                  -
                </button>
                <span className="font-body text-xs sm:text-[13px] font-semibold text-white min-w-5 text-center tabular-nums">
                  {bottleQty}
                </span>
                <button
                  type="button"
                  onClick={() => setBottleQty((prev) => prev + 1)}
                  aria-label="Tambah jumlah botol"
                  className="font-body w-6 h-6 rounded-[5px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1 px-3 rounded-[8px] sinki-arch-subbox border text-center">
              <span className="font-body text-[11.5px] text-slate-300 font-normal">
                Pilih salah satu ukuran botol di atas untuk melihat harga
              </span>
            </div>
          )}

          {/* Big CTA Button */}
          <button
            type="button"
            disabled={!selectedBottleSize}
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-4 rounded-[8px] font-body font-semibold text-[13px] flex items-center justify-center gap-2 transition-all shadow-md sinki-cushion-press ${
              selectedBottleSize
                ? 'bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 active:scale-[0.98] text-slate-950 shadow-black/40 cursor-pointer'
                : 'bg-white/[0.06] text-slate-500 border border-[#D4AF6A]/15 cursor-not-allowed'
            }`}
          >
            {selectedBottleSize ? (
              <>
                <ShoppingBag size={15} className="shrink-0 text-slate-950" />
                <span>Masukkan ke Tas Belanja</span>
              </>
            ) : (
              <span>Pilih Ukuran Botol Terlebih Dahulu</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  QrCode,
  Clock,
  Trash2,
  Plus,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Top11Item } from '../data/top11';
import { QrisPaymentCard } from './QrisPaymentCard';
import { PerfumeDetailModal } from './PerfumeDetailModal';
import { PerfumeItem, CollectionCategoryKey } from '../data/perfumes';
import { getStoredPerfumes, fetchPerfumesFromServer } from '../utils/perfumeStorage';
import {
  PricingConfig,
  getStoredPricing,
} from '../utils/pricingStorage';
import { openWhatsAppDirect } from '../utils/whatsappHelper';
import { playInteractionSound } from '../utils/soundEngine';
import {
  CartItem,
  getStoredCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartSubtotal,
  getCartTotalCount,
  addToCart,
  getPerfumeBottleUnitPrice,
} from '../utils/cartStorage';

interface OrderScreenProps {
  onBackToHome: () => void;
  onNavigateToCollection?: () => void;
  onNavigateToCategory?: (category: CollectionCategoryKey | 'overview') => void;
  onShowToast: (msg: string) => void;
  pricing?: PricingConfig;
  customQris?: string | null;
  topPerfumes?: Top11Item[];
  cartItems?: CartItem[];
  selectedPerfumeFromCollection?: { name: string; category?: string; pricePerMl?: number } | null;
  onClearSelectedPerfume?: () => void;
}

export const BOTTLE_SIZES = [10, 15, 20, 30, 50, 100] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

const OFFICIAL_WHATSAPP_RAW = '6289636824552';

export const OrderScreen: React.FC<OrderScreenProps> = ({
  onBackToHome,
  onNavigateToCollection,
  onNavigateToCategory,
  onShowToast,
  pricing,
  customQris,
  cartItems: cartItemsProp,
  selectedPerfumeFromCollection,
  onClearSelectedPerfume,
}) => {
  // Persistent Shopping Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    cartItemsProp ? cartItemsProp : getStoredCart()
  );
  const [confirmClearCart, setConfirmClearCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'qris'>('whatsapp');
  const [isGuideExpandedInCart, setIsGuideExpandedInCart] = useState(false);
  const [selectedPerfumeForDetail, setSelectedPerfumeForDetail] = useState<PerfumeItem | null>(null);
  const [catalogPerfumes, setCatalogPerfumes] = useState<PerfumeItem[]>(() => getStoredPerfumes());

  useEffect(() => {
    fetchPerfumesFromServer().then((list) => {
      if (list && Array.isArray(list) && list.length > 0) {
        setCatalogPerfumes(list);
      }
    });
  }, []);

  useEffect(() => {
    if (cartItemsProp) {
      setCartItems(cartItemsProp);
    }
  }, [cartItemsProp]);

  useEffect(() => {
    const syncCart = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCartItems(e.detail);
      } else {
        setCartItems(getStoredCart());
      }
    };
    window.addEventListener('sinki_cart_updated', syncCart);
    return () => window.removeEventListener('sinki_cart_updated', syncCart);
  }, []);

  // When a perfume is selected from Aroma Match or external action, seamlessly add it to cart
  useEffect(() => {
    if (selectedPerfumeFromCollection?.name) {
      const perfName = selectedPerfumeFromCollection.name;
      const current = getStoredCart();
      const alreadyInCart = current.some(
        (c) => c.name.toLowerCase() === perfName.toLowerCase()
      );
      if (!alreadyInCart) {
        const matchedPerfume = catalogPerfumes.find(
          (p) => p.name.toLowerCase() === perfName.toLowerCase()
        );
        const unitPrice = getPerfumeBottleUnitPrice(30, matchedPerfume || null);
        const updated = addToCart({
          perfumeId: matchedPerfume?.id || perfName.toLowerCase().replace(/\s+/g, '-'),
          name: perfName,
          size: 30,
          quantity: 1,
          unitPrice,
        });
        setCartItems(updated);
        onShowToast(`"${perfName} (30 ml)" ditambahkan ke tas belanja`);
      }
      onClearSelectedPerfume?.();
    }
  }, [selectedPerfumeFromCollection, catalogPerfumes]);

  // Pricing configuration
  const activePricing = pricing || getStoredPricing();
  const minFreeShipping = activePricing.minFreeShipping || 150000;
  const regulerMinPrice = activePricing.nonPremium?.[10] || 17000;
  const viralRatePerMl = activePricing.mykonosRatePerMl || 3000;
  const trendingRatePerMl = activePricing.premiumRatePerMl || 4000;

  const hasCartItems = cartItems.length > 0;
  const cartTotalBottles = getCartTotalCount(cartItems);
  const cartSubtotal = getCartSubtotal(cartItems);
  const isFreeShipping = cartSubtotal >= minFreeShipping;
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / minFreeShipping) * 100));
  const amountToFreeShipping = Math.max(0, minFreeShipping - cartSubtotal);

  const handleShortcutCategory = (target: CollectionCategoryKey | 'overview') => {
    if (onNavigateToCategory) {
      onNavigateToCategory(target);
    } else if (onNavigateToCollection) {
      onNavigateToCollection();
    }
  };

  const renderQualityGuideRows = () => (
    <div className="divide-y divide-[#D4AF6A]/20 font-body text-xs">
      {/* 1. 4 Kategori Utama */}
      <button
        type="button"
        onClick={() => handleShortcutCategory('overview')}
        className="w-full py-2.5 first:pt-1 last:pb-0.5 text-left flex items-center justify-between gap-2.5 group hover:bg-white/[0.02] transition-colors rounded-[6px] px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DFB76C]"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <span className="font-heading text-[13px] font-semibold text-white group-hover:text-[#F3E6C8] transition-colors">
              4 Kategori Utama
            </span>
            <span className="text-[11px] tabular-nums text-[var(--arch-text-accent-bright)] font-semibold">
              6–8 Jam <span aria-hidden="true" className="text-white/45">·</span> Mulai Rp {Math.round(regulerMinPrice / 1000)}rb
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-snug">
            Paket hemat harian untuk segala aktivitas.
          </p>
        </div>
        <ChevronRight
          size={15}
          className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </button>

      {/* 2. Viral Hits */}
      <button
        type="button"
        onClick={() => handleShortcutCategory('viral_hits')}
        className="w-full py-2.5 first:pt-1 last:pb-0.5 text-left flex items-center justify-between gap-2.5 group hover:bg-white/[0.02] transition-colors rounded-[6px] px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DFB76C]"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <span className="font-heading text-[13px] font-semibold text-white group-hover:text-[#F3E6C8] transition-colors">
              Viral Hits
            </span>
            <span className="text-[11px] tabular-nums text-[var(--arch-text-accent-bright)] font-semibold">
              8–12 Jam <span aria-hidden="true" className="text-white/45">·</span> Rp {viralRatePerMl.toLocaleString('id-ID')}/ml
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-snug">
            Konsentrat parfum viral, sebaran wangi lebih kuat.
          </p>
        </div>
        <ChevronRight
          size={15}
          className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </button>

      {/* 3. New & Trending */}
      <button
        type="button"
        onClick={() => handleShortcutCategory('new_trending')}
        className="w-full py-2.5 first:pt-1 last:pb-0.5 text-left flex items-center justify-between gap-2.5 group hover:bg-white/[0.02] transition-colors rounded-[6px] px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DFB76C]"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <span className="font-heading text-[13px] font-semibold text-white group-hover:text-[#F3E6C8] transition-colors">
              New & Trending
            </span>
            <span className="text-[11px] tabular-nums text-[var(--arch-text-accent-bright)] font-semibold">
              Seharian <span aria-hidden="true" className="text-white/45">·</span> Rp {trendingRatePerMl.toLocaleString('id-ID')}/ml
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-snug">
            Bibit Extrait terpekat, jejak mewah tahan seharian.
          </p>
        </div>
        <ChevronRight
          size={15}
          className="text-[#D4AF6A]/80 group-hover:text-[#F3E6C8] group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </button>
    </div>
  );

  const handleCheckoutWhatsApp = () => {
    if (!hasCartItems) {
      if (onNavigateToCollection) {
        onNavigateToCollection();
      }
      return;
    }

    playInteractionSound('luxurySuccess');

    const itemLines = cartItems.map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* — ${item.size} ml × ${item.quantity} btl (Rp ${(
          item.unitPrice * item.quantity
        ).toLocaleString('id-ID')})`
    );

    const message = [
      `*PESANAN TAS BELANJA SINKI PARFUM*`,
      `------------------------------------------`,
      ...itemLines,
      `------------------------------------------`,
      `• Total Botol: *${cartTotalBottles} botol*`,
      `• Subtotal: *Rp ${cartSubtotal.toLocaleString('id-ID')}*`,
      `• Pengiriman: *${isFreeShipping ? 'Gratis Ongkir Se-Jabodetabek' : `Reguler (Min. Rp ${minFreeShipping.toLocaleString('id-ID')} untuk Free Ongkir)`}*`,
      `• Metode Pembayaran: *${paymentMethod === 'qris' ? 'Transfer Cepat via QRIS' : 'Pesan Langsung via WhatsApp'}*`,
      `------------------------------------------`,
      `*TOTAL PEMBAYARAN:* *Rp ${cartSubtotal.toLocaleString('id-ID')}*`,
      `------------------------------------------`,
      paymentMethod === 'qris'
        ? `Halo Admin SINKI Parfum, saya sudah melihat QRIS dan ingin menyelesaikan pesanan di atas. Mohon konfirmasi ongkos kirim dan proses pengirimannya ya. Terima kasih!`
        : `Halo Admin SINKI Parfum, saya ingin memesan daftar parfum di tas belanja atas. Mohon info ketersediaan stok dan proses pengirimannya ya. Terima kasih!`,
    ].join('\n');

    onShowToast(`Menghubungkan langsung ke WhatsApp Resmi SINKI...`);
    openWhatsAppDirect(OFFICIAL_WHATSAPP_RAW, message);
  };

  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendar Cahaya Emas Halus & Elegan */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 shrink-0 sinki-arch-header border-b backdrop-blur-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-[6px] sinki-arch-subbox hover:border-[#E8C782]/60 border flex items-center justify-center text-[#E8C782] hover:text-[#F3E6C8] transition-colors active:scale-95 shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <ShoppingBag size={15} className="text-[#DFB76C] shrink-0" />
            <h2 className="font-heading text-[15px] sm:text-base font-semibold text-white tracking-[-0.015em] leading-[1.2] truncate">
              Tas Belanja SINKI
            </h2>
          </div>
        </div>

        {hasCartItems && (
          <span className="font-body text-[11px] tabular-nums font-medium text-[#DFB76C] bg-[#DFB76C]/10 border border-[#DFB76C]/35 px-2 py-0.5 rounded-[6px] shrink-0">
            {cartTotalBottles} Botol
          </span>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-28 space-y-3">

        {/* STATE A: KERANJANG TERISI (CART HAS ITEMS) */}
        {hasCartItems ? (
          <div key="order-filled-view" className="space-y-3">
            {/* PROMINENT FREE SHIPPING PROGRESS CARD */}
            <div className="sinki-cascade-row-0 p-3 rounded-[8px] sinki-arch-card sinki-arch-card-interactive border space-y-2 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-[6px] champagne-gold-btn text-slate-950 flex items-center justify-center shadow-md shrink-0">
                    <Truck size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-body text-[11px] text-white font-semibold leading-tight">
                        Gratis Ongkir Se-Jabodetabek
                      </span>
                      <span className="font-body text-[10.5px] tabular-nums text-zinc-300 font-medium bg-white/[0.06] px-1.5 py-0.5 rounded-[4px] border border-[#D4AF6A]/25 leading-none">
                        Min. Rp {minFreeShipping.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span className="font-body text-xs text-slate-300 block font-normal mt-0.5 leading-tight">
                      {isFreeShipping ? (
                        <span className="text-emerald-300 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} className="inline shrink-0" /> Selamat! Pesanan Anda berhak Gratis Ongkir 🎉
                        </span>
                      ) : (
                        <span>
                          Tambah <strong className="text-white font-semibold">Rp {amountToFreeShipping.toLocaleString('id-ID')}</strong> lagi untuk Gratis Ongkir
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-body text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-[6px] shrink-0 ${
                    isFreeShipping
                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'
                      : 'text-zinc-300 bg-white/[0.06] border border-[#D4AF6A]/25'
                  }`}
                >
                  {freeShippingProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-black/50 rounded-[4px] overflow-hidden border border-[#D4AF6A]/15">
                <div
                  className="h-full bg-gradient-to-r from-[#DFB76C] to-emerald-400 rounded-[4px] transition-all duration-500 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* DAFTAR ITEM PESANAN */}
            <div className="sinki-cascade-row-1 p-3.5 rounded-[10px] sinki-arch-card border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D4AF6A]/20">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} className="text-[#DFB76C]" />
                  <div>
                    <h3 className="font-heading font-semibold text-[14px] sm:text-[15px] text-white tracking-[-0.015em] leading-[1.25]">
                      Item Pesanan Anda
                    </h3>
                    <span className="font-body text-[11px] font-medium tabular-nums text-[#DFB76C] leading-tight">
                      {cartItems.length} item · {cartTotalBottles} botol
                    </span>
                  </div>
                </div>

                {!confirmClearCart ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearCart(true)}
                    className="font-body text-[11.5px] font-medium text-rose-300/90 hover:text-rose-200 px-2.5 py-1 rounded-[6px] bg-rose-500/10 border border-rose-500/30 leading-tight transition-colors active:scale-95"
                  >
                    Kosongkan
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClearCart(false)}
                      className="font-body text-[11.5px] font-medium text-slate-300 px-2 py-1 rounded-[6px] bg-white/10 leading-tight"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCartItems(clearCart());
                        setConfirmClearCart(false);
                        onShowToast('Tas belanja telah dikosongkan');
                      }}
                      className="font-body text-[11.5px] font-semibold text-white px-2 py-1 rounded-[6px] bg-rose-600 hover:bg-rose-500 leading-tight active:scale-95"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Items List dengan Cushion Press (Tanpa Double Blur) */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-[8px] sinki-arch-subbox hover:border-[#E8C782]/55 border flex items-center justify-between gap-2.5 transition-all sinki-cushion-press"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading text-[13.5px] sm:text-sm font-semibold text-white tracking-[-0.015em] leading-[1.25] truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 font-body text-xs tabular-nums mt-0.5 leading-tight">
                        <span className="text-zinc-300 font-medium bg-white/10 px-1.5 py-0.5 rounded-[4px] text-[11px]">
                          {item.size} ml
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[#DFB76C] font-semibold">
                          Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 sinki-arch-subbox px-1.5 py-1 rounded-[6px] border">
                        <button
                          type="button"
                          onClick={() => setCartItems(updateCartItemQuantity(item.id, -1))}
                          className="w-6.5 h-6.5 rounded-[5px] bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
                          title="Kurangi jumlah"
                        >
                          -
                        </button>
                        <span className="font-body text-xs font-semibold tabular-nums text-white min-w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCartItems(updateCartItemQuantity(item.id, 1))}
                          className="w-6.5 h-6.5 rounded-[5px] bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
                          title="Tambah jumlah"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setCartItems(removeFromCart(item.id));
                          onShowToast(`${item.name} (${item.size} ml) dihapus`);
                        }}
                        className="p-2 rounded-[6px] sinki-arch-subbox hover:bg-rose-500/20 hover:border-rose-500/40 border text-slate-300 hover:text-rose-300 transition-colors sinki-cushion-press-sm"
                        title="Hapus item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Button: Tambah Aroma Lain dari Koleksi SINKI */}
              {onNavigateToCollection && (
                <div className="pt-2 border-t border-[#D4AF6A]/20">
                  <button
                    type="button"
                    onClick={onNavigateToCollection}
                    className="w-full py-2.5 px-3 rounded-[8px] sinki-arch-subbox hover:border-[#E8C782]/65 border text-[#DFB76C] hover:text-[#F3E6C8] font-body text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 sinki-cushion-press-sm"
                  >
                    <Plus size={14} className="text-[#DFB76C]" />
                    <span>Tambah Aroma Lain dari 6 Koleksi SINKI</span>
                  </button>
                </div>
              )}
            </div>

            {/* COLLAPSIBLE PANDUAN KUALITAS & KETAHANAN SAAT KERANJANG TERISI */}
            <div className="sinki-cascade-row-2 rounded-[10px] sinki-arch-card border overflow-hidden">
              <button
                type="button"
                onClick={() => setIsGuideExpandedInCart((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <span className="font-heading text-xs sm:text-[13px] font-semibold text-white flex items-center gap-1.5">
                  <Clock size={13} className="text-[#DFB76C] shrink-0" />
                  <span>Lihat Perbedaan Kualitas & Ketahanan Aroma</span>
                </span>
                <ChevronDown
                  size={15}
                  className={`text-[#D4AF6A]/80 transition-transform duration-200 shrink-0 ${
                    isGuideExpandedInCart ? 'rotate-180 text-[#DFB76C]' : ''
                  }`}
                />
              </button>

              {isGuideExpandedInCart && (
                <div className="px-4 pb-3.5 pt-1 border-t border-[#D4AF6A]/20 space-y-1.5 sinki-screen-soft-fade">
                  <p className="font-body text-[11px] text-slate-400">
                    Ketuk salah satu kelas aroma di bawah untuk langsung melihat koleksinya:
                  </p>
                  {renderQualityGuideRows()}
                </div>
              )}
            </div>

            {/* METODE PENYELESAIAN PESANAN */}
            <div className="sinki-cascade-row-3 p-3.5 rounded-[10px] sinki-arch-card border space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-[#DFB76C] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
                  <CreditCardIcon size={15} /> Pilihan Pemesanan & Pembayaran
                </h3>
                <span className="font-body text-[11px] text-slate-300 font-normal">
                  Pilih cara ternyaman Anda
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="py-2.5 px-3 rounded-[8px] bg-gradient-to-r from-[#20c359] via-[#25D366] to-[#1ebe5d] hover:brightness-105 active:scale-[0.98] text-slate-950 font-body font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Pesan langsung lewat WhatsApp Resmi SINKI"
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span>Pesan via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod((prev) => (prev === 'qris' ? 'whatsapp' : 'qris'))}
                  className={`py-2.5 px-3 rounded-[8px] font-body text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                      : 'sinki-arch-subbox hover:border-[#E8C782]/60 text-slate-200 border'
                  }`}
                  title="Tampilkan kode QRIS resmi untuk transfer instan"
                >
                  <QrCode size={14} className="shrink-0" />
                  <span>{paymentMethod === 'qris' ? 'Tutup QRIS' : 'Bayar Cepat QRIS'}</span>
                </button>
              </div>

              {/* Mode Content: QRIS Card */}
              {paymentMethod === 'qris' && (
                <div className="space-y-2.5 sinki-screen-soft-fade">
                  <div className="p-2.5 rounded-[8px] sinki-arch-subbox border text-xs text-zinc-300 space-y-1">
                    <span className="font-semibold text-white block">Petunjuk Pembayaran Cepat:</span>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11.5px] text-slate-300">
                      <li>Scan barcode QRIS di bawah menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, atau Dana.</li>
                      <li>Masukkan nominal pas: <strong className="text-[#DFB76C] font-semibold">Rp {cartSubtotal.toLocaleString('id-ID')}</strong>.</li>
                      <li>Simpan bukti bayar & kirimkan via WhatsApp di bawah untuk proses kirim.</li>
                    </ol>
                  </div>

                  <QrisPaymentCard
                    amount={cartSubtotal}
                    onShowToast={onShowToast}
                    customQrisProp={customQris}
                  />
                </div>
              )}
            </div>

            {/* RINGKASAN PEMBAYARAN & TRUST BADGES */}
            <div className="sinki-cascade-row-3 p-3.5 rounded-[10px] sinki-arch-card border space-y-3">
              <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-white tracking-[-0.015em] leading-[1.25]">
                Rincian Pembayaran
              </h3>

              <div className="space-y-1.5 font-body text-xs sm:text-[13px] text-white">
                <div className="flex justify-between gap-2 font-medium">
                  <span className="text-slate-300">Subtotal ({cartTotalBottles} botol):</span>
                  <span className="font-semibold tabular-nums text-white shrink-0">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between gap-2 text-zinc-300 font-normal">
                  <span className="text-slate-300">Ongkos Kirim:</span>
                  <span className="font-medium text-[11.5px] text-right tabular-nums">
                    {isFreeShipping ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 size={11} /> Gratis Ongkir Jabodetabek
                      </span>
                    ) : (
                      <span className="text-zinc-300">
                        Reguler (Free Ongkir min. Rp {minFreeShipping.toLocaleString('id-ID')})
                      </span>
                    )}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-[#D4AF6A]/20 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-normal block leading-tight">
                      Total Tagihan:
                    </span>
                    <span className="font-body text-xl sm:text-2xl font-bold tabular-nums tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#DFB76C] to-[#C5A059] drop-shadow-sm">
                      Rp {cartSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <span className="font-body text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-[6px] border border-emerald-500/40 font-semibold leading-tight shrink-0">
                    Siap Dikirim
                  </span>
                </div>
              </div>

              {/* Single-Line Text-Only Authenticity Footer */}
              <p className="pt-2 border-t border-[#D4AF6A]/20 text-center font-body text-[10.5px] sm:text-[11px] text-slate-400 whitespace-nowrap">
                Bibit Murni Eropa
              </p>
            </div>
          </div>
        ) : (
          /* STATE B: KERANJANG KOSONG (EMPTY STATE YANG BERSIH, MEWAH & MEMBIMBING) */
          <div key="order-empty-view" className="space-y-3.5">
            {/* Empty State Card (Single Layer Cascade — Tanpa Nested Blur & Tanpa Backdrop-Blur Clash) */}
            <div className="sinki-cascade-row-0 p-6 rounded-[10px] sinki-arch-card border text-center space-y-3.5">
              <div className="w-14 h-14 rounded-[8px] bg-gradient-to-br from-[#DFB76C]/20 via-[#DFB76C]/10 to-transparent border border-[#DFB76C]/40 flex items-center justify-center text-[#DFB76C] mx-auto shadow-inner">
                <ShoppingBag size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-base sm:text-lg text-white tracking-[-0.015em] leading-[1.25]">
                  Tas Belanja Masih Kosong
                </h3>
                <p className="font-body text-xs sm:text-[13px] text-slate-300 font-normal max-w-sm mx-auto leading-[1.5]">
                  Pilih varian aroma favorit Anda dari 6 koleksi kurasi SINKI — Daily Fresh, Professional, Attraction, Luxury, Viral Hits, hingga New & Trending.
                </p>
              </div>

              {onNavigateToCollection && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onNavigateToCollection}
                    className="w-full py-3 px-4 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 active:scale-98 text-slate-950 font-body font-semibold text-xs sm:text-[13.5px] flex items-center justify-center shadow-lg shadow-black/40 transition-all"
                  >
                    <span>Jelajahi 6 Koleksi Aroma SINKI</span>
                  </button>
                </div>
              )}
            </div>

            {/* Panduan Kategori & Ketahanan SINKI */}
            <div className="sinki-cascade-row-1 p-4 rounded-[10px] sinki-arch-card border space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#D4AF6A]/20">
                <span className="font-heading text-xs sm:text-[13px] font-semibold text-white flex items-center gap-1.5">
                  <Clock size={13} className="text-[#DFB76C] shrink-0" />
                  <span>Panduan Kualitas & Ketahanan Aroma</span>
                </span>
                <span className="font-body text-[11px] text-slate-400">
                  Ketuk untuk buka koleksi
                </span>
              </div>

              {renderQualityGuideRows()}
            </div>

            {/* Single-Line Promo with Leading Icon & Clear Readable Blink */}
            <div className="sinki-cascade-row-2 pt-0.5 flex items-center justify-center">
              <p className="inline-flex items-center justify-center gap-1.5 font-body text-[11px] sm:text-xs font-medium text-white tabular-nums whitespace-nowrap">
                <Truck size={13} className="text-[var(--arch-text-accent-bright)] shrink-0 stroke-[2.1]" />
                <span className="sinki-readable-blink">
                  Gratis Ongkir Se-Jabodetabek (Min. Rp {Math.round(minFreeShipping / 1000)}rb)
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* REUSABLE PERFUME DETAIL SHEET (100% Identik di Collection, Order & Review) */}
      <PerfumeDetailModal
        perfume={selectedPerfumeForDetail}
        onClose={() => setSelectedPerfumeForDetail(null)}
        onShowToast={onShowToast}
        onCartUpdated={() => setCartItems(getStoredCart())}
      />
    </div>
  );
};

// Internal icon helper
const CreditCardIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

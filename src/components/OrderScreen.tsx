import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Crown,
  Truck,
  QrCode,
  Clock,
  ShieldCheck,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Top11Item } from '../data/top11';
import { QrisPaymentCard } from './QrisPaymentCard';
import { PerfumeDetailModal } from './PerfumeDetailModal';
import { PerfumeItem } from '../data/perfumes';
import { getStoredPerfumes, fetchPerfumesFromServer } from '../utils/perfumeStorage';
import {
  PricingConfig,
  getStoredPricing,
} from '../utils/pricingStorage';
import { openWhatsAppDirect } from '../utils/whatsappHelper';
import {
  CartItem,
  getStoredCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartSubtotal,
  getCartTotalCount,
  addToCart,
} from '../utils/cartStorage';

interface OrderScreenProps {
  onBackToHome: () => void;
  onNavigateToCollection?: () => void;
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
        const updated = addToCart({
          perfumeId: perfName.toLowerCase().replace(/\s+/g, '-'),
          name: perfName,
          size: 30,
          quantity: 1,
        });
        setCartItems(updated);
        onShowToast(`"${perfName} (30 ml)" ditambahkan ke tas belanja`);
      }
      onClearSelectedPerfume?.();
    }
  }, [selectedPerfumeFromCollection]);

  // Pricing configuration
  const activePricing = pricing || getStoredPricing();
  const minFreeShipping = activePricing.minFreeShipping || 150000;

  const hasCartItems = cartItems.length > 0;
  const cartTotalBottles = getCartTotalCount(cartItems);
  const cartSubtotal = getCartSubtotal(cartItems);
  const isFreeShipping = cartSubtotal >= minFreeShipping;
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / minFreeShipping) * 100));
  const amountToFreeShipping = Math.max(0, minFreeShipping - cartSubtotal);

  const handleCheckoutWhatsApp = () => {
    if (!hasCartItems) {
      if (onNavigateToCollection) {
        onNavigateToCollection();
      }
      return;
    }

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
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendar Cahaya Emas Halus & Elegan */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 shrink-0 bg-[#12141a]/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95 shrink-0"
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
          <span className="font-body text-[11px] tabular-nums font-medium text-[#DFB76C] bg-[#DFB76C]/10 border border-[#DFB76C]/25 px-2 py-0.5 rounded-full shrink-0">
            {cartTotalBottles} Botol
          </span>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-8 space-y-3">

        {/* STATE A: KERANJANG TERISI (CART HAS ITEMS) */}
        {hasCartItems ? (
          <>
            {/* PROMINENT FREE SHIPPING PROGRESS CARD */}
            <div className="p-3 rounded-2xl bg-[#141626] border border-white/10 hover:border-emerald-500/40 space-y-2 shadow-md transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#A07C3A] text-slate-950 flex items-center justify-center shadow-md shrink-0">
                    <Truck size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-body text-[11px] text-emerald-400 font-semibold leading-tight">
                        Gratis Ongkir Jabodetabek
                      </span>
                      <span className="font-body text-[10.5px] tabular-nums text-zinc-300 font-medium bg-white/10 px-1.5 py-0.5 rounded border border-white/15 leading-none">
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
                  className={`font-body text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    isFreeShipping
                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'
                      : 'text-zinc-300 bg-white/10 border border-white/15'
                  }`}
                >
                  {freeShippingProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#DFB76C] to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* DAFTAR ITEM PESANAN */}
            <div className="p-3.5 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
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
                    className="font-body text-[11.5px] font-medium text-rose-300/90 hover:text-rose-200 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 leading-tight transition-colors active:scale-95"
                  >
                    Kosongkan
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClearCart(false)}
                      className="font-body text-[11.5px] font-medium text-slate-300 px-2 py-1 rounded-lg bg-white/10 leading-tight"
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
                      className="font-body text-[11.5px] font-semibold text-white px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 leading-tight active:scale-95"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Items List dengan Transisi Fluid & Cushion Press */}
              <div className="space-y-2">
                {cartItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      animation: `sinkiCardCascade 520ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(idx * 60, 300)}ms both`,
                      willChange: 'transform, opacity, filter',
                    }}
                    className="p-3 rounded-2xl bg-[#141626] border border-white/10 flex items-center justify-between gap-2.5 hover:border-white/20 transition-all sinki-cushion-press"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading text-[13.5px] sm:text-sm font-semibold text-white tracking-[-0.015em] leading-[1.25] truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 font-body text-xs tabular-nums mt-0.5 leading-tight">
                        <span className="text-zinc-300 font-medium bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
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
                      <div className="flex items-center gap-1.5 bg-[#121422] px-1.5 py-1 rounded-xl border border-white/15">
                        <button
                          type="button"
                          onClick={() => setCartItems(updateCartItemQuantity(item.id, -1))}
                          className="w-6.5 h-6.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
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
                          className="w-6.5 h-6.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center sinki-cushion-press-sm"
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
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-300 hover:text-rose-300 transition-colors sinki-cushion-press-sm"
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
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onNavigateToCollection}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#DFB76C] hover:text-[#F3E6C8] font-body text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 sinki-cushion-press-sm"
                  >
                    <Plus size={14} className="text-[#DFB76C]" />
                    <span>Tambah Aroma Lain dari 6 Koleksi SINKI</span>
                  </button>
                </div>
              )}
            </div>

            {/* METODE PENYELESAIAN PESANAN */}
            <div className="p-3.5 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-lg backdrop-blur-md">
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
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#20c359] via-[#25D366] to-[#1ebe5d] hover:brightness-105 active:scale-[0.98] text-slate-950 font-body font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Pesan langsung lewat WhatsApp Resmi SINKI"
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span>Pesan via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod((prev) => (prev === 'qris' ? 'whatsapp' : 'qris'))}
                  className={`py-2.5 px-3 rounded-2xl font-body text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'bg-gradient-to-r from-[#DFB76C] to-[#C5A059] text-slate-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                  }`}
                  title="Tampilkan kode QRIS resmi untuk transfer instan"
                >
                  <QrCode size={14} className="shrink-0" />
                  <span>{paymentMethod === 'qris' ? 'Tutup QRIS' : 'Bayar Cepat QRIS'}</span>
                </button>
              </div>

              {/* Mode Content: QRIS Card */}
              {paymentMethod === 'qris' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-zinc-300 space-y-1">
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
            <div className="p-3.5 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-lg backdrop-blur-md">
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

                <div className="pt-2.5 border-t border-white/12 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-normal block leading-tight">
                      Total Tagihan:
                    </span>
                    <span className="font-body text-xl sm:text-2xl font-bold tabular-nums tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#DFB76C] to-[#C5A059] drop-shadow-sm">
                      Rp {cartSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <span className="font-body text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/40 font-semibold leading-tight shrink-0">
                    Siap Dikirim
                  </span>
                </div>
              </div>

              {/* Guarantee Trust Badges */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 font-body text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="leading-[1.3] font-normal">Garansi Pecah Diganti Baru 100%</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                  <Crown size={14} className="text-[#DFB76C] shrink-0" />
                  <span className="leading-[1.3] font-normal">Bibit Murni Grade A Import Eropa</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* STATE B: KERANJANG KOSONG (EMPTY STATE YANG BERSIH, MEWAH & MEMBIMBING) */
          <div className="space-y-3.5">
            {/* Empty State Card */}
            <div className="p-6 rounded-3xl bg-[#141724]/95 border border-white/12 text-center space-y-3.5 shadow-xl backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFB76C]/20 via-[#DFB76C]/10 to-transparent border border-[#DFB76C]/30 flex items-center justify-center text-[#DFB76C] mx-auto shadow-inner">
                <ShoppingBag size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-base sm:text-lg text-white tracking-[-0.015em] leading-[1.25]">
                  Tas Belanja Masih Kosong
                </h3>
                <p className="font-body text-xs sm:text-[13px] text-slate-300 font-normal max-w-sm mx-auto leading-[1.5]">
                  Pilih varian aroma favorit Anda dari 100+ koleksi parfum SINKI (Pria, Wanita, Unisex, Soft, Best Seller, & Mykonos Series).
                </p>
              </div>

              {onNavigateToCollection && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onNavigateToCollection}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 active:scale-98 text-slate-950 font-body font-semibold text-xs sm:text-[13.5px] flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition-all"
                  >
                    <Sparkles size={16} className="shrink-0" />
                    <span>Jelajahi 6 Koleksi Aroma SINKI</span>
                    <ArrowRight size={15} className="shrink-0" />
                  </button>
                </div>
              )}
            </div>

            {/* Panduan Kategori & Ketahanan SINKI */}
            <div className="p-3.5 rounded-3xl bg-[#141724]/90 border border-white/10 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-xs sm:text-[13px] font-semibold text-[#DFB76C] flex items-center gap-1.5">
                  <Clock size={13} /> Panduan Kualitas & Ketahanan Aroma
                </span>
                <span className="font-body text-[10.5px] text-slate-300">Bibit Murni Eropa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-body text-xs">
                {/* Classic EDP */}
                <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-white">Classic EDP</span>
                    <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      6–8 Jam
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-[1.35]">
                    Segar dan bersih untuk kuliah, kerja, atau aktivitas harian santai. Mulai Rp 17.000.
                  </p>
                </div>

                {/* Premium Extrait */}
                <div className="p-2.5 rounded-xl bg-black/35 border border-[#C5A059]/25 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[#DFB76C]">Premium Extrait</span>
                    <span className="text-[10px] text-[#DFB76C] bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                      8–12 Jam
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-[1.35]">
                    Konsentrasi bibit murni ekstrak tinggi. Jejak aroma kuat, mewah, tahan di ruangan AC.
                  </p>
                </div>

                {/* Mykonos Series */}
                <div className="p-2.5 rounded-xl bg-black/35 border border-rose-500/25 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-rose-300">Mykonos Series</span>
                    <span className="text-[10px] text-rose-200 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Seharian
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-[1.35]">
                    Racikan viral berkelas mewah dengan formula pekat menempel kuat di serat pakaian.
                  </p>
                </div>
              </div>
            </div>

            {/* Promo & Guarantee Trust Badges */}
            <div className="grid grid-cols-2 gap-2 font-body text-[11px] text-zinc-300">
              <div className="p-2.5 rounded-2xl bg-[#141724]/90 border border-white/10 flex items-center gap-2">
                <Truck size={16} className="text-emerald-400 shrink-0" />
                <span className="leading-[1.35]">
                  <strong className="text-white font-medium block">Gratis Ongkir</strong>
                  Se-Jabodetabek Min. Rp 150rb
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141724]/90 border border-white/10 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#DFB76C] shrink-0" />
                <span className="leading-[1.35]">
                  <strong className="text-white font-medium block">Garansi Pecah</strong>
                  Diganti 100% Baru
                </span>
              </div>
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

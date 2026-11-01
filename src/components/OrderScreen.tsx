import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Layers,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  Truck,
  QrCode,
  Tag,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
  Plus,
} from 'lucide-react';
import { TOP_11_DATA, Top11Item } from '../data/top11';
import { getStoredTopPerfumes } from '../utils/topPerfumesStorage';
import { QrisPaymentCard } from './QrisPaymentCard';
import {
  PricingConfig,
  getStoredPricing,
  DEFAULT_PRICING,
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
}

// TIER DEFINITIONS
export type PerfumeTier = 'non_premium' | 'premium' | 'mykonos';

export const BOTTLE_SIZES = [10, 15, 20, 30, 50, 100] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

const OFFICIAL_WHATSAPP_RAW = '6289636824552';
const DISPLAY_WHATSAPP = '0896-3682-4552';

export const OrderScreen: React.FC<OrderScreenProps> = ({
  onBackToHome,
  onNavigateToCollection,
  onShowToast,
  pricing,
  customQris,
  topPerfumes,
  cartItems: cartItemsProp,
  selectedPerfumeFromCollection,
}) => {
  const activeTopList = topPerfumes && topPerfumes.length > 0 ? topPerfumes : getStoredTopPerfumes();

  // Persistent Shopping Cart State (Synced with CollectionScreen)
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    cartItemsProp ? cartItemsProp : getStoredCart()
  );
  const [confirmClearCart, setConfirmClearCart] = useState(false);
  const [showManualFormWhenCartActive, setShowManualFormWhenCartActive] = useState(false);

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

  // Order Selection State
  const [tier, setTier] = useState<PerfumeTier>('non_premium');
  const [selectedSize, setSelectedSize] = useState<BottleSize>(30);
  const [selectedVariant, setSelectedVariant] = useState(() => (activeTopList[0]?.name || TOP_11_DATA[0].name));
  const [customVariantName, setCustomVariantName] = useState('');

  // Sync when a perfume is chosen directly from Collection screen
  useEffect(() => {
    if (selectedPerfumeFromCollection) {
      const perfName = selectedPerfumeFromCollection.name;
      const isTop = activeTopList.some((item) => item.name.toLowerCase() === perfName.toLowerCase());
      if (isTop) {
        setSelectedVariant(perfName);
        setCustomVariantName('');
      } else {
        setCustomVariantName(perfName);
      }

      if (selectedPerfumeFromCollection.pricePerMl === 4000) {
        setTier('premium');
      } else if (selectedPerfumeFromCollection.pricePerMl === 3000) {
        setTier('mykonos');
      } else if (
        selectedPerfumeFromCollection.category === 'mykonos' ||
        perfName.toLowerCase().includes('mykonos')
      ) {
        setTier('mykonos');
      }
    }
  }, [selectedPerfumeFromCollection, activeTopList]);
  const [quantity, setQuantity] = useState(1);

  // Price List Visibility Toggle (Inline so it never turns black or gets blocked by transforms)
  const [showPriceList, setShowPriceList] = useState(false);

  // Show QRIS with Silk Curtain & Soft Bloom transition
  const [showQris, setShowQris] = useState(false);
  const [isClosingQris, setIsClosingQris] = useState(false);

  const handleOpenQris = () => {
    setIsClosingQris(false);
    setShowQris(true);
  };

  const handleCloseQris = () => {
    setIsClosingQris(true);
    setTimeout(() => {
      setShowQris(false);
      setIsClosingQris(false);
    }, 450);
  };

  // Dynamic Active Pricing Configuration (Editable by Owner via Secret Panel)
  const activePricing = pricing || getStoredPricing();
  const currentNonPremium = activePricing.nonPremium || DEFAULT_PRICING.nonPremium;
  const currentPremiumRate = activePricing.premiumRatePerMl || 4000;
  const currentMykonosRate = activePricing.mykonosRatePerMl || 3000;
  const minFreeShipping = activePricing.minFreeShipping || 150000;

  // Calculations
  const getPriceForSize = (s: BottleSize): number => {
    if (tier === 'non_premium') {
      return currentNonPremium[s] || 39000;
    }
    if (tier === 'premium') {
      return s * currentPremiumRate;
    }
    return s * currentMykonosRate;
  };

  const unitPrice = getPriceForSize(selectedSize);
  const manualTotalAmount = unitPrice * quantity;

  const hasCartItems = cartItems.length > 0;
  const cartTotalBottles = getCartTotalCount(cartItems);
  const cartSubtotal = getCartSubtotal(cartItems);
  const totalAmount = hasCartItems ? cartSubtotal : manualTotalAmount;

  const currentVariantDisplay =
    customVariantName.trim() ? customVariantName.trim() : selectedVariant;

  const handleCheckoutWhatsApp = () => {
    if (hasCartItems) {
      const itemLines = cartItems.map(
        (item, idx) =>
          `${idx + 1}. *${item.name}* — ${item.size} ml × ${item.quantity} btl (Rp ${(
            item.unitPrice * item.quantity
          ).toLocaleString('id-ID')})`
      );

      const message = [
        `*PESANAN KERANJANG PARFUM SINKI*`,
        `------------------------------------------`,
        ...itemLines,
        `------------------------------------------`,
        `• Total Botol: *${cartTotalBottles} botol*`,
        `• Pengiriman: *Gratis Ongkir Se-Jabodetabek (Min. Order Rp ${minFreeShipping.toLocaleString('id-ID')})*`,
        `------------------------------------------`,
        `*TOTAL PEMBAYARAN:* *Rp ${totalAmount.toLocaleString('id-ID')}*`,
        `------------------------------------------`,
        `Halo Admin SINKI Parfums, saya ingin memesan daftar parfum di keranjang atas. Mohon info ketersediaan dan pengirimannya ya. Terima kasih!`,
      ].join('\n');

      onShowToast(`Menghubungkan keranjang belanja ke WhatsApp SINKI...`);
      openWhatsAppDirect(OFFICIAL_WHATSAPP_RAW, message);
      return;
    }

    const tierName =
      tier === 'non_premium'
        ? 'Classic EDP (Ketahanan 6-8 Jam)'
        : tier === 'premium'
        ? `Premium Extrait (Ketahanan 8-12 Jam - Rp ${currentPremiumRate.toLocaleString('id-ID')}/ml)`
        : `Mykonos Series (Ketahanan Seharian - Rp ${currentMykonosRate.toLocaleString('id-ID')}/ml)`;

    const message = [
      `*PESANAN PARFUM SINKI*`,
      `------------------------------------------`,
      `• Kategori: *${tierName}*`,
      `• Varian Aroma: *${currentVariantDisplay}*`,
      `• Ukuran Botol: *${selectedSize} ml*`,
      `• Jumlah: *${quantity} botol*`,
      `• Harga Satuan: Rp ${unitPrice.toLocaleString('id-ID')}`,
      `• Pengiriman: *Gratis Ongkir Se-Jabodetabek (Min. Order Rp ${minFreeShipping.toLocaleString('id-ID')})*`,
      `------------------------------------------`,
      `*TOTAL PEMBAYARAN:* *Rp ${totalAmount.toLocaleString('id-ID')}*`,
      `------------------------------------------`,
      `Halo Admin SINKI Parfums, saya ingin memesan parfum di atas. Mohon info ketersediaan dan cara pengirimannya ya. Terima kasih!`,
    ].join('\n');

    onShowToast(`Menghubungkan langsung ke WhatsApp SINKI...`);
    openWhatsAppDirect(OFFICIAL_WHATSAPP_RAW, message);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden">
      {/* Pendar Cahaya Emas Halus & Tipis */}
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
              Pemesanan SINKI
            </h2>
          </div>
        </div>

        {/* View / Hide Full Price List Button */}
        <button
          onClick={() => setShowPriceList((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-body text-[11.5px] font-semibold leading-tight transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Tag size={12} className="text-[#DFB76C]" />
          <span>Daftar Harga</span>
          {showPriceList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-32 space-y-3">
        {/* PROMINENT BADGE: GRATIS ONGKIR SE-JABODETABEK MIN ORDER 150 RIBU */}
        <div className="p-2.5 rounded-2xl bg-[#141626] border border-white/10 hover:border-emerald-500/40 flex items-center justify-between gap-2 shadow-md transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#A07C3A] text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Truck size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-body text-[11px] text-emerald-400 font-medium leading-tight">
                  Promo Spesial
                </span>
                <span className="font-body text-[10.5px] tabular-nums text-zinc-300 font-medium bg-white/10 px-1.5 py-0.5 rounded border border-white/15 leading-none">
                  Min. Rp {minFreeShipping.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="font-heading text-[13px] sm:text-[13.5px] font-semibold text-white tracking-[-0.015em] block leading-[1.22] mt-0.5 drop-shadow-sm">
                Gratis Ongkir Se-Jabodetabek
              </span>
            </div>
          </div>
          {totalAmount >= minFreeShipping ? (
            <span className="font-body text-[11px] tabular-nums text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold leading-tight shrink-0">
              ✓ Tercapai
            </span>
          ) : (
            <span className="font-body text-[11px] tabular-nums text-zinc-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full font-medium leading-tight shrink-0">
              Min. {(minFreeShipping / 1000).toFixed(0)}rb
            </span>
          )}
        </div>

        {/* INLINE EXPANDABLE DAFTAR HARGA TABLE */}
        {showPriceList && (
          <div className="p-3 rounded-3xl bg-[#141626] border border-white/15 space-y-2.5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-heading font-semibold text-[14px] sm:text-[15px] text-[#DFB76C] tracking-[-0.015em] leading-[1.25]">
                  Daftar Harga Lengkap SINKI
                </h3>
                <p className="font-body text-[11px] text-slate-300 font-normal mt-0.5 leading-[1.4]">
                  Pilih ukuran & kategori sesuai selera Anda
                </p>
              </div>
              <button
                onClick={() => setShowPriceList(false)}
                className="font-body text-[11.5px] font-medium text-slate-200 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 leading-tight"
              >
                Tutup
              </button>
            </div>

            {/* Price Table 1: Classic EDP */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-[13px] font-semibold text-white flex items-center gap-1 leading-[1.25]">
                  Classic EDP
                </span>
                <span className="font-body text-[11px] tabular-nums text-emerald-400 font-medium bg-emerald-500/15 px-2 py-0.5 rounded leading-tight">
                  ⏱️ Awet 6–8 Jam
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-body text-[11.5px] tabular-nums">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1.5 rounded-lg bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block leading-tight">{s}ml</span>
                    <span className="font-semibold text-zinc-200 leading-snug">
                      Rp {((currentNonPremium[s] || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Table 2: Premium */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-[#C5A059]/25 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-heading text-[13px] font-semibold text-[#DFB76C] flex items-center gap-1 leading-[1.25]">
                  <Crown size={12} /> Premium
                </span>
                <span className="font-body text-[11px] tabular-nums font-medium text-zinc-200 bg-white/10 px-2 py-0.5 rounded leading-tight">
                  ⏱️ Awet 8–12 Jam • Rp {currentPremiumRate.toLocaleString('id-ID')} / ml
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-body text-[11.5px] tabular-nums">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1.5 rounded-lg bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block leading-tight">{s}ml</span>
                    <span className="font-semibold text-[#DFB76C] leading-snug">
                      Rp {((s * currentPremiumRate) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Table 3: Mykonos */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-rose-500/25 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-heading text-[13px] font-semibold text-rose-300 flex items-center gap-1 leading-[1.25]">
                  <Flame size={12} /> Mykonos Series
                </span>
                <span className="font-body text-[11px] tabular-nums font-medium text-rose-200 bg-rose-500/15 px-2 py-0.5 rounded leading-tight">
                  ⏱️ Awet Seharian • Rp {currentMykonosRate.toLocaleString('id-ID')} / ml
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-body text-[11.5px] tabular-nums">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1.5 rounded-lg bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block leading-tight">{s}ml</span>
                    <span className="font-semibold text-rose-300 leading-snug">
                      Rp {((s * currentMykonosRate) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KERANJANG BELANJA DARI HALAMAN COLLECTION */}
        {hasCartItems && (
          <div className="p-3 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-[#DFB76C]" />
                <div>
                  <h3 className="font-heading font-semibold text-[14px] sm:text-[15px] text-white tracking-[-0.015em] leading-[1.25]">
                    Keranjang Belanja
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
                  className="font-body text-[11.5px] font-medium text-rose-300/90 hover:text-rose-200 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 leading-tight transition-colors"
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
                      onShowToast('Keranjang belanja dikosongkan');
                    }}
                    className="font-body text-[11.5px] font-semibold text-white px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 leading-tight"
                  >
                    Ya, Hapus
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#141626] border border-white/10 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading text-[13.5px] sm:text-sm font-semibold text-white tracking-[-0.015em] leading-[1.25] truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 font-body text-xs tabular-nums mt-0.5 leading-tight">
                      <span className="text-slate-300 font-normal">{item.size} ml</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[#DFB76C] font-semibold">
                        Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 bg-[#121422] px-1.5 py-1 rounded-lg border border-white/15">
                      <button
                        type="button"
                        onClick={() => setCartItems(updateCartItemQuantity(item.id, -1))}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-body text-xs font-semibold tabular-nums text-white min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCartItems(updateCartItemQuantity(item.id, 1))}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-body text-xs font-semibold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCartItems(removeFromCart(item.id));
                        onShowToast(`${item.name} (${item.size} ml) dihapus dari keranjang`);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-300 hover:text-rose-300 transition-colors"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {onNavigateToCollection && (
              <button
                type="button"
                onClick={onNavigateToCollection}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#DFB76C] font-body text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={13} className="text-[#DFB76C]" />
                <span>Tambah Varian Lain dari Collection</span>
              </button>
            )}
          </div>
        )}

        {/* TOGGLE FORM MANUAL BILA KERANJANG SEDANG TERISI */}
        {hasCartItems && (
          <button
            type="button"
            onClick={() => setShowManualFormWhenCartActive((prev) => !prev)}
            className="w-full py-2 px-3 rounded-xl bg-[#141724]/80 border border-white/10 text-slate-300 hover:text-white font-body text-xs font-medium flex items-center justify-between transition-colors"
          >
            <span>Pesan Varian Tunggal Tanpa Keranjang (Opsional)</span>
            {showManualFormWhenCartActive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        {/* STEP 1: PILIH KATEGORI PARFUM */}
        {(!hasCartItems || showManualFormWhenCartActive) && (
        <div className="p-3 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-2.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-[#DFB76C] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
              <Layers size={14} className="shrink-0" /> 1. Kategori Parfum & Ketahanan
            </h3>
            <span className="font-body text-[11px] text-zinc-300 font-medium flex items-center gap-1 leading-tight">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" /> Bibit Import Eropa
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Classic EDP (dulu Non Premium) */}
            <button
              onClick={() => setTier('non_premium')}
              className={`p-2 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'non_premium'
                  ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-[10px] font-medium leading-none tabular-nums text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                  <Clock size={9} /> 6–8 Jam
                </span>
              </div>
              <span className="font-heading font-semibold text-[12.5px] text-white block leading-[1.22] truncate">
                Classic EDP
              </span>
              <span className="font-body text-[10.5px] text-zinc-300 block font-normal mt-0.5 leading-[1.3] truncate">
                Daily Fresh
              </span>
              <span className="font-body text-[11px] tabular-nums text-zinc-100 font-semibold block mt-1 leading-tight">
                Mulai 17rb
              </span>
            </button>

            {/* Premium */}
            <button
              onClick={() => setTier('premium')}
              className={`p-2 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'premium'
                  ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-[10px] font-medium leading-none tabular-nums text-[#DFB76C] bg-white/10 px-1.5 py-0.5 rounded-full border border-white/15 flex items-center gap-0.5">
                  <Clock size={9} /> 8–12 Jam
                </span>
              </div>
              <span className="font-heading font-semibold text-[12.5px] text-white block leading-[1.22] truncate">
                Premium
              </span>
              <span className="font-body text-[10.5px] text-zinc-300 block font-normal mt-0.5 leading-[1.3] truncate">
                Konsentrasi Tinggi
              </span>
              <span className="font-body text-[11px] tabular-nums text-[#DFB76C] font-semibold block mt-1 leading-tight">
                Rp {currentPremiumRate.toLocaleString('id-ID')}/ml
              </span>
            </button>

            {/* Mykonos */}
            <button
              onClick={() => setTier('mykonos')}
              className={`p-2 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'mykonos'
                  ? 'bg-rose-500/15 border-rose-400/80 shadow-[0_2px_12px_rgba(244,63,94,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-[10px] font-medium leading-none tabular-nums text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-0.5">
                  <Clock size={9} /> Seharian
                </span>
              </div>
              <span className="font-heading font-semibold text-[12.5px] text-white block leading-[1.22] truncate">
                Mykonos
              </span>
              <span className="font-body text-[10.5px] text-rose-200/90 block font-normal mt-0.5 leading-[1.3] truncate">
                Aroma Viral Mewah
              </span>
              <span className="font-body text-[11px] tabular-nums text-rose-300 font-semibold block mt-1 leading-tight">
                Rp {currentMykonosRate.toLocaleString('id-ID')}/ml
              </span>
            </button>
          </div>

          {/* Edukasi Keunggulan & Ketahanan (Membangun Kepercayaan Pembeli) */}
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-2.5 shadow-inner font-body">
            <div className="w-6.5 h-6.5 rounded-lg bg-white/10 text-[#DFB76C] flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={14} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              {tier === 'non_premium' && (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white leading-tight">Pilihan Terpilih: Classic EDP</span>
                    <span className="text-[11px] font-medium tabular-nums text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 leading-none">
                      Awet 6–8 Jam
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs font-normal leading-[1.45]">
                    Racikan harian beraroma segar dan bersih. Sangat pas untuk kuliah, nongkrong, dan rutinitas santai harian tanpa khawatir kantong bolong.
                  </p>
                </>
              )}
              {tier === 'premium' && (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white leading-tight">Pilihan Terpilih: Premium Extrait</span>
                    <span className="text-[11px] font-medium tabular-nums text-[#DFB76C] bg-white/10 px-1.5 py-0.5 rounded border border-white/15 leading-none">
                      Awet 8–12 Jam
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs font-normal leading-[1.45]">
                    Konsentrasi bibit murni ekstrak grade A eropa. Jejak aroma kuat dan mewah, tahan banting untuk kerja di ruangan AC maupun aktivitas padat seharian.
                  </p>
                </>
              )}
              {tier === 'mykonos' && (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white leading-tight">Pilihan Terpilih: Mykonos Series</span>
                    <span className="text-[11px] font-medium tabular-nums text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 leading-none">
                      Awet Seharian Penuh
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs font-normal leading-[1.45]">
                    Aroma viral berkelas mewah dengan formula pekat ekstra awet. Semerbak menempel kuat di serat pakaian dari pagi hingga malam hari.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* STEP 2: PILIH UKURAN BOTOL */}
          <div className="pt-0.5">
            <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-[#DFB76C] tracking-[-0.015em] leading-[1.25] block mb-2">
              2. Pilih Ukuran Botol
            </h3>

            <div className="grid grid-cols-3 gap-1.5">
              {BOTTLE_SIZES.map((size) => {
                const isSelected = selectedSize === size;
                const price = getPriceForSize(size);

                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`p-2 rounded-2xl border text-center font-body transition-all ${
                      isSelected
                        ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                        : 'bg-white/5 border-white/12 hover:border-white/25'
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] font-semibold tabular-nums text-white block leading-tight">
                      {size} ml
                    </span>
                    <span className="text-[11.5px] font-medium tabular-nums text-[#DFB76C] block mt-0.5 leading-tight">
                      Rp {price.toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: PILIH VARIAN AROMA & JUMLAH */}
          <div className="pt-0.5 space-y-2">
            <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-[#DFB76C] tracking-[-0.015em] leading-[1.25] block">
              3. Varian Aroma
            </h3>

            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => {
                  setSelectedVariant(e.target.value);
                  setCustomVariantName('');
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#141626] border border-white/15 text-white font-body font-medium text-base sm:text-sm leading-normal focus:outline-none focus:border-[#DFB76C] appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {activeTopList.map((item) => (
                  <option key={item.id} value={item.name} className="bg-[#141626] text-white">
                    #{item.rank}: {item.name} ({item.type})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <input
              type="text"
              placeholder="Atau ketik nama parfum pilihan Anda..."
              value={customVariantName}
              onChange={(e) => setCustomVariantName(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#141626] border border-white/15 text-white font-body font-normal text-base sm:text-sm leading-normal focus:outline-none focus:border-[#DFB76C] placeholder:text-slate-400 shadow-inner"
            />

            {/* Quantity */}
            <div className="pt-2 flex items-center justify-between border-t border-white/12 font-body">
              <span className="text-xs sm:text-[13px] text-white font-medium">Jumlah Botol:</span>
              <div className="flex items-center gap-2.5 bg-[#121422] p-1 rounded-xl border border-white/15">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-6.5 h-6.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <span className="text-xs sm:text-[13px] font-semibold tabular-nums text-white min-w-5 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-6.5 h-6.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* STEP 4: PEMBAYARAN QRIS RESMI (SEMBUNYIKAN BY DEFAULT, BUKA KETIKA MAU BAYAR) */}
        <div className="p-3 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-2.5 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-heading text-[14px] sm:text-[15px] font-semibold text-[#DFB76C] tracking-[-0.015em] leading-[1.25] flex items-center gap-1.5">
              <QrCode size={14} className="shrink-0" /> 4. Pembayaran QRIS SINKI
            </h3>
            <span className="font-body text-[11px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium leading-tight">
              BCA • Mandiri • E-Wallet
            </span>
          </div>

          {!showQris ? (
            /* Tampilan Ringkas Saat QRIS Disembunyikan */
            <div className="p-3 rounded-2xl bg-black/35 border border-white/10 text-center space-y-2 transition-all duration-300">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#DFB76C] mx-auto shadow-inner">
                <QrCode size={20} />
              </div>

              <div>
                <span className="font-heading font-semibold text-[14px] sm:text-[15px] text-white tracking-[-0.015em] leading-[1.25] block">
                  Mau Bayar Langsung Pakai QRIS?
                </span>
                <span className="font-body text-xs text-slate-300 font-normal block mt-1 leading-[1.45]">
                  Mendukung semua Bank (BCA, Mandiri, BRI, BNI) & E-Wallet (GoPay, OVO, Dana, ShopeePay)
                </span>
              </div>

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenQris}
                  className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 active:scale-98 text-slate-950 font-body font-semibold text-xs sm:text-[13px] tabular-nums flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition-all duration-300"
                >
                  <Eye size={15} className="shrink-0" />
                  <span>Tampilkan Kode QRIS (Rp {totalAmount.toLocaleString('id-ID')})</span>
                </button>
              </div>

              <p className="font-body text-[11px] text-slate-400 font-normal leading-[1.4]">
                Atau Anda juga bisa langsung chat WhatsApp di bawah tanpa buka QRIS sekarang.
              </p>
            </div>
          ) : (
            /* Tampilan QRIS Terbuka - Pure Crystal Smooth (Zero Blur - 100% Tajam & Ramah di Mata) */
            <div
              className={`space-y-2.5 relative overflow-hidden transition-all duration-400 ease-out ${
                isClosingQris
                  ? 'opacity-0 translate-y-2 transition-all duration-300 ease-in'
                  : 'animate-qris-unveil'
              }`}
            >

              <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                <span className="font-body text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <QrCode size={13} className="text-[#DFB76C] shrink-0" /> Silakan Scan Barcode di Bawah:
                </span>
                <button
                  type="button"
                  onClick={handleCloseQris}
                  className="font-body text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded-lg border border-white/10 font-medium leading-tight flex items-center gap-1 transition-all duration-300 active:scale-95 shrink-0"
                >
                  <EyeOff size={11} />
                  <span>Sembunyikan QRIS</span>
                </button>
              </div>

              <div className="relative z-10">
                <QrisPaymentCard
                  amount={totalAmount}
                  onShowToast={onShowToast}
                  customQrisProp={customQris}
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 5: TOTAL RINCIAN & TOMBOL WHATSAPP RESMI */}
        <div className="p-3 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-2.5 shadow-lg backdrop-blur-md">
          {/* Summary */}
          <div className="space-y-1.5 font-body text-xs sm:text-[13px] text-white">
            <div className="flex justify-between gap-2 font-medium">
              <span>
                {hasCartItems
                  ? `Subtotal Keranjang (${cartTotalBottles} botol):`
                  : `Subtotal (${quantity}x ${selectedSize}ml):`}
              </span>
              <span className="font-semibold tabular-nums text-white shrink-0">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between gap-2 text-zinc-300 font-normal">
              <span>Pengiriman:</span>
              <span className="font-medium text-[11.5px] text-right tabular-nums">
                {totalAmount >= minFreeShipping ? (
                  <span className="text-emerald-400 font-semibold">Gratis Ongkir (Order ≥ Rp {minFreeShipping.toLocaleString('id-ID')})</span>
                ) : (
                  <span className="text-zinc-300">
                    Gratis Ongkir (Min. Rp {minFreeShipping.toLocaleString('id-ID')})
                  </span>
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-white/12 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-zinc-300 font-normal block leading-tight">Total Akhir:</span>
                <span className="font-body text-lg sm:text-xl font-bold tabular-nums tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#DFB76C] to-[#C5A059] drop-shadow-sm">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <span className="font-body text-[11px] text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/40 font-semibold leading-tight shrink-0">
                Pesan Cepat WA
              </span>
            </div>
          </div>

            {/* Guarantee Trust Badges */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 font-body text-[11px] text-zinc-300">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                <span className="leading-[1.32] font-normal">Garansi Pecah Diganti 100%</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                <Crown size={13} className="text-[#DFB76C] shrink-0" />
                <span className="leading-[1.32] font-normal">Bibit Murni Import Eropa Grade A</span>
              </div>
            </div>
          </div>
        </div>

      {/* KONSEP 2: COMPACT SLENDER FLOATING ACTION PILL (Kapsul Melayang Ringkas & Tidak Terlalu Panjang) */}
      <div className="absolute bottom-[82px] inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <button
          onClick={handleCheckoutWhatsApp}
          className="pointer-events-auto inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[#20c359] via-[#25D366] to-[#1ebe5d] hover:brightness-105 active:scale-95 text-slate-950 font-body font-semibold text-xs sm:text-[13px] leading-none tabular-nums transition-all shadow-[0_6px_20px_rgba(37,211,102,0.38),0_2px_8px_rgba(0,0,0,0.6)] border border-white/30 select-none cursor-pointer max-w-full"
          title="Pesan via WhatsApp Resmi SINKI"
          aria-label="Pesan via WhatsApp"
        >
          {/* Ikon WhatsApp Resmi */}
          <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-slate-950">
              <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.99.582 3.844 1.589 5.414L2 22l4.73-1.547a9.957 9.957 0 0 0 5.274 1.555h.004c5.524 0 10.004-4.48 10.004-10.004 0-2.673-1.041-5.186-2.932-7.077A9.94 9.94 0 0 0 12.004 2zm5.827 14.195c-.244.686-1.42 1.314-1.96 1.393-.51.074-1.176.104-3.385-.81-2.825-1.168-4.636-4.05-4.776-4.238-.14-.188-1.144-1.523-1.144-2.906 0-1.383.724-2.064.98-2.348.257-.284.56-.355.748-.355.187 0 .374.002.538.01.174.009.408-.066.638.487.234.563.8 1.947.87 2.088.07.14.117.305.023.493-.093.187-.14.305-.28.47-.14.164-.294.366-.42.492-.14.14-.287.293-.124.573.164.28 1.096 1.8 2.378 2.94 1.649 1.467 3.037 1.923 3.47 2.11.433.187.687.164.943-.117.257-.28 1.1-.1.285 1.4-.187.305-.304.585-.425.28-.12.44-.047.88-.023 1.32.023.14.07.28.163.42.093.14.28.164.444.024.164-.14.538-.492.686-.686.147-.194.29-.387.41-.53.118-.14.19-.234.33-.093.14.14.887.44 1.04.516.152.076.254.113.29.176.037.063.037.368-.207 1.054z" />
            </svg>
          </div>

          {/* Teks Tombol */}
          <span className="font-semibold leading-none whitespace-nowrap">
            Pesan via WhatsApp
          </span>

          {/* Pemisah Dot */}
          <span className="text-slate-950/40 text-xs font-semibold leading-none">•</span>

          {/* Nominal Harga Ringkas */}
          <span className="font-body text-xs font-semibold leading-none tabular-nums text-slate-950 whitespace-nowrap bg-black/15 py-0.5 px-1.5 rounded-md">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </button>
      </div>
    </div>
  );
};

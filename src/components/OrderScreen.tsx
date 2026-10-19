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
} from 'lucide-react';
import { TOP_11_DATA } from '../data/top11';
import { QrisPaymentCard } from './QrisPaymentCard';
import {
  PricingConfig,
  getStoredPricing,
  DEFAULT_PRICING,
} from '../utils/pricingStorage';

interface OrderScreenProps {
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
  pricing?: PricingConfig;
  customQris?: string | null;
  selectedPerfumeFromCollection?: { name: string; category?: string } | null;
}

// TIER DEFINITIONS
export type PerfumeTier = 'non_premium' | 'premium' | 'mykonos';

export const BOTTLE_SIZES = [10, 15, 20, 30, 50, 100] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

const OFFICIAL_WHATSAPP_RAW = '6289636824552';
const DISPLAY_WHATSAPP = '0896-3682-4552';

export const OrderScreen: React.FC<OrderScreenProps> = ({
  onBackToHome,
  onShowToast,
  pricing,
  customQris,
  selectedPerfumeFromCollection,
}) => {
  // Order Selection State
  const [tier, setTier] = useState<PerfumeTier>('non_premium');
  const [selectedSize, setSelectedSize] = useState<BottleSize>(30);
  const [selectedVariant, setSelectedVariant] = useState(TOP_11_DATA[0].name);
  const [customVariantName, setCustomVariantName] = useState('');

  // Sync when a perfume is chosen directly from Collection screen
  useEffect(() => {
    if (selectedPerfumeFromCollection) {
      const perfName = selectedPerfumeFromCollection.name;
      // Check if variant is in TOP_11_DATA
      const isTop11 = TOP_11_DATA.some((item) => item.name.toLowerCase() === perfName.toLowerCase());
      if (isTop11) {
        setSelectedVariant(perfName);
        setCustomVariantName('');
      } else {
        setCustomVariantName(perfName);
      }

      // If category is mykonos, automatically set tier to mykonos
      if (selectedPerfumeFromCollection.category === 'mykonos' || perfName.toLowerCase().includes('mykonos')) {
        setTier('mykonos');
      }
    }
  }, [selectedPerfumeFromCollection]);
  const [quantity, setQuantity] = useState(1);

  // Price List Visibility Toggle (Inline so it never turns black or gets blocked by transforms)
  const [showPriceList, setShowPriceList] = useState(false);

  // Show QRIS directly
  const [showQris, setShowQris] = useState(false);

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
  const totalAmount = unitPrice * quantity;

  const currentVariantDisplay =
    customVariantName.trim() ? customVariantName.trim() : selectedVariant;

  const handleCheckoutWhatsApp = () => {
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

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP_RAW}?text=${encoded}`;
    window.open(waUrl, '_blank');
    onShowToast(`Membuka WhatsApp SINKI (${DISPLAY_WHATSAPP})...`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] text-slate-100 overflow-hidden">
      {/* Pendar Cahaya Emas Halus & Tipis */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 shrink-0 bg-[#12141a]/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-[#DFB76C]" />
            <h2 className="font-display text-sm font-extrabold text-white tracking-wider uppercase">
              Pemesanan SINKI
            </h2>
          </div>
        </div>

        {/* View / Hide Full Price List Button */}
        <button
          onClick={() => setShowPriceList((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-[11px] font-bold transition-all active:scale-95 shadow-sm"
        >
          <Tag size={12} className="text-[#DFB76C]" />
          <span>Daftar Harga</span>
          {showPriceList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-36 space-y-3.5">
        {/* PROMINENT BADGE: GRATIS ONGKIR SE-JABODETABEK MIN ORDER 150 RIBU */}
        <div className="p-3 rounded-2xl bg-[#141626] border border-white/10 hover:border-emerald-500/40 flex items-center justify-between shadow-md transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#A07C3A] text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Truck size={17} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Promo Spesial
                </span>
                <span className="text-[9.5px] font-mono text-zinc-300 font-medium bg-white/10 px-1.5 py-0.2 rounded border border-white/15">
                  Min. Rp {minFreeShipping.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-xs font-display font-black text-white block drop-shadow-sm">
                Gratis Ongkir Se-Jabodetabek
              </span>
            </div>
          </div>
          {totalAmount >= minFreeShipping ? (
            <span className="text-[9.5px] font-mono text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black">
              ✓ Tercapai
            </span>
          ) : (
            <span className="text-[9.5px] font-mono text-zinc-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full font-medium">
              Min. {(minFreeShipping / 1000).toFixed(0)}rb
            </span>
          )}
        </div>

        {/* INLINE EXPANDABLE DAFTAR HARGA TABLE */}
        {showPriceList && (
          <div className="p-4 rounded-3xl bg-[#141626] border border-white/15 space-y-3 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-display font-extrabold text-xs text-[#DFB76C] uppercase tracking-wider">
                  Daftar Harga Lengkap SINKI
                </h3>
                <p className="text-[9.5px] text-slate-300 font-medium">
                  Pilih ukuran & kategori sesuai selera Anda
                </p>
              </div>
              <button
                onClick={() => setShowPriceList(false)}
                className="text-[10px] text-slate-200 hover:text-white bg-white/10 px-2 py-1 rounded-lg border border-white/10"
              >
                Tutup
              </button>
            </div>

            {/* Price Table 1: Classic EDP */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  Classic EDP
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">
                  ⏱️ Awet 6–8 Jam
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1 rounded bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block">{s}ml</span>
                    <span className="font-mono font-bold text-zinc-200">
                      Rp {((currentNonPremium[s] || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Table 2: Premium */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-[#C5A059]/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#DFB76C] flex items-center gap-1">
                  <Crown size={12} /> Premium
                </span>
                <span className="text-[9px] font-mono font-medium text-zinc-200 bg-white/10 px-1.5 py-0.5 rounded">
                  ⏱️ Awet 8–12 Jam • Rp {currentPremiumRate.toLocaleString('id-ID')} / ml
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1 rounded bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block">{s}ml</span>
                    <span className="font-mono font-bold text-[#DFB76C]">
                      Rp {((s * currentPremiumRate) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Table 3: Mykonos */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-rose-500/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                  <Flame size={12} /> Mykonos Series
                </span>
                <span className="text-[9px] font-mono font-medium text-rose-200 bg-rose-500/15 px-1.5 py-0.5 rounded">
                  ⏱️ Awet Seharian • Rp {currentMykonosRate.toLocaleString('id-ID')} / ml
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {BOTTLE_SIZES.map((s) => (
                  <div key={s} className="p-1 rounded bg-white/[0.04] text-center border border-white/10">
                    <span className="text-slate-400 block">{s}ml</span>
                    <span className="font-mono font-bold text-rose-300">
                      Rp {((s * currentMykonosRate) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: PILIH KATEGORI PARFUM */}
        <div className="p-4 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#DFB76C] flex items-center gap-1.5">
              <Layers size={13} /> 1. Kategori Parfum & Ketahanan
            </span>
            <span className="text-[9.5px] text-zinc-300 font-medium flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" /> Bibit Import Eropa
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Classic EDP (dulu Non Premium) */}
            <button
              onClick={() => setTier('non_premium')}
              className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'non_premium'
                  ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                  <Clock size={9} /> 6–8 Jam
                </span>
              </div>
              <span className="font-display font-black text-xs text-white block leading-tight">
                Classic EDP
              </span>
              <span className="text-[9px] text-zinc-300 block font-medium mt-0.5">
                Daily Fresh
              </span>
              <span className="text-[10px] font-mono text-zinc-100 font-bold block mt-1.5">
                Mulai 17rb
              </span>
            </button>

            {/* Premium */}
            <button
              onClick={() => setTier('premium')}
              className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'premium'
                  ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold font-mono text-[#DFB76C] bg-white/10 px-1.5 py-0.5 rounded-full border border-white/15 flex items-center gap-0.5">
                  <Clock size={9} /> 8–12 Jam
                </span>
              </div>
              <span className="font-display font-black text-xs text-white block leading-tight">
                Premium
              </span>
              <span className="text-[9px] text-zinc-300 block font-medium mt-0.5">
                Konsentrasi Tinggi
              </span>
              <span className="text-[10px] font-mono text-[#DFB76C] font-bold block mt-1.5">
                Rp {currentPremiumRate.toLocaleString('id-ID')} / ml
              </span>
            </button>

            {/* Mykonos */}
            <button
              onClick={() => setTier('mykonos')}
              className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                tier === 'mykonos'
                  ? 'bg-rose-500/15 border-rose-400/80 shadow-[0_2px_12px_rgba(244,63,94,0.15)]'
                  : 'bg-white/5 border-white/12 hover:border-white/25'
              }`}
            >
              {/* Longevity Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8.5px] font-bold font-mono text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-0.5">
                  <Clock size={9} /> Seharian
                </span>
              </div>
              <span className="font-display font-black text-xs text-white block leading-tight">
                Mykonos
              </span>
              <span className="text-[9px] text-rose-200/90 block font-medium mt-0.5">
                Aroma Viral Mewah
              </span>
              <span className="text-[10px] font-mono text-rose-300 font-bold block mt-1.5">
                Rp {currentMykonosRate.toLocaleString('id-ID')} / ml
              </span>
            </button>
          </div>

          {/* Edukasi Keunggulan & Ketahanan (Membangun Kepercayaan Pembeli) */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-2.5 shadow-inner">
            <div className="w-7 h-7 rounded-lg bg-white/10 text-[#DFB76C] flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={15} />
            </div>
            <div className="text-[11px] space-y-0.5 flex-1">
              {tier === 'non_premium' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Pilihan Terpilih: Classic EDP</span>
                    <span className="text-[9.5px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      Awet 6–8 Jam
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pt-0.5">
                    Racikan harian beraroma segar dan bersih. Sangat pas untuk kuliah, nongkrong, dan rutinitas santai harian tanpa khawatir kantong bolong.
                  </p>
                </>
              )}
              {tier === 'premium' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Pilihan Terpilih: Premium Extrait</span>
                    <span className="text-[9.5px] font-mono font-bold text-[#DFB76C] bg-white/10 px-1.5 py-0.2 rounded border border-white/15">
                      Awet 8–12 Jam
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pt-0.5">
                    Konsentrasi bibit murni ekstrak grade A eropa. Jejak aroma kuat dan mewah, tahan banting untuk kerja di ruangan AC maupun aktivitas padat seharian.
                  </p>
                </>
              )}
              {tier === 'mykonos' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Pilihan Terpilih: Mykonos Series</span>
                    <span className="text-[9.5px] font-mono font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                      Awet Seharian Penuh
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pt-0.5">
                    Aroma viral berkelas mewah dengan formula pekat ekstra awet. Semerbak menempel kuat di serat pakaian dari pagi hingga malam hari.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* STEP 2: PILIH UKURAN BOTOL */}
          <div className="pt-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#DFB76C] block mb-2">
              2. Pilih Ukuran Botol
            </span>

            <div className="grid grid-cols-3 gap-2">
              {BOTTLE_SIZES.map((size) => {
                const isSelected = selectedSize === size;
                const price = getPriceForSize(size);

                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`p-2 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#C5A059]/15 border-[#DFB76C]/80 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                        : 'bg-white/5 border-white/12 hover:border-white/25'
                    }`}
                  >
                    <span className="font-display text-sm font-black text-white block">
                      {size} ml
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#DFB76C] block mt-0.5">
                      Rp {price.toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: PILIH VARIAN AROMA & JUMLAH */}
          <div className="pt-2 space-y-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#DFB76C] block">
              3. Varian Aroma
            </span>

            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => {
                  setSelectedVariant(e.target.value);
                  setCustomVariantName('');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#141626] border border-white/15 text-white font-semibold text-xs focus:outline-none focus:border-[#DFB76C] appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {TOP_11_DATA.map((item) => (
                  <option key={item.id} value={item.name} className="bg-[#141626] text-white">
                    #{item.rank}: {item.name} ({item.type})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <input
              type="text"
              placeholder="Atau ketik nama parfum pilihan Anda..."
              value={customVariantName}
              onChange={(e) => setCustomVariantName(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#141626] border border-white/15 text-white font-medium text-xs focus:outline-none focus:border-[#DFB76C] placeholder:text-slate-400 shadow-inner"
            />

            {/* Quantity */}
            <div className="pt-2 flex items-center justify-between border-t border-white/12">
              <span className="text-xs text-white font-bold">Jumlah Botol:</span>
              <div className="flex items-center gap-3 bg-[#121422] p-1 rounded-xl border border-white/15">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-white min-w-5 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4: PEMBAYARAN QRIS RESMI (SEMBUNYIKAN BY DEFAULT, BUKA KETIKA MAU BAYAR) */}
        <div className="p-4 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#DFB76C] flex items-center gap-1.5">
              <QrCode size={13} /> 4. Pembayaran QRIS SINKI
            </span>
            <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              BCA • Mandiri • E-Wallet
            </span>
          </div>

          {!showQris ? (
            /* Tampilan Ringkas Saat QRIS Disembunyikan */
            <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#DFB76C] mx-auto shadow-inner">
                <QrCode size={24} />
              </div>

              <div>
                <span className="font-display font-extrabold text-xs text-white block">
                  Mau Bayar Langsung Pakai QRIS?
                </span>
                <span className="text-[10px] text-slate-300 block mt-0.5 leading-snug">
                  Mendukung semua Bank (BCA, Mandiri, BRI, BNI) & E-Wallet (GoPay, OVO, Dana, ShopeePay)
                </span>
              </div>

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowQris(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition-all"
                >
                  <Eye size={15} />
                  <span>Tampilkan Kode QRIS (Rp {totalAmount.toLocaleString('id-ID')})</span>
                </button>
              </div>

              <p className="text-[9.5px] text-slate-400 font-mono">
                Atau Anda juga bisa langsung chat WhatsApp di bawah tanpa buka QRIS sekarang.
              </p>
            </div>
          ) : (
            /* Tampilan QRIS Terbuka */
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] font-bold text-zinc-200 flex items-center gap-1.5">
                  <QrCode size={13} className="text-[#DFB76C]" /> Silakan Scan Barcode di Bawah:
                </span>
                <button
                  type="button"
                  onClick={() => setShowQris(false)}
                  className="text-[10px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 font-bold flex items-center gap-1 transition-colors"
                >
                  <EyeOff size={11} />
                  <span>Sembunyikan QRIS</span>
                </button>
              </div>

              <QrisPaymentCard
                amount={totalAmount}
                onShowToast={onShowToast}
                customQrisProp={customQris}
              />
            </div>
          )}
        </div>

        {/* STEP 5: TOTAL RINCIAN & TOMBOL WHATSAPP RESMI */}
        <div className="p-4 rounded-3xl bg-[#141724]/95 border border-white/12 space-y-3 shadow-lg backdrop-blur-md">
          {/* Summary */}
          <div className="space-y-1.5 text-xs text-white">
            <div className="flex justify-between font-semibold">
              <span>
                Subtotal ({quantity}x {selectedSize}ml):
              </span>
              <span className="font-mono font-black text-white">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between text-zinc-300 font-medium">
              <span>Pengiriman:</span>
              <span className="font-bold text-[10.5px] uppercase">
                {totalAmount >= minFreeShipping ? (
                  <span className="text-emerald-400 font-black">Gratis Ongkir (Order ≥ Rp {minFreeShipping.toLocaleString('id-ID')})</span>
                ) : (
                  <span className="text-zinc-300">
                    Gratis Ongkir (Min. Rp {minFreeShipping.toLocaleString('id-ID')})
                  </span>
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-white/12 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] text-zinc-300 font-medium block">Total Akhir:</span>
                <span className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F0DFB6] via-[#DFB76C] to-[#C5A059] drop-shadow-sm">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <span className="text-[9.5px] font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/40 font-bold">
                Pesan Cepat WA
              </span>
            </div>
          </div>

            {/* Guarantee Trust Badges */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span className="leading-tight font-medium">Garansi Pecah Diganti 100%</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/30 border border-white/10">
                <Crown size={14} className="text-[#DFB76C] shrink-0" />
                <span className="leading-tight font-medium">Bibit Murni Import Eropa Grade A</span>
              </div>
            </div>
          </div>
        </div>

      {/* KONSEP 2: COMPACT SLENDER FLOATING ACTION PILL (Kapsul Melayang Ringkas & Tidak Terlalu Panjang) */}
      <div className="absolute bottom-[82px] inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <button
          onClick={handleCheckoutWhatsApp}
          className="pointer-events-auto inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[#20c359] via-[#25D366] to-[#1ebe5d] hover:brightness-105 active:scale-95 text-slate-950 font-black text-[10.5px] transition-all shadow-[0_6px_20px_rgba(37,211,102,0.38),0_2px_8px_rgba(0,0,0,0.6)] border border-white/30 select-none cursor-pointer"
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
          <span className="font-extrabold uppercase tracking-wider text-[10.5px] leading-none whitespace-nowrap">
            Pesan via WhatsApp
          </span>

          {/* Pemisah Dot */}
          <span className="text-slate-950/40 text-[9px] font-bold">•</span>

          {/* Nominal Harga Ringkas */}
          <span className="font-mono text-[10.5px] font-black text-slate-950 whitespace-nowrap bg-black/15 py-0.5 px-1.5 rounded-md">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </button>
      </div>
    </div>
  );
};

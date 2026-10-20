import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, RotateCcw, Loader2, CloudUpload, Crown, Tag, Truck, BarChart3 } from 'lucide-react';
import { AnalyticsView } from './AnalyticsView';
import {
  saveAssetToServer,
  resetStoredAssets,
  saveTop11PhotoToServer,
  saveQrisToServer,
  getStoredQris,
} from '../utils/assetStorage';
import { TOP_11_DATA } from '../data/top11';
import { ImageAdjusterModal } from './ImageAdjusterModal';
import {
  PricingConfig,
  getStoredPricing,
  savePricingToServer,
  resetPricingToServer,
  DEFAULT_PRICING,
} from '../utils/pricingStorage';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string | null;
  currentChibi: string | null;
  currentQris?: string | null;
  top11Photos: Record<string, string>;
  pricing?: PricingConfig;
  onAssetsUpdated: (newLogo: string | null, newChibi: string | null) => void;
  onTop11PhotoUpdated: (variantId: string, newPhoto: string | null) => void;
  onQrisUpdated?: (newQris: string | null) => void;
  onPricingUpdated?: (newPricing: PricingConfig) => void;
  onShowToast: (msg: string) => void;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  currentChibi,
  currentQris,
  top11Photos,
  pricing,
  onAssetsUpdated,
  onTop11PhotoUpdated,
  onQrisUpdated,
  onPricingUpdated,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'top11' | 'pricing' | 'analytics'>('home');
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo);
  const [chibiPreview, setChibiPreview] = useState<string | null>(currentChibi);
  const [qrisPreview, setQrisPreview] = useState<string | null>(currentQris || getStoredQris());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState<PricingConfig>(() => pricing || getStoredPricing());

  useEffect(() => {
    if (pricing) {
      setPricingForm(pricing);
    }
  }, [pricing]);

  // States untuk Fitur Zoom & Geser Foto
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [adjusterImageSrc, setAdjusterImageSrc] = useState<string | null>(null);
  const [adjusterType, setAdjusterType] = useState<'logo' | 'chibi' | 'qris' | 'bottle'>('chibi');
  const [adjusterTitle, setAdjusterTitle] = useState('Atur Posisi & Zoom Foto');
  const [adjusterAspect, setAdjusterAspect] = useState<'square' | 'portrait'>('square');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const chibiInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const bottleInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleHomeFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'chibi' | 'qris'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      setAdjusterImageSrc(rawDataUrl);
      setAdjusterType(type);
      setAdjusterAspect('square');
      setAdjusterTitle(
        type === 'logo'
          ? 'Atur Posisi Logo SINKI'
          : type === 'chibi'
          ? 'Atur Posisi & Zoom Karakter Chibi'
          : 'Atur Posisi & Zoom Barcode QRIS'
      );
      setIsAdjusterOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleBottleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedVariantId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const currentItem = TOP_11_DATA.find((p) => p.id === selectedVariantId);
    const variantName = currentItem ? currentItem.name : 'Botol Parfum';

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      setAdjusterImageSrc(rawDataUrl);
      setAdjusterType('bottle');
      setAdjusterAspect('portrait');
      setAdjusterTitle(`Atur Posisi Botol: ${variantName}`);
      setIsAdjusterOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAdjusterConfirm = async (croppedBase64: string) => {
    setIsAdjusterOpen(false);

    try {
      setIsProcessing(true);

      if (adjusterType === 'logo') {
        onShowToast('Menyimpan logo resmi ke server...');
        await saveAssetToServer('logo', croppedBase64, '1995');
        setLogoPreview(croppedBase64);
        onAssetsUpdated(croppedBase64, chibiPreview);
        onShowToast('Lambang Logo berhasil disimpan permanen! ✅');
      } else if (adjusterType === 'chibi') {
        onShowToast('Menyimpan foto Chibi ke server...');
        await saveAssetToServer('chibi', croppedBase64, '1995');
        setChibiPreview(croppedBase64);
        onAssetsUpdated(logoPreview, croppedBase64);
        onShowToast('Foto Chibi berhasil disimpan permanen! ✅');
      } else if (adjusterType === 'qris') {
        onShowToast('Menyimpan foto barcode QRIS ke server...');
        await saveQrisToServer(croppedBase64, '1995');
        setQrisPreview(croppedBase64);
        if (onQrisUpdated) {
          onQrisUpdated(croppedBase64);
        }
        onShowToast('Foto QRIS berhasil disimpan permanen! ✅');
      } else if (adjusterType === 'bottle' && selectedVariantId) {
        onShowToast('Menyimpan foto botol ke server...');
        await saveTop11PhotoToServer(selectedVariantId, croppedBase64, '1995');
        onTop11PhotoUpdated(selectedVariantId, croppedBase64);
        onShowToast('Foto botol berhasil diperbarui permanen! ✅');
        setSelectedVariantId(null);
      }
    } catch (err) {
      console.error('Error saving asset:', err);
      onShowToast('Gagal menyimpan foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
      setAdjusterImageSrc(null);
    }
  };

  const handleResetHome = async () => {
    await resetStoredAssets('1995');
    setLogoPreview(null);
    setChibiPreview(null);
    onAssetsUpdated(null, null);
    onShowToast('Aset beranda telah dikembalikan ke bawaan');
  };

  const handleSavePricing = async () => {
    try {
      setIsProcessing(true);
      onShowToast('Menyimpan daftar harga ke server...');
      await savePricingToServer(pricingForm, '1995');
      if (onPricingUpdated) {
        onPricingUpdated(pricingForm);
      }
      onShowToast('Daftar harga berhasil disimpan permanen! ✅');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menyimpan harga.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPricing = async () => {
    try {
      setIsProcessing(true);
      const res = await resetPricingToServer('1995');
      setPricingForm(res);
      if (onPricingUpdated) {
        onPricingUpdated(res);
      }
      onShowToast('Harga telah dikembalikan ke bawaan pabrik.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl bg-gradient-to-b from-[#1e2235] via-[#181a2b] to-[#131524] border border-amber-500/45 p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <CloudUpload size={16} />
              <h3 className="text-sm font-extrabold tracking-wide uppercase">
                Panel Pemilik SINKI
              </h3>
            </div>
            <p className="text-[10px] text-slate-200 font-medium mt-0.5">
              Kelola foto beranda, botol, harga & grafik pengunjung real-time
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection: Home vs Top 11 Bottles vs Atur Harga vs Statistik */}
        <div className="flex items-center bg-[#121422] p-1 rounded-xl border border-amber-500/30 my-3 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[10.5px] font-bold transition-all whitespace-nowrap text-center ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => setActiveTab('top11')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'top11'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Crown size={11} />
            <span>Top 11</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tag size={11} />
            <span>Harga</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 size={11} />
            <span>Statistik</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={bottleInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleBottleFileChange}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
          {activeTab === 'home' ? (
            /* TAB 1: HOME PHOTOS (Logo & Chibi) */
            <>
              {/* Slot 1: Logo Sinki Asli (Sinki3.png) */}
              <div className="p-3 rounded-2xl bg-[#0e1015] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    1. Lambang Logo Asli (Sinki3.png)
                  </span>
                  {logoPreview && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Check size={12} /> Tersimpan
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Tampil sebagai lambang kecil di pojok kiri atas
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-black border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo Sinki Asli"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-amber-500/50" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleHomeFileChange(e, 'logo')}
                  />

                  <button
                    disabled={isProcessing}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{logoPreview ? 'Ganti File Logo' : 'Pilih File Logo'}</span>
                  </button>
                </div>
              </div>

              {/* Slot 2: Foto Chibi Asli (Sinki2.png) */}
              <div className="p-3 rounded-2xl bg-[#0e1015] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    2. Foto Chibi Asli (Sinki2.png)
                  </span>
                  {chibiPreview && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Check size={12} /> Tersimpan
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Tampil di tengah-tengah beranda utama
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-black border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {chibiPreview ? (
                      <img
                        src={chibiPreview}
                        alt="Chibi Asli"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-amber-500/50" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={chibiInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleHomeFileChange(e, 'chibi')}
                  />

                  <button
                    disabled={isProcessing}
                    onClick={() => chibiInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{chibiPreview ? 'Ganti File Chibi' : 'Pilih File Chibi'}</span>
                  </button>
                </div>
              </div>

              {/* Slot 3: Foto Barcode QRIS Resmi Toko */}
              <div className="p-3 rounded-2xl bg-[#0e1015] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    3. Foto Barcode QRIS Resmi Toko
                  </span>
                  {qrisPreview && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Check size={12} /> Tersimpan
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Tampil utuh di halaman Order & Pembayaran untuk pembeli
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                    {qrisPreview ? (
                      <img
                        src={qrisPreview}
                        alt="Barcode QRIS"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-slate-400" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={qrisInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleHomeFileChange(e, 'qris')}
                  />

                  <button
                    disabled={isProcessing}
                    onClick={() => qrisInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{qrisPreview ? 'Ganti Foto QRIS' : 'Pilih Foto QRIS'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: TOP 11 BOTTLES LIST */
            <div className="space-y-2">
              <p className="text-[10px] text-amber-200/80">
                Pilih varian untuk mengganti foto botolnya secara permanen:
              </p>

              {TOP_11_DATA.map((item) => {
                const hasCustomPhoto = Boolean(top11Photos[item.id]);

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#0c0e14] border border-white/5 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 font-mono text-[10px] font-bold text-amber-300 flex items-center justify-center shrink-0">
                        #{item.rank}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {hasCustomPhoto ? '✅ Botol kustom terpasang' : '⚪ Menggunakan botol 3D bawaan'}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={() => {
                        setSelectedVariantId(item.id);
                        bottleInputRef.current?.click();
                      }}
                      className="shrink-0 py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-all disabled:opacity-50"
                    >
                      {hasCustomPhoto ? 'Ganti Foto' : 'Pasang Foto'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PENGATURAN HARGA & PROMO ONGKIR */}
          {activeTab === 'pricing' && (
            <div className="space-y-3 text-left animate-in fade-in duration-200">
              {/* Info Banner */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[9.5px] text-amber-200/90 leading-relaxed">
                Ubah harga di bawah ini lalu klik tombol Simpan. Seluruh halaman pesanan & kalkulator otomatis memakai harga baru ini!
              </div>

              {/* 1. Harga Non-Premium */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#DFB76C] flex items-center gap-1.5">
                    <Tag size={13} /> Non-Premium (Paket Hemat)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">6 Ukuran</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[10, 15, 20, 30, 50, 100].map((size) => (
                    <div key={size} className="space-y-0.5">
                      <label className="text-[9.5px] text-slate-300 block">{size} ml:</label>
                      <div className="flex items-center rounded-lg bg-black/60 border border-white/15 px-2 py-1 focus-within:border-amber-400">
                        <span className="text-[9.5px] text-slate-500 font-mono mr-1">Rp</span>
                        <input
                          type="number"
                          step="1000"
                          value={pricingForm.nonPremium[size] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setPricingForm((prev) => ({
                              ...prev,
                              nonPremium: { ...prev.nonPremium, [size]: val },
                            }));
                          }}
                          className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Tarif Per ml */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Crown size={13} /> Tarif Kategori Per Mililiter (ml)
                </span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-white block">Premium Rate</span>
                      <span className="text-[8.5px] text-slate-400 block">(Bawaan: Rp 4.000 / ml)</span>
                    </div>
                    <div className="w-28 flex items-center rounded-lg bg-black/60 border border-white/15 px-2 py-1 focus-within:border-amber-400">
                      <span className="text-[9.5px] text-slate-500 font-mono mr-1">Rp</span>
                      <input
                        type="number"
                        step="500"
                        value={pricingForm.premiumRatePerMl}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setPricingForm((prev) => ({ ...prev, premiumRatePerMl: val }));
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-white block">Mykonos Rate</span>
                      <span className="text-[8.5px] text-slate-400 block">(Bawaan: Rp 3.000 / ml)</span>
                    </div>
                    <div className="w-28 flex items-center rounded-lg bg-black/60 border border-white/15 px-2 py-1 focus-within:border-amber-400">
                      <span className="text-[9.5px] text-slate-500 font-mono mr-1">Rp</span>
                      <input
                        type="number"
                        step="500"
                        value={pricingForm.mykonosRatePerMl}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setPricingForm((prev) => ({ ...prev, mykonosRatePerMl: val }));
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Promo Ongkir Minimal Belanja */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Truck size={13} /> Minimal Belanja Gratis Ongkir
                </span>
                <div className="flex items-center rounded-lg bg-black/60 border border-white/15 px-2.5 py-1.5 focus-within:border-amber-400">
                  <span className="text-xs text-slate-500 font-mono mr-1.5">Rp</span>
                  <input
                    type="number"
                    step="10000"
                    value={pricingForm.minFreeShipping}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setPricingForm((prev) => ({ ...prev, minFreeShipping: val }));
                    }}
                    className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons for Pricing Tab */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleResetPricing}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSavePricing}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Perubahan Harga'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView onShowToast={onShowToast} isCompact={true} />
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-3 border-t border-white/10 shrink-0 flex items-center gap-2">
          {activeTab === 'home' && (logoPreview || chibiPreview) && (
            <button
              onClick={handleResetHome}
              className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-md"
          >
            Selesai & Kunci
          </button>
        </div>
      </div>

      {/* Modal Zoom & Geser Foto Interaktif */}
      <ImageAdjusterModal
        isOpen={isAdjusterOpen}
        imageSrc={adjusterImageSrc}
        aspectRatio={adjusterAspect}
        title={adjusterTitle}
        onClose={() => {
          setIsAdjusterOpen(false);
          setAdjusterImageSrc(null);
        }}
        onConfirm={handleAdjusterConfirm}
      />
    </div>
  );
};

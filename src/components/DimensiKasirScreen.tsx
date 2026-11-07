import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Download,
  Trash2,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { PerfumeItem, getStoredPerfumes, fetchPerfumesFromServer } from '../utils/perfumeStorage';
import {
  SaleRecord,
  getStoredSales,
  fetchSalesFromServer,
  recordSaleToServer,
  deleteSaleFromServer,
  exportSalesToCsv,
  resolvePerfumePriceGroup,
  getCostPrice,
  getDefaultSellingPrice,
} from '../utils/salesStorage';
import {
  getOwnerToken,
  setOwnerToken,
  verifyOwnerPinOnServer,
} from '../utils/assetStorage';

interface DimensiKasirScreenProps {
  onBackToAdmin?: () => void;
  onBackToPublic: () => void;
  onShowToast: (msg: string) => void;
}

const COMMON_SIZES = [10, 15, 20, 30, 50, 100] as const;

export const DimensiKasirScreen: React.FC<DimensiKasirScreenProps> = ({
  onBackToAdmin,
  onBackToPublic,
  onShowToast,
}) => {
  // Authentication Barrier state
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getOwnerToken()));
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Catalog Perfumes
  const [perfumes, setPerfumes] = useState<PerfumeItem[]>(() => getStoredPerfumes());

  // Sales Records
  const [sales, setSales] = useState<SaleRecord[]>(() => getStoredSales());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const [customSellingPrice, setCustomSellingPrice] = useState<number | null>(null);
  const [customCostPrice, setCustomCostPrice] = useState<number | null>(null);

  // Monthly Filter: format "YYYY-MM"
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Load latest catalog and sales on mount
  useEffect(() => {
    fetchPerfumesFromServer().then((list) => {
      if (Array.isArray(list) && list.length > 0) setPerfumes(list);
    });
    fetchSalesFromServer().then((data) => {
      if (Array.isArray(data)) setSales(data);
    });

    const handleSalesUpdate = (e: any) => {
      if (Array.isArray(e?.detail)) setSales(e.detail);
    };
    window.addEventListener('sinki_sales_updated', handleSalesUpdate);
    return () => window.removeEventListener('sinki_sales_updated', handleSalesUpdate);
  }, []);

  // Selected perfume object
  const selectedPerfume = useMemo(() => {
    return perfumes.find((p) => p.id === selectedPerfumeId) || perfumes[0] || null;
  }, [perfumes, selectedPerfumeId]);

  // Set initial selected perfume once loaded
  useEffect(() => {
    if (!selectedPerfumeId && perfumes.length > 0) {
      setSelectedPerfumeId(perfumes[0].id);
    }
  }, [perfumes, selectedPerfumeId]);

  // Pricing calculations
  const priceGroup = useMemo(() => resolvePerfumePriceGroup(selectedPerfume), [selectedPerfume]);

  const defaultCostUnit = useMemo(() => {
    return getCostPrice(priceGroup, selectedVolume);
  }, [priceGroup, selectedVolume]);

  const defaultSellingUnit = useMemo(() => {
    return getDefaultSellingPrice(priceGroup, selectedVolume);
  }, [priceGroup, selectedVolume]);

  // Final prices (allowing override)
  const activeSellingUnit = customSellingPrice !== null ? customSellingPrice : defaultSellingUnit;
  const activeCostUnit = customCostPrice !== null ? customCostPrice : defaultCostUnit;

  const totalSelling = activeSellingUnit * quantity;
  const totalCost = activeCostUnit * quantity;
  const netProfit = totalSelling - totalCost;

  // Filtered perfumes for search dropdown
  const filteredPerfumes = useMemo(() => {
    if (!searchFilter.trim()) return perfumes;
    const q = searchFilter.toLowerCase();
    return perfumes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
    );
  }, [perfumes, searchFilter]);

  // Available months list from sales records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthKey);
    sales.forEach((s) => {
      if (s.date && s.date.length >= 7) {
        monthSet.add(s.date.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [sales, currentMonthKey]);

  // Filtered sales by selected month
  const monthFilteredSales = useMemo(() => {
    if (selectedMonth === 'all') return sales;
    return sales.filter((s) => s.date && s.date.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    let totalOmzet = 0;
    let totalHpp = 0;
    let totalLaba = 0;
    let totalBotol = 0;
    let totalMl = 0;
    const variantCounter: Record<string, number> = {};

    monthFilteredSales.forEach((s) => {
      totalOmzet += s.totalSellingPrice || 0;
      totalHpp += s.totalCostPrice || 0;
      totalLaba += s.netProfit || 0;
      totalBotol += s.quantity || 1;
      totalMl += (s.volumeMl || 0) * (s.quantity || 1);
      variantCounter[s.perfumeName] = (variantCounter[s.perfumeName] || 0) + (s.quantity || 1);
    });

    const topVariants = Object.entries(variantCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalOmzet,
      totalHpp,
      totalLaba,
      totalBotol,
      totalMl,
      topVariants,
      count: monthFilteredSales.length,
    };
  }, [monthFilteredSales]);

  // Handle PIN Unlock
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pinVal = enteredPin.trim();
    if (!pinVal) return;

    try {
      const res = await verifyOwnerPinOnServer(pinVal);
      if (res.success && res.token) {
        setOwnerToken(res.token);
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Akses Dimensi Kasir Terbuka ✨');
        return;
      }
      if (pinVal === '1995') {
        setOwnerToken('token-owner-1995');
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Akses Dimensi Kasir Terbuka ✨');
        return;
      }
      setPinError(res.error || 'PIN Rahasia salah!');
      setEnteredPin('');
    } catch {
      if (pinVal === '1995') {
        setOwnerToken('token-owner-1995');
        setIsAuthenticated(true);
        setPinError('');
        onShowToast('Akses Dimensi Kasir Terbuka ✨');
        return;
      }
      setPinError('Gagal memverifikasi PIN. Periksa koneksi server!');
      setEnteredPin('');
    }
  };

  // Submit Sale (Sekali Push)
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerfume) {
      onShowToast('Pilih varian parfum terlebih dahulu!');
      return;
    }

    try {
      setIsSubmitting(true);
      const categoryLabel =
        priceGroup === 'new_trending'
          ? 'New & Trending'
          : priceGroup === 'viral_hits'
          ? 'Viral Hits'
          : 'Koleksi Reguler';

      const res = await recordSaleToServer({
        perfumeId: selectedPerfume.id,
        perfumeName: selectedPerfume.name,
        categoryGroup: priceGroup,
        categoryLabel,
        volumeMl: selectedVolume,
        quantity,
        unitPrice: activeSellingUnit,
        unitCost: activeCostUnit,
        totalSellingPrice: totalSelling,
        totalCostPrice: totalCost,
        netProfit,
        channel: 'whatsapp',
      });

      if (res.success) {
        setSales(res.sales);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 2000);
        onShowToast(`✅ Penjualan ${selectedPerfume.name} (${selectedVolume}ml) tercatat! Laba: +Rp ${netProfit.toLocaleString('id-ID')}`);
        // Reset quantity & price overrides for next order
        setQuantity(1);
        setCustomSellingPrice(null);
        setCustomCostPrice(null);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Gagal mencatat transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction
  const handleDeleteSale = async (saleId: string) => {
    const res = await deleteSaleFromServer(saleId);
    setSales(res.sales);
    setDeleteConfirmId(null);
    onShowToast('Transaksi berhasil dihapus.');
  };

  // Helper format bulan
  const formatMonthLabel = (mKey: string) => {
    if (mKey === 'all') return 'Semua Periode';
    const [y, m] = mKey.split('-');
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const name = monthNames[parseInt(m, 10) - 1] || m;
    return `${name} ${y}`;
  };

  // ==========================================
  // 1. PIN ACCESS GATE
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070b09] font-body flex flex-col items-center justify-center p-4 text-slate-100 select-none overflow-hidden">
        {/* Subtle Luxury Green/Gold Atmosphere */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm rounded-[10px] sinki-arch-modal backdrop-blur-xl border border-emerald-500/30 p-6 text-center space-y-5 shadow-2xl">
          <div className="mx-auto w-13 h-13 rounded-[8px] sinki-arch-subbox border border-emerald-500/40 p-3 flex items-center justify-center shadow-lg">
            <Lock className="w-6 h-6 text-emerald-400 drop-shadow-md" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-emerald-400/90 block">
              SINKI Parfums · Atelier Privé
            </span>
            <h2 className="font-heading text-lg font-bold text-white tracking-[-0.015em] mt-1">
              Dimensi Kasir
            </h2>
            <p className="font-body text-xs text-slate-300 mt-1">
              Catatan Penjualan & Laporan Laba Bersih
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              placeholder="PIN Pemilik (1995)"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value;
                setEnteredPin(val);
                setPinError('');
                if (val.trim() === '1995') {
                  setOwnerToken('token-owner-1995');
                  setIsAuthenticated(true);
                  onShowToast('Akses Dimensi Kasir Terbuka ✨');
                }
              }}
              className="w-full py-2.5 px-4 text-center font-mono text-base tracking-[0.25em] rounded-[6px] sinki-arch-input border border-emerald-500/40 focus:border-emerald-400 text-white placeholder:text-slate-500 placeholder:tracking-normal focus:outline-none"
              autoFocus
            />

            <button
              type="button"
              onClick={() => {
                setOwnerToken('token-owner-1995');
                setIsAuthenticated(true);
                onShowToast('Akses Dimensi Kasir Terbuka ✨');
              }}
              className="w-full py-2 px-3 rounded-[6px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles size={14} className="text-emerald-400" />
              <span>Masuk Cepat dengan PIN 1995</span>
            </button>

            {pinError && (
              <p className="text-rose-400 text-xs font-medium animate-shake">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-[6px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-bold text-xs shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              Buka Dimensi Kasir
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToPublic}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Kembali ke Website SINKI
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN DIMENSI KASIR INTERFACE (CLEAN & MOBILE-FIRST)
  // ==========================================
  return (
    <div className="relative w-full min-h-screen bg-[#080d0a] text-slate-100 font-body select-none pb-20">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-60 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#080d0a]/90 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToAdmin || onBackToPublic}
              className="p-1.5 rounded-[6px] sinki-arch-subbox border border-emerald-500/30 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Kembali"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="font-heading font-bold text-sm sm:text-base tracking-[-0.01em] text-white flex items-center gap-1.5">
                Dimensi Kasir
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-[4px]">
                  SINKI
                </span>
              </span>
              <span className="text-[10.5px] text-slate-400 block leading-tight">
                Pencatat Pesanan WhatsApp & Laba Bersih
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportSalesToCsv(sales, selectedMonth === 'all' ? undefined : selectedMonth)}
              className="py-1 px-2.5 rounded-[6px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Unduh file Excel / CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Unduh Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="p-1.5 rounded-[6px] sinki-arch-subbox border border-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Lihat Website Publik"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* ====================================================
            SECTION 1: QUICK INPUT (SEKALI PUSH PESANAN WHATSAPP)
            ==================================================== */}
        <section className="rounded-[10px] sinki-arch-card border border-emerald-500/35 p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-[5px] bg-emerald-500/20 text-emerald-300">
                <Plus size={14} />
              </span>
              <h2 className="font-heading text-sm sm:text-[15px] font-bold text-white tracking-[-0.01em]">
                Catat Pesanan Masuk (Sekali Push)
              </h2>
            </div>
            <span className="text-[10.5px] text-slate-400 font-medium">
              WA / Chat Order
            </span>
          </div>

          <form onSubmit={handleRecordSale} className="space-y-3.5">
            {/* 1. Pilih Varian Parfum (Pencarian & Dropdown Cepat) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  1. Pilih Varian Parfum:
                </label>
                {selectedPerfume && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${
                    priceGroup === 'new_trending'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : priceGroup === 'viral_hits'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {priceGroup === 'new_trending'
                      ? '★ New Trending'
                      : priceGroup === 'viral_hits'
                      ? '⚡ Viral Hits'
                      : '✦ 4 Kategori Reguler'}
                  </span>
                )}
              </div>

              {/* Input Filter & Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik cari nama varian..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full py-1.5 pl-8 pr-3 text-xs rounded-[6px] sinki-arch-input border border-emerald-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <select
                  value={selectedPerfumeId}
                  onChange={(e) => {
                    setSelectedPerfumeId(e.target.value);
                    setCustomSellingPrice(null);
                    setCustomCostPrice(null);
                  }}
                  className="w-full py-1.5 px-3 text-xs rounded-[6px] sinki-arch-input border border-emerald-500/30 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {filteredPerfumes.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0b140f] text-slate-100">
                      {p.name} ({p.collectionCategories?.includes('new_trending') ? 'Trending' : p.collectionCategories?.includes('viral_hits') ? 'Viral' : 'Reguler'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Pilih Ukuran Botol (Pill Tombol Cepat) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 block">
                2. Pilih Ukuran Botol (ml):
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {COMMON_SIZES.map((size) => {
                  const isSel = selectedVolume === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedVolume(size);
                        setCustomSellingPrice(null);
                        setCustomCostPrice(null);
                      }}
                      className={`py-2 px-1 text-center rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-[1.02]'
                          : 'sinki-arch-subbox border border-slate-700/60 text-slate-300 hover:text-white hover:border-emerald-500/40'
                      }`}
                    >
                      {size}ml
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Panel Kalkulasi Otomatis (Modal, Harga Jual & Laba Bersih) */}
            <div className="p-3 rounded-[8px] bg-black/40 border border-emerald-500/30 grid grid-cols-3 gap-2 text-center">
              {/* Modal (HPP) */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Modal (HPP)
                </span>
                <input
                  type="number"
                  value={activeCostUnit}
                  onChange={(e) => setCustomCostPrice(Number(e.target.value) || 0)}
                  className="w-full text-center font-heading text-xs sm:text-sm font-bold text-slate-200 bg-transparent border-b border-slate-600 focus:border-emerald-400 focus:outline-none py-0.5 tabular-nums"
                  title="Klik untuk ubah modal jika ada variasi khusus"
                />
                <span className="text-[9.5px] text-slate-500 block">Otomatis / botol</span>
              </div>

              {/* Harga Jual */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Harga Jual
                </span>
                <input
                  type="number"
                  value={activeSellingUnit}
                  onChange={(e) => setCustomSellingPrice(Number(e.target.value) || 0)}
                  className="w-full text-center font-heading text-xs sm:text-sm font-bold text-amber-200 bg-transparent border-b border-slate-600 focus:border-amber-400 focus:outline-none py-0.5 tabular-nums"
                  title="Klik untuk ubah harga jual (misal jika diberi diskon)"
                />
                <span className="text-[9.5px] text-amber-300/60 block">Otomatis web</span>
              </div>

              {/* Laba Bersih Satuan */}
              <div className="space-y-0.5 bg-emerald-500/10 rounded-[6px] py-1 px-1">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">
                  Laba Bersih
                </span>
                <span className="font-heading text-xs sm:text-sm font-extrabold text-emerald-400 block tabular-nums">
                  +Rp {(activeSellingUnit - activeCostUnit).toLocaleString('id-ID')}
                </span>
                <span className="text-[9.5px] text-emerald-400/70 block font-semibold">
                  {activeSellingUnit > 0
                    ? `${Math.round(((activeSellingUnit - activeCostUnit) / activeSellingUnit) * 100)}% margin`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* 4. Jumlah Botol */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-slate-300 font-semibold">
                Jumlah Botol Terjual:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-[6px] sinki-arch-subbox border border-slate-700 font-bold text-slate-300 hover:text-white cursor-pointer active:scale-95 flex items-center justify-center text-sm"
                >
                  -
                </button>
                <span className="w-10 text-center font-heading font-extrabold text-sm text-white tabular-nums">
                  {quantity}x
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-[6px] sinki-arch-subbox border border-slate-700 font-bold text-slate-300 hover:text-white cursor-pointer active:scale-95 flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tombol Push Simpan */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-[8px] font-heading text-sm font-bold tracking-[0.01em] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.99] ${
                submitSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 hover:brightness-105'
              }`}
            >
              {submitSuccess ? (
                <>
                  <CheckCircle2 size={17} />
                  <span>Tercatat Sukses di Cloud! ✅</span>
                </>
              ) : isSubmitting ? (
                <span>Menyimpan ke Cloud...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>
                    Catat Penjualan (Total Rp {totalSelling.toLocaleString('id-ID')} · Untung +Rp {netProfit.toLocaleString('id-ID')})
                  </span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* ====================================================
            SECTION 2: REKAP BULANAN & METRIK LABA BERSIH
            ==================================================== */}
        <section className="space-y-3">
          {/* Bar Pilihan Periode Bulan & Tombol Export */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-emerald-400" />
              <span className="font-heading text-sm font-bold text-white">
                Rekap Periode:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="py-1 px-2.5 rounded-[6px] sinki-arch-subbox border border-emerald-500/40 text-emerald-300 font-semibold text-xs focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-[#0b140f] text-slate-100">
                    {formatMonthLabel(m)}
                  </option>
                ))}
                <option value="all" className="bg-[#0b140f] text-slate-100">
                  Semua Periode
                </option>
              </select>
            </div>

            <span className="text-[11px] text-slate-400 tabular-nums">
              Total {monthlyStats.count} Transaksi
            </span>
          </div>

          {/* 3 Kartu Metrik Laba Bersih */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Total Omzet Kotor */}
            <div className="p-3.5 rounded-[8px] sinki-arch-card border border-slate-700/60 space-y-1">
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider block">
                Total Omzet Penjualan
              </span>
              <div className="font-heading text-lg sm:text-xl font-bold text-white tabular-nums">
                Rp {monthlyStats.totalOmzet.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-400 block tabular-nums">
                {monthlyStats.totalBotol} botol terjual ({monthlyStats.totalMl} ml)
              </span>
            </div>

            {/* Total Modal (HPP) */}
            <div className="p-3.5 rounded-[8px] sinki-arch-card border border-slate-700/60 space-y-1">
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider block">
                Total Modal Terpakai
              </span>
              <div className="font-heading text-lg sm:text-xl font-bold text-slate-300 tabular-nums">
                Rp {monthlyStats.totalHpp.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Biaya pokok bibit + botol
              </span>
            </div>

            {/* Total Laba Bersih (Untung Bersih) */}
            <div className="p-3.5 rounded-[8px] bg-emerald-950/40 border border-emerald-500/50 space-y-1 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] uppercase font-bold text-emerald-400 tracking-wider">
                  Laba Bersih Riil
                </span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="font-heading text-lg sm:text-xl font-extrabold text-emerald-300 tabular-nums">
                Rp {monthlyStats.totalLaba.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-emerald-400/80 block font-semibold">
                {monthlyStats.totalOmzet > 0
                  ? `Margin keuntungan: ${Math.round((monthlyStats.totalLaba / monthlyStats.totalOmzet) * 100)}%`
                  : '0% margin'}
              </span>
            </div>
          </div>

          {/* Varian Paling Laris Bulan Ini */}
          {monthlyStats.topVariants.length > 0 && (
            <div className="p-3 rounded-[8px] sinki-arch-subbox border border-emerald-500/25 flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-400" />
                Varian Terlaris Bulan Ini:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {monthlyStats.topVariants.map(([name, count], i) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[11px]"
                  >
                    #{i + 1} {name} <strong className="text-white">({count}x)</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ====================================================
            SECTION 3: TABEL DAFTAR PENJUALAN (TANPA POPUP GAJE)
            ==================================================== */}
        <section className="rounded-[10px] sinki-arch-card border border-emerald-500/25 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-white tracking-[-0.01em]">
              Riwayat Transaksi ({formatMonthLabel(selectedMonth)})
            </h3>
            <button
              type="button"
              onClick={() => exportSalesToCsv(sales, selectedMonth === 'all' ? undefined : selectedMonth)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} />
              <span>Unduh CSV</span>
            </button>
          </div>

          {monthFilteredSales.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Package size={28} className="mx-auto text-slate-500 opacity-60" />
              <p className="text-xs text-slate-400 font-normal">
                Belum ada transaksi di periode {formatMonthLabel(selectedMonth)}.
              </p>
              <p className="text-[11px] text-slate-500">
                Gunakan form di atas untuk mencatat pesanan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {monthFilteredSales.map((item) => {
                const dateObj = new Date(item.date);
                const dateStr = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                });
                const timeStr = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isConfirmingDelete = deleteConfirmId === item.id;

                return (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-white/[0.015]"
                  >
                    {/* Info Transaksi */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-white text-[13px] truncate">
                          {item.perfumeName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {item.volumeMl}ml {item.quantity > 1 ? `(${item.quantity}x)` : ''}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {dateStr} • {timeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Jual: Rp {item.totalSellingPrice.toLocaleString('id-ID')}</span>
                        <span>•</span>
                        <span>Modal: Rp {item.totalCostPrice.toLocaleString('id-ID')}</span>
                        {item.customerName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 italic">an. {item.customerName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Laba & Aksi Hapus Inline (No Popup) */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          Untung
                        </span>
                        <span className="font-heading font-extrabold text-emerald-400 text-xs sm:text-[13px] tabular-nums block">
                          +Rp {item.netProfit.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Tombol Hapus Inline Sederhana Tanpa Popup Mengganggu */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-[6px] border border-rose-500/40">
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(item.id)}
                            className="px-2 py-0.5 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 text-slate-300 text-[10px] hover:text-white cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-[4px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus transaksi ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

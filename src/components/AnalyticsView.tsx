import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  RotateCcw,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  AnalyticsData,
  getLocalAnalytics,
  fetchAnalyticsFromServer,
  resetAnalyticsData,
  VisitorEvent,
} from '../utils/analyticsStorage';

interface AnalyticsViewProps {
  onShowToast: (msg: string) => void;
  pin?: string;
  isCompact?: boolean; // If rendered inside a smaller modal
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onShowToast,
  pin = '1995',
  isCompact = false,
}) => {
  const [data, setData] = useState<AnalyticsData>(() => getLocalAnalytics());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'sources' | 'live'>('overview');

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const updated = await fetchAnalyticsFromServer();
      setData(updated);
      onShowToast('Data statistik berhasil diperbarui (Real-Time)! ⚡');
    } catch {
      setData(getLocalAnalytics());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch from server
    fetchAnalyticsFromServer().then((res) => {
      if (res) setData(res);
    });

    // Auto refresh every 15 seconds while viewing this tab
    const interval = setInterval(() => {
      fetchAnalyticsFromServer().then((res) => {
        if (res) setData(res);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    setShowResetConfirm(false);
    try {
      const zeroData = await resetAnalyticsData(pin);
      setData(zeroData);
      onShowToast('Statistik berhasil di-reset kembali murni ke 0! 🎯');
    } catch (e) {
      console.error(e);
      onShowToast('Gagal mereset statistik.');
    }
  };

  // Hitung persentase sumber
  const totalSourcesCount = Object.values(data.sources).reduce((a, b) => a + b, 0);

  const getSourcePercent = (count: number) => {
    if (totalSourcesCount === 0) return 0;
    return Math.round((count / totalSourcesCount) * 100);
  };

  // Data sumber dengan warna & branding visual
  const sourceConfigs = [
    {
      name: 'Instagram',
      count: data.sources.instagram,
      percent: getSourcePercent(data.sources.instagram),
      color: 'from-pink-500 via-rose-500 to-purple-600',
      bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      barColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
      badge: 'Bio / Story / DM',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
    },
    {
      name: 'TikTok',
      count: data.sources.tiktok,
      percent: getSourcePercent(data.sources.tiktok),
      color: 'from-cyan-400 via-sky-500 to-teal-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      barColor: 'bg-gradient-to-r from-cyan-400 to-teal-500',
      badge: 'Link Bio TikTok',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
    },
    {
      name: 'WhatsApp',
      count: data.sources.whatsapp,
      percent: getSourcePercent(data.sources.whatsapp),
      color: 'from-emerald-400 to-green-600',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      barColor: 'bg-gradient-to-r from-emerald-400 to-green-600',
      badge: 'Chat / Broadcast WA',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
    },
    {
      name: 'Facebook',
      count: data.sources.facebook,
      percent: getSourcePercent(data.sources.facebook),
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      barColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      badge: 'Postingan / Grup FB',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png',
    },
    {
      name: 'Google Search',
      count: data.sources.google,
      percent: getSourcePercent(data.sources.google),
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
      badge: 'Pencarian Organik',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
    },
    {
      name: 'Direct (Langsung)',
      count: data.sources.direct,
      percent: getSourcePercent(data.sources.direct),
      color: 'from-yellow-400 to-amber-600',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
      barColor: 'bg-gradient-to-r from-yellow-400 to-amber-600',
      badge: 'Ketik URL / Kontak',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2099/2099192.png',
    },
    {
      name: 'Shopee & Tokopedia',
      count: (data.sources.shopee || 0) + (data.sources.tokopedia || 0),
      percent: getSourcePercent((data.sources.shopee || 0) + (data.sources.tokopedia || 0)),
      color: 'from-orange-500 to-emerald-500',
      bgColor: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
      barColor: 'bg-gradient-to-r from-orange-500 to-emerald-500',
      badge: 'Marketplace',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png',
    },
    {
      name: 'Sumber Lainnya',
      count: data.sources.other,
      percent: getSourcePercent(data.sources.other),
      color: 'from-slate-400 to-slate-600',
      bgColor: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
      barColor: 'bg-gradient-to-r from-slate-400 to-slate-600',
      badge: 'Web Lain / Twitter',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
    },
  ].sort((a, b) => b.count - a.count);

  // Sumber terbanyak
  const topSource = sourceConfigs[0]?.count > 0 ? sourceConfigs[0] : null;

  // Tanggal mulai format
  const startedDateFormatted = data.startedAt
    ? new Date(data.startedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Hari ini';

  // Format waktu relatif (contoh: 2 menit lalu)
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return 'Baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam lalu`;
      return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return 'Baru saja';
    }
  };

  // Hitung kunjungan hari ini
  const todayKey = new Date().toISOString().split('T')[0];
  const todayVisits = data.dailyTrends[todayKey] || 0;

  // Total perangkat
  const totalDevices = (data.devices.mobile || 0) + (data.devices.desktop || 0) + (data.devices.tablet || 0) || 1;
  const mobilePercent = Math.round(((data.devices.mobile || 0) / totalDevices) * 100);
  const desktopPercent = Math.round(((data.devices.desktop || 0) / totalDevices) * 100);

  return (
    <div className={`space-y-4 text-slate-100 ${isCompact ? 'p-1' : 'p-2 sm:p-4'}`}>
      {/* Top Banner Status Real-Time */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#171926] via-[#1b1e30] to-[#141624] border border-amber-500/35 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                Tracking Pengunjung Real-Time
              </h4>
              <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
              <Clock size={11} className="text-amber-400 shrink-0" />
              <span>Mulai merekam sejak: <strong className="text-slate-200">{startedDateFormatted}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95"
            title="Perbarui angka terbaru detik ini"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
            <span>Perbarui</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all active:scale-95"
            title="Kosongkan hitungan kembali ke nol (0)"
          >
            <RotateCcw size={12} />
            <span>Reset ke 0</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal Reset Data ke 0 */}
      {showResetConfirm && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-rose-200">
                Konfirmasi Kosongkan Grafik (Mulai dari Nol)?
              </h5>
              <p className="text-[11px] text-rose-300/80 mt-1">
                Semua angka kunjungan, grafik sumber media sosial, dan riwayat pengunjung akan dikosongkan menjadi <strong>0</strong>. Penghitungan baru akan dimulai detik ini juga.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="py-1 px-3 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-300"
            >
              Batal
            </button>
            <button
              onClick={handleReset}
              className="py-1 px-3.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
            >
              Ya, Kosongkan Jadi 0
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards (Ringkasan Kunci) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Total Kunjungan */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#11131f] border border-amber-500/25 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              Total Tayangan
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Eye size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {data.totalVisits.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block">
              Kali web dibuka pengunjung
            </span>
          </div>
        </div>

        {/* Card 2: Pengunjung Unik */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#11131f] border border-amber-500/25 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              Pengunjung Unik
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Users size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono tracking-tight">
              {data.uniqueVisitors.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block">
              Individu / Perangkat asli
            </span>
          </div>
        </div>

        {/* Card 3: Sumber Terbanyak */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#11131f] border border-amber-500/25 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              Asal Terbanyak
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
              <TrendingUp size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-extrabold text-amber-200 truncate">
              {topSource ? topSource.name : 'Belum Ada'}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block">
              {topSource ? `${topSource.count} pengunjung (${topSource.percent}%)` : 'Menunggu kunjungan pertama'}
            </span>
          </div>
        </div>

        {/* Card 4: Hari Ini */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#11131f] border border-amber-500/25 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              Trafik Hari Ini
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Sparkles size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-300 font-mono tracking-tight">
              {todayVisits.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block">
              Kunjungan masuk hari ini
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-[#0d0f17] p-1 rounded-xl border border-white/10 gap-1">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeView === 'overview'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Grafik Sumber Masuk
        </button>
        <button
          onClick={() => setActiveView('live')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeView === 'live'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Feed Pengunjung</span>
          {data.recentVisitors.length > 0 && (
            <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-mono">
              {data.recentVisitors.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: GRAFIK SUMBER PENGUNJUNG ("KEBANYAKAN MASUK DARI MANA") */}
      {activeView === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Main Visual Source Breakdown */}
          <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h5 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  <Compass size={15} className="text-amber-400" />
                  <span>Pengunjung SINKI Kebanyakan Masuk dari Mana?</span>
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Distribusi asal klik: Instagram, TikTok, WhatsApp, Google, Facebook, atau Ketik Langsung
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold hidden sm:block">
                Total: {totalSourcesCount} Klik Masuk
              </span>
            </div>

            {/* Jika masih benar-benar nol (0) */}
            {data.totalVisits === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-black/30 border border-white/5 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles size={22} />
                </div>
                <h6 className="text-xs font-bold text-slate-200">
                  Grafik Bersih & Siap Merekam dari Angka 0
                </h6>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Belum ada kunjungan yang tercatat sejak di-reset. Begitu pembeli membuka link Sinki dari Instagram, TikTok, WhatsApp, atau Google, grafik warna-warni di bawah akan otomatis terisi secara real-time!
                </p>
              </div>
            ) : null}

            {/* List Grafik Batang Tiap Sumber */}
            <div className="space-y-3 pt-1">
              {sourceConfigs.map((src) => {
                return (
                  <div key={src.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{src.name}</span>
                        <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-medium border ${src.bgColor}`}>
                          {src.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-extrabold">{src.count} orang</span>
                        <span className="text-slate-400 text-[10.5px]">({src.percent}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/5 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${src.barColor}`}
                        style={{
                          width: `${Math.max(src.percent > 0 ? src.percent : src.count > 0 ? 3 : 0, 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Perangkat & Halaman Populer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Box Perangkat */}
            <div className="p-3.5 rounded-2xl bg-[#11131f] border border-white/10 space-y-3">
              <h6 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Smartphone size={14} className="text-amber-400" />
                <span>Perangkat Pengunjung (HP vs Komputer)</span>
              </h6>
              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Smartphone size={12} className="text-sky-400" /> Ponsel (Smartphone HP)
                    </span>
                    <span className="font-mono font-bold text-sky-300">
                      {data.devices.mobile || 0} ({mobilePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${mobilePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Monitor size={12} className="text-amber-400" /> Laptop / Komputer
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {data.devices.desktop || 0} ({desktopPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${desktopPercent}%` }}
                    />
                  </div>
                </div>

                {/* Sistem Operasi Badges */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    Android: {data.os.android || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/20 font-mono">
                    iPhone (iOS): {data.os.ios || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                    Windows: {data.os.windows || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    Mac: {data.os.mac || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Box Halaman Populer */}
            <div className="p-3.5 rounded-2xl bg-[#11131f] border border-white/10 space-y-3">
              <h6 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <ArrowUpRight size={14} className="text-amber-400" />
                <span>Halaman Paling Banyak Dibuka</span>
              </h6>
              <div className="space-y-2 pt-1">
                {Object.entries(data.pages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([pName, pCount]) => {
                    const maxPage = Math.max(...Object.values(data.pages), 1);
                    const pct = Math.round((pCount / maxPage) * 100);
                    return (
                      <div key={pName} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 font-medium">{pName}</span>
                          <span className="font-mono font-bold text-amber-300">{pCount} views</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-amber-500/80 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FEED PENGUNJUNG TERBARU (LIVE STREAM LOG) */}
      {activeView === 'live' && (
        <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h5 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span>Aktivitas Pengunjung Terbaru (Live Feed)</span>
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Mencatat tiap pengguna yang masuk secara berurutan waktu
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {data.recentVisitors.length} Log Terakhir
            </span>
          </div>

          {data.recentVisitors.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-black/20 border border-white/5 space-y-1">
              <p className="text-xs font-semibold text-slate-300">Belum ada riwayat aktivitas pengunjung.</p>
              <p className="text-[10px] text-slate-400">
                Akan otomatis bertambah ketika ada orang yang membuka link SINKI.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
              {data.recentVisitors.map((v) => {
                return (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl bg-[#0c0e16] border border-white/5 hover:border-amber-500/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                        {v.source === 'Instagram' ? (
                          <span className="text-xs font-bold text-pink-400">IG</span>
                        ) : v.source === 'TikTok' ? (
                          <span className="text-xs font-bold text-cyan-400">TT</span>
                        ) : v.source === 'WhatsApp' ? (
                          <span className="text-xs font-bold text-emerald-400">WA</span>
                        ) : (
                          <Compass size={14} className="text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white truncate">{v.source}</span>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 font-medium">
                            {v.page}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 block truncate mt-0.5">
                          {v.sourceDetail} • {v.os} ({v.device})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-amber-400 font-bold block">
                        {formatTimeAgo(v.timestamp)}
                      </span>
                      <span className="text-[8.5px] text-slate-400 font-mono">
                        {new Date(v.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info Tips Promosi */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[11px] text-amber-200/90">
        <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-bold">Tips Promosi Sinki:</strong>
          <p className="text-[10.5px] text-slate-300 mt-0.5">
            Saat menaruh link di bio Instagram atau TikTok, Anda bisa gunakan link dengan tag seperti <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">sinkiparfum.my.id?utm_source=instagram</code> agar 100% tercatat akurat sebagai pengunjung Instagram meskipun pengguna membuka dari aplikasi pihak ketiga.
          </p>
        </div>
      </div>
    </div>
  );
};

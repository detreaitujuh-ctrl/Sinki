import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, Zap, Gem } from 'lucide-react';
import { PerfumeBottleIcon } from './PerfumeBottleIcon';
import { openWhatsAppDirect, SINKI_OFFICIAL_WA } from '../utils/whatsappHelper';

interface DesktopDeviceFrameProps {
  children: React.ReactNode;
  activeVariantsCount?: number;
  whatsappUrl?: string;
  themeId?: string;
}

export const DesktopDeviceFrame: React.FC<DesktopDeviceFrameProps> = ({
  children,
  activeVariantsCount = 68,
  whatsappUrl = 'https://wa.me/6281398677610',
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR Code mengarah ke WhatsApp SINKI
  useEffect(() => {
    if (!qrCanvasRef.current) return;
    try {
      QRCode.toCanvas(qrCanvasRef.current, whatsappUrl, {
        width: 140,
        margin: 1.5,
        color: {
          dark: '#050706',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
    } catch (err) {
      console.warn('QR Code generation notice:', err);
    }
  }, [whatsappUrl]);

  const handleOpenWhatsApp = () => {
    openWhatsAppDirect(
      SINKI_OFFICIAL_WA,
      'Halo SINKI Parfums, saya tertarik memesan wewangian favorit SINKI!'
    );
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden lg:bg-[#070908] lg:flex lg:items-center lg:justify-center selection:bg-emerald-500/25">
      {/* =========================================================================
          DESKTOP-ONLY BACKGROUND: CHARCOAL BLACK & SUBTLE EMERALD MIST ATMOSPHERE
          (Hanya aktif pada layar laptop / PC monitor, hidden pada layar mobile)
          ========================================================================= */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Deep Charcoal Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080b09] via-[#050706] to-[#020302]" />

        {/* Ambient Dark Emerald Plumes & Mists */}
        <div
          className="absolute top-1/4 left-[-8%] w-[550px] h-[550px] rounded-full blur-[140px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.05) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-1/3 right-[-6%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(4, 120, 87, 0.06) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[900px] h-[280px] rounded-[100%] blur-[120px] opacity-25"
          style={{
            background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.22) 0%, transparent 70%)',
          }}
        />

        {/* Atmospheric Vignette Borders */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />

        {/* Studio Floor Pedestal / Reflection Surface */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent opacity-95" />
      </div>

      {/* =========================================================================
          MAIN DESKTOP STAGE CONTAINER: 3-COLUMN COMPOSITION
          (Kiri: Branding SINKI | Tengah: iPhone Frame | Kanan: Fitur & QR Code)
          ========================================================================= */}
      <div className="w-full h-full lg:max-w-[1440px] lg:px-8 xl:px-14 lg:flex lg:items-center lg:justify-between lg:relative lg:z-10">
        
        {/* =======================================================================
            PANEL KIRI (DESKTOP): BRANDING SINKI MENGIKUTI WARNA TEMA WEBSITE
            ======================================================================= */}
        <div className="hidden lg:flex flex-col justify-center items-start flex-1 max-w-[340px] xl:max-w-[380px] z-20 pr-4 select-none animate-fadeIn">
          {/* Logo SINKI Besar dengan Gradasi Warna Tema Website Aktif */}
          <h1
            style={{
              backgroundImage: 'var(--arch-title-gradient, linear-gradient(115deg, #FFFFFF 0%, #D9ECFC 52%, #98B8D8 100%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            className="font-heading text-5xl xl:text-6xl font-black tracking-[0.06em] leading-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
          >
            SINKI
          </h1>

          {/* Tagline SINKI dengan Aksen Warna Tema */}
          <p
            style={{ color: 'var(--arch-text-accent-bright, #A9CFF2)' }}
            className="font-heading text-lg xl:text-xl font-light tracking-[0.12em] mt-3 mb-3.5"
          >
            Define your presence
          </p>

          {/* Garis Aksen Iluminasi Hijau Emerald Lembut */}
          <div className="relative w-44 h-[2px] mb-6">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500/80 to-transparent" />
            <div className="absolute inset-0 bg-emerald-400 blur-xs opacity-75" />
          </div>

          {/* Deskripsi Brand SINKI */}
          <p className="font-body text-xs xl:text-sm text-slate-300 font-normal leading-[1.65] max-w-[320px] text-balance">
            Aroma yang menemani setiap langkah, membangun kesan yang tak terlupakan.
          </p>
        </div>

        {/* =======================================================================
            SMARTPHONE FRAME (IPHONE PRO BLACK TITANIUM)
            - Di Desktop: Tampil sebagai mockup iPhone Pro berbezel tipis di tengah
            - Di Mobile: Langsung tampil fullscreen native 100% tanpa wrapper frame
            ======================================================================= */}
        <div className="relative w-full h-full lg:w-auto lg:h-[92vh] lg:max-h-[890px] lg:min-h-[640px] lg:flex lg:flex-col lg:items-center lg:justify-center shrink-0">
          
          {/* Outer Black Titanium Chassis (Hanya aktif di desktop) */}
          <div className="w-full h-full lg:w-[390px] xl:w-[415px] lg:h-full lg:rounded-[48px] xl:rounded-[52px] lg:p-[7px] xl:p-[8px] lg:bg-[#181a1d] lg:border-[3.5px] lg:border-[#2b2f33] lg:ring-1 lg:ring-white/20 lg:shadow-[0_28px_80px_rgba(0,0,0,0.95),0_0_80px_rgba(16,185,129,0.12),0_8px_24px_rgba(0,0,0,0.85)] lg:relative lg:flex lg:flex-col lg:overflow-hidden">
            
            {/* Subtle Titanium Brushed Gloss Line (Specular Highlight Atas) */}
            <div className="hidden lg:block absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-40" />

            {/* Inner Phone Screen Display */}
            <div className="relative w-full h-full lg:rounded-[40px] xl:rounded-[44px] overflow-hidden flex flex-col bg-[#0b0c11]">
              
              {/* Dynamic Island & Status Bar (Hanya muncul di desktop di atas aplikasi) */}
              <div className="hidden lg:flex absolute top-0 inset-x-0 h-10 items-center justify-between px-7 z-50 pointer-events-none select-none">
                {/* Waktu iPhone Status Bar (9:41) */}
                <span className="font-sans font-semibold text-[11px] text-white tracking-tight">
                  9:41
                </span>

                {/* Dynamic Island Pill Khas iPhone Pro */}
                <div className="w-[108px] h-[26px] bg-black rounded-full flex items-center justify-between px-3 shadow-sm border border-white/5">
                  {/* Kamera Depan */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0a121c] ring-1 ring-white/10 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
                  </div>
                  {/* Sensor FaceID / Truedepth */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#060a10] ring-1 ring-white/5" />
                </div>

                {/* Status Bar: Sinyal, Wifi, & Baterai */}
                <div className="flex items-center gap-1.5 text-white">
                  {/* Signal bars */}
                  <svg className="w-3.5 h-2.5 fill-current" viewBox="0 0 17 11">
                    <rect x="0" y="8" width="2.5" height="3" rx="0.5" />
                    <rect x="4" y="6" width="2.5" height="5" rx="0.5" />
                    <rect x="8" y="3.5" width="2.5" height="7.5" rx="0.5" />
                    <rect x="12" y="0.5" width="2.5" height="10.5" rx="0.5" />
                  </svg>
                  {/* Wi-Fi */}
                  <svg className="w-3.5 h-2.5 fill-current" viewBox="0 0 16 12">
                    <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.9-3.2a6.9 6.9 0 019.8 0 .8.8 0 001.1-1.1 8.5 8.5 0 00-12 0 .8.8 0 001.1 1.1zm-2.1-2.1a9.9 9.9 0 0114 0 .8.8 0 001.2-1.1 11.5 11.5 0 00-16.4 0 .8.8 0 001.2 1.1z" />
                  </svg>
                  {/* Battery 100% */}
                  <div className="w-5 h-2.5 rounded-[3px] border border-white/80 p-[1px] flex items-center">
                    <div className="w-full h-full bg-white rounded-[1.5px]" />
                  </div>
                </div>
              </div>

              {/* Konten Aplikasi Web SINKI Asli (Scrollable & 100% Interaktif) */}
              <div className="w-full h-full flex flex-col overflow-hidden lg:pt-3">
                {children}
              </div>
            </div>
          </div>

          {/* Cermin Pantulan Lantai Meja Studio (Floor Reflection di bawah iPhone) */}
          <div
            className="hidden lg:block absolute -bottom-8 inset-x-4 h-9 rounded-full blur-md opacity-35 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.45) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 80%)',
            }}
          />
        </div>

        {/* =======================================================================
            PANEL KANAN (DESKTOP): FITUR DINAMIS, TOMBOL SCAN & QR WHATSAPP
            ======================================================================= */}
        <div className="hidden lg:flex flex-col justify-center items-end flex-1 max-w-[340px] xl:max-w-[380px] z-20 pl-4 select-none animate-fadeIn space-y-6">
          
          {/* 3 Lencana Keunggulan Berbentuk Lingkaran Bersinar Emerald */}
          <div className="flex flex-col items-end space-y-4">
            {/* 1. Jumlah Varian (Dihitung Dinamis Real-Time dari Katalog Parfum) */}
            <div className="flex items-center gap-3.5 group">
              <div className="text-right">
                <span className="font-heading font-bold text-sm xl:text-base text-white block leading-tight">
                  {activeVariantsCount} Pilihan
                </span>
                <span className="font-body text-xs text-slate-400 font-normal block">
                  Varian
                </span>
              </div>
              <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0d1410] border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center text-emerald-300 transition-transform group-hover:scale-105 shrink-0">
                <Gem size={22} className="stroke-[1.8]" />
              </div>
            </div>

            {/* 2. Kualitas Premium */}
            <div className="flex items-center gap-3.5 group">
              <div className="text-right">
                <span className="font-heading font-bold text-sm xl:text-base text-white block leading-tight">
                  Kualitas
                </span>
                <span className="font-body text-xs text-slate-400 font-normal block">
                  Premium
                </span>
              </div>
              <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0d1410] border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center text-emerald-300 transition-transform group-hover:scale-105 shrink-0">
                <PerfumeBottleIcon size={22} strokeWidth={1.8} />
              </div>
            </div>

            {/* 3. Harga Terjangkau (Sesuai Permintaan: Cukup Harga Terjangkau Tanpa Nominal) */}
            <div className="flex items-center gap-3.5 group">
              <div className="text-right">
                <span className="font-heading font-bold text-sm xl:text-base text-white block leading-tight">
                  Harga
                </span>
                <span className="font-body text-xs text-slate-400 font-normal block">
                  Terjangkau
                </span>
              </div>
              <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0d1410] border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center text-emerald-300 transition-transform group-hover:scale-105 shrink-0">
                <Zap size={22} className="stroke-[1.8]" />
              </div>
            </div>
          </div>

          {/* Tombol Scan Sekarang & Kartu QR Code WhatsApp */}
          <div className="flex flex-col items-end space-y-2.5 pt-1">
            {/* Tombol "Scan Sekarang →" dengan Emerald Glow Border */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="py-2.5 px-6 rounded-full bg-[#07130d] border border-emerald-400/80 hover:border-emerald-300 text-white font-heading font-semibold text-xs xl:text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer group"
              title="Hubungi WhatsApp SINKI"
            >
              <span>Scan Sekarang</span>
              <ArrowRight size={15} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Caption Teks */}
            <span className="font-body text-[11.5px] text-slate-300 font-normal pr-1">
              Dapatkan Varian Favoritmu
            </span>

            {/* Kotak QR Code WhatsApp dengan Emerald Glow Frame */}
            <div
              onClick={handleOpenWhatsApp}
              className="relative p-2.5 rounded-[18px] bg-[#0c120e] border-2 border-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all cursor-pointer group active:scale-98"
              title="Scan atau ketuk untuk chat WhatsApp SINKI"
            >
              {/* Canvas QR Code */}
              <div className="bg-white p-1 rounded-[12px] flex items-center justify-center relative overflow-hidden">
                <canvas ref={qrCanvasRef} className="w-[110px] h-[110px] xl:w-[124px] xl:h-[124px] block" />

                {/* Logo WhatsApp di Tengah QR Code Persis Referensi */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] border-2 border-white flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.203.043.072.043.419-.101.824z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

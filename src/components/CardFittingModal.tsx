import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Maximize2 } from 'lucide-react';

interface CardFittingModalProps {
  imageSrc: string;
  title: string;
  targetType: 'logo' | 'hero' | 'qris' | 'bottle';
  subtitle?: string;
  onClose: () => void;
  onConfirm: (fittedBase64: string) => void;
}

export const CardFittingModal: React.FC<CardFittingModalProps> = ({
  imageSrc,
  title,
  targetType,
  subtitle,
  onClose,
  onConfirm,
}) => {
  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Drag tracking refs
  const isDraggingRef = useRef<boolean>(false);
  const startDragPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const cardViewportRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, [imageSrc]);

  // Touch Handlers for Mobile (Sentuhan Ujung Jari di Layar HP)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPanPos.current = { x: panX, y: panY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startDragPos.current.x;
    const deltaY = e.touches[0].clientY - startDragPos.current.y;
    setPanX(startPanPos.current.x + deltaX);
    setPanY(startPanPos.current.y + deltaY);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Mouse Handlers (Desktop / Pointer)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragPos.current = { x: e.clientX, y: e.clientY };
    startPanPos.current = { x: panX, y: panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startDragPos.current.x;
    const deltaY = e.clientY - startDragPos.current.y;
    setPanX(startPanPos.current.x + deltaX);
    setPanY(startPanPos.current.y + deltaY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Preset Handlers
  const handleFitCenter = () => {
    setZoom(0.85);
    setPanX(0);
    setPanY(0);
  };

  const handleFillBox = () => {
    setZoom(1.15);
    setPanX(0);
    setPanY(0);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  // Render high-quality canvas export matching exact frame viewport
  const handleApply = () => {
    const cardEl = cardViewportRef.current;
    const imgEl = imageElementRef.current;
    if (!cardEl || !imgEl) return;

    const targetWidth = targetType === 'hero' ? 1080 : targetType === 'bottle' ? 900 : 800;
    const targetHeight = targetType === 'hero' ? 1080 : targetType === 'bottle' ? 1050 : 800;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark luxury background
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const viewportW = cardEl.clientWidth;
    const viewportH = cardEl.clientHeight;
    const ratioMultiplier = targetWidth / viewportW;

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.translate(panX * ratioMultiplier, panY * ratioMultiplier);
    ctx.scale(zoom, zoom);

    // Calculate natural image dimensions to cover
    const scaleCover = Math.max(
      targetWidth / imgEl.naturalWidth,
      targetHeight / imgEl.naturalHeight
    );
    const renderW = imgEl.naturalWidth * scaleCover;
    const renderH = imgEl.naturalHeight * scaleCover;

    ctx.drawImage(imgEl, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();

    const finalBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm(finalBase64);
  };

  // Dimension aspect ratio for card frame
  const getCardFrameStyle = () => {
    if (targetType === 'bottle') {
      return 'w-[220px] h-[255px]'; // Portrait Botol Top 11
    }
    if (targetType === 'hero') {
      return 'w-[240px] h-[240px]'; // Square Hero Box
    }
    return 'w-[230px] h-[230px]'; // Square Logo / QRIS
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div
          onClick={onClose}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-[#10121d] border border-white/15 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-3.5 text-center cursor-default max-h-[94vh] overflow-y-auto no-scrollbar"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="text-left">
                <h3 className="font-display font-bold text-xs text-white flex items-center gap-1.5">
                  <Maximize2 size={14} className="text-[#DFB76C]" />
                  <span>{title}</span>
                </h3>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  {subtitle || 'Atur perbesar/perkecil & geser agar pas di kartu'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* BINGKAI KARTU PRATINJAU PERSIS KARTU ASLI DI WEBSITE */}
            <div className="relative mx-auto flex flex-col items-center justify-center py-1">
              <div
                ref={cardViewportRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative overflow-hidden bg-[#0c0e17] rounded-2xl border-2 border-[#DFB76C]/80 shadow-[0_10px_30px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing flex items-center justify-center select-none ${getCardFrameStyle()}`}
              >
                {/* Visual Guide Grid (Garis Bantu Pas-kan Foto) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="" />
                </div>

                {/* Panduan Garis Aman Judul SINKI untuk Foto Hero Beranda */}
                {targetType === 'hero' && (
                  <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/90 via-black/70 to-transparent border-b border-[#DFB76C]/50 pointer-events-none z-20 flex flex-col items-center justify-center px-2 pt-1 shadow-md">
                    <span className="text-[10px] font-display font-black text-[#DFB76C] tracking-[0.2em] uppercase drop-shadow-sm">
                      SINKI
                    </span>
                    <span className="text-[7px] text-zinc-300 tracking-widest uppercase -mt-0.5 font-bold">
                      EAU DE PARFUM (AREA TEKS)
                    </span>
                    <span className="text-[7.5px] text-emerald-300 font-semibold mt-0.5 bg-black/70 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      ↓ Pas-kan botol di bawah garis ini ↓
                    </span>
                  </div>
                )}

                {/* Foto yang sedang diatur */}
                <img
                  ref={imageElementRef}
                  src={imageSrc}
                  alt="Pratinjau Foto"
                  draggable={false}
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out',
                  }}
                  className="max-w-none max-h-none w-full h-full object-cover pointer-events-none"
                />

                {/* Indikator Sentuh & Geser */}
                <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-center gap-1.5 bg-black/80 backdrop-blur-xs py-1 px-2 rounded-lg text-[8.5px] text-amber-300 font-mono pointer-events-none border border-amber-500/25">
                  <Move size={10} />
                  <span>Sentuh & geser foto untuk atur posisi</span>
                </div>
              </div>
            </div>

            {/* PRESET CEPAT & BILAH KONTROL PERBESAR / PERKECIL (ZOOM) */}
            <div className="p-3 rounded-2xl bg-[#090b14] border border-white/10 space-y-2.5">
              {/* Tombol Preset Cepat */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFitCenter}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 text-[9.5px] font-bold border border-white/10 transition-all active:scale-95"
                  >
                    Pas di Tengah
                  </button>
                  <button
                    type="button"
                    onClick={handleFillBox}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 text-[9.5px] font-bold border border-white/10 transition-all active:scale-95"
                  >
                    Isi Penuh Kartu
                  </button>
                </div>

                <span className="font-mono text-amber-400 font-bold text-xs">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Slider & Tombol Zoom In / Zoom Out */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut size={15} />
                </button>

                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#DFB76C] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white active:scale-90 transition-colors"
                  title="Reset ke Ukuran Awal"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Action Buttons: Batal vs Pas! Pasang ke Kartu Ini */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-md shadow-black/30"
              >
                <Check size={15} className="stroke-[3]" />
                <span>Pas! Pasang ke Kartu</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
};

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Crop } from 'lucide-react';

interface ImageAdjusterModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio?: 'square' | 'portrait';
  title?: string;
  onClose: () => void;
  onConfirm: (croppedBase64: string) => void;
}

export const ImageAdjusterModal: React.FC<ImageAdjusterModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 'square',
  title = 'Atur Posisi & Ukuran Foto',
  onClose,
  onConfirm,
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Dragging state
  const isDraggingRef = useRef(false);
  const startDragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Touch & Mouse Handlers for Dragging / Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panX,
      panY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.touches[0].clientX - startDragRef.current.x;
    const deltaY = e.touches[0].clientY - startDragRef.current.y;
    setPanX(startDragRef.current.panX + deltaX);
    setPanY(startDragRef.current.panY + deltaY);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startDragRef.current.x;
    const deltaY = e.clientY - startDragRef.current.y;
    setPanX(startDragRef.current.panX + deltaX);
    setPanY(startDragRef.current.panY + deltaY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Generate Cropped Image using Canvas
  const handleApply = () => {
    if (!imgRef.current || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const img = imgRef.current;

    const targetWidth = aspectRatio === 'portrait' ? 600 : 800;
    const targetHeight = aspectRatio === 'portrait' ? 700 : 800;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background fill (transparent for png, dark for premium contrast)
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Calculate scale ratio between viewport and canvas
    const scaleToCanvas = targetWidth / viewport.clientWidth;

    // Viewport center
    const vpCenterX = targetWidth / 2;
    const vpCenterY = targetHeight / 2;

    ctx.save();
    ctx.translate(vpCenterX + panX * scaleToCanvas, vpCenterY + panY * scaleToCanvas);
    ctx.scale(zoom, zoom);

    // Base scale agar foto proporsional & memenuhi bingkai tanpa terdistorsi
    const scaleCover = Math.max(
      targetWidth / img.naturalWidth,
      targetHeight / img.naturalHeight
    );
    const renderW = img.naturalWidth * scaleCover;
    const renderH = img.naturalHeight * scaleCover;

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();

    const resultBase64 = canvas.toDataURL('image/jpeg', 0.9);
    onConfirm(resultBase64);
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div
          onClick={onClose}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-[#12141f] border border-amber-500/40 p-4 shadow-2xl space-y-3.5 text-center cursor-default max-h-[92vh] overflow-y-auto no-scrollbar"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2 text-left">
                <Crop size={16} className="text-amber-400" />
                <div>
                  <h3 className="font-display font-bold text-xs text-white">
                    {title}
                  </h3>
                  <span className="text-[9px] text-slate-400 block">
                    Geser foto & atur zoom agar pas di layar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Viewport Frame (Bingkai Pratinjau Interaktif) */}
            <div className="relative mx-auto flex items-center justify-center">
              <div
                ref={viewportRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative overflow-hidden bg-black/60 rounded-2xl border-2 border-dashed border-amber-400/60 shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center select-none ${
                  aspectRatio === 'portrait'
                    ? 'w-[210px] h-[245px]'
                    : 'w-[240px] h-[240px]'
                }`}
              >
                {/* Guide Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-25">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div className="" />
                </div>

                {/* The Image Itself */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Pratinjau Foto"
                  draggable={false}
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out',
                  }}
                  className="max-w-none max-h-none w-full h-full object-cover pointer-events-none"
                />

                {/* Subtle Drag Hint Overlay */}
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md text-[8px] text-amber-300 font-mono pointer-events-none">
                  <Move size={9} />
                  <span>Geser untuk atur posisi</span>
                </div>
              </div>
            </div>

            {/* Preset Buttons & Zoom Controls */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[9px] font-bold border border-amber-500/40"
                  >
                    Isi Penuh Kotak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(0.85);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 hover:bg-white/10 text-[9px] border border-white/10"
                  >
                    Pas di Tengah
                  </button>
                </div>
                <span className="text-amber-400">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95"
                  title="Perkecil"
                >
                  <ZoomOut size={13} />
                </button>

                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95"
                  title="Perbesar"
                >
                  <ZoomIn size={13} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white active:scale-95 transition-colors"
                  title="Reset Posisi & Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-lg shadow-amber-500/20"
              >
                <Check size={14} />
                <span>Terapkan & Simpan</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
};

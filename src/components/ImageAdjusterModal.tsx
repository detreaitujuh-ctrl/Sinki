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
    ctx.fillStyle = '#09090c';
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
            className="relative w-full max-w-sm rounded-[10px] sinki-arch-modal border p-4 space-y-3.5 text-center cursor-default max-h-[92vh] overflow-y-auto no-scrollbar"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D4AF6A]/25 font-body">
              <div className="flex items-center gap-2 text-left">
                <Crop size={16} className="text-[#DFB76C] shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-base leading-[1.25] text-white tracking-[-0.015em]">
                    {title}
                  </h3>
                  <span className="text-xs text-slate-400 font-normal block">
                    Geser foto & atur zoom agar pas di layar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-[6px] sinki-arch-subbox border hover:border-[#E8C782]/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
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
                className={`relative overflow-hidden bg-[#0a0a0e] rounded-[8px] border-2 border-dashed border-[#DFB76C]/65 shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center select-none ${
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
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-[5px] font-body text-xs text-[#E8C782] font-medium pointer-events-none">
                  <Move size={11} />
                  <span>Geser untuk atur posisi</span>
                </div>
              </div>
            </div>

            {/* Preset Buttons & Zoom Controls */}
            <div className="p-2.5 rounded-[8px] sinki-arch-subbox border space-y-2 font-body">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="px-2.5 py-1 rounded-[6px] sinki-arch-card-selected text-[#F3E6C8] text-xs font-medium border"
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
                    className="px-2.5 py-1 rounded-[6px] sinki-arch-card text-slate-300 hover:border-[#E8C782]/60 hover:text-white text-xs font-medium border"
                  >
                    Pas di Tengah
                  </button>
                </div>
                <span className="text-[#E8C782] font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                  className="w-7 h-7 rounded-[6px] sinki-arch-card border hover:border-[#E8C782]/60 text-white flex items-center justify-center active:scale-95"
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
                  className="flex-1 accent-[#DFB76C] h-1.5 bg-[#1a1a22] rounded-[4px] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
                  className="w-7 h-7 rounded-[6px] sinki-arch-card border hover:border-[#E8C782]/60 text-white flex items-center justify-center active:scale-95"
                  title="Perbesar"
                >
                  <ZoomIn size={13} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-[6px] bg-[#16161c] hover:bg-[#1f1f27] text-slate-400 hover:text-white active:scale-95 transition-colors"
                  title="Reset Posisi & Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 font-body">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-[8px] bg-[#16161c] hover:bg-[#1f1f27] text-slate-300 font-medium text-sm transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-[#DFB76C] via-[#C5A059] to-[#A07C3A] hover:brightness-105 text-slate-950 font-semibold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-lg shadow-black/30"
              >
                <Check size={15} />
                <span>Terapkan & Simpan</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
};

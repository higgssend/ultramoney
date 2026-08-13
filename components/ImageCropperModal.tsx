import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Crop } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, 0.5), 4);
    setZoom(clampedZoom);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // High-Resolution Circular Canvas Crop
  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const targetSize = 400; // Output 400x400 PNG
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get exact rendered dimensions of image in DOM
    const renderedWidth = img.offsetWidth || img.clientWidth || 300;
    const renderedHeight = img.offsetHeight || img.clientHeight || 300;

    const cropBoxSize = 240; // 240px viewport circle cutout
    const scaleFactor = targetSize / cropBoxSize;

    ctx.save();
    // Clip circle
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Center canvas
    ctx.translate(targetSize / 2, targetSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply drag position scaled to output canvas
    const drawX = position.x * scaleFactor;
    const drawY = position.y * scaleFactor;

    // Apply zoom and draw exact scaled dimensions
    const drawW = renderedWidth * zoom * scaleFactor;
    const drawH = renderedHeight * zoom * scaleFactor;

    ctx.drawImage(
      img,
      -drawW / 2 + drawX,
      -drawH / 2 + drawY,
      drawW,
      drawH
    );

    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/png', 0.95);
    onCropComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Recortar Foto Perfil</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ajusta la posición y zoom de la foto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="relative w-full h-[360px] bg-slate-950 flex items-center justify-center select-none overflow-hidden cursor-grab active:cursor-grabbing"
        >
          {/* Image behind the mask overlay */}
          <div
            className="absolute transition-transform duration-75 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              className="max-w-[320px] max-h-[320px] object-contain pointer-events-none"
            />
          </div>

          {/* Mask Overlay ON TOP with 240px circular cutout */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-[240px] h-[240px] rounded-full border-4 border-indigo-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-white/40 border-dashed" />
            </div>
          </div>

          <p className="absolute bottom-3 text-[11px] text-slate-300 bg-black/60 px-3 py-1 rounded-full z-30 flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3.5 h-3.5 text-indigo-400" /> Arrastra para encuadrar la cara en el círculo
          </p>
        </div>

        {/* Controls Bar */}
        <div className="p-5 space-y-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => handleZoomChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <ZoomIn className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300 w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-all shadow-xs"
            >
              <RotateCw className="w-4 h-4" /> Rotar 90°
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" /> Guardar Foto
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

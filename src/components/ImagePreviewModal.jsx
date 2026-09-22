import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  X,
  FlipHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ImagePreviewModal = ({ image, onClose }) => {
  const { t } = useLanguage();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset transform
  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setFlipH(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(5, Math.round((prev + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(0.2, Math.round((prev - 0.25) * 100) / 100);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotateCW = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleRotateCCW = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setFlipH((prev) => !prev);
  }, []);

  // Double click on image toggles between 1x and 2x
  const handleImageDoubleClick = (e) => {
    e.stopPropagation();
    if (scale > 1.05) {
      resetTransform();
    } else {
      setScale(2);
    }
  };

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => {
      const next = Math.min(5, Math.max(0.2, Math.round((prev + delta) * 100) / 100));
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Drag / Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetTransform();
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) {
          handleRotateCCW();
        } else {
          handleRotateCW();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut, resetTransform, handleRotateCW, handleRotateCCW]);

  // Global mouse move & up when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Copy image to clipboard
  const handleCopy = async () => {
    try {
      const src = image.src;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (clipErr) {
            // Fallback for environments where writing blob fails
            await navigator.clipboard.writeText(src);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }
      }, 'image/png');
    } catch (err) {
      try {
        await navigator.clipboard.writeText(image.src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy image:', e);
      }
    }
  };

  // Download image
  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = image.src;
      const safeName = image.alt
        ? image.alt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
        : `image_${Date.now()}`;
      a.download = `${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const handleImageLoad = (e) => {
    setNaturalDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/85 backdrop-blur-md select-none animate-fade-in no-drag"
      style={{ WebkitAppRegion: 'no-drag' }}
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-6 py-4 z-20"
        style={{ WebkitAppRegion: 'no-drag' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Title & Info */}
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
          <span className="text-white/90 text-sm font-medium tracking-wide flex items-center gap-2">
            <Maximize2 size={16} className="text-[var(--accent)]" />
            {image.alt || t('imagePreview')}
          </span>
          {naturalDimensions && (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/10 text-white/70 border border-white/10">
              {naturalDimensions.width} × {naturalDimensions.height} px
            </span>
          )}
        </div>

        {/* Center: Interactive Glassmorphism Control Bar */}
        <div 
          className="flex items-center gap-1 bg-neutral-900/80 border border-white/15 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-xl"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.2}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('zoomOut')}
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom Level Reset Button */}
          <button
            type="button"
            onClick={resetTransform}
            className="px-2.5 py-1 text-xs font-mono font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('resetZoom')}
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('zoomIn')}
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Rotate CCW */}
          <button
            type="button"
            onClick={handleRotateCCW}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('rotateCounterClockwise')}
          >
            <RotateCcw size={16} />
          </button>

          {/* Rotate CW */}
          <button
            type="button"
            onClick={handleRotateCW}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('rotateClockwise')}
          >
            <RotateCw size={16} />
          </button>

          {/* Flip Horizontal */}
          <button
            type="button"
            onClick={handleFlipHorizontal}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              flipH ? 'bg-[var(--accent)] text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('flipHorizontal')}
          >
            <FlipHorizontal size={16} />
          </button>

          {/* Fit / Reset */}
          <button
            type="button"
            onClick={resetTransform}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('fitScreen')}
          >
            <RefreshCw size={16} />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Copy Image */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={copied ? t('imageCopied') : t('copyImage')}
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>

          {/* Download Image */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' }}
            title={t('downloadImage')}
          >
            <Download size={16} />
          </button>
        </div>

        {/* Right: Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2.5 text-white/70 hover:text-white hover:bg-white/15 active:scale-95 rounded-full transition-all cursor-pointer z-20"
          style={{ WebkitAppRegion: 'no-drag' }}
          title={t('close')}
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        className={`flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden relative ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{ WebkitAppRegion: 'no-drag' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={image.src}
          alt={image.alt || 'Preview'}
          onLoad={handleImageLoad}
          onDoubleClick={handleImageDoubleClick}
          draggable={false}
          className="max-h-[82vh] max-w-[88vw] object-contain rounded-md shadow-2xl transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${
              flipH ? -1 : 1
            })`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Bottom Footer Hint */}
      <div
        className="w-full flex items-center justify-center pb-4 text-xs text-white/40 pointer-events-none gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Esc: {t('close')}</span>
        <span>•</span>
        <span>{t('doubleClickToPreview')} / 100%</span>
        <span>•</span>
        <span>Scroll / +/- : Zoom</span>
      </div>
    </div>
  );
};

export default ImagePreviewModal;

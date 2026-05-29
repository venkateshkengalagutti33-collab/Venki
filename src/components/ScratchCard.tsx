import React, { useRef, useEffect, useState, MouseEvent, TouchEvent } from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface ScratchCardProps {
  onScratchComplete: () => void;
  width?: number;
  height?: number;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  onScratchComplete,
  width = 320,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Canvas setup
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Style the canvas display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 1. Draw a shimmery pinkish-gold metallic scratch layer
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fda4af'); // rose 300
    gradient.addColorStop(0.3, '#f43f5e'); // rose 500
    gradient.addColorStop(0.6, '#db2777'); // pink 600
    gradient.addColorStop(1, '#fbcfe8'); // pink 200

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add some noise/shimmer dots to look authentic and textured
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 500; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rSize = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add border accent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // 2. Draw romantic text on the scratch card
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Drop shadow effect for text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    ctx.fillText('🎁 SCRATCH WITH LUCK 💖', width / 2, height / 2 - 15);
    
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffe4e6';
    ctx.fillText('Rub here to open your surprise!', width / 2, height / 2 + 15);

    // Reset shadow properties for scratch action
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [width, height]);

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event or mouse event
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const draw = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use destination-out to erase the scratch card overlay
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkScratchPercentage = () => {
    if (isFinished) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    
    // Sample a grid of pixels to keep calculations light and performant
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    let transparentCount = 0;
    
    // We step through by 16 to keep performance smooth (every 4th pixel, 4 values per pixel = index step 16)
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] === 0) { // alpha channel is fully transparent
        transparentCount++;
      }
    }

    const totalSamples = pixels.length / 16;
    const percent = Math.round((transparentCount / totalSamples) * 100);
    setScratchedPercent(percent);

    if (percent > 45 && !isFinished) {
      setIsFinished(true);
      // Fade out completely
      ctx.clearRect(0, 0, w, h);
      onScratchComplete();
    }
  };

  const handleStart = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e.nativeEvent);
    if (coords) {
      draw(coords.x, coords.y);
    }
  };

  const handleMove = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isFinished) return;
    e.preventDefault();
    const coords = getCoordinates(e.nativeEvent);
    if (coords) {
      draw(coords.x, coords.y);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    checkScratchPercentage();
  };

  return (
    <div 
      className="relative select-none touch-none bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden shadow-inner"
      style={{ width: `${width + 12}px`, height: `${height + 12}px` }}
    >
      {/* Content under the scratch card */}
      <div className="absolute inset-0.5 rounded-xl bg-gradient-to-tr from-amber-50 to-pink-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="absolute -top-1 -right-1 text-pink-300/40 transform rotate-12">
          <Heart className="w-14 h-14 fill-current" />
        </div>
        <div className="p-2 bg-rose-100 rounded-full mb-1">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
        <p className="font-serif text-sm font-black text-rose-700">Surprise Unlocked! 🎉</p>
        <p className="text-[10px] text-gray-500 font-medium">Keep scratching to reveal!</p>
      </div>

      {/* Interactive Scratch Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`absolute inset-1.5 rounded-xl cursor-crosshair transition-opacity duration-500 ${
          isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* Scratch status overlay */}
      {!isFinished && scratchedPercent > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold z-10 pointer-events-none flex items-center gap-1">
          <Sparkles className="w-2 h-2 text-yellow-300 animate-pulse" />
          <span>{scratchedPercent}% SCRATCHED</span>
        </div>
      )}
    </div>
  );
};

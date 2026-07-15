"use client";

import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      className="relative w-full aspect-square overflow-hidden rounded-2xl select-none bg-slate-50 dark:bg-slate-950 border border-border shadow-inner"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img 
        src={afterImage} 
        alt="Processed" 
        className="absolute inset-0 w-full h-full object-contain p-2"
        draggable={false}
      />
      
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain p-2 filter brightness-95"
          draggable={false}
        />
      </div>

      {/* Modern Handle Line */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize hover:bg-emerald-500 transition-colors shadow-md"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Modern Handle Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-200 transform transition-transform hover:scale-110">
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-3 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Modern Badges */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-none z-10">
        <span className="bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-opacity" style={{ opacity: sliderPosition < 20 ? 0 : 1 }}>
          Original
        </span>
        <span className="bg-emerald-500/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-opacity" style={{ opacity: sliderPosition > 80 ? 0 : 1 }}>
          Processed
        </span>
      </div>
    </div>
  );
}

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
      className="relative w-full aspect-square overflow-hidden rounded-2xl select-none bg-ink/50 border border-line"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img 
        src={afterImage} 
        alt="Processed" 
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
      
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>

      <div 
        className="absolute top-0 bottom-0 w-1 bg-accent cursor-ew-resize hover:bg-accentHover transition-colors shadow-sm"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-panel border-2 border-accent rounded-full flex items-center justify-center shadow-md">
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-accent/70 rounded-full"></div>
            <div className="w-0.5 h-3 bg-accent/70 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none opacity-50 z-10">
        <span className="bg-panel/80 border border-line backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono tracking-wider text-paper font-bold">ORIGINAL</span>
        <span className="bg-panel/80 border border-line backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono tracking-wider text-paper font-bold">PROCESSED</span>
      </div>
    </div>
  );
}

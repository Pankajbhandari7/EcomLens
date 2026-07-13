"use client";

import { useCallback, useRef, useState } from "react";

interface UploaderProps {
  onFileSelected: (file: File) => void;
  previewUrl: string | null;
  disabled?: boolean;
}

export default function Uploader({ onFileSelected, previewUrl, disabled }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border transition-colors ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        isDragging
          ? "border-accent bg-accent/5"
          : "border-line bg-panel hover:border-accentDim"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Uploaded product"
          className="h-full w-full object-contain p-6"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line font-mono text-accent">
            ↑
          </div>
          <p className="font-medium text-paper">Drop a product photo here</p>
          <p className="font-mono text-xs text-paper/50">
            or click to browse · JPG / PNG, any background
          </p>
        </div>
      )}
    </div>
  );
}

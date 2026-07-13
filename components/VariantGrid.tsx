"use client";
import { useState } from "react";

import type { VariantConfig, OutputFormat } from "@/lib/variants";

export interface GeneratedVariant {
  config: VariantConfig;
  url: string;
  filename: string;
}

interface VariantGridProps {
  variants: GeneratedVariant[];
  total: number;
  format: OutputFormat;
  onDownloadAll: () => void;
  zipping: boolean;
}

export default function VariantGrid({
  variants,
  total,
  format,
  onDownloadAll,
  zipping,
}: VariantGridProps) {
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  if (total === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-center">
        <p className="font-mono text-sm text-paper/40">no variants yet</p>
        <p className="max-w-xs text-sm text-paper/30">
          Upload a photo and generate to see 30 marketplace-ready crops here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm text-paper/60">
          {variants.length}
          <span className="text-paper/30"> / {total} rendered</span>
        </p>
        <button
          onClick={onDownloadAll}
          disabled={variants.length === 0 || zipping}
          className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {zipping ? "Zipping…" : "Download all (.zip)"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {variants.map((v) => (
          <button
            key={v.config.id}
            onClick={() => setSelectedVariant(v)}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card text-left transition-all hover:border-accent"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-white">
              <img
                src={v.url}
                alt={v.config.label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-col gap-1 px-2 py-2">
              <div className="flex items-center justify-between">
                <span className="truncate font-mono text-[10px] text-paper/50">
                  {v.config.label}
                </span>
                <span className="font-mono text-[10px] uppercase text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  VIEW
                </span>
              </div>
              {v.config.shippingPrice !== undefined && (
                <div className="flex items-center justify-between border-t border-line/50 pt-1">
                  <span className="font-mono text-[11px] font-bold text-yellow-400">
                    Est. ₹{v.config.shippingPrice}
                  </span>
                  {v.config.estimatedVolumetricWeightGrams && (
                    <span className="font-mono text-[9px] text-paper/60">
                      Vol: {(v.config.estimatedVolumetricWeightGrams / 1000).toFixed(2)}kg
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedVariant && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedVariant(null)}
        >
          <div 
            className="relative flex flex-col gap-4 rounded-xl bg-panel p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedVariant(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink shadow-md hover:scale-105"
            >
              ✕
            </button>
            <div className="overflow-hidden rounded-lg bg-white">
              <img 
                src={selectedVariant.url} 
                alt={selectedVariant.config.label}
                className="max-h-[75vh] w-auto max-w-[90vw] object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-paper">
                  {selectedVariant.config.label}
                </span>
                {selectedVariant.config.shippingPrice !== undefined && (
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-yellow-400">
                      Est. ₹{selectedVariant.config.shippingPrice}
                    </span>
                    {selectedVariant.config.estimatedVolumetricWeightGrams && (
                      <span className="font-mono text-[10px] text-paper/60">
                        Vol: {(selectedVariant.config.estimatedVolumetricWeightGrams / 1000).toFixed(2)}kg
                      </span>
                    )}
                  </div>
                )}
              </div>
              <a
                href={selectedVariant.url}
                download={selectedVariant.filename}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-ink transition-opacity hover:opacity-90"
              >
                Download .{format}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

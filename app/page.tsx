"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Uploader from "@/components/Uploader";
import VariantGrid, { GeneratedVariant } from "@/components/VariantGrid";
import { removeImageBackground } from "@/lib/bgRemoval";
import {
  buildVariantConfigs,
  renderVariant,
  resolveCanvasSize,
  trimTransparentBlob,
  OutputFormat,
} from "@/lib/variants";
import { downloadAsZip } from "@/lib/zip";
import { CATEGORIES } from "@/lib/categories";
import type { PhysicalDimensions, DeliveryZone } from "@/lib/shipping";

type Status = "idle" | "removing-bg" | "rendering" | "done" | "error";

const TOTAL_VARIANTS = 25;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [status, setStatus] = useState<Status>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [zipping, setZipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lowResWarning, setLowResWarning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [categorySearch, setCategorySearch] = useState<string>("");

  const [physicalDims, setPhysicalDims] = useState<PhysicalDimensions>({
    lengthCm: 15,
    breadthCm: 15,
    heightCm: 10,
    weightGrams: 200,
    zone: "National",
  });

  const productBlobUrls = useRef<string[]>([]);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setVariants([]);
    setStatus("idle");
    setErrorMsg(null);
    setLowResWarning(false);
    const url = URL.createObjectURL(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const busy = status === "removing-bg" || status === "rendering";

  const handleGenerate = useCallback(async () => {
    if (!file) return;

    // clear previous run's object URLs
    productBlobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    productBlobUrls.current = [];
    setVariants([]);
    setErrorMsg(null);

    try {
      setStatus("removing-bg");
      setProgressLabel("Loading background-removal model…");

      const cutoutBlob = await removeImageBackground(file, (key, current, total) => {
        setProgressLabel(`${key} — ${current}/${total}`);
      });

      setProgressLabel("Trimming to product bounds…");
      const trimmed = await trimTransparentBlob(cutoutBlob);

      setLowResWarning(Math.max(trimmed.width, trimmed.height) < 700);

      const canvasSize = resolveCanvasSize(trimmed.width, trimmed.height);
      const configs = buildVariantConfigs(TOTAL_VARIANTS, selectedCategory || null, physicalDims);

      setStatus("rendering");

      const ext = format === "jpg" ? "jpg" : "png";
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-").toLowerCase();

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        setProgressLabel(`Rendering variant ${i + 1}/${configs.length}`);
        const blob = await renderVariant(trimmed, config, canvasSize, format);
        const url = URL.createObjectURL(blob);
        productBlobUrls.current.push(url);
        const filename = `${baseName}-${config.id}-${config.fillPercent}pct${
          config.shadow ? "-shadow" : ""
        }.${ext}`;

        setVariants((prev) => [...prev, { config, url, filename }]);
      }

      setStatus("done");
      setProgressLabel("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating variants."
      );
    }
  }, [file, format]);

  const handleDownloadAll = useCallback(async () => {
    if (variants.length === 0) return;
    setZipping(true);
    try {
      const entries = await Promise.all(
        variants.map(async (v) => ({
          filename: v.filename,
          blob: await fetch(v.url).then((r) => r.blob()),
        }))
      );
      await downloadAsZip(entries, "product-variants.zip");
    } finally {
      setZipping(false);
    }
  }, [variants]);

  const statusText = useMemo(() => {
    switch (status) {
      case "removing-bg":
        return progressLabel || "Removing background…";
      case "rendering":
        return progressLabel || "Rendering variants…";
      case "done":
        return "All 25 variants ready.";
      case "error":
        return errorMsg ?? "Something went wrong.";
      default:
        return "Waiting for an image.";
    }
  }, [status, progressLabel, errorMsg]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-10 flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          batch · client-side only
        </p>
        <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">
          One photo in. Twenty-five listing-ready squares out.
        </h1>
        <p className="max-w-2xl text-sm text-paper/60">
          Background removal, tight center crop, and square framing run entirely in
          your browser — nothing is uploaded to a server. Every variant stays within
          spec: 1:1, ≥1000×1000px, plain background, product-only, 70–90% frame fill.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col gap-5">
          <Uploader
            onFileSelected={handleFileSelected}
            previewUrl={previewUrl}
            disabled={busy}
          />

          <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wide text-paper/50">
                Product Category (Optional)
              </label>
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                disabled={busy}
                className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
              />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory(""); // reset subcategory on category change
                }}
                disabled={busy}
                className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
              >
                <option value="">Select a category</option>
                {CATEGORIES.filter(cat => cat.category.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCategory && (
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wide text-paper/50">
                  Subcategory
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={busy}
                  className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
                >
                  <option value="">Select a subcategory</option>
                  {CATEGORIES.find(c => c.category === selectedCategory)?.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2 border-t border-line pt-4">
              <label className="font-mono text-xs uppercase tracking-wide text-paper/50">
                Shipping Settings
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="L (cm)"
                  value={physicalDims.lengthCm}
                  onChange={(e) => setPhysicalDims({ ...physicalDims, lengthCm: Number(e.target.value) })}
                  disabled={busy}
                  className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
                  title="Length (cm)"
                />
                <input
                  type="number"
                  placeholder="B (cm)"
                  value={physicalDims.breadthCm}
                  onChange={(e) => setPhysicalDims({ ...physicalDims, breadthCm: Number(e.target.value) })}
                  disabled={busy}
                  className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
                  title="Breadth (cm)"
                />
                <input
                  type="number"
                  placeholder="H (cm)"
                  value={physicalDims.heightCm}
                  onChange={(e) => setPhysicalDims({ ...physicalDims, heightCm: Number(e.target.value) })}
                  disabled={busy}
                  className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
                  title="Height (cm)"
                />
                <input
                  type="number"
                  placeholder="Weight (g)"
                  value={physicalDims.weightGrams}
                  onChange={(e) => setPhysicalDims({ ...physicalDims, weightGrams: Number(e.target.value) })}
                  disabled={busy}
                  className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
                  title="Actual Weight (grams)"
                />
              </div>
              
              <select
                value={physicalDims.zone}
                onChange={(e) => setPhysicalDims({ ...physicalDims, zone: e.target.value as DeliveryZone })}
                disabled={busy}
                className="rounded-lg border border-line bg-[#151515] p-2 text-sm text-paper outline-none focus:border-accent"
              >
                <option value="Local">Local Delivery</option>
                <option value="Zonal">Zonal Delivery</option>
                <option value="National">National Delivery</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-2 border-t border-line pt-4">
              <span className="font-mono text-xs uppercase tracking-wide text-paper/50">
                Output format
              </span>
              <div className="flex overflow-hidden rounded-full border border-line">
                {(["jpg", "png"] as OutputFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    disabled={busy}
                    className={`px-3 py-1 font-mono text-xs uppercase transition-colors ${
                      format === f
                        ? "bg-accent text-ink"
                        : "text-paper/50 hover:text-paper"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!file || busy}
              className="w-full rounded-lg bg-accent py-2.5 font-medium text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy ? "Generating…" : "Generate 25 variants"}
            </button>

            <div className="flex items-center gap-2 font-mono text-xs text-paper/50">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "error"
                    ? "bg-red-400"
                    : busy
                    ? "animate-pulse bg-accent"
                    : "bg-paper/30"
                }`}
              />
              <span className="truncate">{statusText}</span>
            </div>

            {lowResWarning && (
              <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                Source image is small once cropped — variants will still hit 1000×1000px
                but may look softer than a higher-resolution original.
              </p>
            )}
          </div>

          <ul className="flex flex-col gap-1.5 rounded-xl border border-line bg-panel p-4 font-mono text-xs text-paper/50">
            <li>· square 1:1, ≥1000×1000px</li>
            <li>· background removed → plain white / light tone</li>
            <li>· product only — no text, props, model, watermark</li>
            <li>· centered, 70–90% frame fill, tight crop</li>
            <li>· 25 crop / tone / shadow combinations per photo</li>
          </ul>
        </section>

        <section>
          <VariantGrid
            variants={variants}
            total={TOTAL_VARIANTS}
            format={format}
            onDownloadAll={handleDownloadAll}
            zipping={zipping}
          />
        </section>
      </div>
    </main>
  );
}

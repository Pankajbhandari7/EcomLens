"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, DownloadCloud, Sun, Moon, Settings2, Sparkles, Loader2, RefreshCw, Layers, ArrowRight, Maximize, Shield, Zap, Image as ImageIcon
} from "lucide-react";

import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import VariantGallery from "@/components/ui/VariantGallery";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumSpinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";

import { removeImageBackground } from "@/lib/bgRemoval";
import {
  buildVariantConfigs,
  renderVariant,
  resolveCanvasSize,
  trimTransparentBlob,
  OutputFormat,
  VariantConfig
} from "@/lib/variants";
import { downloadAsZip } from "@/lib/zip";
import { CATEGORIES } from "@/lib/categories";
import type { PhysicalDimensions } from "@/lib/shipping";

export interface GeneratedVariant {
  config: VariantConfig;
  url: string;
  filename: string;
}

type Status = "idle" | "removing-bg" | "rendering" | "done" | "error";

const TOTAL_VARIANTS = 28;

export default function AppWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [status, setStatus] = useState<Status>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [zipping, setZipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [useBgRemoval, setUseBgRemoval] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const [physicalDims, setPhysicalDims] = useState<PhysicalDimensions>({
    lengthCm: 15,
    breadthCm: 15,
    heightCm: 10,
    weightGrams: 200,
    zone: "National",
  });

  const productBlobUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setVariants([]);
    setStatus("idle");
    setErrorMsg(null);
    setProcessedUrl(null);
    
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    setPreviewUrl(url);
    
    // Auto scroll to workspace after small delay
    setTimeout(() => {
      const workspace = document.getElementById("workspace-section");
      workspace?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        handleFileSelected(droppedFile);
      }
    }
  };

  const busy = status === "removing-bg" || status === "rendering";

  const handleGenerate = useCallback(async () => {
    if (!file) return;

    productBlobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    productBlobUrls.current = [];
    setVariants([]);
    setErrorMsg(null);

    try {
      let imageToProcess: Blob = file;
      
      if (useBgRemoval) {
        setStatus("removing-bg");
        setProgressLabel("Loading background-removal model…");

        imageToProcess = await removeImageBackground(file, (key, current, total) => {
          setProgressLabel(`${key} — ${current}/${total}`);
        });
        
        const removedBgUrl = URL.createObjectURL(imageToProcess);
        setProcessedUrl(removedBgUrl);
      } else {
        setStatus("rendering");
        setProcessedUrl(originalUrl);
      }

      setProgressLabel(useBgRemoval ? "Trimming to product bounds…" : "Processing image bounds…");
      const trimmed = await trimTransparentBlob(imageToProcess);

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
        
        const filename = `image${i + 1}.${ext}`;

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
  }, [file, format, useBgRemoval, selectedCategory, physicalDims, originalUrl]);

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

  const getStatusColor = () => {
    if (status === "error") return "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    if (status === "done") return "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
    if (busy) return "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse";
    return "bg-slate-300 dark:bg-slate-700";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] relative overflow-x-hidden selection:bg-slate-900/10 dark:selection:bg-white/10 text-foreground transition-colors duration-300">
      
      {/* Background decoration matching reference UI */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-100 dark:bg-slate-900/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              VisionFlow
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="rounded-full"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            
            {!file ? (
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold shadow-sm transition-all" onClick={() => {
                const uploadSection = document.getElementById("upload-section");
                uploadSection?.scrollIntoView({ behavior: "smooth" });
              }}>
                Start Optimizing
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleDownloadAll}
                disabled={variants.length === 0 || zipping}
                className="gap-2 font-semibold uppercase tracking-wider text-[10px]"
              >
                {zipping ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ZIPPING...</>
                ) : (
                  <><DownloadCloud className="w-3.5 h-3.5" /> DOWNLOAD .ZIP</>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Only visible when no file is uploaded) */}
      <AnimatePresence mode="wait">
        {!file && (
          <motion.main 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="container mx-auto px-4 sm:px-6 py-12 lg:py-20 max-w-7xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center space-x-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span>E-Commerce Seller Image Optimization Utility</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white"
                >
                  Reduce Shipping Costs with{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    AI-Optimized
                  </span>{" "}
                  Product Images
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
                >
                  Logistics systems determine shipping charges by scanning product bounds. VisionFlow automatically creates 20–30 visual layouts with centered positioning, safety margins, and optimized contrast to prevent excessive dimensional weight estimation.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                >
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-md" onClick={() => {
                    fileInputRef.current?.click();
                  }}>
                    Upload Product Image
                    <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => {
                    const howItWorksSection = document.getElementById("how-it-works");
                    howItWorksSection?.scrollIntoView({ behavior: "smooth" });
                  }}>
                    How It Works
                  </Button>
                </motion.div>

                {/* Quick Metrics */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 w-full max-w-lg"
                >
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">20–30</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Variants Generated</p>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">100%</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Marketplace Compliant</p>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">Seconds</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Processing Speed</p>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Upload Component */}
              <div id="upload-section" className="lg:col-span-5 relative w-full flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="w-full relative"
                >
                  <div 
                    className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 z-10 cursor-pointer overflow-hidden bg-card ${
                      isDragging 
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.02]" 
                        : "border-border hover:border-emerald-500/50 hover:bg-muted/50 shadow-sm"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm group">
                      <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">Drag & drop your product image</h3>
                    <p className="text-sm text-muted-foreground font-medium">PNG, JPG, WebP up to 10MB</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* WORKSPACE (Only visible when file is uploaded) */}
      <AnimatePresence>
        {file && (
          <motion.div 
            id="workspace-section"
            key="workspace"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-10 relative"
          >
            {/* Top processing bar replacement */}
            <div className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={originalUrl!} alt="Thumbnail" className="w-full h-full object-cover hover:opacity-80 transition-opacity" title="Click to replace" />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleFileSelected(e.target.files[0]);
                    }} 
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">{file.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} transition-colors duration-500`}></span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {status === 'idle' ? 'Ready to generate' : status === 'done' ? 'Generation Complete' : progressLabel || 'Processing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Upper Section */}
            <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Left Column: Settings Panel */}
              <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-6 relative">
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-emerald-500" />
                      <h2 className="font-bold text-lg text-foreground tracking-tight">Configuration</h2>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">Adjust generation parameters</p>
                  </div>

                  <div className="h-px bg-border w-full"></div>

                  {/* Category */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Product Category</label>
                    <Select
                      value={selectedCategory}
                      onChange={(val) => {
                        setSelectedCategory(val);
                        setSelectedSubcategory(""); 
                      }}
                      disabled={busy}
                      placeholder="Select category"
                      options={CATEGORIES.map(cat => ({ value: cat.category, label: cat.category }))}
                    />
                  </div>

                  {/* Subcategory */}
                  <AnimatePresence>
                    {selectedCategory && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-2 mt-2"
                      >
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Subcategory</label>
                        <Select
                          value={selectedSubcategory}
                          onChange={setSelectedSubcategory}
                          disabled={busy}
                          placeholder="Select subcategory"
                          options={(CATEGORIES.find(c => c.category === selectedCategory)?.subcategories || []).map(sub => ({ value: sub, label: sub }))}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Background Removal Toggle */}
                  <div className="flex flex-col gap-3 mt-2 border-t border-border pt-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          Remove background
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Isolates product automatically</span>
                      </div>

                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          useBgRemoval ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <motion.span
                          layout
                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white dark:bg-slate-900 shadow ring-0 transition duration-200 ease-in-out`}
                          animate={{ x: useBgRemoval ? 16 : 0 }}
                        />
                      </div>

                      <input
                        type="checkbox"
                        className="hidden"
                        checked={useBgRemoval}
                        onChange={(e) => setUseBgRemoval(e.target.checked)}
                        disabled={busy}
                      />
                    </label>
                  </div>

                  {/* Output Format */}
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Output Format</label>
                    <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border shadow-inner">
                      {(["jpg", "png"] as OutputFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          disabled={busy}
                          className={`flex-1 py-1.5 rounded-md text-xs transition-all font-bold uppercase tracking-wider ${
                            format === f
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Error Box */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs font-medium mt-2 flex items-start gap-2.5 overflow-hidden"
                      >
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="leading-relaxed">{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleGenerate}
                    disabled={busy}
                    variant="premium"
                    className="w-full h-10 mt-4 text-[13px] relative overflow-hidden group shadow-md"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {busy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          GENERATE VARIANTS
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </aside>

              {/* Right Column: Previews */}
              <div className="flex-1 w-full min-w-0 flex flex-col gap-8">
                {/* Preview Box */}
                <div className="w-full bg-card rounded-2xl border border-border p-4 lg:p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[430px] lg:h-[560px]">
                  <AnimatePresence mode="wait">
                    {status === "removing-bg" || (status === "rendering" && !processedUrl) ? (
                      <motion.div 
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-[460px] aspect-square rounded-2xl border border-border/50 bg-muted/30 flex flex-col items-center justify-center relative overflow-hidden"
                      >
                        <div className="mb-8 relative">
                          <PremiumSpinner size={64} />
                        </div>
                        <h3 className="text-lg text-foreground font-bold tracking-tight">{progressLabel}</h3>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Applying machine learning models...</p>
                      </motion.div>
                    ) : status === "idle" ? (
                      <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full max-w-[460px] rounded-2xl overflow-hidden shadow-sm border border-border bg-white flex items-center justify-center p-2 aspect-square"
                      >
                         <img src={originalUrl!} alt="Original" className="w-full h-full object-contain drop-shadow-md" />
                      </motion.div>
                    ) : processedUrl && originalUrl ? (
                      <motion.div 
                        key="result"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-[460px] shadow-sm rounded-2xl overflow-hidden border border-border"
                      >
                        <BeforeAfterSlider beforeImage={originalUrl} afterImage={processedUrl} />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Variants Gallery (Full Width) */}
            <AnimatePresence>
              {(variants.length > 0 || status === 'rendering') && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full pb-20 mt-4"
                >
                  <h2 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    Your Optimized Catalog Images
                  </h2>
                  {status === 'rendering' && variants.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-4">
                          <Skeleton className="w-full aspect-square rounded-2xl" />
                          <div className="flex justify-between px-2">
                            <Skeleton className="w-24 h-4 rounded-md" />
                            <Skeleton className="w-16 h-4 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <VariantGallery variants={variants} format={format} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-200 dark:border-slate-800 py-16 sm:py-24 max-w-7xl mx-auto container px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Process Flow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Optimize Images in 4 Simple Steps</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">How we calculate safety ranges to ensure barcode scanners determine optimal dimensions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">1</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-base">Upload Image</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Drag and drop your raw product listing photo into the upload dropzone.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">2</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-base">AI Analysis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Our AI isolates the product bounding box, alignment vectors, and white space ratios.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">3</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-base">Generate Layouts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">The system generates 20–30 visual variants with calibrated safety padding percentages.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-emerald-500/20">4</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-base">Compare & Use</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Select the variant offering optimal padding alignment, download, and update your listing.</p>
          </div>
        </div>
      </section>

      {/* Why VisionFlow Section */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Tool Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Why Sellers Choose VisionFlow</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Deterministic visual optimization designed specifically to lower logistics weight calculations.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants}>
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl p-6 flex flex-col space-y-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Maximize className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Dynamic Padding Optimization</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically inserts optimal white boundaries. This stops automated warehouse scanners from clipping product edges, preventing incorrect volume estimations.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl p-6 flex flex-col space-y-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">20-30 Variations in One Click</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Evaluates contrast scales, margins, alignments, and backgrounds, all compiled in seconds to give you multiple listing image variants to pick from.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl p-6 flex flex-col space-y-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">100% Marketplace Compliant</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Provides clean, background-corrected images matching E-Commerce listing standards, preserving exact catalog resolutions without artifacting.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-slate-200 dark:border-slate-800 py-16 sm:py-24 max-w-4xl mx-auto container px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Help Center</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">How does VisionFlow help reduce shipping costs?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Logistics warehouses use computerized scanning cameras to measure product dimensions. If a listing photo is off-center or lacks safety borders, automated scanners may miscalculate the product edges, leading to higher dimensional weight charges. VisionFlow optimizes padding and centering to ensure accurate scanning.
            </p>
          </div>
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">How many image variants are generated?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              For every uploaded image, the tool processes approximately 20–30 unique layout variants. These include background-removed files with white or light-gray fills, varying border padding amounts, and fine-tuned brightness alignments.
            </p>
          </div>
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Does the tool modify the actual product visual?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              No. It only adjusts white space padding, alignment, contrast, and background characteristics. Your actual product remains perfectly unaltered and true to life, ensuring listing rules are followed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">VisionFlow</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex space-x-6">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">E-Commerce Optimizer Engine V3</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

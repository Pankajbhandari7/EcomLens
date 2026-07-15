"use client";

import { useCallback, useMemo, useRef, useState, useEffect, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, DownloadCloud, Sun, Moon, Image as ImageIcon, Settings2, Sparkles, Loader2, RefreshCw } from "lucide-react";

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
    if (status === "error") return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    if (status === "done") return "bg-green-500 shadow-sm";
    if (busy) return "bg-accent shadow-sm animate-pulse";
    return "bg-line";
  };

  return (
    <div className="min-h-screen w-full bg-ink flex flex-col grain overflow-y-auto custom-scrollbar">
      {/* Top Navbar */}
      <nav className="w-full h-16 border-b border-line bg-panel/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            className="w-6 h-6 rounded bg-accent shadow-sm cursor-pointer" 
            onClick={() => window.location.reload()}
          />
          <span className="font-display font-bold text-lg text-paper tracking-tight hidden sm:block">
            BATCH WORKSPACE
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="ml-2 rounded-full"
            title="Toggle Theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                  <Sun className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                  <Moon className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
        
        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line hidden sm:flex">
                <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
                <span className="font-mono text-xs text-paper/70 font-medium">{status === 'idle' ? 'Ready to generate' : status === 'done' ? 'Generation Complete' : progressLabel || 'Processing...'}</span>
              </div>

              <Button
                onClick={handleDownloadAll}
                disabled={variants.length === 0 || zipping}
                className="gap-2 font-bold uppercase tracking-wider text-xs"
              >
                {zipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ZIPPING...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    DOWNLOAD .ZIP
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-8 flex flex-col items-center">
        
        {/* HERO / UPLOAD ZONE */}
        <motion.div 
          layout
          className={`w-full transition-all duration-700 flex flex-col items-center ${file ? 'mb-10' : 'justify-center min-h-[70vh]'}`}
        >
          <AnimatePresence>
            {!file && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="max-w-3xl w-full text-center z-10 mb-10"
              >
                <h1 className="text-4xl md:text-6xl font-display font-bold text-paper mb-6 tracking-tight">
                  Transform <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">One Photo</span><br/>Into Twenty Five Assets
                </h1>
                <p className="text-paper/60 text-lg max-w-xl mx-auto">
                  Professional background removal, smart cropping, and rendering — powered entirely in your browser. Fast, private, and breathtakingly simple.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            layout
            className={`w-full max-w-2xl rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-colors duration-300 z-10 cursor-pointer overflow-hidden ${
              isDragging 
                ? "border-accent bg-accent/10 scale-[1.02] shadow-md" 
                : "border-line bg-panel/50 hover:border-accent/50 hover:bg-surface/50"
            } ${file ? 'h-32 shadow-sm' : 'h-80 shadow-lg'}`}
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
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div 
                  key="active-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-6 px-8 w-full"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-ink shrink-0 border border-line shadow-sm relative group">
                    <img src={originalUrl!} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 text-left">
                     <h3 className="text-lg font-display font-semibold text-paper tracking-tight">Image Loaded</h3>
                     <p className="font-mono text-[10px] text-paper/50 uppercase tracking-widest mt-1">Click or drag a new image to replace</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 hover:bg-line transition-colors">
                    <RefreshCw className="w-4 h-4 text-paper/70" />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-surface border border-line flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <UploadCloud className="w-8 h-8 text-accent relative z-10" />
                  </div>
                  
                  <h3 className="text-xl font-display font-semibold text-paper mb-2 tracking-tight">Drag & drop your product image</h3>
                  <p className="font-mono text-xs text-paper/40 uppercase tracking-widest">or click to browse files</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* WORKSPACE (2-COLUMN) */}
        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col gap-12 relative"
            >
              
              {/* 2-Column Upper Section */}
              <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Column: Settings Panel */}
                <aside className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                  <div className="bg-panel rounded-3xl border border-line p-6 shadow-sm flex flex-col gap-6">
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-accent" />
                        <h2 className="font-display font-semibold text-lg text-paper tracking-tight">Pipeline Settings</h2>
                      </div>
                      <p className="text-xs text-paper/50 pl-6">Configure how your image will be processed.</p>
                    </div>

                    <hr className="border-line" />

                    {/* Category */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-paper">Product Category</label>
                      <div className="relative">
                        <Select
                          value={selectedCategory}
                          onChange={(val) => {
                            setSelectedCategory(val);
                            setSelectedSubcategory(""); 
                          }}
                          disabled={busy}
                          placeholder="Select product category"
                          options={CATEGORIES.map(cat => ({ value: cat.category, label: cat.category }))}
                        />
                      </div>
                    </div>

                    {/* Subcategory */}
                    <AnimatePresence>
                      {selectedCategory && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2"
                        >
                          <label className="text-sm font-medium text-paper mt-2">Subcategory</label>
                          <div className="relative">
                            <Select
                              value={selectedSubcategory}
                              onChange={setSelectedSubcategory}
                              disabled={busy}
                              placeholder="Select subcategory"
                              options={(CATEGORIES.find(c => c.category === selectedCategory)?.subcategories || []).map(sub => ({ value: sub, label: sub }))}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* AI Background Removal Toggle */}
                    <div className="flex flex-col gap-3 mt-2">
                      <label className="flex items-center justify-between cursor-pointer group bg-surface/50 p-4 rounded-2xl border border-line hover:border-accent/30 transition-all">
                        <span className="text-sm font-semibold text-paper group-hover:text-accent transition-colors">
                          AI Background Removal
                        </span>

                        <div
                          className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${
                            useBgRemoval ? 'bg-accent' : 'bg-line'
                          }`}
                        >
                          <motion.div
                            layout
                            className={`w-4 h-4 rounded-full bg-white shadow-sm`}
                            initial={false}
                            animate={{ x: useBgRemoval ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
                      <label className="text-sm font-medium text-paper">Output Format</label>
                      <div className="grid grid-cols-2 gap-2 bg-surface p-1 rounded-xl border border-line">
                        {(["jpg", "png"] as OutputFormat[]).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFormat(f)}
                            disabled={busy}
                            className={`py-2 rounded-lg font-mono text-xs uppercase transition-all font-semibold ${
                              format === f
                                ? "bg-panel text-accent shadow-sm"
                                : "text-paper/50 hover:text-paper"
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
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-medium mt-2 flex items-start gap-2"
                        >
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          {errorMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      onClick={handleGenerate}
                      disabled={busy}
                      className="w-full h-14 mt-4 text-[13px]"
                    >
                      {busy && <div className="absolute inset-0 scan-line rounded-xl"></div>}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {busy ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            PROCESSING...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            GENERATE VARIANTS
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                  
                  {/* Status Card */}
                  <AnimatePresence>
                    {variants.length > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="rounded-3xl border border-line bg-panel p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm"
                       >
                         <div className="flex justify-between items-start">
                           <span className="font-mono text-[10px] text-paper/50 uppercase tracking-widest">Session Stats</span>
                           <span className="w-2 h-2 rounded-full bg-accent shadow-sm"></span>
                         </div>
                         
                         <div>
                           <div className="text-4xl font-display font-bold text-paper tracking-tighter">{variants.length}</div>
                           <div className="text-sm font-medium text-paper/60 mt-1">Generated Assets</div>
                         </div>
                         
                         <div className="w-full bg-line rounded-full h-1 mt-4 overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: "100%" }}
                             transition={{ duration: 1 }}
                             className="bg-accent h-full"
                           />
                         </div>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </aside>

                {/* Right Column: Previews */}
                <div className="flex-1 w-full min-w-0 flex flex-col gap-10">
                  {/* Preview Box */}
                  <div className="w-full bg-panel rounded-3xl border border-line p-6 lg:p-10 shadow-sm flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {status === "removing-bg" || (status === "rendering" && !processedUrl) ? (
                        <motion.div 
                          key="processing"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full max-w-md aspect-square rounded-3xl border border-line/50 bg-surface/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner"
                        >
                          <div className="absolute inset-0 scan-line opacity-50"></div>
                          <div className="mb-8">
                            <PremiumSpinner size={80} />
                          </div>
                          <h3 className="font-display text-xl text-paper font-semibold tracking-tight">{progressLabel}</h3>
                          <p className="font-mono text-xs text-paper/50 mt-2">Applying machine learning models...</p>
                        </motion.div>
                      ) : status === "idle" ? (
                        <motion.div 
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-line bg-surface"
                        >
                           <img src={originalUrl!} alt="Original" className="w-full h-full object-contain bg-ink/40" />
                           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-panel/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-line text-xs font-mono text-paper font-bold shadow-xl">
                             READY FOR PROCESSING
                           </div>
                        </motion.div>
                      ) : processedUrl && originalUrl ? (
                        <motion.div 
                          key="result"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-w-2xl shadow-2xl rounded-3xl overflow-hidden border border-line"
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
                    <div className="flex items-center gap-4 mb-8">
                       <h2 className="text-2xl font-display font-bold text-paper tracking-tight">
                         {status === 'rendering' ? 'Generating Variants...' : 'Generated Variants'}
                       </h2>
                       <div className="h-px flex-1 bg-line"></div>
                    </div>
                    
                    {status === 'rendering' && variants.length === 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex flex-col gap-4">
                            <Skeleton className="w-full aspect-square rounded-3xl" />
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

      </main>
    </div>
  );
}

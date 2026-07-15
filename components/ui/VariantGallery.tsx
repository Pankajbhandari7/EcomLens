"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OutputFormat } from "@/lib/variants";
import type { GeneratedVariant } from "@/app/page"; 

interface VariantGalleryProps {
  variants: GeneratedVariant[];
  format: OutputFormat;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function VariantGallery({ variants, format }: VariantGalleryProps) {
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  const [showModalSidebar, setShowModalSidebar] = useState(true);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="w-full pb-20">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {variants.map((v) => (
          <motion.div
            variants={itemVariants}
            key={v.config.id}
            className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer p-3 gap-2"
            onClick={() => {
              setSelectedVariant(v);
              setShowModalSidebar(true);
            }}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
              <img
                src={v.url}
                alt={v.config.label}
                className="h-full w-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <a
                  href={v.url}
                  download={v.filename}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm" className="shadow-md bg-white text-slate-900 hover:bg-slate-100 border-slate-200">
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="text-left mt-1">
              <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{v.config.label.replace(/^\d+% frame · /, '')}</p>
              
              {v.config.shippingPrice !== undefined && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Est. Shipping</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    ₹{v.config.shippingPrice}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {selectedVariant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 sm:p-8 backdrop-blur-sm"
            onClick={() => setSelectedVariant(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative flex flex-col md:flex-row gap-6 ${showModalSidebar ? 'max-w-5xl' : 'max-w-4xl'} w-full h-full md:h-auto items-center justify-center bg-card rounded-2xl border border-border p-3 shadow-xl transition-all duration-500`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setSelectedVariant(null)}
                className="absolute -top-4 -right-4 md:-top-5 md:-right-5 rounded-full bg-card shadow-lg z-10 hover:scale-105 border-border text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div 
                className={`flex-1 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-border overflow-hidden cursor-pointer transition-all duration-500 ${showModalSidebar ? 'max-h-[70vh]' : 'max-h-[85vh]'}`}
                onClick={() => setShowModalSidebar(!showModalSidebar)}
                title="Click to toggle details"
              >
                <img 
                  src={selectedVariant.url} 
                  alt={selectedVariant.config.label}
                  className="max-h-full max-w-full object-contain p-4 drop-shadow-md"
                />
              </div>
              
              <AnimatePresence>
                {showModalSidebar && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "340px" }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    className="flex flex-col gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-border shrink-0 h-full overflow-y-auto custom-scrollbar"
                  >
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{selectedVariant.config.label.replace(/^\d+% frame · /, '')}</h3>
                      <div className="px-2 py-1 bg-background border border-border rounded-md inline-block shadow-sm">
                        <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[250px]">{selectedVariant.filename}</p>
                      </div>
                    </div>
                    
                    {selectedVariant.config.shippingPrice !== undefined && (
                      <div className="flex flex-col gap-4">
                        <div className="h-px w-full bg-border"></div>
                        
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Estimated Shipping</span>
                          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                            ₹{selectedVariant.config.shippingPrice}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-2">
                          <div className="bg-background p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Carrier Slab</span>
                            <span className="text-sm font-bold text-foreground">{selectedVariant.config.shippingSlab}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-8">
                      <a
                        href={selectedVariant.url}
                        download={selectedVariant.filename}
                      >
                        <Button className="w-full gap-2 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-md h-10">
                          <Download className="w-4 h-4" />
                          Download .{format.toUpperCase()}
                        </Button>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

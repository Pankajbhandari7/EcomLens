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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-paper">Generated Variants</h2>
        <span className="font-mono text-xs uppercase tracking-widest text-paper/50 bg-surface px-3 py-1 rounded-full border border-line">{variants.length} assets</span>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {variants.map((v) => (
          <motion.div
            variants={itemVariants}
            key={v.config.id}
            className="group relative flex flex-col overflow-hidden rounded-xl bg-surface/50 border border-line shadow-md transition-all hover:border-accent hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
            onClick={() => {
              setSelectedVariant(v);
              setShowModalSidebar(true);
            }}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-ink/50">
              <img
                src={v.url}
                alt={v.config.label}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Professional Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <a
                  href={v.url}
                  download={v.filename}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="default" className="w-full gap-2 shadow-xl hover:shadow-accent/50">
                    <Download className="w-4 h-4" />
                    Download .{format}
                  </Button>
                </a>
              </div>
            </div>
            
            {v.config.shippingPrice !== undefined && (
              <div className="px-5 py-4 border-t border-line bg-panel flex justify-between items-center">
                <span className="font-mono text-xs uppercase tracking-wider text-paper/60">
                  Est. Shipping
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-paper">
                    ₹{v.config.shippingPrice}
                  </span>
                </div>
              </div>
            )}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 sm:p-8 backdrop-blur-xl"
            onClick={() => setSelectedVariant(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative flex flex-col md:flex-row gap-8 ${showModalSidebar ? 'max-w-6xl' : 'max-w-5xl'} w-full h-full md:h-auto items-center justify-center bg-panel/80 rounded-3xl border border-line p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all duration-500`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setSelectedVariant(null)}
                className="absolute -top-4 -right-4 md:-top-6 md:-right-6 rounded-full bg-surface shadow-2xl z-10 hover:scale-110"
              >
                <X className="w-5 h-5 text-paper/70" />
              </Button>
              
              <div 
                className={`flex-1 w-full flex items-center justify-center bg-ink/50 rounded-2xl border border-line overflow-hidden cursor-pointer shadow-inner transition-all duration-500 ${showModalSidebar ? 'max-h-[75vh]' : 'max-h-[90vh]'}`}
                onClick={() => setShowModalSidebar(!showModalSidebar)}
                title="Click to toggle details"
              >
                <img 
                  src={selectedVariant.url} 
                  alt={selectedVariant.config.label}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              <AnimatePresence>
                {showModalSidebar && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "384px" }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    className="flex flex-col gap-8 p-6 md:p-8 bg-surface/30 rounded-2xl border border-line shrink-0"
                  >
                    <div>
                      <h3 className="font-display text-3xl font-semibold tracking-tight text-paper mb-3">{selectedVariant.config.label.replace(/^\d+% frame · /, '')}</h3>
                      <div className="px-3 py-1.5 bg-ink/50 border border-line rounded-lg inline-block">
                        <p className="font-mono text-[10px] text-paper/60 truncate max-w-[250px]">{selectedVariant.filename}</p>
                      </div>
                    </div>
                    
                    {selectedVariant.config.shippingPrice !== undefined && (
                      <div className="flex flex-col gap-4">
                        <div className="h-px w-full bg-line"></div>
                        
                        <div>
                          <span className="text-[10px] uppercase font-mono text-paper/50 tracking-widest block mb-1">Estimated Shipping</span>
                          <span className="font-display text-4xl font-light text-paper tracking-tighter">
                            ₹{selectedVariant.config.shippingPrice}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-2">
                            <div className="bg-ink/40 p-4 rounded-xl border border-line shadow-sm">
                            <span className="block text-[10px] font-mono text-paper/50 uppercase tracking-wider mb-1">Carrier Slab</span>
                            <span className="text-sm font-semibold text-accent">{selectedVariant.config.shippingSlab}</span>
                          </div>
                          </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-8">
                      <a
                        href={selectedVariant.url}
                        download={selectedVariant.filename}
                      >
                        <Button size="lg" className="w-full gap-3 shadow-2xl hover:shadow-accent/50 text-base">
                          <Download className="w-5 h-5" />
                          Download .{format}
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

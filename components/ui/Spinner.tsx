import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function PremiumSpinner({ className, size = 64 }: SpinnerProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-accent blur-xl"
      />
      
      {/* Ring 1 - Slow Outer */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-accent/30"
      />
      
      {/* Ring 2 - Fast Inner Reverse */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 rounded-full border-2 border-transparent border-b-accent border-l-accent/50"
      />
      
      {/* Center Core */}
      <motion.div
        animate={{ scale: [0.8, 1, 0.8] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className="w-1/3 h-1/3 rounded-full bg-accent shadow-[0_0_15px_rgba(0,112,243,0.8)]"
      />
    </div>
  );
}

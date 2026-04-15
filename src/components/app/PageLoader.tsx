"use client";

import { motion } from "motion/react";

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      {/* Spinning moon */}
      <motion.span
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          display: "inline-block",
          fontSize: 28,
          color: "#8B5CF6",
          textShadow: "0 0 16px rgba(139,92,246,0.4)",
        }}
      >
        &#9790;
      </motion.span>

      {/* Bouncing text */}
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-sm font-medium text-text-muted"
      >
        Chargement...
      </motion.span>
    </div>
  );
}

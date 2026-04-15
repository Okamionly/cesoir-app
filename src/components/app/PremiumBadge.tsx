"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface PremiumBadgeProps {
  /** Compact mode: smaller size */
  compact?: boolean;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PremiumBadge({ compact = false }: PremiumBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.elastic}
      className={`inline-flex items-center gap-1 rounded-full font-bold ${
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      }`}
      style={{
        background: "linear-gradient(135deg, #F59E0B, #FBBF24, #F59E0B)",
        backgroundSize: "200% 100%",
        color: "#111111",
      }}
      role="status"
      aria-label="Membre premium"
    >
      <motion.span
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        className={compact ? "text-[10px]" : "text-[12px]"}
        aria-hidden="true"
        style={{
          display: "inline-block",
          background: "linear-gradient(90deg, #F59E0B, #FFFBEB, #F59E0B)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        👑
      </motion.span>
      <motion.span
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: "linear-gradient(90deg, #92400E, #FFFBEB, #92400E)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        PRO
      </motion.span>
    </motion.div>
  );
}

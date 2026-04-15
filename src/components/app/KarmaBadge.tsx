"use client";

import { motion } from "motion/react";

interface KarmaBadgeProps {
  score: number;
  meetups: number;
  compact?: boolean;
}

export default function KarmaBadge({ score, meetups, compact = false }: KarmaBadgeProps) {
  const ringColor = score > 4.5 ? "#F59E0B" : score > 4.0 ? "#C0C0C0" : "transparent";
  const hasRing = score > 4.0;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
        hasRing ? "border-2" : "border border-border"
      }`}
      style={hasRing ? { borderColor: ringColor, backgroundColor: `${ringColor}08` } : {}}
      role="status"
      aria-label={`Score karma: ${score} etoiles, ${meetups} rencontres`}
    >
      <motion.span
        className="text-[14px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{ color: "#F59E0B" }}
        aria-hidden="true"
      >
        ★
      </motion.span>
      <span className={`font-bold ${compact ? "text-[11px]" : "text-[13px]"}`} style={{ color: score > 4.5 ? "#F59E0B" : score > 4.0 ? "#C0C0C0" : undefined }}>
        {score.toFixed(1)}
      </span>
      {!compact && (
        <span className="text-[11px] text-text-muted">
          · {meetups} rencontres
        </span>
      )}
    </div>
  );
}

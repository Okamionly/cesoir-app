"use client";

import { m } from "motion/react";
import { getKarmaTier, KARMA_STAR_COLOR } from "@/lib/karma-tiers";

interface KarmaBadgeProps {
  score: number;
  meetups: number;
  compact?: boolean;
}

export default function KarmaBadge({ score, meetups, compact = false }: KarmaBadgeProps) {
  const tier = getKarmaTier(score);
  const hasRing = tier.key !== "none";
  const tierColor = hasRing ? tier.color : undefined;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
        hasRing ? "border-2" : "border border-border"
      }`}
      style={hasRing ? { borderColor: tier.color, backgroundColor: tier.tint } : {}}
      role="status"
      aria-label={`Score karma: ${score} etoiles, ${meetups} rencontres`}
    >
      <m.span
        className="text-[14px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{ color: KARMA_STAR_COLOR }}
        aria-hidden="true"
      >
        ★
      </m.span>
      <span
        className={`font-bold ${compact ? "text-[11px]" : "text-[13px]"}`}
        style={{ color: tierColor }}
      >
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

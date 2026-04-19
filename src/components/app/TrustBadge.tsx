"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { getTrustTierStyle } from "@/lib/trust-colors";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface TrustBadgeProps {
  /** Trust score 0-100 */
  trustScore: number;
  /** Whether the user is identity-verified */
  isVerified?: boolean;
  /** Compact mode: smaller, no label text */
  compact?: boolean;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function TrustBadge({ trustScore, isVerified = false, compact = false }: TrustBadgeProps) {
  const tier = getTrustTierStyle(trustScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.snap}
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        compact ? "px-2 py-0.5" : "px-3 py-1.5"
      }`}
      style={{
        backgroundColor: tier.bg,
        borderColor: tier.border,
      }}
      role="status"
      aria-label={`Score de confiance: ${trustScore} — ${tier.label}${isVerified ? ", profil verifie" : ""}`}
    >
      {/* Score number */}
      <span
        className={`font-bold ${compact ? "text-[10px]" : "text-[12px]"}`}
        style={{ color: tier.text }}
      >
        {trustScore}
      </span>

      {/* Tier label */}
      {!compact && (
        <span
          className="text-[11px] font-semibold"
          style={{ color: tier.text }}
        >
          {tier.label}
        </span>
      )}

      {/* Verified checkmark */}
      {isVerified && (
        <motion.svg
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.elastic}
          width={compact ? 12 : 14}
          height={compact ? 12 : 14}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" fill="var(--color-accent)" />
          <path
            d="M8 12l3 3 5-5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </motion.div>
  );
}

"use client";

// ========================================
// IntentionBadge — Displays user's dating intention
// ========================================
//
// Renders a small pill badge showing the user's intention:
// Serieux, Casual, Verre, Amitie.
//
// Animation signature: Soft pop
// Badge pops in with a tiny elastic overshoot, subtle pulse
// on hover to indicate interactivity.

import { motion } from "motion/react";

// ─────────────────────────────────────────
// Springs — soft pop physics
// ─────────────────────────────────────────

const badgeSprings = {
  pop: { type: "spring" as const, stiffness: 450, damping: 20, mass: 0.5 },
};

// ─────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────

export type Intention = "serieux" | "casual" | "verre" | "amitie";

export const INTENTIONS: Record<Intention, { emoji: string; label: string; color: string }> = {
  serieux: { emoji: "\uD83C\uDF52", label: "Serieux", color: "#EC4899" },   // cherry
  casual:  { emoji: "\uD83C\uDF49", label: "Casual", color: "#F59E0B" },    // watermelon
  verre:   { emoji: "\uD83C\uDF47", label: "Verre", color: "#8B5CF6" },     // grapes
  amitie:  { emoji: "\uD83E\uDED0", label: "Amitie", color: "#06B6D4" },    // blueberry
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface IntentionBadgeProps {
  intention: Intention;
  /** Size variant */
  size?: "sm" | "md";
  /** Delay for staggered animation */
  delay?: number;
  /** Additional className */
  className?: string;
}

export default function IntentionBadge({
  intention,
  size = "sm",
  delay = 0,
  className = "",
}: IntentionBadgeProps) {
  const data = INTENTIONS[intention];
  if (!data) return null;

  const isSm = size === "sm";

  return (
    <motion.span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        isSm
          ? "px-2 py-0.5 text-[10px]"
          : "px-3 py-1 text-[12px]"
      } ${className}`}
      style={{
        backgroundColor: `${data.color}15`,
        borderColor: `${data.color}30`,
        color: data.color,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...badgeSprings.pop, delay }}
      whileHover={{
        scale: 1.08,
        transition: { type: "spring", stiffness: 400, damping: 15 },
      }}
    >
      <span>{data.emoji}</span>
      {data.label}
    </motion.span>
  );
}

"use client";

/**
 * XPBar — Compact XP progress strip for PageHeader.
 *
 * Design constraints:
 * - Total height: 32px (fits single-row header slot without layout shift)
 * - Mobile-first: 375px readable, expands on sm+
 * - Animated fill via motion/react springs.gentle (NOT framer-motion)
 * - Tappable: wraps in <Link> to /progress
 * - Accessibility: hidden <progress> element underneath the visual bar
 * - 0 layout shift: reserves 32px always when rendered
 */

import Link from "next/link";
import type { Route } from "next";
import { m, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useGamification } from "@/lib/useGamification";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────
// Skeleton state — shown while XP loads
// ─────────────────────────────────────────

function XPBarSkeleton() {
  return (
    <div
      className="flex items-center gap-2 h-8 px-1"
      aria-hidden="true"
    >
      {/* Level badge placeholder */}
      <div className="animate-shimmer rounded h-3.5 w-12 shrink-0" />
      {/* Bar track placeholder */}
      <div className="flex-1 h-1.5 rounded-full animate-shimmer" />
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export interface XPBarProps {
  /** Extra class for the outer wrapper (32px tall reserved block) */
  className?: string;
}

export function XPBar({ className }: XPBarProps) {
  const { user } = useAuth();
  const { level, levelInfo, loading } = useGamification();
  const reducedMotion = useReducedMotion();

  // Guard: not logged in
  if (!user) return null;

  // Guard: loading
  if (loading) return <XPBarSkeleton />;

  const { currentXP, nextLevelXP, progress } = levelInfo;

  // At max level (progress === 1, nextLevelXP === 0)
  const isMaxLevel = nextLevelXP === 0;

  // Clamp progress 0..1 for the fill
  const fillPct = Math.min(Math.max(progress, 0), 1);

  // Label shown in the bar
  const labelText = isMaxLevel
    ? `Niv. ${level} · Max`
    : `Niv. ${level} · ${currentXP}/${nextLevelXP} XP`;

  return (
    <Link
      href={"/progress" as Route}
      className={[
        // Reserve exactly 32px to prevent layout shift
        "flex items-center gap-2 h-8 px-1 w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded",
        // Touch tap state
        "active:opacity-70 transition-opacity",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Progression XP : ${labelText}`}
    >
      {/* Level + XP text */}
      <span
        className="text-[11px] font-medium text-text-muted tabular-nums shrink-0 leading-none"
        aria-hidden="true"
      >
        {labelText}
      </span>

      {/* Bar track + animated fill */}
      <div
        className="relative flex-1 h-1.5 rounded-full bg-border overflow-hidden"
        aria-hidden="true"
      >
        <m.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: isMaxLevel
              ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
              : "linear-gradient(90deg, #8B5CF6, #A855F7)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct * 100}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { ...springs.gentle, duration: undefined }
          }
        />
      </div>

      {/* Screen-reader accessible progress element (hidden visually) */}
      <progress
        className="sr-only"
        value={fillPct * 100}
        max={100}
        aria-label={labelText}
      />
    </Link>
  );
}

export default XPBar;

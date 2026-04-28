"use client";

/**
 * StreakBadge — Wave 17 visible daily streak chip.
 *
 * Compact 🔥 + N count, rendered in PageHeader actions slot before the
 * XPBar. Tappable: navigates to /progress?tab=streak.
 *
 * Visual states:
 *   - currentStreak === 0     → not rendered (clean header)
 *   - 1 <= streak < 3         → static chip
 *   - streak >= 3 (isOnFire)  → "On fire!" : flame scale-pulses,
 *     gradient halo behind the chip
 *
 * Design constraints:
 *   - Mobile-first: touchable tap target (min 32px)
 *   - 0 layout shift: hook returns currentStreak=0 while loading,
 *     so the slot is empty until the value lands
 *   - Reduced-motion respected: pulse disabled when prefers-reduced
 */

import Link from "next/link";
import type { Route } from "next";
import { m, useReducedMotion } from "motion/react";
import { useStreak } from "@/lib/useStreak";

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

export interface StreakBadgeProps {
  /** Extra class for the outer chip wrapper. */
  className?: string;
}

export function StreakBadge({ className }: StreakBadgeProps) {
  const { currentStreak, isOnFire, loading } = useStreak();
  const reducedMotion = useReducedMotion();

  // Hidden states: not logged in / loading / no streak yet.
  if (loading) return null;
  if (currentStreak <= 0) return null;

  const ariaLabel = isOnFire
    ? `Série de ${currentStreak} jours, en feu — voir ma série`
    : `Série de ${currentStreak} jours — voir ma série`;

  return (
    <Link
      href={"/progress?tab=streak" as Route}
      aria-label={ariaLabel}
      className={[
        "relative inline-flex items-center gap-1 h-8 px-2.5 rounded-full",
        "border text-[12px] font-semibold tabular-nums leading-none",
        "transition-colors active:opacity-70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1",
        isOnFire
          ? "border-orange-400/60 bg-orange-500/10 text-orange-500"
          : "border-border bg-card text-text-muted",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* On-fire halo: subtle gradient glow behind the chip. */}
      {isOnFire && !reducedMotion && (
        <m.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(251,146,60,0.35) 0%, rgba(251,146,60,0) 70%)",
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Flame emoji — scale-pulses only when on fire. */}
      <m.span
        aria-hidden="true"
        className="relative inline-block leading-none"
        animate={
          isOnFire && !reducedMotion
            ? { scale: [1, 1.15, 1] }
            : undefined
        }
        transition={
          isOnFire && !reducedMotion
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        style={{ fontSize: "14px" }}
      >
        🔥
      </m.span>

      <span className="relative">{currentStreak}</span>

      {/* "On fire!" label — only shown >= 3, only on sm+ to keep
          the chip compact on small phones. */}
      {isOnFire && (
        <span className="relative hidden sm:inline text-[11px] font-medium opacity-80 ml-0.5">
          On fire!
        </span>
      )}
    </Link>
  );
}

export default StreakBadge;

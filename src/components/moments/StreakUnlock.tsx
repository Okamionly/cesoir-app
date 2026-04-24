"use client";

/**
 * StreakUnlock — trophy zoom + rotate to celebrate an N-day streak
 * (e.g. 7 days consecutive matches).
 *
 * Trophy emoji scales 0 → 1.3 → 1 while rotating 360° over ~1.2s.
 * Uses `springs.elastic` for the final settle.
 *
 * Respects reduced-motion — renders a static trophy when on.
 */

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { springs } from "@/lib/motion-design";

export interface StreakUnlockProps {
  /** Mount state — unmount to stop */
  active: boolean;
  /** Streak count (e.g. 7). Controls the label. */
  days?: number;
  /** Emoji glyph — default trophy. */
  emoji?: string;
}

export function StreakUnlock({
  active,
  days = 7,
  emoji = "🏆",
}: StreakUnlockProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!active) return null;
  if (!mounted || reduced) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl" aria-hidden>
          {emoji}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-accent">
          {days}-day streak
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <m.span
        className="text-5xl"
        aria-hidden
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: [0, 1.3, 1], rotate: 360 }}
        transition={{
          duration: 1.2,
          times: [0, 0.7, 1],
          ease: "easeOut",
        }}
      >
        {emoji}
      </m.span>
      <m.span
        className="text-xs font-bold uppercase tracking-widest text-accent"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.elastic, delay: 0.8 }}
      >
        {days}-day streak
      </m.span>
    </div>
  );
}

export default StreakUnlock;

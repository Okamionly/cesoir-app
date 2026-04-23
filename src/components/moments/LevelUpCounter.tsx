"use client";

/**
 * LevelUpCounter — spring-bounce number transition for karma level-ups.
 *
 * Counter animates from `from` → `to` with springs.cinematic, while a
 * violet glow fades in/out behind the number. ~0.8s total.
 *
 * Usage:
 *   <LevelUpCounter from={10} to={11} active={justLeveledUp} />
 *
 * Respects reduced-motion — shows final value without motion.
 */

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion-design";

export interface LevelUpCounterProps {
  from: number;
  to: number;
  /** Mount state — unmount to stop */
  active: boolean;
  /** Hex color for the glow. Default accent violet. */
  glow?: string;
}

export function LevelUpCounter({
  from,
  to,
  active,
  glow = "#8B5CF6",
}: LevelUpCounterProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setDisplay(to);
      return;
    }
    const timer = setTimeout(() => setDisplay(to), 400);
    return () => clearTimeout(timer);
  }, [active, to, reduced]);

  if (!active) return null;

  return (
    <div className="relative inline-flex items-center justify-center">
      {!reduced && (
        <m.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glow}80 0%, transparent 70%)`,
            filter: "blur(12px)",
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 1.6] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}
      <m.span
        className="relative text-3xl font-black text-accent tabular-nums"
        key={display}
        initial={reduced ? false : { scale: 0.6, y: -8 }}
        animate={{ scale: 1, y: 0 }}
        transition={springs.cinematic}
      >
        {display}
      </m.span>
    </div>
  );
}

export default LevelUpCounter;

"use client";

import { motion } from "motion/react";
import { app } from "@/lib/design-tokens";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface MusicEqualizerProps {
  /** Number of bars (3-5) */
  bars?: number;
  /** "sm" for inline use, "lg" for the vibe page */
  size?: "sm" | "lg";
  /** CSS color or gradient stop — matches mood */
  color?: string;
  /** Pause the animation */
  paused?: boolean;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const BAR_DURATIONS = [0.8, 1.1, 0.7, 0.95, 1.25];
const BAR_DELAYS = [0, 0.15, 0.3, 0.1, 0.25];

const SIZE_CONFIG = {
  sm: { height: 16, barWidth: 3, gap: 2 },
  lg: { height: 40, barWidth: 6, gap: 3 },
} as const;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function MusicEqualizer({
  bars = 3,
  size = "sm",
  color = app.violet,
  paused = false,
}: MusicEqualizerProps) {
  const clampedBars = Math.min(5, Math.max(3, bars));
  const config = SIZE_CONFIG[size];
  const totalWidth = clampedBars * config.barWidth + (clampedBars - 1) * config.gap;

  return (
    <div
      className="inline-flex items-end"
      style={{
        width: totalWidth,
        height: config.height,
        gap: config.gap,
      }}
      role="img"
      aria-label="Equalizer musical"
    >
      {Array.from({ length: clampedBars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: config.barWidth,
            backgroundColor: color,
            originY: 1,
          }}
          animate={
            paused
              ? { height: config.height * 0.3 }
              : {
                  height: [
                    config.height * 0.2,
                    config.height * 1.0,
                    config.height * 0.35,
                    config.height * 0.75,
                    config.height * 0.2,
                  ],
                }
          }
          transition={
            paused
              ? { duration: 0.3 }
              : {
                  duration: BAR_DURATIONS[i % BAR_DURATIONS.length],
                  repeat: Infinity,
                  repeatType: "mirror" as const,
                  delay: BAR_DELAYS[i % BAR_DELAYS.length],
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}

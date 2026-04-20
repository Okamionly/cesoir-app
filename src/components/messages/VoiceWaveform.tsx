"use client";

import { m, useReducedMotion } from "motion/react";

interface VoiceWaveformProps {
  /** Are we currently playing? animates when true */
  playing?: boolean;
  /** Number of bars (default 24) */
  bars?: number;
  /** Tint of the bars */
  color?: string;
}

/**
 * CSS-only animated waveform. No real audio decoding — bars get
 * deterministic heights from their index, then each bar scales on a
 * loop with a staggered delay so the motion looks audio-driven.
 *
 * Safe for reduced-motion — falls back to a static histogram.
 */
export function VoiceWaveform({
  playing = false,
  bars = 24,
  color = "currentColor",
}: VoiceWaveformProps) {
  const reducedMotion = useReducedMotion();

  // Deterministic pseudo-random heights — seeded by index so SSR matches CSR
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const rand = seed - Math.floor(seed);
    return 0.3 + rand * 0.7; // 0.3 .. 1.0
  });

  return (
    <div
      className="flex items-center gap-[2px] h-6"
      aria-hidden="true"
      role="presentation"
    >
      {heights.map((h, i) => (
        <m.span
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: color, height: `${h * 100}%` }}
          animate={
            reducedMotion || !playing
              ? undefined
              : {
                  scaleY: [h, 0.4, h * 0.9, h, h * 0.5, h],
                }
          }
          transition={
            playing && !reducedMotion
              ? {
                  duration: 0.8 + (i % 5) * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 7) * 0.05,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

export default VoiceWaveform;

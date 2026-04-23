"use client";

/**
 * VerifyConfetti — confetti burst to celebrate a successful profile
 * verification (migration 016 · `profile_verifications`).
 *
 * 24 particles fly outward in a radial pattern, alternating between
 * the CeSoir signature violet (#8B5CF6) and the "safe" fluo green
 * (#00FF88). ~2s total duration. Pattern inspired by MatchCinematic's
 * celebration ring but scaled down.
 *
 * Respects reduced-motion — renders nothing when on.
 */

import { m, useReducedMotion } from "motion/react";
import { easings } from "@/lib/motion-design";

const COLORS = ["#8B5CF6", "#00FF88"];
const PARTICLE_COUNT = 24;

export interface VerifyConfettiProps {
  /** Mount state — unmount to stop */
  active: boolean;
}

export function VerifyConfetti({ active }: VerifyConfettiProps) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const radius = 140 + (i % 3) * 30;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const color = COLORS[i % COLORS.length];
        return (
          <m.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 7,
              height: 7,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x,
              y,
              scale: [0, 1.3, 0.8],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: 0.2 + i * 0.025,
              ease: easings.overshoot,
            }}
          />
        );
      })}
    </div>
  );
}

export default VerifyConfetti;

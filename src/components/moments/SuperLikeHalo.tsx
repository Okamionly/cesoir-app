"use client";

/**
 * SuperLikeHalo — pulsating pink halo for super-like celebration.
 *
 * Concentric pink (#EC4899) rings ripple outward 3× over ~1.5s. Designed
 * to trigger immediately after a super-like interaction.
 *
 * Respects reduced-motion — renders nothing when on.
 */

import { m, useReducedMotion } from "motion/react";
import { easings } from "@/lib/motion-design";

export interface SuperLikeHaloProps {
  /** Mount state — unmount to stop */
  active: boolean;
  /** Ring color (default pink). */
  color?: string;
  /** Max diameter ring reaches (px). */
  size?: number;
}

export function SuperLikeHalo({
  active,
  color = "#EC4899",
  size = 220,
}: SuperLikeHaloProps) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            border: `2px solid ${color}`,
            boxShadow: `0 0 24px ${color}`,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{
            duration: 1.5,
            delay: i * 0.25,
            ease: easings.out,
            repeat: 0,
          }}
        />
      ))}
    </div>
  );
}

export default SuperLikeHalo;

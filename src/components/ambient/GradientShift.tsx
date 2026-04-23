"use client";

/**
 * GradientShift — slow-scrolling gradient background for primary CTAs.
 *
 * Requires the underlying element to already have a linear-gradient
 * background-image. This wrapper animates `backgroundPosition` from
 * 0% → 100% → 0% over 8s, creating a slow wave effect.
 *
 * Recommended for: "Rejoindre", "Explorer", "Déverrouiller" buttons —
 * adds life without being noisy. Pair with `gradient-bg` or inline
 * gradients.
 *
 * Respects reduced-motion — renders children with no wrapper motion.
 */

import { m, useReducedMotion } from "motion/react";
import { ambient } from "@/lib/motion-design";

export interface GradientShiftProps {
  children: React.ReactNode;
  /** Class on the wrapper (should include the gradient). */
  className?: string;
  /** Loop duration (s). Default 8. */
  duration?: number;
  /** Passed through — for semantics when the wrapper IS the button. */
  as?: "div" | "span";
}

export function GradientShift({
  children,
  className,
  duration = 8,
  as = "div",
}: GradientShiftProps) {
  const reduced = useReducedMotion();
  const Tag = as === "span" ? m.span : m.div;
  if (reduced) {
    if (as === "span") return <span className={className}>{children}</span>;
    return <div className={className}>{children}</div>;
  }
  return (
    <Tag
      className={className}
      style={{ backgroundSize: "200% 200%" }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </Tag>
  );
}

export default GradientShift;

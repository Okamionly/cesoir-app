"use client";

/**
 * PageTransition — unified enter/exit transition for app routes.
 *
 * Lives under `src/components/motion/` (the canonical motion folder)
 * alongside `Magnetic`, `RackFocus`, and `MotionImage`. The existing
 * `src/components/ui/PageTransition.tsx` re-exports this one to avoid
 * breaking the app layout import.
 *
 * Respects `useReducedMotion()` — renders children with no wrapper
 * when users prefer reduced motion.
 *
 * Uses the `easings.out` curve from the design system instead of the
 * string "easeOut" so the signature stays consistent with the rest of
 * `motion-design.ts` and is tweakable from one place.
 */

import { m, useReducedMotion } from "motion/react";
import { easings } from "@/lib/motion-design";

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Disable enter animation (still mounts children). */
  disabled?: boolean;
}

export function PageTransition({ children, disabled = false }: PageTransitionProps) {
  const reduced = useReducedMotion();
  if (reduced || disabled) return <>{children}</>;
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: easings.out }}
    >
      {children}
    </m.div>
  );
}

export default PageTransition;

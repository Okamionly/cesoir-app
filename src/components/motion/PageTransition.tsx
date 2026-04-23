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
  // Fix (2026-04-24): keep DOM shape identical SSR/CSR. Previously we
  // conditionally returned <>{children}</> vs <m.div> based on
  // useReducedMotion(), which returns null on the server and can return
  // true on the client's first hydration. Different wrapper = hydration
  // mismatch ("server rendered HTML didn't match the client", typically
  // reported near the nearest text node like "Carte hors-ligne").
  //
  // Now we ALWAYS render the m.div wrapper — only the animation
  // properties degrade when reduced motion is requested. motion/react
  // handles `initial={false}` by skipping the enter animation entirely.
  const animate = !reduced && !disabled;
  return (
    <m.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={animate ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.3 : 0, ease: easings.out }}
    >
      {children}
    </m.div>
  );
}

export default PageTransition;

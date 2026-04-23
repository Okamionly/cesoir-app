"use client";

/**
 * PageTransition — unified enter/exit transition for app routes.
 *
 * Lives under `src/components/motion/` (the canonical motion folder)
 * alongside `Magnetic`, `RackFocus`, and `MotionImage`. The existing
 * `src/components/ui/PageTransition.tsx` re-exports this one to avoid
 * breaking the app layout import.
 *
 * SSR/CSR hydration safety (2026-04-24):
 * Both server and client render a plain `<div>` until `mounted` flips
 * true after first useEffect tick. Then we upgrade to the animated
 * `<m.div>` (or keep plain if the user prefers reduced motion).
 * This pattern avoids:
 *   - hydration mismatch (useReducedMotion returns null on SSR vs
 *     true/false on CSR → different DOM shape → "server HTML didn't
 *     match client" error near nearest visible text like "Carte hors-ligne")
 *   - Maximum update depth caused by motion/react treating each render
 *     as a new initial pass when the `initial` prop identity changes
 */

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { easings } from "@/lib/motion-design";

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Disable enter animation (still mounts children). */
  disabled?: boolean;
}

export function PageTransition({ children, disabled = false }: PageTransitionProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-hydration and reduced-motion paths: plain <div> wrapper.
  // Identical DOM shape across SSR + first-pass CSR = no mismatch.
  if (!mounted || reduced || disabled) {
    return <div>{children}</div>;
  }

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

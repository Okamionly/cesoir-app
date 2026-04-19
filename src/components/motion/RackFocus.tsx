"use client";

import { m, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * RackFocus — page/section enter wrapper that mimics the landing's cinematic
 * camera refocus (opacity + scale + blur). Use it as the outermost element of
 * a section to give the same "opening shot" feeling the landing has.
 *
 * Honors prefers-reduced-motion: degrades to a plain fade.
 *
 * Usage:
 *   <RackFocus className="px-6 pt-7">
 *     <h1>...</h1>
 *   </RackFocus>
 */
export interface RackFocusProps {
  children: ReactNode;
  className?: string;
  /** Delay before the rack begins (s). Default 0. */
  delay?: number;
  /** Total duration (s). Default 0.8. */
  duration?: number;
  /** Direction of the focus pull. "in" = sharpens from blur, "out" = softens. Default "in". */
  direction?: "in" | "out";
}

const easeOutExpo = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function RackFocus({
  children,
  className,
  delay = 0,
  duration = 0.8,
  direction = "in",
}: RackFocusProps) {
  const reducedMotion = useReducedMotion();

  const variants: Variants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2, delay } },
      }
    : direction === "in"
    ? {
        initial: { opacity: 0, scale: 0.97, filter: "blur(6px)" },
        animate: {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration, ease: easeOutExpo, delay },
        },
      }
    : {
        initial: { opacity: 0, scale: 1.03, filter: "blur(0px)" },
        animate: {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration, ease: easeOutExpo, delay },
        },
      };

  return (
    <m.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
    >
      {children}
    </m.div>
  );
}

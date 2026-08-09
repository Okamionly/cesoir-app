"use client";

/**
 * FloatEmoji — subtle float + tilt loop for decorative emoji.
 *
 * TranslateY ±4px with rotate ±2° over 3s — gives empty-state emoji
 * and hero glyphs a light, alive feel. Use in `EmptyState`, welcome
 * screens, or anywhere the emoji itself IS the composition.
 *
 * Respects reduced-motion — renders a static span.
 */

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export interface FloatEmojiProps {
  /** The emoji character (or any inline text). */
  children: React.ReactNode;
  /** Loop duration in seconds. Default 3. */
  duration?: number;
  /** Optional className — pass size classes here. */
  className?: string;
  /** ARIA — usually decorative. */
  ariaHidden?: boolean;
}

export function FloatEmoji({
  children,
  duration = 3,
  className,
  ariaHidden = true,
}: FloatEmojiProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || reduced) {
    return (
      <span className={className} aria-hidden={ariaHidden}>
        {children}
      </span>
    );
  }
  return (
    <m.span
      className={className}
      aria-hidden={ariaHidden}
      style={{ display: "inline-block" }}
      animate={{
        y: [0, -4, 0, 4, 0],
        rotate: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </m.span>
  );
}

export default FloatEmoji;

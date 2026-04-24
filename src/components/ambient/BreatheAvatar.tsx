"use client";

/**
 * BreatheAvatar — gentle "breathing" scale loop for hero avatars.
 *
 * Scale animates 1 → 1.03 → 1 over 4s (configurable), perpetually.
 * Pairs well with the MatchCinematic peer avatar, the /profile hero,
 * and any moment where the subject should feel alive but not
 * distracting.
 *
 * Wraps children — works with <Image>, <div>, SVG, anything.
 *
 * Respects reduced-motion — renders children untouched.
 */

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ambient } from "@/lib/motion-design";

export interface BreatheAvatarProps {
  children: React.ReactNode;
  /** Breath cycle duration in seconds. Default 4. */
  duration?: number;
  /** Optional wrapper className. */
  className?: string;
}

export function BreatheAvatar({
  children,
  duration = 4,
  className,
}: BreatheAvatarProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || reduced) return <div className={className}>{children}</div>;
  return (
    <m.div className={className} animate={ambient.breathe(duration)}>
      {children}
    </m.div>
  );
}

export default BreatheAvatar;

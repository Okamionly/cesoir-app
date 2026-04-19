"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

/**
 * Magnetic — wraps any element so it glides slightly toward the cursor when the
 * pointer comes within `radius` (px). Mirrors the SceneController.MagneticCTA
 * pattern from the landing, generalized for the in-app surfaces.
 *
 * Disabled on coarse pointers (touch) and for prefers-reduced-motion users —
 * the wrapped element renders without listeners, no visual change.
 *
 * Usage:
 *   <Magnetic strength={0.18} radius={90}>
 *     <button className="...">Modifier</button>
 *   </Magnetic>
 *
 * The wrapper is a `<motion.span>` (`display: inline-block`). Pass `as="div"`
 * if the child is a block-level element (e.g. a full-width CTA).
 */
export interface MagneticProps {
  children: ReactNode;
  /** Max travel multiplier (0.05 = subtle, 0.25 = punchy). Default 0.14. */
  strength?: number;
  /** Distance in px at which magnetism kicks in. Default 80. */
  radius?: number;
  /** Spring stiffness — higher = snappier follow. Default 260. */
  stiffness?: number;
  /** Spring damping — higher = less bounce. Default 22. */
  damping?: number;
  /** Inline-block by default; pass "div" for full-width buttons. */
  as?: "span" | "div";
  className?: string;
  ariaHidden?: boolean;
}

export function Magnetic({
  children,
  strength = 0.14,
  radius = 80,
  stiffness = 260,
  damping = 22,
  as = "span",
  className,
  ariaHidden,
}: MagneticProps) {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness, damping, mass: 0.6 });
  const springY = useSpring(y, { stiffness, damping, mass: 0.6 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const pull = 1 - dist / radius;
        x.set(dx * pull * strength);
        y.set(dy * pull * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion, radius, strength, x, y]);

  const Tag = as === "div" ? motion.div : motion.span;

  return (
    <Tag
      // motion 11+ accepts callback ref; cast keeps both spans/divs happy
      ref={ref as unknown as React.Ref<HTMLDivElement & HTMLSpanElement>}
      className={className}
      style={{ x: springX, y: springY, display: as === "div" ? "block" : "inline-block" }}
      aria-hidden={ariaHidden}
    >
      {children}
    </Tag>
  );
}

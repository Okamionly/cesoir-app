"use client";

import { motion } from "motion/react";
import { useCallback } from "react";
import { Confetti } from "./Confetti";
import { app } from "@/lib/design-tokens";

/* ── PulsingHeart ── */
export function PulsingHeart({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={active ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? app.violet : "none"}
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke={active ? app.violet : "currentColor"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

/* ── FlyingHeart ── */
export function FlyingHeart({ trigger }: { trigger: boolean }) {
  if (!trigger) return null;

  return (
    <motion.div
      className="pointer-events-none absolute"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -120, scale: 1.5 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      aria-hidden="true"
    >
      <svg width={28} height={28} viewBox="0 0 24 24" fill={app.violet}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </motion.div>
  );
}

/* ── SpinStar ── */
export function SpinStar({ trigger, size = 28 }: { trigger: boolean; size?: number }) {
  return (
    <motion.div
      animate={trigger ? { rotate: 360, scale: [1, 1.4, 1] } : { rotate: 0, scale: 1 }}
      transition={trigger ? { duration: 0.8, ease: "easeInOut" } : {}}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={trigger ? app.violet : "none"}
        stroke={trigger ? app.violet : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </motion.div>
  );
}

/* ── MatchExplosion ── */
export function MatchExplosion({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete?: () => void;
}) {
  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Haptic feedback when match occurs
  if (active && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 200]);
    } catch {
      // Vibration not supported
    }
  }

  return <Confetti active={active} onComplete={handleComplete} />;
}

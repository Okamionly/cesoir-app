"use client";

/**
 * useInteractive — standardized interactive-element motion props.
 *
 * Returns ready-to-spread motion/react props for buttons, chips, cards,
 * rows — anything that should feel responsive to tap/hover.
 *
 * - Respects `useReducedMotion()` (motion/react) → returns {} when on
 * - Respects `usePointerFine()` → `whileHover` only on mouse/trackpad
 * - Uses `springs.micro` for snappy perceived latency (<200ms)
 *
 * Shape mirrors the CeSoir Cinematic Hover pattern:
 *   whileTap   → 0.95 scale punch
 *   whileHover → 1.02 scale lift (fine pointers only)
 *   transition → springs.micro
 *
 * Usage:
 *   const interactive = useInteractive();
 *   <m.button {...interactive} onClick={...}>Click</m.button>
 *
 * Options:
 *   - disabled: skip all motion (returns {})
 *   - haptic: 'light'|'medium'|'heavy' — wires haptics.* on tap (opt-in)
 *   - scaleTap / scaleHover: override defaults
 */

import { useReducedMotion } from "motion/react";
import { useCallback } from "react";
import { springs } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { usePointerFine } from "./usePointerFine";

export interface UseInteractiveOptions {
  disabled?: boolean;
  haptic?: "light" | "medium" | "heavy";
  scaleTap?: number;
  scaleHover?: number;
}

export interface InteractiveProps {
  whileTap?: { scale: number };
  whileHover?: { scale: number };
  transition?: typeof springs.micro;
  onTapStart?: () => void;
}

export function useInteractive(
  opts: UseInteractiveOptions = {},
): InteractiveProps {
  const reduced = useReducedMotion();
  const pointerFine = usePointerFine();

  const { disabled = false, haptic, scaleTap = 0.95, scaleHover = 1.02 } = opts;

  const onTapStart = useCallback(() => {
    if (disabled || !haptic) return;
    try {
      if (haptic === "light") haptics.light?.();
      else if (haptic === "medium") haptics.medium?.();
      else haptics.heavy?.();
    } catch {
      /* unsupported device */
    }
  }, [disabled, haptic]);

  if (reduced || disabled) return haptic ? { onTapStart } : {};

  const props: InteractiveProps = {
    whileTap: { scale: scaleTap },
    transition: springs.micro,
  };
  if (pointerFine) props.whileHover = { scale: scaleHover };
  if (haptic) props.onTapStart = onTapStart;

  return props;
}

export default useInteractive;

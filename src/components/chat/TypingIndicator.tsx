"use client";

/**
 * Wave 17 — small "X écrit..." chip with 3 staggered animated dots.
 *
 * Lives ABOVE the chat input area (not in the messages scroll log).
 * The companion bubble that lives in the messages log is at
 * `components/messages/TypingIndicator.tsx`. We keep them separate
 * because:
 *   - the messages-log version takes the peer's name and renders a
 *     full chat bubble with a tail (matches the bubble grid).
 *   - this version is a compact chip that follows the input bar
 *     and respects safe-area bottom padding.
 *
 * Renders nothing (returns `null`) when `visible` is false so callers
 * can pass the boolean from `useTypingStatus` directly without an
 * `AnimatePresence` wrapper at the call site.
 */

import { m, useReducedMotion } from "motion/react";

interface TypingIndicatorProps {
  /** Show / hide the chip. When false, returns `null`. */
  visible: boolean;
  /** Display name to prefix the chip — defaults to a generic FR string. */
  peerName?: string;
}

export function TypingIndicator({
  visible,
  peerName,
}: TypingIndicatorProps) {
  const reducedMotion = useReducedMotion();
  if (!visible) return null;

  const label = peerName ? `${peerName} ecrit` : "ecrit";

  return (
    <m.div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex justify-start px-3 pt-1 pb-1"
      initial={reducedMotion ? undefined : { opacity: 0, y: 4 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-bg-card/80 px-2.5 py-1 text-[11px] text-text-muted backdrop-blur-sm">
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <m.span
              key={i}
              className="block w-1 h-1 rounded-full bg-accent"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [0, 1, 0],
                      opacity: [0.3, 1, 0.3],
                    }
              }
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.15,
                    }
              }
            />
          ))}
        </span>
      </div>
    </m.div>
  );
}

export default TypingIndicator;

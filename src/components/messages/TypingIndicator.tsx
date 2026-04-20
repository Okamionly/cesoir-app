"use client";

import { m, useReducedMotion } from "motion/react";
import { chatVariants } from "@/lib/motion-design";

interface TypingIndicatorProps {
  /** Optional name shown before the dots */
  peerName?: string;
  /** Label for the row — "ecrit" by default (FR) */
  label?: string;
}

/**
 * Violet three-dot bouncing indicator. Used both for "sending..." and
 * "peer is typing..." states. Reuses `chatVariants.typingDot` so the
 * timing matches the rest of the chat surface.
 */
export function TypingIndicator({ peerName, label = "ecrit" }: TypingIndicatorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="flex justify-start mt-2"
      role="status"
      aria-label={peerName ? `${peerName} ${label}` : "Envoi en cours"}
    >
      <m.div
        className="bg-bg-card rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center border border-border/60"
        initial={reducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.95 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: 4, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {peerName && (
          <span className="text-xs text-text-muted font-medium mr-0.5">
            {peerName} {label}
          </span>
        )}
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={reducedMotion ? undefined : chatVariants.typingDot(i)}
          />
        ))}
      </m.div>
    </div>
  );
}

export default TypingIndicator;

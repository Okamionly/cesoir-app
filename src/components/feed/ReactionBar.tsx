"use client";

/**
 * ReactionBar — 4 emoji reactions on a feed card.
 *
 * Click a reaction to toggle it (insert/delete via useFeedReactions). Active
 * state is highlighted and count shown.
 * Tapping triggers light haptic feedback. Fully keyboard + screen-reader
 * friendly: each button has aria-label + aria-pressed.
 */

import { useMemo } from "react";
import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import {
  REACTION_TYPES,
  REACTION_EMOJI,
  REACTION_LABEL,
  type ReactionCounts,
} from "@/lib/useFeedReactions";
import type { FeedReactionType } from "@/lib/supabase-types";

interface ReactionBarProps {
  feedActivityId: string;
  reactions: ReactionCounts;
  onToggle: (feedActivityId: string, reaction: FeedReactionType) => void | Promise<void>;
  /** Disable when no auth (buttons become visual-only). */
  disabled?: boolean;
}

export function ReactionBar({
  feedActivityId,
  reactions,
  onToggle,
  disabled = false,
}: ReactionBarProps) {
  const { reducedMotion } = useAccessibility();

  // Only show reaction chips with non-zero count OR always show all 4 if none
  const hasAny = useMemo(
    () => REACTION_TYPES.some((r) => reactions.counts[r] > 0 || reactions.mine[r]),
    [reactions],
  );

  return (
    <div
      className="mt-2 flex items-center gap-1.5 flex-wrap"
      role="group"
      aria-label="Réactions"
    >
      {REACTION_TYPES.map((reaction) => {
        const count = reactions.counts[reaction];
        const mine = reactions.mine[reaction];
        // Show chip if there's a count, it's mine, or no chips exist yet (initial render)
        const show = count > 0 || mine || !hasAny;
        if (!show) return null;

        const ariaPressed: "true" | "false" = mine ? "true" : "false";
        const label = count > 0
          ? `${REACTION_LABEL[reaction]} — ${count} réaction${count > 1 ? "s" : ""}${mine ? ", activé" : ""}`
          : `${REACTION_LABEL[reaction]}, aucune réaction`;

        return (
          <m.button
            key={reaction}
            type="button"
            disabled={disabled}
            aria-pressed={ariaPressed}
            aria-label={label}
            onClick={() => {
              if (disabled) return;
              haptics.light();
              void onToggle(feedActivityId, reaction);
            }}
            whileTap={reducedMotion ? undefined : { scale: 0.88, transition: springs.micro }}
            whileHover={reducedMotion ? undefined : { y: -1, transition: springs.gentle }}
            className={[
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
              "text-[11px] font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              mine
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-border bg-card text-text-muted hover:text-text",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {REACTION_EMOJI[reaction]}
            </span>
            {count > 0 && (
              <span className="tabular-nums leading-none">{count}</span>
            )}
          </m.button>
        );
      })}
    </div>
  );
}

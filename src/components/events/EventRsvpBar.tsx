"use client";

/**
 * EventRsvpBar — sticky bottom RSVP bar for /events/[id].
 *
 * States:
 *  - No RSVP yet : [ Je rejoins ] [ Peut-etre ] [ Pas cette fois ]
 *  - RSVP "going" : full-width "Tu y es ! Invite des amis →" green CTA
 *  - RSVP "maybe" : "Peut-etre" active chip + change actions
 *
 * Sits above the bottom nav (pad-bottom via env safe-area) and composes
 * with a subtle top border + backdrop blur to stand out above content.
 */

import Link from "next/link";
import type { Route } from "next";
import { m, type Transition } from "motion/react";
import { useCallback } from "react";
import { Check, UserPlus, X } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";
import { haptics } from "@/lib/haptics";
import { useInteractive } from "@/lib/hooks/useInteractive";
import type { RsvpStatus } from "@/lib/events-types";

export interface EventRsvpBarProps {
  eventId: string;
  /** Current RSVP state — null = not yet responded. */
  status: RsvpStatus | null;
  /** Called with the new status (or null to cancel). */
  onChange: (next: RsvpStatus | null) => void;
  saving?: boolean;
}

export default function EventRsvpBar({
  eventId,
  status,
  onChange,
  saving = false,
}: EventRsvpBarProps) {
  const handlePick = useCallback(
    (next: RsvpStatus | null) => {
      haptics.medium();
      onChange(next);
    },
    [onChange],
  );

  // Unified interactive motion props (tap/hover/reduced-motion guard)
  const cancelInteractive = useInteractive({ disabled: saving });
  const primaryInteractive = useInteractive({ disabled: saving, scaleTap: 0.96 });

  const inviteHref = `/chat?invite=${encodeURIComponent(eventId)}`;

  const isGoing = status === "going";
  const isMaybe = status === "maybe";

  return (
    <div
      className="fixed bottom-[60px] left-0 right-0 z-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-[440px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-border bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(10,10,10,0.85)] backdrop-blur-xl">
        <div className="px-4 py-3 max-w-lg mx-auto">
          {isGoing ? (
            <div className="flex items-center gap-2">
              <m.div
                className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white"
                style={{
                  background: app.gradient,
                  boxShadow: "0 4px 18px rgba(139,92,246,0.25)",
                }}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.elastic as Transition}
              >
                <Check size={16} strokeWidth={2.5} aria-hidden />
                <span className="truncate">Tu y es !</span>
              </m.div>
              <Link
                href={inviteHref as Route}
                className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3.5 py-2.5 text-[12px] font-semibold text-text hover:border-accent/40 transition-colors"
                aria-label="Inviter des amis a cet event"
              >
                <UserPlus size={14} strokeWidth={2} aria-hidden />
                Inviter
              </Link>
              <m.button
                type="button"
                onClick={() => handlePick(null)}
                {...cancelInteractive}
                disabled={saving}
                className="tap-target shrink-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-text disabled:opacity-50"
                aria-label="Annuler mon RSVP"
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </m.button>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              <m.button
                type="button"
                onClick={() => handlePick("going")}
                {...primaryInteractive}
                disabled={saving}
                aria-label="Confirmer ma participation à cet événement"
                className="flex-1 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{
                  background: app.gradient,
                  boxShadow: "0 4px 18px rgba(139,92,246,0.25)",
                }}
                transition={springs.snap as Transition}
              >
                Je rejoins
              </m.button>
              <m.button
                type="button"
                onClick={() => handlePick(isMaybe ? null : "maybe")}
                {...primaryInteractive}
                disabled={saving}
                aria-pressed={isMaybe}
                aria-label={isMaybe ? "Annuler la participation peut-être" : "Indiquer peut-être pour cet événement"}
                className={[
                  "rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  isMaybe
                    ? "bg-accent/15 text-accent border border-accent/40"
                    : "bg-card border border-border text-text-muted hover:text-text",
                ].join(" ")}
                transition={springs.snap as Transition}
              >
                Peut-etre
              </m.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

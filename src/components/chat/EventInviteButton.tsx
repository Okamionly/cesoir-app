"use client";

/**
 * EventInviteButton — opens a bottom sheet listing events the current user
 * has RSVP'd to. Selecting one fires `onInvite(event)` and closes the sheet.
 *
 * Used inside the chat `/chat/[id]` PlusMenu. The parent composes the final
 * message (e.g. "Je vais a [Techno Revolution] jeudi 22h. Tu viens ?").
 */

import { useState } from "react";
import Link from "next/link";
import { m, type Transition } from "motion/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import EmptyState from "@/components/ui/EmptyState";
import { useMyEvents } from "@/lib/useEvents";
import { springs } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import type { CesoirEvent } from "@/lib/events-types";

export interface EventInviteButtonProps {
  /** Called once a user picks an event. Receives the full event payload. */
  onInvite: (event: CesoirEvent) => void;
}

function formatShort(event: CesoirEvent): string {
  const d = new Date(event.startAt);
  const day = d.toLocaleDateString("fr-FR", { weekday: "short" });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} ${time} · ${event.venue.name}`;
}

export default function EventInviteButton({ onInvite }: EventInviteButtonProps) {
  const [open, setOpen] = useState(false);
  const { events, loading } = useMyEvents();

  return (
    <>
      <m.button
        type="button"
        onClick={() => {
          haptics.light();
          setOpen(true);
        }}
        whileTap={{ scale: 0.92 }}
        transition={springs.micro as Transition}
        className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
        aria-label="Inviter a un event"
      >
        <span className="text-lg" aria-hidden>
          🎟️
        </span>
      </m.button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Inviter a un event"
        snapPoints={[0.4, 0.75]}
        initialSnap={0}
      >
        {loading ? (
          <div className="py-10 text-center text-[13px] text-text-muted">
            Chargement de tes events…
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            emoji="🎧"
            title="Tu n'as pas encore rejoint d'event"
            subtitle="Rejoins-en un pour pouvoir le partager ici."
            actionLabel="Découvrir les soirées"
            actionHref="/events"
          />
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <m.button
                  type="button"
                  onClick={() => {
                    haptics.medium();
                    onInvite(ev);
                    setOpen(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.micro as Transition}
                  className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-3 text-left hover:border-accent/30 transition-colors"
                >
                  <div
                    aria-hidden
                    className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center"
                  >
                    <span className="font-display text-sm font-bold text-accent/85">
                      {ev.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text truncate">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {formatShort(ev)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-accent">
                    Inviter
                  </span>
                </m.button>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/events"
                className="block w-full rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-center text-[12px] font-semibold text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
              >
                Voir toutes les soirees
              </Link>
            </li>
          </ul>
        )}
      </BottomSheet>
    </>
  );
}

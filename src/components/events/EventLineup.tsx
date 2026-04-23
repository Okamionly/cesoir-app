"use client";

/**
 * EventLineup — vertical list of artists/DJs for an event.
 *
 * Each row shows the artist name + optional role badge (Headliner / Support)
 * and, when provided, a small cover image. If the lineup is empty the
 * component renders nothing — the parent decides whether to hide the section.
 */

import Image from "next/image";
import { m, type Transition } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { EventLineupSlot } from "@/lib/events-types";

export interface EventLineupProps {
  slots: EventLineupSlot[];
}

export default function EventLineup({ slots }: EventLineupProps) {
  if (slots.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label="Line-up">
      {slots.map((slot, i) => (
        <m.li
          key={`${slot.name}-${i}`}
          className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3"
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ ...(springs.heavy as Transition), delay: i * 0.05 }}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center">
            {slot.imageUrl ? (
              <Image
                src={slot.imageUrl}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span
                aria-hidden
                className="font-display text-sm font-bold text-accent/80"
              >
                {slot.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-text truncate">
              {slot.name}
            </p>
            {slot.role && (
              <p className="text-[11px] text-text-muted">{slot.role}</p>
            )}
          </div>
          {slot.startTime && (
            <span className="text-[11px] font-semibold text-accent">
              {new Date(slot.startTime).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </m.li>
      ))}
    </ul>
  );
}

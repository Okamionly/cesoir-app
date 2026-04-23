"use client";

/**
 * EventsWidget — Horizontal scroll of tonight/weekend events mounted
 * above the LiveTicker on the /feed page.
 *
 * Behaviour (U4, Wave 14):
 * - Shows up to 5 events starting within the next 48 h (Montpellier).
 * - Auto-titles "Ce soir" on weekday or "Ce week-end" Friday-Sunday.
 * - Tap a card → /events/[id].
 * - Renders NOTHING when there are no upcoming events (zero noise).
 * - Horizontal scroll with CSS snap — identical to MapCarousel.
 * - Respects reduced-motion via the shared useAccessibility hook.
 */

import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { useMemo, useSyncExternalStore } from "react";
import { springs, micro } from "@/lib/motion-design";
import { useEvents } from "@/lib/useEvents";
import { EVENT_CATEGORY_LABELS } from "@/lib/events-types";
import { Calendar, Zap } from "@/components/ui/lucide";
import { useAccessibility } from "@/components/ui/ReducedMotion";

/**
 * Subscribe to a 5-minute wall-clock tick. `useSyncExternalStore` is the
 * React-blessed way to read an external value (Date.now()) without tripping
 * the `react-hooks/purity` or `set-state-in-effect` lints.
 */
function subscribeTick(callback: () => void): () => void {
  const id = window.setInterval(callback, 5 * 60_000);
  return () => window.clearInterval(id);
}
function getNowMs(): number {
  return Date.now();
}
function getServerNowMs(): number {
  // SSR fallback — 0 means "skip client-only filters" on the server.
  return 0;
}

function isWeekend(): boolean {
  const dow = new Date().getDay();
  // Friday → Sunday lean "weekend" for copy decision
  return dow === 5 || dow === 6 || dow === 0;
}

function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dayShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return "Ce soir";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  if (isTomorrow) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

export default function EventsWidget() {
  const { reducedMotion } = useAccessibility();

  // Filter "tonight" triggers same-day filter in useEvents; we enrich client-side
  // to handle the 48h window since the hook doesn't expose custom date-ranges.
  const { events, loading } = useEvents({ when: "all", category: null });

  // Subscribe to wall-clock via useSyncExternalStore — the React-blessed
  // way to read an external value (Date.now()) without tripping
  // react-hooks/purity. Ticks every 5 min so events drop out as they start.
  const nowMs = useSyncExternalStore(subscribeTick, getNowMs, getServerNowMs);

  const upcoming = useMemo(() => {
    if (nowMs === 0) return [];
    const cutoffMs = nowMs + 48 * 60 * 60 * 1000;
    return events
      .filter((e) => {
        const t = new Date(e.startAt).getTime();
        return !Number.isNaN(t) && t <= cutoffMs;
      })
      .slice(0, 5);
  }, [events, nowMs]);

  if (loading || upcoming.length === 0) return null;

  const sectionTitle = isWeekend() ? "Ce week-end a Montpellier" : "Ce soir a Montpellier";

  return (
    <section
      className="px-4 pt-3 pb-1"
      aria-label="Evenements a venir"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
          <Zap size={12} strokeWidth={2.25} className="text-accent" aria-hidden="true" />
          {sectionTitle}
        </h2>
        <Link
          href="/events"
          className="text-[10px] font-semibold text-accent hover:opacity-80 tap-target"
          aria-label="Voir tous les events"
        >
          Tout voir
        </Link>
      </div>

      <div
        className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1"
        style={{ scrollSnapType: "x mandatory" }}
        role="list"
      >
        {upcoming.map((event, idx) => (
          <m.div
            key={event.id}
            role="listitem"
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 12, scale: 0.96 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ ...springs.snap, delay: reducedMotion ? 0 : idx * 0.04 }}
            className="shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <Link
              href={`/events/${event.id}`}
              className="block"
              aria-label={`${event.title} — ${dayShort(event.startAt)} ${timeOfDay(event.startAt)}`}
            >
              <m.div
                className="w-48 rounded-2xl overflow-hidden border border-border bg-card tap-target"
                whileTap={micro.tapScale}
                whileHover={reducedMotion ? undefined : { y: -2 }}
              >
                {/* Flyer — dark atmospheric backdrop for event vibe. */}
                <div
                  className="relative w-full aspect-[16/10]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-bg-dark), color-mix(in srgb, var(--color-bg-dark) 80%, var(--color-accent)))",
                  }}
                >
                  {event.flyerUrl ? (
                    <Image
                      src={event.flyerUrl}
                      alt={`Flyer ${event.title}`}
                      fill
                      sizes="192px"
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap
                        size={28}
                        strokeWidth={1.5}
                        className="text-warn"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-black/55 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
                    <Calendar
                      size={9}
                      strokeWidth={2}
                      className="text-white"
                      aria-hidden="true"
                    />
                    <span className="text-[9px] font-semibold text-white">
                      {dayShort(event.startAt)} · {timeOfDay(event.startAt)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-2.5">
                  <p className="text-[12px] font-bold text-text line-clamp-1 mb-0.5">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-text-muted line-clamp-1">
                    {event.venue.name}
                    {event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ""}
                  </p>
                  {event.categories.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {event.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase text-accent"
                          style={{
                            background:
                              "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                          }}
                        >
                          {EVENT_CATEGORY_LABELS[cat] ?? cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </m.div>
            </Link>
          </m.div>
        ))}
      </div>
    </section>
  );
}

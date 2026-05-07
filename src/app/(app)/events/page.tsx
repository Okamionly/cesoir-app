"use client";

/**
 * /events — Soirees listing page.
 *
 * Shotgun-inspired vertical list with:
 *   - Hero block ("Soirees a Montpellier" + counter)
 *   - Sticky filter chips (when + category)
 *   - Card list with cinematic hover pattern
 *   - Empty state when nothing matches the filter
 *
 * The hook `useEvents` is responsible for fetching + normalizing; this page
 * is rendering only. Filters are lifted into URL state would be a future
 * enhancement (kept client-local for now — no deep-link requirement yet).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { m, type Variants } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";
import ClosingSoonBar from "@/components/events/ClosingSoonBar";
import { useEvents } from "@/lib/useEvents";
import { announceToSR } from "@/components/ui/LiveRegion";
import {
  DEFAULT_EVENT_FILTERS,
  countActiveFilters,
  type EventFiltersState,
} from "@/lib/events-types";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";
import { Calendar } from "@/components/ui/lucide";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.heavy,
  },
};

export default function EventsPage() {
  const [filters, setFilters] = useState<EventFiltersState>(DEFAULT_EVENT_FILTERS);
  const { events, loading, error, totalThisWeek } = useEvents(filters);

  const headingSubtitle = useMemo(() => {
    const parts = ["Ce soir", "Ce week-end", "Tout l'été"];
    return parts.join(" · ");
  }, []);

  const filtersActive = countActiveFilters(filters) > 0;
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_EVENT_FILTERS);
  }, []);

  // a11y round 2 (2026-04-27): announce result count whenever a filter
  // change settles. Skips initial mount so users land on the page in silence
  // and only hear updates after they actively change something. Skips while
  // the events query is still loading so we don't announce stale counts.
  const lastAnnouncedRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    const count = events.length;
    if (lastAnnouncedRef.current === null) {
      // First settled load — record but don't announce.
      lastAnnouncedRef.current = count;
      return;
    }
    if (lastAnnouncedRef.current === count) return;
    lastAnnouncedRef.current = count;
    if (count === 0) {
      announceToSR("Aucune soirée correspondante", "polite");
    } else if (count === 1) {
      announceToSR("1 soirée trouvée", "polite");
    } else {
      announceToSR(`${count} soirées trouvées`, "polite");
    }
  }, [events.length, loading]);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Soirées"
        subtitle="Montpellier"
        icon={<span className="text-lg" aria-hidden>🎧</span>}
        iconAnimation="float"
        hairlineVariant="vert-violet"
      />

      {/* Urgency strip — only renders when at least one event qualifies and
          the user hasn't dismissed it for the current tab session. */}
      <ClosingSoonBar />

      {/* Hero */}
      <header className="px-4 pt-5 pb-2">
        <h2 className="font-display text-2xl font-bold text-text">
          Soirées à Montpellier
        </h2>
        <p className="mt-1 text-[13px] text-text-muted">{headingSubtitle}</p>
        {totalThisWeek > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-text-muted">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: app.vert }}
            />
            {totalThisWeek === 1
              ? "1 event cette semaine"
              : `${totalThisWeek} events cette semaine`}
          </div>
        )}
      </header>

      {/* Filters */}
      <section
        className="sticky top-[64px] z-20 bg-bg/85 backdrop-blur-md border-b border-border px-4 py-3"
        aria-label="Filtres"
      >
        <EventFilters value={filters} onChange={setFilters} resultCount={events.length} />
      </section>

      {/* List */}
      <main className="px-4 pt-4 pb-32" aria-label="Liste des soirées">
        {loading && events.length === 0 ? (
          <ul
            className="space-y-4"
            role="status"
            aria-label="Chargement des soirées"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card animate-pulse"
              >
                {/* Flyer placeholder (16/9) */}
                <div className="aspect-[16/9] w-full bg-border/50" />
                <div className="space-y-3 p-4">
                  {/* Date badge */}
                  <div className="h-3 w-24 rounded bg-border/40" />
                  {/* Title (2 lines) */}
                  <div className="space-y-2">
                    <div className="h-4 w-5/6 rounded bg-border/50" />
                    <div className="h-4 w-3/5 rounded bg-border/50" />
                  </div>
                  {/* Venue */}
                  <div className="h-3 w-2/3 rounded bg-border/30" />
                  {/* Chips + CTA row */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <div className="h-6 w-14 rounded-full bg-border/30" />
                      <div className="h-6 w-14 rounded-full bg-border/30" />
                    </div>
                    <div className="h-8 w-20 rounded-full bg-border/40" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : error && events.length === 0 ? (
          <EmptyState
            emoji="⚠️"
            title="Impossible de charger les events"
            subtitle="Vérifie ta connexion et réessaye dans un instant."
          />
        ) : events.length === 0 ? (
          <EventsEmptyState
            filtersActive={filtersActive}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <m.ul
            className="space-y-4"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {events.map((event) => (
              <m.li key={event.id} variants={itemVariants}>
                <EventCard event={event} />
              </m.li>
            ))}
          </m.ul>
        )}
      </main>
    </div>
  );
}

/**
 * Empty state for the events list. Shows a calming Calendar icon, a localized
 * copy that adapts to whether the user has filters active, and a CTA to clear
 * filters (when active) or reload (when not). The "Voir tous les events" CTA
 * resets the filter state so the user can see what is actually available.
 */
function EventsEmptyState({
  filtersActive,
  onClearFilters,
}: {
  filtersActive: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      role="status"
    >
      {/* Glow aura behind the icon */}
      <div className="relative mb-6">
        <m.div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.32), transparent 70%)",
            filter: "blur(28px)",
          }}
          animate={{
            opacity: [0.4, 0.75, 0.4],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,255,136,0.08))",
            boxShadow:
              "inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, transparent)",
          }}
          animate={ambient.float(6)}
        >
          <Calendar
            size={36}
            strokeWidth={1.6}
            className="text-accent"
            aria-hidden
          />
        </m.div>
      </div>

      <m.h2
        className="text-[17px] font-bold text-text mb-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        {filtersActive ? "Aucun résultat pour ces filtres" : "Pas de soirées ce soir"}
      </m.h2>

      <m.p
        className="text-[13px] text-text-muted max-w-[300px] leading-relaxed mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.2 }}
      >
        {filtersActive
          ? "Essaie de retirer un filtre — catégorie, date ou créneau — pour élargir les résultats."
          : "Aucune soirée n'est encore programmée ici. Reviens ce soir ou consulte les plans flash."}
      </m.p>

      <m.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.3 }}
      >
        {filtersActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white transition-all active:scale-95 tap-target"
            style={{
              background: app.gradient,
              boxShadow:
                "0 10px 30px color-mix(in srgb, var(--color-accent) 28%, transparent)",
            }}
          >
            Réinitialiser les filtres
            <span aria-hidden="true">{"→"}</span>
          </button>
        )}
        <a
          href="/plans"
          className="text-[13px] font-semibold text-accent underline-offset-2 hover:underline tap-target py-1"
        >
          Voir les plans flash ce soir
        </a>
      </m.div>
    </div>
  );
}

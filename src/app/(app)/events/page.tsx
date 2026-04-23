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

import { useMemo, useState } from "react";
import { m, type Variants } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";
import { useEvents } from "@/lib/useEvents";
import type { EventFiltersState } from "@/lib/events-types";
import { springs } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";
import { Loader2 } from "@/components/ui/lucide";

const DEFAULT_FILTERS: EventFiltersState = {
  when: "all",
  category: null,
};

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
  const [filters, setFilters] = useState<EventFiltersState>(DEFAULT_FILTERS);
  const { events, loading, error, totalThisWeek } = useEvents(filters);

  const headingSubtitle = useMemo(() => {
    const parts = ["Ce soir", "Ce week-end", "Tout l'ete"];
    return parts.join(" · ");
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Soirees"
        subtitle="Montpellier"
        icon={<span className="text-lg" aria-hidden>🎧</span>}
        iconAnimation="float"
        hairlineVariant="vert-violet"
      />

      {/* Hero */}
      <header className="px-4 pt-5 pb-2">
        <h2 className="font-display text-2xl font-bold text-text">
          Soirees a Montpellier
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
        <EventFilters value={filters} onChange={setFilters} />
      </section>

      {/* List */}
      <main className="px-4 pt-4 pb-32" aria-label="Liste des soirees">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <Loader2
              size={22}
              className="animate-spin"
              strokeWidth={1.8}
              aria-label="Chargement"
            />
          </div>
        ) : error && events.length === 0 ? (
          <EmptyState
            emoji="⚠️"
            title="Impossible de charger les events"
            subtitle="Verifie ta connexion et reessaye dans un instant."
          />
        ) : events.length === 0 ? (
          <EmptyState
            emoji="🌙"
            title="Rien de prevu pour ce moment"
            subtitle="Les events Montpellier arrivent bientot. Reviens vite."
            actionLabel="Voir tout"
            actionHref="/events"
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

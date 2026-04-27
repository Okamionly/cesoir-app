"use client";

/**
 * useClosingSoonEvents — derives a small set of "urgent" events to surface
 * in the `<ClosingSoonBar />` notification strip on the /events page.
 *
 * Data source: piggy-backs on `useEvents()` so we never issue an extra round
 * trip. Filtering is done client-side from the same normalized `CesoirEvent`
 * list that powers the main feed.
 *
 * Urgency taxonomy (MVP):
 *   - "starting_soon" — event starts within the next 3h. Highest priority.
 *   - "almost_full"   — event has spots_remaining < 5. NOTE: the current
 *                       `events` schema does NOT carry a capacity column,
 *                       so this branch is wired but stays dormant until a
 *                       future migration adds `door_capacity`. Keeping the
 *                       branch in code documents the intent and lets us flip
 *                       it on by populating `event.counts._capacity` later.
 *   - "trending"      — created in the last 24h and already has a non-trivial
 *                       RSVP count (>= 5 going + maybe). Acts as a "hype"
 *                       signal for newly-dropped events.
 *
 * Sort key: composite urgency score (starting_soon > almost_full > trending).
 * Returns at most `limit` items (default 3) so the bar can rotate cleanly
 * without overwhelming the user.
 *
 * Returning a stable empty array when nothing is urgent keeps the
 * `<ClosingSoonBar />` skip path predictable.
 */

import { useMemo } from "react";
import {
  DEFAULT_EVENT_FILTERS,
  type CesoirEvent,
  type EventFiltersState,
} from "@/lib/events-types";
import { useEvents } from "@/lib/useEvents";

// ─────────────────────────────────────────────────────────────
// Tunables (kept inline — easier to reason about than a config file).
// ─────────────────────────────────────────────────────────────

/** "Starting soon" window — events within this many ms get the top tier. */
const STARTING_SOON_WINDOW_MS = 3 * 60 * 60 * 1000; // 3h

/** "Trending" window — events created within this many ms are eligible. */
const TRENDING_CREATED_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

/** Minimum (going + maybe) count for a recent event to qualify as trending. */
const TRENDING_MIN_RSVPS = 5;

/** Threshold for the "almost full" branch (spots_remaining < this). */
const ALMOST_FULL_THRESHOLD = 5;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ClosingSoonReason = "starting_soon" | "almost_full" | "trending";

export interface ClosingSoonItem {
  /** The underlying event (full normalized shape). */
  event: CesoirEvent;
  /** Why this event surfaced in the urgency bar. */
  reason: ClosingSoonReason;
  /**
   * Numeric urgency score (higher = more urgent). Used purely for sorting;
   * not surfaced in UI. Kept on the item so callers can rerank if needed.
   */
  score: number;
  /**
   * Pre-rendered short message ready for the bar. The component is allowed
   * to override this (it has access to richer formatting helpers), but the
   * default is good enough for tests + simple rendering paths.
   */
  message: string;
}

export interface UseClosingSoonResult {
  items: ClosingSoonItem[];
  loading: boolean;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Capacity isn't part of the current `events` schema — this helper is the
 * one place to update once `door_capacity` lands. Returning `null` means
 * "unknown" and the "almost_full" branch stays dormant.
 */
function getSpotsRemaining(event: CesoirEvent): number | null {
  // Future: pull from event.counts._capacity or a top-level field.
  void event;
  return null;
}

function formatHourLabel(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function minutesUntil(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / 60_000);
}

/**
 * Builds a short FR notification line for a given urgency reason. Keep
 * messages under ~60 chars so they fit in a single line on small screens
 * without truncation.
 */
function buildMessage(
  event: CesoirEvent,
  reason: ClosingSoonReason,
  now: Date,
): string {
  const venue = event.venue?.name ?? "événement";

  if (reason === "starting_soon") {
    const start = new Date(event.startAt);
    const minutes = minutesUntil(start, now);
    if (minutes <= 0) return `${event.title} commence maintenant`;
    if (minutes < 60) return `${event.title} commence dans ${minutes}min`;
    if (minutes < 90) return `${event.title} commence dans 1h`;
    return `${event.title} ce soir ${formatHourLabel(start)}`;
  }

  if (reason === "almost_full") {
    const spots = getSpotsRemaining(event);
    if (spots !== null && spots > 0) {
      return spots === 1
        ? `1 place restante au ${venue}`
        : `${spots} places restantes au ${venue}`;
    }
    return `Derniers tickets — ${event.title}`;
  }

  // trending
  const total = event.counts.going + event.counts.maybe;
  return `${event.title} — ${total} intéressés ces dernières 24h`;
}

// ─────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────

export interface UseClosingSoonOptions {
  /** Cap the number of items returned. Default = 3 (matches bar capacity). */
  limit?: number;
  /**
   * Optional override for the underlying filter state. Defaults to
   * `DEFAULT_EVENT_FILTERS` (i.e. all upcoming events in the city) so the
   * urgency bar always reflects the unfiltered universe — even when the
   * user has narrowed the main feed.
   */
  filters?: EventFiltersState;
}

export function useClosingSoonEvents(
  options: UseClosingSoonOptions = {},
): UseClosingSoonResult {
  const { limit = 3, filters = DEFAULT_EVENT_FILTERS } = options;
  const { events, loading, error } = useEvents(filters);

  const items = useMemo<ClosingSoonItem[]>(() => {
    if (events.length === 0) return [];
    const now = new Date();
    const startingSoonCutoff = now.getTime() + STARTING_SOON_WINDOW_MS;
    const trendingCutoff = now.getTime() - TRENDING_CREATED_WINDOW_MS;

    const urgent: ClosingSoonItem[] = [];

    for (const event of events) {
      const startMs = new Date(event.startAt).getTime();
      const createdMs = new Date(event.createdAt).getTime();
      const totalRsvps = event.counts.going + event.counts.maybe;
      const spotsRemaining = getSpotsRemaining(event);

      // Tier 1 — starting soon. Most urgent. Compute a score so events
      // closest to "now" rank above events that are 2-3h out.
      if (startMs > now.getTime() && startMs <= startingSoonCutoff) {
        // Higher score for sooner events (cap at ~10000).
        const minutesAway = Math.max(1, (startMs - now.getTime()) / 60_000);
        const score = 10_000 + Math.round(1000 / minutesAway);
        urgent.push({
          event,
          reason: "starting_soon",
          score,
          message: buildMessage(event, "starting_soon", now),
        });
        continue;
      }

      // Tier 2 — almost full (dormant until capacity column lands).
      if (
        spotsRemaining !== null &&
        spotsRemaining > 0 &&
        spotsRemaining < ALMOST_FULL_THRESHOLD
      ) {
        const score = 5_000 + (ALMOST_FULL_THRESHOLD - spotsRemaining) * 100;
        urgent.push({
          event,
          reason: "almost_full",
          score,
          message: buildMessage(event, "almost_full", now),
        });
        continue;
      }

      // Tier 3 — trending. Recent + non-trivial RSVPs.
      if (
        Number.isFinite(createdMs) &&
        createdMs >= trendingCutoff &&
        totalRsvps >= TRENDING_MIN_RSVPS
      ) {
        const score = 1_000 + Math.min(totalRsvps, 200);
        urgent.push({
          event,
          reason: "trending",
          score,
          message: buildMessage(event, "trending", now),
        });
      }
    }

    // Sort by score desc, then by start time asc as a stable tie-breaker.
    urgent.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(a.event.startAt).getTime() -
        new Date(b.event.startAt).getTime()
      );
    });

    return urgent.slice(0, Math.max(0, limit));
  }, [events, limit]);

  return { items, loading, error };
}

// Exported for unit tests / snapshot debugging.
export const __internal__ = {
  STARTING_SOON_WINDOW_MS,
  TRENDING_CREATED_WINDOW_MS,
  TRENDING_MIN_RSVPS,
  ALMOST_FULL_THRESHOLD,
  buildMessage,
  getSpotsRemaining,
};

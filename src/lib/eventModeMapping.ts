/**
 * eventModeMapping — Maps a CeSoir mode → relevant event categories.
 *
 * Used by:
 * - /modes/[mode] page (Wave 14, U4) — "Events compatibles ce soir" section
 * - /map event filter (future) — optional category-filter by active mode
 *
 * Wave 15: 4 core modes only. TODO WAVE-16: revisit when killed modes return.
 *
 * Design heuristic: match mode intent to vibe categories.
 * - night-owl → nightlife (techno, house, electro, clubbing, rooftop)
 * - plus-one → all events (primary use-case is finding a +1 for an event)
 * - solo-diner → low-stakes social (apero, gratuit, rooftop)
 * - foodie-quest → curated tastings / rooftop dining
 *
 * We return **empty array** when no filtering should apply (i.e. "show all").
 */

import type { EventCategory } from "@/lib/events-types";
import type { ModeKey } from "@/lib/modes";

export const EVENT_CATEGORIES_BY_MODE: Record<ModeKey, EventCategory[]> = {
  "solo-diner": ["apero", "gratuit", "rooftop"],
  "plus-one": [], // all events — plus-one is explicitly "find a +1 for X"
  "night-owl": ["techno", "house", "electro", "clubbing", "rooftop"],
  "foodie-quest": ["rooftop", "apero", "gratuit"],
};

/** Returns the categories for a mode, or [] if mode should see all events. */
export function getCategoriesForMode(mode: ModeKey): EventCategory[] {
  return EVENT_CATEGORIES_BY_MODE[mode] ?? [];
}

/**
 * Filter a list of events down to those matching a given mode.
 * Empty category-set = no filter (returns all events).
 */
export function filterEventsByMode<T extends { categories: EventCategory[] }>(
  events: T[],
  mode: ModeKey,
): T[] {
  const cats = getCategoriesForMode(mode);
  if (cats.length === 0) return events;
  return events.filter((e) => cats.some((c) => e.categories.includes(c)));
}

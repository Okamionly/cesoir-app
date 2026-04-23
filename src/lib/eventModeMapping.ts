/**
 * eventModeMapping — Maps a CeSoir mode → relevant event categories.
 *
 * Used by:
 * - /modes/[mode] page (Wave 14, U4) — "Events compatibles ce soir" section
 * - /map event filter (future) — optional category-filter by active mode
 *
 * Design heuristic: match mode intent to vibe categories.
 * - night-owl → nightlife (techno, house, electro, clubbing, rooftop)
 * - plus-one → all events (primary use-case is finding a +1 for an event)
 * - solo-diner → low-stakes social (apero, gratuit, rooftop)
 * - foodie-quest → curated tastings / rooftop dining
 * - culture-club → live, jazz, rock, hip-hop
 * - sober-tonight → events without alcohol-centric vibe
 * - new-in-town / tourist → mainstream friendly (live, rooftop, gratuit)
 *
 * We return **empty array** when no filtering should apply (i.e. "show all").
 * This keeps call sites simple:
 *
 *   const cats = EVENT_CATEGORIES_BY_MODE[mode];
 *   const filtered = cats.length === 0 ? events : events.filter(e => cats.some(c => e.categories.includes(c)));
 */

import type { EventCategory } from "@/lib/events-types";
import type { ModeKey } from "@/lib/modes";

export const EVENT_CATEGORIES_BY_MODE: Record<ModeKey, EventCategory[]> = {
  "solo-diner": ["apero", "gratuit", "rooftop"],
  "plus-one": [], // all events — plus-one is explicitly "find a +1 for X"
  tourist: ["live", "rooftop", "gratuit", "jazz"],
  "night-owl": ["techno", "house", "electro", "clubbing", "rooftop"],
  breakup: ["live", "jazz", "gratuit"],
  "new-in-town": ["live", "rooftop", "gratuit", "apero"],
  langue: ["apero", "live", "gratuit"],
  "dog-date": ["gratuit", "rooftop"],
  seasonal: ["rooftop", "gratuit", "live"],
  "fit-date": ["gratuit"],
  "foodie-quest": ["rooftop", "apero", "gratuit"],
  "culture-club": ["live", "jazz", "rock", "hip-hop"],
  "sober-tonight": ["live", "jazz", "gratuit"],
  "gamer-night": ["clubbing", "electro"],
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

/**
 * Events (Soirées) — shared typed contract between U2 (data) and U3 (UI).
 *
 * The database-facing shapes live in `supabase-types.ts` (DbCesoirEvent,
 * DbEventRsvp). This module exposes the UI-friendly normalized shapes that
 * the `useEvents` hook will emit, plus the filter types. U3 codes against
 * this interface even before U2 lands the hook — once the hook is live,
 * it just needs to satisfy `UseEventsResult`.
 */

export type EventCategory =
  | "techno"
  | "house"
  | "jazz"
  | "electro"
  | "rock"
  | "hip-hop"
  | "live"
  | "rooftop"
  | "gratuit"
  | "clubbing"
  | "apero";

export type EventWhenFilter = "tonight" | "tomorrow" | "weekend" | "all";

export type RsvpStatus = "going" | "maybe" | "not_going";

/**
 * A lineup artist / DJ slot on an event.
 */
export interface EventLineupSlot {
  name: string;
  role?: string; // "Headliner", "Support", "B2B", etc.
  startTime?: string; // ISO
  imageUrl?: string;
}

/**
 * Normalized event shape consumed by all UI components. `useEvents` hook
 * is responsible for hydrating this from `events` + joined venue / rsvp
 * counts. Null venue geo is tolerated (map falls back gracefully).
 */
export interface CesoirEvent {
  id: string;
  title: string;
  description?: string | null;
  /** Event flyer 16/9 — Storage URL or CDN. */
  flyerUrl?: string | null;
  /** ISO datetime — start. */
  startAt: string;
  /** Optional ISO datetime — end. */
  endAt?: string | null;
  venue: {
    id?: string;
    name: string;
    neighborhood?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  city: string; // "Montpellier"
  categories: EventCategory[];
  lineup?: EventLineupSlot[];
  priceLabel?: string | null; // "Gratuit", "12€", "Sur liste"
  /** External ticketing URL (Shotgun, Dice, etc.). */
  ticketUrl?: string | null;
  /** Aggregate counts from `event_rsvps`. */
  counts: {
    going: number;
    maybe: number;
  };
  /** Up to 3 recent RSVP avatars for the stack preview. */
  attendeePreview: Array<{
    userId: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  /** Viewer's own RSVP — null if not yet responded. */
  myRsvp: RsvpStatus | null;
  createdAt: string;
}

/**
 * Price range bucket — maps to door_price_eur ranges used in filterEvents.
 * "free"  = door_price_eur is null or 0
 * "low"   = 0 < price <= 15
 * "mid"   = 15 < price <= 30
 * "high"  = price > 30
 */
export type EventPriceRange = "free" | "low" | "mid" | "high" | null;

/**
 * Distance bucket — approximate radius from user's last known position.
 * null = no distance filter.
 */
export type EventDistanceBucket = 2 | 5 | 10 | 20 | null;

/**
 * Filter state for the `/events` listing page.
 *
 * v2 additions (2026-04-27):
 * - `categories` replaces the single `category` field; allows multi-select
 *   from the bottom-sheet. `category` is kept as a deprecated alias that
 *   points to `categories[0] ?? null` — DO NOT add new usages.
 * - `priceRange` maps to `EventPriceRange` buckets.
 * - `distance` maps to `EventDistanceBucket` km radii.
 */
export interface EventFiltersState {
  when: EventWhenFilter;
  /** @deprecated use `categories` — kept for backward-compat with useEvents */
  category: EventCategory | null;
  /** Multi-select categories; empty array = "all categories". */
  categories: EventCategory[];
  priceRange: EventPriceRange;
  distance: EventDistanceBucket;
}

/** Default (no filter active) state. */
export const DEFAULT_EVENT_FILTERS: EventFiltersState = {
  when: "all",
  category: null,
  categories: [],
  priceRange: null,
  distance: null,
};

/** Count how many non-default filters are active (for badge display). */
export function countActiveFilters(f: EventFiltersState): number {
  let n = 0;
  if (f.when !== "all") n++;
  if (f.categories.length > 0) n++;
  if (f.priceRange !== null) n++;
  if (f.distance !== null) n++;
  return n;
}

/**
 * Shape `useEvents` hook emits. Match this interface in U2's impl.
 */
export interface UseEventsResult {
  events: CesoirEvent[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  /** Total count for the active filter — shown in the hero. */
  totalThisWeek: number;
}

/**
 * Shape `useEvent(eventId)` single-event hook emits.
 */
export interface UseEventResult {
  event: CesoirEvent | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setMyRsvp: (status: RsvpStatus | null) => Promise<void>;
  savingRsvp: boolean;
}

/**
 * Human-labelled catalog of event categories (FR).
 */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  techno: "Techno",
  house: "House",
  jazz: "Jazz",
  electro: "Electro",
  rock: "Rock",
  "hip-hop": "Hip-hop",
  live: "Live",
  rooftop: "Rooftop",
  gratuit: "Gratuit",
  clubbing: "Clubbing",
  apero: "Apero",
};

export const EVENT_CATEGORY_ORDER: EventCategory[] = [
  "techno",
  "house",
  "jazz",
  "electro",
  "rock",
  "hip-hop",
  "live",
  "rooftop",
  "gratuit",
];

/**
 * Short fallback label for the flyer image alt when the event has no title.
 */
export const DEFAULT_EVENT_ALT = "Flyer de la soiree";

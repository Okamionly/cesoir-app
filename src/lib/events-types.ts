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
 * Filter state for the `/events` listing page.
 */
export interface EventFiltersState {
  when: EventWhenFilter;
  category: EventCategory | null;
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

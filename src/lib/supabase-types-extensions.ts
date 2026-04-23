/**
 * Supabase type extensions — Wave 14 Events + Feed Reactions.
 *
 * Why this file exists
 * ─────────────────────
 * `supabase-types.generated.ts` is regenerated from the live DB via
 * `npm run db:types` and is the source of truth for column shapes on
 * all tables that existed when the generator was last run.
 *
 * However some Wave-14 tables (`events`, `event_rsvps`, `event_attendees`,
 * `popup_events`, `feed_reactions`) are NOT yet present in the generated
 * file — either because they were introduced via a partial migration or
 * because the project types haven't been regenerated since. The app relies
 * on them in several hooks/pages, so we document them here in a way that
 * the final `Database` export still type-checks every call site.
 *
 * Next steps
 * ──────────
 * When `npm run db:types` emits these tables (or the CI drift guard
 * forces a regen), delete this file and fold the row aliases back into
 * `supabase-types.ts` — the `Database` export will automatically pick
 * up the fully-typed versions from the generated file.
 */
import type {
  DbEvent,
  DbEventRsvp,
  DbEventAttendee,
  DbPopupEvent,
  DbFeedReaction,
} from "./supabase-types";

// ------------------------------------------------------------------
// Tables that are referenced in code but missing from the generated file.
// ------------------------------------------------------------------
export interface WaveFourteenTables {
  events: {
    Row: DbEvent;
    Insert: Partial<DbEvent> & Pick<DbEvent, "slug" | "title" | "venue_name" | "venue_location" | "starts_at">;
    Update: Partial<DbEvent>;
    Relationships: [];
  };
  event_rsvps: {
    Row: DbEventRsvp;
    Insert: Partial<DbEventRsvp> & Pick<DbEventRsvp, "event_id" | "user_id">;
    Update: Partial<DbEventRsvp>;
    Relationships: [];
  };
  event_attendees: {
    Row: DbEventAttendee;
    Insert: Partial<DbEventAttendee> & Pick<DbEventAttendee, "event_id" | "user_id">;
    Update: Partial<DbEventAttendee>;
    Relationships: [];
  };
  popup_events: {
    Row: DbPopupEvent;
    Insert: Partial<DbPopupEvent> & Pick<DbPopupEvent, "creator_id" | "title" | "event_time">;
    Update: Partial<DbPopupEvent>;
    Relationships: [];
  };
  feed_reactions: {
    Row: DbFeedReaction;
    Insert: Partial<DbFeedReaction> & Pick<DbFeedReaction, "feed_activity_id" | "user_id" | "reaction">;
    Update: Partial<DbFeedReaction>;
    Relationships: [];
  };
}

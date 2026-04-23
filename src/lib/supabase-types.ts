// ========================================
// CeSoir Supabase Database Types — canonical module
// ========================================
//
// The `Database` type exported from this file is composed of:
//   1. The fully-typed `public.Tables` / `public.Views` / `public.Functions`
//      produced by `supabase gen types` (`./supabase-types.generated.ts`).
//   2. Wave-14 tables not yet present in the generated file
//      (`./supabase-types-extensions.ts` — deleted automatically once the
//      generator emits them).
//
// Domain enums (Gender, InteractionAction, ModeType, ...) and the `Db*`
// aliases used throughout the app live in this file so callers have a
// single stable import path. The `Database` export is what
// `SupabaseClient<Database>` consumes.
//
// To refresh column shapes: `npm run db:types`.
// The CI drift guard (`db-types-drift` job) fails PRs when the generated
// file changes without a matching commit.

// ----------------------------------------
// Enums / Union Types
// ----------------------------------------

export type Gender = "homme" | "femme" | "autre";
export type LookingFor = "hommes" | "femmes" | "tous";
export type InteractionAction = "like" | "pass" | "superlike" | "report" | "block";
export type ReportReason =
  | "fake_profile"
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "underage"
  | "violence_threat"
  | "catfish"
  | "scam"
  | "other";
export type ReportStatus = "pending" | "reviewing" | "actioned" | "dismissed" | "escalated";
export type ModeType =
  | "solo-diner"
  | "plus-one"
  | "tourist"
  | "night-owl"
  | "breakup"
  | "new-in-town"
  | "langue"
  | "dog-date"
  | "seasonal";
export type SquadStatus = "active" | "full" | "closed";
export type FeedActivityType = "availability" | "looking" | "area" | "trending";
export type CheckinStatus = "active" | "safe" | "alert";

// ----------------------------------------
// Events (Wave 14 — Soirées rubric, migration 019)
// ----------------------------------------

export type EventCategory =
  | "techno" | "house" | "hip_hop" | "jazz" | "electro" | "rock" | "reggae"
  | "pop" | "afro" | "indie" | "dj_set" | "live_music"
  | "rooftop" | "bar" | "club" | "festival" | "open_air"
  | "gratuit" | "apero" | "afterwork" | "brunch"
  | "culture" | "expo" | "cinema" | "theatre";

export type RsvpStatus = "interested" | "going" | "maybe" | "cancelled";

export type EventSource = "manual_curated" | "partner" | "api";

// ----------------------------------------
// Existing Tables
// ----------------------------------------

export interface DbProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  looking_for: LookingFor;
  bio: string;
  avatar_url: string | null;
  location: unknown;
  city: string;
  is_online: boolean;
  is_verified: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface DbModeActivation {
  id: string;
  user_id: string;
  mode: ModeType;
  is_active: boolean;
  available_time: string;
  details: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface DbInteraction {
  id: string;
  from_user: string;
  to_user: string;
  action: InteractionAction;
  mode: string | null;
  created_at: string;
}

export interface DbConversation {
  id: string;
  user_a: string;
  user_b: string;
  mode: string | null;
  last_message_at: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface DbReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  conversation_id: string | null;
  rating: number; // 1-5
  tags: string[];
  comment: string;
  mode: string | null;
  anonymous: boolean;
  created_at: string;
}

export interface DbReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  created_at: string;
}

// ----------------------------------------
// New Feature Tables (Migration 002)
// ----------------------------------------

export interface DbSquad {
  id: string;
  name: string;
  creator_id: string;
  members: string[];
  mode: string | null;
  status: SquadStatus;
  created_at: string;
}

export interface DbSquadInvite {
  id: string;
  squad_id: string;
  inviter_id: string;
  code: string; // 6 chars unique
  used_by: string | null;
  created_at: string;
}

export interface DbFeedActivity {
  id: string;
  user_id: string;
  type: FeedActivityType;
  content: string;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export type FeedReactionType = "heart" | "fire" | "laugh" | "celebrate";

export interface DbFeedReaction {
  id: string;
  feed_activity_id: string;
  user_id: string;
  reaction: FeedReactionType;
  created_at: string;
}

export interface DbChallenge {
  id: string;
  user_id: string;
  challenge_type: string;
  progress: number;
  total: number;
  completed: boolean;
  xp_earned: number;
  date: string;
}

export interface DbAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  earned_at: string;
}

export interface DbKarmaTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface DbStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface DbPopupEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  venue: string;
  event_time: string;
  max_attendees: number;
  tags: string[];
  created_at: string;
}

export interface DbEventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbTrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  share_location: boolean;
  alert_no_checkin: boolean;
  share_route: boolean;
}

export interface DbCheckin {
  id: string;
  user_id: string;
  conversation_id: string | null;
  status: CheckinStatus;
  started_at: string;
  last_checkin_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  smart_notifications: boolean;
  mode_alerts: boolean;
  match_alerts: boolean;
  chat_messages: boolean;
  personality_type: string | null;
  onboarding_completed: boolean;
}

export interface DbAvailability {
  id: string;
  user_id: string;
  day_of_week: number; // 0-6
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  repeat_weekly: boolean;
}

// ----------------------------------------
// Events (Wave 14 — Soirées rubric)
// ----------------------------------------

export interface DbEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  flyer_url: string | null;
  venue_name: string;
  venue_address: string | null;
  /** PostGIS geography(point, 4326) — serialised as GeoJSON / WKB string by PostgREST. */
  venue_location: unknown;
  city_slug: string;
  starts_at: string;
  ends_at: string | null;
  door_price_eur: number | null;
  ticket_url: string | null;
  categories: EventCategory[];
  lineup: string[];
  featured: boolean;
  is_cancelled: boolean;
  source: EventSource;
  created_at: string;
  updated_at: string;
}

export interface DbEventWithCounts extends DbEvent {
  rsvp_count: number;
  going_count: number;
}

export interface DbEventRsvp {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  plus_ones: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------
// Matches View
// ----------------------------------------

export interface DbMatch {
  user_a: string;
  user_b: string;
  mode: string | null;
  matched_at: string;
}

// ----------------------------------------
// Database Type (Supabase-compatible)
// ----------------------------------------
//
// Composition:
//   - `GeneratedDatabase` comes from `supabase-types.generated.ts` (source
//     of truth, emitted by `supabase gen types`).
//   - `WaveFourteenTables` patches in Events + Feed Reactions tables that
//     the generator hasn't yet picked up.
// Once the generator emits Wave-14 tables, delete
// `supabase-types-extensions.ts` and drop the intersection below.
//
// We use a helper type `MergeTables` to union the generated and
// hand-patched table maps — a raw `A & B` intersection causes Postgrest's
// overload inference to collapse rows to `never` on shared table names.

import type { Database as GeneratedDatabase } from "./supabase-types.generated";
import type { WaveFourteenTables } from "./supabase-types-extensions";

type GenTables = GeneratedDatabase["public"]["Tables"];

// Union the two maps: generated tables keep their shapes; Wave-14 tables
// are layered on top without colliding with generated keys.
type MergedTables = {
  [K in keyof GenTables | keyof WaveFourteenTables]: K extends keyof GenTables
    ? GenTables[K]
    : K extends keyof WaveFourteenTables
      ? WaveFourteenTables[K]
      : never;
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: MergedTables;
  };
};

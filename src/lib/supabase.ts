import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

// Re-export all types from the centralized types file
export type { Database } from "./supabase-types";
export type {
  DbProfile,
  DbModeActivation,
  DbInteraction,
  DbConversation,
  DbMessage,
  DbReview,
  DbReport,
  DbSquad,
  DbSquadInvite,
  DbFeedActivity,
  DbChallenge,
  DbAchievement,
  DbKarmaTransaction,
  DbStreak,
  DbPopupEvent,
  DbEventAttendee,
  DbTrustedContact,
  DbCheckin,
  DbUserSettings,
  DbAvailability,
  DbMatch,
} from "./supabase-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

let _client: SupabaseClient<AnyDB> | null = null;

function getClient(): SupabaseClient<AnyDB> {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  _client = createClient(url, key);
  return _client;
}

/**
 * Lazy-initialized Supabase client — safe for SSR/prerender.
 * Uses permissive typing until proper types are generated
 * via `supabase gen types typescript`.
 */
export const supabase: SupabaseClient<AnyDB> = new Proxy({} as SupabaseClient<AnyDB>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

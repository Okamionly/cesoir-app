import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
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
  DbFeedReaction,
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

/**
 * Builds a Supabase client appropriate for the current runtime.
 *
 * Browser: `@supabase/ssr` `createBrowserClient` — reads/writes the same
 *   auth cookies that the server-side helpers (`/lib/supabase/server.ts`,
 *   middleware) rely on, so sessions survive full-page navigations.
 *
 * Node (SSR, API routes, edge worker bootstrap): plain anon client.
 *   Server code that needs an authed session should create its own client
 *   via `@/lib/supabase/server` (`createClient()`) or a Bearer-header
 *   client built from the incoming request — this singleton remains
 *   unauthenticated on the server by design.
 */
function getClient(): SupabaseClient<AnyDB> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  if (typeof window !== "undefined") {
    // Browser — cookie-aware client so session syncs with SSR/middleware.
    _client = createBrowserClient<AnyDB>(url, key);
  } else {
    // Server — unauthenticated anon client. Server code that needs a
    // session should use `@/lib/supabase/server` instead.
    _client = createClient<AnyDB>(url, key);
  }

  return _client;
}

/**
 * Lazy-initialized Supabase client — safe for SSR/prerender.
 *
 * In the browser this is a cookie-aware `@supabase/ssr` client; on the
 * server it's the plain anon client. Same import, correct runtime wiring.
 */
export const supabase: SupabaseClient<AnyDB> = new Proxy({} as SupabaseClient<AnyDB>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

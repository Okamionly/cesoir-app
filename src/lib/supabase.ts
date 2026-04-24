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
  DbEvent,
  DbEventWithCounts,
  DbEventRsvp,
  EventCategory,
  EventSource,
  RsvpStatus,
} from "./supabase-types";

/**
 * Client-side Supabase type alias.
 *
 * Server code (API routes, SSR helpers) uses `SupabaseClient<Database>`
 * — fully typed against the generated schema.
 *
 * Client code has years of hooks written against loose inference; forcing
 * `<Database>` across every call site would be a huge refactor with no
 * runtime benefit (the server is the trust boundary). The browser client
 * stays loosely typed to avoid a 100+ file churn. The canonical
 * `Database` import is still available for callers that want strict
 * typing on a specific query (e.g. `supabase.from<'events'>(...)` or
 * `.returns<Database["public"]["Tables"]["events"]["Row"]>()`).
 *
 * This is a documented, intentional escape hatch — not drift.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientDB = any;

let _client: SupabaseClient<ClientDB> | null = null;

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
function getClient(): SupabaseClient<ClientDB> {
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
    _client = createBrowserClient<ClientDB>(url, key);

    // 2026-04-24 fix (#14 hydration + #17 Realtime 401 loop):
    // `createBrowserClient` correctly reads the auth cookie for REST calls,
    // but it does NOT proactively call `realtime.setAuth()` during client
    // construction. AuthContext wires `onAuthStateChange` + a startup
    // `getSession().then(setAuth)` — both async. Any hook that subscribes
    // to a Realtime channel on mount (useLiveTicker, useChat, useFeed, …)
    // fires in the SAME render as AuthContext's first useEffect, so the
    // WebSocket opens with the anon key BEFORE setAuth runs. Supabase
    // rejects `postgres_changes` with "HTTP Authentication failed", the
    // client retries with 30s backoff forever, and the mismatched
    // logged-in-SSR vs logged-out-first-render tree triggers React #418.
    //
    // Fix: parse the session cookie synchronously right here and seed
    // realtime auth before the first React render mounts. AuthContext's
    // useEffect chain then keeps it refreshed (belt and suspenders).
    try {
      const match = document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (match?.[1]) {
        let raw = decodeURIComponent(match[1]);
        // Supabase 2024+ wraps the session JSON with a "base64-" prefix
        // for URL-safety; unwrap before parsing.
        if (raw.startsWith("base64-")) {
          raw = atob(raw.slice(7));
        }
        const parsed: unknown = JSON.parse(raw);
        let token: string | null = null;
        if (Array.isArray(parsed)) {
          // Some cookie shapes are [session, optional_refresh] tuples.
          const first = parsed[0] as { access_token?: string } | undefined;
          token = first?.access_token ?? null;
        } else if (parsed && typeof parsed === "object") {
          const obj = parsed as {
            access_token?: string;
            currentSession?: { access_token?: string };
          };
          token = obj.access_token ?? obj.currentSession?.access_token ?? null;
        }
        if (token) {
          _client.realtime.setAuth(token);
        }
      }
    } catch {
      // Cookie missing / malformed / Supabase upgraded the shape — fall
      // through. AuthContext's async setAuth will still catch up within a
      // few ms, at worst the first Realtime subscribe fails once and the
      // hook's retry loop hits the correct token on attempt 2.
    }
  } else {
    // Server — unauthenticated anon client. Server code that needs a
    // session should use `@/lib/supabase/server` instead.
    _client = createClient<ClientDB>(url, key);
  }

  return _client;
}

/**
 * Lazy-initialized Supabase client — safe for SSR/prerender.
 *
 * In the browser this is a cookie-aware `@supabase/ssr` client; on the
 * server it's the plain anon client. Same import, correct runtime wiring.
 */
export const supabase: SupabaseClient<ClientDB> = new Proxy({} as SupabaseClient<ClientDB>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

// Keep the `Database` import referenced so the canonical types file stays
// in the dependency graph even if only the proxy is consumed directly.
export type { SupabaseClient };
void 0 as unknown as Database;

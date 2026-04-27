/**
 * Analytics — PostHog + UTM acquisition layer.
 *
 * Wave 15 · CFO 10/10 (2026-04-23) — V3 owns the PostHog wiring and the seven
 * core-loop events. V6 adds the UTM / acquisition-channel layer below so every
 * event gets first-touch attribution for free, and the CFO dashboards in
 * docs/finance/UNIT_ECONOMICS.md can compute CAC payback without extra
 * server-side joins.
 *
 * Design rules:
 * - First-touch only: we persist the FIRST non-empty utm_source we see.
 *   Subsequent visits never overwrite — matches single-touch attribution.
 * - Stored in localStorage under `cesoir_utm`. Survives across tabs until
 *   `trackAcquisition()` flushes it into the Supabase `profiles` row.
 * - No PII is ever captured (no full URL, no referrer query string).
 * - Safe to call server-side: everything is guarded by `typeof window`.
 */

import posthog from "posthog-js";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Wave 15 · CPO — core-loop event catalog (7 events).
// ---------------------------------------------------------------------------
// Keep these names stable — funnel dashboards in PostHog depend on exact
// strings. Adding a new core event? Document it here + add to `CoreEvent`.
//
//   1. register_complete       — inscription réussie
//   2. onboarding_complete     — passe à /browse après onboarding
//   3. first_swipe             — 1er swipe toutes directions confondues
//   4. first_match             — 1er match (like mutuel)
//   5. first_chat_message      — 1er message envoyé dans un chat
//   6. first_plan_created      — 1er plan via "Proposer un plan"
//   7. first_irl_confirmed     — "We met" feedback positif après IRL
//   8. first_match_share       — 1er partage privacy-safe d'un match
//                                (texte + URL générique, JAMAIS d'identité peer)
// ---------------------------------------------------------------------------

export type CoreEvent =
  | "register_complete"
  | "onboarding_complete"
  | "first_swipe"
  | "first_match"
  | "first_chat_message"
  | "first_plan_created"
  | "first_irl_confirmed"
  | "first_match_share";

// ---------------------------------------------------------------------------
// PostHog initialization — idempotent, no-op without env key.
// ---------------------------------------------------------------------------

let _initialized = false;

/**
 * Initialize PostHog. Called once from the client layout wrapper. Idempotent
 * and safe to call repeatedly — does nothing if already loaded or if the
 * `NEXT_PUBLIC_POSTHOG_KEY` env var is absent (local dev / preview builds).
 */
export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  if (_initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    // Graceful degradation: the rest of the app still runs and events fall
    // back to logger.info (see `track()` below).
    _initialized = true;
    return;
  }

  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      autocapture: false, // Wave 15: only explicit core-loop events.
      capture_pageview: true,
      persistence: "localStorage+cookie",
    });
    // Expose on window so the legacy `getPostHog()` path below keeps working.
    (window as unknown as { posthog?: typeof posthog }).posthog = posthog;
  } catch (err) {
    logger.warn("analytics_posthog_init_failed", { err: String(err) });
  }
  _initialized = true;
}

// ---------------------------------------------------------------------------
// First-time event helper — fire a CoreEvent only once per browser.
// ---------------------------------------------------------------------------

const FIRED_KEY = "cesoir_analytics_fired";

function loadFired(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FIRED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFired(s: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIRED_KEY, JSON.stringify([...s]));
  } catch {
    /* quota exceeded — ignore */
  }
}

/**
 * Fire a CoreEvent only the FIRST time it's called for this browser.
 * Subsequent calls are silent no-ops. Use this for "first_*" events so we
 * measure activation, not repeat actions.
 */
export function trackFirstTime(
  event: CoreEvent,
  props: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const fired = loadFired();
  if (fired.has(event)) return;
  fired.add(event);
  saveFired(fired);
  track(event, props);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AcquisitionChannel =
  | "paid"
  | "organic"
  | "referral"
  | "direct"
  | "social"
  | "email"
  | "unknown";

export interface UTMData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_host: string | null;
  first_visit_at: string | null;
}

const STORAGE_KEY = "cesoir_utm";

// Ordered keyword set used to bucket a raw utm_source into a coarse channel.
// Matched case-insensitively. The first hit wins. Keep this list short — noisy
// channels should be normalised upstream (in the ad platform) not here.
const CHANNEL_HINTS: Array<{ channel: AcquisitionChannel; keywords: string[] }> = [
  { channel: "paid", keywords: ["meta_ads", "facebook_ads", "google_ads", "tiktok_ads", "cpc", "ppc", "paid"] },
  { channel: "social", keywords: ["instagram", "tiktok", "twitter", "linkedin", "facebook", "youtube", "snapchat"] },
  { channel: "email", keywords: ["email", "newsletter", "mailchimp", "resend"] },
  { channel: "referral", keywords: ["referral", "partner", "producthunt", "invite", "friend"] },
  { channel: "organic", keywords: ["organic", "seo", "blog"] },
];

// ---------------------------------------------------------------------------
// Channel inference
// ---------------------------------------------------------------------------

/**
 * Derive a coarse acquisition_channel from the raw UTM tuple.
 *
 * Priority:
 *   1. utm_medium says "cpc" / "ppc" / "paid" → "paid"
 *   2. utm_source matches a keyword → channel for that keyword
 *   3. No UTM but a referrer host → "referral"
 *   4. No UTM and no referrer → "direct"
 *   5. Otherwise → "unknown"
 */
export function inferChannel(utm: Partial<UTMData>): AcquisitionChannel {
  const src = (utm.utm_source ?? "").toLowerCase();
  const med = (utm.utm_medium ?? "").toLowerCase();

  if (["cpc", "ppc", "paid", "display"].includes(med)) return "paid";
  if (med === "email") return "email";
  if (med === "referral") return "referral";
  if (med === "social") return "social";
  if (med === "organic") return "organic";

  for (const { channel, keywords } of CHANNEL_HINTS) {
    if (keywords.some((k) => src.includes(k))) return channel;
  }

  if (!utm.utm_source && utm.referrer_host) return "referral";
  if (!utm.utm_source && !utm.referrer_host) return "direct";
  return "unknown";
}

// ---------------------------------------------------------------------------
// First-visit capture
// ---------------------------------------------------------------------------

function readUtmFromUrl(): Partial<UTMData> {
  if (typeof window === "undefined") return {};

  try {
    const params = new URLSearchParams(window.location.search);
    const pick = (k: string) => {
      const v = params.get(k);
      return v && v.length > 0 && v.length < 200 ? v : null;
    };

    let referrerHost: string | null = null;
    if (document.referrer) {
      try {
        referrerHost = new URL(document.referrer).host || null;
      } catch {
        referrerHost = null;
      }
    }

    return {
      utm_source: pick("utm_source"),
      utm_medium: pick("utm_medium"),
      utm_campaign: pick("utm_campaign"),
      utm_content: pick("utm_content"),
      referrer_host: referrerHost,
    };
  } catch (err) {
    logger.warn("analytics_read_utm_failed", { err: String(err) });
    return {};
  }
}

function readStoredUtm(): UTMData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UTMData;
  } catch {
    return null;
  }
}

function storeUtm(data: UTMData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage blocked — log once but do not break the page.
    logger.warn("analytics_localstorage_blocked", {});
  }
}

/**
 * Capture UTMs on the very first page load (idempotent).
 *
 * Should be called from the root layout or a top-level client component on
 * every mount. Will no-op after the first successful write for this browser.
 */
export function captureFirstVisit(): UTMData | null {
  if (typeof window === "undefined") return null;
  const existing = readStoredUtm();
  if (existing) return existing;

  const fromUrl = readUtmFromUrl();
  const data: UTMData = {
    utm_source: fromUrl.utm_source ?? null,
    utm_medium: fromUrl.utm_medium ?? null,
    utm_campaign: fromUrl.utm_campaign ?? null,
    utm_content: fromUrl.utm_content ?? null,
    referrer_host: fromUrl.referrer_host ?? null,
    first_visit_at: new Date().toISOString(),
  };

  storeUtm(data);
  return data;
}

export function getStoredUtm(): UTMData | null {
  return readStoredUtm();
}

export function clearStoredUtm(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// PostHog wrapper (graceful degradation)
// ---------------------------------------------------------------------------

// V3 wires the real PostHog client in this file. Until then these helpers
// fall back to structured logs so the rest of the app compiles + runs.
// Any `posthog` global installed by the PostHog SDK is picked up
// automatically.

type PostHogLike = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify?: (id: string, props?: Record<string, unknown>) => void;
};

function getPostHog(): PostHogLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { posthog?: PostHogLike };
  return w.posthog ?? null;
}

/** Emit a PostHog event with UTM context auto-attached (client-only). */
export function track(
  event: string,
  props: Record<string, unknown> = {},
): void {
  const ph = getPostHog();
  const utm = getStoredUtm();
  const payload = {
    ...props,
    ...(utm
      ? {
          first_touch_utm_source: utm.utm_source,
          first_touch_utm_campaign: utm.utm_campaign,
          first_touch_channel: inferChannel(utm),
        }
      : {}),
  };

  if (ph) {
    try {
      ph.capture(event, payload);
      return;
    } catch (err) {
      logger.warn("analytics_posthog_capture_failed", { event, err: String(err) });
    }
  }

  logger.info(`analytics_${event}`, payload);
}

// ---------------------------------------------------------------------------
// Acquisition flush — called at register_complete
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface TrackAcquisitionArgs {
  userId: string;
  /** Optional override — if omitted, reads from localStorage. */
  utm?: UTMData | null;
}

/**
 * Persist the first-touch UTM tuple on the user's profile row.
 *
 * Called once, right after the auth trigger creates the `profiles` row. Safe
 * to call multiple times — the Supabase update is gated on NULL source so a
 * subsequent call cannot overwrite an earlier attribution.
 */
export async function trackAcquisition(
  args: TrackAcquisitionArgs,
): Promise<void> {
  const utm = args.utm ?? getStoredUtm();
  if (!utm) {
    logger.info("acquisition_no_utm_stored", { userId: args.userId });
    return;
  }

  const channel = inferChannel(utm);

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content,
        referrer_host: utm.referrer_host,
        first_visit_at: utm.first_visit_at,
        acquisition_channel: channel,
      })
      .eq("id", args.userId)
      // Only write if we do NOT already have attribution — guarantees
      // single-touch.
      .is("utm_source", null);

    if (error) {
      logger.warn("acquisition_update_failed", {
        userId: args.userId,
        err: error.message,
      });
      return;
    }

    // Emit the corresponding PostHog event for CRO funnel analysis.
    track("acquisition_tracked", {
      channel,
      utm_source: utm.utm_source,
      utm_campaign: utm.utm_campaign,
    });
  } catch (err) {
    logger.error("acquisition_unexpected_error", {
      userId: args.userId,
      err: String(err),
    });
  }
}

/**
 * Identify the user to PostHog (wire once on sign-in / sign-up).
 * Keeps the event stream keyed off a stable user id instead of a browser
 * fingerprint.
 */
export function identifyUser(
  userId: string,
  traits: Record<string, unknown> = {},
): void {
  const ph = getPostHog();
  const utm = getStoredUtm();
  const props = {
    ...traits,
    ...(utm
      ? {
          acquisition_channel: inferChannel(utm),
          utm_source: utm.utm_source,
          utm_campaign: utm.utm_campaign,
        }
      : {}),
  };
  if (ph?.identify) {
    try {
      ph.identify(userId, props);
      return;
    } catch (err) {
      logger.warn("analytics_posthog_identify_failed", { err: String(err) });
    }
  }
  logger.info("analytics_identify", { userId, ...props });
}

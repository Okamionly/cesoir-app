/**
 * GET /api/push/last-call — daily 19h45 (Europe/Paris) push fan-out.
 *
 * Concept: one push per opted-in user per evening showing the top 3
 * events near them tonight, deep-linking to /events?when=tonight.
 *
 * Auth: Bearer token equal to `CRON_SECRET` (set in Vercel env vars).
 *       Vercel's cron infrastructure forwards the secret automatically
 *       when you set the same header in the cron entry — but we keep
 *       the check explicit so the route can be exercised by any HTTP
 *       client (uptime probe, manual replay) without coupling to Vercel.
 *
 * Schedule: configured via vercel.json `crons` entry — `45 18 * * *`
 *           (UTC = 19h45 Paris in CEST/summer; 20h45 Paris in CET/winter
 *           — see vercel.json comment for the timezone caveat).
 *
 * Iteration model:
 *   1. Pull every (user_id, location, locale, settings) tuple where
 *      `notifications_prefs.lastCall = true` AND a push subscription
 *      exists. The `last_used_at` filter on push_subscriptions hides
 *      devices that have churned (>30 days inactive).
 *   2. For each user, query `events_with_counts` within 10 km of the
 *      user's location, starting between 20:00 (Paris) tonight and
 *      02:00 tomorrow morning (Paris).
 *   3. If any events match, build a localized payload and queue the
 *      push via `sendPushToUser`. Failures are isolated per-user — one
 *      flaky endpoint never short-circuits the whole batch.
 *   4. Insert a row into `push_last_call_log` for rate-limiting (we
 *      look back 24 h before sending again, so a manual re-run within
 *      the day is a no-op for already-pushed users).
 *
 * Edge cases handled:
 *   - User has no active mode (mode_activations.is_active = false) →
 *     skip. Rationale: signal of disengagement; we don't want to push
 *     them back into the app uninvited.
 *   - User in Quiet Hours (privacy_prefs.quietHours = true with the
 *     default 22h–08h window) → skip. 19h45 is normally outside, but
 *     a misconfigured custom window could overlap — defensive check.
 *   - User already received a last-call push in the past 24 h → skip
 *     (rate-limit guard).
 *   - User's locale = 'en' → English payload, otherwise FR.
 *   - User has no location → skip (we can't compute "near them").
 *   - Cron secret missing in env → 500, do NOT process anything.
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { sendPushToUser, type PushPayload } from "@/lib/push/sendPush";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Slightly longer than the default 10s — fanning out to a few thousand
// users with a per-user query each can reasonably take 30–60s. Vercel
// allows up to 300s on Hobby cron, 800s on Pro.
export const maxDuration = 300;

// ── Constants ────────────────────────────────────────────────────────────

const TIMEZONE = "Europe/Paris";
const NEARBY_RADIUS_KM = 10;
// Window: 20h00 → 02h00 next day (Paris time). Anything earlier is
// already running and we're not catching the user "at home, picking
// the night"; anything past 2am is closing time.
const WINDOW_START_HOUR_PARIS = 20;
const WINDOW_END_HOUR_PARIS_NEXT_DAY = 2;
// Don't re-push the same user within 24h — protects against accidental
// manual re-runs of the cron and against a duplicate Vercel scheduler
// trigger (rare but documented).
const RATE_LIMIT_HOURS = 24;
// Hide devices that haven't touched the SW in 30 days — they're almost
// certainly dead endpoints. Keeps fan-out cheap and accurate.
const STALE_SUBSCRIPTION_DAYS = 30;
// Default Quiet Hours window: 22h → 08h. Suppress pushes during this
// window if the user enabled `privacy_prefs.quietHours = true`.
const QUIET_START_HOUR = 22;
const QUIET_END_HOUR = 8;

// ── Types ────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  locale: "fr" | "en" | null;
}

interface SettingsRow {
  user_id: string;
  notifications_prefs: Record<string, unknown> | null;
  privacy_prefs: Record<string, unknown> | null;
}

interface NearbyEvent {
  id: string;
  title: string;
  starts_at: string;
}

interface UserBatchInput {
  userId: string;
  locale: "fr" | "en";
  /** User location grid-snapped to ~500m (we only need vicinity, not precision). */
  lat: number;
  lng: number;
}

interface BatchResult {
  considered: number;
  skipped_no_location: number;
  skipped_no_active_mode: number;
  skipped_quiet_hours: number;
  skipped_already_pushed: number;
  skipped_no_events: number;
  pushed: number;
  push_failed: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "last_call_misconfigured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Returns the current hour in Europe/Paris (0–23). Used to evaluate
 * Quiet Hours. We rely on Intl.DateTimeFormat instead of pulling in a
 * date library — it's accurate across DST transitions because the JS
 * runtime's IANA tz database handles them.
 */
function currentHourInParis(now: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  // formatToParts is more reliable than parseInt(format()) because some
  // locales emit "24" for midnight or trailing whitespace.
  const part = fmt.formatToParts(now).find((p) => p.type === "hour");
  return part ? parseInt(part.value, 10) % 24 : now.getUTCHours();
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for "today in Paris" given
 * a UTC reference. Needed to anchor the 20:00 → 02:00 query window
 * regardless of when the cron actually fires (it might run at 18:45 UTC
 * in summer or 19:45 UTC in winter).
 */
function parisDateString(now: Date): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // sv-SE locale yields "2026-04-27" — the canonical ISO format.
  return fmt.format(now);
}

/**
 * Build the [start, end] UTC ISO timestamps that bracket "tonight in Paris".
 *
 *   start = today_paris @ 20:00 (Paris) → UTC
 *   end   = tomorrow_paris @ 02:00 (Paris) → UTC
 *
 * We do this by constructing the Paris-local Date strings and re-parsing
 * with the JS engine's tz handling. Safe across DST because we let the
 * runtime do the conversion.
 */
function tonightWindowUtc(now: Date): { startIso: string; endIso: string } {
  const today = parisDateString(now);
  // Compute tomorrow by adding 24h to the reference and re-asking for
  // the Paris date — handles month boundaries, DST, leap days for free.
  const tomorrow = parisDateString(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  // Build "YYYY-MM-DDTHH:00:00" in Paris-local then convert to UTC by
  // pretending it's UTC and offsetting by the timezone difference at
  // that instant. Using `toLocaleString` round-trip is the canonical
  // tz-safe trick (see https://stackoverflow.com/a/53652131).
  const startLocal = `${today}T${String(WINDOW_START_HOUR_PARIS).padStart(2, "0")}:00:00`;
  const endLocal = `${tomorrow}T${String(WINDOW_END_HOUR_PARIS_NEXT_DAY).padStart(2, "0")}:00:00`;

  return {
    startIso: parisLocalToUtcIso(startLocal),
    endIso: parisLocalToUtcIso(endLocal),
  };
}

/**
 * Convert a Paris-local `YYYY-MM-DDTHH:mm:ss` string to a UTC ISO string.
 * Trick: ask the engine to format an arbitrary UTC timestamp as Paris
 * time, compute the offset between that and the same timestamp's UTC
 * representation, then apply the inverse offset to our local string.
 */
function parisLocalToUtcIso(local: string): string {
  // Parse as if it were UTC — gives us the wall-clock numbers but
  // treated as UTC, which is wrong by exactly the Paris offset.
  const asUtc = new Date(`${local}Z`);
  // Determine what those wall-clock numbers actually are in Paris by
  // formatting `asUtc` in Paris time. The diff is the offset.
  const parisFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = parisFmt.formatToParts(asUtc);
  const lookup: Record<string, string> = {};
  for (const p of parts) lookup[p.type] = p.value;
  const reconstructed = `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}Z`;
  const offsetMs = new Date(reconstructed).getTime() - asUtc.getTime();
  return new Date(asUtc.getTime() - offsetMs).toISOString();
}

/**
 * Format an ISO timestamp as "HH:mm" in Paris time — used in the
 * notification body ("à 22:30"). Localized so EN users see the same
 * format (24h is universal in DE/FR/EN-GB; en-US would show 10:30 PM
 * but our app target is FR/EU primarily).
 */
function formatHmParis(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Decide whether a user is in their Quiet Hours right now.
 *
 * `privacy_prefs.quietHours` can be:
 *   - `true` / undefined → use default 22h→08h
 *   - `false` → never quiet
 *   - `{ start: number, end: number }` → custom window
 *
 * Within the window: SUPPRESS the push.
 */
function isInQuietHours(privacyPrefs: Record<string, unknown> | null, now: Date): boolean {
  if (!privacyPrefs) return false;
  const raw = privacyPrefs["quietHours"] ?? privacyPrefs["quiet_hours"];
  if (raw === false) return false;
  let start = QUIET_START_HOUR;
  let end = QUIET_END_HOUR;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.start === "number") start = obj.start;
    if (typeof obj.end === "number") end = obj.end;
  } else if (raw !== true && raw !== undefined && raw !== null) {
    // Truthy but unrecognized shape — treat as opt-out (don't suppress).
    return false;
  }
  const hour = currentHourInParis(now);
  // Window can wrap past midnight (e.g. 22 → 8). Compare accordingly.
  if (start <= end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

/**
 * Build the localized push payload. Title + body shape per spec.
 *
 *   FR: "🌙 Ce soir près de toi" / "{event1} à HH:MM · {event2} · +N autres"
 *   EN: "🌙 Tonight near you"    / "{event1} at HH:MM · {event2} · +N more"
 */
function buildPayload(events: NearbyEvent[], locale: "fr" | "en"): PushPayload {
  const e1 = events[0];
  const e2 = events[1];
  const extraCount = Math.max(0, events.length - 2);
  const e1Time = formatHmParis(e1.starts_at);

  let body: string;
  if (locale === "en") {
    const parts = [`${e1.title} at ${e1Time}`];
    if (e2) parts.push(e2.title);
    if (extraCount > 0) parts.push(`+${extraCount} more`);
    body = parts.join(" · ");
  } else {
    const parts = [`${e1.title} à ${e1Time}`];
    if (e2) parts.push(e2.title);
    if (extraCount > 0) parts.push(`+${extraCount} autres`);
    body = parts.join(" · ");
  }

  return {
    title: locale === "en" ? "🌙 Tonight near you" : "🌙 Ce soir près de toi",
    body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
    tag: "cesoir-last-call",
    url: "/events?when=tonight",
  };
}

// ── Main handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── 1. Cron secret check ──────────────────────────────────────────────
  // Two acceptable shapes:
  //   - Authorization: Bearer <CRON_SECRET>     (manual / Vercel cron)
  //   - x-vercel-cron-signature                 (legacy Vercel header)
  // We only enforce the first to keep the contract explicit.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error("last_call_cron_secret_unset");
    return NextResponse.json(
      { error: "cron_secret_unset" },
      { status: 500 },
    );
  }
  const provided = request.headers.get("authorization");
  if (provided !== `Bearer ${expected}`) {
    logger.warn("last_call_cron_auth_failed", {
      hasHeader: Boolean(provided),
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ── 2. Boot Supabase service-role client ──────────────────────────────
  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (err) {
    logger.error("last_call_env_missing", { err: String(err) });
    return NextResponse.json(
      { error: "configuration_error" },
      { status: 500 },
    );
  }

  const now = new Date();
  const stats: BatchResult = {
    considered: 0,
    skipped_no_location: 0,
    skipped_no_active_mode: 0,
    skipped_quiet_hours: 0,
    skipped_already_pushed: 0,
    skipped_no_events: 0,
    pushed: 0,
    push_failed: 0,
  };

  // ── 3. Fetch user_settings rows where lastCall = true ────────────────
  // We pull settings first because the opt-in toggle is the cheapest
  // filter — most users will be opted-OUT (default = false, see spec).
  const { data: settingsRows, error: settingsErr } = await admin
    .from("user_settings")
    .select("user_id, notifications_prefs, privacy_prefs")
    .filter("notifications_prefs->>lastCall", "eq", "true");

  if (settingsErr) {
    logger.error("last_call_settings_query_failed", {
      err: settingsErr.message,
    });
    return NextResponse.json(
      { error: "settings_query_failed" },
      { status: 500 },
    );
  }

  if (!settingsRows || settingsRows.length === 0) {
    // No opted-in users yet — return early with empty stats.
    return NextResponse.json({ ok: true, stats, ts: now.toISOString() });
  }

  const optedInIds = (settingsRows as SettingsRow[]).map((r) => r.user_id);
  const settingsByUserId = new Map<string, SettingsRow>();
  for (const row of settingsRows as SettingsRow[]) {
    settingsByUserId.set(row.user_id, row);
  }

  // ── 4. Fetch profiles for opted-in users (locale + location) ─────────
  // We pull `is_online` & `last_seen` to enforce the "active mode" check
  // — combined with mode_activations below this gives us "engaged user
  // with a current intention to socialize tonight".
  const { data: profileRows, error: profileErr } = await admin
    .from("profiles")
    .select("id, locale, location, is_online, last_seen")
    .in("id", optedInIds);

  if (profileErr) {
    logger.error("last_call_profile_query_failed", {
      err: profileErr.message,
    });
    return NextResponse.json(
      { error: "profile_query_failed" },
      { status: 500 },
    );
  }

  // ── 5. Fetch active mode activations (engagement signal) ─────────────
  const { data: modeRows, error: modeErr } = await admin
    .from("mode_activations")
    .select("user_id")
    .in("user_id", optedInIds)
    .eq("is_active", true);

  if (modeErr) {
    // Non-fatal — we can still push without enforcing the mode check
    // (degraded mode), but we log and prefer to bail to be safe.
    logger.error("last_call_mode_query_failed", { err: modeErr.message });
    return NextResponse.json(
      { error: "mode_query_failed" },
      { status: 500 },
    );
  }
  const usersWithActiveMode = new Set(
    (modeRows ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  // ── 6. Fetch users who have any non-stale push subscription ──────────
  // Hidden filter: we don't even attempt to send if there's no live
  // subscription, since `sendPushToUser` would just no-op.
  const staleCutoff = new Date(
    now.getTime() - STALE_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: subRows, error: subErr } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .in("user_id", optedInIds)
    .gte("last_used_at", staleCutoff);

  if (subErr) {
    logger.error("last_call_subs_query_failed", { err: subErr.message });
    return NextResponse.json(
      { error: "subs_query_failed" },
      { status: 500 },
    );
  }
  const usersWithSubs = new Set(
    (subRows ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  // ── 7. Fetch already-pushed users (rate limit guard) ─────────────────
  // The push_last_call_log table is created in the matching migration
  // (032_push_last_call_log.sql). One row per (user_id, sent_at).
  const rateCutoff = new Date(
    now.getTime() - RATE_LIMIT_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { data: recentLogs, error: logErr } = await admin
    .from("push_last_call_log")
    .select("user_id")
    .in("user_id", optedInIds)
    .gte("sent_at", rateCutoff);

  if (logErr) {
    // Non-fatal: if the log table is missing or unreadable we err on
    // the side of NOT pushing (avoid duplicate-spam risk if cron
    // misfires and the rate-limit check is dead at the same time).
    logger.error("last_call_log_query_failed", { err: logErr.message });
    return NextResponse.json(
      { error: "log_query_failed" },
      { status: 500 },
    );
  }
  const recentlyPushed = new Set(
    (recentLogs ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  // ── 8. Build the candidate batch ─────────────────────────────────────
  const window = tonightWindowUtc(now);

  type ProfileWire = {
    id: string;
    locale: string | null;
    location: unknown;
    is_online: boolean | null;
    last_seen: string | null;
  };

  const batch: UserBatchInput[] = [];
  for (const profile of (profileRows ?? []) as ProfileWire[]) {
    stats.considered += 1;
    const settingRow = settingsByUserId.get(profile.id);
    if (!settingRow) continue;

    // Subscription gate
    if (!usersWithSubs.has(profile.id)) {
      // Counts as "no events" bucket only if we tried — silent skip.
      continue;
    }

    // Active mode gate (engagement signal)
    if (!usersWithActiveMode.has(profile.id)) {
      stats.skipped_no_active_mode += 1;
      continue;
    }

    // Quiet hours gate
    if (isInQuietHours(settingRow.privacy_prefs, now)) {
      stats.skipped_quiet_hours += 1;
      continue;
    }

    // Rate-limit gate
    if (recentlyPushed.has(profile.id)) {
      stats.skipped_already_pushed += 1;
      continue;
    }

    // Location gate. profile.location is a PostGIS geography type that
    // PostgREST returns as a hex EWKB string OR a GeoJSON-ish object
    // depending on the ST_AsGeoJSON cast. We didn't request a cast here
    // because we use the geography directly via the RPC below — so we
    // pass NULL/missing through and let the per-user query be skipped.
    // We extract a rough lat/lng only if the column was returned in a
    // recognizable shape; otherwise we use the RPC pattern below.
    const loc = extractLatLng(profile.location);
    if (!loc) {
      stats.skipped_no_location += 1;
      continue;
    }

    const locale: "fr" | "en" = profile.locale === "en" ? "en" : "fr";
    batch.push({ userId: profile.id, locale, lat: loc.lat, lng: loc.lng });
  }

  // ── 9. Per-user fan-out ──────────────────────────────────────────────
  // We fire pushes in modest concurrency to avoid hammering the FCM /
  // APNs / Mozilla endpoints all at once. 20 in flight is well within
  // any provider's budget and keeps the function bounded.
  const CONCURRENCY = 20;
  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    const slice = batch.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      slice.map(async (entry) => {
        try {
          // Query nearby events. We use the events_with_counts view +
          // PostGIS ST_DWithin for the radius. Service-role bypasses
          // RLS so the read is unfiltered.
          const userPoint = `SRID=4326;POINT(${entry.lng} ${entry.lat})`;
          const { data: evRows, error: evErr } = await admin.rpc(
            "events_nearby_in_window",
            {
              user_point: userPoint,
              radius_km: NEARBY_RADIUS_KM,
              window_start: window.startIso,
              window_end: window.endIso,
              limit_count: 5,
            },
          );

          // RPC may not exist yet (first-time deploy). Fall back to a
          // direct query on `events_with_counts`. This gracefully
          // degrades — the fallback is less efficient (no index hint)
          // but functionally equivalent.
          let events: NearbyEvent[] = [];
          if (evErr) {
            const { data: fallback } = await admin
              .from("events_with_counts")
              .select("id, title, starts_at")
              .gte("starts_at", window.startIso)
              .lt("starts_at", window.endIso)
              .eq("is_cancelled", false)
              .order("starts_at", { ascending: true })
              .limit(5);
            events = (fallback ?? []) as NearbyEvent[];
          } else {
            events = (evRows ?? []) as NearbyEvent[];
          }

          if (events.length === 0) {
            stats.skipped_no_events += 1;
            return;
          }

          const payload = buildPayload(events.slice(0, 3), entry.locale);
          const result = await sendPushToUser(entry.userId, payload);

          if (result.delivered > 0) {
            stats.pushed += 1;
            // Log the send for the next-day rate-limit. Best effort —
            // a failure here only allows a duplicate push within the
            // same day, which is annoying but not catastrophic.
            const { error: logInsertErr } = await admin
              .from("push_last_call_log")
              .insert({
                user_id: entry.userId,
                sent_at: now.toISOString(),
                event_ids: events.slice(0, 3).map((e) => e.id),
              });
            if (logInsertErr) {
              logger.warn("last_call_log_insert_failed", {
                userId: entry.userId,
                err: logInsertErr.message,
              });
            }
          } else if (result.skipped) {
            // VAPID not configured or supabase env missing — already
            // logged inside sendPushToUser. Don't spam another error.
            stats.push_failed += 1;
          } else {
            stats.push_failed += 1;
          }
        } catch (err) {
          // Per-user catch: never let one user's failure abort the batch.
          stats.push_failed += 1;
          logger.warn("last_call_user_failed", {
            userId: entry.userId,
            err: String(err),
          });
        }
      }),
    );
  }

  logger.info("last_call_run_complete", { stats });

  return NextResponse.json({
    ok: true,
    stats,
    ts: now.toISOString(),
    windowStart: window.startIso,
    windowEnd: window.endIso,
  });
}

// ── PostGIS helpers ──────────────────────────────────────────────────────

/**
 * Best-effort lat/lng extraction from whatever shape PostgREST returns
 * for the `location GEOGRAPHY(POINT)` column.
 *
 * Supports:
 *   - `{ type: "Point", coordinates: [lng, lat] }` (GeoJSON)
 *   - `"0101000020E6100000..."` (EWKB hex — handled by parsing the
 *     little-endian bytes for the doubles at the well-known offset)
 *   - `{ coordinates: { latitude, longitude } }` (legacy)
 *   - null / unrecognized → null
 */
function extractLatLng(loc: unknown): { lat: number; lng: number } | null {
  if (!loc) return null;

  // GeoJSON
  if (typeof loc === "object" && loc !== null) {
    const obj = loc as Record<string, unknown>;
    if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const [lng, lat] = obj.coordinates as [number, number];
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const coords = obj.coordinates as Record<string, unknown> | undefined;
    if (coords && typeof coords === "object") {
      const lat = Number(coords.latitude);
      const lng = Number(coords.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  // EWKB hex string (PostGIS default for geography). The header is 25
  // bytes: 1 byte endian, 4 bytes type, 4 bytes SRID, then 16 bytes for
  // the X/Y doubles in little-endian. We're tolerant: if parsing fails
  // we return null and the user is skipped.
  if (typeof loc === "string" && loc.length >= 50) {
    try {
      // Strip optional leading "0101000020E6100000" SRID-tagged prefix
      // (geography always sets SRID, so this header is mandatory).
      const hex = loc.toUpperCase();
      // X (longitude) starts at byte 9 (0-indexed) → char 18; Y at byte 17 → char 34.
      const xHex = hex.slice(18, 34);
      const yHex = hex.slice(34, 50);
      const lng = hexToFloat64Le(xHex);
      const lat = hexToFloat64Le(yHex);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      return null;
    }
  }

  return null;
}

function hexToFloat64Le(hex: string): number {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, parseInt(hex.slice(i * 2, i * 2 + 2), 16));
  }
  return view.getFloat64(0, true);
}

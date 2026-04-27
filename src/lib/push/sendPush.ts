/**
 * Server-only push delivery helper (Wave 16 Bet #4).
 *
 * `sendPushToUser(userId, payload)` fans out a single push payload to
 * every device the user has registered via /api/push/subscribe.
 * Stale endpoints (404 / 410 from FCM/APNs/Mozilla) are deleted on the
 * fly so the next call doesn't waste a network round-trip.
 *
 * REQUIRED env vars (set in Vercel for Production + Preview + Dev):
 *   - VAPID_PUBLIC_KEY          (also exposed as NEXT_PUBLIC_VAPID_PUBLIC_KEY for the hook)
 *   - VAPID_PRIVATE_KEY         (server-only — DO NOT prefix with NEXT_PUBLIC_)
 *   - VAPID_SUBJECT             (mailto: or https:// URL identifying the sender)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (server-only — bypasses RLS)
 *
 * In dev these can be empty: `sendPushToUser` will short-circuit with a
 * `vapid_not_configured` log and return { delivered: 0, skipped: true }.
 * Generate keys via:  npx web-push generate-vapid-keys
 *
 * IMPORTANT: this module imports `web-push`, which uses Node-only APIs
 * (crypto, http). Do NOT import it from a Client Component or an Edge
 * runtime route. Only Node API routes (default Next.js runtime) and
 * server actions can call it.
 */
// SERVER-ONLY: this module imports `web-push` (Node-only crypto). Do NOT
// import it from a Client Component or an Edge runtime route.
import webpush, { type PushSubscription, type SendResult, type WebPushError } from "web-push";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ---------- Types ----------

/** Payload shape consumed by public/sw.js push event handler. */
export interface PushPayload {
  /** Notification title — bold first line on most platforms. */
  title: string;
  /** Body text — second line. Truncate to ~80 chars for clean rendering. */
  body: string;
  /** Tag drives SW action buttons: 'cesoir-match' | 'cesoir-message' | 'cesoir-plan' | 'cesoir-default' */
  tag?: string;
  /** Default deeplink when the user taps the notification body. */
  url?: string;
  /** Override URL for "Repondre"/"Envoyer un message" action button. */
  chatUrl?: string;
  /** Override URL for "Voir le profil" action button. */
  profileUrl?: string;
  /** Optional icon override (defaults to /icon-192.png in SW). */
  icon?: string;
  /** Optional badge override. */
  badge?: string;
}

export interface SendPushResult {
  delivered: number;
  failed: number;
  removed: number;
  skipped?: boolean;
  reason?: string;
}

// ---------- Module-scoped lazy init ----------

let vapidConfigured = false;
let vapidConfigError: string | null = null;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (vapidConfigError) return false;

  const subject = process.env.VAPID_SUBJECT;
  // Accept either VAPID_PUBLIC_KEY or NEXT_PUBLIC_VAPID_PUBLIC_KEY — they
  // should hold the same value but only one might be set in dev.
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    vapidConfigError = "vapid_env_missing";
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    vapidConfigError = `vapid_init_failed: ${String(err)}`;
    return false;
  }
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "send_push_misconfigured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------- Public API ----------

/**
 * Fan out a push payload to every device subscribed for `userId`.
 *
 * Never throws — caller can fire-and-forget. Errors are logged but do
 * NOT propagate, so a flaky push provider can't break the user-visible
 * action that triggered the notification (creating a match, sending a
 * message, etc.).
 *
 * Returns a result summary (mostly useful for tests / observability).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendPushResult> {
  if (!ensureVapid()) {
    // In dev, env vars are intentionally empty. Log once at info level so
    // the engineer notices on first attempt, then stay quiet to avoid
    // log spam on every match/message.
    logger.info("send_push_skipped_vapid_not_configured", {
      userId,
      reason: vapidConfigError ?? "vapid_env_missing",
    });
    return {
      delivered: 0,
      failed: 0,
      removed: 0,
      skipped: true,
      reason: vapidConfigError ?? "vapid_env_missing",
    };
  }

  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (err) {
    logger.error("send_push_env_missing", { err: String(err) });
    return { delivered: 0, failed: 0, removed: 0, skipped: true, reason: "supabase_env_missing" };
  }

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    logger.error("send_push_subs_query_failed", { userId, err: error.message });
    return { delivered: 0, failed: 0, removed: 0, skipped: true, reason: "subs_query_failed" };
  }

  if (!subs || subs.length === 0) {
    return { delivered: 0, failed: 0, removed: 0 };
  }

  const body = JSON.stringify(payload);
  const staleEndpoints: string[] = [];

  const settled = await Promise.allSettled(
    subs.map(async (s) => {
      const sub: PushSubscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        const result: SendResult = await webpush.sendNotification(sub, body);
        return result;
      } catch (err) {
        // web-push throws WebPushError with statusCode for HTTP failures.
        const wpErr = err as WebPushError;
        if (wpErr?.statusCode === 404 || wpErr?.statusCode === 410) {
          // Endpoint expired — drop it so the next call doesn't waste time.
          staleEndpoints.push(s.endpoint);
        } else {
          logger.warn("send_push_endpoint_failed", {
            userId,
            statusCode: wpErr?.statusCode,
            endpointHash: hashEndpoint(s.endpoint),
          });
        }
        throw err;
      }
    }),
  );

  // Best-effort cleanup; failures here are non-blocking.
  let removed = 0;
  if (staleEndpoints.length > 0) {
    const { error: delError, count } = await admin
      .from("push_subscriptions")
      .delete({ count: "exact" })
      .in("endpoint", staleEndpoints);
    if (delError) {
      logger.warn("send_push_cleanup_failed", { userId, err: delError.message });
    } else {
      removed = count ?? staleEndpoints.length;
    }
  }

  const delivered = settled.filter((r) => r.status === "fulfilled").length;
  const failed = settled.filter((r) => r.status === "rejected").length;

  return { delivered, failed, removed };
}

/**
 * Hash the endpoint for log redaction — endpoints contain device-bound
 * tokens that we don't want in plaintext logs/Sentry.
 */
function hashEndpoint(endpoint: string): string {
  // Cheap fingerprint, not crypto. Just enough to correlate across log
  // lines without leaking the raw token.
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) {
    h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  }
  return `ep_${(h >>> 0).toString(16)}`;
}

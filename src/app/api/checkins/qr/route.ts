/**
 * POST /api/checkins/qr
 *
 * QR check-in scan handler (Wave 17, mig 042).
 *
 * Flow per request:
 *   1. Auth caller (Bearer or SSR cookie via requireUser).
 *   2. Validate body { planId, targetUserId }.
 *   3. Delegate to the SQL RPC `process_qr_scan(p_plan_id, p_scanner, p_target)`
 *      which atomically:
 *        a. Validates both users belong to the plan (1:1 OR group).
 *        b. Inserts a row into qr_checkins for the target user
 *           (idempotent — duplicate scan = no-op).
 *        c. Detects mutual state (each user scanned by the other).
 *        d. On mutual, awards karma +30 each + "verified-date" badge.
 *   4. On mutual + awarded, fire push notifications to BOTH users
 *      (best-effort; not awaited critical path).
 *
 * Why an RPC and not inline SQL ?
 *   - All the membership/karma/achievement writes need to be atomic and
 *     touch tables the caller doesn't have direct INSERT rights on
 *     (achievements, karma_transactions for the peer). SECURITY DEFINER
 *     in the function gives us safe write privilege bounded by an
 *     auth.uid() check.
 *   - Mirrors the patterns established in earlier migrations
 *     (claim_invite_code in mig 025 etc.).
 *
 * Camera-permission denial fallback:
 *   The client-side scanner offers a 6-digit numeric code as a manual
 *   alternative when the camera is denied. The 6-digit code is derived
 *   deterministically from the (plan_id, user_id) pair on both sides —
 *   it carries the SAME data as the QR payload, just displayed and
 *   typed in numerically. Decoding happens client-side; this endpoint
 *   only ever sees the resolved (planId, targetUserId).
 */
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { sendPushToUser } from "@/lib/push/sendPush";
import { logger } from "@/lib/logger";

// --- Constants ----------------------------------------------------------

/** Karma award per side when the scan goes mutual. */
const KARMA_AWARD = 30;
/** Badge id (must match badges.ts entry). */
const VERIFIED_DATE_BADGE = "verified-date";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Helpers ------------------------------------------------------------

/**
 * Build a service-role Supabase client. Returns null when not configured
 * (dev/local) — falls back to caller's RLS-scoped client. The RPC itself
 * is SECURITY DEFINER so it works either way; the service role is only
 * used here for the optional best-effort push lookups.
 */
function getServiceClient(): ReturnType<typeof createServiceClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface RpcResult {
  inserted: boolean;
  mutual: boolean;
  awarded: boolean;
  plan_id: string;
}

// --- Handler ------------------------------------------------------------

export async function POST(request: Request) {
  // 1) Auth ------------------------------------------------------------
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, { code: err.code });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;
  const callerId = user.id;

  // 2) Body parse + shape validation ----------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }

  const planId =
    typeof body === "object" && body !== null && "planId" in body
      ? String((body as { planId: unknown }).planId)
      : "";
  const targetUserId =
    typeof body === "object" && body !== null && "targetUserId" in body
      ? String((body as { targetUserId: unknown }).targetUserId)
      : "";

  if (!UUID_RE.test(planId)) {
    return apiError("planId invalide", 400, { code: "invalid_plan_id" });
  }
  if (!UUID_RE.test(targetUserId)) {
    return apiError("targetUserId invalide", 400, {
      code: "invalid_target_user_id",
    });
  }
  if (targetUserId === callerId) {
    return apiError("On ne se scanne pas soi-meme", 400, {
      code: "self_scan_forbidden",
    });
  }

  // 3) Delegate to the RPC --------------------------------------------
  const { data: rpcData, error: rpcErr } = await db.rpc("process_qr_scan", {
    p_plan_id: planId,
    p_scanner: callerId,
    p_target: targetUserId,
  });

  if (rpcErr) {
    // Map known SQLSTATE-ish errors to friendly responses. The RPC
    // raises plain text in `message` so we string-match conservatively.
    const msg = rpcErr.message ?? "";
    if (/scanner_mismatch/i.test(msg)) {
      return apiError("Identite scanner invalide", 403, {
        code: "scanner_mismatch",
      });
    }
    if (/self_scan_forbidden/i.test(msg)) {
      return apiError("On ne se scanne pas soi-meme", 400, {
        code: "self_scan_forbidden",
      });
    }
    if (/not_plan_participants/i.test(msg)) {
      return apiError("Vous n'etes pas tous les deux sur ce plan", 403, {
        code: "not_plan_participants",
      });
    }
    if (/unauthenticated/i.test(msg)) {
      return apiError("Non authentifie", 401, { code: "unauthenticated" });
    }
    logger.error("api_qr_checkin_rpc_failed", { err: msg });
    return apiError("Erreur serveur", 500, { code: "rpc_failed" });
  }

  // The RPC returns JSONB; supabase-js surfaces it as `data`.
  const result = (rpcData ?? {}) as Partial<RpcResult>;
  const mutual = !!result.mutual;
  const awarded = !!result.awarded;
  const inserted = !!result.inserted;

  // 4) Push notifications (only on the moment we cross to mutual). ----
  //    Best-effort — failures are logged but never break the response.
  if (mutual && awarded) {
    const pushPayload = {
      title: "Date verifie !",
      body: "Vous vous etes scannes a deux. +30 karma + badge Date Verifie debloque.",
      tag: "cesoir-default" as const,
      url: "/profile?tab=achievements",
    };
    await Promise.allSettled([
      sendPushToUser(callerId, pushPayload),
      sendPushToUser(targetUserId, pushPayload),
    ]);
  }

  // 5) Done ------------------------------------------------------------
  const service = getServiceClient();
  return apiOk({
    inserted,
    mutual,
    awarded,
    karmaAwarded: awarded ? KARMA_AWARD : 0,
    badgeUnlocked: awarded ? VERIFIED_DATE_BADGE : null,
    serviceRoleAvailable: service !== null,
  });
}

/**
 * POST /api/match/confirm-irl
 *
 * "Vu ce soir" — IRL meet confirmation flow (mig 032).
 *
 * Flow per request:
 *   1. Auth caller (Bearer or SSR cookie via requireUser).
 *   2. Validate body { conversationId } and verify the caller is one of
 *      the two conversation participants.
 *   3. Look up the most recent planned date for that pair (`plans` table
 *      first — that's the 1:1 dating model — then `flash_plans` matching
 *      the participants by membership).
 *   4. Reject if no plan, plan is in the future, or the 48h confirmation
 *      window (plan_time + 2h ≤ now ≤ plan_time + 50h) has expired.
 *   5. Insert a row into `irl_confirmations` for the caller. Composite
 *      PK + RLS make double-confirm and impersonation impossible.
 *   6. Check if the OTHER participant has also confirmed in-window. If
 *      yes:
 *        a. stamp `mutual_at = now()` on BOTH rows (service role).
 *        b. award `karma_transactions` (+20) to BOTH users.
 *        c. insert `achievements` row "first-date" for BOTH (idempotent
 *           via the unique (user_id, achievement_key) constraint).
 *        d. fire push to BOTH ("Premier RDV IRL débloqué !").
 *
 * Anti-fraud:
 *   - All membership/window checks happen server-side. The client
 *     surfaces the prompt opportunistically but the server is the source
 *     of truth.
 *   - Double-confirm is blocked at the DB level (composite PK + UNIQUE
 *     constraint on achievements).
 *   - "Pas cette fois" is intentionally NOT recorded — privacy spec.
 *     The client just dismisses the modal locally; nothing is written.
 *
 * Side-effects on the OTHER user are awarded with the service-role key
 * (not the caller's RLS-scoped client) because karma_transactions and
 * achievements rows for "the peer" cannot be inserted under the caller's
 * auth.uid().
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { sendPushToUser } from "@/lib/push/sendPush";
import { checkRateLimitByAction, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// --- Constants ----------------------------------------------------------

/** ms grace period after plan_time before confirmation is allowed. */
const CONFIRM_WINDOW_OPENS_MS = 2 * 60 * 60 * 1000; // +2h
/** ms grace period after plan_time when the window CLOSES. */
const CONFIRM_WINDOW_CLOSES_MS = 50 * 60 * 60 * 1000; // +2h + 48h
/** Karma award per side when both confirm. */
const KARMA_AWARD = 20;
/** Badge id (must match badges.ts entry). */
const FIRST_DATE_BADGE = "first-date";
/** Postgres unique-constraint violation code. */
const PG_UNIQUE_VIOLATION = "23505";

// --- Helpers ------------------------------------------------------------

/**
 * Build a service-role Supabase client. Falls back to the caller's
 * RLS-scoped client when no service key is configured (dev/local) — in
 * that mode the API can still award karma + achievements for the CALLER
 * (the policies allow self-writes), but not for the peer. We log a warn
 * so the caller can see the limitation.
 */
function getServiceClient(): ReturnType<typeof createServiceClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Pair the two participants in deterministic (user_a, user_b) order. */
function orderedPair(a: string, b: string): { userA: string; userB: string } {
  return a < b
    ? { userA: a, userB: b }
    : { userA: b, userB: a };
}

interface PlanLookup {
  planTime: Date;
  source: "plans" | "flash_plans";
}

/**
 * Find the most recent date plan between the two users (1:1 `plans`
 * table preferred, then `flash_plans` where both are participants).
 * Returns the most-recently-scheduled past plan, since a single match
 * may have multiple historic plans.
 */
async function findMostRecentPlan(
  // 2026-05-07 (code review H2): typed as SupabaseClient<any> instead of
  // bare `any` so we recover .from().select() builder typing inside.
  db: SupabaseClient,
  userA: string,
  userB: string,
): Promise<PlanLookup | null> {
  const ordered = orderedPair(userA, userB);

  // 1) `plans` table — 1:1 dating model, when_date column.
  //    The CHECK constraint (user_a::text < user_b::text) means only the
  //    ordered pair can ever exist, so a single .eq pair lookup suffices.
  const { data: planRows, error: planErr } = await db
    .from("plans")
    .select("when_date")
    .eq("user_a", ordered.userA)
    .eq("user_b", ordered.userB)
    .order("when_date", { ascending: false })
    .limit(1);

  if (planErr) {
    logger.warn("api_confirm_irl_plans_lookup_failed", { err: planErr.message });
  }
  if (planRows && planRows.length > 0) {
    return { planTime: new Date(planRows[0].when_date), source: "plans" };
  }

  // 2) `flash_plans` fallback — open-to-candidates plans where BOTH
  //    users are accepted participants. Useful for group plans that
  //    happen to involve this match pair.
  const { data: fpRows, error: fpErr } = await db
    .from("flash_plan_participants")
    .select("flash_plan_id, status")
    .in("user_id", [userA, userB])
    .eq("status", "accepted");

  if (fpErr || !fpRows) return null;

  // Find a flash_plan_id that appears for BOTH users.
  const counts = new Map<string, number>();
  for (const row of fpRows) {
    counts.set(row.flash_plan_id, (counts.get(row.flash_plan_id) ?? 0) + 1);
  }
  const sharedIds = Array.from(counts.entries())
    .filter(([, c]) => c >= 2)
    .map(([id]) => id);

  if (sharedIds.length === 0) return null;

  const { data: flash, error: flashErr } = await db
    .from("flash_plans")
    .select("when_at")
    .in("id", sharedIds)
    .order("when_at", { ascending: false })
    .limit(1);

  if (flashErr || !flash || flash.length === 0) return null;

  return { planTime: new Date(flash[0].when_at), source: "flash_plans" };
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

  // 1.5) Rate limit — karma-awarding endpoint, prevent enumeration of
  // valid conversationIds + spam confirm attempts. The DB unique
  // constraint blocks duplicates but not brute-force enumeration.
  // (Code review C1, 2026-05-07.)
  const rl = await checkRateLimitByAction(
    `confirm-irl:${callerId}:${getClientIp(request)}`,
    "api",
  );
  if (!rl.ok) return rateLimitResponse(rl);

  // 2) Body parse -----------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }

  const conversationId =
    typeof body === "object" && body !== null && "conversationId" in body
      ? String((body as { conversationId: unknown }).conversationId)
      : "";

  // Cheap UUID-shape sanity (defence-in-depth — RLS would reject anyway).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    return apiError("conversationId invalide", 400, { code: "invalid_conversation_id" });
  }

  // 3) Conversation lookup + membership check --------------------------
  const { data: convo, error: convoErr } = await db
    .from("conversations")
    .select("id, user_a, user_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoErr) {
    logger.error("api_confirm_irl_convo_lookup_failed", { err: convoErr.message });
    return apiError("Erreur serveur", 500, { code: "convo_lookup_failed" });
  }
  if (!convo) {
    return apiError("Conversation introuvable", 404, { code: "conversation_not_found" });
  }
  if (convo.user_a !== callerId && convo.user_b !== callerId) {
    // Don't leak existence — same status as not-found.
    return apiError("Conversation introuvable", 404, { code: "conversation_not_found" });
  }
  const peerId = convo.user_a === callerId ? convo.user_b : convo.user_a;

  // 4) Plan window check ----------------------------------------------
  const plan = await findMostRecentPlan(db, callerId, peerId);
  if (!plan) {
    return apiError(
      "Aucun plan trouvé pour cette conversation",
      400,
      { code: "no_plan" },
    );
  }

  const now = Date.now();
  const planTimeMs = plan.planTime.getTime();
  const opensAt = planTimeMs + CONFIRM_WINDOW_OPENS_MS;
  const closesAt = planTimeMs + CONFIRM_WINDOW_CLOSES_MS;

  if (now < opensAt) {
    return apiError(
      "Trop tôt pour confirmer (attends 2h après le plan)",
      400,
      {
        code: "plan_in_future",
        details: { opensAt: new Date(opensAt).toISOString() },
      },
    );
  }
  if (now > closesAt) {
    return apiError(
      "Délai de confirmation expiré (48h)",
      400,
      {
        code: "window_expired",
        details: { closedAt: new Date(closesAt).toISOString() },
      },
    );
  }

  // 5) Insert caller's confirmation (RLS-scoped client) ----------------
  const { error: insertErr } = await db.from("irl_confirmations").insert({
    conversation_id: conversationId,
    user_id: callerId,
    confirmed_at: new Date().toISOString(),
  });

  if (insertErr) {
    if (insertErr.code === PG_UNIQUE_VIOLATION) {
      return apiError("Tu as déjà confirmé pour cette conversation", 409, {
        code: "already_confirmed",
      });
    }
    logger.error("api_confirm_irl_insert_failed", { err: insertErr.message });
    return apiError("Erreur lors de l'enregistrement", 500, {
      code: "insert_failed",
    });
  }

  // 6) Check if peer has already confirmed in-window --------------------
  const { data: peerRow, error: peerLookupErr } = await db
    .from("irl_confirmations")
    .select("user_id, confirmed_at, mutual_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", peerId)
    .maybeSingle();

  if (peerLookupErr) {
    logger.warn("api_confirm_irl_peer_lookup_failed", { err: peerLookupErr.message });
    // Non-fatal: we still recorded the caller's confirmation.
    return apiOk({
      mutual: false,
      awarded: false,
      planSource: plan.source,
    });
  }

  // Peer hasn't confirmed yet — wait for them.
  if (!peerRow) {
    return apiOk({
      mutual: false,
      awarded: false,
      planSource: plan.source,
      message: "On attend que ton match confirme aussi",
    });
  }

  // Peer confirmed — but only count it if THEIR confirmation is also in
  // the same 48h window (anti-stale). With the window logic above, every
  // valid insert is in-window, but a peer row could pre-date the window
  // if they confirmed before this plan was logged. Belt + braces.
  const peerConfirmedMs = peerRow.confirmed_at
    ? new Date(peerRow.confirmed_at).getTime()
    : 0;
  const peerInWindow =
    peerConfirmedMs >= opensAt && peerConfirmedMs <= closesAt;
  if (!peerInWindow) {
    return apiOk({
      mutual: false,
      awarded: false,
      planSource: plan.source,
      message: "La confirmation du match est hors fenêtre",
    });
  }

  // 7) MUTUAL CONFIRM — award karma + badge + push --------------------
  const service = getServiceClient();
  const writer = service ?? db;
  const mutualAt = new Date().toISOString();

  // 7a) stamp mutual_at on both rows
  const { error: stampErr } = await writer
    .from("irl_confirmations")
    .update({ mutual_at: mutualAt })
    .eq("conversation_id", conversationId)
    .in("user_id", [callerId, peerId]);

  if (stampErr) {
    logger.warn("api_confirm_irl_mutual_stamp_failed", { err: stampErr.message });
  }

  // 7b) karma transactions — one row per user
  const karmaRows = [
    { user_id: callerId, amount: KARMA_AWARD, reason: "IRL meet confirmed (mutual)" },
    { user_id: peerId, amount: KARMA_AWARD, reason: "IRL meet confirmed (mutual)" },
  ];
  const { error: karmaErr } = await writer.from("karma_transactions").insert(karmaRows);
  if (karmaErr) {
    logger.warn("api_confirm_irl_karma_failed", { err: karmaErr.message });
  }

  // 7c) achievements — idempotent insert (UNIQUE on user_id+key handles
  //     repeat calls). We still attempt for both because either one may
  //     never have earned it before.
  const { error: achErr } = await writer.from("achievements").insert([
    { user_id: callerId, achievement_key: FIRST_DATE_BADGE },
    { user_id: peerId, achievement_key: FIRST_DATE_BADGE },
  ]);
  if (achErr && achErr.code !== PG_UNIQUE_VIOLATION) {
    logger.warn("api_confirm_irl_achievement_failed", { err: achErr.message });
  }

  // 7d) push notifications (best-effort, non-blocking on failure)
  const pushPayload = {
    title: "Premier RDV IRL débloqué !",
    body: "Tu as confirmé t'être vu IRL. +20 karma + badge Premier RDV débloqué.",
    tag: "cesoir-default" as const,
    url: "/profile?tab=achievements",
  };
  await Promise.allSettled([
    sendPushToUser(callerId, pushPayload),
    sendPushToUser(peerId, pushPayload),
  ]);

  return apiOk({
    mutual: true,
    awarded: true,
    karmaAwarded: KARMA_AWARD,
    badgeUnlocked: FIRST_DATE_BADGE,
    planSource: plan.source,
    serviceRoleAvailable: service !== null,
  });
}

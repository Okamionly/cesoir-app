/**
 * POST /api/plans/wingman/invite
 *
 * Wave 17 wingman feature — invite a friend to join a flash_plan as a
 * "+1". Body: { planId: string, inviteeId: string }.
 *
 * Server-side validation:
 *   1. Auth (Bearer or SSR cookie via requireUser).
 *   2. Plan exists, is in the future (when_at > now), is open.
 *   3. Caller is a participant of the plan (inviter must be in flash_plan_participants).
 *   4. Invitee is not the caller, not already a participant, not already
 *      a wingman, has an *active* match OR friend tie with the caller.
 *   5. Caller has no other pending/accepted wingman invite on this plan
 *      (one wingman per inviter per plan — max 4 humans total).
 *   6. Insert wingman_invites row + push to invitee.
 *
 * "Active match" = a row in `conversations` linking caller↔invitee.
 * "Friend tie"   = both users belong to the same `squads.members` array.
 *
 * Anti-abuse: caller's RLS-scoped client does the writes so they can't
 * fabricate a row for another inviter_id. The server-side membership +
 * tie checks add the policy decisions RLS can't express.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { sendPushToUser } from "@/lib/push/sendPush";
import { checkRateLimitByAction, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PG_UNIQUE_VIOLATION = "23505";

// 2026-05-07 (code review H2): typed as SupabaseClient<any> instead of
// bare `any` so .from().select() builder typing is recovered.
type Db = SupabaseClient;

interface InviteBody {
  planId: string;
  inviteeId: string;
}

function parseBody(body: unknown): InviteBody | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const planId = typeof b.planId === "string" ? b.planId : "";
  const inviteeId = typeof b.inviteeId === "string" ? b.inviteeId : "";
  if (!UUID_RE.test(planId) || !UUID_RE.test(inviteeId)) return null;
  return { planId, inviteeId };
}

/**
 * Test whether `callerId` and `peerId` share an active conversation
 * (i.e. they have matched at some point and the conversation row still
 * exists). Conversations are cleaned up when a user blocks/unmatches.
 */
async function haveActiveMatch(
  db: Db,
  callerId: string,
  peerId: string,
): Promise<boolean> {
  const userA = callerId < peerId ? callerId : peerId;
  const userB = callerId < peerId ? peerId : callerId;
  const { data, error } = await db
    .from("conversations")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .limit(1);
  if (error) {
    logger.warn("api_wingman_invite_match_lookup_failed", { err: error.message });
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/**
 * Test whether two users share at least one active squad. The squads
 * table stores members as a uuid[] array, so we use the && (overlap)
 * filter via Postgres array containment.
 */
async function shareSquad(
  db: Db,
  callerId: string,
  peerId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("squads")
    .select("id, members")
    .contains("members", [callerId])
    .eq("status", "active");
  if (error || !Array.isArray(data)) return false;
  return data.some(
    (row: { members: string[] | null }) =>
      Array.isArray(row.members) && row.members.includes(peerId),
  );
}

export async function POST(request: Request) {
  // 1) Auth -----------------------------------------------------------
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

  // 1.5) Rate limit — wingman invite triggers a push to the invitee +
  // creates an `wingman_invites` row. Without throttling, an attacker
  // can spam invites to enumerate valid plan/user UUIDs.
  // (Code review C1, 2026-05-07.)
  const rl = await checkRateLimitByAction(
    `wingman-invite:${callerId}:${getClientIp(request)}`,
    "api",
  );
  if (!rl.ok) return rateLimitResponse(rl);

  // 2) Body parse -----------------------------------------------------
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }
  const body = parseBody(raw);
  if (!body) {
    return apiError("Corps invalide (planId, inviteeId)", 400, {
      code: "invalid_body",
    });
  }
  const { planId, inviteeId } = body;

  if (callerId === inviteeId) {
    return apiError("Tu ne peux pas t'inviter toi-même", 400, {
      code: "self_invite",
    });
  }

  // 3) Plan check -----------------------------------------------------
  const { data: plan, error: planErr } = await db
    .from("flash_plans")
    .select("id, when_at, status, creator_id, wingman_a_id, wingman_b_id")
    .eq("id", planId)
    .maybeSingle();

  if (planErr) {
    logger.error("api_wingman_invite_plan_lookup_failed", { err: planErr.message });
    return apiError("Erreur serveur", 500, { code: "plan_lookup_failed" });
  }
  if (!plan) {
    return apiError("Plan introuvable", 404, { code: "plan_not_found" });
  }
  if (plan.status !== "open") {
    return apiError("Plan fermé", 400, { code: "plan_closed" });
  }
  if (new Date(plan.when_at).getTime() <= Date.now()) {
    return apiError("Plan déjà passé", 400, { code: "plan_in_past" });
  }

  // 4) Caller must be a participant ----------------------------------
  const { data: callerPart, error: partErr } = await db
    .from("flash_plan_participants")
    .select("user_id, status")
    .eq("flash_plan_id", planId)
    .eq("user_id", callerId)
    .in("status", ["accepted", "candidate"])
    .maybeSingle();

  if (partErr) {
    logger.warn("api_wingman_invite_participant_check_failed", {
      err: partErr.message,
    });
  }
  if (!callerPart) {
    return apiError("Tu ne participes pas à ce plan", 403, {
      code: "not_a_participant",
    });
  }

  // 5) Invitee must not already be a participant or wingman ----------
  if (plan.wingman_a_id === inviteeId || plan.wingman_b_id === inviteeId) {
    return apiError("Déjà wingman sur ce plan", 409, {
      code: "already_wingman",
    });
  }
  const { data: existingPart } = await db
    .from("flash_plan_participants")
    .select("user_id")
    .eq("flash_plan_id", planId)
    .eq("user_id", inviteeId)
    .maybeSingle();
  if (existingPart) {
    return apiError("Cette personne participe déjà au plan", 409, {
      code: "invitee_already_participant",
    });
  }

  // 6) Headcount cap (4 max: 2 peers + 2 wingmen) --------------------
  if (plan.wingman_a_id && plan.wingman_b_id) {
    return apiError("Plan complet (4 personnes max)", 409, {
      code: "plan_full",
    });
  }

  // 7) Caller's wingman slot — only ONE outstanding invite per inviter
  //    Look at all non-declined/expired invites by caller for this plan.
  const { data: existingInvites } = await db
    .from("wingman_invites")
    .select("id, status")
    .eq("plan_id", planId)
    .eq("inviter_id", callerId);

  const liveInvite = (existingInvites ?? []).find(
    (r: { status: string }) => r.status === "pending" || r.status === "accepted",
  );
  if (liveInvite) {
    return apiError(
      "Tu as déjà invité un wingman pour ce plan",
      409,
      { code: "inviter_slot_taken" },
    );
  }

  // 8) Tie check — invitee must be a match or squad member ----------
  const [hasMatch, sharesSquad] = await Promise.all([
    haveActiveMatch(db, callerId, inviteeId),
    shareSquad(db, callerId, inviteeId),
  ]);
  if (!hasMatch && !sharesSquad) {
    return apiError(
      "Tu peux inviter seulement un match actif ou un membre de ton squad",
      403,
      { code: "no_tie" },
    );
  }

  // 9) Insert wingman_invites row ------------------------------------
  const { data: inserted, error: insertErr } = await db
    .from("wingman_invites")
    .insert({
      plan_id: planId,
      inviter_id: callerId,
      invitee_id: inviteeId,
      status: "pending",
    })
    .select("id, invited_at")
    .single();

  if (insertErr) {
    if (insertErr.code === PG_UNIQUE_VIOLATION) {
      return apiError("Cette personne a déjà été invitée", 409, {
        code: "duplicate_invite",
      });
    }
    logger.error("api_wingman_invite_insert_failed", { err: insertErr.message });
    return apiError("Erreur lors de la création de l'invitation", 500, {
      code: "insert_failed",
    });
  }

  // 10) Inviter name for the push payload ----------------------------
  const { data: inviter } = await db
    .from("profiles")
    .select("name")
    .eq("id", callerId)
    .maybeSingle();

  const inviterName = inviter?.name ?? "Quelqu'un";

  // 11) Push (best-effort) -------------------------------------------
  await sendPushToUser(inviteeId, {
    title: "Invitation wingman",
    body: `${inviterName} t'invite comme wingman pour son plan ce soir.`,
    tag: "cesoir-default",
    url: "/notifications",
  });

  return apiOk(
    {
      inviteId: inserted?.id ?? null,
      invitedAt: inserted?.invited_at ?? null,
      planId,
      inviteeId,
    },
    { status: 201 },
  );
}

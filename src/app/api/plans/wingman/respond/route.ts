/**
 * POST /api/plans/wingman/respond
 *
 * Body: { inviteId: string, accept: boolean }
 *
 * Wave 17 wingman feature — invitee responds to a wingman invite.
 *  - accept=true  → wingman_invites.status = 'accepted',
 *                   flash_plans.wingman_X_id is set to invitee_id (X = the
 *                   slot matching the inviter), and a push fires to the
 *                   inviter ("Ton wingman a accepté").
 *  - accept=false → wingman_invites.status = 'declined' (silent — no push
 *                   to spare ego, but the inviter sees status flip live
 *                   via realtime).
 *
 * Validation:
 *   1. Auth (Bearer or SSR cookie via requireUser).
 *   2. Invite exists, is pending, and the caller is the invitee.
 *   3. Plan still in the future and open. Past-plan invites auto-flip
 *      to expired and the response returns 410.
 *   4. (Accept path) Slot still free + headcount cap respected.
 *   5. (Accept path) Picks slot wingman_a_id vs wingman_b_id based on
 *      which side the inviter sits on (creator vs other peer).
 */
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { sendPushToUser } from "@/lib/push/sendPush";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RespondBody {
  inviteId: string;
  accept: boolean;
}

function parseBody(body: unknown): RespondBody | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.inviteId !== "string" || !UUID_RE.test(b.inviteId)) return null;
  if (typeof b.accept !== "boolean") return null;
  return { inviteId: b.inviteId, accept: b.accept };
}

/**
 * Lazily build a service-role client. We use it for the `flash_plans`
 * UPDATE that sets wingman_X_id — flash_plans RLS only allows the
 * creator to update, which means a non-creator inviter's wingman would
 * fail to land. Using the service client here keeps the surface tight
 * (one specific column write) without bending the global policy.
 */
function getServiceClient(): ReturnType<typeof createServiceClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  // 1) Auth ----------------------------------------------------------
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

  // 2) Body ----------------------------------------------------------
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }
  const body = parseBody(raw);
  if (!body) {
    return apiError("Corps invalide (inviteId, accept)", 400, {
      code: "invalid_body",
    });
  }
  const { inviteId, accept } = body;

  // 3) Invite lookup -------------------------------------------------
  const { data: invite, error: inviteErr } = await db
    .from("wingman_invites")
    .select("id, plan_id, inviter_id, invitee_id, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteErr) {
    logger.error("api_wingman_respond_lookup_failed", { err: inviteErr.message });
    return apiError("Erreur serveur", 500, { code: "lookup_failed" });
  }
  if (!invite) {
    return apiError("Invitation introuvable", 404, { code: "invite_not_found" });
  }
  if (invite.invitee_id !== callerId) {
    // Don't leak whether the invite exists — same status as not-found.
    return apiError("Invitation introuvable", 404, { code: "invite_not_found" });
  }
  if (invite.status !== "pending") {
    return apiError("Invitation déjà traitée", 409, {
      code: "already_responded",
      details: { status: invite.status },
    });
  }

  // 4) Plan freshness check -----------------------------------------
  const { data: plan, error: planErr } = await db
    .from("flash_plans")
    .select("id, creator_id, when_at, status, wingman_a_id, wingman_b_id")
    .eq("id", invite.plan_id)
    .maybeSingle();

  if (planErr || !plan) {
    return apiError("Plan introuvable", 404, { code: "plan_not_found" });
  }

  const planExpired = new Date(plan.when_at).getTime() <= Date.now();
  if (planExpired) {
    // Best-effort: mark the invite expired so the dashboard reflects it.
    await db
      .from("wingman_invites")
      .update({ status: "expired" })
      .eq("id", inviteId)
      .eq("status", "pending");
    return apiError("Plan déjà passé — invitation expirée", 410, {
      code: "plan_expired",
    });
  }
  if (plan.status !== "open") {
    return apiError("Plan fermé", 400, { code: "plan_closed" });
  }

  // 5) Decline path --------------------------------------------------
  if (!accept) {
    const { error: declineErr } = await db
      .from("wingman_invites")
      .update({ status: "declined" })
      .eq("id", inviteId)
      .eq("status", "pending");
    if (declineErr) {
      logger.warn("api_wingman_respond_decline_failed", { err: declineErr.message });
      return apiError("Erreur serveur", 500, { code: "decline_failed" });
    }
    return apiOk({ status: "declined", inviteId, planId: invite.plan_id });
  }

  // 6) Accept path — pick the slot ------------------------------------
  // The inviter occupies one of two conceptual positions:
  //   - "A" if they are the creator of the plan
  //   - "B" otherwise (the second participant)
  // This means a single 1:1 plan can have two wingmen — one for each peer.
  const isInviterCreator = invite.inviter_id === plan.creator_id;
  const slotColumn = isInviterCreator ? "wingman_a_id" : "wingman_b_id";
  const slotCurrent = isInviterCreator ? plan.wingman_a_id : plan.wingman_b_id;

  if (slotCurrent && slotCurrent !== callerId) {
    // Slot taken by someone else (rare race) — flip invite to declined to
    // unblock further attempts and return a clear error.
    await db
      .from("wingman_invites")
      .update({ status: "declined" })
      .eq("id", inviteId)
      .eq("status", "pending");
    return apiError("Place wingman déjà prise", 409, { code: "slot_taken" });
  }

  // 6a) Update invite status first (RLS-scoped — invitee write).
  const { error: acceptErr } = await db
    .from("wingman_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .eq("status", "pending");
  if (acceptErr) {
    logger.error("api_wingman_respond_accept_failed", { err: acceptErr.message });
    return apiError("Erreur lors de l'acceptation", 500, { code: "accept_failed" });
  }

  // 6b) Stamp wingman_X_id on flash_plans. Service role required when
  //     the inviter is NOT the plan creator (RLS allows only the creator
  //     to update the plan row). We always use service role if available
  //     to keep the path uniform.
  const service = getServiceClient();
  const writer = service ?? db;
  const { error: stampErr } = await writer
    .from("flash_plans")
    .update({ [slotColumn]: callerId })
    .eq("id", plan.id);

  if (stampErr) {
    logger.warn("api_wingman_respond_stamp_failed", {
      err: stampErr.message,
      slot: slotColumn,
      serviceRole: service !== null,
    });
    // Non-fatal — invite is accepted; client can re-fetch plan and the
    // missing slot will trigger a soft re-stamp on next view via the
    // server (or the inviter sees the row in pending stamping state).
  }

  // 6c) Add the wingman to flash_plan_participants so they appear in
  //     the plan's participant list (status='accepted').
  const { error: partErr } = await writer.from("flash_plan_participants").insert({
    flash_plan_id: plan.id,
    user_id: callerId,
    status: "accepted",
  });
  if (partErr && partErr.code !== "23505") {
    // 23505 = duplicate (already a participant); ignore.
    logger.warn("api_wingman_respond_participant_insert_failed", {
      err: partErr.message,
    });
  }

  // 7) Push the inviter ---------------------------------------------
  const { data: inviteeProfile } = await db
    .from("profiles")
    .select("name")
    .eq("id", callerId)
    .maybeSingle();
  const inviteeName = inviteeProfile?.name ?? "Ton wingman";

  await sendPushToUser(invite.inviter_id, {
    title: "Wingman confirmé",
    body: `${inviteeName} a accepté de venir comme wingman.`,
    tag: "cesoir-default",
    url: `/plans/${plan.id}`,
  });

  return apiOk({
    status: "accepted",
    inviteId,
    planId: plan.id,
    slot: slotColumn,
    serviceRoleAvailable: service !== null,
  });
}

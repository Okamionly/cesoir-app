import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SwipeResponse } from "@/types/matching";
import { getDailyLikeCap } from "@/lib/premium-gate";
import { swipeSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { requireUser, AuthError } from "@/lib/api/auth";
import { sendPushToUser } from "@/lib/push/sendPush";

/** Postgres unique-constraint violation. */
const PG_UNIQUE_VIOLATION = "23505";

/** ISO timestamp of midnight UTC tonight (reset time). */
function midnightUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO timestamp of the start of today (UTC). */
function todayStartUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  // --- Auth (unified helper, Wave 15) ---
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;
  const userId = user.id;

  // --- Parse + validate body ---
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = swipeSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    logger.warn("api_swipe_validation_failed", { fields: fieldErrors });
    // Surface the first error for backwards-compat error matching.
    const firstErr =
      fieldErrors.direction?.[0] ??
      fieldErrors.targetId?.[0] ??
      "validation_failed";
    return NextResponse.json(
      { error: firstErr, code: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { targetId, direction, mode } = parsed.data;

  if (targetId === userId) {
    return NextResponse.json(
      { error: "Impossible de swiper son propre profil" },
      { status: 400 },
    );
  }

  const resetAt = midnightUTC();

  // --- Rate limiting: count today's swipes ---
  const { count, error: countError } = await db
    .from("interactions")
    .select("id", { count: "exact", head: true })
    .eq("from_user", userId)
    .in("action", ["like", "pass", "superlike"])
    .gte("created_at", todayStartUTC());

  if (countError) {
    logger.error("api_swipe_rate_limit_count_failed", { err: countError.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const todayCount = count ?? 0;

  // Premium-gate (2026-04-19): free tier = 100/day, premium = Infinity.
  // Premium status comes from the `subscriptions` table (via Stripe webhook).
  const dailyCap = await getDailyLikeCap(userId);

  if (todayCount >= dailyCap) {
    return NextResponse.json(
      { error: "rate_limited", swipesRemaining: 0, resetAt },
      { status: 429 },
    );
  }

  // --- Record the swipe ---
  // M5 — INSERT instead of UPSERT: a user re-swiping the same target
  // (via UI bug, double-tap, or ill intent) used to silently overwrite
  // the previous decision and flip match state. Now we reject as 409.
  const { error: insertError } = await db.from("interactions").insert({
    from_user: userId,
    to_user: targetId,
    action: direction,
    mode: mode ?? null,
  });

  if (insertError) {
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "already_swiped", message: "Profil déjà swipé" },
        { status: 409 },
      );
    }
    logger.error("api_swipe_insert_failed", { err: insertError.message });
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 },
    );
  }

  // Premium users: Infinity → return a large finite number for JSON safety.
  const swipesRemaining =
    dailyCap === Infinity
      ? 9999
      : Math.max(0, dailyCap - todayCount - 1);

  // --- Check mutual match (only for likes) ---
  let matched = false;
  let conversationId: string | null = null;

  if (direction === "like" || direction === "superlike") {
    const { data: reverseSwipe } = await db
      .from("interactions")
      .select("id")
      .eq("from_user", targetId)
      .eq("to_user", userId)
      .in("action", ["like", "superlike"])
      .limit(1)
      .maybeSingle();

    matched = !!reverseSwipe;

    if (matched) {
      conversationId = await createConversation(db, userId, targetId, mode);

      // ── Wave 16 Bet #4 — push notification for the new match ──
      // Fire-and-forget. sendPushToUser never throws and short-circuits in
      // dev when VAPID env vars are missing, so this can't break the swipe
      // response. We notify BOTH users — the swiper has the app open (the
      // in-app MatchCinematic also fires) but their other devices may be
      // backgrounded; the swipee almost certainly isn't here right now,
      // which is the whole point of push.
      void notifyMatch(db, userId, targetId, conversationId).catch((err) => {
        logger.warn("api_swipe_push_match_failed", { err: String(err) });
      });
    }
  }

  const response: SwipeResponse = { matched, conversationId, swipesRemaining, resetAt };
  return NextResponse.json(response);
}

/**
 * Fan out a push to both participants of a fresh match.
 * Reads each side's display name from `profiles` so the body is personalized.
 * Best-effort: any failure is logged but does NOT block the swipe response.
 */
async function notifyMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  swiperId: string,
  targetId: string,
  conversationId: string | null,
): Promise<void> {
  if (!conversationId) return;

  const { data: profiles } = await db
    .from("profiles")
    .select("id, name")
    .in("id", [swiperId, targetId]);

  const nameById = new Map<string, string>();
  for (const p of (profiles ?? []) as Array<{ id: string; name: string | null }>) {
    nameById.set(p.id, p.name ?? "Quelqu'un");
  }
  const swiperName = nameById.get(swiperId) ?? "Quelqu'un";
  const targetName = nameById.get(targetId) ?? "Quelqu'un";

  await Promise.all([
    sendPushToUser(swiperId, {
      title: "C'est un match !",
      body: `${targetName} veut te rencontrer ce soir`,
      tag: "cesoir-match",
      url: `/chat/${conversationId}`,
      chatUrl: `/chat/${conversationId}`,
      profileUrl: `/profile/${targetId}`,
    }),
    sendPushToUser(targetId, {
      title: "C'est un match !",
      body: `${swiperName} veut te rencontrer ce soir`,
      tag: "cesoir-match",
      url: `/chat/${conversationId}`,
      chatUrl: `/chat/${conversationId}`,
      profileUrl: `/profile/${swiperId}`,
    }),
  ]);
}

/** Create (or retrieve existing) conversation for a new match. */
async function createConversation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  userA_id: string,
  userB_id: string,
  mode?: string,
): Promise<string | null> {
  // Deterministic ordering prevents duplicate rows
  const userA = userA_id < userB_id ? userA_id : userB_id;
  const userB = userA_id < userB_id ? userB_id : userA_id;

  const { data } = await db
    .from("conversations")
    .upsert(
      {
        user_a: userA,
        user_b: userB,
        mode: mode ?? null,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "user_a,user_b" },
    )
    .select("id")
    .single();

  return data?.id ?? null;
}

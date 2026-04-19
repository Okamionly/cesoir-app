// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { SwipeRequest, SwipeResponse } from "@/types/matching";
import { getDailyLikeCap } from "@/lib/premium-gate";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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
  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const userId = user.id;

  // --- Parse body ---
  let body: SwipeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { targetId, direction, mode } = body;

  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId requis" }, { status: 400 });
  }
  if (!["like", "pass", "superlike"].includes(direction)) {
    return NextResponse.json(
      { error: "direction invalide (like | pass | superlike)" },
      { status: 400 },
    );
  }
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
    console.error("[/api/swipe] rate-limit count failed:", countError.message);
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
    console.error("[/api/swipe] insert failed:", insertError.message);
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
    }
  }

  const response: SwipeResponse = { matched, conversationId, swipesRemaining, resetAt };
  return NextResponse.json(response);
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

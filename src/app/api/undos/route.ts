import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { undoSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

/**
 * POST /api/undos
 * Body: { targetId: string, originalAction: 'like' | 'pass' | 'superlike' }
 * Auth: Bearer <access_token>
 *
 * Records an undo of a swipe: inserts a row in swipe_undos (for anti-cheat
 * daily-cap tracking) AND deletes the corresponding interaction row so
 * the target can be re-swiped.
 *
 * Before audit 2026-04-19 this lived in localStorage + direct
 * supabase.from('interactions').delete() — the rate-limit of /api/swipe
 * counted swipes via DB, so swipe+undo+swipe+undo bypassed the cap.
 * Server-enforced now.
 *
 * Rate limit: 10/min per user.
 *
 * GET /api/undos — list today's undos (client hydrates count).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function todayStartUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
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

  const rl = await checkRateLimit(`undos:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = undoSchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("api_undos_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        error: "validation_failed",
        code: "validation_failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const { targetId, originalAction } = parsed.data;

  // --- Delete the interaction (so target can be re-swiped) ---
  const { error: delErr } = await db
    .from("interactions")
    .delete()
    .eq("from_user", user.id)
    .eq("to_user", targetId)
    .eq("action", originalAction);

  if (delErr) {
    logger.error("api_undos_interaction_delete_failed", { err: delErr.message });
    return NextResponse.json(
      { error: "Erreur suppression interaction" },
      { status: 500 },
    );
  }

  // --- Record the undo (anti-cheat trail) ---
  const { data: undoRow, error: insErr } = await db
    .from("swipe_undos")
    .insert({
      user_id: user.id,
      target_id: targetId,
      original_action: originalAction,
    })
    .select("id, undone_at")
    .single();

  if (insErr) {
    logger.error("api_undos_insert_failed", { err: insErr.message });
    return NextResponse.json(
      { error: "Erreur enregistrement undo" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: undoRow.id,
    undoneAt: undoRow.undone_at,
    targetId,
    originalAction,
  });
}

/** GET — list today's undos (for daily-cap UI hydration). */
export async function GET(request: Request) {
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

  const { data, error } = await db
    .from("swipe_undos")
    .select("id, target_id, original_action, undone_at")
    .eq("user_id", user.id)
    .gte("undone_at", todayStartUTC())
    .order("undone_at", { ascending: false });

  if (error) {
    logger.error("api_undos_get_failed", { err: error.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ undos: data ?? [], count: data?.length ?? 0 });
}

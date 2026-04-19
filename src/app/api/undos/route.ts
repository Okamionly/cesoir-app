import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

interface UndoBody {
  targetId: string;
  originalAction: "like" | "pass" | "superlike";
}

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

  const rl = checkRateLimit(`undos:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: UndoBody;
  try {
    body = (await request.json()) as UndoBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { targetId, originalAction } = body;
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId requis" }, { status: 400 });
  }
  if (!["like", "pass", "superlike"].includes(originalAction)) {
    return NextResponse.json(
      { error: "originalAction invalide" },
      { status: 400 },
    );
  }

  // --- Delete the interaction (so target can be re-swiped) ---
  const { error: delErr } = await db
    .from("interactions")
    .delete()
    .eq("from_user", user.id)
    .eq("to_user", targetId)
    .eq("action", originalAction);

  if (delErr) {
    console.error("[/api/undos] interaction delete failed:", delErr.message);
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
    console.error("[/api/undos] undo insert failed:", insErr.message);
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
    console.error("[/api/undos GET] failed:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ undos: data ?? [], count: data?.length ?? 0 });
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/invites/mine
 * POST /api/invites/mine  (mint fresh codes if under the cap)
 *
 * Wave 15 CRO 10/10 (2026-04-23). Requires bearer. Used by /profile/invites.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function GET(request: Request) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData } = await db.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const { data, error } = await db
    .from("invite_codes")
    .select("code, used_by, used_at, expires_at, created_at")
    .eq("created_by", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("api_invites_mine_query_failed", { err: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(request: Request) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await db.rpc("mint_user_invite_codes", { p_count: 3 });
  if (error) {
    logger.error("api_invites_mine_mint_failed", { err: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ codes: data ?? [] });
}

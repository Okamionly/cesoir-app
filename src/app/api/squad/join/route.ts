import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { squadJoinSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface SquadRow {
  id: string;
  members: string[] | null;
  creator_id: string;
  status: string | null;
}

interface InviteRow {
  id: string;
  squad_id: string;
  used_by: string | null;
}

const MAX_SQUAD_SIZE = 4;

export async function POST(request: Request) {
  // Rate limit 5/min per IP — blocks brute-force of 6-char invite codes
  // (36^6 = 2.2G combinations but attacker can still spray).
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`squad-join:${ip}`, 5, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = squadJoinSchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("api_squad_join_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        error: "Code invalide (6 caracteres)",
        code: "validation_failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const code = parsed.data.invite_code.trim().toUpperCase();

  // 1. Lookup invite
  const { data: inviteData, error: inviteErr } = await db
    .from("squad_invites")
    .select("id, squad_id, used_by")
    .eq("code", code)
    .maybeSingle();

  if (inviteErr || !inviteData) {
    return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
  }

  const invite = inviteData as InviteRow;
  if (invite.used_by) {
    return NextResponse.json({ error: "Code deja utilise" }, { status: 409 });
  }

  // 2. Fetch squad
  const { data: squadData, error: squadErr } = await db
    .from("squads")
    .select("id, members, creator_id, status")
    .eq("id", invite.squad_id)
    .maybeSingle();

  if (squadErr || !squadData) {
    return NextResponse.json({ error: "Squad introuvable" }, { status: 404 });
  }

  const squad = squadData as SquadRow;
  if (squad.status === "closed") {
    return NextResponse.json({ error: "Squad ferme" }, { status: 403 });
  }

  const currentMembers = new Set<string>([...(squad.members ?? []), squad.creator_id]);
  if (currentMembers.has(user.id)) {
    return NextResponse.json({ joined: true, idempotent: true, squad_id: squad.id });
  }

  if (currentMembers.size >= MAX_SQUAD_SIZE) {
    return NextResponse.json({ error: "Squad complet" }, { status: 409 });
  }

  const newMembers = Array.from(currentMembers);
  newMembers.push(user.id);
  const newStatus = newMembers.length >= MAX_SQUAD_SIZE ? "full" : "active";

  // 3. Atomic-ish update: squad membership + mark invite used
  const { error: updateErr } = await db
    .from("squads")
    .update({ members: newMembers, status: newStatus })
    .eq("id", squad.id);

  if (updateErr) {
    logger.error("api_squad_join_update_failed", { err: updateErr.message });
    return NextResponse.json({ error: "Erreur mise a jour squad" }, { status: 500 });
  }

  const { error: markErr } = await db
    .from("squad_invites")
    .update({ used_by: user.id })
    .eq("id", invite.id);

  if (markErr) {
    logger.error("api_squad_join_mark_invite_failed", { err: markErr.message });
  }

  return NextResponse.json({ joined: true, squad_id: squad.id });
}

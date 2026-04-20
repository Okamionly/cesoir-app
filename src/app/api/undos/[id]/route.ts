import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";
import { logger } from "@/lib/logger";

const idParamSchema = z.object({ id: z.string().uuid("id doit être un UUID") });

/**
 * DELETE /api/undos/[id]
 * Auth: Bearer <access_token>
 *
 * Removes an undo record. Rarely used — exposed so the client can revert
 * an accidental undo within the same session. Does NOT re-insert the
 * original interaction (the user must swipe again deliberately).
 *
 * Rate limit: 10/min per user.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Next 16 async context: params is a Promise
type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
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

  const rl = await checkRateLimit(`undos-del:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  const params = await context.params;
  const parsed = idParamSchema.safeParse(params);
  if (!parsed.success) {
    logger.warn("api_undos_delete_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        error: "validation_failed",
        code: "validation_failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const { id } = parsed.data;

  // RLS constrains DELETE to rows owned by the user — extra eq for defence.
  const { data: deleted, error } = await db
    .from("swipe_undos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    logger.error("api_undos_delete_failed", { err: error.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Undo introuvable" }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}

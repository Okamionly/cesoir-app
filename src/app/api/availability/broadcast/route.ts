/**
 * /api/availability/broadcast — "Je suis dispo ce soir" toggle.
 *
 * POST   { hours: 1 | 3 | 6 } → sets profiles.broadcast_until = now() + Xh
 * DELETE                       → clears profiles.broadcast_until
 *
 * Both routes require auth (Bearer or SSR cookie via requireUser).
 * Body validation via Zod — only the three durations are allowed so a
 * client cannot set itself "available for the next 30 days".
 *
 * The flag auto-expires server-side: any consumer reading
 * `broadcast_until > now()` (e.g. nearby_profiles RPC) gets the right
 * answer the moment the deadline passes — no cron / cleanup job needed.
 */
import { z } from "zod";
import { NextResponse } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireUser, AuthError } from "@/lib/api/auth";
import { logger } from "@/lib/logger";

// Allowed durations for the broadcast flag.
// Capped at 6h so a typo ("60") can't put a user on the radar all week.
const broadcastSchema = z.object({
  hours: z.union([z.literal(1), z.literal(3), z.literal(6)]),
});

export async function POST(request: Request) {
  // --- Auth ---
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

  // --- Parse body ---
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }

  const parsed = broadcastSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError("hours doit valoir 1, 3 ou 6", 400, {
      code: "validation_failed",
      details: parsed.error.flatten(),
    });
  }
  const { hours } = parsed.data;

  // --- Compute expiry ---
  const expiresAtMs = Date.now() + hours * 60 * 60 * 1000;
  const broadcast_until = new Date(expiresAtMs).toISOString();

  // --- Persist ---
  const { error } = await db
    .from("profiles")
    .update({ broadcast_until })
    .eq("id", user.id);

  if (error) {
    logger.error("api_availability_broadcast_set_failed", {
      err: error.message,
      uid: user.id,
    });
    return apiError("Impossible d'activer le statut", 500, {
      code: "db_update_failed",
    });
  }

  logger.info("api_availability_broadcast_set", { uid: user.id, hours });

  return apiOk({ broadcast_until, hours });
}

export async function DELETE(request: Request) {
  // --- Auth ---
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

  const { error } = await db
    .from("profiles")
    .update({ broadcast_until: null })
    .eq("id", user.id);

  if (error) {
    logger.error("api_availability_broadcast_clear_failed", {
      err: error.message,
      uid: user.id,
    });
    return apiError("Impossible d'annuler le statut", 500, {
      code: "db_update_failed",
    });
  }

  logger.info("api_availability_broadcast_clear", { uid: user.id });

  return apiOk({ broadcast_until: null });
}

// Reject everything else explicitly so we don't silently 404.
export function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée", code: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST, DELETE" } },
  );
}

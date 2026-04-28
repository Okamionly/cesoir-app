/**
 * GET /api/cron/anti-ghost — daily karma decay sweep for chronic ghosters.
 *
 * Concept: see `supabase/migrations/045_anti_ghost_decay.sql`. Once a
 * day this route runs `apply_ghost_decay()` which scans every user, computes
 * a ghost-score (0-3), inserts a `ghost_penalties` row when >= 1 and
 * deducts -15 × severity karma. Penalties expire after 30 days and the
 * matching pipeline applies a visibility deboost while they are active.
 *
 * Auth: Bearer token equal to `CRON_SECRET` (set in Vercel env vars).
 *       Same shape as /api/push/last-call so a single secret rotation
 *       covers all cron endpoints.
 *
 * Schedule: configured via vercel.json `crons` entry — `0 4 * * *`
 *           (4am UTC daily). 4am is intentionally pre-Europe morning
 *           so users wake up to the new state — visible deboosts +
 *           karma deductions land before peak traffic instead of in
 *           the middle of an evening swipe session.
 *
 * Idempotency: the underlying RPC enforces a UNIQUE (user_id, day)
 * constraint on `ghost_penalties` so re-runs in the same UTC day are
 * silent no-ops. A manual replay (uptime probe, debug fetch) cannot
 * double-charge anyone.
 *
 * Response shape:
 *   { ok: true, stats: { users_scanned, penalties_added, karma_deducted } }
 *
 * Edge cases:
 *   - CRON_SECRET unset → 500 with a single log line. We do NOT process
 *     anything because running with no auth is worse than missing a day.
 *   - Service-role env missing → 500. Same reasoning.
 *   - RPC failure → 500 with the error string echoed back, so the
 *     uptime probe can surface "DB write failed" vs "auth failed".
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// The RPC is one big LOOP over auth.users. With a few thousand users
// and the per-user signal queries it can comfortably take ~30-60s.
// 300s is the Vercel Hobby cron ceiling; 800s on Pro. Pick the lower.
export const maxDuration = 300;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "anti_ghost_misconfigured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface DecayStats {
  users_scanned: number;
  penalties_added: number;
  karma_deducted: number;
}

export async function GET(request: NextRequest) {
  // ── 1. Cron secret check ────────────────────────────────────────
  // Same Bearer-token contract as /api/push/last-call. We don't rely on
  // the legacy x-vercel-cron-signature header — explicit > implicit.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error("anti_ghost_cron_secret_unset");
    return NextResponse.json(
      { error: "cron_secret_unset" },
      { status: 500 },
    );
  }
  const provided = request.headers.get("authorization");
  if (provided !== `Bearer ${expected}`) {
    logger.warn("anti_ghost_cron_auth_failed", {
      hasHeader: Boolean(provided),
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ── 2. Boot Supabase service-role client ────────────────────────
  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (err) {
    logger.error("anti_ghost_env_missing", { err: String(err) });
    return NextResponse.json(
      { error: "configuration_error" },
      { status: 500 },
    );
  }

  // ── 3. Run the RPC ──────────────────────────────────────────────
  // The RPC returns a single TABLE row — Supabase wraps it in an array.
  const { data, error } = await admin.rpc("apply_ghost_decay");

  if (error) {
    logger.error("anti_ghost_rpc_failed", { err: error.message });
    return NextResponse.json(
      { error: "rpc_failed", detail: error.message },
      { status: 500 },
    );
  }

  const row = Array.isArray(data) ? (data[0] as DecayStats | undefined) : null;
  const stats: DecayStats = {
    users_scanned: row?.users_scanned ?? 0,
    penalties_added: row?.penalties_added ?? 0,
    karma_deducted: row?.karma_deducted ?? 0,
  };

  logger.info("anti_ghost_run_complete", { stats });

  return NextResponse.json({
    ok: true,
    stats,
    ts: new Date().toISOString(),
  });
}

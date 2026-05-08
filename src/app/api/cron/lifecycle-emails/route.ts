/**
 * GET /api/cron/lifecycle-emails
 *
 * Daily retention cron that fires D1/D3/D7 lifecycle emails.
 *
 * Rules:
 *   D1 — user hasn't swiped in the last 24-48h (last_swipe_at between 24h-48h ago)
 *   D3 — user hasn't had a match in 3-4 days AND has swiped at least once (active but no luck)
 *   D7 — user hasn't been active (no swipe, no message, no login) in 7-8 days
 *
 * Idempotency: lifecycle_emails_log (mig 051) has UNIQUE(user_id, email_type, sent_at::date).
 * If the cron runs twice in the same UTC day, the INSERT fails silently — no duplicate.
 *
 * Auth: Bearer token equal to CRON_SECRET — same contract as /api/cron/anti-ghost.
 *
 * Schedule: daily at 10:00 UTC (configured in vercel.json).
 *
 * Response shape:
 *   { ok: true, stats: { d1_sent, d3_sent, d7_sent, skipped, errors } }
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { sendD1NoSwipe, sendD3NoMatch, sendD7Inactive } from "@/lib/email/lifecycle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// ── Admin client ─────────────────────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("lifecycle_cron_misconfigured: env missing");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Log helper — returns false if already sent today (idempotency) ────────────

async function tryLogEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  emailType: "d1_no_swipe" | "d3_no_match" | "d7_inactive"
): Promise<boolean> {
  const { error } = await admin.from("lifecycle_emails_log").insert({
    user_id: userId,
    email_type: emailType,
  });
  if (error) {
    // 23505 = unique_violation = already sent today → idempotent skip
    if ((error as { code?: string }).code === "23505") return false;
    logger.error("lifecycle_log_insert_failed", { userId, emailType, err: error.message });
    return false;
  }
  return true;
}

// ── Stats shape ───────────────────────────────────────────────────────────────

interface CronStats {
  d1_sent: number;
  d3_sent: number;
  d7_sent: number;
  skipped: number;
  errors: number;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Auth
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error("lifecycle_cron_secret_unset");
    return NextResponse.json({ error: "cron_secret_unset" }, { status: 500 });
  }
  const provided = request.headers.get("authorization");
  if (provided !== `Bearer ${expected}`) {
    logger.warn("lifecycle_cron_auth_failed", { hasHeader: Boolean(provided) });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Admin client
  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    logger.error("lifecycle_cron_env_missing", { err: String(err) });
    return NextResponse.json({ error: "configuration_error" }, { status: 500 });
  }

  const stats: CronStats = { d1_sent: 0, d3_sent: 0, d7_sent: 0, skipped: 0, errors: 0 };
  const now = new Date();

  // ── D7: fully inactive 7-8 days ago ──────────────────────────────────────
  // A user is "inactive" if last_active_at is between 7 and 8 days ago.
  {
    const d7From = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const d7To   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: d7Users, error: d7Err } = await admin
      .from("profiles")
      .select("id")
      .gte("last_active_at", d7From)
      .lt("last_active_at", d7To)
      .limit(500);

    if (d7Err) {
      logger.error("lifecycle_d7_query_failed", { err: d7Err.message });
      stats.errors++;
    } else {
      for (const row of d7Users ?? []) {
        const canSend = await tryLogEmail(admin, row.id, "d7_inactive");
        if (!canSend) { stats.skipped++; continue; }

        const result = await sendD7Inactive(row.id);
        if (result.ok) {
          stats.d7_sent++;
        } else {
          stats.errors++;
          logger.error("lifecycle_d7_send_failed", { userId: row.id, err: result.error });
        }
      }
    }
  }

  // ── D3: no match in 3-4 days, but has swiped ─────────────────────────────
  // Uses last_match_at (or null if never) and last_swipe_at to confirm active.
  {
    const d3From = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const d3To   = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    // last_swipe_at within last 3 days (they're still trying)
    const swipeRecent = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: d3Users, error: d3Err } = await admin
      .from("profiles")
      .select("id")
      .or(`last_match_at.is.null,last_match_at.gte.${d3From}`)
      .filter("last_match_at", "lt", d3To)
      .gte("last_swipe_at", swipeRecent)
      .limit(500);

    if (d3Err) {
      logger.error("lifecycle_d3_query_failed", { err: d3Err.message });
      stats.errors++;
    } else {
      for (const row of d3Users ?? []) {
        const canSend = await tryLogEmail(admin, row.id, "d3_no_match");
        if (!canSend) { stats.skipped++; continue; }

        const result = await sendD3NoMatch(row.id);
        if (result.ok) {
          stats.d3_sent++;
        } else {
          stats.errors++;
          logger.error("lifecycle_d3_send_failed", { userId: row.id, err: result.error });
        }
      }
    }
  }

  // ── D1: no swipe in 24-48h ────────────────────────────────────────────────
  {
    const d1From = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const d1To   = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: d1Users, error: d1Err } = await admin
      .from("profiles")
      .select("id")
      .gte("last_swipe_at", d1From)
      .lt("last_swipe_at", d1To)
      .limit(500);

    if (d1Err) {
      logger.error("lifecycle_d1_query_failed", { err: d1Err.message });
      stats.errors++;
    } else {
      for (const row of d1Users ?? []) {
        const canSend = await tryLogEmail(admin, row.id, "d1_no_swipe");
        if (!canSend) { stats.skipped++; continue; }

        const result = await sendD1NoSwipe(row.id);
        if (result.ok) {
          stats.d1_sent++;
        } else {
          stats.errors++;
          logger.error("lifecycle_d1_send_failed", { userId: row.id, err: result.error });
        }
      }
    }
  }

  logger.info("lifecycle_cron_complete", { stats });

  return NextResponse.json({ ok: true, stats, ts: now.toISOString() });
}

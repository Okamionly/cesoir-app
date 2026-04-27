import { createClient as createAnonClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireUser, AuthError } from "@/lib/api/auth";

/**
 * POST /api/account/delete
 *
 * Deletes the user's profile + avatars + auth.users entry + every row
 * across child tables that references the user. Implements RGPD Art. 17
 * "right to erasure".
 *
 * Wave 16 (2026-04-26) — RGPD P0 fix:
 *   Previous version only deleted auth.users + profile + avatars and
 *   relied on Postgres `ON DELETE CASCADE` to propagate. That worked
 *   for FK-bound tables but left orphans wherever the FK was missing,
 *   used `SET NULL`, or referenced `profiles(id)` after the profile
 *   row was already gone. It also gave us no audit log of what was
 *   actually wiped.
 *
 *   This version explicitly DELETEs from every known child table
 *   before touching auth.users, using the service-role client to
 *   bypass RLS. Each table is wrapped in its own try/catch — a single
 *   missing table or column does NOT abort the cascade. The auth
 *   delete still succeeds even if some child cleanups fail; orphans
 *   are logged and surfaced in the response payload for downstream
 *   ops to triage.
 *
 * C2 — DELETE policies on profiles + storage.objects added in
 * migration 003_security_hardening (2026-04-19). Before that migration
 * this route silently returned success without deleting anything.
 *
 * C2bis — Now verifies row counts via .select() and uses
 * SUPABASE_SERVICE_ROLE_KEY (when present) to also delete the auth.users
 * entry — without it, the auth account is orphaned and the email can
 * never be re-used until manual cleanup. The route still succeeds
 * without service role (profile + avatars gone) but flags the orphan
 * in the response.
 */

/**
 * Cascade specification: list of (table, columns-to-match) pairs that
 * reference the deleted user. Each entry is best-effort — if the table
 * or column doesn't exist, the cleanup logs and moves on.
 *
 * Order matters loosely: child tables before parent (messages before
 * conversations) so RLS cascades don't fight each other, but Postgres
 * FKs handle the rest if a row is left behind.
 */
type CascadeTarget = {
  table: string;
  columns: readonly string[];
};

const CASCADE_TARGETS: readonly CascadeTarget[] = [
  // Intimate content first — RGPD Art. 17 priority
  { table: "messages", columns: ["sender_id"] },
  { table: "conversations", columns: ["user_a", "user_b"] },
  // Social graph
  { table: "interactions", columns: ["from_user", "to_user"] },
  // Trust & safety (both legacy `reports` and new `user_reports`)
  { table: "reports", columns: ["reporter_id", "reported_id"] },
  { table: "user_reports", columns: ["reporter_id", "reported_id"] },
  { table: "reviews", columns: ["reviewer_id", "reviewed_id"] },
  // Activity / gamification
  { table: "feed_activities", columns: ["user_id"] },
  { table: "feed_reactions", columns: ["user_id"] },
  { table: "karma_transactions", columns: ["user_id"] },
  { table: "mode_activations", columns: ["user_id"] },
  { table: "achievements", columns: ["user_id"] },
  { table: "challenges", columns: ["user_id"] },
  { table: "streaks", columns: ["user_id"] },
  // Plans & rooms
  { table: "flash_plans", columns: ["creator_id"] },
  { table: "flash_plan_participants", columns: ["user_id"] },
  { table: "plans", columns: ["user_a", "user_b"] },
  { table: "rooms", columns: ["host_id"] },
  // Events
  { table: "popup_events", columns: ["creator_id"] },
  { table: "event_attendees", columns: ["user_id"] },
  { table: "event_rsvps", columns: ["user_id"] },
  // Squads
  { table: "squads", columns: ["creator_id"] },
  { table: "squad_invites", columns: ["inviter_id"] },
  // Safety
  { table: "sos_events", columns: ["user_id"] },
  { table: "user_blocks", columns: ["blocker_id", "blocked_id"] },
  { table: "user_strikes", columns: ["user_id"] },
  { table: "moderation_queue", columns: ["user_id"] },
  { table: "profile_verifications", columns: ["user_id"] },
  { table: "trusted_contacts", columns: ["user_id"] },
  { table: "checkins", columns: ["user_id"] },
  // Wallet / financial — log first if audit table exists, then delete
  { table: "wallet_transactions", columns: ["user_id"] },
  { table: "user_wallet", columns: ["user_id"] },
  { table: "swipe_undos", columns: ["user_id", "target_id"] },
  { table: "match_caps", columns: ["user_id"] },
  { table: "subscriptions", columns: ["user_id"] },
  { table: "purchases", columns: ["user_id"] },
  // Settings / preferences
  { table: "user_settings", columns: ["user_id"] },
  { table: "user_preferences", columns: ["user_id"] },
  { table: "availability", columns: ["user_id"] },
  { table: "push_subscriptions", columns: ["user_id"] },
];

/**
 * Best-effort delete from one cascade target. Failures are logged but
 * never thrown — an unknown table, missing column, or RLS-denied write
 * MUST NOT abort the larger account deletion flow.
 */
async function bestEffortDelete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  target: CascadeTarget,
  userId: string,
): Promise<{ table: string; deleted: number; error?: string }> {
  let totalDeleted = 0;
  for (const column of target.columns) {
    try {
      const { data, error } = await client
        .from(target.table)
        .delete()
        .eq(column, userId)
        .select("*");
      if (error) {
        // PGRST205 / 42P01 = relation does not exist — skip silently
        // 42703 = column does not exist — skip silently
        const code = (error as { code?: string }).code;
        if (code === "PGRST205" || code === "42P01" || code === "42703") {
          continue;
        }
        logger.error("api_account_delete_cascade_failed", {
          table: target.table,
          column,
          err: error.message,
          code,
        });
        return { table: target.table, deleted: totalDeleted, error: error.message };
      }
      totalDeleted += data?.length ?? 0;
    } catch (e) {
      logger.error("api_account_delete_cascade_unexpected", {
        table: target.table,
        column,
        err: String(e),
      });
      return { table: target.table, deleted: totalDeleted, error: String(e) };
    }
  }
  return { table: target.table, deleted: totalDeleted };
}

/**
 * Special-case for `invite_codes`:
 *   - rows where THIS user CLAIMED a code → set used_by = NULL (preserve
 *     the historical code so the inviter still sees their slot consumed
 *     count if we want to re-issue, but unbind the PII)
 *   - rows where THIS user CREATED codes → DELETE (their personal codes
 *     are useless once they're gone)
 */
async function cascadeInviteCodes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  userId: string,
): Promise<{ unbound: number; deleted: number; error?: string }> {
  let unbound = 0;
  let deleted = 0;
  try {
    const { data: unboundRows, error: unbErr } = await client
      .from("invite_codes")
      .update({ used_by: null, used_at: null })
      .eq("used_by", userId)
      .select("code");
    if (unbErr) {
      const code = (unbErr as { code?: string }).code;
      if (code !== "PGRST205" && code !== "42P01" && code !== "42703") {
        logger.error("api_account_delete_invite_codes_unbind_failed", {
          err: unbErr.message,
        });
      }
    } else {
      unbound = unboundRows?.length ?? 0;
    }

    const { data: delRows, error: delErr } = await client
      .from("invite_codes")
      .delete()
      .eq("created_by", userId)
      .select("code");
    if (delErr) {
      const code = (delErr as { code?: string }).code;
      if (code !== "PGRST205" && code !== "42P01" && code !== "42703") {
        logger.error("api_account_delete_invite_codes_delete_failed", {
          err: delErr.message,
        });
        return { unbound, deleted, error: delErr.message };
      }
    } else {
      deleted = delRows?.length ?? 0;
    }
  } catch (e) {
    logger.error("api_account_delete_invite_codes_unexpected", { err: String(e) });
    return { unbound, deleted, error: String(e) };
  }
  return { unbound, deleted };
}

/**
 * Optional audit trail — if a `deleted_users_audit` table exists, log
 * the deletion event there with the user's wallet balance, message
 * count, etc. so finance / support can reconcile later. Best-effort:
 * if the table doesn't exist, silently skip.
 */
async function logDeletionAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  userId: string,
  email: string | undefined,
): Promise<void> {
  try {
    const { error } = await client
      .from("deleted_users_audit")
      .insert({
        user_id: userId,
        email,
        deleted_at: new Date().toISOString(),
        reason: "user_initiated_rgpd",
      });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code !== "PGRST205" && code !== "42P01") {
        logger.warn("api_account_delete_audit_failed", { err: error.message });
      }
    }
  } catch {
    // Truly best-effort — never throw
  }
}

export async function POST(request: Request) {
  try {
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
    const { user, supabase: userClient } = ctx;
    const userId = user.id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Rate limit 1/hour per user — prevents accidental spam / double-click.
    // Placed AFTER auth so we key on userId (anonymous attackers are 401'd).
    const rl = await checkRateLimit(`account-delete:${userId}`, 1, 60 * 60_000);
    if (!rl.ok) return rateLimitResponse(rl);

    // ─── Build the service-role admin client up front. We need it for
    //     (a) cascade deletes that bypass RLS, (b) auth.admin.deleteUser
    //     at the end, (c) the optional audit trail.  ──────────────────
    const supabaseAdmin = serviceRoleKey
      ? createAnonClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    // ─── RGPD Art. 17 — Cascade delete every child row referencing
    //     this user. We use the service-role client so RLS doesn't
    //     silently drop our deletes. Each table is best-effort: a
    //     failure logs + continues so a single broken table doesn't
    //     leave the auth row alive (worse outcome than orphan rows). ──
    const cascadeResults: Array<{ table: string; deleted: number; error?: string }> =
      [];
    if (supabaseAdmin) {
      // Audit log first (so we capture state before we wipe it)
      await logDeletionAudit(supabaseAdmin, userId, user.email);

      // Standard cascade tables
      for (const target of CASCADE_TARGETS) {
        const result = await bestEffortDelete(supabaseAdmin, target, userId);
        cascadeResults.push(result);
      }

      // Special-case: invite_codes (unbind + delete)
      const inviteResult = await cascadeInviteCodes(supabaseAdmin, userId);
      cascadeResults.push({
        table: "invite_codes",
        deleted: inviteResult.deleted + inviteResult.unbound,
        error: inviteResult.error,
      });
    } else {
      logger.warn("api_account_delete_no_service_role_skipping_cascade", {
        userId,
      });
    }

    // ─── Delete avatar files (irreversible but small risk if profile
    //     delete fails — orphan files, easier to clean than orphan rows) ─
    let avatarsDeleted = 0;
    const { data: files } = await userClient.storage
      .from("avatars")
      .list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      const { data: removed, error: rmError } = await userClient.storage
        .from("avatars")
        .remove(paths);
      if (rmError) {
        logger.error("api_account_delete_avatar_remove_failed", {
          err: rmError.message,
        });
      }
      avatarsDeleted = removed?.length ?? 0;
    }

    // ─── Delete profile row, verify it actually deleted (RLS could silently
    //     drop the operation if policy mismatched). ──────────────────────
    const { data: deletedRows, error: profileError } = await userClient
      .from("profiles")
      .delete()
      .eq("id", userId)
      .select("id");

    if (profileError) {
      logger.error("api_account_delete_profile_failed", { err: profileError.message });
      return NextResponse.json(
        { error: "Échec de la suppression du profil" },
        { status: 500 },
      );
    }

    if (!deletedRows || deletedRows.length === 0) {
      // Should not happen with the new DELETE policy, but defend in depth.
      logger.error("api_account_delete_profile_zero_rows", { userId });
      return NextResponse.json(
        { error: "Profil non trouvé ou déjà supprimé" },
        { status: 404 },
      );
    }

    // ─── Sign user out so any remaining session token is invalidated ────
    await userClient.auth.signOut();

    // ─── Delete auth.users via service role (if configured) ─────────────
    let authDeleted = false;
    let orphanWarning: string | null = null;
    if (supabaseAdmin) {
      const { error: adminError } = await supabaseAdmin.auth.admin.deleteUser(
        userId,
      );
      if (adminError) {
        logger.error("api_account_delete_admin_user_failed", { err: adminError.message });
        orphanWarning =
          "Compte auth orphelin — contacter le support pour cleanup complet.";
      } else {
        authDeleted = true;
      }
    } else {
      orphanWarning =
        "SUPABASE_SERVICE_ROLE_KEY non configurée — l'entrée auth.users reste (orphelin RGPD).";
      logger.warn("api_account_delete_orphan_auth", { warning: orphanWarning });
    }

    const cascadeSummary = cascadeResults
      .filter((r) => r.deleted > 0 || r.error)
      .reduce<Record<string, { deleted: number; error?: string }>>((acc, r) => {
        acc[r.table] = { deleted: r.deleted, ...(r.error ? { error: r.error } : {}) };
        return acc;
      }, {});

    return NextResponse.json({
      success: true,
      message: "Compte supprime",
      details: {
        profileDeleted: true,
        avatarsDeleted,
        authDeleted,
        orphanWarning,
        cascade: cascadeSummary,
      },
    });
  } catch (e) {
    logger.error("api_account_delete_unexpected", { err: String(e) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireUser, AuthError } from "@/lib/api/auth";

/**
 * POST /api/account/delete
 *
 * Deletes the user's profile + avatars + auth.users entry.
 * Auth via unified `requireUser()` (Bearer first, SSR cookie fallback).
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

    // ─── Delete avatar files first (irreversible but small risk if profile
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
        logger.error("api_account_delete_avatar_remove_failed", { err: rmError.message });
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
    if (serviceRoleKey) {
      const adminClient = createAnonClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: adminError } = await adminClient.auth.admin.deleteUser(
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

    return NextResponse.json({
      success: true,
      message: "Compte supprime",
      details: {
        profileDeleted: true,
        avatarsDeleted,
        authDeleted,
        orphanWarning,
      },
    });
  } catch (e) {
    logger.error("api_account_delete_unexpected", { err: String(e) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

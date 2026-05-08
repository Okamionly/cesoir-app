/**
 * POST /api/account/export
 *
 * RGPD Article 20 — Right to data portability.
 *
 * Aggregates all personal data for the authenticated user and returns it
 * as a structured JSON download attachment.
 *
 * Data collected:
 *   - Profile & public info
 *   - Conversations + messages (content + metadata)
 *   - Interactions (likes, swipes, passes)
 *   - Karma transactions
 *   - Achievements
 *   - Reports filed and received
 *   - User settings + preferences
 *   - Voice messages metadata (storage paths, no blobs)
 *   - Moments metadata
 *   - Purchases + subscription info
 *   - Streaks, challenges, mode activations
 *
 * Rate limit: 1 export per user per day.
 *
 * Response: JSON file attachment.
 * After generation, a confirmation email is sent via Resend with the
 * download instructions (RGPD best practice — audit trail).
 *
 * Security: service-role client for cross-table reads, user is identified
 * via Bearer token or SSR cookie (requireUser).
 */
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { requireUser, AuthError } from "@/lib/api/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ── Admin client ──────────────────────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("service_role_env_missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Best-effort table fetch ───────────────────────────────────────────────────
// Returns [] on any error — we never abort the export because one table fails.

async function fetchTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  table: string,
  column: string,
  userId: string,
  selectCols = "*"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  try {
    const { data, error } = await admin
      .from(table)
      .select(selectCols)
      .eq(column, userId)
      .limit(5000);

    if (error) {
      const code = (error as { code?: string }).code;
      // Silently skip tables that don't exist (schema drift between waves)
      if (code === "PGRST205" || code === "42P01") return [];
      logger.warn("account_export_table_skip", { table, err: error.message });
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

// ── Resend email confirmation ─────────────────────────────────────────────────

async function sendExportConfirmationEmail(email: string, exportedAt: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "CeSoir <noreply@cesoir.app>";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesoir-app.vercel.app";

  if (!RESEND_API_KEY) return;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#fff;padding:40px 20px;color:#111;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:28px;">☾</span>
      <span style="font-size:20px;font-weight:700;margin-left:8px;">CeSoir</span>
    </div>
    <h2 style="font-size:18px;font-weight:700;margin:0 0 12px 0;">Export de vos données</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px 0;">
      Votre export de données personnelles (RGPD Art. 20) a été généré le
      <strong>${new Date(exportedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</strong>.
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 16px 0;">
      Le fichier JSON a été téléchargé directement sur votre appareil.
      Si vous avez besoin d'un nouvel export, vous pourrez en effectuer un autre demain.
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 24px 0;">
      Pour toute question sur vos données, contactez-nous à
      <a href="mailto:privacy@cesoir.app" style="color:#8B5CF6;">privacy@cesoir.app</a>.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
    <p style="font-size:11px;color:#999;margin:0;">
      Conforme au Règlement Général sur la Protection des Données (RGPD) — Article 20.
      <a href="${SITE_URL}/privacy" style="color:#8B5CF6;">Politique de confidentialité</a>
    </p>
  </div>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Votre export de données CeSoir (RGPD Art. 20)",
        html,
      }),
    });
  } catch (err) {
    logger.warn("account_export_confirmation_email_failed", { err: String(err) });
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Auth
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user } = ctx;
  const userId = user.id;

  // 2. Rate limit: 1 export per user per day (86400s)
  const rl = await checkRateLimit(`account-export:${userId}`, 1, 86_400_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // 3. Admin client
  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    logger.error("account_export_admin_client_failed", { err: String(err) });
    return NextResponse.json({ error: "configuration_error" }, { status: 500 });
  }

  const exportedAt = new Date().toISOString();

  // 4. Aggregate all data — parallel where possible, best-effort everywhere
  const [
    profileRows,
    conversationRows,
    messageRows,
    interactionRows,
    karmaRows,
    achievementRows,
    reportsFiled,
    reportsReceived,
    userSettingsRows,
    userPrefsRows,
    voiceMessageRows,
    momentRows,
    purchaseRows,
    subscriptionRows,
    streakRows,
    challengeRows,
    modeActivationRows,
  ] = await Promise.all([
    fetchTable(admin, "profiles",          "id",             userId, "id,display_name,bio,city,age,gender,mode,photos,verified_at,created_at,updated_at"),
    fetchTable(admin, "conversations",     "user_a",         userId, "id,user_b,created_at,last_message_at"),
    fetchTable(admin, "messages",          "sender_id",      userId, "id,conversation_id,content,type,sent_at,read_at"),
    fetchTable(admin, "interactions",      "from_user",      userId, "id,to_user,type,created_at"),
    fetchTable(admin, "karma_transactions","user_id",        userId, "id,amount,reason,created_at"),
    fetchTable(admin, "achievements",      "user_id",        userId, "id,achievement_type,unlocked_at"),
    fetchTable(admin, "user_reports",      "reporter_id",    userId, "id,reported_id,reason,created_at"),
    fetchTable(admin, "user_reports",      "reported_id",    userId, "id,reporter_id,reason,created_at"),
    fetchTable(admin, "user_settings",     "user_id",        userId),
    fetchTable(admin, "user_preferences",  "user_id",        userId),
    fetchTable(admin, "messages",          "sender_id",      userId, "id,conversation_id,type,sent_at", ),
    fetchTable(admin, "moments",           "user_id",        userId, "id,media_url,caption,created_at,expires_at"),
    fetchTable(admin, "purchases",         "user_id",        userId, "id,item,amount_cents,created_at"),
    fetchTable(admin, "subscriptions",     "user_id",        userId, "id,plan,status,created_at,expires_at"),
    fetchTable(admin, "streaks",           "user_id",        userId),
    fetchTable(admin, "challenges",        "user_id",        userId, "id,challenge_type,status,created_at,completed_at"),
    fetchTable(admin, "mode_activations",  "user_id",        userId, "id,mode,activated_at"),
  ]);

  // Filter voice messages (type="voice") from message rows
  const voiceMessagesMeta = voiceMessageRows.filter((m: { type?: string }) => m.type === "voice");

  // Build conversation map: merge peer info into conversations
  const conversationsWithMessages = conversationRows.map((conv: { id: string; user_b?: string; created_at?: string; last_message_at?: string }) => ({
    id: conv.id,
    peer_user_id: conv.user_b,
    created_at: conv.created_at,
    last_message_at: conv.last_message_at,
    messages: messageRows.filter((m: { conversation_id?: string }) => m.conversation_id === conv.id),
  }));

  // 5. Build RGPD Art. 20 compliant payload
  const exportPayload = {
    rgpd_article: 20,
    exported_at: exportedAt,
    user_id: userId,
    user: profileRows[0] ?? null,
    conversations: conversationsWithMessages,
    interactions: interactionRows,
    karma: karmaRows,
    achievements: achievementRows,
    reports: {
      filed: reportsFiled,
      received: reportsReceived,
    },
    preferences: {
      settings: userSettingsRows[0] ?? null,
      preferences: userPrefsRows[0] ?? null,
    },
    voice_messages_metadata: voiceMessagesMeta,
    moments: momentRows,
    purchases: purchaseRows,
    subscriptions: subscriptionRows,
    streaks: streakRows,
    challenges: challengeRows,
    mode_activations: modeActivationRows,
  };

  // 6. Send confirmation email (fire-and-forget, non-blocking)
  if (user.email) {
    sendExportConfirmationEmail(user.email, exportedAt).catch(() => {});
  }

  logger.info("account_export_generated", { userId, tables_count: 17 });

  // 7. Return as downloadable JSON attachment
  const filename = `cesoir-data-export-${exportedAt.slice(0, 10)}.json`;
  const json = JSON.stringify(exportPayload, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(Buffer.byteLength(json, "utf8")),
      "Cache-Control": "no-store",
      "X-RGPD-Article": "20",
    },
  });
}

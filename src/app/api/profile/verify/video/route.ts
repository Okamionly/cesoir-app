import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/api/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/profile/verify/video
 *
 * Accepts a FormData payload with a `video` file (liveness check recording).
 * Uploads it to the private "verifications" Supabase Storage bucket, then
 * creates or updates a row in `profile_verifications` with method='video'
 * and status='pending'.
 *
 * Liveness review: status stays 'pending' until manual review or an automated
 * service (e.g. Sightengine) processes the video asynchronously via a webhook.
 * When confidence > 0.85 from the automated check, status is promoted to
 * 'verified' and profiles.is_verified is set to true via a DB trigger.
 *
 * Rate limit: 3 attempts per hour per user.
 *
 * File naming: `<userId>/video/<timestamp>.<ext>` — preserves history.
 */

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB for video
const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];
const BUCKET = "verifications";

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
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

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await checkRateLimit(`verify-video:${userId}`, 3, 60 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // ── Parse FormData ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps FormData invalide" }, { status: 400 });
  }

  const video = formData.get("video");
  if (!video || !(video instanceof File)) {
    return NextResponse.json(
      { error: "Champ 'video' manquant ou invalide" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(video.type)) {
    return NextResponse.json(
      { error: "Format video non supporté. Utilisez MP4, MOV ou WebM." },
      { status: 400 },
    );
  }

  if (video.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Vidéo trop volumineuse (max 50 MB)" },
      { status: 400 },
    );
  }

  // ── Build admin client ────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error("api_verify_video_missing_env");
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Upload to private storage bucket ─────────────────────────────────────
  const extMap: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-m4v": "m4v",
  };
  const ext = extMap[video.type] ?? "mp4";
  const timestamp = Date.now();
  const storagePath = `${userId}/video/${timestamp}.${ext}`;

  const arrayBuffer = await video.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: video.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error("api_verify_video_upload_failed", { err: uploadError.message, userId });
    return NextResponse.json(
      { error: "Echec de l'upload de la vidéo. Reessaie." },
      { status: 500 },
    );
  }

  // ── Upsert profile_verifications row ──────────────────────────────────────
  const { error: dbError } = await supabaseAdmin
    .from("profile_verifications")
    .upsert(
      {
        user_id: userId,
        method: "video",
        status: "pending",
        storage_path: storagePath,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,method" },
    );

  if (dbError) {
    logger.error("api_verify_video_db_failed", { err: dbError.message, userId });
    // Cleanup orphan
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: "Erreur enregistrement verification. Vidéo supprimée." },
      { status: 500 },
    );
  }

  logger.info("api_verify_video_submitted", { userId, storagePath });

  return NextResponse.json({
    success: true,
    status: "pending",
    message:
      "Vidéo soumise. La vérification liveness sera traitée sous 24h. Tu recevras une notification quand c'est validé.",
  });
}

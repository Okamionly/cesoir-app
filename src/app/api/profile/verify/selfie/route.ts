import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/api/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/profile/verify/selfie
 *
 * Accepts a FormData payload with a `photo` file. Uploads it to the private
 * "verifications" Supabase Storage bucket, then creates or updates a row in
 * `profile_verifications` with method='selfie' and status='pending'.
 *
 * Manual review queue: status remains 'pending' until a moderator promotes it
 * to 'verified' or 'rejected'. When verified, a trigger / cron updates
 * profiles.is_verified = true.
 *
 * Rate limit: 3 attempts per hour per user to prevent abuse.
 *
 * Security:
 *   - Bucket "verifications" must be private (no public read).
 *   - Only the service-role key can list/read objects in that bucket.
 *   - Files are stored at `<userId>/selfie/<timestamp>.<ext>` so old
 *     attempts are preserved for audit without overwriting.
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
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
  const rl = await checkRateLimit(`verify-selfie:${userId}`, 3, 60 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // ── Parse FormData ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps FormData invalide" }, { status: 400 });
  }

  const photo = formData.get("photo");
  if (!photo || !(photo instanceof File)) {
    return NextResponse.json(
      { error: "Champ 'photo' manquant ou invalide" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
    return NextResponse.json(
      { error: "Format de fichier non supporté. Utilisez JPEG, PNG, WebP ou HEIC." },
      { status: 400 },
    );
  }

  if (photo.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 MB)" },
      { status: 400 },
    );
  }

  // ── Build admin client (service role required to write to private bucket) ─
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error("api_verify_selfie_missing_env");
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Upload to private storage bucket ─────────────────────────────────────
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const timestamp = Date.now();
  const storagePath = `${userId}/selfie/${timestamp}.${ext}`;

  const arrayBuffer = await photo.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: photo.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error("api_verify_selfie_upload_failed", { err: uploadError.message, userId });
    return NextResponse.json(
      { error: "Echec de l'upload de la photo. Reessaie." },
      { status: 500 },
    );
  }

  // ── Upsert profile_verifications row ──────────────────────────────────────
  const { error: dbError } = await supabaseAdmin
    .from("profile_verifications")
    .upsert(
      {
        user_id: userId,
        method: "selfie",
        status: "pending",
        storage_path: storagePath,
        submitted_at: new Date().toISOString(),
        // confidence stays null — will be set by a moderator or automated review
      },
      { onConflict: "user_id,method" },
    );

  if (dbError) {
    logger.error("api_verify_selfie_db_failed", { err: dbError.message, userId });
    // Cleanup the uploaded file to avoid orphan
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: "Erreur enregistrement verification. Photo supprimée." },
      { status: 500 },
    );
  }

  logger.info("api_verify_selfie_submitted", { userId, storagePath });

  return NextResponse.json({
    success: true,
    status: "pending",
    message:
      "Photo soumise. Ta vérification sera examinée sous 24h. Tu recevras une notification.",
  });
}

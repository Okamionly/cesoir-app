import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/api/auth";
import { checkRateLimitByAction, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  MOMENT_MAX_BYTES,
  MOMENT_CAPTION_MAX,
  buildMomentPath,
  momentExtFromMime,
} from "@/lib/storage";

/**
 * 2026-05-07 (code review C2): MIME magic-byte verification.
 *
 * `photo.type` is the browser-declared MIME, easily spoofed by a malicious
 * client. We additionally inspect the first 12 bytes of the upload to verify
 * it actually starts with one of our allowed image signatures. Rejecting at
 * the API layer prevents storing executables / videos / random bytes labelled
 * as `image/webp`.
 */
async function verifyImageMagicBytes(blob: Blob): Promise<boolean> {
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if (head.length < 8) return false;
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a
  ) return true;
  // WebP: "RIFF" .... "WEBP" — bytes 0-3 = 52 49 46 46, bytes 8-11 = 57 45 42 50
  if (
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  ) return true;
  return false;
}

/**
 * POST /api/moments/post — publish a 24h moment.
 *
 * Auth: required (Bearer or SSR cookie).
 * Body: multipart/form-data with two fields:
 *   - `photo`     File (image/webp|image/jpeg|image/png), <= 4 MB
 *   - `caption`   string (optional, <= 50 chars after trim)
 *
 * Side effects:
 *   1. Uploads the photo to the private `moments` bucket at
 *      `<userId>/<uuid>.<ext>`.
 *   2. Inserts a row in `public.moments` with `media_path` set.
 *      `posted_at` defaults to now() and `expires_at` is auto-stamped
 *      to posted_at + 24h by the BEFORE INSERT trigger.
 *   3. Returns the moment row + a 1h signed URL the client can render
 *      immediately (saves a round-trip).
 *
 * On failure mid-flow we DO try to roll back the storage upload — a
 * dangling object is small (4 MB max) but we'd rather not pay for it.
 *
 * Why server-side and not direct client → bucket → table:
 *   - Single source of truth for the size + caption + MIME validation
 *     (zod can't validate Blob bytes; the API can).
 *   - Lets us add moderation hooks later (NSFW classifier, abuse rate
 *     limit) without touching every client.
 *   - Keeps the storage path naming convention out of the client.
 */

export const runtime = "nodejs";
// Multipart parsing isn't supported on edge.

const ALLOWED_MIME = new Set(["image/webp", "image/jpeg", "image/png"]);

const captionSchema = z
  .string()
  .trim()
  .max(MOMENT_CAPTION_MAX, `Caption max ${MOMENT_CAPTION_MAX} caractères`)
  .optional();

interface InsertedMomentRow {
  id: string;
  user_id: string;
  media_path: string;
  caption: string | null;
  posted_at: string;
  expires_at: string;
}

export async function POST(request: Request) {
  // ─── Auth ──────────────────────────────────────────────────────────
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;
  const userId = user.id;

  // ─── Rate limit ────────────────────────────────────────────────────
  // 2026-05-07 (code review C2): 4MB upload endpoint with no throttle is
  // a storage-flood vector. "strict" preset = 1 req / hour (limiteur
  // existant) — adjust to "api" if too aggressive in real usage.
  const rl = await checkRateLimitByAction(
    `moments-post:${userId}:${getClientIp(request)}`,
    "api",
  );
  if (!rl.ok) return rateLimitResponse(rl);

  // ─── Parse multipart ───────────────────────────────────────────────
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    logger.warn("api_moments_post_form_parse_failed", { err: String(err) });
    return NextResponse.json(
      { error: "multipart/form-data invalide" },
      { status: 400 },
    );
  }

  const photo = form.get("photo");
  const captionRaw = form.get("caption");

  // ─── Validate photo ────────────────────────────────────────────────
  if (!(photo instanceof Blob)) {
    return NextResponse.json(
      { error: "Champ `photo` manquant ou invalide" },
      { status: 400 },
    );
  }

  if (photo.size === 0) {
    return NextResponse.json(
      { error: "Photo vide" },
      { status: 400 },
    );
  }

  if (photo.size > MOMENT_MAX_BYTES) {
    return NextResponse.json(
      {
        error: "too_large",
        message: `Photo > ${Math.round(MOMENT_MAX_BYTES / 1024 / 1024)} Mo`,
      },
      { status: 413 },
    );
  }

  // MIME check — header AND magic-byte. Browsers occasionally lie
  // (especially iOS) and a malicious client controls `photo.type`
  // entirely. Magic-byte gives us defence in depth.
  // (Code review C2, 2026-05-07.)
  const mime = photo.type;
  if (mime && !ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: "unsupported_mime", message: `Type ${mime} non supporté` },
      { status: 415 },
    );
  }
  if (!(await verifyImageMagicBytes(photo))) {
    logger.warn("api_moments_post_magic_byte_rejection", { userId, mime });
    return NextResponse.json(
      { error: "unsupported_mime", message: "Format image non reconnu" },
      { status: 415 },
    );
  }

  // ─── Validate caption ──────────────────────────────────────────────
  const captionInput =
    typeof captionRaw === "string" && captionRaw.length > 0
      ? captionRaw
      : undefined;

  const captionParsed = captionSchema.safeParse(captionInput);
  if (!captionParsed.success) {
    return NextResponse.json(
      {
        error: "invalid_caption",
        issues: captionParsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const caption =
    typeof captionParsed.data === "string" && captionParsed.data.length > 0
      ? captionParsed.data
      : null;

  // ─── Upload to bucket ──────────────────────────────────────────────
  const ext = momentExtFromMime(mime);
  const path = buildMomentPath(userId, ext);

  const { error: uploadError } = await db.storage
    .from("moments")
    .upload(path, photo, {
      cacheControl: "3600",
      contentType: mime || "image/webp",
      upsert: false,
    });

  if (uploadError) {
    // 2026-05-07 (code review H1): keep the Supabase error.message in
    // server logs, but DON'T echo it to the client — leaks bucket
    // policies / table names / RLS hints to attackers.
    logger.error("api_moments_post_upload_failed", {
      err: uploadError.message,
      userId,
    });
    return NextResponse.json(
      { error: "upload_failed", message: "Erreur serveur" },
      { status: 500 },
    );
  }

  // ─── Insert DB row ─────────────────────────────────────────────────
  // The `expires_at` column has a NOT NULL constraint AND a CHECK that
  // it equals posted_at + 24h. Postgres doesn't accept NOT NULL columns
  // omitted from INSERT, so we send a placeholder — the BEFORE INSERT
  // trigger overwrites it with the correct value before the CHECK runs.
  const placeholderExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: row, error: insertError } = await db
    .from("moments")
    .insert({
      user_id: userId,
      media_path: path,
      caption,
      expires_at: placeholderExpires,
    })
    .select("id, user_id, media_path, caption, posted_at, expires_at")
    .single<InsertedMomentRow>();

  if (insertError || !row) {
    // 2026-05-07 (code review H1): same as above — never echo the
    // Postgres / RLS error string to the client.
    logger.error("api_moments_post_insert_failed", {
      err: insertError?.message ?? "no_row",
      userId,
    });
    // Best-effort rollback of the storage upload — don't block on it.
    void db.storage.from("moments").remove([path]).catch(() => {});
    return NextResponse.json(
      { error: "insert_failed", message: "Erreur serveur" },
      { status: 500 },
    );
  }

  // ─── Sign URL for immediate render ────────────────────────────────
  // 1h TTL — matches the moments lifetime sweet spot; the client can
  // re-sign on its own (via the feed endpoint) after that.
  let signedUrl: string | null = null;
  const { data: signed, error: signError } = await db.storage
    .from("moments")
    .createSignedUrl(path, 3600);

  if (signError) {
    logger.warn("api_moments_post_sign_failed", {
      err: signError.message,
      userId,
      path,
    });
  } else {
    signedUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json(
    {
      moment: {
        id: row.id,
        userId: row.user_id,
        mediaPath: row.media_path,
        mediaUrl: signedUrl,
        caption: row.caption,
        postedAt: row.posted_at,
        expiresAt: row.expires_at,
      },
    },
    { status: 201 },
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/api/auth";
import { logger } from "@/lib/logger";
import {
  MOMENT_MAX_BYTES,
  MOMENT_CAPTION_MAX,
  buildMomentPath,
  momentExtFromMime,
} from "@/lib/storage";

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

  // MIME check — browsers occasionally lie (especially iOS), but we
  // still reject the obvious wrong types. The bucket's
  // allowed_mime_types is the real backstop.
  const mime = photo.type;
  if (mime && !ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: "unsupported_mime", message: `Type ${mime} non supporté` },
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
    logger.error("api_moments_post_upload_failed", {
      err: uploadError.message,
      userId,
    });
    return NextResponse.json(
      { error: "upload_failed", message: uploadError.message },
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
    logger.error("api_moments_post_insert_failed", {
      err: insertError?.message ?? "no_row",
      userId,
    });
    // Best-effort rollback of the storage upload — don't block on it.
    void db.storage.from("moments").remove([path]).catch(() => {});
    return NextResponse.json(
      {
        error: "insert_failed",
        message: insertError?.message ?? "Insert returned no row",
      },
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

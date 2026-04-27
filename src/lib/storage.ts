/**
 * Avatar URL helpers.
 *
 * Created alongside migration `028_avatar_bucket_security.sql` which
 * flipped the `avatars` bucket from PUBLIC to PRIVATE. Any code path
 * that previously stored a `https://<project>.supabase.co/storage/v1/object/public/avatars/...`
 * URL on `profiles.avatar_url` will now 401 for unauthenticated
 * fetches (e.g. the OG image route or any external scraper).
 *
 * Strategy:
 *   - Inside an authenticated session, `getPublicUrl()` keeps working
 *     because the storage gateway evaluates RLS — and our SELECT
 *     policy allows any authenticated user to read any avatar.
 *     So matched users (chat, /matches) and unmatched browse cards
 *     keep rendering with a single GET.
 *   - For unauthenticated SSR (OG image, public profile share card),
 *     callers must use `createSignedUrl(path, 3600)` to mint a 1h
 *     pre-signed URL.
 *
 * TODO (post-028 rollout):
 *   - Audit `profiles.avatar_url` rows for the legacy `/object/public/`
 *     prefix and either rewrite them on read or backfill to the
 *     bucket-relative path so callers can always rebuild a URL of the
 *     correct shape.
 *   - Migrate `src/app/p/[id]/opengraph-image.tsx` from raw `<img>` to
 *     a server-side fetch that calls `createSignedUrl` and inlines the
 *     image bytes. Until then, OG previews fall back to ui-avatars.com.
 *   - Decide whether to extend this helper to write (upload) — see
 *     `src/components/app/PhotoUpload.tsx` lines 92-114 for the only
 *     current writer.
 */

import { supabase } from "./supabase";

/**
 * Returns the canonical avatar path relative to the `avatars` bucket
 * (e.g. `<userId>/<filename>.jpg`), or `null` if the input is falsy or
 * doesn't look like a Supabase Storage URL.
 *
 * Accepts either:
 *   - a bucket-relative path (`<uid>/avatar.jpg`) — returned as-is,
 *   - a legacy public URL — extracts the segment after `/avatars/`,
 *   - any other URL (e.g. ui-avatars.com placeholder) — returns null.
 */
export function avatarPathFromUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  // Bucket-relative path — `uid/file.ext`. No protocol, no leading slash.
  if (!input.includes("://") && !input.startsWith("/")) {
    return input;
  }
  // Public or signed Supabase URL — both contain `/avatars/<rest>`.
  const m = input.match(/\/avatars\/(.+?)(?:\?|$)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return null;
}

/**
 * Returns a URL the browser can render for an avatar.
 *
 * - `isMatched` flag is reserved for the next refactor: today's RLS
 *   policy lets ANY authenticated user read any avatar, so the
 *   matched/unmatched distinction doesn't change the SQL — but it
 *   future-proofs the call sites for when we tighten the policy to
 *   "matched OR own folder" only. Pass `true` for chat/matches,
 *   `false` for browse swipe deck, undefined when you don't know.
 * - When the storage `path` can't be derived (placeholder, external
 *   URL), the function returns the input unchanged so existing
 *   ui-avatars.com fallbacks keep working.
 */
export function getAvatarUrl(
  pathOrUrl: string | null | undefined,
  _isMatched?: boolean,
): string | null {
  if (!pathOrUrl) return null;
  // External (ui-avatars.com, gravatar, etc.) — pass through.
  if (/^https?:\/\//.test(pathOrUrl) && !pathOrUrl.includes("/avatars/")) {
    return pathOrUrl;
  }
  const path = avatarPathFromUrl(pathOrUrl);
  if (!path) return pathOrUrl;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Mints a 1-hour signed URL for an avatar — required when the consumer
 * runs OUTSIDE an authenticated session (SSR /p/[id], OG image route,
 * email previews). Returns `null` on failure or for non-storage URLs.
 *
 * Default TTL is 3600s (1h). Pass a smaller value for ephemeral use
 * cases (push notification thumbnails, share-card previews).
 */
export async function getAvatarSignedUrl(
  pathOrUrl: string | null | undefined,
  expiresInSeconds: number = 3600,
): Promise<string | null> {
  const path = avatarPathFromUrl(pathOrUrl);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

// ───────────────────────────────────────────────────────────────────
// Voice messages bucket helpers (migration 031)
//
// The `voice-messages` bucket is PRIVATE. RLS allows:
//   - INSERT into `<userId>/...`
//   - SELECT for any participant of the conversation referenced by
//     the second folder segment (`<userId>/<conversationId>/<file>`)
//
// Storage path convention (enforced both client-side AND in the RLS
// policy):
//   `<senderId>/<conversationId>/<uuid>.webm`
// ───────────────────────────────────────────────────────────────────

const VOICE_BUCKET = "voice-messages";

/**
 * Hard cap on a single voice clip — keep in sync with:
 *   - migration 031 `file_size_limit = 1048576`
 *   - the 60s recorder cutoff (60s of opus@~24kbps ≈ 180KB,
 *     so 1MB leaves comfortable headroom for browser-side codec quirks).
 */
export const VOICE_MAX_BYTES = 1_048_576;

/**
 * Hard cap on recorded duration (ms). Browser-enforced by the recorder
 * component; server-enforced by the `messages_voice_duration_range`
 * CHECK constraint added in migration 031 (allows 65000 to give a 5s
 * safety buffer for clock skew between MediaRecorder ticks and Date.now).
 */
export const VOICE_MAX_DURATION_MS = 60_000;

/**
 * Builds the storage path for a new voice clip.
 *
 * Format: `<senderId>/<conversationId>/<uuid>.<ext>`
 *
 * The two folder levels are LOAD-BEARING — the SELECT RLS policy on
 * `storage.objects` reads `(storage.foldername(name))[2]` to resolve
 * which conversation the clip belongs to. Don't flatten this layout
 * without also rewriting the policy in migration 031.
 */
export function buildVoiceMessagePath(
  senderId: string,
  conversationId: string,
  ext: "webm" | "ogg" | "mp4" = "webm",
): string {
  // crypto.randomUUID is available in modern browsers + Node 20.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${senderId}/${conversationId}/${uuid}.${ext}`;
}

/**
 * Uploads a recorded voice Blob to the `voice-messages` bucket.
 *
 * Returns the storage path (relative to the bucket) on success, or
 * an error object describing why the upload failed. The caller is
 * responsible for persisting the path to `messages.voice_url` and
 * handling the error toast.
 *
 * Size enforcement:
 *   - Client-side check before the round trip (fail fast on iOS where
 *     a 60s recording can occasionally bloat past 1MB if the browser
 *     picks a higher bitrate fallback codec).
 *   - Server-side via the bucket's `file_size_limit` (defence in depth).
 */
export async function uploadVoiceMessage(
  senderId: string,
  conversationId: string,
  blob: Blob,
): Promise<
  | { ok: true; path: string }
  | { ok: false; reason: "too_large" | "upload_failed"; message: string }
> {
  if (blob.size > VOICE_MAX_BYTES) {
    return {
      ok: false,
      reason: "too_large",
      message: `Le message vocal depasse la taille max (${Math.round(VOICE_MAX_BYTES / 1024)} Ko).`,
    };
  }

  // Pick extension from MIME type. Default to webm — Chrome/Edge/Firefox
  // all produce `audio/webm;codecs=opus`. iOS Safari 14.1+ produces
  // `audio/mp4` (AAC) and we map that to `.mp4`. The bucket's
  // allowed_mime_types list (migration 031) accepts both.
  const ext: "webm" | "ogg" | "mp4" = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("ogg")
      ? "ogg"
      : "webm";
  const path = buildVoiceMessagePath(senderId, conversationId, ext);

  const { error } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(path, blob, {
      cacheControl: "3600",
      contentType: blob.type || "audio/webm",
      upsert: false,
    });

  if (error) {
    return {
      ok: false,
      reason: "upload_failed",
      message: error.message || "Echec de l'upload du message vocal.",
    };
  }

  return { ok: true, path };
}

/**
 * Mints a 1-hour signed URL for a voice clip.
 *
 * Called by `VoiceMessagePlayer` on mount (and on play if the URL has
 * expired — the cached URL TTL is 1h so most playback sessions stay
 * within a single signing). Returns `null` if the path is missing or
 * the signing call fails (RLS denied, file gone, network error).
 *
 * The bucket is private — `getPublicUrl` would also work for an
 * authenticated reader because the storage gateway evaluates RLS, but
 * a signed URL keeps the contract crisp: anyone with the URL can play
 * the clip until it expires, even if they later log out mid-listen.
 */
export async function getVoiceMessageSignedUrl(
  path: string | null | undefined,
  expiresInSeconds: number = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(VOICE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

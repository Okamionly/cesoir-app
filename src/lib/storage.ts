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

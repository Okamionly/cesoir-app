-- ═══════════════════════════════════════════════════════════════════
-- Migration 028 — Avatar Bucket Security (P0 audit follow-up)
--
-- Problem fixed:
--   Migration 003 dropped the public-read policy "Avatar public read"
--   on storage.objects, but did NOT flip the `avatars` bucket itself
--   from public → private. Because Supabase Storage serves any object
--   in a `public = true` bucket via the public URL endpoint
--   (`/storage/v1/object/public/avatars/...`) WITHOUT consulting RLS,
--   anyone with the URL — including users whose accounts have been
--   deleted by `/api/account/delete` — could still read the file.
--
--   That's an RGPD violation: an account-delete leaves the avatar
--   binaries publicly fetchable until manual cleanup of the bucket
--   itself. Even after the row in storage.objects is removed by
--   `userClient.storage.from("avatars").remove(paths)`, the file
--   itself is gone — but anyone who scraped the URL while the user
--   existed still has a working public link if the bucket re-creates
--   the object (e.g. via upsert in a different code path).
--
-- Fix strategy:
--   1. Flip the bucket to private — `/object/public/...` will now 401.
--   2. Replace the missing SELECT policy with an authenticated-only
--      read policy (any logged-in user can read any avatar). Browse
--      cards and chat thumbnails still work, just with a signed URL
--      (or a `getPublicUrl` that now requires auth context — same
--      thing under the hood once bucket is private: the gateway
--      checks RLS).
--   3. Tighten INSERT/UPDATE/DELETE to user's own folder only.
--
-- Client-side impact:
--   Public URLs of the form
--     https://<project>.supabase.co/storage/v1/object/public/avatars/<uid>/<file>
--   stop working for unauthenticated requests. After this migration,
--   clients MUST either:
--     • use `supabase.storage.from("avatars").getPublicUrl(path)` from
--       within an authenticated session — the gateway will now return
--       the file as long as the user is logged in (RLS check passes),
--     • or call `createSignedUrl(path, 3600)` for embeds that need to
--       work outside the user's session (e.g. shared profile cards
--       fetched by an unauthenticated SSR render of /p/[id]).
--
--   For matched users (chat list, /matches grid), an authenticated
--   `getPublicUrl` is sufficient — the user is logged in.
--   For UNMATCHED browse cards (/browse swipe deck), same thing —
--   user is logged in. The "public-URL leak to anon" risk is what we
--   are closing here.
--   For the OG image route at /p/[id]/opengraph-image.tsx — that one
--   runs server-side without a user session and previously relied on
--   the public URL to embed the avatar in the og:image. After this
--   migration that fetch will 401 and the OG image will fall back to
--   the ui-avatars.com placeholder. Acceptable for now (OG previews
--   are a vanity feature, not a security boundary). A signed URL
--   served by an SSR API route would be the correct long-term fix.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Flip the bucket to private ──────────────────────────────────
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- ─── 2. Restore SELECT policy (authenticated-only) ──────────────────
-- Drop any leftover variants from earlier migrations or manual edits
-- in the Supabase dashboard so we end up with exactly one policy.
DROP POLICY IF EXISTS "Avatars: anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: authenticated read" ON storage.objects;

CREATE POLICY "Avatars: authenticated read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- ─── 3. Tighten write policies to {userId}/* folder ─────────────────
-- INSERT — user can only upload into their own folder.
DROP POLICY IF EXISTS "Avatars: own folder write" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: own folder insert" ON storage.objects;

CREATE POLICY "Avatars: own folder insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE — user can only modify objects in their own folder
-- (covers `upsert: true` from PhotoUpload.tsx and any future rename).
DROP POLICY IF EXISTS "Avatars: own folder update" ON storage.objects;

CREATE POLICY "Avatars: own folder update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE — user can only delete objects in their own folder.
-- Keeps migration 003's "Avatar delete own" policy, but drops + re-adds
-- under the consistent naming so future audits find one policy per op.
DROP POLICY IF EXISTS "Avatar delete own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: own folder delete" ON storage.objects;

CREATE POLICY "Avatars: own folder delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 4. Documentation comment on the bucket itself ──────────────────
-- Stored as a Postgres comment so anyone exploring the schema via psql
-- or the dashboard sees the rationale without diffing migrations.
COMMENT ON TABLE storage.objects IS
  'Avatars bucket is PRIVATE since migration 028 (RGPD). '
  'Public URLs (/storage/v1/object/public/avatars/...) return 401. '
  'Clients must call getPublicUrl() inside an authenticated session, '
  'or createSignedUrl(path, 3600) for unauthenticated SSR embeds.';

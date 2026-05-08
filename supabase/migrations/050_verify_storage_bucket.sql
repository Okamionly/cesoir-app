-- Migration 049 — Verification storage bucket + profile_verifications columns
--
-- Context: /api/profile/verify/selfie and /api/profile/verify/video need to
-- upload files to a private bucket and track status in profile_verifications.
-- The existing table (migration 016) has no status / storage_path columns.
--
-- Changes:
--   1. Add status, storage_path, submitted_at columns to profile_verifications
--   2. Make verified_at nullable (not set until actually verified)
--   3. Create "verifications" storage bucket (private, 10 MB max for images,
--      50 MB max for video — enforced at application layer, not SQL)
--   4. RLS policies on the bucket: only service role can read (files are PII).
--      Users can upload to their own prefix; cannot read back directly.

-- ── 1. Alter profile_verifications ────────────────────────────────────────
ALTER TABLE public.profile_verifications
  ALTER COLUMN verified_at DROP NOT NULL,
  ALTER COLUMN verified_at SET DEFAULT NULL;

ALTER TABLE public.profile_verifications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: existing rows were auto-inserted as verified
UPDATE public.profile_verifications
SET status = 'verified', submitted_at = COALESCE(verified_at, now())
WHERE status = 'pending' AND verified_at IS NOT NULL;

COMMENT ON COLUMN public.profile_verifications.status IS
  'pending = awaiting review, verified = approved, rejected = failed check';
COMMENT ON COLUMN public.profile_verifications.storage_path IS
  'Path in verifications bucket: <userId>/selfie/<ts>.jpg or <userId>/video/<ts>.mp4';
COMMENT ON COLUMN public.profile_verifications.submitted_at IS
  'When the user uploaded the file (before review)';

-- ── 2. Create verifications storage bucket ────────────────────────────────
-- This is idempotent; re-running after the bucket exists is a no-op.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verifications',
  'verifications',
  false,   -- PRIVATE — no public read
  52428800, -- 50 MB cap (enforced here too, belt-and-suspenders)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage RLS — users can INSERT to their own prefix only ────────────
-- Service role bypasses RLS; admins use service key for all reads.

DROP POLICY IF EXISTS "Users upload own verification files" ON storage.objects;
CREATE POLICY "Users upload own verification files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- No SELECT policy for authenticated — prevents users from downloading
-- other users' verification files. Service role reads via admin client.
DROP POLICY IF EXISTS "Users read own verification files" ON storage.objects;
CREATE POLICY "Users read own verification files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

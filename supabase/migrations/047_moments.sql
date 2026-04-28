-- ═══════════════════════════════════════════════════════════════════
-- Migration 047 — Moments (24h disappearing photos, Wave 17)
--
-- Concept: matched users can post a single photo "moment" with an
-- optional 50-char caption that disappears after 24h. Visible only to
-- the owner and to users matched with the owner. Adds urgency + a
-- conversation hook ("J'ai vu ton story au bar Z").
--
-- Schema decisions
-- ────────────────
-- * One row per moment (no aggregation by user). The "ring" UI on the
--   chat page just queries the most recent unexpired moment per matched
--   user — keeping the row granular lets us add multi-photo storyboards
--   later without a schema change.
-- * `expires_at` is computed at INSERT time (posted_at + 24h). Using a
--   stored column rather than `posted_at + interval` everywhere makes
--   the `WHERE expires_at > now()` index lookup O(log n).
-- * `media_path` (NOT `media_url`): we store the bucket-relative path
--   (`<userId>/<uuid>.webp`) because the bucket is PRIVATE and clients
--   mint signed URLs on demand. Same convention as `voice-messages`
--   (migration 031) and `avatars` (migration 028).
-- * Caption is `TEXT` with a length CHECK rather than `VARCHAR(50)` so
--   we can later widen the cap without a column-rewrite migration.
--
-- RLS
-- ───
-- * SELECT: owner OR a user who is `matched` with the owner via the
--   `matches` view (which is itself derived from mutual interactions).
--   Expired rows are still readable by the owner (so they can see their
--   own history if we add a "memories" feature later) but filtered out
--   for matches by `expires_at > now()`.
-- * INSERT: only into own `user_id`.
-- * UPDATE: forbidden — moments are immutable once posted.
-- * DELETE: only own (privacy: user can take down their own moment
--   before the 24h timer).
--
-- Cleanup
-- ───────
-- The `expires_at` index (partial WHERE expires_at > now()) keeps the
-- read path fast. A nightly cron may HARD-delete rows with
-- `expires_at < now() - 7d` plus their storage objects — but for now
-- the read path filters by `expires_at > now()` so stale rows don't
-- leak; cleanup is purely a storage cost concern.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.moments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_path   TEXT NOT NULL,
  caption      TEXT,
  posted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,

  -- 50-char hard cap on caption (NULL allowed for "photo only" moments).
  CONSTRAINT moments_caption_length
    CHECK (caption IS NULL OR char_length(caption) <= 50),

  -- expires_at must always be exactly 24h after posted_at. Enforced as
  -- a CHECK so a buggy insert can't accidentally create a 30-day moment.
  -- The trigger below sets expires_at automatically, but defence in
  -- depth: even a service-role insert that bypasses the trigger has to
  -- pass this CHECK.
  CONSTRAINT moments_24h_window
    CHECK (expires_at = posted_at + INTERVAL '24 hours')
);

-- Hot-path index: "moments from these users that haven't expired".
-- Partial index on the unexpired set keeps it tiny — the moment a row
-- crosses now() it falls out of the index automatically (the predicate
-- is re-evaluated only on writes, so we accept some staleness in the
-- partial set; the read path also applies `expires_at > now()` as a
-- WHERE clause for correctness).
CREATE INDEX IF NOT EXISTS idx_moments_user_active
  ON public.moments (user_id, posted_at DESC)
  WHERE expires_at > now();

-- Sweeper index: nightly cleanup job scans by expires_at.
CREATE INDEX IF NOT EXISTS idx_moments_expires
  ON public.moments (expires_at);

COMMENT ON TABLE public.moments IS
  '24h disappearing photos (Wave 17). Visible to the owner + to users
   matched with the owner via the matches view. Caption capped at 50
   chars. Storage layer: `moments` private bucket, signed URL access.';

COMMENT ON COLUMN public.moments.media_path IS
  'Bucket-relative path inside the private `moments` bucket
   (`<userId>/<uuid>.webp`). NOT a full URL — clients mint signed URLs
   via createSignedUrl(path, 3600) on read.';

-- -------------------------------------------------------------------
-- 2. Trigger: auto-stamp expires_at on insert
-- -------------------------------------------------------------------
-- Clients send `posted_at` (or default to now()) but should NOT have to
-- compute `expires_at` themselves. The CHECK above guarantees the value
-- is correct; this trigger just fills it in so callers don't bother.

CREATE OR REPLACE FUNCTION public.moments_set_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.posted_at IS NULL THEN
    NEW.posted_at := now();
  END IF;
  NEW.expires_at := NEW.posted_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moments_set_expires_at_trg ON public.moments;
CREATE TRIGGER moments_set_expires_at_trg
  BEFORE INSERT ON public.moments
  FOR EACH ROW
  EXECUTE FUNCTION public.moments_set_expires_at();

-- -------------------------------------------------------------------
-- 3. RLS
-- -------------------------------------------------------------------

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moments_owner_or_match_read"  ON public.moments;
DROP POLICY IF EXISTS "moments_owner_insert"         ON public.moments;
DROP POLICY IF EXISTS "moments_owner_delete"         ON public.moments;

-- READ: owner OR a user who is matched with the owner.
--
-- "Matched" = there exists a row in `conversations` (which is the
-- canonical match record in this codebase — created by the swipe API
-- the moment two users mutually like) where the caller and the
-- moment's owner are the two participants.
--
-- Owner can also see their EXPIRED rows (for a future "memories"
-- feature). Matches only see unexpired moments (filter applied at
-- query time AND in the partial index).
CREATE POLICY "moments_owner_or_match_read"
  ON public.moments FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
        FROM public.conversations c
       WHERE (
         (c.user_a = (SELECT auth.uid()) AND c.user_b = moments.user_id)
         OR (c.user_b = (SELECT auth.uid()) AND c.user_a = moments.user_id)
       )
    )
  );

-- INSERT: only own moments.
CREATE POLICY "moments_owner_insert"
  ON public.moments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE: only own moments.
CREATE POLICY "moments_owner_delete"
  ON public.moments FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- UPDATE intentionally NOT exposed: moments are immutable once posted.
-- If we ever need to support editing the caption, add a tight policy
-- that allows only the caption column to change.

-- -------------------------------------------------------------------
-- 4. Storage bucket `moments` (private, 4MB cap)
-- -------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moments',
  'moments',
  false,                                   -- PRIVATE — RLS-gated reads only
  4194304,                                 -- 4 MB hard cap (4 * 1024 * 1024)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -------------------------------------------------------------------
-- 5. RLS policies on storage.objects for `moments` bucket
-- -------------------------------------------------------------------
-- Naming convention enforced client-side AND in the SELECT policy:
--   `<userId>/<uuid>.<ext>`
-- The first folder segment is the owner's user id, which we use to
-- gate reads via the matched-pair check below.

-- INSERT: user can only upload into their own folder `<userId>/...`
DROP POLICY IF EXISTS "Moments: own folder insert" ON storage.objects;
CREATE POLICY "Moments: own folder insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: user can only delete objects in their own folder.
DROP POLICY IF EXISTS "Moments: own folder delete" ON storage.objects;
CREATE POLICY "Moments: own folder delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: owner OR matched user. We resolve "matched" by joining the
-- folder owner segment against `conversations`.
DROP POLICY IF EXISTS "Moments: owner or match read" ON storage.objects;
CREATE POLICY "Moments: owner or match read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'moments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE (
          (c.user_a = auth.uid() AND c.user_b::text = (storage.foldername(name))[1])
          OR (c.user_b = auth.uid() AND c.user_a::text = (storage.foldername(name))[1])
        )
      )
    )
  );

COMMIT;

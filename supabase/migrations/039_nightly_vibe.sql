-- 039_nightly_vibe.sql
-- 2026-04-28 — Nightly vibe / mood picker (Wave 17)
--
-- # Background
--
-- Adds a per-user "tonight's vibe" mood selector. The user picks one of
-- 5 vibes (chill / festif / calme / aventure / surprise) on /profile and
-- it surfaces as a chip on swipe cards + drives a small +2 social score
-- bonus when both peers picked the same vibe today.
--
-- # Reset semantics
--
-- The vibe expires at UTC midnight rather than via a cron — same pattern
-- as the broadcast_until column in mig 030. The `get_vibe_today` RPC
-- returns NULL when `vibe_set_at` is older than the most recent UTC
-- midnight, which gives us natural "resets at midnight" without any
-- cleanup job. Clients should always read through the RPC and never the
-- raw column.
--
-- # Schema additions
--
--   1. profiles.vibe_today TEXT NULL — one of 5 vibe ids, or NULL
--   2. profiles.vibe_set_at TIMESTAMPTZ NULL — when it was last set
--   3. CHECK constraint to limit values to the 5 known vibe ids
--   4. get_vibe_today(uid uuid) RPC — UTC-midnight aware reader
--
-- # Test plan
--
--   * UPDATE profiles SET vibe_today='festif', vibe_set_at=now() WHERE id='<A>';
--       - SELECT get_vibe_today('<A>') => 'festif'.
--   * UPDATE profiles SET vibe_set_at=now() - interval '2 days' WHERE id='<A>';
--       - SELECT get_vibe_today('<A>') => NULL.
--
-- # Rollback
--
-- DROP FUNCTION public.get_vibe_today(uuid);
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_vibe_today_check;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS vibe_today, DROP COLUMN IF EXISTS vibe_set_at;

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Schema additions
-- -----------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vibe_today  TEXT,
  ADD COLUMN IF NOT EXISTS vibe_set_at TIMESTAMPTZ;

-- Whitelist the 5 known vibe ids (mirrors src/lib/vibes.ts). Allow NULL
-- so users without a vibe today are still valid rows.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vibe_today_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vibe_today_check
  CHECK (
    vibe_today IS NULL
    OR vibe_today IN ('chill', 'festif', 'calme', 'aventure', 'surprise')
  );

COMMENT ON COLUMN public.profiles.vibe_today IS
  'Tonight''s vibe / mood (mig 039). One of: chill, festif, calme, aventure, '
  'surprise. NULL when not set or stale (older than UTC midnight). Always '
  'read through get_vibe_today() so the UTC-midnight reset is honored.';

COMMENT ON COLUMN public.profiles.vibe_set_at IS
  'Timestamp when vibe_today was last set (mig 039). Used by '
  'get_vibe_today() to expire the value at the next UTC midnight without '
  'requiring a cleanup job.';

-- Partial index — only rows with a vibe set today need indexing. Most
-- profiles have NULL most of the time, so this stays tiny.
CREATE INDEX IF NOT EXISTS idx_profiles_vibe_set_at_active
  ON public.profiles (vibe_set_at)
  WHERE vibe_today IS NOT NULL;

-- -----------------------------------------------------------------------
-- 2. get_vibe_today RPC — UTC-midnight aware
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_vibe_today(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    CASE
      WHEN p.vibe_today IS NULL THEN NULL
      WHEN p.vibe_set_at IS NULL THEN NULL
      -- Compare against today's UTC midnight. If vibe_set_at is older,
      -- it's stale and we treat the vibe as cleared.
      WHEN p.vibe_set_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
        THEN p.vibe_today
      ELSE NULL
    END
  FROM public.profiles p
  WHERE p.id = uid;
$$;

ALTER FUNCTION public.get_vibe_today(UUID) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_vibe_today(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_vibe_today(UUID) FROM anon, public;

COMMENT ON FUNCTION public.get_vibe_today(UUID) IS
  'Mig 039 (2026-04-28). Returns the user''s vibe today or NULL if it was '
  'set before today''s UTC midnight (stale). Use this everywhere in the '
  'app instead of selecting profiles.vibe_today directly so the "resets at '
  'midnight" semantics stay consistent without a cron.';

COMMIT;

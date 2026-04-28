-- ===================================================================
-- Migration 037 — Wave 17: visible daily streak chain (user_streaks)
--
-- Backs the StreakBadge in PageHeader + useStreak hook. One row per
-- user, keyed by user_id (PK). last_active_date is a calendar DATE
-- (not TIMESTAMPTZ) because the streak flips at midnight UTC and we
-- compare days, not instants.
--
-- Why a NEW table instead of reusing the legacy `streaks` table from
-- migration 002:
--   - `streaks` uses TIMESTAMPTZ for last_active_date, which makes
--     "are we still on the same UTC day?" comparisons fragile (TZ
--     drift, DST corner cases).
--   - `streaks` has a separate `id UUID` PK + UNIQUE(user_id), an
--     extra layer this feature does not need (one row per user is
--     the only valid shape).
--   - `streaks` has no RLS policies for the new daily-login flow,
--     and adding policies retroactively risks breaking the
--     gamification migrations that reference it.
--
-- The legacy `streaks` table stays put for back-compat (it's read
-- by the badges system + account deletion); `user_streaks` is the
-- canonical source for the visible streak chain feature.
-- ===================================================================

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE    NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_streaks_current_nonneg  CHECK (current_streak  >= 0),
  CONSTRAINT user_streaks_longest_nonneg  CHECK (longest_streak  >= 0),
  CONSTRAINT user_streaks_longest_geq_cur CHECK (longest_streak  >= current_streak)
);

COMMENT ON TABLE public.user_streaks IS
  'Daily login streak chain. One row per user. Streak resets at
   midnight UTC if the user did not open the app the previous day.
   See useStreak hook for the read+upsert flow.';

COMMENT ON COLUMN public.user_streaks.last_active_date IS
  'Calendar date (UTC) of the last day the user opened the app.
   Compared to today (UTC) by useStreak to decide continue/reset.';

-- -------------------------------------------------------------------
-- 2. RLS — owner-only SELECT/INSERT/UPDATE
-- -------------------------------------------------------------------

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- SELECT: owner reads their own row.
DROP POLICY IF EXISTS "user_streaks_owner_select" ON public.user_streaks;
CREATE POLICY "user_streaks_owner_select"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- INSERT: owner creates their own row on first app open.
-- Required because the hook UPSERTs from the client; without an
-- INSERT policy the first call fails silently.
DROP POLICY IF EXISTS "user_streaks_owner_insert" ON public.user_streaks;
CREATE POLICY "user_streaks_owner_insert"
  ON public.user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: owner updates their own row (continue / reset / new longest).
DROP POLICY IF EXISTS "user_streaks_owner_update" ON public.user_streaks;
CREATE POLICY "user_streaks_owner_update"
  ON public.user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- No DELETE policy — rows are removed only by the auth.users CASCADE.

-- -------------------------------------------------------------------
-- 3. updated_at trigger (audit hook)
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_streaks_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_streaks_touch_updated_at ON public.user_streaks;
CREATE TRIGGER user_streaks_touch_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.user_streaks_touch_updated_at();

COMMIT;

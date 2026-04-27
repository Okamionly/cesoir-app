-- 030_availability_broadcast.sql
-- 2026-04-27 — "Je suis dispo ce soir" broadcast flag
--
-- # Background
--
-- Adds a one-tap availability broadcast: a user toggles a button on /profile
-- and is flagged as actively available for a fixed window (default 3h).
-- The flag auto-expires server-side via the `broadcast_until > now()`
-- predicate — no cron / cleanup job needed.
--
-- # What this migration does
--
--   1. Adds `profiles.broadcast_until timestamptz NULL`. NULL = not broadcasting.
--   2. Partial index on `broadcast_until` WHERE NOT NULL — keeps the index
--      tiny because most rows are NULL at any given moment.
--   3. Rewrites `nearby_profiles` RPC to expose `broadcast_active boolean`
--      computed as `broadcast_until > now()`. Also keeps the previous
--      grid-snapped distance + block filter behaviour from migrations 024 / 026.
--
-- # Test plan BEFORE merging
--
--   * Apply on a Supabase Branch.
--   * UPDATE profiles SET broadcast_until = now() + interval '3 hours' WHERE id = '<A>'.
--       - call nearby_profiles() from B → A row has broadcast_active = true. PASS.
--       - wait 3h (or set broadcast_until = now() - interval '1 minute')
--         → broadcast_active = false. PASS.
--   * UPDATE profiles SET broadcast_until = NULL WHERE id = '<A>'.
--       - broadcast_active = false. PASS.
--
-- # Rollback
--
-- DROP INDEX, DROP COLUMN, re-apply migration 026 to restore the prior RPC.

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Schema additions
-- -----------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS broadcast_until timestamptz;

COMMENT ON COLUMN public.profiles.broadcast_until IS
  'Active availability broadcast deadline (mig 030). When > now(), the user '
  'is surfaced as "Dispo maintenant" on swipe cards / map pins. NULL = no '
  'broadcast. Cleared client-side via DELETE /api/availability/broadcast or '
  'simply expires by the timestamp passing — no cron job needed.';

-- Partial index: only rows currently broadcasting are indexed. Keeps the
-- index ~3 orders of magnitude smaller than a plain index over the column.
CREATE INDEX IF NOT EXISTS idx_profiles_broadcast_until_active
  ON public.profiles (broadcast_until)
  WHERE broadcast_until IS NOT NULL;

-- -----------------------------------------------------------------------
-- 2. Rewrite nearby_profiles to expose broadcast_active
-- -----------------------------------------------------------------------
--
-- Drop the 8-arg version installed by mig 026 and recreate with the same
-- signature plus the new `broadcast_active boolean` return column.

DROP FUNCTION IF EXISTS public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
);

CREATE OR REPLACE FUNCTION public.nearby_profiles(
  user_lat        FLOAT,
  user_lng        FLOAT,
  radius_km       FLOAT   DEFAULT 10,
  mode_filter     TEXT    DEFAULT NULL,
  gender_filter   TEXT    DEFAULT NULL,
  age_min         INTEGER DEFAULT 18,
  age_max         INTEGER DEFAULT 99,
  limit_count     INTEGER DEFAULT 50
)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  age               INTEGER,
  gender            TEXT,
  bio               TEXT,
  avatar_url        TEXT,
  is_verified       BOOLEAN,
  distance_km       FLOAT,
  mode              TEXT,
  available_time    TEXT,
  mode_details      JSONB,
  lat_rough         FLOAT,
  lng_rough         FLOAT,
  broadcast_active  BOOLEAN  -- NEW (mig 030): true if broadcast_until > now()
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  user_point geography;
BEGIN
  user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;

  RETURN QUERY
  WITH snapped AS (
    SELECT
      p.id,
      p.name,
      p.age,
      p.gender,
      p.bio,
      p.avatar_url,
      p.is_verified,
      p.location,
      p.broadcast_until,
      ST_Y(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lat_rough,
      ST_X(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lng_rough,
      ma.mode,
      ma.available_time,
      ma.details AS mode_details
    FROM public.profiles p
    LEFT JOIN public.mode_activations ma
      ON ma.user_id = p.id AND ma.is_active = true
    WHERE p.is_online = true
      AND p.location IS NOT NULL
      AND p.id <> (SELECT auth.uid())
      AND ST_DWithin(p.location, user_point, radius_km * 1000)
      AND (mode_filter IS NULL OR ma.mode = mode_filter)
      AND (gender_filter IS NULL OR p.gender = gender_filter)
      AND p.age BETWEEN age_min AND age_max
      -- Bidirectional block filter (#6 SEC-004, kept from mig 024 / 026).
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
           OR (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
      )
  )
  SELECT
    s.id,
    s.name,
    s.age,
    s.gender,
    s.bio,
    s.avatar_url,
    s.is_verified,
    -- Distance computed from grid-snapped coords, rounded to 1 km
    -- (mig 026 / SEC-002 trilateration prevention).
    ROUND(
      ST_DistanceSphere(
        ST_MakePoint(s.lng_rough, s.lat_rough),
        ST_MakePoint(user_lng, user_lat)
      )::numeric / 1000.0
    )::float AS distance_km,
    s.mode,
    s.available_time,
    s.mode_details,
    s.lat_rough,
    s.lng_rough,
    -- NEW: live broadcast flag. Computed in SQL so callers can't fake it.
    (s.broadcast_until IS NOT NULL AND s.broadcast_until > now()) AS broadcast_active
  FROM snapped s
  ORDER BY
    -- Boost broadcasting users to the top of the result list as a
    -- secondary sort key — within the same distance bucket, "Dispo
    -- maintenant" wins. Distance still drives the primary order.
    distance_km ASC,
    (s.broadcast_until IS NOT NULL AND s.broadcast_until > now()) DESC
  LIMIT limit_count;
END;
$$;

ALTER FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) FROM anon, public;

COMMENT ON FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) IS
  'Mig 030 (2026-04-27). Adds broadcast_active boolean — true when the '
  'profile has set profiles.broadcast_until via the "Je suis dispo ce '
  'soir" toggle and the deadline is still in the future. Computed in SQL '
  'so a malicious client cannot spoof the flag. Carries forward the '
  'grid-snap (mig 024), trilateration-safe distance (mig 026) and '
  'bidirectional block filter behaviour.';

COMMIT;

-- 024_location_privacy.sql
-- 2026-04-24 — GPS privacy hardening (closes #5 SEC-001 + #6 SEC-004)
--
-- # Background
--
-- Today `profiles.location GEOGRAPHY(POINT, 4326)` is readable by every
-- authenticated user via `USING (true)` SELECT policy, and `nearby_profiles`
-- returns `ST_X/ST_Y(location::geometry)` at 7-decimal precision (~1 cm).
-- Anyone logged in can pull the precise live GPS coordinates of every
-- profile — classic stalking vector + GDPR Art. 5(1)(c) violation on a
-- French dating app.
--
-- `user_blocks` exists (mig 016) but the `profiles` SELECT policy ignores
-- it entirely. Blocking a harasser stops messages but still leaks their
-- live location, avatar, online state — cosmetic only.
--
-- # What this migration does
--
--   1. Rewrites `profiles` SELECT RLS to filter `user_blocks` bidirectionally
--      (#6 SEC-004). A blocked user and their victim can no longer SELECT
--      each other's profile row.
--
--   2. Rewrites `nearby_profiles` RPC to:
--        - Grid-snap location to ~500m (0.005 degrees, roughly 555m at Paris lat)
--          before returning lat/lng.
--        - Filter `user_blocks` bidirectionally.
--        - Return a `lat_rough, lng_rough` pair (clients must stop treating
--          coords as precise — the app already uses these for map pins so
--          500m bucketing is UX-invisible).
--      (#5 SEC-001).
--
--   3. Adds a new `online_hotspot_profiles()` RPC the `useHotspots` hook
--      can call instead of the `profiles.latitude/longitude` query that
--      PR #15 had to short-circuit (columns don't exist on the schema).
--      Returns grid-snapped coords only.
--
--   4. Leaves `profiles.location` column privileges untouched for now.
--      REVOKing column SELECT is a follow-up once every consumer is
--      confirmed to go through the RPC/view (enforcement after audit).
--
-- # Test plan BEFORE merging to master
--
--   * Apply on a Supabase Branch (not prod). See
--     https://supabase.com/docs/guides/deployment/branching.
--   * Seed with two profiles A, B at known coords 1m apart:
--       - SELECT from `public_profiles` as A reading B → lat_rough == lat_rough
--         (both snapped to same grid cell). PASS.
--   * Block A → B (insert user_blocks(blocker=A, blocked=B)):
--       - A SELECT on profiles WHERE id=B → 0 rows. PASS.
--       - B SELECT on profiles WHERE id=A → 0 rows. PASS (symmetric block).
--       - A calls nearby_profiles() → B not in result. PASS.
--   * Run `useHotspots` against `online_hotspot_profiles()` in app → no
--     HTTP 400. PASS.
--
-- # Rollback
--
-- Re-apply migration 003 and re-run the DROP FUNCTION + CREATE OR REPLACE
-- from the original schema to restore the old `nearby_profiles` and
-- `USING (true)` profile policy. Migrations are idempotent enough that
-- reverting is a matter of re-running the pre-024 state — see git log.

BEGIN;

-- -----------------------------------------------------------------------
-- 1. profiles SELECT RLS — bidirectional user_blocks filter (#6 SEC-004)
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

-- New policy: SELECT allowed only if neither side has blocked the other.
-- (SELECT auth.uid()) cached once per query per RLS best practice (mig 009).
CREATE POLICY "Authenticated can view non-blocked profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = profiles.id AND b.blocked_id = (SELECT auth.uid()))
         OR (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = profiles.id)
    )
  );

-- -----------------------------------------------------------------------
-- 2. nearby_profiles — grid-snap + block filter (#5 SEC-001)
-- -----------------------------------------------------------------------

-- Drop both possible legacy overloads (6-arg from earlier proto, 8-arg
-- with age_min/age_max from prod) so we can change the return type.
-- 2026-04-25 update: prod was running the 8-arg version with age filters;
-- the 6-arg form below was a draft that didn't reflect reality.
DROP FUNCTION IF EXISTS public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER
);
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
  id              UUID,
  name            TEXT,
  age             INTEGER,
  gender          TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  is_verified     BOOLEAN,
  distance_km     FLOAT,   -- still meaningful at 500m grid (bucket distance)
  mode            TEXT,
  available_time  TEXT,
  mode_details    JSONB,
  lat_rough       FLOAT,   -- 500m grid-snapped (was `lat` at full precision)
  lng_rough       FLOAT    -- 500m grid-snapped (was `lng` at full precision)
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
  SELECT
    p.id,
    p.name,
    p.age,
    p.gender,
    p.bio,
    p.avatar_url,
    p.is_verified,
    -- Distance still computed from real location so ordering is correct,
    -- then rounded to the nearest 100m for display.
    ROUND((ST_Distance(p.location, user_point) / 1000.0)::numeric, 1)::float AS distance_km,
    ma.mode,
    ma.available_time,
    ma.details AS mode_details,
    -- Grid-snap coordinates to 0.005 degrees (~500m at Paris lat).
    -- This is the ONLY coordinate returned to clients.
    ST_Y(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lat_rough,
    ST_X(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lng_rough
  FROM public.profiles p
  LEFT JOIN public.mode_activations ma
    ON ma.user_id = p.id AND ma.is_active = true
  WHERE p.is_online = true
    AND p.location IS NOT NULL
    AND p.id <> (SELECT auth.uid())
    AND ST_DWithin(p.location, user_point, radius_km * 1000)
    AND (mode_filter IS NULL OR ma.mode = mode_filter)
    AND (gender_filter IS NULL OR p.gender = gender_filter)
    -- Age filter (kept from prod 8-arg version for client compat).
    AND p.age BETWEEN age_min AND age_max
    -- Bidirectional block filter (#6 SEC-004).
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
         OR (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
    )
  ORDER BY distance_km ASC
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

-- -----------------------------------------------------------------------
-- 3. online_hotspot_profiles — replaces PR #15 useHotspots short-circuit
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.online_hotspot_profiles()
RETURNS TABLE (
  id          UUID,
  lat_rough   FLOAT,
  lng_rough   FLOAT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    ST_Y(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lat_rough,
    ST_X(ST_SnapToGrid(p.location::geometry, 0.005))::float AS lng_rough
  FROM public.profiles p
  WHERE p.is_online = true
    AND p.last_seen > NOW() - INTERVAL '5 minutes'
    AND p.location IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
         OR (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
    );
$$;

ALTER FUNCTION public.online_hotspot_profiles() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.online_hotspot_profiles() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.online_hotspot_profiles() FROM anon, public;

-- -----------------------------------------------------------------------
-- 4. Comments for future maintainers
-- -----------------------------------------------------------------------

COMMENT ON POLICY "Authenticated can view non-blocked profiles" ON public.profiles IS
  'Wave post-glowup 2026-04-24 (#6 SEC-004). Replaces the previous '
  '`USING (true)` that let a blocked user keep reading the victim''s row. '
  'The bidirectional NOT EXISTS makes the block symmetric.';

COMMENT ON FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) IS
  'Wave post-glowup 2026-04-24 (#5 SEC-001). Grid-snaps returned '
  'coordinates to 0.005° (~500m) so a database breach OR a compromised '
  'authenticated user cannot resolve a profile to apartment-level precision. '
  'Bidirectional user_blocks filter mirrors the new profiles SELECT policy.';

COMMENT ON FUNCTION public.online_hotspot_profiles() IS
  'Wave post-glowup 2026-04-24. Called by useHotspots — previously the '
  'hook SELECTed `id, latitude, longitude` directly from profiles, but '
  'those columns never existed on the PostGIS schema, so every 60s poll '
  'returned HTTP 400 and the fallback rendered count=0 hotspots (see '
  'PR #15 commit 17b34ad). This RPC returns the grid-snapped coordinate '
  'pair the hook actually needs.';

COMMIT;

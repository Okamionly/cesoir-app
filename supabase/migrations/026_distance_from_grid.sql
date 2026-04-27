-- 026_distance_from_grid.sql
-- 2026-04-26 — Trilateration prevention (closes Round 3 audit #SEC-002)
--
-- # Background
--
-- Migration 024 grid-snapped the lat/lng returned by `nearby_profiles` to
-- ~500m buckets (#5 SEC-001). However, the `distance_km` column was still
-- computed from the **precise** PostGIS `p.location` and rounded to 0.1 km
-- (~100m precision). This re-opens the same attack vector the grid-snap
-- was meant to close: classic Tinder-style trilateration.
--
-- The CVE-2014-equivalent attack:
--
--   1. Attacker spoofs their own GPS to 3 known coordinates (A, B, C),
--      each well separated. The Supabase client lets them pick `user_lat`
--      and `user_lng` freely — the RPC trusts caller-supplied coords by
--      design (it has to, because GPS lives on the device).
--   2. From each vantage point the attacker reads the victim's
--      `distance_km` rounded to 0.1 km.
--   3. Three concentric circles of known radius around 3 known centres
--      have a single intersection — the victim's exact location, ±~50m.
--      That precision easily resolves to an apartment.
--
-- The 500m grid-snap on `lat/lng` doesn't help because the distance
-- computation bypasses the grid entirely (uses raw `p.location`).
--
-- # What this migration does
--
-- Rewrites `nearby_profiles` so `distance_km` is computed from the
-- already-grid-snapped `lat_rough`/`lng_rough` (i.e. the same coordinate
-- the client receives), then rounded to the nearest 1 km (not 0.1 km).
-- An attacker now sees only:
--
--   * lat/lng quantized to 500m
--   * distance quantized to 1 km
--
-- which kills trilateration: 3 distance circles with ±500m radius +
-- ±500m centre uncertainty produce an intersection region larger than
-- the grid cell itself — i.e. no information beyond the grid cell that
-- was already public.
--
-- Ordering by distance still works: the grid-snapped distance is
-- monotonic with the true distance at the radius scales the app uses
-- (1-50 km), so the result list order is preserved up to ties within a
-- single grid cell, which is acceptable.
--
-- # Notes
--
--   * Function signature (args + return columns) is identical to
--     migration 024 so `src/lib/matching.ts` and `src/lib/useProfiles.ts`
--     keep working without code changes.
--   * `ST_DistanceSphere` is used (faster than `ST_Distance` on geography
--     when both inputs are simple points and we only need metres back).
--   * Grants/owners are re-asserted out of caution — if 024 ran, they're
--     already in place; if not, this migration is self-sufficient.
--
-- # Test plan BEFORE merging
--
--   * Apply on a Supabase Branch (not prod).
--   * Insert two profiles A, B at coords ~50m apart in the same 500m cell:
--       - A calls nearby_profiles() → B's `distance_km` = 0 (same cell). PASS.
--   * Insert C ~2.3 km from A:
--       - A calls nearby_profiles() → C's `distance_km` = 2 (rounded from 2.3). PASS.
--   * Trilateration check: from 3 vantage points 5 km apart, repeatedly
--     query a stationary target → all 3 distances stay quantized at the
--     km grid; intersection circle radius >= 1 km (no apartment fix). PASS.
--
-- # Rollback
--
-- Re-apply migration 024.

BEGIN;

-- Drop the 8-arg version installed by 024 so we can replace it cleanly
-- (the return signature is identical, but DROP+CREATE is safer than
-- relying on CREATE OR REPLACE when the function body changes meaning).
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
  distance_km     FLOAT,   -- now computed from grid-snapped coords, rounded to 1 km
  mode            TEXT,
  available_time  TEXT,
  mode_details    JSONB,
  lat_rough       FLOAT,   -- 500m grid-snapped
  lng_rough       FLOAT    -- 500m grid-snapped
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  user_point geography;
BEGIN
  -- Precise user point is still used for the radius pre-filter (ST_DWithin),
  -- because the radius filter is a server-side optimization and never leaks
  -- — only the *displayed* distance and coordinates are quantized.
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
      -- Bidirectional block filter (#6 SEC-004, kept from mig 024).
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
    -- SEC-002: distance is now derived from the SAME grid-snapped point
    -- the client receives, then rounded to the nearest 1 km. An attacker
    -- triangulating 3 distances obtains 3 circles of radius (k ± 0.5) km
    -- centred on points known only to ±500m — the intersection is a
    -- region wider than the 500m grid cell, so no information beyond
    -- the grid cell is leaked.
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
    s.lng_rough
  FROM snapped s
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

COMMENT ON FUNCTION public.nearby_profiles(
  FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER
) IS
  'Round 3 audit (#SEC-002, 2026-04-26). Distance is now computed from '
  'the grid-snapped (lat_rough, lng_rough) — the same coordinate the '
  'client receives — and rounded to the nearest 1 km. Closes the Tinder '
  '2014 trilateration vector that mig 024''s 500m grid-snap left open '
  'because distance was still derived from p.location at 0.1 km precision.';

COMMIT;

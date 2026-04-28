-- 040_travel_passport.sql
-- 2026-04-28 — Travel Passport (Wave 17)
--
-- # Background
--
-- Adds a "travel passport" so a user can set a future location for matching.
-- While the passport window is active (`now()` between
-- `passport_active_from` and `passport_active_until`), the matching RPC
-- substitutes the passport coordinates for the user's real GPS — they
-- appear to nearby_profiles() callers as if they were physically in the
-- target city. The user's real GPS (`profiles.location`) is NEVER touched
-- so /map keeps showing the device-actual position.
--
-- Use case: user in Montpellier plans a 3-day trip to Lyon; sets passport
-- to Lyon for those 3 days; their swipe deck (and reciprocally, Lyon
-- users' swipe decks for them) starts using the Lyon coordinates a few
-- days before arrival. Mirrors Tinder Passport / Bumble Travel.
--
-- # What this migration does
--
--   1. Adds 5 columns to `public.profiles`:
--        passport_lat, passport_lng        (DOUBLE PRECISION, optional)
--        passport_city                     (TEXT, display name)
--        passport_active_from              (TIMESTAMPTZ, window start)
--        passport_active_until             (TIMESTAMPTZ, window end)
--      Constraint: window must be coherent (from < until) and bounded to
--      30 days max — prevents users from indefinitely camping in foreign
--      cities (anti-abuse + matches the UX cap in PassportEditor.tsx).
--
--   2. Adds a partial index on `passport_active_until` filtered to
--      currently-active passports — keeps the index tiny.
--
--   3. Rewrites `nearby_profiles` RPC. The behaviour is identical EXCEPT:
--        - When the *caller's* passport is active, we substitute
--          `(passport_lng, passport_lat)` for `(user_lng, user_lat)` for
--          the radius pre-filter and distance computation. The CALLER
--          sees results "as if they were in the passport city".
--        - When a *peer's* passport is active, we use that peer's
--          passport coords instead of `p.location` for the snap, distance,
--          and radius filter. The PEER appears to others "as if there".
--        - A new return column `passport_active boolean` lets the client
--          render a passport chip on the SwipeCard.
--
--   4. Permissions / search_path / SECURITY mirror migration 030.
--
-- # Privacy + abuse considerations
--
--   * Passport coordinates are stored at the precision the user picked
--     (city centre, ~3 decimals). Even if leaked, no apartment-level
--     info is recoverable.
--   * The 500m grid-snap and 1 km distance rounding from migrations 024 /
--     026 (SEC-001 / SEC-002) ARE STILL APPLIED to the result. Whether
--     a peer is "really" in Lyon or "passport-spoofing" Lyon is
--     indistinguishable to the caller, by design.
--   * The 30-day cap is enforced server-side via CHECK constraint so the
--     client can't bypass it.
--   * The /map page must still use the *real* GPS — handled in client
--     code (`/map/page.tsx` reads device geolocation, not profiles.passport_*).
--
-- # Test plan BEFORE merging
--
--   * Apply on a Supabase Branch.
--   * Update profile A:
--       passport_lat = 45.764, passport_lng = 4.8357,
--       passport_city = 'Lyon',
--       passport_active_from = now() - interval '1 hour',
--       passport_active_until = now() + interval '3 days'
--   * Profile B in Lyon (lat 45.76, lng 4.83) calls nearby_profiles()
--       → A appears in the result with sensible distance_km. PASS.
--   * Profile A calls nearby_profiles() with their REAL Montpellier
--     coords as user_lat / user_lng:
--       → A's result list is centred on Lyon (the passport coords),
--         not on Montpellier. PASS.
--   * Set passport_active_until = now() - interval '1 minute'
--       → behaviour reverts to real GPS for both directions. PASS.
--   * Try to insert a 31-day window:
--       → CHECK violation. PASS.
--
-- # Rollback
--
-- DROP COLUMN passport_*, DROP INDEX, re-apply migration 030 to restore
-- the prior nearby_profiles signature/body.

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Schema additions
-- -----------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_lat           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS passport_lng           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS passport_city          TEXT,
  ADD COLUMN IF NOT EXISTS passport_active_from   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passport_active_until  TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.passport_lat IS
  'Travel passport target latitude (mig 040). NULL = no passport set. '
  'When the passport window is active, nearby_profiles() substitutes '
  '(passport_lat, passport_lng) for (location) so the user matches as '
  'if physically in the passport city.';

COMMENT ON COLUMN public.profiles.passport_lng IS
  'Travel passport target longitude (mig 040). See passport_lat.';

COMMENT ON COLUMN public.profiles.passport_city IS
  'Travel passport target city display name (mig 040). Cosmetic — used '
  'for the "Passport" pill on /profile and the chip on the SwipeCard.';

COMMENT ON COLUMN public.profiles.passport_active_from IS
  'Travel passport window start (mig 040). Inclusive. Passport is active '
  'when now() is between passport_active_from and passport_active_until.';

COMMENT ON COLUMN public.profiles.passport_active_until IS
  'Travel passport window end (mig 040). Inclusive. Window length is '
  'capped at 30 days by passport_window_max CHECK constraint.';

-- Window must be coherent and bounded. Either all 5 columns are NULL
-- (no passport), or all 5 are set and the window is <= 30 days.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS passport_window_valid;
ALTER TABLE public.profiles
  ADD CONSTRAINT passport_window_valid CHECK (
    -- Either fully unset (no passport) ...
    (passport_lat IS NULL
     AND passport_lng IS NULL
     AND passport_city IS NULL
     AND passport_active_from IS NULL
     AND passport_active_until IS NULL)
    -- ... or fully set, coherent, and capped at 30 days.
    OR (passport_lat IS NOT NULL
        AND passport_lng IS NOT NULL
        AND passport_city IS NOT NULL
        AND passport_active_from IS NOT NULL
        AND passport_active_until IS NOT NULL
        AND passport_active_until > passport_active_from
        AND passport_active_until <= passport_active_from + interval '30 days'
        AND passport_lat BETWEEN -90 AND 90
        AND passport_lng BETWEEN -180 AND 180)
  );

-- Partial index: only active-or-future passports are indexed.
CREATE INDEX IF NOT EXISTS idx_profiles_passport_active
  ON public.profiles (passport_active_until)
  WHERE passport_active_until IS NOT NULL;

-- -----------------------------------------------------------------------
-- 2. Rewrite nearby_profiles to honour passport (caller + peers)
-- -----------------------------------------------------------------------
--
-- Drop the 8-arg version installed by mig 030 and recreate with the same
-- signature plus the new `passport_active boolean` return column.

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
  id                 UUID,
  name               TEXT,
  age                INTEGER,
  gender             TEXT,
  bio                TEXT,
  avatar_url         TEXT,
  is_verified        BOOLEAN,
  distance_km        FLOAT,
  mode               TEXT,
  available_time     TEXT,
  mode_details       JSONB,
  lat_rough          FLOAT,
  lng_rough          FLOAT,
  broadcast_active   BOOLEAN,
  passport_active    BOOLEAN,    -- NEW (mig 040): peer's passport currently active
  passport_city      TEXT        -- NEW (mig 040): cosmetic — "Lyon", "Paris", ...
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_passport_lat   FLOAT;
  caller_passport_lng   FLOAT;
  caller_passport_active BOOLEAN := false;
  effective_lat         FLOAT;
  effective_lng         FLOAT;
  user_point            geography;
BEGIN
  -- ─── Caller passport check ────────────────────────────────────────────
  -- If the caller has an active passport window, we substitute their
  -- passport coordinates for the user_lat/user_lng they passed in.
  -- (We trust the caller-supplied coords by design — they're the device
  -- GPS — but if they have a passport, the passport wins for matching.)
  SELECT
    p.passport_lat,
    p.passport_lng,
    (p.passport_active_from IS NOT NULL
       AND p.passport_active_until IS NOT NULL
       AND now() BETWEEN p.passport_active_from AND p.passport_active_until)
  INTO caller_passport_lat, caller_passport_lng, caller_passport_active
  FROM public.profiles p
  WHERE p.id = (SELECT auth.uid());

  IF caller_passport_active THEN
    effective_lat := caller_passport_lat;
    effective_lng := caller_passport_lng;
  ELSE
    effective_lat := user_lat;
    effective_lng := user_lng;
  END IF;

  user_point := ST_SetSRID(ST_MakePoint(effective_lng, effective_lat), 4326)::geography;

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
      p.passport_lat,
      p.passport_lng,
      p.passport_city,
      p.passport_active_from,
      p.passport_active_until,
      -- Peer's effective point: their passport coords if active, else
      -- their real `location`. Built once here so both the radius
      -- pre-filter and the snap below agree.
      CASE
        WHEN p.passport_active_from IS NOT NULL
             AND p.passport_active_until IS NOT NULL
             AND now() BETWEEN p.passport_active_from AND p.passport_active_until
             AND p.passport_lat IS NOT NULL
             AND p.passport_lng IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(p.passport_lng, p.passport_lat), 4326)::geography
        ELSE p.location
      END AS effective_location,
      -- Pre-compute peer passport active flag — we surface it on the
      -- result row so the SwipeCard can render a "Passport" chip.
      (p.passport_active_from IS NOT NULL
        AND p.passport_active_until IS NOT NULL
        AND now() BETWEEN p.passport_active_from AND p.passport_active_until
        AND p.passport_lat IS NOT NULL
        AND p.passport_lng IS NOT NULL) AS peer_passport_active,
      ma.mode,
      ma.available_time,
      ma.details AS mode_details
    FROM public.profiles p
    LEFT JOIN public.mode_activations ma
      ON ma.user_id = p.id AND ma.is_active = true
    WHERE p.is_online = true
      AND (
        -- A profile is geographically reachable if either its real
        -- `location` OR its passport coords resolves to a point.
        p.location IS NOT NULL
        OR (p.passport_lat IS NOT NULL AND p.passport_lng IS NOT NULL)
      )
      AND p.id <> (SELECT auth.uid())
      AND (mode_filter IS NULL OR ma.mode = mode_filter)
      AND (gender_filter IS NULL OR p.gender = gender_filter)
      AND p.age BETWEEN age_min AND age_max
      -- Bidirectional block filter (#6 SEC-004, kept from mig 024 / 026 / 030).
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
           OR (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
      )
  ),
  -- Apply the radius filter on the *effective* location (post-passport).
  -- Done in a separate CTE so the snap + distance compute below can
  -- continue to reference the snapped values without re-checking range.
  in_range AS (
    SELECT
      s.*,
      ST_Y(ST_SnapToGrid(s.effective_location::geometry, 0.005))::float AS lat_rough,
      ST_X(ST_SnapToGrid(s.effective_location::geometry, 0.005))::float AS lng_rough
    FROM snapped s
    WHERE ST_DWithin(s.effective_location, user_point, radius_km * 1000)
  )
  SELECT
    r.id,
    r.name,
    r.age,
    r.gender,
    r.bio,
    r.avatar_url,
    r.is_verified,
    -- Distance from grid-snapped peer point to caller's effective point,
    -- rounded to 1 km (mig 026 / SEC-002 trilateration prevention).
    ROUND(
      ST_DistanceSphere(
        ST_MakePoint(r.lng_rough, r.lat_rough),
        ST_MakePoint(effective_lng, effective_lat)
      )::numeric / 1000.0
    )::float AS distance_km,
    r.mode,
    r.available_time,
    r.mode_details,
    r.lat_rough,
    r.lng_rough,
    (r.broadcast_until IS NOT NULL AND r.broadcast_until > now()) AS broadcast_active,
    r.peer_passport_active AS passport_active,
    -- Only expose the peer's city name when their passport is active —
    -- avoids leaking a planned-but-not-yet-active future trip.
    CASE WHEN r.peer_passport_active THEN r.passport_city ELSE NULL END AS passport_city
  FROM in_range r
  ORDER BY
    distance_km ASC,
    (r.broadcast_until IS NOT NULL AND r.broadcast_until > now()) DESC
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
  'Wave 17 mig 040 (2026-04-28). Honours travel passport for both caller '
  '(substitutes user_lat/user_lng with passport coords when active) and '
  'each peer (substitutes p.location with peer''s passport coords when '
  'active). Returns peer.passport_active + peer.passport_city for the '
  'SwipeCard chip. /map keeps using device GPS (no RPC call there).';

COMMIT;

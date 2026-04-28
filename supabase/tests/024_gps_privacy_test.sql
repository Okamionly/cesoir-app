-- 024_gps_privacy_test.sql
-- Run after migration 024 is applied to a fresh local Supabase.
-- Validates 3 invariants: bidirectional block filter, grid-snap, RPC integrity.

-- ============================================================
-- Setup
-- ============================================================

BEGIN;

-- Two test users (real auth.users rows so RLS can resolve auth.uid())
INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000a01', 'user_a@test.local', 'authenticated', 'authenticated', '$2a$10$dummy', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000b02', 'user_b@test.local', 'authenticated', 'authenticated', '$2a$10$dummy', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Profiles for both, located 1 meter apart (~lat 0.000009 ≈ 1m at Paris).
INSERT INTO profiles (id, name, age, gender, looking_for, location, is_online, last_seen)
VALUES
  ('00000000-0000-0000-0000-000000000a01', 'Alice', 28, 'f', 'h', ST_SetSRID(ST_MakePoint(2.350000, 48.850000), 4326)::geography, true, now()),
  ('00000000-0000-0000-0000-000000000b02', 'Bob',   30, 'm', 'f', ST_SetSRID(ST_MakePoint(2.350009, 48.850009), 4326)::geography, true, now())
ON CONFLICT (id) DO UPDATE SET
  location = EXCLUDED.location,
  is_online = EXCLUDED.is_online,
  last_seen = EXCLUDED.last_seen;

COMMIT;

-- ============================================================
-- TEST 1 — grid-snap returns same cell for nearby profiles
-- ============================================================
-- Both A and B sit in the same 0.005° (~500m) grid cell.

\echo
\echo '=== TEST 1: grid-snap (both should return same lat/lng_rough) ==='

SELECT
  ST_Y(ST_SnapToGrid((SELECT location::geometry FROM profiles WHERE id = '00000000-0000-0000-0000-000000000a01'), 0.005)) AS a_lat,
  ST_Y(ST_SnapToGrid((SELECT location::geometry FROM profiles WHERE id = '00000000-0000-0000-0000-000000000b02'), 0.005)) AS b_lat,
  ST_X(ST_SnapToGrid((SELECT location::geometry FROM profiles WHERE id = '00000000-0000-0000-0000-000000000a01'), 0.005)) AS a_lng,
  ST_X(ST_SnapToGrid((SELECT location::geometry FROM profiles WHERE id = '00000000-0000-0000-0000-000000000b02'), 0.005)) AS b_lng;

-- Expected: a_lat = b_lat = 48.85, a_lng = b_lng = 2.35

-- ============================================================
-- TEST 2 — bidirectional user_blocks filter
-- ============================================================
-- A blocks B. As A (auth.uid() = A's id), SELECT on profiles WHERE id=B should
-- return 0. As B, SELECT on profiles WHERE id=A should also return 0.

\echo
\echo '=== TEST 2a: insert block A → B ==='

INSERT INTO user_blocks (blocker_id, blocked_id, reason, created_at)
VALUES ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02', 'test', now())
ON CONFLICT DO NOTHING;

\echo
\echo '=== TEST 2b: as A, SELECT B (expect 0 rows) ==='

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000a01';
SELECT id FROM profiles WHERE id = '00000000-0000-0000-0000-000000000b02';
RESET role;

\echo
\echo '=== TEST 2c: as B, SELECT A (expect 0 rows — symmetric) ==='

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000b02';
SELECT id FROM profiles WHERE id = '00000000-0000-0000-0000-000000000a01';
RESET role;

-- ============================================================
-- TEST 3 — nearby_profiles RPC returns lat_rough/lng_rough only
-- ============================================================

\echo
\echo '=== TEST 3a: cleanup block + run nearby_profiles as A ==='

DELETE FROM user_blocks WHERE blocker_id = '00000000-0000-0000-0000-000000000a01' AND blocked_id = '00000000-0000-0000-0000-000000000b02';

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000a01';

-- Should return Bob with lat_rough = 48.85, lng_rough = 2.35
SELECT id, name, lat_rough, lng_rough, ROUND(distance_km::numeric, 2) AS distance_km
FROM nearby_profiles(48.85, 2.35, 10);

RESET role;

\echo
\echo '=== TEST 3b: re-block + run nearby_profiles as A (expect Bob excluded) ==='

INSERT INTO user_blocks (blocker_id, blocked_id, reason, created_at)
VALUES ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02', 'test2', now())
ON CONFLICT DO NOTHING;

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000a01';
SELECT count(*) AS bob_appears FROM nearby_profiles(48.85, 2.35, 10) WHERE id = '00000000-0000-0000-0000-000000000b02';
-- Expected: 0
RESET role;

-- ============================================================
-- TEST 4 — online_hotspot_profiles RPC also returns rough coords
-- ============================================================

\echo
\echo '=== TEST 4: online_hotspot_profiles ==='

DELETE FROM user_blocks WHERE blocker_id = '00000000-0000-0000-0000-000000000a01' AND blocked_id = '00000000-0000-0000-0000-000000000b02';

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000a01';

SELECT id, lat_rough, lng_rough FROM online_hotspot_profiles() ORDER BY id;
-- Expected: 2 rows (Alice + Bob), both with same lat_rough/lng_rough (~48.85, ~2.35)

RESET role;

-- ============================================================
-- Cleanup
-- ============================================================

DELETE FROM user_blocks WHERE blocker_id IN ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02');
DELETE FROM profiles WHERE id IN ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000b02');

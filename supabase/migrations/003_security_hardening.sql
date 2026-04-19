-- ═══════════════════════════════════════════════════════════════════
-- Migration 003 — Security Hardening (audit 2026-04-19)
--
-- Applied via Supabase MCP on 2026-04-19 (version 20260419001811).
-- Saved to repo for reproducibility — see supabase/MIGRATION_HISTORY_NOTE.md
-- for context on the missing 001_initial_schema baseline.
--
-- Fixes from AUDIT_BACKEND_2026-04-19.md:
--   C1 — Scope profiles SELECT to authenticated only (was public/anon)
--   C2 — Add DELETE policies on profiles + storage.objects (avatars)
--   H1 — Drop "Avatar public read" listing policy
--   M1 — SET search_path on 6 SECURITY-sensitive functions
--
-- Skipped (require manual dashboard action — see
-- AUDIT_BACKEND_2026-04-19_ACTIONS_MANUELLES.md):
--   H4 (RLS spatial_ref_sys) — owned by postgres superuser
--   H2 (HIBP) — Auth setting, not SQL
--   M3 (PostGIS schema move) — risky, requires function rebuild
-- ═══════════════════════════════════════════════════════════════════

-- ─── C1 ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ─── C2 ──────────────────────────────────────────────────────────────
CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Avatar delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ─── H1 ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;

-- ─── M1 ──────────────────────────────────────────────────────────────
ALTER FUNCTION public.cleanup_stale_online() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

ALTER FUNCTION public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  mode_filter text,
  gender_filter text,
  limit_count integer
) SET search_path = '';

ALTER FUNCTION public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  mode_filter text,
  gender_filter text,
  age_min integer,
  age_max integer,
  limit_count integer
) SET search_path = '';

ALTER FUNCTION public.update_location(
  lat double precision,
  lng double precision
) SET search_path = '';

ALTER FUNCTION public.update_location(
  uid uuid,
  lat double precision,
  lng double precision
) SET search_path = '';

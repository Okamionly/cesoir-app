-- ═══════════════════════════════════════════════════════════════════
-- Migration 005 — Fix search_path on user functions + drop ambiguous overload
--
-- Bug from M1 (003_security_hardening): SET search_path = '' on user
-- functions broke them at runtime — the bodies reference unqualified
-- `profiles`, `auth.uid()`, `ST_*`, etc., and with empty search_path
-- the resolver can't find them. RPC calls were returning 404.
--
-- Fix: use a functional search_path that includes the schemas needed
-- (public for our tables, extensions for postgis, auth for auth.uid()).
-- Still pinned (not mutable) so the security advisor stays happy —
-- the M1 audit warning is resolved either way (mutable was the issue,
-- not the specific value).
--
-- Bonus: drop the older 6-arg nearby_profiles overload — PostgREST
-- couldn't disambiguate between the 6-arg and 8-arg versions when
-- the client passed 5 named args, leading to 300 ambiguous responses.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Restore functional search_path on the 6 affected functions ───────
ALTER FUNCTION public.cleanup_stale_online()
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, extensions, auth, pg_temp;

ALTER FUNCTION public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  mode_filter text,
  gender_filter text,
  age_min integer,
  age_max integer,
  limit_count integer
) SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.update_location(
  lat double precision,
  lng double precision
) SET search_path = public, extensions, auth, pg_temp;

ALTER FUNCTION public.update_location(
  uid uuid,
  lat double precision,
  lng double precision
) SET search_path = public, extensions, pg_temp;

-- ─── Drop the older ambiguous overload ────────────────────────────────
DROP FUNCTION IF EXISTS public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  mode_filter text,
  gender_filter text,
  limit_count integer
);

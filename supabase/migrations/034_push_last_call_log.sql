-- ===================================================================
-- Migration 030 — Last Call push: rate-limit log + nearby events RPC
--
-- Backs the /api/push/last-call cron (Wave 17 evening engagement).
--
-- Two artefacts:
--   1. push_last_call_log — one row per (user_id, sent_at). Used by
--      the cron handler to enforce a 24h rate limit (no user gets the
--      Last Call push twice in a day even if the cron misfires).
--   2. events_nearby_in_window(user_point, radius_km, window_start,
--      window_end, limit_count) → top-N upcoming events near the
--      caller. Pure read function, SECURITY INVOKER (the cron uses
--      service-role anyway, so RLS is bypassed regardless).
-- ===================================================================

BEGIN;

-- -------------------------------------------------------------------
-- 1. push_last_call_log
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_last_call_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Event IDs included in the payload — useful for debugging "why did
  -- I get this push?" support tickets and for retro analytics on
  -- which events drive the highest CTR.
  event_ids   UUID[] NOT NULL DEFAULT '{}'::UUID[]
);

COMMENT ON TABLE public.push_last_call_log IS
  'Audit log of Last Call push deliveries. Used as a 24h rate-limit
   guard by /api/push/last-call. Cascades on user delete (RGPD).';

-- Hot-path index: the cron looks up "have we pushed user X in the
-- last 24h?" — single-column user_id is fine for the in-list lookup,
-- but a composite covers the time-bucketed scan analytics will run.
CREATE INDEX IF NOT EXISTS idx_push_last_call_log_user_sent
  ON public.push_last_call_log (user_id, sent_at DESC);

ALTER TABLE public.push_last_call_log ENABLE ROW LEVEL SECURITY;

-- Users can SEE their own log rows (transparency / "why did I get this
-- push?" UX). The cron writes via service role, which bypasses RLS;
-- we deliberately do NOT add an INSERT policy so authenticated users
-- can't fake delivery records to dodge future pushes.
DROP POLICY IF EXISTS "users_read_own_last_call_log"
  ON public.push_last_call_log;
CREATE POLICY "users_read_own_last_call_log"
  ON public.push_last_call_log FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------
-- 2. events_nearby_in_window RPC
-- -------------------------------------------------------------------
-- Why an RPC instead of a PostgREST query: PostgREST can't easily
-- combine ST_DWithin + a time-range filter on the geography column
-- without a view, and we don't want to expose a public view that
-- lets a malicious user enumerate every event geographically. RPC
-- with explicit parameters keeps the surface small.
--
-- SECURITY INVOKER + STABLE → safe to call from authenticated
-- contexts in the future (the function only reads non-sensitive
-- event metadata) but for now it's invoked by the cron handler with
-- the service-role client.

CREATE OR REPLACE FUNCTION public.events_nearby_in_window(
  user_point     GEOGRAPHY,
  radius_km      FLOAT,
  window_start   TIMESTAMPTZ,
  window_end     TIMESTAMPTZ,
  limit_count    INTEGER DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  starts_at   TIMESTAMPTZ,
  distance_km FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.starts_at,
    ROUND(
      (ST_Distance(e.venue_location, user_point) / 1000.0)::numeric,
      1
    )::float AS distance_km
  FROM public.events e
  WHERE e.is_cancelled = false
    AND e.starts_at >= window_start
    AND e.starts_at <  window_end
    AND ST_DWithin(e.venue_location, user_point, radius_km * 1000)
  ORDER BY
    -- Featured pinned to top, then nearest, then earliest.
    e.featured DESC,
    distance_km ASC,
    e.starts_at ASC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.events_nearby_in_window(
  GEOGRAPHY, FLOAT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER
) IS
  'Returns top-N events within `radius_km` of `user_point` whose
   starts_at falls in [window_start, window_end). Used by the
   /api/push/last-call cron to assemble the 19h45 push payload.
   Featured events are pinned first, then nearest by distance.';

GRANT EXECUTE ON FUNCTION public.events_nearby_in_window(
  GEOGRAPHY, FLOAT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER
) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.events_nearby_in_window(
  GEOGRAPHY, FLOAT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER
) FROM anon, public;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- Migration 049 — SEC-003: compute_ghost_score self-only guard
--
-- Problem (reported 2026-05-07 CTO audit):
--   public.compute_ghost_score(uid UUID) is GRANT EXECUTE TO authenticated
--   with no caller identity check. Any authenticated user could call
--   SELECT public.compute_ghost_score('<victim-uuid>') and learn:
--     • the victim's ghost score (0-3)
--     • implicitly: how many unanswered convos, late cancels, silent
--       collector matches the victim has (via score value + cross-query)
--   This enables behavioral stalking and harassment targeting.
--
-- Fix:
--   Patch the function body to reject calls where auth.uid() <> uid.
--   The service-role path (apply_ghost_decay) calls the function while
--   auth.uid() IS NULL (service role bypasses auth context), so the
--   guard only fires for authenticated client calls with a mismatched uid.
--
-- Safety properties preserved:
--   • apply_ghost_decay() continues to work — it calls compute_ghost_score
--     as service_role where auth.uid() IS NULL → guard is skipped.
--   • Users can still call compute_ghost_score(auth.uid()) to see their
--     own score ("why is my visibility low" debug surface).
--   • Error code 42501 (insufficient_privilege) is the correct SQLSTATE
--     for an authorisation rejection — clients receive PGRST code P0001
--     with "forbidden" message; they should not see internal detail.
--
-- The function body is otherwise byte-for-byte identical to migration 045
-- lines 154-236 to avoid regression. Search_path pinned as before.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.compute_ghost_score(uid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  score             INTEGER := 0;
  unanswered_count  INTEGER;
  late_cancel_count INTEGER;
  recent_matches    INTEGER;
  recent_convos     INTEGER;
BEGIN
  -- SEC-003: authenticated callers may only query their own score.
  -- Service-role callers (apply_ghost_decay cron) have auth.uid() IS NULL
  -- and are allowed through unconditionally.
  IF auth.uid() IS NOT NULL AND uid <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- -----------------------------------------------------------------
  -- Signal A: unanswered conversations in the last 14 days
  -- -----------------------------------------------------------------
  SELECT COUNT(*) INTO unanswered_count
    FROM public.conversations c
   WHERE (c.user_a = uid OR c.user_b = uid)
     AND c.created_at >= now() - INTERVAL '14 days'
     AND NOT EXISTS (
       SELECT 1
         FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id = uid
     );

  IF unanswered_count >= 3 THEN
    score := score + 1;
  END IF;

  -- -----------------------------------------------------------------
  -- Signal B: late-cancelled flash_plans in the last 30 days
  -- -----------------------------------------------------------------
  SELECT COUNT(*) INTO late_cancel_count
    FROM public.flash_plans fp
   WHERE fp.creator_id = uid
     AND fp.status = 'closed'
     AND fp.when_at >= now() - INTERVAL '30 days'
     AND fp.when_at - fp.created_at < INTERVAL '2 hours';

  IF late_cancel_count >= 2 THEN
    score := score + 1;
  END IF;

  -- -----------------------------------------------------------------
  -- Signal C: 5+ inbound matches in 7d, 0 conversations started
  -- -----------------------------------------------------------------
  SELECT COUNT(*) INTO recent_matches
    FROM public.conversations c
   WHERE (c.user_a = uid OR c.user_b = uid)
     AND c.created_at >= now() - INTERVAL '7 days';

  SELECT COUNT(DISTINCT m.conversation_id) INTO recent_convos
    FROM public.messages m
   WHERE m.sender_id = uid
     AND m.created_at >= now() - INTERVAL '7 days';

  IF recent_matches >= 5 AND recent_convos = 0 THEN
    score := score + 1;
  END IF;

  RETURN LEAST(3, GREATEST(0, score));
END;
$$;

COMMENT ON FUNCTION public.compute_ghost_score(UUID) IS
  'Returns 0-3 reflecting how strongly the user pattern-matches a
   ghoster profile. +1 per signal: 3+ unanswered convos in 14d; 2+
   late-cancelled flash_plans in 30d; 5+ matches in 7d with 0 outbound
   messages. Used by apply_ghost_decay() and exposed for self-debugging.
   SEC-003 (mig 049): authenticated callers may only query their own uid;
   service_role (auth.uid() IS NULL) is exempt so the cron path works.';

COMMIT;

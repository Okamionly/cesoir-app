-- ═══════════════════════════════════════════════════════════════════
-- Migration 045 — Anti-ghost karma decay (Wave 17)
--
-- Problem: chronic ghosters poison the matching pool. The classic dating
-- failure mode is a small fraction of users who match, never message,
-- and resurface as fresh-looking profiles for the next batch — they
-- soak up roses, dilute social trust, and burn the goodwill of users
-- who actually plan to show up.
--
-- This migration introduces a recurring penalty system. Once a day a
-- background job (see /api/cron/anti-ghost) runs `apply_ghost_decay()`,
-- which scans every user, computes a 0-3 ghost score, and — if the
-- score is non-zero — inserts a row into `ghost_penalties` and deducts
-- karma. Active penalties feed back into the matching pipeline as a
-- visibility deboost (see src/lib/matching.ts).
--
-- Definitions (the three signals contributing to the score):
--   +1  if the user has ≥3 matched conversations in the last 14 days
--       with ZERO messages from that user's side after the match
--   +1  if the user has ≥2 flash_plans in the last 30 days that were
--       cancelled less than 2 hours before plan_time
--   +1  if the user has ≥5 matches in the last 7 days but 0
--       conversations were started during that window
--
-- Severity → karma cost:
--   severity 1 → -15
--   severity 2 → -30
--   severity 3 → -45
--
-- Penalty lifetime: 30 days (expires_at is set on insert).
--
-- Idempotency: at most ONE row per (user_id, applied_at::date) — re-runs
-- on the same day are a no-op (ON CONFLICT DO NOTHING).
--
-- Grace period: users <14 days old are excluded. New profiles often
-- have many unanswered matches because they're still figuring out the
-- product — penalising them would be hostile onboarding.
--
-- Schema decisions:
--   * `severity` is an int 1-3 — same shape as the score returned by
--     compute_ghost_score, so the trail is auditable.
--   * `reason` is a text enum-by-CHECK rather than a Postgres enum,
--     because adding a new reason later requires a CHECK migration —
--     not a CREATE TYPE + recompile dance.
--   * `expires_at` is set client-side (function-side) to applied_at +
--     30 days. This keeps the matching deboost query simple (one
--     `expires_at > now()` filter instead of computing the window
--     per-row).
--   * RLS: owner-only SELECT. No INSERT / UPDATE / DELETE from clients
--     — the cron + RPC paths run as service-role.
--
-- Anti-fraud:
--   * Only the cron path can write — there is no client-facing INSERT
--     policy.
--   * Composite UNIQUE on (user_id, day-bucket) prevents a flapping
--     job from stacking multiple penalties in one day.
--   * The 14-day account-age gate makes drive-by sabotage of a fresh
--     account impossible (you can't ghost-tag someone who hasn't had
--     time to ghost yet).
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table — ghost_penalties
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ghost_penalties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  reason      TEXT NOT NULL
              CHECK (reason IN ('unanswered_matches', 'late_cancel', 'silent_collector')),
  severity    INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  -- Day-bucket on which the penalty was applied. Materialised so we
  -- can put a UNIQUE on (user_id, applied_day) to enforce one
  -- penalty per user per day even if the cron fires twice.
  applied_day DATE GENERATED ALWAYS AS (date_trunc('day', applied_at)::date) STORED,
  CONSTRAINT ghost_penalties_one_per_day UNIQUE (user_id, applied_day)
);

-- Hot-path indices:
--   * Active-penalty lookup for matching: WHERE user_id = $1 AND
--     expires_at > now(). Partial index keeps it small as expired
--     rows pile up (we never DELETE for the audit trail).
--   * Per-user history view (profile/admin): user_id + applied_at DESC.
CREATE INDEX IF NOT EXISTS idx_ghost_penalties_active
  ON public.ghost_penalties (user_id, expires_at DESC)
  WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_ghost_penalties_user_recent
  ON public.ghost_penalties (user_id, applied_at DESC);

COMMENT ON TABLE public.ghost_penalties IS
  'Anti-ghost recurring penalty audit trail. One row per (user, day)
   max. Active rows (expires_at > now()) drive a visibility deboost
   in src/lib/matching.ts and a one-shot karma deduction inserted by
   apply_ghost_decay(). Penalties expire 30 days after applied_at; we
   never delete the row so we keep the history for moderation review.';

COMMENT ON COLUMN public.ghost_penalties.severity IS
  '1-3, matches the value returned by compute_ghost_score(). Each
   point costs 15 karma — see apply_ghost_decay for the deduction.';

COMMENT ON COLUMN public.ghost_penalties.reason IS
  'Primary reason. When multiple signals trigger we keep the highest-
   severity one ordered as: unanswered_matches > late_cancel >
   silent_collector. See apply_ghost_decay for the resolution.';

-- -------------------------------------------------------------------
-- 2. RLS — owner-only SELECT
-- -------------------------------------------------------------------

ALTER TABLE public.ghost_penalties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ghost_penalties_owner_select" ON public.ghost_penalties;

CREATE POLICY "ghost_penalties_owner_select"
  ON public.ghost_penalties
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- INSERT / UPDATE / DELETE: NOT exposed to clients. The cron path runs
-- with service-role and bypasses RLS.

-- -------------------------------------------------------------------
-- 3. Function — compute_ghost_score(uid)
-- -------------------------------------------------------------------
-- Returns an int 0-3. Each of the three signals contributes +1.
--
-- Signal A (+1): ≥3 conversations in the last 14 days where the user
-- was a participant AND wrote ZERO messages (i.e. matched but never
-- replied / opened the chat).
--
-- Signal B (+1): ≥2 flash_plans in the last 30 days that were
-- cancelled (status = 'closed' OR DELETED — we only see 'closed' here)
-- WITHIN 2 hours of when_at. We use status='closed' as the cancel
-- signal; the schema doesn't separate "cancelled" from "closed naturally"
-- so we approximate via "closed BEFORE when_at" → late cancel.
--
-- Signal C (+1): ≥5 inbound matches in the last 7 days but the user
-- started 0 conversations during that same window. The "started" check
-- is "user appears as participant in a conversation created in the
-- window" — proxy for the hidden invariant "did they engage at all".

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
  -- -----------------------------------------------------------------
  -- Signal A: unanswered conversations in the last 14 days
  -- -----------------------------------------------------------------
  -- A "conversation" exists between user_a and user_b after they like
  -- each other. Iterating the conversations table and counting those
  -- with zero outbound messages from `uid` gives us the unanswered set.
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
  -- Approximation: a flash_plan that the user CREATED and which is now
  -- 'closed' BEFORE its when_at — meaning the creator pulled the plug
  -- after announcing a time. We narrow further to "closed within 2h
  -- of when_at" using a comparison to created_at as the close-time
  -- proxy. The schema doesn't store an explicit cancelled_at; if we
  -- ever add one, swap in here.
  --
  -- For the "<2h before plan_time" gate we use:
  --   closed_state = (status = 'closed')
  --   AND when_at - created_at < 2h ⇒ "the plan was opened with less
  --   than 2h until plan_time" — which captures the typical late-cancel
  --   pattern (open last-minute, close before it fires). It's not a
  --   perfect proxy but it's the data we have without a closed_at.
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
  -- "Inbound match" = the OTHER user liked `uid` and `uid` liked back
  -- → a conversation row exists with `uid` on either side AND the
  -- conversation was created inside the 7-day window.
  --
  -- "Conversations started" = the user has at least one outbound
  -- message in the 7-day window. If recent_matches >= 5 AND
  -- recent_convos = 0 → silent collector.
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
   messages. Used by apply_ghost_decay() and exposed for debugging.';

-- -------------------------------------------------------------------
-- 4. Function — apply_ghost_decay()
-- -------------------------------------------------------------------
-- Daily cron entry-point. For every adult-enough user (account >=14d
-- old) compute the ghost score; if >=1 insert a ghost_penalties row
-- and deduct karma. Idempotent on (user_id, day): re-runs in the
-- same day are no-ops.
--
-- Returns a summary row count for logging/observability.

CREATE OR REPLACE FUNCTION public.apply_ghost_decay()
RETURNS TABLE (
  users_scanned   INTEGER,
  penalties_added INTEGER,
  karma_deducted  INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id   UUID;
  v_score     INTEGER;
  v_reason    TEXT;
  v_unans     INTEGER;
  v_late      INTEGER;
  v_silent_m  INTEGER;
  v_silent_c  INTEGER;
  v_inserted  BOOLEAN;
  v_users     INTEGER := 0;
  v_pen       INTEGER := 0;
  v_karma     INTEGER := 0;
  v_today     DATE    := CURRENT_DATE;
BEGIN
  -- Service-role only. Authenticated users cannot trigger a global
  -- karma sweep — defence-in-depth on top of the cron secret check.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'apply_ghost_decay: must be called as service role';
  END IF;

  FOR v_user_id IN
    SELECT u.id
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
     -- Grace period: skip accounts younger than 14 days. Many fresh
     -- profiles look ghost-y because they're still discovering the app.
     WHERE u.created_at <= now() - INTERVAL '14 days'
  LOOP
    v_users := v_users + 1;
    v_score := public.compute_ghost_score(v_user_id);

    IF v_score < 1 THEN
      CONTINUE;
    END IF;

    -- Determine the dominant reason. We re-run the per-signal queries
    -- inline here — slightly redundant with compute_ghost_score but
    -- saves us from changing the public function's return shape.
    SELECT COUNT(*) INTO v_unans
      FROM public.conversations c
     WHERE (c.user_a = v_user_id OR c.user_b = v_user_id)
       AND c.created_at >= now() - INTERVAL '14 days'
       AND NOT EXISTS (
         SELECT 1 FROM public.messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id = v_user_id
       );

    SELECT COUNT(*) INTO v_late
      FROM public.flash_plans fp
     WHERE fp.creator_id = v_user_id
       AND fp.status = 'closed'
       AND fp.when_at >= now() - INTERVAL '30 days'
       AND fp.when_at - fp.created_at < INTERVAL '2 hours';

    SELECT COUNT(*) INTO v_silent_m
      FROM public.conversations c
     WHERE (c.user_a = v_user_id OR c.user_b = v_user_id)
       AND c.created_at >= now() - INTERVAL '7 days';

    SELECT COUNT(DISTINCT m.conversation_id) INTO v_silent_c
      FROM public.messages m
     WHERE m.sender_id = v_user_id
       AND m.created_at >= now() - INTERVAL '7 days';

    -- Reason resolution: pick the strongest signal in priority order.
    IF v_unans >= 3 THEN
      v_reason := 'unanswered_matches';
    ELSIF v_late >= 2 THEN
      v_reason := 'late_cancel';
    ELSE
      v_reason := 'silent_collector';
    END IF;

    -- Idempotent insert. The UNIQUE (user_id, applied_day) on the
    -- table fires ON CONFLICT DO NOTHING — second invocation in the
    -- same UTC day is a silent no-op.
    INSERT INTO public.ghost_penalties (
      user_id, expires_at, reason, severity
    )
    VALUES (
      v_user_id,
      now() + INTERVAL '30 days',
      v_reason,
      v_score
    )
    ON CONFLICT (user_id, applied_day) DO NOTHING
    RETURNING TRUE INTO v_inserted;

    IF v_inserted IS TRUE THEN
      v_pen := v_pen + 1;

      -- Deduct karma exactly once per penalty. The reason string
      -- carries the human label — it shows up in the user's karma log
      -- if they ever look at it (we already render karma_transactions
      -- elsewhere).
      INSERT INTO public.karma_transactions (user_id, amount, reason)
      VALUES (
        v_user_id,
        -15 * v_score,
        'ghost_penalty:' || v_reason
      );

      v_karma := v_karma + (15 * v_score);
    END IF;
  END LOOP;

  -- Return summary. Caller (cron handler) logs it.
  users_scanned   := v_users;
  penalties_added := v_pen;
  karma_deducted  := v_karma;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.apply_ghost_decay() IS
  'Daily entry-point for the anti-ghost cron. Iterates every user older
   than 14 days, computes ghost score, inserts a ghost_penalties row +
   karma_transactions deduction (-15 × severity) when score >= 1.
   Idempotent on (user_id, day) via UNIQUE constraint — repeated
   invocations in the same UTC day are no-ops. Returns
   (users_scanned, penalties_added, karma_deducted) for logging.';

-- -------------------------------------------------------------------
-- 5. Grants
-- -------------------------------------------------------------------
-- compute_ghost_score is read-only — safe to expose to authenticated
-- users for "why is my visibility low" debug pages.
GRANT EXECUTE ON FUNCTION public.compute_ghost_score(UUID) TO authenticated;
-- apply_ghost_decay is service-role only. We grant to service_role
-- explicitly to make the contract obvious; PUBLIC stays denied.
REVOKE ALL ON FUNCTION public.apply_ghost_decay() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_ghost_decay() TO service_role;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- Migration 042 — QR Check-ins (Wave 17, builds on mig 032 first-date)
--
-- Extends the IRL-meet flow with a venue-side mutual scan:
--   • Each match's plan generates a unique QR per user (encoding
--     `cesoir://checkin/{planId}/{userId}`).
--   • At the venue, both users scan EACH OTHER'S QR. The "scanner" is
--     the user reading the camera; the "target" is the user whose QR
--     was scanned (and therefore the user the row is recorded FOR).
--   • When BOTH scanned-rows exist (i.e. each user has a row showing
--     they were scanned by the OTHER), we award karma +30 to each
--     side and grant the "verified-date" achievement.
--
-- Design notes:
--   • One row per (plan_id, user_id) where user_id is the SCANNED user
--     (the "target"). The PK enforces "this user can only be scanned
--     once for this plan" — anti-replay at DB level.
--   • scanned_by_user_id stores which peer did the scanning. RLS makes
--     sure the scanner is actually the OTHER plan participant.
--   • plan_id can reference either `plans.id` or `flash_plans.id`. We
--     intentionally do NOT add a hard FK because the column points to
--     two possible parent tables (the same dual-source pattern used by
--     irl_confirmations + /api/match/confirm-irl). The
--     process_qr_scan() RPC validates membership against both.
--   • RLS:
--       - SELECT: any plan participant can read rows for the plan.
--       - INSERT: only the scanner can insert, and only for the OTHER
--                 participant (prevents self-scan and impersonation).
--       - DELETE/UPDATE: not exposed (audit trail).
--   • The function `process_qr_scan` is SECURITY DEFINER so it can
--     write the karma + achievement rows for BOTH users without
--     leaking direct INSERT rights on those tables. It still validates
--     the caller's identity via the explicit p_scanner argument
--     matched against auth.uid().
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS qr_checkins (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id         UUID NOT NULL,
  -- The user whose QR was scanned (the "target" of the scan).
  user_id         UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The peer who actually performed the scan.
  scanned_by_user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Anti-replay: a given user can only be scanned ONCE per plan.
  CONSTRAINT qr_checkins_unique_per_plan UNIQUE (plan_id, user_id),
  -- Sanity: a user cannot scan themselves.
  CONSTRAINT qr_checkins_no_self_scan CHECK (scanned_by_user_id <> user_id)
);

-- Achievements (mig 002) didn't originally have a `meta` column. We add
-- one here (idempotent) so the verified-date badge can carry which plan
-- it was earned on — useful for analytics + showing "verified at venue
-- X" on the badge detail page.
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_qr_checkins_plan
  ON qr_checkins (plan_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_user
  ON qr_checkins (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_scanner
  ON qr_checkins (scanned_by_user_id);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE qr_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_participants_can_read" ON qr_checkins;
DROP POLICY IF EXISTS "qr_scanner_can_insert" ON qr_checkins;

-- READ: a participant of the plan (in either `plans` or `flash_plans`)
-- can see check-in rows for their plan. Lets the UI show "the other
-- person scanned me" on both sides.
CREATE POLICY "qr_participants_can_read"
  ON qr_checkins FOR SELECT
  TO authenticated
  USING (
    -- 1:1 plan
    EXISTS (
      SELECT 1 FROM plans p
       WHERE p.id = qr_checkins.plan_id
         AND (p.user_a = auth.uid() OR p.user_b = auth.uid())
    )
    -- group / flash plan
    OR EXISTS (
      SELECT 1 FROM flash_plan_participants fpp
       WHERE fpp.flash_plan_id = qr_checkins.plan_id
         AND fpp.user_id = auth.uid()
         AND fpp.status = 'accepted'
    )
  );

-- INSERT: the SCANNER row owner is auth.uid(); the TARGET (user_id)
-- must be a different participant of the same plan. Belt + braces:
-- the RPC re-validates the same constraints before delegating writes.
CREATE POLICY "qr_scanner_can_insert"
  ON qr_checkins FOR INSERT
  TO authenticated
  WITH CHECK (
    scanned_by_user_id = auth.uid()
    AND user_id <> auth.uid()
    AND (
      -- 1:1: both must belong to the same plans row
      EXISTS (
        SELECT 1 FROM plans p
         WHERE p.id = qr_checkins.plan_id
           AND ((p.user_a = auth.uid() AND p.user_b = qr_checkins.user_id)
             OR (p.user_b = auth.uid() AND p.user_a = qr_checkins.user_id))
      )
      -- group: both must be accepted on the same flash_plan
      OR (
        EXISTS (
          SELECT 1 FROM flash_plan_participants fpp
           WHERE fpp.flash_plan_id = qr_checkins.plan_id
             AND fpp.user_id = auth.uid()
             AND fpp.status = 'accepted'
        )
        AND EXISTS (
          SELECT 1 FROM flash_plan_participants fpp
           WHERE fpp.flash_plan_id = qr_checkins.plan_id
             AND fpp.user_id = qr_checkins.user_id
             AND fpp.status = 'accepted'
        )
      )
    )
  );

COMMENT ON TABLE qr_checkins IS
  'QR-based mutual check-ins at IRL date venues (Wave 17). One row per
   (plan_id, scanned-user). When BOTH users have a row (each scanned by
   the other), process_qr_scan() awards +30 karma each + verified-date
   badge. plan_id may reference plans.id OR flash_plans.id (validated
   in RLS + RPC, no hard FK).';

-- ═══════════════════════════════════════════════════════════════════
-- RPC: process_qr_scan
-- Called by /api/checkins/qr after the client successfully decoded a
-- peer's QR payload. Encapsulates:
--   1. Membership validation (both users belong to the plan).
--   2. Idempotent insert of the target's row (RLS-checked).
--   3. Mutual detection: if both users have rows, award karma + badge.
-- Returns a JSON result describing what happened.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION process_qr_scan(
  p_plan_id UUID,
  p_scanner UUID,
  p_target  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_is_pair      BOOLEAN := false;
  v_inserted     BOOLEAN := false;
  v_mutual       BOOLEAN := false;
  v_already_done BOOLEAN := false;
BEGIN
  -- 0) Identity binding: the scanner argument must match auth.uid().
  --    We accept p_scanner explicitly (instead of auto-using auth.uid()
  --    inside) so the API layer logs are obvious — and we re-check.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000';
  END IF;
  IF p_scanner <> v_caller THEN
    RAISE EXCEPTION 'scanner_mismatch' USING ERRCODE = '42501';
  END IF;
  IF p_scanner = p_target THEN
    RAISE EXCEPTION 'self_scan_forbidden' USING ERRCODE = '23514';
  END IF;

  -- 1) Membership: both users must be on the same plan (1:1 OR group).
  SELECT EXISTS (
    SELECT 1 FROM plans p
     WHERE p.id = p_plan_id
       AND ((p.user_a = p_scanner AND p.user_b = p_target)
         OR (p.user_b = p_scanner AND p.user_a = p_target))
  )
  OR (
    EXISTS (
      SELECT 1 FROM flash_plan_participants fpp
       WHERE fpp.flash_plan_id = p_plan_id
         AND fpp.user_id = p_scanner
         AND fpp.status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM flash_plan_participants fpp
       WHERE fpp.flash_plan_id = p_plan_id
         AND fpp.user_id = p_target
         AND fpp.status = 'accepted'
    )
  )
  INTO v_is_pair;

  IF NOT v_is_pair THEN
    RAISE EXCEPTION 'not_plan_participants' USING ERRCODE = '42501';
  END IF;

  -- 2) Insert target's row. ON CONFLICT DO NOTHING because a duplicate
  --    scan should be a no-op, not an error.
  INSERT INTO qr_checkins (plan_id, user_id, scanned_by_user_id, scanned_at)
  VALUES (p_plan_id, p_target, p_scanner, now())
  ON CONFLICT (plan_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  -- ROW_COUNT is set as integer count via GET DIAGNOSTICS; cast to bool.
  v_inserted := (v_inserted::int > 0);

  -- 3) Mutual detection: do BOTH users now have a scanned row?
  --    (i.e. target was scanned by scanner AND scanner was scanned by target)
  SELECT
    EXISTS (
      SELECT 1 FROM qr_checkins
       WHERE plan_id = p_plan_id
         AND user_id = p_target
         AND scanned_by_user_id = p_scanner
    )
    AND EXISTS (
      SELECT 1 FROM qr_checkins
       WHERE plan_id = p_plan_id
         AND user_id = p_scanner
         AND scanned_by_user_id = p_target
    )
  INTO v_mutual;

  -- 4) If mutual, award karma + badge — idempotent on the achievement.
  IF v_mutual THEN
    -- Has anyone already gotten the verified-date badge for this plan?
    -- We don't track per-plan, only per-user, so check the user.
    SELECT EXISTS (
      SELECT 1 FROM achievements
       WHERE user_id IN (p_scanner, p_target)
         AND achievement_key = 'verified-date'
         AND meta->>'plan_id' = p_plan_id::text
    ) INTO v_already_done;

    IF NOT v_already_done THEN
      -- Karma: +30 each
      INSERT INTO karma_transactions (user_id, amount, reason)
      VALUES
        (p_scanner, 30, 'QR check-in mutual (verified date)'),
        (p_target,  30, 'QR check-in mutual (verified date)');

      -- Achievements: idempotent via UNIQUE on (user_id, achievement_key).
      -- We tag the meta with plan_id so future analytics can dedupe per
      -- plan if needed; the unique constraint still de-dups per user.
      INSERT INTO achievements (user_id, achievement_key, meta)
      VALUES
        (p_scanner, 'verified-date', jsonb_build_object('plan_id', p_plan_id::text)),
        (p_target,  'verified-date', jsonb_build_object('plan_id', p_plan_id::text))
      ON CONFLICT (user_id, achievement_key) DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'mutual',   v_mutual,
    'awarded',  v_mutual AND NOT v_already_done,
    'plan_id',  p_plan_id
  );
END;
$$;

-- Allow authenticated callers to invoke the RPC. Auth checks happen
-- inside the function; the GRANT is just SQL-level reachability.
REVOKE ALL ON FUNCTION process_qr_scan(UUID, UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION process_qr_scan(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION process_qr_scan(UUID, UUID, UUID) IS
  'Process a QR check-in scan. Validates plan membership, inserts the
   target''s scanned row, and (if both peers have scanned each other)
   awards karma + the verified-date badge. Returns
   { inserted, mutual, awarded, plan_id } as JSONB.';

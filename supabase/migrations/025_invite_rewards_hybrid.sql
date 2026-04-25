-- ========================================================================
-- Migration 025: hybrid invite rewards (Tinder/Bumble-style referral loop)
-- ========================================================================
-- 2026-04-25 — strategy pivot from invite-only (Wave 15 plan, never DB-
-- enforced anyway since mig 021 was on disk but never applied to prod)
-- to OPEN signup + REWARDS-ON-CODE-USE.
--
-- /signup-quick is now open — anyone can sign up without a code. But
-- when a user DOES sign up with an invite code (?invite=XXX or pasted
-- on step 1), the claim now triggers a 3-part reward:
--
--   1. New user gets +5 roses (always, via user_wallet upsert)
--   2. Inviter gets +5 roses (skipped if the code is system-seeded —
--      i.e. created_by IS NULL — and skipped on self-invite)
--   3. New user gets the 'founder' achievement badge
--
-- Plus the new user is auto-minted 3 codes of their own — kicks off
-- their referral loop in the same atomic transaction.
--
-- The bare claim_invite_code from mig 021 is REPLACED entirely (the
-- return shape changes, so we DROP first).
--
-- # Why the hybrid model (and not invite-only forever)
--
-- Tinder USC 2012, Bumble Austin 2014, Hinge 2013 — all started invite-
-- gated then opened once they had local critical mass. CeSoir is free
-- and mass-market: density beats exclusivity. The reward keeps the
-- viral loop, the open door keeps growth.
-- ========================================================================

DROP FUNCTION IF EXISTS public.claim_invite_code(TEXT);

CREATE OR REPLACE FUNCTION public.claim_invite_code(p_code TEXT)
RETURNS TABLE (
  code            TEXT,
  claimed_by      UUID,
  claimed_at      TIMESTAMPTZ,
  inviter_id      UUID,
  roses_granted   INT,
  badge_granted   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_caller         UUID := auth.uid();
  v_code_row       public.invite_codes%ROWTYPE;
  v_inviter        UUID;
  v_roses_amount   INT := 5;
  v_now            TIMESTAMPTZ := now();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'Code required' USING ERRCODE = '22023';
  END IF;

  -- Lock-and-validate atomically
  SELECT * INTO v_code_row
    FROM public.invite_codes
   WHERE upper(code) = upper(trim(p_code))
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid code' USING ERRCODE = 'P0001'; END IF;
  IF v_code_row.used_by IS NOT NULL THEN RAISE EXCEPTION 'Code already claimed' USING ERRCODE = 'P0002'; END IF;
  IF v_code_row.expires_at < v_now THEN RAISE EXCEPTION 'Code expired' USING ERRCODE = 'P0003'; END IF;

  UPDATE public.invite_codes
     SET used_by = v_caller,
         used_at = v_now
   WHERE code = v_code_row.code;

  v_inviter := v_code_row.created_by;

  -- Reward 1: +5 roses to the new user (always)
  INSERT INTO public.user_wallet (user_id, roses_balance, updated_at)
  VALUES (v_caller, v_roses_amount, v_now)
  ON CONFLICT (user_id) DO UPDATE
    SET roses_balance = public.user_wallet.roses_balance + EXCLUDED.roses_balance,
        updated_at    = v_now;

  -- Reward 2: +5 roses to the inviter (only if user-minted, never self-invite)
  IF v_inviter IS NOT NULL AND v_inviter <> v_caller THEN
    INSERT INTO public.user_wallet (user_id, roses_balance, updated_at)
    VALUES (v_inviter, v_roses_amount, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET roses_balance = public.user_wallet.roses_balance + EXCLUDED.roses_balance,
          updated_at    = v_now;
  END IF;

  -- Reward 3: 'founder' badge (idempotent — re-running this RPC for the
  -- same user is a no-op on the achievement).
  INSERT INTO public.achievements (user_id, achievement_key, earned_at)
  VALUES (v_caller, 'founder', v_now)
  ON CONFLICT DO NOTHING;

  -- Auto-mint 3 codes for the new user — kicks off their referral loop
  -- inside the same transaction.
  PERFORM public.mint_user_invite_codes(3);

  RETURN QUERY
    SELECT v_code_row.code,
           v_caller,
           v_now,
           v_inviter,
           v_roses_amount,
           'founder'::TEXT;
END;
$func$;

COMMENT ON FUNCTION public.claim_invite_code(TEXT) IS
  'Hybrid invite (mig 025): atomic claim + 5 roses to new user + 5 roses to inviter (if not system code) + founder badge + auto-mint 3 codes.';

GRANT EXECUTE ON FUNCTION public.claim_invite_code(TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Migration 046 — Mode-specific Mastery Tiers (Wave 17)
--
-- Each of the 4 modes (solo-diner, plus-one, night-owl, foodie-quest)
-- has 3 mastery tiers awarded based on count of VERIFIED IRL meets in
-- that mode:
--
--   Apprenti  →  3  successful dates  (xp 100, common)
--   Initié    →  10 successful dates  (xp 250, rare)
--   Maître    →  25 successful dates  (xp 500, epic)
--
-- "Verified IRL meet" = a row in `irl_confirmations` with
-- `mutual_at IS NOT NULL` (both participants confirmed) AND the parent
-- `conversations.mode` matches the queried mode.
--
-- Awards are achievement rows inserted into `achievements` with
-- achievement_key formatted as `{mode}-{tier}`, e.g. `solo-diner-initie`.
-- The badge ids in src/lib/badges.ts MUST match these keys exactly so
-- useBadges can resolve earned status.
--
-- Idempotency:
--   - achievements has UNIQUE(user_id, achievement_key) — re-running the
--     trigger never duplicates rows. We use ON CONFLICT DO NOTHING.
--   - The trigger fires on every INSERT into irl_confirmations but the
--     award function only stamps tiers the user has actually crossed,
--     and never downgrades.
--
-- Trigger semantics:
--   AFTER INSERT on irl_confirmations → call award_mode_mastery(user_id)
--   for the inserting user. The award function counts only mutual rows,
--   so the FIRST insert (peer not yet confirmed → mutual_at NULL) does
--   nothing. The SECOND insert (which is what flips mutual_at via the
--   API route's update) re-runs the trigger; by then the count includes
--   the now-mutual row.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. RPC: compute_mastery_tier(uid, mode)
-- -------------------------------------------------------------------
-- Returns 'maitre' / 'initie' / 'apprenti' / NULL based on the number
-- of MUTUAL irl_confirmations for the given user in the given mode.
-- Highest reached tier wins; NULL when below the apprenti threshold.

CREATE OR REPLACE FUNCTION public.compute_mastery_tier(
  uid UUID,
  mode_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF uid IS NULL OR mode_key IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count VERIFIED IRL meets in this mode for this user.
  -- A row counts iff mutual_at IS NOT NULL (both sides confirmed) AND
  -- the parent conversation has the requested mode.
  SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.irl_confirmations ic
    JOIN public.conversations c ON c.id = ic.conversation_id
   WHERE ic.user_id = uid
     AND ic.mutual_at IS NOT NULL
     AND c.mode = mode_key;

  IF v_count >= 25 THEN
    RETURN 'maitre';
  ELSIF v_count >= 10 THEN
    RETURN 'initie';
  ELSIF v_count >= 3 THEN
    RETURN 'apprenti';
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.compute_mastery_tier(UUID, TEXT) IS
  'Wave 17 mastery: returns maitre / initie / apprenti / NULL based on
   count of mutual IRL meets for the user in the given mode. NULL when
   the user has fewer than 3 verified meets in that mode.';

GRANT EXECUTE ON FUNCTION public.compute_mastery_tier(UUID, TEXT)
  TO authenticated, service_role;

-- -------------------------------------------------------------------
-- 2. Helper: count_mastery_meets(uid, mode)
-- -------------------------------------------------------------------
-- Returns the raw count of mutual IRL meets in a mode — used by the
-- client hook to render "7/10" progress labels without a second RPC.

CREATE OR REPLACE FUNCTION public.count_mastery_meets(
  uid UUID,
  mode_key TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF uid IS NULL OR mode_key IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.irl_confirmations ic
    JOIN public.conversations c ON c.id = ic.conversation_id
   WHERE ic.user_id = uid
     AND ic.mutual_at IS NOT NULL
     AND c.mode = mode_key;

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.count_mastery_meets(UUID, TEXT) IS
  'Raw count of mutual IRL meets in a mode — feeds the progress bar
   (e.g. "7/10") on the MasteryStrip. Same join/filter as
   compute_mastery_tier but returns the integer rather than the tier.';

GRANT EXECUTE ON FUNCTION public.count_mastery_meets(UUID, TEXT)
  TO authenticated, service_role;

-- -------------------------------------------------------------------
-- 3. award_mode_mastery(target_user)
-- -------------------------------------------------------------------
-- For each of the 4 active modes, computes the tier and inserts the
-- corresponding achievement rows (apprenti, then initie if reached,
-- then maitre if reached). Idempotent: ON CONFLICT DO NOTHING on the
-- (user_id, achievement_key) UNIQUE.
--
-- Achievement keys use the format `{mode}-{tier}` matching the badge
-- ids in src/lib/badges.ts:
--   solo-diner-apprenti / solo-diner-initie / solo-diner-maitre
--   plus-one-apprenti   / plus-one-initie   / plus-one-maitre
--   night-owl-apprenti  / night-owl-initie  / night-owl-maitre
--   foodie-quest-apprenti / foodie-quest-initie / foodie-quest-maitre
--
-- We award the LOWER tiers too even when the user jumps straight to a
-- higher one (e.g. seed data with 25 mutual meets) so the progression
-- history stays complete.

CREATE OR REPLACE FUNCTION public.award_mode_mastery(
  target_user UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_modes TEXT[] := ARRAY['solo-diner', 'plus-one', 'night-owl', 'foodie-quest'];
  v_mode  TEXT;
  v_tier  TEXT;
BEGIN
  IF target_user IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_mode IN ARRAY v_modes
  LOOP
    v_tier := public.compute_mastery_tier(target_user, v_mode);

    -- Below apprenti threshold → nothing to award for this mode.
    IF v_tier IS NULL THEN
      CONTINUE;
    END IF;

    -- Always award apprenti when the user is at any tier.
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (target_user, v_mode || '-apprenti')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;

    -- Award initie + maitre if the user has crossed the higher
    -- thresholds.
    IF v_tier IN ('initie', 'maitre') THEN
      INSERT INTO public.achievements (user_id, achievement_key)
      VALUES (target_user, v_mode || '-initie')
      ON CONFLICT (user_id, achievement_key) DO NOTHING;
    END IF;

    IF v_tier = 'maitre' THEN
      INSERT INTO public.achievements (user_id, achievement_key)
      VALUES (target_user, v_mode || '-maitre')
      ON CONFLICT (user_id, achievement_key) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.award_mode_mastery(UUID) IS
  'Wave 17: scans all 4 modes for the user and inserts the
   corresponding mastery achievement rows. Idempotent thanks to the
   UNIQUE(user_id, achievement_key) constraint on achievements.';

REVOKE EXECUTE ON FUNCTION public.award_mode_mastery(UUID)
  FROM anon, public;
GRANT EXECUTE ON FUNCTION public.award_mode_mastery(UUID)
  TO authenticated, service_role;

-- -------------------------------------------------------------------
-- 4. Trigger: AFTER INSERT on irl_confirmations
-- -------------------------------------------------------------------
-- Fire award_mode_mastery for the inserting user. The function only
-- counts mutual_at-stamped rows so the first insert (peer not yet
-- confirmed) is a no-op for this user; the second insert (or the
-- corresponding mutual_at UPDATE done by the API route) is what
-- crosses the count threshold and triggers the achievement.
--
-- For belt-and-braces we also award the PEER on each insert: when the
-- second person confirms, the API route updates mutual_at on BOTH
-- rows, but the trigger only fires on INSERT here. The peer side has
-- their own row with mutual_at flipped — re-running award for them is
-- safe (idempotent) and ensures both users get their tier on time.

CREATE OR REPLACE FUNCTION public.trg_award_mode_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_peer UUID;
BEGIN
  -- Award the inserting user.
  PERFORM public.award_mode_mastery(NEW.user_id);

  -- Also award the peer (other participant of the conversation).
  -- mutual_at flips on the SECOND insert so we recompute for both
  -- sides whenever a row lands.
  SELECT CASE
           WHEN c.user_a = NEW.user_id THEN c.user_b
           ELSE c.user_a
         END
    INTO v_peer
    FROM public.conversations c
   WHERE c.id = NEW.conversation_id;

  IF v_peer IS NOT NULL THEN
    PERFORM public.award_mode_mastery(v_peer);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_mode_mastery_after_insert
  ON public.irl_confirmations;

CREATE TRIGGER award_mode_mastery_after_insert
  AFTER INSERT ON public.irl_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_award_mode_mastery();

COMMENT ON TRIGGER award_mode_mastery_after_insert
  ON public.irl_confirmations IS
  'Wave 17: recompute mastery tiers for both participants after every
   IRL confirmation insert. Idempotent: only inserts achievement rows
   for tiers actually reached (count of mutual_at-stamped rows joined
   to conversations.mode).';

-- -------------------------------------------------------------------
-- 5. Trigger: AFTER UPDATE OF mutual_at on irl_confirmations
-- -------------------------------------------------------------------
-- The API route /api/match/confirm-irl uses the service role to UPDATE
-- mutual_at on the EARLIER row (the first user's confirmation) when
-- the second user lands. That update doesn't fire the INSERT trigger,
-- so we add a parallel UPDATE trigger to recompute the first user's
-- tier as soon as their row is stamped mutual.

CREATE OR REPLACE FUNCTION public.trg_award_mode_mastery_on_mutual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_peer UUID;
BEGIN
  -- Only react when mutual_at transitions from NULL to a timestamp.
  IF OLD.mutual_at IS NOT NULL OR NEW.mutual_at IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_mode_mastery(NEW.user_id);

  SELECT CASE
           WHEN c.user_a = NEW.user_id THEN c.user_b
           ELSE c.user_a
         END
    INTO v_peer
    FROM public.conversations c
   WHERE c.id = NEW.conversation_id;

  IF v_peer IS NOT NULL THEN
    PERFORM public.award_mode_mastery(v_peer);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_mode_mastery_on_mutual_stamp
  ON public.irl_confirmations;

CREATE TRIGGER award_mode_mastery_on_mutual_stamp
  AFTER UPDATE OF mutual_at ON public.irl_confirmations
  FOR EACH ROW
  WHEN (OLD.mutual_at IS DISTINCT FROM NEW.mutual_at)
  EXECUTE FUNCTION public.trg_award_mode_mastery_on_mutual();

COMMENT ON TRIGGER award_mode_mastery_on_mutual_stamp
  ON public.irl_confirmations IS
  'Wave 17 companion to award_mode_mastery_after_insert. Fires when
   the API route stamps mutual_at on the EARLIER row (which would
   otherwise be missed since AFTER INSERT does not fire on UPDATE).';

COMMIT;

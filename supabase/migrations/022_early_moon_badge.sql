-- ========================================================================
-- Migration 022: "Early Moon" badge (first 10 Montpellier users)
-- ========================================================================
-- Wave 15 · CRO 10/10 — Strategy memo 2026-04-23:
--   Give the first 10 onboarded users an "Early Moon" achievement so they
--   feel like founders. Goes on the profile cards as a little ☾ halo.
--
-- Note: we re-use the existing `achievements` table (migration 002). No
-- schema change needed — just a trigger that auto-grants the key
-- `early_moon` to the first 10 rows inserted into `profiles`.
-- ========================================================================

-- Defensive: the achievement row shape differs slightly across branches.
-- `achievement_key` is TEXT so we store the literal 'early_moon'. If the
-- table doesn't exist yet (old branch), the migration bails politely.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'achievements'
  ) THEN
    RAISE NOTICE 'achievements table missing — skipping 022 early_moon trigger';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'profiles table missing — skipping 022 early_moon trigger';
    RETURN;
  END IF;

  -- Function + trigger definition (runs in the DO block so we can bail
  -- early if the prereqs don't exist, without the file itself failing).
  EXECUTE $FN$
    CREATE OR REPLACE FUNCTION public.grant_early_moon_badge()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $BODY$
    DECLARE
      v_count INT;
    BEGIN
      -- Only consider Montpellier profiles
      IF NEW.city IS NULL OR lower(NEW.city) <> 'montpellier' THEN
        RETURN NEW;
      END IF;

      SELECT count(*) INTO v_count
        FROM public.achievements
       WHERE achievement_key = 'early_moon';

      IF v_count >= 10 THEN
        RETURN NEW;
      END IF;

      INSERT INTO public.achievements (user_id, achievement_key)
        VALUES (NEW.id, 'early_moon')
      ON CONFLICT DO NOTHING;

      RETURN NEW;
    END;
    $BODY$;
  $FN$;

  EXECUTE $TR$
    DROP TRIGGER IF EXISTS trg_profiles_early_moon ON public.profiles;
  $TR$;

  EXECUTE $TR$
    CREATE TRIGGER trg_profiles_early_moon
      AFTER INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.grant_early_moon_badge();
  $TR$;
END;
$$;

COMMENT ON FUNCTION public.grant_early_moon_badge() IS 'Auto-grants early_moon achievement to the first 10 Montpellier profiles.';

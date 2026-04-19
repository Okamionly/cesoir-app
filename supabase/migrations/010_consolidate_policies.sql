-- ============================================================================
-- Migration 010: Consolidate duplicate permissive RLS policies
-- ============================================================================
-- Resolves 60 `multiple_permissive_policies` performance lints (12 tables x
-- 5 roles each). Every affected table had two PERMISSIVE policies covering
-- the same (role, SELECT) pair, forcing PostgREST to evaluate both on every
-- SELECT. By separating concerns into SELECT vs write-only policies -- or
-- dropping strict subsets -- each query now evaluates exactly ONE policy per
-- action, which is the performance-optimal configuration.
--
-- Security preserved: every consolidation either keeps the broader permission
-- (already public data) or the strictly more permissive predicate (squads:
-- members + creator vs creator-only). Write permissions remain owner-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CATEGORY A: Public-SELECT tables (split ALL into write-only policies).
-- The "X is public" SELECT policy (USING true) supersedes the SELECT leg of
-- the "Users manage own X" ALL policy. We drop the ALL policy and recreate
-- it as three separate INSERT / UPDATE / DELETE policies so owner-only writes
-- continue to be enforced, while SELECT is served by the single public policy.
-- ----------------------------------------------------------------------------

-- achievements (public read + owner write)
DROP POLICY IF EXISTS "Users manage own achievements" ON public.achievements;
CREATE POLICY "Users insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own achievements" ON public.achievements
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users delete own achievements" ON public.achievements
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- availability
DROP POLICY IF EXISTS "Users manage own availability" ON public.availability;
CREATE POLICY "Users insert own availability" ON public.availability
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own availability" ON public.availability
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users delete own availability" ON public.availability
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- feed_activities
DROP POLICY IF EXISTS "Users manage own feed activities" ON public.feed_activities;
CREATE POLICY "Users insert own feed activities" ON public.feed_activities
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own feed activities" ON public.feed_activities
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users delete own feed activities" ON public.feed_activities
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- squad_invites (anyone reads by code + inviter writes)
DROP POLICY IF EXISTS "Inviters manage their invites" ON public.squad_invites;
CREATE POLICY "Inviters insert their invites" ON public.squad_invites
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = inviter_id);
CREATE POLICY "Inviters update their invites" ON public.squad_invites
  FOR UPDATE USING ((SELECT auth.uid()) = inviter_id)
  WITH CHECK ((SELECT auth.uid()) = inviter_id);
CREATE POLICY "Inviters delete their invites" ON public.squad_invites
  FOR DELETE USING ((SELECT auth.uid()) = inviter_id);

-- streaks
DROP POLICY IF EXISTS "Users manage own streak" ON public.streaks;
CREATE POLICY "Users insert own streak" ON public.streaks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own streak" ON public.streaks
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users delete own streak" ON public.streaks
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- tonight_preferences
DROP POLICY IF EXISTS "Users manage own tonight" ON public.tonight_preferences;
CREATE POLICY "Users insert own tonight" ON public.tonight_preferences
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own tonight" ON public.tonight_preferences
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users delete own tonight" ON public.tonight_preferences
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- CATEGORY B: Redundant own-SELECT policies (drop duplicate SELECT-only).
-- The "Users see own X" SELECT policy has the SAME predicate as the SELECT
-- leg of the "Users manage own X" ALL policy. The SELECT-only copy is pure
-- duplication -- dropping it leaves identical behaviour.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users see own challenges"      ON public.challenges;
DROP POLICY IF EXISTS "Users see own checkins"        ON public.checkins;
DROP POLICY IF EXISTS "Users see own karma"           ON public.karma_transactions;
DROP POLICY IF EXISTS "Users see own contacts"        ON public.trusted_contacts;
DROP POLICY IF EXISTS "Users see own settings"        ON public.user_settings;

-- ----------------------------------------------------------------------------
-- CATEGORY C: squads -- SELECT policy is a SUPERSET of the ALL policy's
-- SELECT leg (members OR creator > creator only). To keep the broader read
-- permission and still enforce creator-only writes, drop the ALL policy and
-- recreate it as INSERT / UPDATE / DELETE policies for the creator.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Squad creators can manage their squads" ON public.squads;
CREATE POLICY "Squad creators insert squads" ON public.squads
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = creator_id);
CREATE POLICY "Squad creators update squads" ON public.squads
  FOR UPDATE USING ((SELECT auth.uid()) = creator_id)
  WITH CHECK ((SELECT auth.uid()) = creator_id);
CREATE POLICY "Squad creators delete squads" ON public.squads
  FOR DELETE USING ((SELECT auth.uid()) = creator_id);

-- ============================================================================
-- H4 attempt: enable RLS on public.spatial_ref_sys (PostGIS system table).
-- Supabase advisors flag this, but the table is owned by postgres role and
-- ALTER TABLE from an application role typically fails with permission denied.
-- We attempt the change inside a DO block so the migration does not fail if
-- ownership blocks the ALTER; the status will be visible in the advisor rerun.
-- ============================================================================
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read spatial_ref_sys" ON public.spatial_ref_sys';
    EXECUTE 'CREATE POLICY "Anyone can read spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT TO public USING (true)';
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    RAISE NOTICE 'spatial_ref_sys RLS skipped (ownership/permission): %', SQLERRM;
  END;
END $$;

-- =======================================================
-- 012 — Feed reactions (interactive "like" bar on each feed item)
-- Enables users to react with emoji (heart/fire/laugh/celebrate) to
-- feed_activities entries. One (activity, user, reaction) is unique —
-- re-clicking the same emoji is a DELETE (toggle) handled client-side.
-- =======================================================

CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_activity_id uuid NOT NULL REFERENCES public.feed_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('heart','fire','laugh','celebrate')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (feed_activity_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_activity ON public.feed_reactions(feed_activity_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON public.feed_reactions(user_id);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users react" ON public.feed_reactions;
CREATE POLICY "Users react"
  ON public.feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Reactions viewable" ON public.feed_reactions;
CREATE POLICY "Reactions viewable"
  ON public.feed_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users delete own reactions" ON public.feed_reactions;
CREATE POLICY "Users delete own reactions"
  ON public.feed_reactions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

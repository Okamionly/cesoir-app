-- ═══════════════════════════════════════════════════════════════════
-- Migration 043 — Plan suggestions from mutual event RSVPs (Wave 17)
--
-- Concept
-- ───────
-- When user A RSVPs an event and any of A's mutual matches has ALSO
-- RSVP'd that same event, surface a "make a plan together" prompt
-- in-app. The trigger writes a row to `plan_suggestions` with both
-- user_ids + the event_id; a hook on the client picks it up via
-- realtime and shows a card in the feed.
--
-- Schema decisions
-- ────────────────
-- * One row per (event_id, user_a, user_b) where user_a < user_b is
--   ALWAYS the lower uuid of the pair. This dedupes across both
--   directions of the mutual match (A invites B == B invites A).
-- * `accepted_plan_id` references `flash_plans(id)` — set when one
--   of the two users hits "Créer le plan" and the API spawns the
--   shared plan. NULL while pending.
-- * `dismissed_at` is set client-side when either user taps "Pas
--   cette fois". A row with dismissed_at set is hidden from the
--   feed for both sides forever (one-shot dismiss is intentional —
--   we don't want to spam the prompt twice).
-- * Cooldown: a 24h window per (user_a, user_b, event_id) — the
--   trigger checks for existing suggestions in the last 24h before
--   inserting. Prevents spam if both sides toggle their RSVP
--   status (going → cancelled → going).
-- * Auto-expiry: a row is considered "expired" 48h after the event
--   has STARTED. The hook filters them out client-side (cheaper
--   than a sweep job; the row stays in DB for analytics).
-- * Suggestion is NOT created if a flash_plans row already exists
--   between the two users that mentions the event_id (event_id
--   stored in flash_plans.tags as `event:<uuid>` so we don't need
--   a new column on flash_plans yet).
--
-- RLS
-- ───
-- Reads: only the two participants. Writes: trigger only (service
-- definer) — no client surface. Updates (dismiss / accept) go
-- through narrow client policies that pin the column being edited.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_suggestions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_a            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at      TIMESTAMPTZ,
  dismissed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_plan_id  UUID REFERENCES public.flash_plans(id) ON DELETE SET NULL,

  -- Pair must be ordered: enforce user_a < user_b at write time so
  -- (event_id, user_a, user_b) UNIQUE actually dedupes by *pair* not
  -- by direction. Same invariant as crystal_ball_matches.
  CONSTRAINT plan_suggestions_ordered_pair CHECK (user_a < user_b),

  -- One pending suggestion per (event, pair). The trigger relies on
  -- ON CONFLICT DO NOTHING here as the cooldown gate: if a row
  -- already exists and is < 24h old, the trigger noop's. After 24h
  -- the trigger DELETEs the stale row before inserting a fresh one.
  UNIQUE (event_id, user_a, user_b)
);

CREATE INDEX IF NOT EXISTS idx_plan_suggestions_user_a
  ON public.plan_suggestions (user_a, suggested_at DESC)
  WHERE dismissed_at IS NULL AND accepted_plan_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_plan_suggestions_user_b
  ON public.plan_suggestions (user_b, suggested_at DESC)
  WHERE dismissed_at IS NULL AND accepted_plan_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_plan_suggestions_event
  ON public.plan_suggestions (event_id);

COMMENT ON TABLE public.plan_suggestions IS
  'Wave 17. Auto-generated "create a plan together" prompts when two
   matched users RSVP the same event. user_a is always the lower uuid.
   Dedupe by (event_id, user_a, user_b). Cooldown 24h. Hidden from the
   feed once dismissed_at or accepted_plan_id are set. Auto-considered
   expired 48h after the event start (filtered client-side).';

-- -------------------------------------------------------------------
-- 2. RLS
-- -------------------------------------------------------------------

ALTER TABLE public.plan_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_suggestions_participants_can_read"
  ON public.plan_suggestions;
DROP POLICY IF EXISTS "plan_suggestions_participants_can_dismiss"
  ON public.plan_suggestions;
DROP POLICY IF EXISTS "plan_suggestions_participants_can_accept"
  ON public.plan_suggestions;

-- READ: only the two participants can see their suggestion. No one
-- else needs to enumerate "who's planning to go where with whom".
CREATE POLICY "plan_suggestions_participants_can_read"
  ON public.plan_suggestions FOR SELECT
  TO authenticated
  USING (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  );

-- UPDATE (dismiss): either side can set dismissed_at + dismissed_by.
-- Immutability of pair / event_id / suggested_at is enforced by a
-- BEFORE UPDATE guard trigger below. accepted_plan_id is also flipped
-- through this same policy (the API route runs as the user, not as
-- service role) — the guard ensures only those two columns can move.
CREATE POLICY "plan_suggestions_participants_can_update"
  ON public.plan_suggestions FOR UPDATE
  TO authenticated
  USING (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  )
  WITH CHECK (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  );

-- INSERT is intentionally NOT exposed to clients. The trigger runs as
-- SECURITY DEFINER and bypasses RLS. If a future need arises to seed
-- suggestions from authenticated context, add a narrow policy then.

-- -------------------------------------------------------------------
-- 3. Guard trigger — protect immutable columns on UPDATE
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.plan_suggestions_guard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  -- Service role / cron / migration → let it through.
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  -- Immutables: pair, event_id, suggested_at, id. These are append-
  -- only / set-once and reflect the original auto-suggestion.
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'plan_suggestions: id is immutable';
  END IF;
  IF NEW.event_id <> OLD.event_id THEN
    RAISE EXCEPTION 'plan_suggestions: event_id is immutable';
  END IF;
  IF NEW.user_a <> OLD.user_a THEN
    RAISE EXCEPTION 'plan_suggestions: user_a is immutable';
  END IF;
  IF NEW.user_b <> OLD.user_b THEN
    RAISE EXCEPTION 'plan_suggestions: user_b is immutable';
  END IF;
  IF NEW.suggested_at <> OLD.suggested_at THEN
    RAISE EXCEPTION 'plan_suggestions: suggested_at is immutable';
  END IF;

  -- Caller must be a participant.
  IF caller <> OLD.user_a AND caller <> OLD.user_b THEN
    RAISE EXCEPTION 'plan_suggestions: caller is not a participant';
  END IF;

  -- If dismissed_by is set on this update, force it to be the caller.
  IF NEW.dismissed_by IS NOT NULL AND NEW.dismissed_by <> caller THEN
    RAISE EXCEPTION 'plan_suggestions: dismissed_by must be caller';
  END IF;

  -- Auto-stamp dismissed_at the moment dismissed_by transitions from
  -- NULL → caller, in case the client only set the latter.
  IF OLD.dismissed_at IS NULL
     AND NEW.dismissed_by IS NOT NULL
     AND NEW.dismissed_at IS NULL
  THEN
    NEW.dismissed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plan_suggestions_guard_update_trg
  ON public.plan_suggestions;
CREATE TRIGGER plan_suggestions_guard_update_trg
  BEFORE UPDATE ON public.plan_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.plan_suggestions_guard_update();

COMMENT ON FUNCTION public.plan_suggestions_guard_update() IS
  'BEFORE UPDATE guard for plan_suggestions: pin immutable columns,
   ensure caller is a participant, force dismissed_by to be the caller,
   auto-stamp dismissed_at when dismissed_by lands.';

-- -------------------------------------------------------------------
-- 4. Match check helper — is (a, b) a mutual match?
-- -------------------------------------------------------------------
-- Using the existing `matches` VIEW (defined in supabase-schema.sql,
-- mutual interactions where a→b and b→a are both like/superlike).
-- The view enforces user_a < user_b ordering already, so we just
-- query it with the ordered pair we already have.

CREATE OR REPLACE FUNCTION public.are_matched(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.user_a = LEAST(p_user_a, p_user_b)
      AND m.user_b = GREATEST(p_user_a, p_user_b)
  );
$$;

COMMENT ON FUNCTION public.are_matched(UUID, UUID) IS
  'TRUE iff there is a mutual like between the two users (matches view).';

-- -------------------------------------------------------------------
-- 5. Existing flash plan check — has the pair already made a plan
--    around this event?
-- -------------------------------------------------------------------
-- A flash_plan is "around the event" when its tags array contains
-- the marker `event:<uuid>`. We don't add a column to flash_plans
-- to keep migrations tiny — the tag is the link. The API route that
-- accepts a suggestion writes this tag at creation time.

CREATE OR REPLACE FUNCTION public.has_pair_event_plan(
  p_user_a   UUID,
  p_user_b   UUID,
  p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flash_plans fp
    JOIN public.flash_plan_participants fpa
      ON fpa.flash_plan_id = fp.id AND fpa.user_id = p_user_a
    JOIN public.flash_plan_participants fpb
      ON fpb.flash_plan_id = fp.id AND fpb.user_id = p_user_b
    WHERE ('event:' || p_event_id::text) = ANY (fp.tags)
      AND fp.status IN ('open', 'closed')
  );
$$;

COMMENT ON FUNCTION public.has_pair_event_plan(UUID, UUID, UUID) IS
  'TRUE iff the pair already shares a flash_plan tagged event:<uuid>.';

-- -------------------------------------------------------------------
-- 6. The actual trigger — on event_rsvps INSERT or status update
-- -------------------------------------------------------------------
-- We fire on INSERT *and* on UPDATE OF status when the new status
-- transitions to an "attending" state ('interested', 'going',
-- 'maybe'). 'cancelled' rows do NOT trigger the suggestion.
--
-- Algorithm
-- ─────────
-- 1. Reject non-attending statuses early (cancelled).
-- 2. Find every other user who has an attending RSVP to the same event.
-- 3. For each candidate, check if (NEW.user_id, candidate) are mutual
--    matches.
-- 4. For each match, build the ordered pair, check that no flash_plan
--    already exists for that pair + event, then INSERT a suggestion
--    (with cooldown via stale-row sweep + ON CONFLICT DO NOTHING).
--
-- Cost
-- ────
-- O(N) where N is the number of attending RSVPs for the event. For
-- popular events this can be a few hundred; the inner `are_matched`
-- check uses the existing matches view's index. Acceptable for a
-- per-RSVP trigger.

CREATE OR REPLACE FUNCTION public.on_event_rsvp_suggest_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_other       UUID;
  v_low         UUID;
  v_high        UUID;
  v_attending   public.rsvp_status[] := ARRAY[
    'interested'::public.rsvp_status,
    'going'::public.rsvp_status,
    'maybe'::public.rsvp_status
  ];
BEGIN
  -- Skip cancelled / null statuses.
  IF NEW.status IS NULL OR NOT (NEW.status = ANY (v_attending)) THEN
    RETURN NEW;
  END IF;

  -- On UPDATE: only re-fire if the status moved INTO an attending
  -- state. Same status as before → noop (avoids loop with the
  -- updated_at trigger). Status was already attending → also noop
  -- (we'd just spam suggestions on every plus_ones edit).
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
    IF OLD.status = ANY (v_attending) THEN
      -- Was already attending → suggestions already considered. Skip.
      RETURN NEW;
    END IF;
  END IF;

  -- Walk every OTHER attending RSVP for this event.
  FOR v_other IN
    SELECT er.user_id
    FROM public.event_rsvps er
    WHERE er.event_id = NEW.event_id
      AND er.user_id <> NEW.user_id
      AND er.status = ANY (v_attending)
  LOOP
    -- Mutual-match check.
    IF NOT public.are_matched(NEW.user_id, v_other) THEN
      CONTINUE;
    END IF;

    v_low  := LEAST(NEW.user_id, v_other);
    v_high := GREATEST(NEW.user_id, v_other);

    -- Don't suggest if a flash_plan already exists between the two
    -- users for this event.
    IF public.has_pair_event_plan(v_low, v_high, NEW.event_id) THEN
      CONTINUE;
    END IF;

    -- Cooldown: clear any stale row > 24h old so we can re-insert
    -- a fresh suggestion. Pending rows < 24h block new ones (the
    -- ON CONFLICT swallows the duplicate INSERT silently).
    DELETE FROM public.plan_suggestions ps
    WHERE ps.event_id = NEW.event_id
      AND ps.user_a   = v_low
      AND ps.user_b   = v_high
      AND ps.suggested_at < (now() - INTERVAL '24 hours')
      AND ps.accepted_plan_id IS NULL;

    INSERT INTO public.plan_suggestions (event_id, user_a, user_b)
    VALUES (NEW.event_id, v_low, v_high)
    ON CONFLICT (event_id, user_a, user_b) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.on_event_rsvp_suggest_plan() IS
  'Trigger fn: when a user RSVPs an event in an attending state, walk
   the other attendees and write a plan_suggestions row for every
   mutual match. Cooldown 24h, dedupe by ordered pair, skip if a
   flash_plan already exists for the pair around this event.';

DROP TRIGGER IF EXISTS event_rsvp_suggest_plan_insert
  ON public.event_rsvps;
DROP TRIGGER IF EXISTS event_rsvp_suggest_plan_update
  ON public.event_rsvps;

CREATE TRIGGER event_rsvp_suggest_plan_insert
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.on_event_rsvp_suggest_plan();

CREATE TRIGGER event_rsvp_suggest_plan_update
  AFTER UPDATE OF status ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.on_event_rsvp_suggest_plan();

-- -------------------------------------------------------------------
-- 7. Realtime — publish plan_suggestions to authenticated subscribers
-- -------------------------------------------------------------------
-- Add the table to the supabase_realtime publication so the React
-- hook can subscribe to INSERTs filtered by user_a/user_b. RLS still
-- enforces visibility on the underlying replication stream.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'plan_suggestions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_suggestions';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- supabase_realtime publication not present (preview branch /
  -- self-hosted) — skip. Realtime will simply not surface inserts;
  -- the hook's polling fallback covers that case.
  NULL;
END
$$;

COMMIT;

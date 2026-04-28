-- ═══════════════════════════════════════════════════════════════════
-- Migration 044 — Wingman Invites (Wave 17)
--
-- Concept: when creating a flash_plan (or after creation), a participant
-- can invite a wingman friend — a different CeSoir user who joins the
-- date as a "+1". The friend gets a wingman invite notification and can
-- accept or decline. If accepted, the plan grows from 2 to 3 (or 4 if
-- both peers bring a wingman).
--
-- Use cases:
--   - First date jitters → bring a friend for safety / conversation
--   - Extrovert hangout vibe → multi-person fun > 1:1 awkwardness
--   - Group photo / group bill split logistics
--
-- Schema decisions
-- ────────────────
-- * `flash_plans` gains `wingman_a_id` and `wingman_b_id` (nullable
--   uuids → profiles). user A's wingman + user B's wingman. We don't
--   store which "slot" maps to which peer at the column level — the
--   semantics are "the wingman invited by user A" vs "by user B". A
--   denormalised pointer keeps the read path cheap (one row already
--   loaded for the plan tells you total head-count).
--
-- * `wingman_invites` is the audit + state-machine row:
--     id, plan_id, inviter_id, invitee_id, status, invited_at, responded_at
--   status ∈ (pending, accepted, declined, expired)
--   We add `expired` for plans that pass their `when_at` before the
--   invite is answered — a maintenance sweeper or the API-side stale
--   check sets it. Pending invites for a past plan are functionally
--   declined.
--
-- * UNIQUE (plan_id, invitee_id) so the same friend can't be spammed
--   with duplicate invites for the same plan.
--
-- * UNIQUE (plan_id, inviter_id) at app-layer is enforced by the API
--   (an inviter can only have ONE outstanding wingman invite per plan
--   on their side). We don't enforce at DB level because the inviter
--   may want to retract + re-invite a different friend — checking
--   "no other accepted/pending invite from this inviter" in the API
--   keeps the model flexible.
--
-- RLS
-- ───
-- READ: invitee + inviter can see the row (so both surfaces — the
-- inviter's "pending wingman" pill on /plans/:id, and the invitee's
-- /notifications card — work without service role).
-- INSERT: inviter must be a participant of the plan (checked via the
-- API since RLS can't easily traverse `flash_plan_participants` in a
-- WITH CHECK without RLS recursion, so the API uses .rpc/.from with
-- the caller's RLS context AND a server-side membership probe).
-- UPDATE: invitee can flip pending→accepted/declined. Inviter can
-- "withdraw" (delete). System fields (responded_at) are stamped via
-- a trigger.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. flash_plans columns
-- -------------------------------------------------------------------

ALTER TABLE public.flash_plans
  ADD COLUMN IF NOT EXISTS wingman_a_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wingman_b_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.flash_plans.wingman_a_id IS
  'Wingman invited by participant A (creator or first peer). Set ONLY after a wingman_invites row goes accepted. Nullable.';
COMMENT ON COLUMN public.flash_plans.wingman_b_id IS
  'Wingman invited by participant B (the other peer). Set ONLY after a wingman_invites row goes accepted. Nullable.';

-- A wingman cannot be one of the original participants (defence-in-depth
-- — the API also blocks this but a constraint guards against direct DB
-- writes). We can't reference flash_plan_participants here cheaply, but
-- we CAN ensure wingman_a_id <> creator_id since the creator is always
-- one of the two participants in practice (the second is whoever the
-- match flow paired them with — the API enforces the full check).
ALTER TABLE public.flash_plans
  DROP CONSTRAINT IF EXISTS flash_plans_wingman_distinct_creator;
ALTER TABLE public.flash_plans
  ADD CONSTRAINT flash_plans_wingman_distinct_creator CHECK (
    (wingman_a_id IS NULL OR wingman_a_id <> creator_id)
    AND (wingman_b_id IS NULL OR wingman_b_id <> creator_id)
  );

ALTER TABLE public.flash_plans
  DROP CONSTRAINT IF EXISTS flash_plans_wingmen_distinct;
ALTER TABLE public.flash_plans
  ADD CONSTRAINT flash_plans_wingmen_distinct CHECK (
    wingman_a_id IS NULL
    OR wingman_b_id IS NULL
    OR wingman_a_id <> wingman_b_id
  );

CREATE INDEX IF NOT EXISTS idx_flash_plans_wingman_a
  ON public.flash_plans (wingman_a_id) WHERE wingman_a_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flash_plans_wingman_b
  ON public.flash_plans (wingman_b_id) WHERE wingman_b_id IS NOT NULL;

-- -------------------------------------------------------------------
-- 2. wingman_invites table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wingman_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID NOT NULL REFERENCES public.flash_plans(id) ON DELETE CASCADE,
  inviter_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at  TIMESTAMPTZ,

  CONSTRAINT wingman_invites_distinct_users CHECK (inviter_id <> invitee_id),
  UNIQUE (plan_id, invitee_id)
);

COMMENT ON TABLE public.wingman_invites IS
  'Wingman invite audit + state machine. One row per (plan, invitee). Status pending → accepted | declined | expired. Accepted writes wingman_X_id back onto flash_plans (server-side, in the respond API).';

CREATE INDEX IF NOT EXISTS idx_wingman_invites_invitee_pending
  ON public.wingman_invites (invitee_id, invited_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_wingman_invites_plan
  ON public.wingman_invites (plan_id);

CREATE INDEX IF NOT EXISTS idx_wingman_invites_inviter
  ON public.wingman_invites (inviter_id, invited_at DESC);

-- -------------------------------------------------------------------
-- 3. Auto-stamp responded_at when status leaves 'pending'
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.wingman_invites_stamp_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'pending'
     AND NEW.status <> 'pending'
     AND NEW.responded_at IS NULL
  THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wingman_invites_stamp_response_trg
  ON public.wingman_invites;
CREATE TRIGGER wingman_invites_stamp_response_trg
  BEFORE UPDATE ON public.wingman_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.wingman_invites_stamp_response();

-- -------------------------------------------------------------------
-- 4. RLS
-- -------------------------------------------------------------------

ALTER TABLE public.wingman_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wingman_invites_read_participants"
  ON public.wingman_invites;
CREATE POLICY "wingman_invites_read_participants"
  ON public.wingman_invites FOR SELECT
  TO authenticated
  USING (
    inviter_id = (SELECT auth.uid())
    OR invitee_id = (SELECT auth.uid())
  );

-- INSERT: only the inviter can create. Membership in the plan is
-- additionally enforced by the API (server-side query against
-- flash_plan_participants).
DROP POLICY IF EXISTS "wingman_invites_insert_inviter"
  ON public.wingman_invites;
CREATE POLICY "wingman_invites_insert_inviter"
  ON public.wingman_invites FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = (SELECT auth.uid()));

-- UPDATE: invitee can change status (accept / decline). Inviter can
-- only update for withdrawal (status → declined as a courtesy, but
-- DELETE is preferred — see policy below).
DROP POLICY IF EXISTS "wingman_invites_update_invitee"
  ON public.wingman_invites;
CREATE POLICY "wingman_invites_update_invitee"
  ON public.wingman_invites FOR UPDATE
  TO authenticated
  USING (
    invitee_id = (SELECT auth.uid())
    OR inviter_id = (SELECT auth.uid())
  )
  WITH CHECK (
    invitee_id = (SELECT auth.uid())
    OR inviter_id = (SELECT auth.uid())
  );

-- DELETE: inviter can withdraw a still-pending invite. Invitee
-- shouldn't need to delete — declining is the public path.
DROP POLICY IF EXISTS "wingman_invites_delete_inviter"
  ON public.wingman_invites;
CREATE POLICY "wingman_invites_delete_inviter"
  ON public.wingman_invites FOR DELETE
  TO authenticated
  USING (inviter_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------
-- 5. Realtime publication (so /notifications + /plans/:id update live)
-- -------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'wingman_invites'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE wingman_invites';
  END IF;
END $$;

COMMIT;

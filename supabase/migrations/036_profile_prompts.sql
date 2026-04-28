-- ===================================================================
-- Migration 036 — Profile prompts (Hinge-style, Wave 17)
--
-- Each user picks exactly 3 prompts from a curated catalogue
-- (`PROMPT_QUESTIONS` in src/lib/prompts.ts) and writes a short answer
-- (≤150 chars). Pairs render as cards inside the swipe-card photo
-- carousel, every 2 photos.
--
-- Schema choice — flat table with PK (user_id, order_idx):
--   * order_idx ∈ [0, 2] gives us cheap reordering: just rewrite the
--     three rows in a single `upsert` round-trip.
--   * Composite PK guarantees only 3 rows max per user (CHECK pins the
--     range; PK pins uniqueness). No JSON blob, so RLS / index reasoning
--     stays trivial.
--   * prompt_id is a free-form TEXT keyed off the catalogue in the app.
--     We deliberately do NOT FK to a `prompt_catalog` table — the
--     catalogue is owned by source code (versioned with the app), not
--     the DB, so a stale DB row pointing at a removed prompt simply
--     hides on the client. Cheaper than maintaining catalogue migrations
--     every time product wants to swap a question.
--
-- RLS:
--   * SELECT — any authenticated user can read prompts of any profile
--     (they show on swipe cards).
--   * INSERT/UPDATE/DELETE — only the owner. `auth.uid() = user_id`.
--   * Anon role gets no access (the swipe deck only ever runs as
--     authenticated; landing pages never read this table).
-- ===================================================================

BEGIN;

-- ─── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_prompts (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_idx  SMALLINT NOT NULL,
  prompt_id  TEXT NOT NULL,
  answer     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, order_idx),
  CONSTRAINT profile_prompts_order_range
    CHECK (order_idx >= 0 AND order_idx <= 2),
  CONSTRAINT profile_prompts_answer_length
    CHECK (char_length(answer) > 0 AND char_length(answer) <= 150),
  CONSTRAINT profile_prompts_prompt_id_length
    CHECK (char_length(prompt_id) > 0 AND char_length(prompt_id) <= 64)
);

COMMENT ON TABLE public.profile_prompts IS
  'Hinge-style profile prompts (Wave 17). Exactly 0–3 rows per user, '
  'keyed by (user_id, order_idx). prompt_id references the catalogue '
  'in src/lib/prompts.ts (PROMPT_QUESTIONS) — intentionally not FKed '
  'to a DB table so question copy can ship via app deploys, not '
  'migrations. RLS: SELECT public to authenticated, mutations owner-only.';

COMMENT ON COLUMN public.profile_prompts.order_idx IS
  'Slot index 0–2. Drives both render order on the SwipeCard and the '
  '"reorder" UX in PromptEditor (drag/drop rewrites all three rows).';

COMMENT ON COLUMN public.profile_prompts.prompt_id IS
  'String key matching a row in PROMPT_QUESTIONS (src/lib/prompts.ts). '
  'Stale IDs from removed prompts simply hide on the client.';

COMMENT ON COLUMN public.profile_prompts.answer IS
  'User-typed answer. Hard cap 150 chars (CHECK). UI also enforces '
  'PROMPT_ANSWER_MAX_LENGTH from src/lib/prompts.ts.';

-- ─── 2. Indexes ────────────────────────────────────────────────────
-- The PK already covers the (user_id, order_idx) hot path (lookup +
-- upsert). No secondary index needed yet — if/when the swipe deck
-- starts batch-fetching prompts for many users, add a covering index
-- on user_id INCLUDE (prompt_id, answer, order_idx).

-- ─── 3. updated_at trigger ─────────────────────────────────────────
-- Reuse the canonical helper if it exists; otherwise define it once.
-- Idempotent so re-running the migration doesn't error.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_prompts_set_updated_at ON public.profile_prompts;
CREATE TRIGGER profile_prompts_set_updated_at
  BEFORE UPDATE ON public.profile_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. Row Level Security ─────────────────────────────────────────
ALTER TABLE public.profile_prompts ENABLE ROW LEVEL SECURITY;

-- SELECT — any authenticated user can read prompts of any profile.
-- Prompts are inherently public-on-app: they render on the swipe card
-- of every profile that's ever surfaced.
DROP POLICY IF EXISTS "profile_prompts_authenticated_read"
  ON public.profile_prompts;
CREATE POLICY "profile_prompts_authenticated_read"
  ON public.profile_prompts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT — owner only.
DROP POLICY IF EXISTS "profile_prompts_owner_insert"
  ON public.profile_prompts;
CREATE POLICY "profile_prompts_owner_insert"
  ON public.profile_prompts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE — owner only. Both USING (existing row) and WITH CHECK (new
-- row) so a malicious client can't update someone else's row by
-- changing user_id in the payload.
DROP POLICY IF EXISTS "profile_prompts_owner_update"
  ON public.profile_prompts;
CREATE POLICY "profile_prompts_owner_update"
  ON public.profile_prompts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE — owner only.
DROP POLICY IF EXISTS "profile_prompts_owner_delete"
  ON public.profile_prompts;
CREATE POLICY "profile_prompts_owner_delete"
  ON public.profile_prompts FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ─── 5. Grants ─────────────────────────────────────────────────────
-- RLS does the gating; grants just open the table to the role.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profile_prompts
  TO authenticated;

-- Anon role explicitly gets nothing.
REVOKE ALL ON public.profile_prompts FROM anon;

COMMIT;

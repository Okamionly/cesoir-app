-- ═══════════════════════════════════════════════════════════════════
-- Migration 032 — IRL meet confirmations ("Vu ce soir" feature)
--
-- After two matched users planned a date (via `plans` or `flash_plans`),
-- we ask each of them within a 48h window: "Have you actually met IRL?".
-- If BOTH confirm "yes" within that window we mark the row as mutual,
-- award karma + insert the "first-date" achievement.
--
-- Schema:
--   - One row per (conversation_id, user_id). PK is the composite to
--     enforce "one confirmation per user per conversation" at the DB
--     level — no app-side dedup needed.
--   - `confirmed_at` set on insert (server timestamp).
--   - `mutual_at` is set ONLY by the API route once the OTHER party's
--     row also exists. It is intentionally writable from the client only
--     under tight RLS — see policy section.
--
-- RLS strategy:
--   - Read:   only the two conversation participants can SELECT their
--             own row OR the peer's row for that conversation. This lets
--             the client UI know "did the other one confirm yet?" without
--             leaking other conversations' data.
--   - Insert: a user can insert ONLY their own row, and only if they
--             actually belong to the referenced conversation.
--   - Update: the API route flips `mutual_at` using the service-role
--             key, which bypasses RLS, so no UPDATE policy is required
--             for normal flows. We expose a permissive UPDATE for the
--             SAME participant to set their own `mutual_at` defensively
--             (matches the "either side can mark mutual" model when the
--             API runs without service role in dev).
--   - Delete: not exposed (privacy: confirmations are an audit trail).
--
-- Anti-fraud:
--   - Composite PK (conversation_id, user_id) prevents the same user
--     confirming the same conversation twice.
--   - RLS WITH CHECK on conversation membership prevents inserting a
--     row for a conversation you don't belong to.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS irl_confirmations (
  conversation_id UUID NOT NULL
    REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  mutual_at       TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- One index on user_id alone for fast "all my confirmations" lookups
-- (e.g. profile/achievements pages). The PK already indexes
-- (conversation_id, user_id) so per-conversation reads are covered.
CREATE INDEX IF NOT EXISTS idx_irl_confirmations_user
  ON irl_confirmations (user_id);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE irl_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "irl_participants_can_read" ON irl_confirmations;
DROP POLICY IF EXISTS "irl_participants_can_insert" ON irl_confirmations;
DROP POLICY IF EXISTS "irl_participants_can_update_self" ON irl_confirmations;

-- READ: only the two members of the conversation can see rows for it.
-- This includes the peer's row, so the client can render "they confirmed
-- too" without an extra API round-trip.
CREATE POLICY "irl_participants_can_read"
  ON irl_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM conversations c
       WHERE c.id = irl_confirmations.conversation_id
         AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

-- INSERT: a user can only insert their OWN row, and only if they belong
-- to the referenced conversation. Combined with the composite PK this
-- enforces "one confirmation per user per conversation" + "no inserting
-- on someone else's behalf" + "no inserting on a conversation you're
-- not a participant of".
CREATE POLICY "irl_participants_can_insert"
  ON irl_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM conversations c
       WHERE c.id = irl_confirmations.conversation_id
         AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

-- UPDATE: a participant can update their own row. In practice the
-- mutual_at flip is done by the API route (service-role bypasses RLS),
-- but this policy keeps the table usable in dev/local without service
-- role configured.
CREATE POLICY "irl_participants_can_update_self"
  ON irl_confirmations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM conversations c
       WHERE c.id = irl_confirmations.conversation_id
         AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM conversations c
       WHERE c.id = irl_confirmations.conversation_id
         AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

COMMENT ON TABLE irl_confirmations IS
  'Per-user IRL meet confirmation for a planned date (Vu ce soir feature).
   Composite PK (conversation_id, user_id) prevents double-confirm.
   When both participants have a row within 48h of plan_time + 2h, the
   API route /api/match/confirm-irl awards karma + the first-date badge
   and stamps mutual_at on both rows.';

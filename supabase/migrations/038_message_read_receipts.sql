-- ═══════════════════════════════════════════════════════════════════
-- Migration 038 — Message read receipts (opt-in, reciprocal)
--
-- Wave 17 feature: show "Vu HH:MM" indicator below own message bubbles
-- once the peer has read them.
--
-- Privacy model — RECIPROCAL OPT-IN:
--   - `profiles.read_receipts_enabled` defaults to FALSE (privacy by default).
--   - User A only sees A's own "Vu" status if BOTH A and the peer have
--     opted in. If A turns the toggle off, A stops sending receipts AND
--     stops seeing the peer's. Symmetric.
--   - The `mark_messages_read` RPC enforces this server-side: it only
--     stamps `read_at` when BOTH participants have the flag enabled.
--     This way the underlying timestamp itself isn't even written when
--     either side has the feature off — peer can't infer read state from
--     row metadata leaks.
--
-- Schema notes:
--   - `messages.read_at` already exists from the original schema (used
--     by the unread-count badge in the conversation list). This migration
--     does NOT add the column — it formalises the read flow.
--   - We add an index on (conversation_id, sender_id, read_at) IS NULL
--     to keep the unread-count subquery fast at scale.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Profile preference flag ──────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS read_receipts_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.read_receipts_enabled IS
  'Wave 17 — opt-in read receipts in chat. FALSE by default (privacy first). '
  'Reciprocal: when this is FALSE, the user neither sends nor receives '
  '"Vu" indicators. Server-side check in mark_messages_read() RPC ensures '
  'read_at is only written when BOTH participants have it enabled.';

-- ─── 2. Index: keep unread / read-status lookups cheap ───────────────
-- Used both by the unread-count subquery in useConversations and by the
-- mark_messages_read RPC's WHERE clause.
CREATE INDEX IF NOT EXISTS idx_messages_unread_lookup
  ON messages (conversation_id, sender_id)
  WHERE read_at IS NULL;

-- ─── 3. RPC: mark_messages_read(conversation_id) ─────────────────────
-- Stamps read_at = now() on every unread message in the given
-- conversation where the *recipient* is the calling user (i.e. messages
-- sent by the OTHER party). Enforces reciprocal opt-in: if either
-- participant has read_receipts_enabled = false, the function is a no-op
-- and returns 0 (so the chat page can still call it unconditionally
-- without leaking who has the feature on).
--
-- Returns the count of rows updated, useful for analytics and tests.
--
-- Security: SECURITY INVOKER (default) — relies on RLS. The query
-- filters by sender_id != auth.uid() so a user can never stamp their
-- own messages as read (defensive, RLS would also block it).

DROP FUNCTION IF EXISTS public.mark_messages_read(uuid);

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_peer_id uuid;
  v_self_enabled boolean;
  v_peer_enabled boolean;
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  -- Find the peer in this conversation (and confirm caller is a participant).
  SELECT
    CASE WHEN c.user_a = v_uid THEN c.user_b ELSE c.user_a END
  INTO v_peer_id
  FROM conversations c
  WHERE c.id = p_conversation_id
    AND (c.user_a = v_uid OR c.user_b = v_uid);

  IF v_peer_id IS NULL THEN
    -- Not a participant (or conversation doesn't exist) — RLS would also
    -- reject the UPDATE below, but bail early to avoid a useless query.
    RETURN 0;
  END IF;

  -- Reciprocal opt-in check. Both must be TRUE for receipts to flow.
  SELECT read_receipts_enabled INTO v_self_enabled
    FROM profiles WHERE id = v_uid;
  SELECT read_receipts_enabled INTO v_peer_enabled
    FROM profiles WHERE id = v_peer_id;

  IF NOT COALESCE(v_self_enabled, false) OR NOT COALESCE(v_peer_enabled, false) THEN
    -- Either side opted out — never stamp read_at. The unread badge in
    -- the conversation list keeps working (it counts read_at IS NULL on
    -- messages from the peer), but the peer never learns we read.
    RETURN 0;
  END IF;

  -- Stamp read_at on every unread message FROM the peer.
  UPDATE messages
     SET read_at = now()
   WHERE conversation_id = p_conversation_id
     AND sender_id = v_peer_id
     AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.mark_messages_read(uuid) IS
  'Wave 17 — stamps read_at on unread peer messages in a conversation. '
  'No-op (returns 0) unless BOTH participants have profiles.read_receipts_enabled = true. '
  'Caller must be a participant. Enforces reciprocal opt-in server-side so '
  'a privacy-conscious user never leaks read state via row metadata.';

-- Allow authenticated users to invoke the RPC.
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

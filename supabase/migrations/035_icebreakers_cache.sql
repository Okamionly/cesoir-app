-- ═══════════════════════════════════════════════════════════════════
-- Migration 035 — AI icebreaker suggestions cache (Wave 17)
--
-- The /api/chat/icebreakers endpoint generates 3 short, contextualised
-- conversation starters from the match's bio + shared mode by calling
-- Claude. The call is paid + slow, so we cache the result keyed by
-- (owner_id, peer_id) for 24 h. The next time the same owner opens the
-- same conversation we return the cached array instantly.
--
-- Cache key rationale:
--   - owner_id + peer_id (NOT conversation_id): the same pair of users
--     could in theory have multiple conversations across modes. We want
--     suggestions to be PER VIEWER (the owner) because they reflect the
--     owner reading the peer's bio, not the other way around. The
--     `mode` is part of the prompt input but NOT the cache key — bios
--     change much more often than the user's conversation count, and
--     the mode signal is small.
--   - The PK is the composite (owner_id, peer_id) which gives a fast
--     equality lookup and prevents duplicate rows per pair. Composite
--     PK + UPSERT (ON CONFLICT … DO UPDATE) makes regeneration free.
--
-- RLS strategy:
--   - Read:   owner can only SELECT rows where owner_id = auth.uid().
--             Peers should never see what was generated for someone
--             reading them (privacy + avoids leaking bio interpretation).
--   - Insert: owner can only insert their own row. The API route uses
--             the caller's bearer token, so auth.uid() = owner_id holds.
--   - Update: owner can refresh their own cached row.
--   - Delete: not exposed (TTL is enforced by the API checking
--             generated_at; stale rows are simply overwritten on next
--             call).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS icebreakers_cache (
  owner_id      UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  peer_id       UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  icebreakers   JSONB NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, peer_id)
);

-- Lookup index for "show me my recent generations" admin queries / TTL
-- sweeps. PK already covers per-pair reads.
CREATE INDEX IF NOT EXISTS idx_icebreakers_cache_generated_at
  ON icebreakers_cache (generated_at);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE icebreakers_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "icebreakers_owner_can_read" ON icebreakers_cache;
DROP POLICY IF EXISTS "icebreakers_owner_can_insert" ON icebreakers_cache;
DROP POLICY IF EXISTS "icebreakers_owner_can_update" ON icebreakers_cache;

-- READ: owner only.
CREATE POLICY "icebreakers_owner_can_read"
  ON icebreakers_cache FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- INSERT: owner can only write their own row.
CREATE POLICY "icebreakers_owner_can_insert"
  ON icebreakers_cache FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: owner can refresh (used by ON CONFLICT DO UPDATE upserts).
CREATE POLICY "icebreakers_owner_can_update"
  ON icebreakers_cache FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

COMMENT ON TABLE icebreakers_cache IS
  'AI-generated conversation starters for new matches (Wave 17). Keyed by
   (owner_id, peer_id), TTL 24h enforced by the /api/chat/icebreakers
   route which regenerates when generated_at is older than 24h. RLS
   restricts reads to the owner so peers cannot see how an AI interprets
   their own bio.';

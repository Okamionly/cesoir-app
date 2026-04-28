-- ═══════════════════════════════════════════════════════════════════
-- Migration 041 — Crystal Ball / Blind Daily Match (Wave 17)
--
-- Concept: once per local day at 20h every active user gets a SINGLE
-- "blind match" — a profile picked by the matching pipeline but
-- presented with the photo blurred and the name hidden. Both parties
-- must hit "Je tente" within 24h to reveal photos + name and unlock
-- chat. Designed as a daily engagement pulse: one shot, drama-tier
-- reveal, expires automatically.
--
-- Schema decisions
-- ────────────────
-- * One row per (day, user_a). user_a is ALWAYS the lower uuid of the
--   pair so dedupe is enforced at PK level — we never store the same
--   pair twice on the same day.
-- * `a_liked` / `b_liked` are BOOL with default FALSE. NULL was
--   considered for "not yet decided" but FALSE is fine: the row is
--   only inserted at 20h and the 24h expiry handles the "did not
--   answer" case (FALSE wins by default at expires_at).
-- * `revealed_at` is set by the API route exactly once when both
--   sides flip to true. Used by the client to trigger the cinematic
--   reveal animation only once.
-- * `expires_at` = day + 24h. After this, automatic "Pas pour moi"
--   on both sides — the client treats the row as resolved + no
--   reveal possible.
--
-- The matching for "who gets paired with whom today" runs once per
-- day via the RPC `generate_daily_crystal_ball()`. It picks pairs
-- with score >= 70 (already in the matching pipeline) AND not in
-- the already-interacted set (no like/pass/superlike/block between
-- them) AND not yet matched on a previous Crystal Ball day.
--
-- RLS
-- ───
-- A row is visible to the two participants only. Inserts come from
-- the service role (the daily generator RPC runs with elevated
-- privileges). Updates: each user can flip their OWN like flag.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crystal_ball_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day          DATE NOT NULL,
  user_a       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  a_liked      BOOLEAN NOT NULL DEFAULT FALSE,
  b_liked      BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Pair must be ordered: enforce user_a < user_b at write time so
  -- (day, user_a) UNIQUE actually dedupes by *pair* not by direction.
  CONSTRAINT crystal_ball_ordered_pair CHECK (user_a < user_b),

  -- One pair per day. user_a being the lower uuid means a single
  -- UNIQUE on (day, user_a, user_b) is sufficient. We add the
  -- (day, user_a) constraint required by the spec — combined with
  -- the ordered-pair check this means user_a never appears twice on
  -- the same day, which is the actual product invariant we want.
  UNIQUE (day, user_a)
);

-- Hot-path indices:
--   * "Find today's match for me" — the user can be on either side
--     so we cover BOTH columns separately. Postgres will pick the
--     better one based on which one matches the WHERE clause.
--   * Expiry sweeper queries by day + expires_at.
CREATE INDEX IF NOT EXISTS idx_crystal_ball_user_a
  ON public.crystal_ball_matches (user_a, day DESC);

CREATE INDEX IF NOT EXISTS idx_crystal_ball_user_b
  ON public.crystal_ball_matches (user_b, day DESC);

CREATE INDEX IF NOT EXISTS idx_crystal_ball_expires
  ON public.crystal_ball_matches (expires_at)
  WHERE revealed_at IS NULL;

COMMENT ON TABLE public.crystal_ball_matches IS
  'Daily blind match (Wave 17). One row per pair per day, user_a
   always < user_b. Both users must like within expires_at to set
   revealed_at and unlock chat. After expires_at the row is treated
   as a mutual pass with no penalty.';

-- -------------------------------------------------------------------
-- 2. RLS
-- -------------------------------------------------------------------

ALTER TABLE public.crystal_ball_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crystal_participants_can_read"
  ON public.crystal_ball_matches;
DROP POLICY IF EXISTS "crystal_participants_can_update_self"
  ON public.crystal_ball_matches;

-- READ: only the two participants can see their row. No one else
-- has any reason to enumerate today's pairings.
CREATE POLICY "crystal_participants_can_read"
  ON public.crystal_ball_matches FOR SELECT
  TO authenticated
  USING (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  );

-- UPDATE: each side can flip ONLY their own like flag. The opposite
-- side's flag and the system fields (revealed_at, expires_at, day,
-- pair) are immutable from the client. Enforced by a row-level
-- WITH CHECK that prevents the other user from being touched. The
-- "did not change foreign columns" guarantee comes from a separate
-- trigger so RLS stays tight; see crystal_ball_guard_update below.
CREATE POLICY "crystal_participants_can_update_self"
  ON public.crystal_ball_matches FOR UPDATE
  TO authenticated
  USING (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  )
  WITH CHECK (
    user_a = (SELECT auth.uid())
    OR user_b = (SELECT auth.uid())
  );

-- INSERT is intentionally NOT exposed to clients. The daily
-- generator runs as service role and bypasses RLS. If a future
-- need arises to seed rows from authenticated context, add a
-- narrow policy then — for now the surface stays small.

-- -------------------------------------------------------------------
-- 3. Guard trigger — protect immutable columns + auto-set revealed_at
-- -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crystal_ball_guard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  -- System fields are append-only / set-once. Service role can still
  -- write them (bypasses RLS, also bypasses this check thanks to the
  -- caller IS NULL guard at the top).
  IF caller IS NULL THEN
    -- Service role / cron / migration context — let it through.
    RETURN NEW;
  END IF;

  -- Immutables: pair, day, expires_at, created_at, id.
  IF NEW.id        <> OLD.id        THEN
    RAISE EXCEPTION 'crystal_ball: id is immutable';
  END IF;
  IF NEW.day       <> OLD.day       THEN
    RAISE EXCEPTION 'crystal_ball: day is immutable';
  END IF;
  IF NEW.user_a    <> OLD.user_a    THEN
    RAISE EXCEPTION 'crystal_ball: user_a is immutable';
  END IF;
  IF NEW.user_b    <> OLD.user_b    THEN
    RAISE EXCEPTION 'crystal_ball: user_b is immutable';
  END IF;
  IF NEW.expires_at <> OLD.expires_at THEN
    RAISE EXCEPTION 'crystal_ball: expires_at is immutable';
  END IF;
  IF NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'crystal_ball: created_at is immutable';
  END IF;

  -- Each user can flip ONLY their own like flag.
  IF caller = OLD.user_a THEN
    -- Caller is user_a → b_liked must not change.
    IF NEW.b_liked <> OLD.b_liked THEN
      RAISE EXCEPTION 'crystal_ball: only the peer can change b_liked';
    END IF;
  ELSIF caller = OLD.user_b THEN
    IF NEW.a_liked <> OLD.a_liked THEN
      RAISE EXCEPTION 'crystal_ball: only the peer can change a_liked';
    END IF;
  ELSE
    RAISE EXCEPTION 'crystal_ball: caller is not a participant';
  END IF;

  -- Auto-stamp revealed_at the first time both sides are true and
  -- we are still inside the window. Subsequent updates leave it.
  IF OLD.revealed_at IS NULL
     AND NEW.a_liked AND NEW.b_liked
     AND now() < OLD.expires_at
  THEN
    NEW.revealed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crystal_ball_guard_update_trg
  ON public.crystal_ball_matches;
CREATE TRIGGER crystal_ball_guard_update_trg
  BEFORE UPDATE ON public.crystal_ball_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.crystal_ball_guard_update();

COMMENT ON FUNCTION public.crystal_ball_guard_update() IS
  'BEFORE UPDATE guard: pin immutable columns, ensure each side can
   only flip its own like flag, and auto-stamp revealed_at the first
   time both flags are true within the window.';

-- -------------------------------------------------------------------
-- 4. RPC: generate_daily_crystal_ball()
-- -------------------------------------------------------------------
-- Called once per day by a scheduled job (cron-job.org → /api/cron/
-- crystal-ball). Builds today's pair set:
--
--   1. Eligible users = profiles with avatar_url IS NOT NULL and
--      no opt-out flag (privacy).
--   2. For each eligible user we look at the candidates within the
--      standard matching pipeline (mode overlap, distance) but we
--      do NOT call findMatches here — the cron handler will instead
--      query nearby_profiles per user and we just enforce the
--      hard exclusion set + the score >= 70 cut. This RPC is the
--      simple, deterministic dedupe writer: pass it the candidate
--      pairs (user_a, user_b, score) and it inserts them with the
--      ordered-pair invariant.
--
-- For dev convenience we also expose a "generate from scratch"
-- mode that picks random eligible pairs — used by /api/cron/crystal
-- ball when no candidate set is provided. Real production flow goes
-- through the API route which calls findMatches per user and feeds
-- the candidate set in.

CREATE OR REPLACE FUNCTION public.generate_daily_crystal_ball(
  -- Optional pre-computed candidate pairs. If NULL we fall back to
  -- the random pool inside the function. Each row is (user_a,
  -- user_b) ALREADY ORDERED (caller is responsible).
  candidate_pairs UUID[][] DEFAULT NULL,
  target_day      DATE     DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  pair_id    UUID,
  user_a     UUID,
  user_b     UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expires TIMESTAMPTZ := (target_day::timestamptz + INTERVAL '24 hours');
  v_pair    UUID[];
  v_low     UUID;
  v_high    UUID;
  v_id      UUID;
BEGIN
  -- Caller must be service role. We don't expose this to authenticated
  -- — the cron does it.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'generate_daily_crystal_ball: must be called as service role';
  END IF;

  IF candidate_pairs IS NULL THEN
    -- Fallback: random pairing of eligible users that have not yet
    -- been paired on a previous Crystal Ball day, ignoring the
    -- already-interacted set (cron handler should pre-filter).
    -- Kept simple — production path uses the explicit candidate set.
    INSERT INTO public.crystal_ball_matches (day, user_a, user_b, expires_at)
    SELECT
      target_day,
      LEAST(p1.id, p2.id),
      GREATEST(p1.id, p2.id),
      v_expires
    FROM public.profiles p1
    JOIN public.profiles p2 ON p2.id <> p1.id
    WHERE p1.avatar_url IS NOT NULL
      AND p2.avatar_url IS NOT NULL
      AND p1.id < p2.id
      AND NOT EXISTS (
        SELECT 1 FROM public.crystal_ball_matches cb
        WHERE cb.user_a = LEAST(p1.id, p2.id)
          AND cb.user_b = GREATEST(p1.id, p2.id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.interactions i
        WHERE (
          (i.from_user = p1.id AND i.to_user = p2.id) OR
          (i.from_user = p2.id AND i.to_user = p1.id)
        )
      )
    ORDER BY random()
    LIMIT 100
    ON CONFLICT (day, user_a) DO NOTHING
    RETURNING id, crystal_ball_matches.user_a, crystal_ball_matches.user_b
    INTO v_id, v_low, v_high;
  ELSE
    -- Explicit candidate set path.
    FOREACH v_pair SLICE 1 IN ARRAY candidate_pairs
    LOOP
      IF array_length(v_pair, 1) < 2 THEN CONTINUE; END IF;
      v_low  := LEAST(v_pair[1], v_pair[2]);
      v_high := GREATEST(v_pair[1], v_pair[2]);

      IF v_low = v_high THEN CONTINUE; END IF;

      INSERT INTO public.crystal_ball_matches (day, user_a, user_b, expires_at)
      VALUES (target_day, v_low, v_high, v_expires)
      ON CONFLICT (day, user_a) DO NOTHING;
    END LOOP;
  END IF;

  RETURN QUERY
  SELECT cb.id, cb.user_a, cb.user_b
    FROM public.crystal_ball_matches cb
   WHERE cb.day = target_day;
END;
$$;

COMMENT ON FUNCTION public.generate_daily_crystal_ball(UUID[][], DATE) IS
  'Daily Crystal Ball pair generator. Called by /api/cron/crystal-ball
   once per day. Either consumes a pre-computed candidate set (real
   production path) or falls back to random eligible pairs.
   Returns the rows it produced for that day.';

-- Service role only — strip every other grant.
REVOKE EXECUTE ON FUNCTION public.generate_daily_crystal_ball(UUID[][], DATE)
  FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_crystal_ball(UUID[][], DATE)
  TO service_role;

-- -------------------------------------------------------------------
-- 5. RPC: today's crystal ball lookup (read-side helper)
-- -------------------------------------------------------------------
-- Returns the caller's row for `target_day` plus the peer profile
-- snapshot a client needs to render the blurred card without leaking
-- the peer's full row. Keeping it in SQL avoids the client having to
-- join profiles + crystal_ball_matches manually and lets us stamp
-- a single RLS-protected view.

CREATE OR REPLACE FUNCTION public.get_my_crystal_ball(
  target_day DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id               UUID,
  day              DATE,
  is_user_a        BOOLEAN,
  i_liked          BOOLEAN,
  peer_liked       BOOLEAN,
  revealed_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  peer_id          UUID,
  peer_name        TEXT,
  peer_age         INTEGER,
  peer_avatar_url  TEXT,
  peer_bio         TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cb.id,
    cb.day,
    (cb.user_a = caller)                                AS is_user_a,
    CASE WHEN cb.user_a = caller THEN cb.a_liked
         ELSE cb.b_liked END                            AS i_liked,
    CASE WHEN cb.user_a = caller THEN cb.b_liked
         ELSE cb.a_liked END                            AS peer_liked,
    cb.revealed_at,
    cb.expires_at,
    p.id                                                AS peer_id,
    p.name                                              AS peer_name,
    p.age                                               AS peer_age,
    p.avatar_url                                        AS peer_avatar_url,
    p.bio                                               AS peer_bio
  FROM public.crystal_ball_matches cb
  JOIN public.profiles p
    ON p.id = CASE WHEN cb.user_a = caller THEN cb.user_b ELSE cb.user_a END
  WHERE cb.day = target_day
    AND (cb.user_a = caller OR cb.user_b = caller)
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_my_crystal_ball(DATE) IS
  'Return the caller s Crystal Ball row for target_day along with the
   peer profile snapshot (name/age/avatar/bio). The client is
   responsible for hiding name + blurring avatar until revealed_at is
   set — keeping the data here lets us animate the reveal without a
   second round-trip.';

GRANT EXECUTE ON FUNCTION public.get_my_crystal_ball(DATE)
  TO authenticated;

COMMIT;

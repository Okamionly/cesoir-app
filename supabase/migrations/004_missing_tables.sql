-- ========================================
-- CeSoir Migration 004: Missing Tables & Views
-- rooms, plans, flash_plans, flash_plan_participants
-- + leaderboard_view, trending_venues_view
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. ROOMS (Clubhouse-like audio rooms)
-- ========================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  mode TEXT,
  max_speakers INTEGER NOT NULL DEFAULT 5,
  current_speakers INTEGER NOT NULL DEFAULT 0,
  current_listeners INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms (host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status_started ON rooms (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_mode ON rooms (mode) WHERE status = 'live';

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms are publicly discoverable" ON rooms;
CREATE POLICY "Rooms are publicly discoverable"
  ON rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can create rooms as host" ON rooms;
CREATE POLICY "Auth users can create rooms as host"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;
CREATE POLICY "Hosts can update own rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own rooms" ON rooms;
CREATE POLICY "Hosts can delete own rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = host_id);

-- ========================================
-- 2. PLANS (1-to-1 date plans between two users)
-- ========================================
-- Deterministic ordering: store user_a < user_b lexicographically (text cast),
-- so the same pair never produces two rows. Enforced by CHECK + UNIQUE.
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  when_date TIMESTAMPTZ NOT NULL,
  what TEXT NOT NULL DEFAULT '',
  where_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'done', 'cancelled')),
  proposed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plans_users_distinct CHECK (user_a <> user_b),
  CONSTRAINT plans_users_ordered CHECK (user_a::text < user_b::text)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plans_pair_when
  ON plans (user_a, user_b, when_date);
CREATE INDEX IF NOT EXISTS idx_plans_user_a ON plans (user_a);
CREATE INDEX IF NOT EXISTS idx_plans_user_b ON plans (user_b);
CREATE INDEX IF NOT EXISTS idx_plans_when ON plans (when_date);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read plans" ON plans;
CREATE POLICY "Participants can read plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Participants can insert plans" ON plans;
CREATE POLICY "Participants can insert plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Participants can update plans" ON plans;
CREATE POLICY "Participants can update plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Participants can delete plans" ON plans;
CREATE POLICY "Participants can delete plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- ========================================
-- 3. FLASH PLANS (open-to-candidates quick plans)
-- ========================================
CREATE TABLE IF NOT EXISTS flash_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  what TEXT NOT NULL DEFAULT '',
  where_text TEXT NOT NULL DEFAULT '',
  when_at TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 4,
  mode TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_plans_creator ON flash_plans (creator_id);
CREATE INDEX IF NOT EXISTS idx_flash_plans_status_when ON flash_plans (status, when_at);
CREATE INDEX IF NOT EXISTS idx_flash_plans_deadline ON flash_plans (deadline);

ALTER TABLE flash_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Flash plans are public" ON flash_plans;
CREATE POLICY "Flash plans are public"
  ON flash_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users create flash plans" ON flash_plans;
CREATE POLICY "Auth users create flash plans"
  ON flash_plans FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators update own flash plans" ON flash_plans;
CREATE POLICY "Creators update own flash plans"
  ON flash_plans FOR UPDATE
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators delete own flash plans" ON flash_plans;
CREATE POLICY "Creators delete own flash plans"
  ON flash_plans FOR DELETE
  USING (auth.uid() = creator_id);

-- ========================================
-- 4. FLASH PLAN PARTICIPANTS
-- ========================================
CREATE TABLE IF NOT EXISTS flash_plan_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flash_plan_id UUID REFERENCES flash_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate', 'accepted', 'rejected')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flash_plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fpp_plan ON flash_plan_participants (flash_plan_id);
CREATE INDEX IF NOT EXISTS idx_fpp_user ON flash_plan_participants (user_id);

ALTER TABLE flash_plan_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Flash plan participants are public" ON flash_plan_participants;
CREATE POLICY "Flash plan participants are public"
  ON flash_plan_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users self-join flash plans" ON flash_plan_participants;
CREATE POLICY "Auth users self-join flash plans"
  ON flash_plan_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own participation" ON flash_plan_participants;
CREATE POLICY "Users update own participation"
  ON flash_plan_participants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT creator_id FROM flash_plans WHERE id = flash_plan_id)
  );

DROP POLICY IF EXISTS "Users delete own participation" ON flash_plan_participants;
CREATE POLICY "Users delete own participation"
  ON flash_plan_participants FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT creator_id FROM flash_plans WHERE id = flash_plan_id)
  );

-- ========================================
-- 5. LEADERBOARD VIEW
-- Aggregates: likes received, conversations participated, karma sum.
-- Top 50 ordered by karma DESC then likes_received DESC.
-- ========================================
DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
WITH likes AS (
  SELECT to_user AS user_id, COUNT(*)::int AS likes_received
  FROM interactions
  WHERE action IN ('like', 'superlike')
  GROUP BY to_user
),
convos AS (
  SELECT user_id, COUNT(DISTINCT conv_id)::int AS conversations
  FROM (
    SELECT user_a AS user_id, id AS conv_id FROM conversations
    UNION ALL
    SELECT user_b AS user_id, id AS conv_id FROM conversations
  ) c
  GROUP BY user_id
),
karma AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::int AS karma
  FROM karma_transactions
  GROUP BY user_id
)
SELECT
  p.id,
  p.name,
  p.avatar_url,
  p.is_verified,
  p.total_meetups,
  p.reliability_score,
  COALESCE(l.likes_received, 0) AS likes_received,
  COALESCE(c.conversations, 0) AS conversations,
  COALESCE(k.karma, 0) AS karma
FROM profiles p
LEFT JOIN likes l ON l.user_id = p.id
LEFT JOIN convos c ON c.user_id = p.id
LEFT JOIN karma k ON k.user_id = p.id
ORDER BY karma DESC, likes_received DESC, p.total_meetups DESC
LIMIT 50;

GRANT SELECT ON leaderboard_view TO anon, authenticated;

-- ========================================
-- 6. TRENDING VENUES VIEW
-- Top venues by event_attendees joined in the last 7 days.
-- Sources: popup_events (venue text), event_attendees (joined_at).
-- ========================================
DROP VIEW IF EXISTS trending_venues_view;
CREATE VIEW trending_venues_view AS
SELECT
  pe.venue AS venue_name,
  COUNT(DISTINCT ea.id)::int AS visits,
  COUNT(DISTINCT ea.user_id)::int AS unique_visitors,
  MAX(ea.joined_at) AS last_visit_at,
  ARRAY_AGG(DISTINCT pe.mode) FILTER (WHERE pe.mode IS NOT NULL) AS modes
FROM popup_events pe
JOIN event_attendees ea ON ea.event_id = pe.id
WHERE pe.venue IS NOT NULL
  AND pe.venue <> ''
  AND ea.joined_at >= now() - INTERVAL '7 days'
GROUP BY pe.venue
ORDER BY visits DESC
LIMIT 20;

GRANT SELECT ON trending_venues_view TO anon, authenticated;

-- ========================================
-- REALTIME (enable for new tables that need it)
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE rooms';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'plans'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE plans';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'flash_plans'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE flash_plans';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'flash_plan_participants'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE flash_plan_participants';
  END IF;
END $$;

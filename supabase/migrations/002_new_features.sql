-- ========================================
-- CeSoir Migration 002: New Features
-- Squads, Feed, Gamification, Events,
-- Safety, Settings, Availability
-- ========================================

-- Ensure uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. SQUADS (Squad Mode)
-- ========================================
CREATE TABLE IF NOT EXISTS squads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  members UUID[] DEFAULT '{}',
  mode TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squads_creator ON squads (creator_id);
CREATE INDEX IF NOT EXISTS idx_squads_created_at ON squads (created_at DESC);

-- ========================================
-- 2. SQUAD INVITES
-- ========================================
CREATE TABLE IF NOT EXISTS squad_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE CHECK (char_length(code) = 6),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squad_invites_squad ON squad_invites (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_invites_code ON squad_invites (code);
CREATE INDEX IF NOT EXISTS idx_squad_invites_created_at ON squad_invites (created_at DESC);

-- ========================================
-- 3. FEED ACTIVITIES
-- ========================================
CREATE TABLE IF NOT EXISTS feed_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('availability', 'looking', 'area', 'trending')),
  content TEXT NOT NULL DEFAULT '',
  mode TEXT,
  lat FLOAT,
  lng FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_activities_user ON feed_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_activities_type ON feed_activities (type);
CREATE INDEX IF NOT EXISTS idx_feed_activities_created_at ON feed_activities (created_at DESC);

-- ========================================
-- 4. CHALLENGES (Gamification)
-- ========================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_type TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_user ON challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_created ON challenges (date DESC);

-- ========================================
-- 5. ACHIEVEMENTS
-- ========================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements (user_id);

-- ========================================
-- 6. KARMA TRANSACTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS karma_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_karma_transactions_user ON karma_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_created_at ON karma_transactions (created_at DESC);

-- ========================================
-- 7. STREAKS
-- ========================================
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks (user_id);

-- ========================================
-- 8. REVIEWS (Enhanced - add new columns)
-- The base reviews table already exists in the initial schema.
-- We add the missing columns for the new features.
-- ========================================
DO $$
BEGIN
  -- Add conversation_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;

  -- Add tags if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'tags'
  ) THEN
    ALTER TABLE reviews ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Add anonymous if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'anonymous'
  ) THEN
    ALTER TABLE reviews ADD COLUMN anonymous BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ========================================
-- 9. POPUP EVENTS
-- ========================================
CREATE TABLE IF NOT EXISTS popup_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  mode TEXT,
  lat FLOAT,
  lng FLOAT,
  venue TEXT DEFAULT '',
  event_time TIMESTAMPTZ NOT NULL,
  max_attendees INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_events_creator ON popup_events (creator_id);
CREATE INDEX IF NOT EXISTS idx_popup_events_event_time ON popup_events (event_time);
CREATE INDEX IF NOT EXISTS idx_popup_events_created_at ON popup_events (created_at DESC);

-- ========================================
-- 10. EVENT ATTENDEES
-- ========================================
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES popup_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees (user_id);

-- ========================================
-- 11. TRUSTED CONTACTS (Safety)
-- ========================================
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  share_location BOOLEAN DEFAULT false,
  alert_no_checkin BOOLEAN DEFAULT false,
  share_route BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts (user_id);

-- ========================================
-- 12. CHECKINS (Safety)
-- ========================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'safe', 'alert')),
  started_at TIMESTAMPTZ DEFAULT now(),
  last_checkin_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins (user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_status ON checkins (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins (started_at DESC);

-- ========================================
-- 13. USER SETTINGS
-- ========================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  smart_notifications BOOLEAN DEFAULT true,
  mode_alerts BOOLEAN DEFAULT true,
  match_alerts BOOLEAN DEFAULT true,
  chat_messages BOOLEAN DEFAULT true,
  personality_type TEXT,
  onboarding_completed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings (user_id);

-- ========================================
-- 14. AVAILABILITY
-- ========================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  afternoon BOOLEAN DEFAULT false,
  evening BOOLEAN DEFAULT false,
  night BOOLEAN DEFAULT false,
  repeat_weekly BOOLEAN DEFAULT false,
  UNIQUE(user_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_availability_user ON availability (user_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON availability (day_of_week);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Squads
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad creators can manage their squads"
  ON squads FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Squad members can view squads"
  ON squads FOR SELECT
  USING (auth.uid() = ANY(members) OR auth.uid() = creator_id);

-- Squad Invites
ALTER TABLE squad_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters manage their invites"
  ON squad_invites FOR ALL
  USING (auth.uid() = inviter_id);

CREATE POLICY "Anyone can read invites by code"
  ON squad_invites FOR SELECT
  USING (true);

-- Feed Activities
ALTER TABLE feed_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feed activities are public"
  ON feed_activities FOR SELECT
  USING (true);

CREATE POLICY "Users manage own feed activities"
  ON feed_activities FOR ALL
  USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own challenges"
  ON challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own challenges"
  ON challenges FOR ALL
  USING (auth.uid() = user_id);

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are public"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Users manage own achievements"
  ON achievements FOR ALL
  USING (auth.uid() = user_id);

-- Karma Transactions
ALTER TABLE karma_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own karma"
  ON karma_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own karma"
  ON karma_transactions FOR ALL
  USING (auth.uid() = user_id);

-- Streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streaks are public"
  ON streaks FOR SELECT
  USING (true);

CREATE POLICY "Users manage own streak"
  ON streaks FOR ALL
  USING (auth.uid() = user_id);

-- Popup Events
ALTER TABLE popup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are public"
  ON popup_events FOR SELECT
  USING (true);

CREATE POLICY "Creators manage own events"
  ON popup_events FOR ALL
  USING (auth.uid() = creator_id);

-- Event Attendees
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees are public"
  ON event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Users manage own attendance"
  ON event_attendees FOR ALL
  USING (auth.uid() = user_id);

-- Trusted Contacts
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own contacts"
  ON trusted_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own contacts"
  ON trusted_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Checkins
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own checkins"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own checkins"
  ON checkins FOR ALL
  USING (auth.uid() = user_id);

-- User Settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is public"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "Users manage own availability"
  ON availability FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- REALTIME (enable for new tables that need it)
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE feed_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE popup_events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_attendees;

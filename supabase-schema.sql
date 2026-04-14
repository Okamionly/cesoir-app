-- ========================================
-- CeSoir Database Schema
-- Supabase PostgreSQL + PostGIS
-- ========================================

-- Enable PostGIS for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- 1. PROFILES
-- ========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  gender TEXT NOT NULL CHECK (gender IN ('homme', 'femme', 'autre')),
  looking_for TEXT NOT NULL CHECK (looking_for IN ('hommes', 'femmes', 'tous')),
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  city TEXT DEFAULT 'Paris',
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for geolocation queries
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_profiles_online ON profiles (is_online) WHERE is_online = true;

-- ========================================
-- 2. MODE ACTIVATIONS
-- ========================================
CREATE TABLE mode_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN (
    'solo-diner', 'plus-one', 'tourist', 'night-owl',
    'breakup', 'new-in-town', 'langue', 'dog-date', 'seasonal'
  )),
  is_active BOOLEAN DEFAULT true,
  available_time TEXT DEFAULT 'Dispo maintenant',
  details JSONB DEFAULT '{}',
  -- solo-diner: {"cuisine": "Japonais"}
  -- plus-one: {"event": "Concert Jazz", "event_type": "Concert", "venue": "Sunset"}
  -- tourist: {"from": "New York", "badge": "Touriste", "langs": ["EN","FR"]}
  -- night-owl: {}
  -- breakup: {"safe": true}
  -- new-in-town: {"since": "2 semaines", "neighborhood": "Bastille", "ambassador": false}
  -- langue: {"speaks": ["FR","EN"], "learns": "Japonais", "level": "A2"}
  -- dog-date: {"dog_name": "Rex", "breed": "Golden Retriever", "dog_age": "3 ans"}
  -- seasonal: {"event_type": "noel"}
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '12 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mode)
);

CREATE INDEX idx_mode_activations_active ON mode_activations (mode, is_active) WHERE is_active = true;

-- ========================================
-- 3. MATCHES / INTERACTIONS
-- ========================================
CREATE TABLE interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'superlike', 'report', 'block')),
  mode TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user, to_user)
);

CREATE INDEX idx_interactions_to ON interactions (to_user, action);

-- Matches view (mutual likes)
CREATE VIEW matches AS
SELECT
  a.from_user AS user_a,
  a.to_user AS user_b,
  a.mode,
  GREATEST(a.created_at, b.created_at) AS matched_at
FROM interactions a
JOIN interactions b ON a.from_user = b.to_user AND a.to_user = b.from_user
WHERE a.action IN ('like', 'superlike')
  AND b.action IN ('like', 'superlike')
  AND a.from_user < a.to_user;

-- ========================================
-- 4. CONVERSATIONS & MESSAGES
-- ========================================
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

CREATE INDEX idx_conversations_users ON conversations (user_a, user_b);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);

-- ========================================
-- 5. REVIEWS (post-meeting)
-- ========================================
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  mode TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reviewer_id, reviewed_id)
);

CREATE INDEX idx_reviews_reviewed ON reviews (reviewed_id);

-- ========================================
-- 6. REPORTS
-- ========================================
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'fake_profile', 'harassment', 'inappropriate_content',
    'spam', 'underage', 'scam', 'other'
  )),
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- 7. RPC FUNCTIONS
-- ========================================

-- Find nearby profiles with distance
CREATE OR REPLACE FUNCTION nearby_profiles(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10,
  mode_filter TEXT DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  age INTEGER,
  gender TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN,
  distance_km FLOAT,
  mode TEXT,
  available_time TEXT,
  mode_details JSONB,
  lat FLOAT,
  lng FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.age,
    p.gender,
    p.bio,
    p.avatar_url,
    p.is_verified,
    ST_Distance(p.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000 AS distance_km,
    ma.mode,
    ma.available_time,
    ma.details AS mode_details,
    ST_Y(p.location::geometry) AS lat,
    ST_X(p.location::geometry) AS lng
  FROM profiles p
  LEFT JOIN mode_activations ma ON ma.user_id = p.id AND ma.is_active = true
  WHERE p.is_online = true
    AND p.location IS NOT NULL
    AND ST_DWithin(p.location, ST_MakePoint(user_lng, user_lat)::geography, radius_km * 1000)
    AND (mode_filter IS NULL OR ma.mode = mode_filter)
    AND (gender_filter IS NULL OR p.gender = gender_filter)
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Update user location
CREATE OR REPLACE FUNCTION update_location(
  user_id UUID,
  lat FLOAT,
  lng FLOAT
) RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET location = ST_MakePoint(lng, lat)::geography,
      is_online = true,
      last_seen = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. ROW LEVEL SECURITY
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read public info, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Mode activations: viewable by all, editable by owner
CREATE POLICY "Mode activations viewable" ON mode_activations FOR SELECT USING (true);
CREATE POLICY "Users manage own modes" ON mode_activations FOR ALL USING (auth.uid() = user_id);

-- Interactions: only between involved users
CREATE POLICY "Users manage own interactions" ON interactions FOR ALL USING (auth.uid() = from_user);
CREATE POLICY "Users can see interactions to them" ON interactions FOR SELECT USING (auth.uid() = to_user);

-- Conversations: only participants
CREATE POLICY "Conversation participants only" ON conversations FOR SELECT USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IN (user_a, user_b));

-- Messages: only conversation participants
CREATE POLICY "Message participants only" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND auth.uid() IN (c.user_a, c.user_b)
  ));
CREATE POLICY "Users can send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND auth.uid() IN (c.user_a, c.user_b)
  ));

-- Reviews: public read, owner write
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reports: only reporter can see their own
CREATE POLICY "Users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users see own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- ========================================
-- 9. REALTIME (enable for chat)
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

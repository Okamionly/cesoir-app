-- Migration 008 — Consolidate 4 "plan ce soir" systems into unified flash_plans
-- Date: 2026-04-19
-- Scope: merge popup_events + event_attendees into flash_plans + flash_plan_participants
--        add `type` column (flash | soiree | popup | match) to distinguish UX flavors
--        keep `plans` table untouched (it is the 1:1 post-match flow, distinct concept)

BEGIN;

-- 1. Add `type` column with default 'flash' for existing rows
ALTER TABLE flash_plans
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'flash'
  CHECK (type IN ('flash', 'soiree', 'popup', 'match'));

-- 2. Add optional fields that popup_events / soirees use so all UX variants fit
ALTER TABLE flash_plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ambiance text,
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS budget text;

-- 3. Migrate data from popup_events → flash_plans (type='popup')
INSERT INTO flash_plans (
  id, creator_id, title, what, where_text, when_at, deadline,
  max_participants, mode, status, created_at,
  type, description, lat, lng, venue, tags
)
SELECT
  pe.id,
  pe.creator_id,
  pe.title,
  COALESCE(pe.description, '') AS what,
  COALESCE(pe.venue, '') AS where_text,
  pe.event_time AS when_at,
  pe.event_time AS deadline, -- popup_events have no deadline, reuse event_time
  COALESCE(pe.max_attendees, 0) AS max_participants,
  pe.mode,
  'open'::text AS status,
  COALESCE(pe.created_at, now()) AS created_at,
  'popup'::text AS type,
  pe.description,
  pe.lat,
  pe.lng,
  pe.venue,
  pe.tags
FROM popup_events pe
ON CONFLICT (id) DO NOTHING;

-- 4. Migrate event_attendees → flash_plan_participants
INSERT INTO flash_plan_participants (
  id, flash_plan_id, user_id, status, joined_at
)
SELECT
  ea.id,
  ea.event_id AS flash_plan_id,
  ea.user_id,
  'accepted'::text AS status,
  COALESCE(ea.joined_at, now()) AS joined_at
FROM event_attendees ea
ON CONFLICT (id) DO NOTHING;

-- 5. Drop old tables (cascade to remove FKs, policies, indexes)
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS popup_events CASCADE;

-- 6. Index on type for filter queries
CREATE INDEX IF NOT EXISTS flash_plans_type_idx ON flash_plans (type);
CREATE INDEX IF NOT EXISTS flash_plans_when_at_idx ON flash_plans (when_at);

COMMIT;

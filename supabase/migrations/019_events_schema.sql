-- ========================================================================
-- Migration 019: Events & RSVPs (Shotgun-inspired Soirées rubric)
-- ========================================================================
-- Introduces the two tables that back the new "Soirées" tab:
--   events       — curated event listings (admin-managed at launch)
--   event_rsvps  — per-user RSVP records (interested/going/maybe/cancelled)
--
-- Design decisions (cross-referenced with Wave 14 plan):
--   - All events curated manually at launch → writes go through service_role
--     only; no user-facing INSERT/UPDATE policy on `events`.
--   - Geography stored with PostGIS (matches the `profiles.location` pattern
--     already used in migrations 004+). Enables radius queries later.
--   - `door_price_eur` is informational — CeSoir does not sell tickets. The
--     optional `ticket_url` points at Shotgun/Dice when relevant.
--   - Event categories live in a dedicated enum so we can index with GIN and
--     filter efficiently from the client (categories is an array — an event
--     may be `{techno, club, night-owl}`).
--   - `featured` flag is a simple pin for editorial / future sponsored slots.
--   - `events_with_counts` view is `SECURITY INVOKER` (explicit) so RLS from
--     the caller applies to the underlying tables — avoids the Supabase
--     linter "security_definer_view" warning.
-- ========================================================================

-- ---- Enums ----

CREATE TYPE public.event_category AS ENUM (
  'techno', 'house', 'hip_hop', 'jazz', 'electro', 'rock', 'reggae',
  'pop', 'afro', 'indie', 'dj_set', 'live_music',
  'rooftop', 'bar', 'club', 'festival', 'open_air',
  'gratuit', 'apero', 'afterwork', 'brunch',
  'culture', 'expo', 'cinema', 'theatre'
);

CREATE TYPE public.rsvp_status AS ENUM (
  'interested', 'going', 'maybe', 'cancelled'
);

-- ---- events table ----

CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  flyer_url       TEXT,
  venue_name      TEXT NOT NULL,
  venue_address   TEXT,
  venue_location  GEOGRAPHY(POINT, 4326) NOT NULL,
  city_slug       TEXT NOT NULL DEFAULT 'montpellier',
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  door_price_eur  NUMERIC(6, 2),                                 -- NULL/0 = gratuit, info only
  ticket_url      TEXT,                                          -- external (Shotgun/Dice)
  categories      public.event_category[] NOT NULL DEFAULT '{}'::public.event_category[],
  lineup          TEXT[] NOT NULL DEFAULT '{}'::text[],
  featured        BOOLEAN NOT NULL DEFAULT false,
  is_cancelled    BOOLEAN NOT NULL DEFAULT false,
  source          TEXT NOT NULL DEFAULT 'manual_curated',        -- 'manual_curated' | 'partner' | 'api'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_ends_after_starts CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT events_door_price_positive CHECK (door_price_eur IS NULL OR door_price_eur >= 0)
);

COMMENT ON TABLE public.events IS 'Shotgun-inspired curated event listings. Writes via service_role only at launch.';
COMMENT ON COLUMN public.events.door_price_eur IS 'Informational only — CeSoir does not sell tickets. NULL or 0 means free entry.';
COMMENT ON COLUMN public.events.ticket_url IS 'External ticket URL (Shotgun, Dice, etc.) if the venue uses a ticketing provider.';
COMMENT ON COLUMN public.events.source IS 'Provenance of the record: manual_curated (admin), partner (B2B self-serve), api (imported).';

CREATE INDEX idx_events_starts_at
  ON public.events (starts_at DESC)
  WHERE is_cancelled = false;

CREATE INDEX idx_events_city
  ON public.events (city_slug, starts_at);

CREATE INDEX idx_events_categories
  ON public.events USING GIN (categories);

CREATE INDEX idx_events_location
  ON public.events USING GIST (venue_location);

CREATE INDEX idx_events_featured
  ON public.events (featured, starts_at)
  WHERE featured = true;

-- updated_at trigger (reuse the existing pattern from other tables)
CREATE OR REPLACE FUNCTION public.events_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.events_touch_updated_at();

-- ---- event_rsvps table ----

CREATE TABLE public.event_rsvps (
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      public.rsvp_status NOT NULL DEFAULT 'interested',
  plus_ones   INT NOT NULL DEFAULT 0 CHECK (plus_ones >= 0 AND plus_ones <= 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

COMMENT ON TABLE public.event_rsvps IS 'User RSVPs to events. Users can only manage their own row; reads are public for counts + social proof.';
COMMENT ON COLUMN public.event_rsvps.plus_ones IS 'Additional guests the user is bringing (0–5). Used for venue capacity estimates.';

CREATE INDEX idx_rsvps_user
  ON public.event_rsvps (user_id, created_at DESC);

CREATE INDEX idx_rsvps_event_status
  ON public.event_rsvps (event_id, status);

CREATE TRIGGER trg_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.events_touch_updated_at();

-- ---- RLS ----

ALTER TABLE public.events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps  ENABLE ROW LEVEL SECURITY;

-- Events : readable by any authenticated user. No INSERT/UPDATE/DELETE policy
-- is defined → only service_role (which bypasses RLS) can write. This is the
-- intended curated-CMS behaviour at launch.
CREATE POLICY "Events readable by authenticated"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

-- RSVPs : anyone auth'd can see any RSVP (so we can show "3 of your matches
-- going" social proof). Each user manages only their own row.
CREATE POLICY "RSVPs readable by authenticated"
  ON public.event_rsvps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users insert own rsvp"
  ON public.event_rsvps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rsvp"
  ON public.event_rsvps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own rsvp"
  ON public.event_rsvps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- Counts view ----
-- `events_with_counts` bundles the RSVP aggregates so a list screen can
-- render in one query. Marked SECURITY INVOKER so downstream RLS applies.

CREATE OR REPLACE VIEW public.events_with_counts
WITH (security_invoker = true) AS
SELECT
  e.*,
  COALESCE(r.rsvp_count,   0) AS rsvp_count,
  COALESCE(r.going_count,  0) AS going_count
FROM public.events e
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE status IN ('going', 'maybe', 'interested')) AS rsvp_count,
    COUNT(*) FILTER (WHERE status = 'going')                            AS going_count
  FROM public.event_rsvps
  WHERE event_id = e.id
) r ON true;

COMMENT ON VIEW public.events_with_counts IS 'Events with RSVP aggregates (rsvp_count, going_count). SECURITY INVOKER — RLS from caller applies.';

-- Grant usage on the enums (so the supabase-js type generation picks them up
-- and PostgREST exposes them in OpenAPI).
GRANT USAGE ON TYPE public.event_category TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.rsvp_status    TO anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════
-- Migration 048 — Saved Searches (Wave 17)
--
-- Concept
-- ───────
-- Power users use specific filter combos repeatedly. Let them
-- bookmark-and-name them ("Jazz weekend", "Foodie 5km gratuit") and
-- surface them as quick-access chips at the top of the filter UI on
-- /events, /map, and (later) /browse.
--
-- One row = one saved search. The filters payload is opaque JSON
-- because every surface has its own filter shape (EventFiltersState
-- vs MapFilters vs the future BrowseFilters). Storing it as JSONB
-- keeps the schema flexible — the client owns the apply/restore
-- logic per surface.
--
-- Constraints / invariants
-- ────────────────────────
-- * `name` is 1..30 chars (NOT NULL CHECK). Profanity is intentionally
--   NOT checked here — same policy as profile bios. Add a separate
--   moderation pass later if abuse shows up.
-- * `surface` is one of 'events' | 'map' | 'browse'. Stored as TEXT +
--   CHECK rather than an enum so adding a 4th surface later does not
--   require a migration on the type.
-- * Hard cap of 10 saved searches per user per surface — enforced
--   inside the INSERT path via a BEFORE trigger. We can't use a UNIQUE
--   index for "max N rows" so a trigger is the right tool here.
-- * `last_used_at` is updated when the user taps a chip to apply the
--   saved search — used by the client to sort by recently used.
--
-- RLS
-- ───
-- Strict per-owner: SELECT/INSERT/UPDATE/DELETE only on rows where
-- user_id = auth.uid(). No service-role bypass needed for clients.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- -------------------------------------------------------------------
-- 1. Table
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  surface       TEXT NOT NULL,
  filters       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ,

  CONSTRAINT saved_searches_name_length
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 30),

  CONSTRAINT saved_searches_surface_valid
    CHECK (surface IN ('events', 'map', 'browse')),

  CONSTRAINT saved_searches_filters_is_object
    CHECK (jsonb_typeof(filters) = 'object')
);

-- Hot-path indices:
--   * Primary list query: "show me my saved searches for surface X,
--     sorted by recently used then created". Compound index covers it.
--   * Cap-enforcement trigger uses (user_id, surface) — same prefix.
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_surface
  ON public.saved_searches (user_id, surface, last_used_at DESC NULLS LAST, created_at DESC);

COMMENT ON TABLE public.saved_searches IS
  'Wave 17 saved-search bookmarks. One row per (user, name, surface).
   Filters payload is opaque JSON owned by the surface that wrote it.
   Hard cap of 10 per user per surface enforced via trigger.';

COMMENT ON COLUMN public.saved_searches.surface IS
  'events | map | browse — which filter UI owns this saved search';

COMMENT ON COLUMN public.saved_searches.filters IS
  'Opaque filter payload — shape depends on surface (EventFiltersState
   for events, MapFilters for map, etc.). JSON object, never null.';

COMMENT ON COLUMN public.saved_searches.last_used_at IS
  'Stamped each time the user taps the chip to apply this search.
   NULL until first use. Drives the "recently used" sort order.';

-- -------------------------------------------------------------------
-- 2. RLS — strict per-owner on every verb
-- -------------------------------------------------------------------

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_searches_owner_select" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_owner_insert" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_owner_update" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_owner_delete" ON public.saved_searches;

CREATE POLICY "saved_searches_owner_select"
  ON public.saved_searches FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_owner_insert"
  ON public.saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_owner_update"
  ON public.saved_searches FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_owner_delete"
  ON public.saved_searches FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------
-- 3. Per-(user, surface) cap of 10 — BEFORE INSERT trigger
-- -------------------------------------------------------------------
-- Cannot be expressed as a UNIQUE constraint, so we enforce it at the
-- application boundary. The check runs only on INSERT — UPDATE/DELETE
-- can never push the count over the cap.

CREATE OR REPLACE FUNCTION public.enforce_saved_searches_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.saved_searches
  WHERE user_id = NEW.user_id
    AND surface = NEW.surface;

  IF current_count >= 10 THEN
    RAISE EXCEPTION
      'saved_searches: cap reached (10 per surface). Delete one before saving a new search.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_searches_cap_trigger ON public.saved_searches;
CREATE TRIGGER saved_searches_cap_trigger
  BEFORE INSERT ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_saved_searches_cap();

COMMENT ON FUNCTION public.enforce_saved_searches_cap() IS
  'BEFORE INSERT trigger enforcing the 10-per-(user, surface) cap on
   saved_searches. Spec is per-surface so a power user can have 10
   /events combos AND 10 /map combos simultaneously.';

COMMIT;

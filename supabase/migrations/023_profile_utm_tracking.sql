-- ============================================================================
-- Migration 023 — UTM tracking & acquisition channel on profiles
-- ============================================================================
-- Wave 15 · CFO 10/10 (2026-04-23)
--
-- Goal: provide CAC attribution without adding a heavy analytics warehouse.
-- Each profile now carries the FIRST campaign that brought the user in, the
-- channel that was inferred from it, and a canonical first-visit timestamp.
--
-- Design:
--   * Single-touch attribution (first non-empty utm_source wins).
--   * Mirrored client-side in localStorage `cesoir_utm` so the values survive
--     across tabs until the server write happens post register.
--   * `acquisition_channel` is a coarse bucket (paid | organic | referral |
--     direct | social | email | unknown) derived by the client-side helper
--     `inferChannel()` in `src/lib/analytics.ts`.
--
-- Payback / LTV math relies on these columns — see docs/finance/UNIT_ECONOMICS.md.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'profiles table missing — skipping 023 UTM tracking';
    RETURN;
  END IF;

  -- utm_source (e.g. "meta", "tiktok", "producthunt")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN utm_source TEXT;
  END IF;

  -- utm_medium (e.g. "cpc", "organic", "referral")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'utm_medium'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN utm_medium TEXT;
  END IF;

  -- utm_campaign (e.g. "launch_mtp_spring26")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'utm_campaign'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN utm_campaign TEXT;
  END IF;

  -- utm_content (e.g. "video_a", "carousel_b")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN utm_content TEXT;
  END IF;

  -- acquisition_channel: coarse bucket used in CFO dashboards
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'acquisition_channel'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN acquisition_channel TEXT;

    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_acquisition_channel_check
      CHECK (
        acquisition_channel IS NULL OR acquisition_channel IN (
          'paid', 'organic', 'referral', 'direct',
          'social', 'email', 'unknown'
        )
      );
  END IF;

  -- first_visit_at: raw landing timestamp captured from the browser
  -- (can be earlier than `created_at` when a user bounces before signup).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'first_visit_at'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN first_visit_at TIMESTAMPTZ;
  END IF;

  -- referrer_url: raw document.referrer (host only, not the full URL) for
  -- organic / referral debugging. Not a PII concern — only a domain string.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'referrer_host'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referrer_host TEXT;
  END IF;
END $$;

-- Indexes support "conversion rate by channel" queries without scanning the
-- full profiles table. The partial index keeps them tiny since most users
-- are organic/null.

CREATE INDEX IF NOT EXISTS idx_profiles_utm_source
  ON public.profiles (utm_source)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_utm_campaign
  ON public.profiles (utm_campaign)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_acquisition_channel
  ON public.profiles (acquisition_channel)
  WHERE acquisition_channel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_first_visit_at
  ON public.profiles (first_visit_at)
  WHERE first_visit_at IS NOT NULL;

-- Comment the columns so the Supabase dashboard shows intent.
COMMENT ON COLUMN public.profiles.utm_source IS
  'First-touch utm_source captured at landing (wave 15 CFO).';
COMMENT ON COLUMN public.profiles.utm_medium IS
  'First-touch utm_medium captured at landing (wave 15 CFO).';
COMMENT ON COLUMN public.profiles.utm_campaign IS
  'First-touch utm_campaign captured at landing (wave 15 CFO).';
COMMENT ON COLUMN public.profiles.utm_content IS
  'First-touch utm_content (A/B variant) captured at landing.';
COMMENT ON COLUMN public.profiles.acquisition_channel IS
  'Coarse bucket derived by inferChannel(): paid | organic | referral | direct | social | email | unknown.';
COMMENT ON COLUMN public.profiles.first_visit_at IS
  'Browser-side timestamp of the very first page-load for this user. May precede auth.users.created_at.';
COMMENT ON COLUMN public.profiles.referrer_host IS
  'Host portion of document.referrer at first visit (e.g. "google.com", "instagram.com"). Never the full URL, no query string.';

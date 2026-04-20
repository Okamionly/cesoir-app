-- ============================================================================
-- Migration 011: Extend user_settings with preference columns
-- ============================================================================
-- Adds JSON preference buckets + tonight_chips mirror so profile/settings
-- pages can persist to Supabase instead of localStorage-only. Existing RLS
-- (Users manage own settings FOR ALL WHERE auth.uid() = user_id) already
-- covers these new columns, so no additional policy work is required.
--
-- Applied via MCP apply_migration on 2026-04-20.
-- ============================================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS tonight_chips text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS notifications_prefs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_prefs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS app_prefs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-bump updated_at on every UPDATE so clients can detect stale state.
CREATE OR REPLACE FUNCTION public.user_settings_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_settings_touch_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_touch_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.user_settings_touch_updated_at();

COMMENT ON COLUMN public.user_settings.tonight_chips IS
  'Activity chips selected on /profile (Diner, Boire un verre, Cinema, Balade, Concert, Sport, ...). Text array for flexible growth.';

COMMENT ON COLUMN public.user_settings.notifications_prefs IS
  'JSON bucket for fine-grained notification toggles. Keys: matches, likes, messages, events, feed, challenges, reminder17h, newsletter. Client merges with defaults.';

COMMENT ON COLUMN public.user_settings.privacy_prefs IS
  'JSON bucket for privacy toggles. Keys: profile_visible, location_blur (exact|block|km), women_first, invisible, blocked_users[].';

COMMENT ON COLUMN public.user_settings.app_prefs IS
  'JSON bucket for app-level prefs mirrored from localStorage. Keys: dark_mode (auto|light|dark), reduced_motion, language (fr|en), font_size, sounds, women_first.';

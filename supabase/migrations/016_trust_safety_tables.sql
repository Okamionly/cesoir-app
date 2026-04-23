-- ============================================================================
-- Migration 016 - Trust & Safety tables (V5 Wave 15)
-- Applied via Supabase MCP on 2026-04-23.
-- Creates: sos_events, user_reports, user_blocks, moderation_queue, user_strikes
-- Fixes the ghost `reports` table referenced by migration 009's policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy_meters INT,
  contacts_notified INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('triggered','resolved','false_alarm')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_events_user ON public.sos_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_events_status ON public.sos_events(status) WHERE status='triggered';
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own SOS" ON public.sos_events;
CREATE POLICY "Users insert own SOS" ON public.sos_events FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "Users view own SOS" ON public.sos_events;
CREATE POLICY "Users view own SOS" ON public.sos_events FOR SELECT TO authenticated USING (auth.uid()=user_id);

DO $$ BEGIN
  CREATE TYPE public.report_reason AS ENUM (
    'fake_profile','harassment','inappropriate_content','spam',
    'underage','violence_threat','catfish','scam','other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason public.report_reason NOT NULL,
  details TEXT CHECK (length(details)<=2000),
  context_type TEXT CHECK (context_type IN ('profile','chat','room','plan','match','event')),
  context_id UUID,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewing','actioned','dismissed','escalated')),
  priority INT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON public.user_reports(status,priority,created_at) WHERE status IN ('pending','reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.user_reports(reported_id,created_at DESC);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users create reports" ON public.user_reports;
CREATE POLICY "Users create reports" ON public.user_reports FOR INSERT TO authenticated WITH CHECK (auth.uid()=reporter_id);
DROP POLICY IF EXISTS "Users view own reports" ON public.user_reports;
CREATE POLICY "Users view own reports" ON public.user_reports FOR SELECT TO authenticated USING (auth.uid()=reporter_id);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.user_blocks(blocked_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own blocks" ON public.user_blocks;
CREATE POLICY "Users manage own blocks" ON public.user_blocks FOR ALL TO authenticated USING (auth.uid()=blocker_id) WITH CHECK (auth.uid()=blocker_id);

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('photo','message','profile','bio')),
  item_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_source TEXT CHECK (flag_source IN ('nsfw_js','sightengine','openai_mod','keyword','user_report','manual')),
  flag_score NUMERIC(3,2) CHECK (flag_score BETWEEN 0 AND 1),
  flag_categories TEXT[] DEFAULT '{}',
  auto_hidden BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','escalated')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mod_queue_pending ON public.moderation_queue(status,flag_score DESC) WHERE status='pending';
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strike_type TEXT CHECK (strike_type IN ('warning','timeout_24h','timeout_7d','ban_permanent')),
  reason TEXT NOT NULL,
  related_report_id UUID REFERENCES public.user_reports(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_strikes_user ON public.user_strikes(user_id, created_at DESC);
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own strikes" ON public.user_strikes;
CREATE POLICY "Users view own strikes" ON public.user_strikes FOR SELECT TO authenticated USING (auth.uid()=user_id);

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN hidden BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE OR REPLACE FUNCTION public.auto_hide_profile() RETURNS TRIGGER AS $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO cnt FROM public.user_reports
  WHERE reported_id = NEW.reported_id
    AND created_at > now() - interval '48 hours'
    AND status = 'pending';
  IF cnt >= 3 THEN
    UPDATE public.profiles SET hidden = true WHERE id = NEW.reported_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

DROP TRIGGER IF EXISTS trg_auto_hide ON public.user_reports;
CREATE TRIGGER trg_auto_hide AFTER INSERT ON public.user_reports FOR EACH ROW EXECUTE FUNCTION public.auto_hide_profile();

DROP POLICY IF EXISTS "Users report" ON public.reports;
DROP POLICY IF EXISTS "Users see own reports" ON public.reports;

-- profile_verifications (Migration 016b — split for atomicity)
CREATE TABLE IF NOT EXISTS public.profile_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('selfie','phone','video','social','document')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE (user_id, method)
);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_user ON public.profile_verifications(user_id);
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own verifications" ON public.profile_verifications;
CREATE POLICY "Users view own verifications" ON public.profile_verifications FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "Users insert own verifications" ON public.profile_verifications;
CREATE POLICY "Users insert own verifications" ON public.profile_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "Users update own verifications" ON public.profile_verifications;
CREATE POLICY "Users update own verifications" ON public.profile_verifications FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

COMMENT ON TABLE public.sos_events IS 'V5 Wave15: SOS trigger log';
COMMENT ON TABLE public.user_reports IS 'V5 Wave15: User reports (replaces orphan reports from 009)';
COMMENT ON TABLE public.user_blocks IS 'V5 Wave15: Mutual block list';
COMMENT ON TABLE public.moderation_queue IS 'V5 Wave15: Auto-flagged content for admin review';
COMMENT ON TABLE public.user_strikes IS 'V5 Wave15: Progressive ban ledger';
COMMENT ON TABLE public.profile_verifications IS 'V5 Wave15: Multi-method verification ledger';

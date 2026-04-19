-- ═══════════════════════════════════════════════════════════════════
-- Migration 007 — Server-side state migration (roses / undos / caps)
--
-- Audit 2026-04-19 (ARCH_FUNCTIONING) found that business logic payante
-- / anti-cheat vivait uniquement côté client (localStorage) :
--   • cesoir_roses (balance) — currency payante
--   • cesoir-swipe-undos (daily count) — anti-cheat cap
--   • cesoir_match_cap (likes/jour) — free tier limit
--
-- Un user qui clear localStorage bypass roses, undos, match cap. Cette
-- migration crée les tables côté serveur, les écritures passeront par
-- des API routes (service_role via /api/wallet/roses, /api/undos).
--
-- Fixe aussi 2 vues SECURITY DEFINER (leaderboard_view, trending_venues_view)
-- qui étaient ERROR-level dans l'advisor : recréées en SECURITY INVOKER
-- pour respecter les RLS de l'appelant.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- Table : user_wallet — balance Roses (currency payante)
-- INSERT/UPDATE via service_role uniquement (API wallet/roses)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  roses_balance integer NOT NULL DEFAULT 0 CHECK (roses_balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_wallet_user_id ON public.user_wallet(user_id);

-- Trigger : updated_at automatique
CREATE OR REPLACE FUNCTION public.set_user_wallet_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_wallet_updated_at ON public.user_wallet;
CREATE TRIGGER trg_user_wallet_updated_at
  BEFORE UPDATE ON public.user_wallet
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_wallet_updated_at();

ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_wallet_select_own" ON public.user_wallet;
CREATE POLICY "user_wallet_select_own"
  ON public.user_wallet
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- PAS de policy INSERT/UPDATE client : uniquement service_role via API
-- (même pattern que subscriptions/purchases).

GRANT SELECT ON public.user_wallet TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- Table : swipe_undos — historique d'undos (anti-cheat daily cap)
-- L'utilisateur peut insérer/supprimer ses propres lignes via API.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.swipe_undos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_action text NOT NULL CHECK (original_action IN ('like','pass','superlike')),
  undone_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swipe_undos_user_id ON public.swipe_undos(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_undos_user_date ON public.swipe_undos(user_id, undone_at DESC);

ALTER TABLE public.swipe_undos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swipe_undos_select_own" ON public.swipe_undos;
CREATE POLICY "swipe_undos_select_own"
  ON public.swipe_undos
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "swipe_undos_insert_own" ON public.swipe_undos;
CREATE POLICY "swipe_undos_insert_own"
  ON public.swipe_undos
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "swipe_undos_delete_own" ON public.swipe_undos;
CREATE POLICY "swipe_undos_delete_own"
  ON public.swipe_undos
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, DELETE ON public.swipe_undos TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- Table : match_caps — compteur likes/jour (free tier limit serveur)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_caps (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  likes_today integer NOT NULL DEFAULT 0 CHECK (likes_today >= 0),
  resets_at timestamptz NOT NULL DEFAULT (now() + interval '1 day')
);

CREATE INDEX IF NOT EXISTS idx_match_caps_user_id ON public.match_caps(user_id);

ALTER TABLE public.match_caps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_caps_select_own" ON public.match_caps;
CREATE POLICY "match_caps_select_own"
  ON public.match_caps
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "match_caps_insert_own" ON public.match_caps;
CREATE POLICY "match_caps_insert_own"
  ON public.match_caps
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "match_caps_update_own" ON public.match_caps;
CREATE POLICY "match_caps_update_own"
  ON public.match_caps
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON public.match_caps TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- Fix : 2 vues SECURITY DEFINER (ERROR-level advisor)
-- Problème : les vues s'exécutaient avec les droits du créateur
-- (bypass RLS de l'appelant). Fix : recréer en SECURITY INVOKER.
-- ═══════════════════════════════════════════════════════════════════

-- ─── leaderboard_view ────────────────────────────────────────────────
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true) AS
WITH likes AS (
  SELECT interactions.to_user AS user_id,
         (count(*))::integer AS likes_received
    FROM public.interactions
   WHERE (interactions.action = ANY (ARRAY['like'::text, 'superlike'::text]))
   GROUP BY interactions.to_user
), convos AS (
  SELECT c_1.user_id,
         (count(DISTINCT c_1.conv_id))::integer AS conversations
    FROM (
      SELECT conversations.user_a AS user_id,
             conversations.id AS conv_id
        FROM public.conversations
       UNION ALL
      SELECT conversations.user_b AS user_id,
             conversations.id AS conv_id
        FROM public.conversations
    ) c_1
   GROUP BY c_1.user_id
), karma AS (
  SELECT karma_transactions.user_id,
         (COALESCE(sum(karma_transactions.amount), (0)::bigint))::integer AS karma
    FROM public.karma_transactions
   GROUP BY karma_transactions.user_id
)
SELECT p.id,
       p.name,
       p.avatar_url,
       p.is_verified,
       p.total_meetups,
       p.reliability_score,
       COALESCE(l.likes_received, 0) AS likes_received,
       COALESCE(c.conversations, 0)  AS conversations,
       COALESCE(k.karma, 0)          AS karma
  FROM public.profiles p
  LEFT JOIN likes  l ON (l.user_id = p.id)
  LEFT JOIN convos c ON (c.user_id = p.id)
  LEFT JOIN karma  k ON (k.user_id = p.id)
 ORDER BY COALESCE(k.karma, 0) DESC,
          COALESCE(l.likes_received, 0) DESC,
          p.total_meetups DESC
 LIMIT 50;

GRANT SELECT ON public.leaderboard_view TO authenticated;

-- ─── trending_venues_view ────────────────────────────────────────────
DROP VIEW IF EXISTS public.trending_venues_view;
CREATE VIEW public.trending_venues_view
WITH (security_invoker = true) AS
SELECT pe.venue AS venue_name,
       (count(DISTINCT ea.id))::integer        AS visits,
       (count(DISTINCT ea.user_id))::integer   AS unique_visitors,
       max(ea.joined_at)                       AS last_visit_at,
       array_agg(DISTINCT pe.mode) FILTER (WHERE (pe.mode IS NOT NULL)) AS modes
  FROM public.popup_events pe
  JOIN public.event_attendees ea ON (ea.event_id = pe.id)
 WHERE pe.venue IS NOT NULL
   AND pe.venue <> ''
   AND ea.joined_at >= (now() - interval '7 days')
 GROUP BY pe.venue
 ORDER BY (count(DISTINCT ea.id))::integer DESC
 LIMIT 20;

GRANT SELECT ON public.trending_venues_view TO authenticated;

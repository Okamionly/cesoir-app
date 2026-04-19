-- ═══════════════════════════════════════════════════════════════════
-- Migration 006 — Stripe: subscriptions + purchases (one-time)
--
-- Ajoute l'infrastructure Stripe pour :
--   1) Abonnements récurrents (Premium mensuel/annuel)
--   2) Achats one-time (packs de roses, boosts)
--
-- RLS :
--   - SELECT/UPDATE only self pour les 2 tables
--   - PAS d'INSERT client — le webhook Stripe (service_role) écrit tout
--
-- Indexes :
--   - user_id (lookup par utilisateur)
--   - stripe_subscription_id / stripe_payment_intent_id (lookup webhook)
--   - status (filtrage par état)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- Table : subscriptions
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('active','past_due','canceled','trialing','incomplete','incomplete_expired','unpaid','paused')),
  plan_id text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(stripe_customer_id);

-- Trigger : mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
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

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscriptions_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT : l'utilisateur peut voir sa propre subscription
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE : l'utilisateur peut mettre à jour sa propre subscription (ex: cancel_at_period_end)
-- Pour usage prudent : le vrai update vient du webhook service_role
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
CREATE POLICY "subscriptions_update_own"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pas de policy INSERT/DELETE côté client → service_role uniquement (bypass RLS)

-- ─────────────────────────────────────────────────────────────────────
-- Table : purchases (one-time products : roses packs, boosts, etc.)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  product_type text NOT NULL,
  product_id text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent ON public.purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);

-- RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- SELECT : l'utilisateur voit ses propres purchases
DROP POLICY IF EXISTS "purchases_select_own" ON public.purchases;
CREATE POLICY "purchases_select_own"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE : rarement utile côté client, mais on autorise self pour de futurs cas (rating, etc.)
DROP POLICY IF EXISTS "purchases_update_own" ON public.purchases;
CREATE POLICY "purchases_update_own"
  ON public.purchases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pas de policy INSERT/DELETE côté client → service_role uniquement (webhook)

-- ─────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────
GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.purchases TO authenticated;

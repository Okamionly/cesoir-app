# Infra actions restantes — Supabase + Vercel

**Date** : 2026-04-19
**Status** : je peux pas tout automatiser. Voici ce qui est fait + ce qui reste pour toi (avec commandes exactes).

---

## ✅ Fait autonome

- `NEXT_PUBLIC_APP_URL=https://cesoir-app.vercel.app` → ajouté sur Vercel Production
- Toutes les migrations Supabase 003-010 (sécu + perf + tables) appliquées via MCP
- `subscriptions` + `purchases` tables prêtes à recevoir webhook Stripe
- 2 vues SECURITY DEFINER corrigées
- 60 duplicate policies consolidées (-60 lints)

---

## 🔴 Action 1 — SUPABASE_SERVICE_ROLE_KEY (3 min, impact élevé)

**Pourquoi** : débloquer le `auth.admin.deleteUser()` dans `/api/account/delete` (sinon orphan auth.users = violation RGPD) + webhook Stripe (bypass RLS pour subscriptions/purchases).

**Commandes exactes** :
```bash
# 1. Ouvrir le dashboard + copier la service_role key
open "https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/settings/api"
# Scroll → section "Project API keys" → "service_role" (en rouge/secret) → Copy

# 2. Ajouter sur Vercel prod (depuis le terminal, coller la key quand demandée)
cd "C:/Users/mrgue/CLAUDE CODE/cesoir-app"
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# → paste la key → Enter

# 3. Ajouter aussi local pour dev (OPTIONNEL, seulement pour tester delete/webhook en local)
# Edit .env.local manuellement, ajouter:
#   SUPABASE_SERVICE_ROLE_KEY=<la_key>

# 4. Redeploy prod pour que la var soit active
vercel deploy --prod --yes
```

---

## 🟠 Action 2 — Stripe setup (~30 min, bloquant monétisation)

**Pourquoi** : aujourd'hui `/premium` et `/shop` ont le code infrastructure mais les price IDs sont des placeholders. Sans ces 3 env vars + Dashboard config, le paiement ne marche pas.

**Commandes** : suivre `STRIPE_SETUP.md` à la racine du repo (guide 7 étapes). Une fois Stripe account + produits créés, ajouter :

```bash
vercel env add STRIPE_SECRET_KEY production
# Format: sk_live_... (ou sk_test_... pour phase beta)

vercel env add STRIPE_WEBHOOK_SECRET production
# Format: whsec_...

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Format: pk_live_... (ou pk_test_...)

# Puis redeploy
vercel deploy --prod --yes
```

Configurer aussi dans Stripe Dashboard :
- Créer 2 Products (Premium Monthly + Annual) + 5 Products (Roses packs 5/15/50 + Boosts)
- Copier les Price IDs `price_xxx` dans `src/lib/stripe/plans.ts` (replace les `price_REPLACE_ME_xxx`)
- Activer Customer Portal (Settings → Billing → Customer portal → Activate)
- Créer Webhook endpoint : `https://cesoir-app.vercel.app/api/stripe/webhook` avec events :
  `checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed, payment_intent.succeeded`

---

## 🟡 Action 3 — Supabase HIBP + Pro Plan (2 min, nice-to-have)

**Pourquoi** : check passwords against HaveIBeenPwned lors signup/reset → bloque les passwords leaked. WCAG + user security.

**Limite** : feature **Pro Plan uniquement**. Hobby/Free plan = pas disponible.

**Steps** (si Pro ou après upgrade) :
1. Dashboard → https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/auth/providers
2. Email provider → Password Security
3. Toggle "Prevent use of leaked passwords" → ON
4. Aussi : remonter "Min password length" à 12 (currently 6 default)

---

## 🟡 Action 4 — Dismiss spatial_ref_sys advisor (1 min)

**Pourquoi** : c'est la table système PostGIS, ownership postgres superuser. Impossible d'activer RLS dessus côté user. C'est safe (read-only lookup, pas de user data). Supabase Advisor flagge quand même en ERROR → dismiss pour clean l'advisor panel.

**Steps** :
1. https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/database/security-advisor
2. Trouver `spatial_ref_sys` ERROR
3. Cliquer "..." → Ignore / Dismiss

---

## 🟢 Action 5 — Vercel Pro upgrade (1 min, quand users arrivent)

**Pourquoi** : Vercel Hobby limite les deployments/jour. On a déjà hit la limite plusieurs fois pendant ces sprints (d'où les `vercel deploy --prod --yes` manuels). En prod avec auto-deploy sur push + utilisateurs : Pro recommandé.

**Steps** :
```bash
vercel buy pro
# ou via dashboard : https://vercel.com/pricing
```

---

## Env vars Vercel actuelles

```
NEXT_PUBLIC_SUPABASE_ANON_KEY      ✅ Production
NEXT_PUBLIC_SUPABASE_URL           ✅ Production
NEXT_PUBLIC_APP_URL                ✅ Production (just added)
SUPABASE_SERVICE_ROLE_KEY          ❌ À ajouter (action 1)
STRIPE_SECRET_KEY                  ❌ À ajouter (action 2)
STRIPE_WEBHOOK_SECRET              ❌ À ajouter (action 2)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ❌ À ajouter (action 2)
```

Vérifier : `vercel env ls`

---

## TL;DR — commandes à coller

```bash
# 1. Supabase service role (3 min)
open "https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/settings/api"
# Copy service_role key, then:
cd "C:/Users/mrgue/CLAUDE CODE/cesoir-app"
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 2. Stripe (après avoir créé compte + produits Stripe) :
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# 3. Redeploy quand les env vars sont ajoutées
vercel deploy --prod --yes
```

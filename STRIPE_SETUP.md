# Stripe Setup — CeSoir

Walkthrough pour configurer Stripe sur cesoir-app en Test mode puis Live.

---

## 1. Créer un compte Stripe

1. Aller sur https://dashboard.stripe.com/register
2. Créer le compte avec `mr.guessousyoussef@gmail.com`
3. Activer **Test mode** (toggle en haut à droite) — on ne quitte pas ce mode avant d'être prêt à encaisser
4. Récupérer les clés Test sur https://dashboard.stripe.com/test/apikeys :
   - `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `sk_test_...` → `STRIPE_SECRET_KEY`

---

## 2. Créer les produits dans Stripe Dashboard

### Abonnements (2 plans)

1. **Products** → **Add product**
2. Premium Monthly :
   - Name: `CeSoir Premium Monthly`
   - Price: `9.99 EUR`
   - Billing: `Recurring / Monthly`
   - Trial: `7 days` (optionnel — configuré aussi côté code)
   - Copier le `price_xxx` généré
3. Premium Annual :
   - Name: `CeSoir Premium Annual`
   - Price: `59.99 EUR`
   - Billing: `Recurring / Yearly`
   - Trial: `7 days`
   - Copier le `price_xxx`

### One-time (5 packs)

| Product | Price |
|---|---|
| Roses x5 (Bouquet) | 2.99 EUR one-time |
| Roses x15 (Jardin) | 6.99 EUR one-time |
| Roses x30 (Roseraie) | 9.99 EUR one-time |
| Boosts x3 (Starter) | 3.99 EUR one-time |
| Boosts x10 (Pro) | 9.99 EUR one-time |

Pour chacun : billing = `One-time`. Copier les `price_xxx`.

### Injecter dans le code

Éditer `src/lib/stripe/plans.ts` et remplacer tous les `price_REPLACE_ME_xxx` par les vrais price IDs copiés ci-dessus.

---

## 3. Activer le Customer Portal

Le portail de facturation est utilisé par `/api/stripe/portal` pour que l'user annule / update sa CB.

1. Aller sur https://dashboard.stripe.com/test/settings/billing/portal
2. **Activate portal**
3. Features à cocher :
   - Update payment method
   - Cancel subscriptions (préciser : à la fin de la période)
   - View billing history
4. Branding : logo CeSoir, couleurs #8B5CF6 / #FFF
5. Save

---

## 4. Configurer le Webhook

Le webhook `/api/stripe/webhook` reçoit les événements Stripe et met à jour nos tables `subscriptions` / `purchases`.

### En local (test avec Stripe CLI)

```bash
# 1) Installer le CLI — https://stripe.com/docs/stripe-cli
# 2) Se logger
stripe login

# 3) Forward les events vers ton dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le CLI affiche un `whsec_xxx` → mettre dans `.env.local` comme `STRIPE_WEBHOOK_SECRET`.

Tester :
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### En production (Vercel)

1. Dashboard Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL : `https://cesoir-app.vercel.app/api/stripe/webhook` (remplacer par le vrai domaine)
3. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
4. **Add endpoint** → copier le `Signing secret` (`whsec_xxx`)
5. Le mettre dans les env vars Vercel comme `STRIPE_WEBHOOK_SECRET`

---

## 5. Ajouter les env vars à Vercel

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx   # ou pk_test_ pendant les tests
STRIPE_SECRET_KEY=sk_live_xxx                    # ou sk_test_
STRIPE_WEBHOOK_SECRET=whsec_xxx                  # depuis le webhook endpoint
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # requis par le webhook pour bypass RLS
NEXT_PUBLIC_APP_URL=https://cesoir-app.vercel.app  # optionnel (redirect success/cancel)
```

Via CLI :
```bash
vercel env add STRIPE_SECRET_KEY production
# ... pareil pour les autres
```

---

## 6. Tester le flow complet

### Cartes de test Stripe

| Scénario | Numéro |
|---|---|
| Succès | `4242 4242 4242 4242` |
| 3D Secure requis | `4000 0025 0000 3155` |
| Refus | `4000 0000 0000 9995` |
| Date / CVV | n'importe quoi de valide (ex: `12/34`, `123`) |

### Checklist

- [ ] `/premium` affiche les 2 plans avec les bons prix
- [ ] Click "Essai gratuit 7 jours" → redirect Stripe Checkout
- [ ] Paiement avec 4242... → redirect `/premium?status=success`
- [ ] Webhook reçoit `checkout.session.completed` → ligne dans `subscriptions` (status=`trialing`)
- [ ] Rechargement `/premium` → bouton "Gérer ma subscription"
- [ ] Click → redirect Stripe Billing Portal
- [ ] Annuler la sub dans le portail → webhook `customer.subscription.updated` → `cancel_at_period_end=true`
- [ ] `/shop` → click pack roses → Checkout → retour → ligne dans `purchases` (status=`succeeded`)

---

## 7. Passer en Live

1. Activer le compte Stripe (KYC : nom, adresse, IBAN)
2. Recréer les produits en **Live mode** (ils ne sont pas partagés avec Test)
3. Mettre à jour les price IDs dans `src/lib/stripe/plans.ts`
4. Remplacer les env vars Vercel par les `pk_live_` / `sk_live_`
5. Créer un nouveau webhook endpoint en Live mode
6. Tester avec un vrai paiement (peut être remboursé)

---

## Debug

### "subscriptions" table doesn't exist
La migration 006 n'a pas été appliquée. Run :
```bash
# Via Supabase CLI
supabase db push

# Ou via le MCP Supabase dans Claude
```

### Webhook retourne 400 "Invalid signature"
- Vérifier que `STRIPE_WEBHOOK_SECRET` est bien celui du bon endpoint (test vs live !)
- Vérifier qu'on lit bien le raw body (c'est déjà fait dans notre route)

### Stripe Checkout ne s'ouvre pas
- Ouvrir la console DevTools → Network → regarder la réponse `/api/stripe/checkout`
- Si 503 → `STRIPE_SECRET_KEY` manquante
- Si 400 "priceId inconnu" → vérifier que le priceId dans `plans.ts` existe bien dans Stripe

### Cron de relance d'abonnements échoués
Stripe gère automatiquement les retries via Smart Retries. Vérifier :
- Dashboard → **Settings** → **Subscriptions and emails** → **Manage failed payments**
- Activer "Smart retries" et les emails au client

---

## Ressources

- Docs Stripe : https://stripe.com/docs
- Testing : https://stripe.com/docs/testing
- Webhooks : https://stripe.com/docs/webhooks
- Customer Portal : https://stripe.com/docs/billing/subscriptions/customer-portal
- API version utilisée : `2026-03-25.dahlia` (pinnée dans `src/lib/stripe/server.ts`)

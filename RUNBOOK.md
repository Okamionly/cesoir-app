# CeSoir RUNBOOK — Procedures critiques

Owner: Youssef Guessous <mr.guessousyoussef@gmail.com>
Stack: Next.js 16 · Supabase (ycyxmvzilzkusecpgvbi) · Vercel · Stripe · Upstash Redis

---

## 1. Deploy Vercel

### Deploy normal (push sur master)

```bash
# Le deploy se declenche automatiquement sur git push master via l'integration GitHub.
# Verifier le statut :
gh run list --repo Okamionly/cesoir-app --limit 5

# Forcer un redeploy sans changement de code :
vercel --prod --force
```

### Variables d'environnement modifiees (pas de rebuild automatique)

```bash
# Apres ajout/modification d'une env var Vercel, forcer un redeploy :
vercel --prod --force

# Ou via dashboard : https://vercel.com/okamionly/cesoir-app/deployments
# -> "..." -> "Redeploy"
```

### Verifier le health post-deploy

```bash
curl -s https://cesoir-app.vercel.app/api/health | jq .
# Attendu : { "status": "ok", ... }
```

### Rollback au deploy precedent

```bash
# Lister les deployments recents :
vercel ls cesoir-app

# Rollback vers un deployment specifique (copier l'URL du deploy) :
vercel rollback https://cesoir-app-<hash>.vercel.app --scope okamionly
```

---

## 2. Rollback DB Supabase

### Principe

Les migrations sont dans `supabase/migrations/`. Chaque migration est numerotee
(`001_...sql`, `002_...sql`, ...). Il n'existe pas de "rollback automatique" — chaque
rollback est un hotfix SQL manuel.

### Verifier les migrations appliquees

```bash
# Via Supabase CLI (projet ycyxmvzilzkusecpgvbi) :
supabase db diff --project-id ycyxmvzilzkusecpgvbi

# Ou via SQL Editor dans le dashboard Supabase :
# https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/sql
SELECT migration_name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 20;
```

### Rollback d'une migration (exemple : DROP colonne ajoutee par erreur)

```sql
-- Exemple : annuler l'ajout d'une colonne de la mig 051
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ma_colonne_erreur;

-- Exemple : supprimer une table creee par erreur
DROP TABLE IF EXISTS public.ma_table_erreur CASCADE;
```

Copier-coller le SQL inverse dans le SQL Editor Supabase, executer, puis committer
un fichier `supabase/migrations/XXX_rollback_<description>.sql` pour tracer.

### Push une migration d'urgence

```bash
# Depuis la racine du projet :
supabase db push --project-id ycyxmvzilzkusecpgvbi
```

---

## 3. Webhook Stripe failure

### Symptomes

- Event `checkout.session.completed` recus dans Stripe Dashboard mais la table
  `subscriptions` n'est pas mise a jour.
- Stripe Dashboard > Developers > Webhooks > Endpoint > Events : status `Failed`.

### Diagnostic

```bash
# 1) Verifier que le webhook endpoint est bien enregistre :
# https://dashboard.stripe.com/test/webhooks
# URL attendue : https://cesoir-app.vercel.app/api/stripe/webhook

# 2) Lire les derniers Vercel logs de la route :
vercel logs cesoir-app --scope okamionly | grep stripe/webhook | tail -50

# 3) Verifier le STRIPE_WEBHOOK_SECRET en Vercel :
vercel env ls cesoir-app | grep STRIPE_WEBHOOK_SECRET
# Si absent ou incorrect → voir etape suivante
```

### Fixer le secret

```bash
# Recuperer le signing secret depuis Stripe Dashboard :
# Developers > Webhooks > endpoint > "Signing secret" > Reveal

# Mettre a jour dans Vercel :
vercel env rm STRIPE_WEBHOOK_SECRET production cesoir-app --scope okamionly
vercel env add STRIPE_WEBHOOK_SECRET production cesoir-app --scope okamionly
# (entrer la nouvelle valeur whsec_xxx quand demande)

# Redeploy pour que la var soit prise en compte :
vercel --prod --force
```

### Rejouer les events rates

```bash
# Dans Stripe Dashboard : Developers > Webhooks > endpoint
# Selectionner les events Failed > "Resend"
# Ou via CLI :
stripe events resend evt_xxx --webhook-endpoint we_xxx
```

### Test local

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

---

## 4. Incident Sentry (P0 / P1)

### P0 — Erreur critique en production (5xx repandus, perte de donnees)

```bash
# 1) Identifier l'erreur dans Sentry :
# https://sentry.io/organizations/<org>/issues/?query=level%3Acritical

# 2) Rollback immediat si le deploy est recent (< 2h) :
vercel rollback --scope okamionly  # rollback vers le deploy precedent

# 3) Si pas de rollback possible, desactiver la feature via env var :
# Ex: desactiver Stripe -> STRIPE_ENABLED=false, redeploy.
# Ex: desactiver une route bugguee -> retourner 503 via feature flag.

# 4) Creer un issue GitHub avec le fingerprint Sentry :
gh issue create --repo Okamionly/cesoir-app \
  --title "[P0] <description courte>" \
  --body "Sentry: <lien> | Deploy: <hash> | Symptome: <description>"
```

### P1 — Erreur importante (fonctionnalite cassee, pas de perte de donnees)

```bash
# 1) Reproduire localement avec les logs Sentry.
# 2) Fix en branche feature/fix-xxx.
# 3) PR + review + merge -> deploy auto.
# 4) Verifier dans Sentry que l'issue passe en "Resolved".
```

### Alerting Sentry configure

- Seuil P0 : > 10 erreurs 5xx en 5 minutes -> alert email + (a configurer) Slack
- Dashboard : https://sentry.io/organizations/<org>/performance/

---

## 5. Rotation secrets (Upstash, PostHog, VAPID)

### Upstash Redis (rate-limiting)

```bash
# 1) Aller sur https://console.upstash.com/ -> database cesoir-ratelimit
# 2) Settings -> "Rotate password"
# 3) Copier les nouvelles valeurs UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN

# 4) Mettre a jour dans Vercel :
vercel env rm UPSTASH_REDIS_REST_URL production cesoir-app --scope okamionly
vercel env add UPSTASH_REDIS_REST_URL production cesoir-app --scope okamionly

vercel env rm UPSTASH_REDIS_REST_TOKEN production cesoir-app --scope okamionly
vercel env add UPSTASH_REDIS_REST_TOKEN production cesoir-app --scope okamionly

# 5) Redeploy :
vercel --prod --force
```

### PostHog (analytics)

```bash
# 1) https://app.posthog.com/settings/project -> "Project API Keys"
# 2) Creer une nouvelle cle, archiver l'ancienne.
# 3) Mettre a jour NEXT_PUBLIC_POSTHOG_KEY dans Vercel (meme procedure Upstash).
# Note: NEXT_PUBLIC_* necessite un rebuild pour etre injecte dans le bundle.
vercel --prod --force
```

### VAPID (Push Notifications)

```bash
# Generer une nouvelle paire de cles VAPID :
npx web-push generate-vapid-keys

# Output:
#   Public Key : Bxxx...
#   Private Key: yyy...

# Mettre a jour dans Vercel :
vercel env rm NEXT_PUBLIC_VAPID_PUBLIC_KEY production cesoir-app --scope okamionly
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production cesoir-app --scope okamionly
# (entrer BxXx...)

vercel env rm VAPID_PRIVATE_KEY production cesoir-app --scope okamionly
vercel env add VAPID_PRIVATE_KEY production cesoir-app --scope okamionly
# (entrer yyy...)

# ATTENTION : les clients existants ont l'ancienne cle publique enregistree en
# PushSubscription. Changer VAPID invalide TOUTES les subscriptions push actives.
# Les users devront re-accepter les notifications.
# Prevenir dans un in-app message avant la rotation si possible.

vercel --prod --force
```

### Stripe (rotation cles API)

```bash
# 1) Stripe Dashboard -> Developers -> API Keys -> "Roll key"
# 2) Copier pk_live_xxx et sk_live_xxx
# 3) Mettre a jour dans Vercel (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY)
# 4) Redeploy
# Note: le webhook secret (whsec_xxx) est independant des API keys — pas besoin
# de le changer lors d'une rotation de cles.
```

### Supabase service role key

```bash
# 1) https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/settings/api
# 2) "Reset service role key" (bouton discret, confirmer)
# 3) Mettre a jour SUPABASE_SERVICE_ROLE_KEY dans Vercel
# ATTENTION : cette cle bypass le RLS. La changer casse immediatement tous
# les API routes qui l'utilisent (webhooks Stripe, claim invites, push, etc.)
# -> redeploy immediat obligatoire.
vercel --prod --force
```

---

## Contacts

| Role | Nom | Contact |
|---|---|---|
| Founder / Dev | Youssef Guessous | mr.guessousyoussef@gmail.com |
| Designer freelance | A recruter | — |
| Community Montpellier | A recruter | — |
| Avocat RGPD | A recruter | — |

---

## Bus factor mitigation

Risque actuel : bus factor = 1 (Youssef seul). Actions prioritaires :

### Acces a donner a un second dev de confiance

```bash
# GitHub repo :
gh api repos/Okamionly/cesoir-app/collaborators/<github-username> \
  --method PUT --field permission=maintain

# Vercel : Settings -> Team -> Invite member (role: member)
# Supabase : https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/settings/team
# Stripe : Dashboard -> Settings -> Team -> Invite
# Sentry : Settings -> Members -> Invite
```

### Backup stack recommandee pour hire

- 1 dev Next.js/TypeScript senior (remote OK, 3 jours/semaine)
- 1 community manager Montpellier (local, temps partiel)
- Stack complete documentee dans : `CONTRIBUTING.md`, `STRIPE_SETUP.md`, ce `RUNBOOK.md`

### Credentials vault

Toutes les cles de production sont dans les env vars Vercel (jamais en local, jamais
dans le repo). En cas d'urgence sans acces Vercel, contacter Vercel Support :
https://vercel.com/help

### Backup DB

Supabase fait des backups automatiques quotidiens (7 jours rolling sur le plan free,
30 jours sur Pro). Pour un export manuel :

```bash
# Dump Postgres complet (remplacer les valeurs par celles du dashboard Supabase) :
pg_dump "postgresql://postgres.<project-ref>:<db-password>@aws-0-eu-west-3.pooler.supabase.com:6543/postgres" \
  --file cesoir-backup-$(date +%Y%m%d).sql
```

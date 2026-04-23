# CeSoir

> *Personne ne dîne seul ce soir à Montpellier.*

CeSoir est une app de rencontre spontanée, ultra-locale, 100% gratuite.
14 modes de rencontre pour 14 situations de vie.

**Stack** : Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · motion/react · Supabase · PWA VitePWA · Deploy Vercel

---

## Vision

CeSoir existe pour une seule raison : **que personne ne passe une soirée seul par manque d'option**.

On inverse la logique des apps de rencontre classiques :
- **Apps classiques** : match d'abord → (peut-être) plan plus tard → 97% de conversations mortes
- **CeSoir** : plan d'abord → rencontre maintenant → 10x conversion IRL

**Notre moat** : densité locale (quartier, pas ville) + temporalité ce soir + gratuité permanente + logique plan-first. Personne ne combine les quatre.

Lire le manifesto fondateur : [`docs/MANIFESTO.md`](./docs/MANIFESTO.md).

---

## How we monetize (eventually)

**Côté utilisateur : 100% gratuit. Pas de paywall. Jamais.**

Feature flag `MONETIZATION_ENABLED=false` sur toutes les features users.
Pas de pub ciblée, pas de data mining, pas de freemium piège.

**Côté venues (B2B) : voilà comment on gagne de l'argent.**

- **Pin featured** — Un bar/restau paie pour être épinglé en haut d'un mode
- **Rubrique Soirées** — Clubs/événements publient leurs soirées avec places réservées
- **Dashboard affluence** — Les venues voient l'intérêt utilisateur en temps réel

Pricing indicatif : 49 € / 149 € / Enterprise sur mesure.

Documentation investor-grade : [`docs/BUSINESS_MODEL.md`](./docs/BUSINESS_MODEL.md).
Pitch deck 12 slides : [`docs/PITCH_DECK.md`](./docs/PITCH_DECK.md).

---

## Getting Started

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Routes principales :
- `/` — Landing cinematic 3-scènes (SceneController)
- `/manifesto` — Manifesto fondateur long-form
- `/about` — L'équipe, valeurs, advisors
- `/why-free` — Page transparence sur la gratuité
- `/register` + `/login` — Auth
- `/(app)/*` — 40+ pages produit (14 modes, discover, chat, profile, etc.)

Stack runtime :
- Next.js App Router (route groups `(app)` / `(auth)`)
- Supabase auth + Postgres + Realtime + Storage
- Tailwind v4 (palette CeSoir : `#FFF` · `#111` · `#8B5CF6` · `#00FF88`)
- `motion/react` (pas framer-motion) pour toutes les animations

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) pour optimiser Geist.

---

## Observability / Sentry

Sentry est wired mais **conditionnel sur une env var**. Les builds et dev marchent sans compte Sentry — le package no-ops tant qu'aucun DSN n'est configuré.

Pour activer en prod, ajouter ces env vars dans Vercel :

- `NEXT_PUBLIC_SENTRY_DSN` — public DSN (browser + Node/Edge init)
- `SENTRY_ORG`, `SENTRY_PROJECT` — nécessaires pour upload des source maps au build
- `SENTRY_AUTH_TOKEN` — nécessaire pour l'upload effectif; skip si absent
- `NEXT_PUBLIC_SENTRY_REPLAY=1` — optionnel, active Session Replay

Fichiers impliqués :

- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
- `instrumentation.ts` (server) + `instrumentation-client.ts` (browser)
- `next.config.ts` wrap la config avec `withSentryConfig`
- `src/lib/logger.ts` — utiliser `logger.info/warn/error(event, ctx)` partout au lieu de `console.*`. Errors forward auto vers Sentry si DSN set.
- `src/app/api/health/route.ts` — `GET /api/health` retourne 200/503 avec DB round-trip status (probe-friendly, no auth, no cache)
- `src/components/app/WebVitalsReporter.tsx` — émet CLS / LCP / INP / FCP / TTFB / FID via le logger

PII redaction : `email`, `password`, `token`, `authorization`, `stripe_customer_id` etc. sont strippés des payloads logger et des events Sentry (`beforeSend`). Voir `SENSITIVE_KEYS` dans `src/lib/logger.ts`.

---

## Rate limiting

API routes sensibles (login, wallet, stripe, undos, squad/join, account/delete) sont protégées par `src/lib/rate-limit.ts`. Deux modes :

- **Prod — Upstash Redis (recommandé)** — rate limit partagé entre toutes les instances Vercel. Sans ça, 5 lambdas chaudes × 5 essais = 25 tentatives/min → zéro protection brute-force réelle.
- **Dev / fallback** — Map en mémoire par process. OK en local, insuffisant en prod.

Setup Upstash (gratuit, 10 000 commandes/jour) :

1. Créer une base Redis : <https://console.upstash.com/redis>
2. Copier les deux valeurs `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
3. Les ajouter dans Vercel → Project → Settings → Environment Variables (Production + Preview)
4. Redeploy — les lambdas prendront la config au prochain cold start

Tu peux vérifier que c'est actif en regardant l'onglet Analytics d'Upstash : des keys `rl:login:*`, `rl:api:*`, `rl:adhoc:*` doivent apparaître.

---

## Deploy on Vercel

The easiest way to deploy ce Next.js app est d'utiliser la [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) pour plus de détails.

---

## Learn More — internal docs

- [`docs/MANIFESTO.md`](./docs/MANIFESTO.md) — Pourquoi CeSoir existe (manifesto fondateur)
- [`docs/PITCH_DECK.md`](./docs/PITCH_DECK.md) — Pitch investor 12 slides
- [`docs/BUSINESS_MODEL.md`](./docs/BUSINESS_MODEL.md) — TAM/SAM/SOM, monétisation, exit scenarios
- [`CLAUDE.md`](./CLAUDE.md) — Instructions Claude Code pour ce projet

## Learn More — Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

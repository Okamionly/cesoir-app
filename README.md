This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Observability / Sentry

Sentry is wired in but **conditional on an env var**. Builds and dev work
without a Sentry account — the package no-ops until a DSN is set.

To enable in production, add these env vars in Vercel:

- `NEXT_PUBLIC_SENTRY_DSN` — public DSN (browser + Node/Edge init).
- `SENTRY_ORG`, `SENTRY_PROJECT` — needed for source map upload at build.
- `SENTRY_AUTH_TOKEN` — needed to actually upload maps; skipped if absent.
- `NEXT_PUBLIC_SENTRY_REPLAY=1` — optional, turns on Session Replay.

Files involved:

- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
- `instrumentation.ts` (server) + `instrumentation-client.ts` (browser)
- `next.config.ts` wraps config with `withSentryConfig`
- `src/lib/logger.ts` — use `logger.info/warn/error(event, ctx)` everywhere
  instead of `console.*`. Errors auto-forward to Sentry when DSN is set.
- `src/app/api/health/route.ts` — `GET /api/health` returns 200/503 with
  DB round-trip status (probe-friendly, no auth, no cache).
- `src/components/app/WebVitalsReporter.tsx` — emits CLS / LCP / INP /
  FCP / TTFB / FID through the logger.

PII redaction: `email`, `password`, `token`, `authorization`,
`stripe_customer_id` etc. are stripped from logger payloads and from
Sentry events (`beforeSend`). See `SENSITIVE_KEYS` in `src/lib/logger.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Rate limiting

API routes sensibles (login, wallet, stripe, undos, squad/join, account/delete)
sont protégées par `src/lib/rate-limit.ts`. Deux modes :

- **Prod — Upstash Redis (recommandé)**. Rate limit partagé entre toutes les
  instances Vercel. Sans ça, 5 lambdas chaudes × 5 essais = 25 tentatives/min
  possibles → zéro protection brute-force réelle.
- **Dev / fallback** — Map en mémoire par process. OK en local, insuffisant
  en prod.

Setup Upstash (gratuit, 10 000 commandes/jour) :

1. Créer une base Redis : <https://console.upstash.com/redis>
2. Copier les deux valeurs `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
3. Les ajouter dans Vercel → Project → Settings → Environment Variables
   (Production + Preview)
4. Redeploy — les lambdas prendront la config au prochain cold start

Tu peux vérifier que c'est actif en regardant l'onglet Analytics d'Upstash :
des keys `rl:login:*`, `rl:api:*`, `rl:adhoc:*` doivent apparaître.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Todo — cesoir-app

## Current sprint — Backend réel

- [ ] **Configurer RLS Supabase** sur les 24 tables existantes (policies INSERT/SELECT/UPDATE/DELETE par rôle)
- [ ] **Matching algorithm** — v1 basique par mode + zone + dispo (à spec d'abord)
- [ ] **Stripe payments** — intégration abonnement premium (1 mode gratuit, 14 modes payants)
- [ ] **Push notifications PWA** — spark countdown alerts, new match, proximity

## Backlog

- [ ] **GitHub remote** : configurer + push initial (pas encore fait)
- [ ] **Feature : Invitation flash-plan** — 1 clic pour inviter les 10 premiers matchs dispo
- [ ] **Onboarding mobile** : améliorer first-session (actuellement skip trop rapide)
- [ ] **Vérification vidéo** : connecter à un service (AWS Rekognition ou Stripe Identity)
- [ ] **A/B test pricing** : tester 9.99€/mois vs 4.99€/mode à la carte
- [ ] **Analytics** : Vercel Analytics + Plausible (privacy-first)
- [ ] **Dark mode auto** : vérifier 21h-6h switch fonctionne sur tous les devices
- [ ] **Supabase backups automatiques** : cron daily dump vers R2

## Review

_Section remplie après chaque tâche complétée._

---
**Stack:** Next.js 16 App Router + Tailwind v4 + Supabase + Framer Motion + MapLibre GL + Three.js + Vercel
**Live:** https://cesoir-app.vercel.app
**Design LOCKED:** White Fluo Minimal (#FFF/#111/#8B5CF6/#00FF88) + logo ☾ jamais changer
**Note:** Next.js 16 a des breaking changes vs training data — lire `node_modules/next/dist/docs/` avant de coder

# Product · CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Vue produit synthétique. Pour les specs complètes voir `docs/MANIFESTO.md` et
> `docs/BUSINESS_MODEL.md`. Pour un pitch animé : `docs/PITCH_DECK.md`.

---

## 1. Vision

> "Trouver quelqu'un pour **ce soir** — un verre, une soirée, un plan de
> dernière minute — sans l'anxiété des apps de dating classiques."

CeSoir réconcilie le besoin social *maintenant* avec l'offre **real-world** des
lieux de nuit locaux. Le produit est une **app mobile PWA** en FR, installable,
pensée mobile-first.

## 2. Positionnement vs concurrents

| App | Horizon temporel | Focus | Monétisation | Friction |
|---|---|---|---|---|
| Tinder | plusieurs semaines | swipe | freemium | forte (boost, superlike) |
| Bumble | plusieurs semaines | women-first | freemium | moyenne |
| Hinge | relation long-terme | prompts | freemium | moyenne |
| Happn | proximité historique | crossings | freemium | faible |
| **CeSoir** | **ce soir / ce weekend** | **plan IRL + venues** | **B2B venues** | **nulle user-side** |

**Moat** : alliance avec les venues locales — ni Tinder ni Bumble n'a intérêt
à prioriser Montpellier vs global. Nous oui.

## 3. Stack technique

- **Frontend** : Next.js 16, React 19, TypeScript strict, Tailwind CSS.
- **Backend** : Supabase Pro (Postgres + Auth + Realtime + Storage + Edge Functions).
- **PWA** : VitePWA + custom SW (offline + install banner + push).
- **Paiement** : Stripe Billing (B2B subscriptions venues).
- **Hosting** : Vercel Pro (France edge region).
- **Observability** : Sentry, PostHog EU, logger structuré JSON.
- **Maps** : Leaflet + OSM tiles (pas de Google, RGPD-friendly).

## 4. Features actuelles (Wave 15)

- **14 modes** de rencontre (verre, soirée, sport, café, etc.).
- **Swipe** classique avec "rendezvous" flow en plus des matches.
- **Invite-only** gate pour lancement maîtrisé (migration 021).
- **Messagerie** real-time via Supabase Realtime.
- **Squad** (matching à 3+ amis).
- **Plans & rendez-vous** avec lieux (venues connus).
- **Premium → gratuit total** (pivot Wave 13) — user-side 100 % free.
- **Événements** intégrés (10 venues seed Montpellier, migration 020).
- **PostHog + UTM tracking** (Wave 15) pour CAC attribution.

## 5. Roadmap

### M0 (mai 2026) — Launch Montpellier invite-only
- 500 invite codes distribués via presse + influence locale.
- Goal : 500 users inscrits, 40 % activation.

### M+3 (août 2026) — Ouverture publique Montpellier
- SEO landing pages (`/modes`, `/evenements`) live.
- Lancement programme référent avec badges.
- Goal : 2 000 users, 100 rendez-vous IRL / semaine.

### M+6 (novembre 2026) — Monétisation B2B venues
- 3 produits venue : boost event (29 €), abo Pro (49 €/mo), pack lancement (79 €).
- Door-to-door 30 venues cibles Montpellier.
- Goal : 5 venues payantes, 225 € MRR.

### M+9–M+12 — Expansion Lyon + Toulouse
- Replicable playbook.
- Goal : 8 000 users multi-villes, 35 venues payantes, 1 575 € MRR.

### M+12+ — Partenariats billetterie
- Commission sur ticketing venues (Shotgun, Weezevent).
- Goal : marge additionnelle 10–15 % sur transactional revenue.

## 6. Démo & screenshots

- Sandbox live : <https://cesoir-app.vercel.app>
- Invite code démo : `INVESTOR-DEMO-2026` (à générer avant pitch)
- Screenshots : `qa-screenshots/` (dernier refresh 2026-04-19)
- Storybook : `storybook-static/` (compilé, browsable offline)
- Loom demo (à tourner T+15 post-launch) : _TBD_

## 7. Architecture & sécurité

- **RLS Supabase** sur 100 % des tables (voir migrations 003, 010).
- **Auth** : Supabase Auth + `passwordHash` bcrypt, 2FA email.
- **Photos** : upload privé, Moderation API avant publication.
- **PII-safe logging** : `src/lib/logger.ts` redacte emails/tokens.
- **CSP** : headers stricts via `next.config.ts`.
- **Stack audité** : plan pentest M+3 (OWASP Top 10) — voir legal checklist.

## 8. Pourquoi maintenant ?

- **Post-COVID** : besoin accru de rencontres IRL (études AFP 2024, Eurostat 2025).
- **Burn-out Tinder** : 32 % des 18–34 ans ont désinstallé une app dating en 2025 (source : Statista).
- **Montpellier** : 3e ville étudiante FR, 75 000 étudiants, 180+ lieux de nuit.
- **Stack mature** : Supabase + Vercel + Next 16 réduisent le time-to-market par 5x vs stack custom.

## 9. Risques produit identifiés

| Risque | Mitigation |
|---|---|
| Chicken-and-egg (pas de users → pas de venues, et inversement) | Invite-only + seed venues offline avant launch |
| Fraude / faux profils | Photo verification + signalement 1-click + Moderation API |
| Sécurité IRL (rendez-vous) | Safety page + numéro 3020 visible + "Ma localisation en live" |
| Lassitude gamification | Modes rotatifs + events hebdo + "Mode du mois" |
| Concurrence surprise (Meta "Messenger Dating FR") | Moat local venues + RGPD compliance-first différenciant |

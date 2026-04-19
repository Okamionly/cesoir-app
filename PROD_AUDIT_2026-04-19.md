# Prod Audit cesoir-app — 2026-04-19

**URL** : https://cesoir-app.vercel.app
**Viewports** : Mobile 375x812 + Desktop 1280x800
**Screenshots** : `prod-audit-2026-04-19/{mobile,desktop}/`

## Status des fixes deployes

| Fix | Status | Note |
|---|---|---|
| Landing cinematique morphique (3 scenes) | OK | Sphere moon + scene indicator INTRO + wheel hint visible |
| Hollywood polish landing mobile + desktop | OK | Gradient pink-green CTA "Rejoindre", typo "ton" en gradient |
| Chat crash (Sprint 4 P0) | Non verifie | Necessite auth |
| RPC search_path (Sprint 4 P0) | Non verifie | Necessite auth |
| Manifest 401 (Sprint 4 P0) | **OK** | `/manifest.webmanifest` sert 200 JSON valide |
| Dark mode `@theme inline` (Sprint 5) | OK | Plus de FOUC visible sur /login ni landing |
| BottomNav md:hidden (Sprint 5) | **FAIL** | Voir bug #1 |
| FABMenu md:hidden (Sprint 5) | **FAIL** | Voir bug #2 |
| EventCard nested anchor (Sprint 5) | Non teste | Route protegee |
| pb-safe desktop (Sprint 5) | OK visuellement |  |
| /map Carto positron, FlashNote, /notifications (Sprint 6) | Non teste | Routes protegees |
| Console errors | **OK** | 0 erreurs sur toutes les pages publiques auditees |
| PWA manifest installable | OK | Icons 192/512 + standalone + start_url /browse |

## Bugs trouves en prod (P0 / P1)

### Bug #1 — BottomNav visible sur pages publiques (P0)
`/about` et `/cgu` affichent la BottomNav (Explorer / Carte / Chat / Modes / Profil) en bas d'ecran mobile ET desktop, alors que l'utilisateur n'est pas authentifie. Les liens de la nav pointent vers des routes protegees.

**Root cause probable** : la condition d'affichage se base sur `md:hidden` seul, pas sur la presence d'un user. Ou le layout wrapping public pages n'exclut pas la BottomNav.

### Bug #2 — FAB lune violette visible sur desktop (P0)
Desktop 1280x800 `/about` montre un FAB ☾ circulaire violet en bottom-right. Sprint 5 pretendait le cacher en `md:hidden` mais il est bien visible a 1280px (largement au-dessus du breakpoint md=768).

**Root cause probable** : classe `md:hidden` manquante dans le JSX deploye, ou composant FABMenu rendu en dehors du layout conditionnel.

### Bug #3 — FAB overlappe contenu cards mobile (P1)
Sur `/about` mobile, le FAB ☾ chevauche le bloc "L'EQUIPE" (card CEO & Produit tronquee). Besoin `pb-28` ou un spacing bottom-safe sur les pages publiques.

## Screenshots

Mobile : `landing.png`, `login.png`, `register.png`, `about.png`, `cgu.png`
Desktop : `landing.png`, `login.png`, `about.png`

## Recommandations priorisees

1. **P0 Hot-fix** : ajouter guard `user ?` autour de `<BottomNav />` et `<FABMenu />` dans le root layout, OU exclure les routes publiques (`/`, `/about`, `/cgu`, `/privacy`, `/safety`, `/login`, `/register`) via un matcher dans le layout.
2. **P0 Verifier build** : re-grep `md:hidden` sur `FABMenu.tsx` et `BottomNav.tsx` — possible que le commit Sprint 5 n'ait pas ete push ou que Vercel ait cache l'ancien build.
3. **P1** : tester routes authentifiees (chat, map, notifications) via compte test apres hot-fix.
4. **P1** : ajouter un test Playwright CI qui verifie `BottomNav` absent sur `/about` pour prevenir regressions.

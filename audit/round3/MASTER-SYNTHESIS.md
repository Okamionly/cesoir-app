# CeSoir — Audit Round 3 Master Synthesis

**Date** : 2026-04-27
**Méthode** : 20 agents Claude lancés en parallèle (visual / console / responsive / a11y / perf / security / design / product / API / PWA / etc.)
**Production** : https://cesoir-app.vercel.app
**Local** : http://localhost:3000

---

## Score global

| Dimension | Score |
|---|---|
| **Sécurité** | 5/10 (10 findings dont 1 CRITICAL CSRF + 4 HIGH) |
| **Accessibilité** | 5/10 (5 blockers WCAG, dont 0 keyboard path sur swipe) |
| **Performance** | 7/10 (LCP 2.8s, TBT 380ms /map, 274 MB tfjs) |
| **Design system** | 6.3/10 (950+ arbitrary text sizes, z-index SOS conflit) |
| **Codebase health** | 7/10 (16 TODO dont 2 P0, 5 god files >800 LOC) |
| **Product / PMF** | 6/10 (backend mature, frontend en retard, monetization off) |
| **Vulnérabilités deps** | 8/10 (5 moderate, 0 critical) |
| **PWA readiness** | 6.2/10 (icons SVG-only, VAPID missing) |
| **Routes coverage** | 47 routes, 0 dead links |
| **Microcopy FR** | 6/10 (accents manquants en masse, "vous" vs "tu" incohérent) |

---

## 🚨 P0 — Ship blockers (à fixer cette semaine)

### Crashes / runtime
1. **`/modes/solo-diner` crash full** — Maximum update depth exceeded dans `ModeDetailPage`. Cause : `useEffect` ou `useSyncExternalStore` avec deps non-mémoïsées. → fix `modes/[mode]/page.tsx` + null-guard sur `useGeolocation` undefined.
2. **ErrorBoundary affiche `!!` littéral** au lieu d'un emoji — `ErrorBoundary.tsx:63`. → remplacer par `⚠️`.

### Sécurité critique
3. **CSRF non protégé sur tous les POST cookie-auth** — un site malveillant peut POST `/api/account/delete` avec le cookie Supabase auto-attaché. → vérifier `Origin` header dans `requireUser` pour méthodes mutantes, OU rejeter cookie-auth sur routes mutantes (Bearer-only).
4. **Avatar bucket public/non-cascade** — migration 003 a drop la SELECT policy sans replacement. Les photos restent accessibles après suppression compte. → bucket privé + signed URLs OR restaurer policy authenticated.
5. **Account delete ne cascade pas** (RGPD Art. 17) — messages, interactions, conversations restent orphelins. → DELETE explicite sur toutes les tables enfants.
6. **Signup retourne tokens même si email non vérifié** — account-takeover via typo-squat possible. → forcer `session: null` si `email_confirmed_at` null.
7. **`/api/wallet/roses` accepte `earn` avec montant client** — utilisateur peut POST `{action: "earn", amount: 999999}`. → supprimer l'action `earn`, server-only.
8. **Distance leak** — `nearby_profiles.distance_km` calculé sur location précise (full PostGIS) puis arrondi 0.1km → trilateration possible (CVE Tinder 2014). → calculer la distance depuis lat_rough/lng_rough, OU arrondir à 1km.

### A11y bloquants
9. **PhotoGallery fullscreen** : pas de focus trap, pas d'Escape close. Utilisateurs clavier piégés. → `useFocusTrap` hook + `Escape` handler.
10. **PhotoGallery navigation bars 3px tall** = touch target = 0. → bumper à h-2 minimum + zone tactile invisible plus large.
11. **ConversationRow swipe actions touch-only** — archive/delete inaccessibles au clavier. → menu kebab fallback.
12. **Plan creation fail silencieux** — `router.push("/plans")` sans toast → utilisateurs créent doublons. → toast success + error.

### Z-index safety regression
13. **MapFiltersSheet z-[1100] et permission modal z-[1200] dépassent SOS z-[900]** — collision safety-critical sur app dating. → étendre tokens avec `mapModal: 860` (sous SOS).

---

## 🟠 P1 — Fix dans les 2 semaines (UX + crédibilité)

### Visual / layout
- `/events` whitespace ~1400px (BUG-03) — retirer `min-h-screen`
- `/events` photo Scrabble "READ" sur Afterwork Electro-Jazz (BUG-04) — wrong Unsplash ID dans seed migration 020
- `/events` FAB overlap badge "Gratuit" (BUG-05)
- `/map` subtitle "Active la geolocalisation..." clip sans ellipsis (BUG-06)
- `/safety` FAB recouvre texte "Cercle de confiance" (BUG-07)
- `/squad` button "Rejoindre" quasi-invisible (BUG-08)
- `/chat` icebreakers truncated sans line-clamp (BUG-09)
- `/profile` Zoe avatar = portrait masculin (BUG-12)
- Animated status dot anti-cliché (design-critic #1) — `profile/page.tsx:220-228`

### Logique
- **Login redirect hardcodé `/feed`** ignore `?redirectTo` query param
- **Icebreakers chat sans onClick** — boutons ne font rien
- **Match cinematic 4s** trop court (extend 8s ou compteur visible)
- **Password no show/hide toggle**
- **Pas de back button** entre signup steps 2/3 — typo step 1 = full reload

### A11y P1
- **Zoe RLS 401** sur toutes les routes protégées — UUID hardcodé migration 014 ne match pas auth.users → fix seed avec gen_random_uuid()
- **DotBadge wrappé dans aria-hidden** — VoiceOver n'annonce jamais les unread
- **Inputs signup-quick sans FormField** — pas d'aria-describedby ni aria-invalid
- **Modaux sans focus trap** — BottomSheet, MapFiltersSheet, ReportSheet
- **Pins MapLibre sans tabIndex/role/keyboard** — carte 100% mouse-only

### Microcopy FR
- **Masse d'accents manquants** : "Securite" "Reglages" "Confidentialite" "Epinglees" "Demarrer" → search/replace 20 min
- **Safety tips en "vous"** alors que app entière en "tu"
- **"Inscription refusée"** masque la vraie cause (email existant)
- **"Montpellier, France" hardcodé** sur tous les profils
- **"Commencer à swiper →"** pattern anglophone

### Code review P1
- **N+1 karma query** — `getKarmaForUsers` brick à ~100 users
- **`catch {}` silencieux** dans 8+ endroits → masque vraies erreurs
- **TOCTOU race** dans `useMatchCap` — bypass possible du cap 8 matchs
- **Double-award karma** dans `useBadges.checkAndAward` sous StrictMode

### Perf
- **LCP `/` 2.8s** — PlasmaOcean canvas bloque → `dynamic(() => import(...), { ssr: false })`
- **TBT `/map` 380ms** — maplibregl parsé synchrone → import dans useEffect
- **motion/react dans bundle layout partagé** +18kB → remplacer whileTap par CSS pur sur BottomNav/TopNav

---

## 🟡 P2 — Polish (mois prochain)

- Touch targets <44px : login "Creer un compte" link, "Comment gratuit" link, undo button (28px), FAB orbit buttons (40px)
- Text < 12px : footer legal, BottomNav labels (9px), section headers (10px)
- 950+ arbitrary `text-[Npx]` → ESLint rule pour bloquer
- 950+ duplications gradient `linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)` → utiliser classe `.gradient-bg` existante (14 occurrences)
- `useIsMobile()` SSR defaults to false → layout shift mobile
- `Suspense fallback={null}` sur 3 pages critiques → blank flash hydratation
- `/register` orphelin (pas linké) — kill ou rediriger vers `/signup-quick`
- `/invites/mine` doublon de `/profile/invites`
- 5 features sans entrée nav : trending, squad, speed-dating, map dans dropdown, progress
- Page titles SEO identiques sauf 4 — fix par route
- 14 fichiers utilisent `auth.getUser()` direct → centraliser via AuthContext
- 18 fichiers font `new Date(x).toLocaleDateString` → extraire `formatDate()`
- 7 fichiers calculent haversine/distance → extraire `lib/geo.ts`

---

## 💡 Wave 16 — Top 5 bets (4 semaines)

| # | Bet | Effort | RICE | Confidence |
|---|---|---|---|---|
| 1 | **Stripe activation** (flip MONETIZATION_ENABLED) | S | 240 | High |
| 2 | **DB-backed referral** (wire `getReferralInfo()` → invite_codes) | S | 200 | High |
| 3 | **Voice intro snippets** (10s, slot photo #4) | S | 150 | High |
| 4 | **Push notif core loop** (match + message) | M | 35 | Medium |
| 5 | **Gamification frontend** (XP bar + level toast) | M | 64 | High |

### Quick differentiators (Wave 16)
- "Closing Soon" pulse bar — "3 spots left at Le Sancho 21h"
- One-tap "Je suis dispo" status broadcast 3h dans le quartier
- Chat auto-expire 6h post-plan (force velocity)
- "Vu ce soir" receipts (post-date confirm IRL → unlock badge)
- "Last Call" push at 19h45 (one daily push, pas spam)

---

## 💀 Kill list (à retirer de l'app)

- **Mode Explorer achievement** — `modesUsed >= 5` impossible avec 4 modes
- **Level 20 "Createur de Modes" reward** — 25k XP unreachable + feature inexistante
- **Annual Premium plan dans paywall UI** — 0 paying users → trop demander
- **`/register`** — `/signup-quick` est le flow officiel (Wave 15)
- **`/invites/mine`** — doublon de `/profile/invites`
- **`useAuth.ts`** — deprecated re-export shim, 0 imports
- **`MockQR.tsx`** — fake QR component, dev-only

---

## 📊 Findings par agent (résumé)

| Agent | P0 | P1 | P2 | Total | Output file |
|---|---|---|---|---|---|
| visual-bug-hunter | 1 | 8 | 3 | 12 | `visual-bugs.md` |
| console-monitor | 1 | 1 | 0 | 2 | `console-errors.md` |
| responsive-tester | 0 | 4 | 4 | 8 | `responsive-bugs.md` + 32 screenshots |
| a11y-perf-auditor | 2 | 3 | 0 | 5 | `a11y-perf.json` |
| site-navigator | 0 | 1 | 7 | 8 | `sitemap.md` (47 routes) |
| design-critic | 0 | 5 | 0 | 5 | `design-critic.md` |
| nielsen-heuristic | 1 | 5 | 4 | 10 | `nielsen-heuristics.md` (33/50) |
| content-writer | 0 | 5 | 15 | 20 | `microcopy.md` |
| codebase-scout | 2 | 5 | 9 | 16 | `codebase-health.md` |
| code-reviewer | 4 | 8 | 6 | 18 | `code-review.md` |
| security-auditor | 1 | 4 | 5 | 10 | inline (no md per agent rule) |
| vuln-scanner | 0 | 5 | 0 | 5 CVEs | `vulns.md` |
| brainstormer | - | - | - | 20 ideas | inline |
| researcher | - | - | - | 5 insights | inline |
| performance | 0 | 5 | 0 | 5 | `performance.md` |
| a11y-deep | 5 | 7 | 0 | 12 | `a11y-deep.md` |
| pwa | 3 | 5 | 2 | 10 | `pwa.md` (62/100) |
| pm-roadmap | - | 5 | - | 5 bets | `roadmap.md` |
| api-designer | 2 | 3 | 0 | 5 + 5 wins | `api-design.md` |
| frontend-arch | 0 | 5 | 0 | 5 + 3 refactors | `frontend-arch.md` |
| design-system | 0 | 4 | 28 | 32 | `design-system-audit.md` (6.3/10) |
| **TOTAL** | **22** | **88** | **83** | **193 findings** | |

---

## Plan d'action recommandé

### Sprint 1 (cette semaine — Wave 15.5)
**Objectif** : éteindre les feux P0
- [ ] Fix /modes/solo-diner crash + ErrorBoundary `!!`
- [ ] CSRF protection sur routes mutantes
- [ ] Account delete RGPD cascade
- [ ] Signup email-verified gate
- [ ] Wallet earn endpoint suppression
- [ ] PhotoGallery focus trap + Escape
- [ ] Plan creation toast
- [ ] Z-index map < SOS

### Sprint 2 (semaine 2 — Wave 15.5)
**Objectif** : crédibilité visuelle + UX
- [ ] /events photo Scrabble fix + min-h-screen retiré
- [ ] /map subtitle truncate
- [ ] /safety FAB shouldHideFAB ajout
- [ ] /squad button visibility
- [ ] Animated status dot retiré
- [ ] Login redirect respecte ?redirectTo
- [ ] Icebreakers wired
- [ ] Match cinematic 8s
- [ ] Microcopy accents FR sweep

### Sprint 3 (Wave 16 launch)
**Objectif** : monetization + retention
- [ ] Stripe MONETIZATION_ENABLED → true
- [ ] DB-backed referral
- [ ] Voice intro snippets
- [ ] Push notif match + message
- [ ] Gamification frontend (XP bar)

### Sprint 4-5 (Wave 16 polish)
- [ ] Closing Soon pulse bar
- [ ] "Je suis dispo" status
- [ ] Chat auto-expire 6h post-plan
- [ ] PWA icons PNG + VAPID
- [ ] Touch targets 44px sweep
- [ ] N+1 karma fix + catch{} sweep

---

## Files générés

- `audit/round3/visual-bugs.md`
- `audit/round3/console-errors.md`
- `audit/round3/responsive-bugs.md` + 32 screenshots `resp-*.png`
- `audit/round3/a11y-perf.json`
- `audit/round3/sitemap.md`
- `audit/round3/design-critic.md`
- `audit/round3/nielsen-heuristics.md`
- `audit/round3/microcopy.md`
- `audit/round3/codebase-health.md`
- `audit/round3/code-review.md`
- `audit/round3/vulns.md`
- `audit/round3/performance.md`
- `audit/round3/a11y-deep.md`
- `audit/round3/pwa.md`
- `audit/round3/roadmap.md`
- `audit/round3/api-design.md`
- `audit/round3/frontend-arch.md`
- `audit/round3/design-system-audit.md`
- `audit/round3/MASTER-SYNTHESIS.md` (ce fichier)

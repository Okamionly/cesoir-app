# A11y + Performance Audit — CeSoir — 2026-05-07

Périmètre : landing `/`, `/browse`, `/profile`, `/modes` — Mobile + Desktop.
Stack : Next.js 16.2.3 / React 19 / Tailwind v4 / motion/react 12 / Vercel Edge.
Méthode : static code audit + calculs WCAG contrast ratio + analyse bundle deps.

---

## 1. Scores estimés (static audit sans Lighthouse live)

| Route | A11y | Perf (estimé) | Verdict |
|---|---|---|---|
| `/` (landing) | ~78/100 | ~58/100 | Contraste + LCP 3D |
| `/browse` | ~85/100 | ~70/100 | Bon — SR announce ok |
| `/profile` | ~88/100 | ~72/100 | Bon — image priority ok |
| `/modes` | ~82/100 | ~68/100 | Motion loop non-stoppable |

---

## 2. Core Web Vitals — Risques identifiés

### LCP — RISQUE ELEVE (cible < 2.5s)

La landing charge simultanément :
- PlasmaOcean : shader WebGL compilé au runtime (100–200ms bloquant sur GPU mobile mid-range)
- StarField : 70 particules canvas 60fps
- MoonHero : 4 `m.div` animés en loop + 3 radial-gradient blurs CSS

Le `<motion.h1>` dans SceneController est protégé par `initial={false}` (SSR visible), ce qui est correct pour que Chrome le détecte comme LCP candidate. Mais le composant parent `SceneController` est lui-même un Client Component, donc le h1 ne sera painted qu'après hydratation JS. LCP probablement 2.8–4s sur mobile 4G.

### CLS — RISQUE MODERE (cible < 0.1)

- Les deux fonts Google (`Outfit` + `Space Grotesk`) sont chargées via `next/font` qui injecte `font-display: swap` par défaut. Risque de FOUT sur la landing si le h1 large (68–78px) bascule de la font système à Outfit — shift visible.
- Le `env(safe-area-inset-bottom)` dans `.pb-safe` peut provoquer un micro-shift sur iOS au premier rendu si la valeur est inconnue côté serveur.

### TBT / TTI — RISQUE MODERE

- `posthog-js` est importé synchrone dans `src/lib/analytics.ts` (pas de dynamic import). Poids estimé : ~80KB gzipped. Bloque le main thread pendant l'initialisation.
- `maplibre-gl` dans `EventVenueMap.tsx` est importé statiquement (pas de `dynamic()`), donc inclus dans le bundle initial si la page events est dans la même route group que le layout. Impact uniquement sur `/events`.

### TTFB — OK estimé

Vercel Edge Runtime + headers CSP statiques = TTFB probablement < 400ms. Pas de problème identifié.

---

## 3. A11y — Violations WCAG AA

### CRITIQUE — Contraste couleur (WCAG 1.4.3)

**gradient-text sur fond blanc** (`.gradient-text` class) : midpoint de #8B5CF6→#00FF88 ≈ 2.1:1 sur #FFFFFF. Utilisé dans `SceneController`, potentiellement dans d'autres pages. Ratio requis : 4.5:1. **Fail AA.**

**white on gradient-bg button** : les boutons `.gradient-bg` (fond #8B5CF6→#00FF88) avec texte `text-white`. Le midpoint du gradient ≈ 1.8:1 sur blanc. **Fail AA critique** — touche le CTA principal `/browse`.

**#8B5CF6 sur #FFFFFF** (app, fond blanc) : 4.23:1. En dessous du seuil AA de 4.5:1. Utilisé comme couleur d'accent pour les liens (landing `"Comment gratuit ?"`, `/browse` liens). **Fail AA pour texte normal** (ok pour large text ≥ 18pt ou bold ≥ 14pt).

**#8B5CF6 sur #F8F8F8** (bg-card) : 3.99:1. **Fail AA même pour large text.**

Contrastes conformes : `#696969` sur blanc (5.49:1 ok), `#00FF88` sur fond sombre landing (14.74:1 ok), `#9A9A9A` dark mode (7.04:1 ok).

### IMPORTANT — Navigation clavier

**SwipeCard sans tabIndex ni keyboard handler** : les actions like/pass/superlike sont sur des `motion.button` dans `ActionButtons` avec `aria-label` corrects — c'est bon. Mais le drag du SwipeCard lui-même (`motion.div` avec `onDragEnd`) n't a pas d'équivalent clavier. Un utilisateur clavier ne peut pas swiper — uniquement utiliser les boutons en dessous. Acceptable si les boutons sont l'alternative réelle, mais pas documenté via `aria-describedby`.

**`MotionConfig reducedMotion="never"`** dans `(app)/layout.tsx` : désactive délibérément le respect de `prefers-reduced-motion` par motion/react. Le commentaire documente le workaround (CSS clamp). Mais le CSS `@media (prefers-reduced-motion)` clampe `animation-duration: 0.01ms` — les animations motion/react (JS-driven) ne sont PAS affectées par cette règle CSS. Résultat : les utilisateurs avec reduced-motion voient quand même toutes les animations JS de motion/react sur les pages app. **Fail WCAG 2.3.3 (AAA) et 2.3.1 (A) si animations > 5 secondes.**

**Skip link** : présent dans `layout.tsx` (`Aller au contenu principal` → `#main-content`) — conforme.

**`lang="fr"`** sur `<html>` — conforme.

### MODERE — Images accessibles

`ProfileShareCard` : 3 instances `alt=""` sur des avatars utilisateur (`src={data.avatarUrl}`). Ces images sont contextuellement significatives (photo de profil de l'utilisateur partagé), `alt=""` les marque comme décoratives. Un lecteur d'écran skip ces images — la carte de partage devient partiellement illisible SR.

`ModeCard` : `alt=""` sur avatars utilisateurs en preview (top 5 users par mode). Même problème — le contexte "3 personnes utilisent ce mode" est perdu pour SR.

Images correctement gérées : `browse/page.tsx` preloader invisibles (`alt=""` correct car `aria-hidden`), avatar profil dans `profile/page.tsx` (`alt={Photo de ${profileName}}` correct).

### MINEUR — Structure heading landing

La landing (`/`) : le seul `h1` est dans `SceneController` (Client Component), donc rendu côté client uniquement. Si JS échoue ou est lent, la page n'a pas de heading structure SSR. Sur les pages app, les `PageHeader` utilisent des `<p>` stylisés plutôt que des `<h1>/<h2>` sémantiques — les titres de section (`"Réglages"`, `"Découvrir"`) sont des `<h3>` sans `h1/h2` parent sur `/profile`.

---

## 4. Bundle — Dépendances lourdes

| Lib | Poids estimé gzipped | Usage | Lazy ? |
|---|---|---|---|
| `@tensorflow/tfjs` | ~1.5MB | Détection NSFW photos (upload) | Oui (dynamic import dans lib/nsfw.ts) |
| `@vladmandic/face-api` | ~400KB | Selfie verification | Oui (dynamic import) |
| `nsfwjs` | ~100KB | Idem | Oui |
| `posthog-js` | ~80KB | Analytics | **Non — import synchrone** |
| `maplibre-gl` | ~220KB | Map `/map` + EventVenueMap | Partiel — map/page ok, EventVenueMap non |
| `motion/react` (domMax) | ~25KB | App layout (drag + layoutId) | Oui (LazyMotionMaxProvider) |
| `motion/react` (domAnimation) | ~11KB | Landing | Oui (LazyMotionProvider) |
| `supabase-js` | ~70KB | Auth + data | Non (normal — auth requis early) |

ML libs correctement lazifiés. posthog est le seul candidat prioritaire à lazifier.

---

## 5. 3D Scene — PlasmaOcean

**FPS estimé** : shader WebGL avec 5 octaves FBM + 8 ripples → ~55–60fps desktop Nvidia, ~25–40fps mobile mid-range (iPhone 13 Pro = ok, Android Galaxy A54 = potentiellement jank).

**DPR cap** : `Math.min(window.devicePixelRatio, 2)` — bon, évite le rendu 3x sur iPhone Pro.

**Visibilité hidden** : `document.visibilitychange` stoppe le RAF — bon pour la batterie.

**Fallback WebGL absent** : si WebGL non supporté, `console.warn` uniquement et le canvas reste vide (fond transparent). Pas de fallback gradient CSS monté à la place. L'utilisateur voit un fond noir uni sans explication.

**prefers-reduced-motion** : PlasmaOcean et StarField n'interrogent pas `prefers-reduced-motion`. StarField le fait partiellement (désactive le drift), mais continue de rafraîchir à 60fps. PlasmaOcean tourne toujours à 60fps.

---

## 6. Mobile-first

**Touch targets** : `.tap-target` (min 44x44px) et `.tap-target-expand` (::before 44px invisible) correctement définis et utilisés sur les éléments interactifs clés (ActionButtons, Profile links, nav). Conforme WCAG 2.5.5.

**Viewport meta** : `width=device-width, initialScale=1, viewportFit=cover` via Next.js `viewport` export — conforme.

**Horizontal scroll** : `overflow-x: hidden` sur `body` — conforme.

**Safe area** : `env(safe-area-inset-bottom)` dans `.pb-safe` et action buttons — conforme iOS.

---

## 7. Top 10 Quick Wins — P0/P1

### P0 — Critiques (bloquants WCAG AA)

**W1 — Contraste gradient-text sur blanc** : remplacer `.gradient-text` par une couleur solide AA-compliant pour les textes informatifs. Option rapide : utiliser `#7C3AED` (violet-600, 5.23:1 sur blanc) au lieu du gradient. Les titres décoratifs (>18pt bold) peuvent conserver le gradient.

**W2 — Bouton gradient-bg : texte blanc illisible** : le CTA principal "Rejoindre CeSoir" + tous les boutons `.gradient-bg text-white`. Deux options : (a) ajouter `text-shadow: 0 1px 2px rgba(0,0,0,0.4)` pour un contraste perceptuel suffisant sur la partie verte, ou (b) limiter le gradient à violet-only (#8B5CF6 → #6D28D9) où le blanc est 4.6:1.

**W3 — #8B5CF6 sur blanc pour texte normal** : les liens accent sur fond blanc sont à 4.23:1. Passer à `#7C3AED` (violet-600) pour les liens inline. Ajustement d'un token dans `globals.css`.

**W4 — PlasmaOcean sans fallback WebGL** : ajouter un `return` côté JSX qui monte un `<div>` avec le gradient CSS CeSoir si `gl === null`. 3 lignes de code.

### P1 — Importants (dégradation expérience)

**W5 — posthog-js synchrone** : wrapper l'init dans un `dynamic(() => import('./PosthogInit'), { ssr: false })` ou un `useEffect` lazy. Économie ~80KB sur le critical path. Impact : TTI -200ms estimé.

**W6 — motion/react `reducedMotion="never"`** : les animations JS (float du MoonHero, sparkles, chip entrances) ne respectent pas le media query CSS. Solution propre : retirer le `MotionConfig reducedMotion="never"` et corriger les variants `initial="hidden"` bloqués en passant `animate` conditionnel selon `useAccessibility().reducedMotion` plutôt que de forcer `reducedMotion="never"` globalement.

**W7 — PlasmaOcean + StarField : pas de prefers-reduced-motion** : ajouter un early return dans les deux useEffect si `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — ne pas démarrer le RAF du tout, afficher le fallback statique.

**W8 — alt text avatars ProfileShareCard** : `alt={Profil de ${data.name}}` sur les 3 instances. 2 minutes.

**W9 — LCP landing** : passer le `<motion.h1>` et le CTA de `SceneController` en `initial={false}` est déjà fait — le gain restant est de marquer les fonts avec `display: optional` au lieu de `swap` pour éviter le FOUT qui décale le h1 large et génère du CLS. Dans `layout.tsx` : `Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'optional' })`.

**W10 — EventVenueMap maplibre statique** : l'import statique de `maplibre-gl` dans `EventVenueMap.tsx` (~220KB) est inclus dans le bundle initial si le composant est importé sans `dynamic()`. Le wrapper avec `dynamic(() => import('./EventVenueMap'), { ssr: false })` à l'endroit où il est utilisé réduit le JS initial sur toutes les pages hors `/map`.

---

## 8. Résumé

| Dimension | Statut |
|---|---|
| WCAG AA compliance | **below-AA** (3 violations critiques contraste) |
| Core Web Vitals LCP | **needs-improvement** (landing 3D ~3s estimé) |
| Core Web Vitals CLS | **good** (fonts swap = risque mineur) |
| Core Web Vitals INP | **good** (optimistic UI swipe, lazy ML) |
| Touch targets | conforme |
| Keyboard nav | partiel (swipe deck clavier ok via boutons, motion `reducedMotion="never"` problème) |
| Screen reader | partiel (SR announces sur browse ok, alt avatars manquants, headings app incomplets) |
| WebGL fallback | absent |
| Bundle lazy loading | bon sauf posthog + EventVenueMap |

Priorité absolue : W1/W2/W3 (contraste) + W4 (WebGL fallback) + W6 (reduced-motion). Les autres sont des P1 semaine suivante.

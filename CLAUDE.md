# CLAUDE.md

Ce fichier fournit des consignes à Claude Code (claude.ai/code) pour travailler sur ce dépôt.

@AGENTS.md

## Important : version de Next.js

Ce projet utilise **Next.js 16.2.3** avec **React 19.2.4**. Les API, conventions et structure de fichiers diffèrent des versions plus anciennes. Avant d'écrire du code spécifique à Next.js (route handlers, `cookies()`, metadata, middleware, fonts, etc.), consulte le guide pertinent dans `node_modules/next/dist/docs/` et respecte les avis de dépréciation. Ne te fie pas à ta mémoire d'entraînement pour le comportement de Next.js.

## Commandes

```bash
npm run dev           # next dev
npm run build         # next build
npm run start         # next start
npm run lint          # eslint (config plate : eslint.config.mjs)

npm run db:check      # vérifie NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY dans .env.local
npm run db:types      # régénère src/lib/supabase-types.ts depuis le projet ycyxmvzilzkusecpgvbi
npm run db:start      # supabase start (stack locale)
npm run db:stop
npm run db:reset      # supabase db reset — applique supabase/migrations/*
npm run db:push       # supabase db push
```

Aucun runner de tests n'est configuré. N'invente pas `npm test`.

Alias de chemin TypeScript : `@/*` → `./src/*`.

## Architecture

### App Router avec groupes de routes

`src/app/` est divisé en deux groupes de routes avec des providers différents :

- **`(app)/`** — shell authentifié. Le `layout.tsx` enveloppe les enfants dans `AuthProvider` → `DarkModeProvider` → `AccessibilityProvider` → `ToastProvider`, plus `OfflineBanner`, `BottomNav`, `FABMenu`, `SOSButton`, `ErrorBoundary` et `PageTransition`. Toute nouvelle page authentifiée va ici et hérite de tout ça.
- **`(auth)/`** — login / register / onboarding / forgot-password / reset-password. Layout séparé, sans chrome de navigation.
- `src/app/page.tsx` est la landing page publique (hors groupe).
- `src/app/api/` contient les route handlers (`account/delete`, `auth/login`, `auth/logout`, `recommendations`, `swipe`).

Les parenthèses des groupes de routes n'affectent pas les URL — `(app)/browse/page.tsx` est servi sur `/browse`.

### Auth : trois couches qui doivent rester cohérentes

1. **`src/middleware.ts`** — s'exécute sur chaque requête non-statique. Utilise `createServerClient` de `@supabase/ssr` pour rafraîchir le cookie de session et redirige : les préfixes protégés (`/browse`, `/map`, `/chat`, `/modes`, `/profile`, `/app`) exigent un user ; les routes d'auth (`/login`, `/register`) redirigent vers `/browse` si déjà connecté. Si les variables d'env manquent, no-op silencieux pour ne pas casser le build.
2. **`src/lib/supabase/{client,server,helpers}.ts`** — les clients SSR *canoniques*. Utilise `createClient()` de `server.ts` dans les Server Components / route handlers, et `createClient()` de `client.ts` dans les Client Components qui ont besoin de cookies SSR-aware. `helpers.ts` expose `getUser()`, `getProfile(id)`, `getCurrentProfile()` pour le code serveur.
3. **`src/context/AuthContext.tsx`** (`"use client"`) — fournit `useAuth()` avec `user`, `signIn`, `signUp`, `signOut`. Monté une seule fois par `(app)/layout.tsx`. Il utilise le singleton legacy `src/lib/supabase.ts` (un `Proxy` paresseux autour de `createClient` de `@supabase/supabase-js`) pour l'état d'auth en temps réel + la sync cross-tab. Rafraîchit aussi la session toutes les 50 minutes et utilise `navigator.sendBeacon` sur `beforeunload` pour marquer le profil hors-ligne.

`src/lib/useAuth.ts` est un shim déprécié qui ré-exporte `useAuth` depuis le contexte — préfère `@/context/AuthContext` directement.

Les profils sont créés automatiquement par un trigger Supabase (`handle_new_user`, `SECURITY DEFINER`) sur l'INSERT dans `auth.users` ; n'insère pas dans `profiles` manuellement après l'inscription.

### Routes API : pattern Bearer token

`src/app/api/recommendations/route.ts` et `src/app/api/swipe/route.ts` n'utilisent *pas* le flux cookie SSR. Ils attendent `Authorization: Bearer <access_token>`, instancient un `createClient(URL, ANON_KEY, { global: { headers: { Authorization } } })` par requête, puis appellent `db.auth.getUser()` pour authentifier. Suis ce pattern pour toute nouvelle route API appelée côté client qui a besoin du contexte RLS de l'utilisateur. À l'inverse, `api/auth/login/route.ts` et `api/auth/logout/route.ts` utilisent le `createClient` SSR de `@/lib/supabase/server` pour poser/supprimer les cookies.

### Pipeline de matching

`src/lib/matching.ts` → `findMatches(userId, lat, lng, opts)` est la fonction de scoring exposée via `GET /api/recommendations`. Score 0–100 : **compatibilité de mode 40 / distance 25 / timing 20 / preuve sociale 15**. Les 14 modes supportés vivent dans `src/lib/modes.ts` (`MODES` / `ModeKey`) et font foi — les colonnes DB `mode_activations.mode` et `interactions.mode` doivent matcher ces clés.

`POST /api/swipe` applique une limite de 100 swipes/jour (reset à minuit UTC), enregistre dans `interactions`, et sur un like/superlike mutuel upsert une ligne `conversations` avec un ordre déterministe `(user_a, user_b)` pour éviter les doublons.

Les types de requête/réponse partagés pour ces routes vivent dans `src/types/matching.ts` — importe-les des deux côtés.

### Base de données

- Schéma principal : `supabase-schema.sql` (PostGIS activé). Migrations : `supabase/migrations/*.sql`.
- Types générés : `src/lib/supabase-types.ts` — régénère avec `npm run db:types` après un changement de schéma.
- `src/lib/supabase.ts` ré-exporte `Database` et les types de ligne `Db*` (ex. `DbProfile`, `DbInteraction`, `DbConversation`). Importe les types de ligne depuis `@/lib/supabase` plutôt que d'aller chercher directement dans `supabase-types`.
- `profiles.location` est un `GEOGRAPHY(POINT, 4326)` PostGIS.

### Logique métier côté client

La plupart de l'état des features vit dans les hooks `src/lib/use*.ts` (swipe, chat, conversations, matches, notifications, badges, gamification, geolocation, safety, etc.). Ils passent par le singleton legacy `supabase` de `@/lib/supabase`. Les composants sous `src/components/{app,chat,landing,map,ui}/` consomment ces hooks — la logique métier appartient au hook, pas au composant.

`src/lib/motion-design.ts` est le fichier partagé de tokens Motion (Framer) (springs, easings, animations ambiantes). Réutilise ses exports plutôt que de bricoler des transitions à la main.

### i18n

`src/lib/i18n.ts` est une couche de traduction zéro-dépendance, locale par défaut `fr`, supporte aussi `en`. Toute l'UI est en français d'abord (voir les chaînes user-facing comme `"Non authentifie"` dans les routes API).

### PWA

`public/manifest.json` + `public/sw.js` + `src/lib/registerSW.ts` + `src/lib/offline-queue.ts` fournissent le support offline. `OfflineBanner` dans `(app)/layout.tsx` expose la connectivité.

### Headers de sécurité

`next.config.ts` pose `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, et un `Permissions-Policy` n'autorisant que geolocation + camera en self. Whiteliste aussi les `remotePatterns` d'images pour `api.dicebear.com`, le bucket Supabase du projet et `randomuser.me` — ajoute-y tout nouvel host d'images.

## Conventions

- Les composants qui utilisent des hooks, des API navigateur ou Motion doivent commencer par `"use client"`. Tout ce qui est sous `src/app/(app)/` et `src/app/(auth)/` est une zone feature orientée client, mais les fichiers `page` doivent rester Server Components quand c'est possible et déléguer à des enfants client.
- Les routes API renvoient des messages d'erreur en français (ex. `"Non authentifie"`, `"Session invalide"`) — garde ce ton.
- Ne commit pas `.env.local` ; `db:check` le valide avant de dev.

# Backend Architecture Audit — 2026-04-19

Auteur : Backend Architect (read-only audit). 26 tables publiques, 52+ RLS policies,
6 migrations, 10 API routes, 40+ hooks client. Ce rapport cible les problèmes
STRUCTURELS, pas les nitpicks.

## Executive Summary

- **Auth fragmenté** : 2 patterns coexistent (Bearer header vs SSR cookies). `/api/auth/login` + `/api/auth/logout` utilisent `@/lib/supabase/server` (SSR cookies), les 8 autres routes utilisent `createClient(...)` direct + Bearer header. Risque de drift + duplication de code.
- **Data access non uniforme** : hooks client queryent Supabase directement (`supabase.from(...)`) pour 13 domaines (chat, matches, flash plans, etc.) alors que swipe/recommendations/events/squad passent par API route. Pas de règle claire → auth/rate-limit/validation/log incohérents. `useInteractions.block()` et `.undo()` écrivent direct à la DB, bypassant le check rate-limit de `/api/swipe`.
- **Advisors perf : 181 lints non résolus**. Les plus critiques : 57 `auth_rls_initplan` (RLS policy re-évalue `auth.uid()` par row → lent), 70 `multiple_permissive_policies` (plusieurs policies permissives pour le même role/action → OR évalué 2x).
- **2 vues `SECURITY DEFINER` exposées** : `trending_venues_view` + `leaderboard_view` bypass les RLS de l'appelant. ERROR-level advisor.
- **Baseline migration manquant** : `001_initial_schema.sql` absent, seuls 002→006 versionnés. Impossible de rebuild la DB from scratch.

---

## Findings

### Architecture DB (8 issues)

**DB-1 — RLS manque DELETE sur 12 tables** (IMPACT: HIGH)
Tables avec policies INSERT/UPDATE/SELECT mais pas DELETE explicite (les policies `ALL` couvrent DELETE, mais plusieurs tables n'en ont PAS):
`feedback`, `reports`, `reviews`, `messages`, `conversations`, `interactions`,
`squads`, `subscriptions`, `purchases` (DELETE existe uniquement sur `profiles`, `flash_plans`, `flash_plan_participants`, `mode_activations`, `profile_prompts`, `rooms`).
Pour `subscriptions`/`purchases` c'est volontaire (webhook-only). Pour `messages`/`interactions` c'est un gap : `useChat.deleteConversation` fait `supabase.from("messages").delete()` qui va échouer silencieusement sous RLS quand la policy DELETE n'existe pas. À tester.
**Fix** : ajouter policies DELETE explicites avec `using (auth.uid() = sender_id)` ou équivalent par table.

**DB-2 — 57 RLS `auth_rls_initplan`** (IMPACT: HIGH en production)
Policies type `auth.uid() = user_id` sont ré-évaluées pour CHAQUE row scannée. Supabase recommande `(select auth.uid()) = user_id` pour que Postgres fasse l'initPlan 1 fois.
**Fix** : migration de search/replace dans toutes les policies. Gain : sur `messages` avec 10k rows, gain attendu ×10 latence. Effort : M (1 migration de refactor policies).

**DB-3 — 70 `multiple_permissive_policies`** (IMPACT: MEDIUM)
Ex: `achievements` a `Users manage own achievements` (ALL) + `Achievements are public` (SELECT). Postgres évalue les deux en OR pour chaque row.
**Fix** : fusionner en 1 policy unique OU utiliser policies RESTRICTIVE. Effort : M.

**DB-4 — 2 vues `SECURITY DEFINER` exposées** (IMPACT: HIGH)
`trending_venues_view` et `leaderboard_view` s'exécutent avec les droits du créateur (probablement superuser) au lieu de l'appelant. Bypass silencieux de RLS.
**Fix** : recréer les vues en `SECURITY INVOKER` OU les déplacer en RPC function `SECURITY DEFINER` scoped correctement. Effort : S.

**DB-5 — `popup_events` vs `flash_plans` redondance fonctionnelle** (IMPACT: MEDIUM)
- `popup_events` : creator, title, lat/lng, event_time, max_attendees, tags, venue
- `flash_plans` : creator, title, where_text, when_at, deadline, max_participants, mode
Les deux sont des "events proposés par un user que d'autres peuvent rejoindre". Tables d'attendees séparées (`event_attendees` vs `flash_plan_participants`) avec schéma quasi-identique. Code duplique pour 2 fetch + 2 RLS + 2 realtime.
**Fix** : unifier en une seule table `events` avec colonne `kind` (`popup` | `flash`) + colonnes nullable lat/lng/deadline selon kind. Migration de données nécessaire. Effort : L.

**DB-6 — 11 foreign keys sans index couvrant** (IMPACT: MEDIUM)
Ex: `checkins.conversation_id`, plusieurs FK vers auth.users. Cause des full-table-scans sur DELETE cascade.
**Fix** : `CREATE INDEX` sur chaque FK listée par advisor. Effort : S.

**DB-7 — 43 unused indexes** (IMPACT: LOW mais bruit)
Indexes créés mais jamais utilisés par le query planner (souvent car le code n'existe pas encore ou le pattern de query diffère). Occupe disque + slow writes.
**Fix** : DROP au fur et à mesure en confirmant avec logs prod. Effort : S.

**DB-8 — FK targets incohérents : `auth.users` vs `profiles`** (IMPACT: MEDIUM)
Certaines FK pointent vers `auth.users.id` (achievements, availability, challenges, checkins, feed_activities, event_attendees, karma_transactions, popup_events, squad_invites, squads, streaks, trusted_contacts), d'autres vers `profiles.id` (conversations, feedback, flash_plan_participants, flash_plans, interactions, messages, mode_activations, plans, profile_prompts, purchases, reports, reviews, rooms, subscriptions, tonight_preferences). Comme `profiles.id` FK vers `auth.users.id` c'est fonctionnellement OK, mais le mix rend les JOIN ambigus et les `confdeltype` diffèrent.
**Fix** : standardiser sur `profiles.id` (plus proche de la couche app). Effort : L (migration + tous les types TS).

---

### Architecture API routes (5 issues)

**API-1 — Deux patterns d'auth coexistent** (IMPACT: HIGH)
- SSR cookies (`createClient` de `@/lib/supabase/server`) : `/api/auth/login`, `/api/auth/logout`
- Bearer header (`createClient` de `@supabase/supabase-js` + `global.headers.Authorization`) : 8 autres routes

Le login pose donc un cookie SSR que le reste du code n'utilise pas — il relit le token via `supabase.auth.getSession()` client-side puis le passe en Bearer. Double source de vérité.
**Fix** : choisir UN pattern. Pour Next.js App Router, SSR cookies est recommandé (gère refresh, protège contre XSS). Migrer toutes les routes vers ce pattern. Effort : M.

**API-2 — Shape d'erreurs incohérent** (IMPACT: LOW mais bloque UX typée)
- `/api/auth/login` : `{ error, retryAfter }` + `Retry-After` header
- `/api/account/delete` : `{ error }` OU `{ success, message, details }`
- `/api/swipe` : `{ error, swipesRemaining, resetAt }` ou `{ error, message }`
- `/api/events/rsvp` : `{ error }` ou `{ joined, idempotent }`
- `/api/stripe/*` : `{ error }` ou `{ url, sessionId }`

Le client doit faire du guess sur la forme de chaque endpoint.
**Fix** : type partagé `ApiError = { error: string; code?: string; details?: unknown }` + `ApiSuccess<T>`. Effort : S.

**API-3 — Rate limiting présent UNIQUEMENT sur 2 routes** (IMPACT: HIGH)
- `/api/auth/login` : in-memory (5/60s per ip+email) — mentionne lui-même qu'il n'est pas partagé entre Vercel instances
- `/api/swipe` : DB-level count (100/jour via `interactions` table)
- Aucun rate limit sur : `/api/account/delete` (DoS si boucle), `/api/events/rsvp` (spam join/leave), `/api/squad/join` (brute-force codes 6 chars = 2.2G combinaisons), `/api/recommendations` (scraping), `/api/stripe/checkout` (création de customer à répétition), `/api/stripe/portal`.
**Fix** : route toutes les écritures user via `checkRateLimit(...)` avec quotas par endpoint. Long-terme : Upstash Redis pour partager entre instances (TODO déjà noté dans `rate-limit.ts`). Effort : M.

**API-4 — Pas de validation Zod/similar** (IMPACT: MEDIUM)
Chaque route fait sa propre validation manuelle avec `typeof`, `ARRAY.includes`, etc. Ex : `/api/recommendations` valide `lat/lng` et `genderFilter`, `/api/swipe` valide `direction`, `/api/squad/join` valide `code.length === 6`. Copier-coller qui dérive.
**Fix** : introduire Zod schemas `src/lib/schemas/` + helper `parseBody(request, schema)`. Effort : M.

**API-5 — Logging non-structuré** (IMPACT: MEDIUM en observability)
Partout : `console.error("[/api/.../route] message:", err.message)`. Pas de corrélation, pas de level, pas de output JSON pour Vercel logs parsing.
**Fix** : helper `logger.error({ route, userId, err })` qui `JSON.stringify` pour Vercel. Effort : S.

---

### Architecture hooks (4 issues)

**HK-1 — Loading/error/success shape incohérent** (IMPACT: MEDIUM)
- Certains : `{ data, loading, error }` (useMatches, useSubscription, useFlashPlans)
- D'autres : `{ matches, loading }` sans error (useConversations)
- D'autres : `{ messages, loading, loadingMore, hasMore, sending, ... }` (useChat — 8 états)

Pas de shape canonique, UX treatment divergent.
**Fix** : définir un type `AsyncState<T>` standard OU migrer vers SWR/TanStack Query qui unifie tout ça. Effort : L (mais énorme gain DX).

**HK-2 — Pas de cache / dedup** (IMPACT: HIGH perf)
Chaque hook réinvente fetch + state + polling. Si 3 composants montent `useProfile(userId)` en parallèle → 3 requêtes. `useMatches` fait auto-refresh 30s sans dedup ni abort.
**Fix** : introduire SWR ou TanStack Query. Remplacement progressif hook par hook. Effort : XL mais linéaire.

**HK-3 — Realtime cleanup inconsistant** (IMPACT: MEDIUM)
- `useChat` : stocke channel dans `channelRef` ET fait `channel.unsubscribe()` dans cleanup ✓
- `useConversations` (inside useChat) : idem ✓
- D'autres hooks realtime ? À vérifier hook par hook — plusieurs ont `channelRef.current = null` manquant post-unsubscribe (leak listeners si le hook remount rapidement).
**Fix** : audit systématique + helper `useRealtimeChannel(channelFactory)` qui normalise cleanup. Effort : M.

**HK-4 — Pas d'AbortSignal sur les fetch** (IMPACT: MEDIUM)
`useMatches` fait `await findMatches(...)` dans un `setInterval`. Si le composant démonte pendant la requête, setState called on unmounted component (React warning) + race condition sur 2 refreshes qui se croisent.
Pattern `let cancelled = false; return () => { cancelled = true; };` utilisé dans `useChat` mais pas ailleurs.
**Fix** : helper hook `useAbortableFetch` OU migration SWR/TanStack (qui le gère nativement). Effort : S-M.

---

### Architecture data access (2 issues)

**DA-1 — Frontière client/API arbitraire** (IMPACT: HIGH)
Règle implicite actuelle :
- Via API : swipe (rate limit), recommendations (secret logic ?), events/rsvp (capacity check), squad/join (atomic ops), stripe/* (secrets), account/delete (service_role).
- Direct Supabase : chat, flash plans, profile, conversations, interactions.block, feed, reputation, gamification, etc.

Critère de décision pas documenté. Risque : prochaine feature ajoute un endpoint `useBadges` direct DB puis devient premium-gated → nécessite un API route → duplication.
**Fix** : documenter la règle (ex : "tout ce qui modifie l'état persistent d'un autre user passe par API" OU "tout ce qui a un quota passe par API"). Puis auditer les exceptions. Effort : S doc + M refacto sélectif.

**DA-2 — `useInteractions.block()` et `.undo()` bypass rate-limit** (IMPACT: MEDIUM)
`block` upsert direct dans `interactions`, `undo` delete direct. Le rate-limit de `/api/swipe` compte les `like/pass/superlike` via DB, donc undo → delete → recompte → re-swipe. Exploitable : swipe+undo+swipe+undo = rate-limit contourné.
**Fix** : router `block` et `undo` via `/api/swipe` (ou nouvelle route `/api/interactions`). Effort : S.

---

### Migrations (2 issues)

**MIG-1 — Baseline `001_initial_schema.sql` manquant** (IMPACT: HIGH DX)
Documenté dans `supabase/MIGRATION_HISTORY_NOTE.md` : 24 tables existantes n'ont pas de migration source. `002_new_features.sql` présent dans le filesystem mais **absent de `supabase_migrations.schema_migrations`** (le tracker DB montre seulement 003→006). Impossible de rebuild from scratch.
**Fix** : suivre les instructions du note — `npx supabase db dump` pour générer `001_initial_schema.sql`. Effort : S (30 min).

**MIG-2 — Pas de strategy rollback** (IMPACT: MEDIUM)
Aucune migration n'a de `DOWN` script. Si `003_security_hardening` casse prod, rollback = restaurer DB entière.
**Fix** : convention interne "chaque migration a un `.down.sql` frère". Effort : process change.

---

## Restructuration proposée (priorité ordonnée)

1. **MIG-1 Baseline 001_initial_schema.sql** — S — débloque tous les rollbacks futurs, 30 min via CLI.
2. **DB-4 Fix SECURITY DEFINER views** — S — 2 vues, ERROR-level advisor, risque RLS bypass.
3. **DB-1 RLS DELETE policies manquantes** — S — ajouter 8 policies, évite silent-fail sur `delete conversation`.
4. **DB-2 Fix `auth_rls_initplan` (select auth.uid())** — M — ×10 perf sur toutes les tables, 57 policies.
5. **API-3 Rate limit sur routes écriture manquantes** — M — critique sécurité (squad/join, account/delete).
6. **API-1 Uniformiser pattern auth (SSR cookies partout)** — M — réduit surface bugs auth.
7. **DA-2 Router block/undo via API** — S — ferme exploit rate-limit bypass.
8. **DB-6 Indexes sur 11 FK listées par advisor** — S — perf DELETE cascade.
9. **API-2 + API-4 Zod schemas + error shape unifié** — M — réduit copier-coller, typed client.
10. **HK-2 Intro SWR/TanStack Query pour hooks DB** — XL — gain DX + perf, faire par vague.
11. **DB-5 Unifier popup_events + flash_plans** — L — gros chantier mais simplifie tout un axe.
12. **DB-8 Standardiser FK → profiles.id** — L — cohérence.
13. **DB-3 Fusionner multiple permissive policies** — M — perf.
14. **API-5 Structured logging** — S — observability.
15. **HK-1 + HK-4 Async state unifié + abort signals** — couvert par #10.

---

## Non-issues / bonnes pratiques constatées

- RLS activé sur toutes les tables publiques sauf `spatial_ref_sys` (PostGIS système, advisor le signale mais c'est attendu).
- `/api/swipe` route : validation inputs rigoureuse, INSERT-not-UPSERT (bug doc M5), handling 23505 unique violation, premium-gate via subscription table, réponse typée.
- `/api/stripe/webhook` : signature vérifiée, service_role scopé au webhook uniquement, upsert idempotent sur `stripe_subscription_id` et `stripe_payment_intent_id`, handlers séparés par event type.
- `/api/account/delete` : fait vérif row count pour détecter silent-fail RLS, pattern de défense en profondeur exemplaire.
- Stripe checkout : whitelist de priceId côté serveur (refuse price inconnu), empêche client de créer session avec price à 0.01 €.
- Contraintes CHECK utilisées systématiquement pour enums (status, action, direction, rating 1-5, age 18-99, etc.) — évite la dérive vs types TS.
- Indexes composés bien pensés sur hot paths : `idx_messages_conversation (conversation_id, created_at DESC)`, `idx_rooms_status_started`, `idx_flash_plans_status_when`, partial index `idx_rooms_mode WHERE status='live'`.
- `useChat` : cleanup correct (channelRef + unsubscribe + cancelled flag + timeouts cleared), optimistic updates avec rollback, pagination par range.
- Unique constraints préventifs : `interactions (from_user, to_user)` empêche duplicate swipes au DB level (même si code le ratait), `conversations (user_a, user_b)` avec ordering déterministe dans `createConversation`.

Ne pas casser en refacto : Stripe webhook (signatures + idempotence), la logique `midnightUTC`/`todayStartUTC` dans `/api/swipe`, le pattern de vérification row count dans `/api/account/delete`.

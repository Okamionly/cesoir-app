# AUDIT BACKEND cesoir-app — 2026-04-19

Projet Supabase : `ycyxmvzilzkusecpgvbi` (region eu-west-3, Postgres 17.6.1)
Stack : Next.js 16.2.3 + Supabase SSR + 24 tables public + PostGIS

---

## Résumé exécutif

**2 CRITIQUES** (à fix AVANT tout lancement) — exposition de données perso (✅ exploit démontré), compte delete cassé (✅ vérifié)
**4 HAUTES** — brute force, bucket listing (✅ exploit démontré), HIBP, advisor ERROR
**6 MOYENNES** — search_path, middleware deprecated, orphans auth, etc.
**6 BASSES** — open redirect (downgradé après re-vérif), info leaks mineurs, UX

Total : 18 findings.

### Changes after peer review (re-validation par exploit réel)

- **C1** ✅ CONFIRMÉ — anon key + curl → dump réel des 4 profils (Youssef inclus, WKB location non-null récupérée).
- **C2** ✅ CONFIRMÉ — 0 policy DELETE sur `profiles` ET `storage.objects`. Route delete renvoie success mais rien n'est supprimé.
- **C3** ❌ FAUX POSITIF — testé `new URL('https://mysite.com' + '//evil.com')` → host reste `mysite.com`, path `//evil.com`. Le `${origin}${next}` protège contre l'open redirect classique. Downgradé en B6.
- **H1** ✅ CONFIRMÉ — `POST /storage/v1/object/list/avatars` avec anon Bearer → `[]` (bucket vide actuellement mais la policy laisse passer, fuite dès premier upload user).

---

## 🔴 CRITIQUES (blocker production)

### C1 — Fuite données personnelles via profiles public SELECT

**Fichier** : policy `Public profiles viewable` sur `public.profiles`
**Constat** : `qual = true` + `roles = {public}` → **anyone with anon key (en clair dans le bundle JS) peut SELECT tous les champs de tous les profils SANS être authentifié**.

**Champs exposés** :
- `name`, `age`, `gender`, `bio`
- `location` (PostGIS geography = **lat/lng précis**)
- `city`, `avatar_url`
- `is_online`, `last_seen`, `reliability_score`, `total_meetups`

**Impact** : un attaquant avec curl + l'anon key public peut dumper tous les profils, géolocaliser chaque user au mètre près. **Violation RGPD + risque stalker critique sur une dating app**.

**Fix** :
```sql
DROP POLICY "Public profiles viewable" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
-- Et restreindre la lecture de `location` via une view + SECURITY DEFINER qui filtre
-- pour ne pas rendre exacts les lat/lng, ne retourner que distance arrondie
```

Alternative propre : créer une view `public.profiles_discoverable` qui masque `location` + `city` précis, et révoquer SELECT sur `profiles` pour `authenticated` côté anon-facing queries.

---

### C2 — /api/account/delete silencieusement cassé

**Fichier** : `src/app/api/account/delete/route.ts:38`
**Constat** : route appelle `supabase.from("profiles").delete().eq("id", userId)` via client anon + token user. Mais **aucune policy DELETE n'existe sur `public.profiles`** (vérifié : `SELECT COUNT(*) FROM pg_policies WHERE tablename='profiles' AND cmd='DELETE'` → 0).

**Comportement actuel** : RLS filtre silencieusement le DELETE → retourne `{ success: true }` au user alors qu'**aucune ligne n'est supprimée**. Même comportement pour `storage.from("avatars").remove()` (pas de policy DELETE sur storage.objects).

**Impact** : user demande suppression compte → UX confirme succès → **données toujours en DB**. Violation directe RGPD Article 17 (droit à l'oubli).

**Fix** :
```sql
CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
```

Et côté route : ajouter SUPABASE_SERVICE_ROLE_KEY pour `supabase.auth.admin.deleteUser(userId)` (le comment à la ligne 43-45 admet l'orphan). Tant qu'on ne delete pas l'auth user, un attaquant qui récupère l'email peut demander un "reset password" et créer un nouveau profile avec même ID.

---

### ~~C3 — Open redirect~~ (downgradé en B6 après re-validation)

**Constat initial** : `src/app/auth/callback/route.ts:29` → `return NextResponse.redirect(`${origin}${next}`);` avec `next` user-controlled.

**Re-test** :
```js
new URL('https://cesoir-app.vercel.app' + '//evil.com')
// → host: 'cesoir-app.vercel.app', path: '//evil.com'
```
Le `${origin}${next}` force la résolution same-origin. Le browser navigue vers `https://cesoir-app.vercel.app//evil.com` (path weird mais same host). Pas d'exfiltration cross-domain. **L'attaque classique n'est pas exploitable avec ce code.**

Reste une bonne pratique (défense en profondeur) à appliquer — voir B6.

---

## 🟠 HAUTES

### H1 — Bucket `avatars` autorise le listing public

**Constat** (advisor Supabase) : policy `Avatar public read` a `bucket_id = 'avatars'::text` → tout client peut `storage.list()` et récupérer la liste de TOUS les fichiers (donc UUIDs de tous les users).

**Impact** : recensement complet de la base user via avatars.

**Fix** : les buckets publics n'ont pas besoin de SELECT policy pour servir les URLs directes. Drop la policy SELECT :
```sql
DROP POLICY "Avatar public read" ON storage.objects;
```
Les avatars restent accessibles via URL directe `/storage/v1/object/public/avatars/{uuid}/avatar.jpg` (pas besoin de SELECT). Seul le `list()` est bloqué.

Remediation : https://supabase.com/docs/guides/database/database-linter?lint=0025

### H2 — Leaked password protection désactivé

**Constat** (advisor) : Supabase Auth n'est pas configuré pour checker HaveIBeenPwned lors du signup/reset.
**Impact** : users peuvent choisir des passwords déjà leaked dans des breaches précédents.
**Fix** : Dashboard Supabase → Authentication → Policies → Password Security → Enable "Check against HaveIBeenPwned".

### H3 — Pas de rate limit sur /api/auth/login

**Fichier** : `src/app/api/auth/login/route.ts`
**Constat** : aucune limite sur les tentatives de login. `/api/swipe` a DAILY_LIMIT=100 mais login n'a rien.
**Impact** : brute force des comptes depuis un IP unique jusqu'au rate limit Supabase Auth (qui existe mais est généreux).
**Fix** : middleware rate-limit par IP + email via Redis/KV ou un simple in-memory LRU pour le dev. En prod Vercel, utiliser `@vercel/kv` ou Upstash.

### H4 — Advisor ERROR : RLS désactivé sur spatial_ref_sys

**Constat** : table PostGIS `public.spatial_ref_sys` sans RLS (8500 rows).
**Impact** : faible (système, pas de données user), mais ERROR dans les advisors bloque le linter.
**Fix** : `ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;` + policy SELECT permissive, OU déplacer postgis hors du schema public (solution H6).

---

## 🟡 MOYENNES

### M1 — 6 fonctions avec search_path mutable

**Constat** : `nearby_profiles`, `update_location` (x2 versions), `handle_new_user`, `cleanup_stale_online` toutes sans `SET search_path`.
**Impact** : search_path manipulation → potentiel privilege escalation si un attaquant injecte une fonction dans un schema non-qualifié.
**Fix** : pour chaque fonction, ajouter `SET search_path = public, pg_temp` dans la définition.
Remediation : https://supabase.com/docs/guides/database/database-linter?lint=0011

### M2 — Middleware deprecated Next 16

**Constat** : `src/middleware.ts` → output dev server affiche `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
**Fix** : renommer `src/middleware.ts` → `src/proxy.ts`. Voir docs Next 16 (lire `node_modules/next/dist/docs/` d'abord).

### M3 — PostGIS extension dans schema public

**Constat** (advisor) : `postgis` installed dans `public`.
**Impact** : pollue le namespace public, rend les fonctions postgis accessibles sans qualificatif (risque M1).
**Fix** : `CREATE SCHEMA extensions; ALTER EXTENSION postgis SET SCHEMA extensions;` + mettre à jour les function search_path.

### M4 — Middleware fallback silencieux sur env vars manquantes

**Fichier** : `src/middleware.ts:14-16`
**Constat** : si `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` manquent, middleware laisse passer → **toutes les routes protégées deviennent publiques en prod**.
**Impact** : misconfig prod = ouverture complete des routes auth-gated.
**Fix** : en prod, faire crasher volontairement (throw) plutôt que fallback silencieux. Log l'événement.

### M5 — Swipe upsert silencieux

**Fichier** : `src/app/api/swipe/route.ts:97`
**Constat** : `.upsert()` permet à un user de re-swiper un même profil (le like devient pass ou inverse). Ça change la logique des matches.
**Fix** : utiliser `.insert()` + catcher unique constraint, retourner erreur "déjà swipé".

### M6 — Leak info /api/auth/login (user exists vs wrong password)

**Fichier** : `src/app/api/auth/login/route.ts:30`
**Constat** : retourne `error?.message` de Supabase qui distingue "user not found" de "wrong password".
**Fix** : message générique unique "Email ou mot de passe incorrect" quel que soit le type d'erreur.

---

## 🟢 BASSES

### B1 — recommendations.genderFilter pas validé
`src/app/api/recommendations/route.ts:50` → passé brut à `findMatches`. Devrait être whitelist : `["men","women","all",null]`.

### B2 — Swipe reset UTC midnight, pas local
User en Asie reset à midi local. UX mineure.

### B3 — Pas de policy UPDATE sur messages
OK si voulu (messages immutables post-envoi), à documenter.

### B4 — Pas de policy DELETE sur reports/feedback
OK si audit trail voulu, à documenter.

### B5 — Historique migrations incomplet
1 seul fichier `002_new_features.sql` pour 24 tables. L'historique Supabase est incomplet (tables créées via dashboard). Risque pour reproductibilité environnements.
**Fix** : `supabase db diff` pour dumper l'état actuel en migration.

### B6 — Whitelist `next` param dans /auth/callback (défense en profondeur)
**Fichier** : `src/app/auth/callback/route.ts:8`
**Contexte** : l'open redirect classique n'est pas exploitable (voir C3 supra), mais un refactor futur qui drop le `${origin}` concat ouvrirait la faille. Ajouter une validation stricte maintenant.
```ts
const next = searchParams.get("next") ?? "/browse";
const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/browse";
return NextResponse.redirect(`${origin}${safeNext}`);
```

### B7 — Rate limit Supabase Auth existe mais faible
**Contexte** : H3 note l'absence de rate limit applicatif sur `/api/auth/login`. Supabase Auth a son propre rate limit natif (5-10 req/h/IP) — donc le pire cas est limité. Mais ajouter un layer app côté Vercel reste mieux pour:
- Rate limit par email (pas juste par IP, contre les distributed attacks)
- Observabilité (logs Vercel vs logs Supabase séparés)
- Custom business rules (ex: lockout après 10 tentatives sur un email)

---

## Plan d'action recommandé

### Sprint 1 (avant tout utilisateur réel) — 1-2h
- [ ] C1 : scoper la policy `Public profiles viewable` à `authenticated` + review ce qui doit être exposé
- [ ] C2 : ajouter policies DELETE sur profiles + storage.objects + upgrade route delete pour appeler `auth.admin.deleteUser` via service role

### Sprint 2 (hardening) — 3-4h
- [ ] H1 : drop `Avatar public read`
- [ ] H2 : enable HIBP dashboard
- [ ] H3 : rate limit login
- [ ] H4 : RLS sur spatial_ref_sys
- [ ] M1 : search_path sur les 6 fonctions
- [ ] M4 : crash middleware si env vars manquent en prod

### Sprint 3 (cleanup) — 2h
- [ ] M2 : middleware → proxy (Next 16)
- [ ] M3 : postgis → schema extensions
- [ ] M5 : swipe reject duplicates
- [ ] M6 : generic login error
- [ ] B5 : generate missing migrations

---

## Points positifs

- ✅ 23/24 tables public ont RLS enabled
- ✅ Toutes les tables ont au moins une policy (aucune orpheline)
- ✅ Messages policies checkent bien l'appartenance à la conversation (`EXISTS (SELECT...)`)
- ✅ swipe rate-limiting en place (100/jour)
- ✅ swipe valide direction contre whitelist
- ✅ swipe prevent self-swipe
- ✅ conversations deterministic ordering (évite doublons)
- ✅ middleware utilise SSR correctement (getUser, pas getSession)
- ✅ Pas de service_role key dans le client
- ✅ Auth callback utilise SSR createServerClient

Le code est **globalement propre** — les issues viennent majoritairement des policies DB et de la config, pas du code applicatif.

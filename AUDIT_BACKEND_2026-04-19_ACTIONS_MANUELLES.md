# Actions manuelles dashboard Supabase — restantes

Tout ce qui ne pouvait pas être appliqué via le SQL automatique (raisons : ownership superuser, settings Auth, ou trop risqué sans staging).

Lien dashboard : https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi

---

## 🔴 H4 — Activer RLS sur `spatial_ref_sys` (5 min)

**Pourquoi automatique a échoué** : la table appartient au superuser `postgres`, le rôle migration n'a pas l'ownership.

**Action** :
1. Aller dans **Database → SQL Editor**
2. Run :
   ```sql
   ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Anyone can read spatial_ref_sys"
     ON public.spatial_ref_sys FOR SELECT
     TO public
     USING (true);
   ```
3. Vérifier dans Database → Advisors que l'ERROR a disparu.

**Alternative** (si toujours bloqué) : ouvrir un ticket support Supabase pour demander `ALTER TABLE` côté infra.

---

## 🟠 H2 — Activer Leaked Password Protection (HaveIBeenPwned) (2 min)

**Pourquoi pas auto** : c'est un setting Auth, pas du SQL.

**Action** :
1. **Authentication → Sign In / Up → Auth Providers → Email** (ou directement **Authentication → Policies**)
2. Section **Password Security** : enable **"Check passwords against HaveIBeenPwned"**
3. Optionnel : remonter le **Min password length** à 12 (currently 6 par défaut)

Effet : signup / reset password refusés si password déjà leaked dans une breach connue.

---

## 🟡 M3 — Déplacer extension PostGIS hors du schema public (15 min, RISQUÉ)

**Pourquoi pas auto** : le déplacement casse les fonctions existantes (`nearby_profiles`, `update_location`) qui référencent `postgis` non-qualifié. Doit être fait avec staging et rebuild des fonctions.

**Action** (à faire en heures creuses, prendre un snapshot DB avant) :

1. Backup la DB :
   ```bash
   supabase db dump --project-ref ycyxmvzilzkusecpgvbi -f backup_pre_postgis_move.sql
   ```

2. Dans SQL Editor :
   ```sql
   -- Créer le schema dédié
   CREATE SCHEMA IF NOT EXISTS extensions;

   -- Déplacer postgis (et ses dépendances)
   ALTER EXTENSION postgis SET SCHEMA extensions;
   -- Si postgis_topology, postgis_raster activées, idem.
   ```

3. **Recréer chaque fonction** qui utilise PostGIS en qualifiant tous les appels :
   - `geography(...)` → `extensions.geography(...)`
   - `ST_DWithin(...)` → `extensions.st_dwithin(...)`
   - `ST_Distance(...)` → `extensions.st_distance(...)`
   - etc.

4. **Mettre à jour le `search_path`** des fonctions pour inclure `extensions` :
   ```sql
   ALTER FUNCTION public.nearby_profiles(...) SET search_path = 'extensions';
   ALTER FUNCTION public.update_location(...) SET search_path = 'extensions';
   ```

5. Tester intensivement la flow matching.

**Alternative pragmatique** : laisser PostGIS dans `public` et accepter le warning advisor. Le risque réel d'exploitation est faible si les fonctions ont leur `search_path` pinné (ce qui est désormais le cas via M1).

---

## 🟢 Bonus — Configurer SUPABASE_SERVICE_ROLE_KEY pour `/api/account/delete`

**Pourquoi** : la route delete est désormais fonctionnelle (policies DELETE en place), mais sans service role elle laisse une entrée orpheline dans `auth.users` (l'email ne peut plus être réutilisé).

**Action** :
1. Dashboard → **Settings → API**
2. Copier la valeur **service_role** (⚠️ secret, ne jamais committer en clair)
3. Local : remplacer dans `.env.local` la ligne `SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_SERVICE_ROLE_KEY_FROM_DASHBOARD`
4. Vercel : `Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY` (Production + Preview + Development)
5. Redeploy

Effet : `/api/account/delete` appelle `auth.admin.deleteUser` et nettoie complètement.

---

## Vérification post-actions

Après chaque action, re-run les advisors :
```sql
-- Via SQL Editor ou Database → Advisors panel
```

Le résultat attendu après TOUT (auto + manuel) :
- 0 ERROR
- 0 WARN

(reste éventuellement le warning HIBP si pas activé)

---

## État actuel post-migration auto (2026-04-19)

✅ **Fixé automatiquement** :
- C1 — profiles SELECT scoped to authenticated
- C2 — DELETE policies sur profiles + storage.objects (avatars)
- H1 — Avatar listing policy supprimée
- M1 — search_path pinné sur 6 fonctions

✅ **Fixé côté code** :
- C2bis — route delete vérifie les rows + supporte service role
- H3 — rate limit 5/60s sur /api/auth/login (in-memory)
- M2 — middleware.ts → proxy.ts (Next 16)
- M4 — proxy crash en prod si env vars manquent
- M5 — swipe rejette les duplicates (HTTP 409)
- M6 — login retourne message générique
- B1 — genderFilter validé contre whitelist + lat/lng range check
- B6 — `next` param whitelist (relative paths only)

🔧 **À faire manuellement** :
- H4 — RLS spatial_ref_sys (5 min, ce doc)
- H2 — Enable HIBP (2 min, ce doc)
- M3 — Move PostGIS out of public (15 min risqué, ce doc)
- Service role key (10 min, ce doc)

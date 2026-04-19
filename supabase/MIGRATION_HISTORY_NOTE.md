# Note sur l'historique des migrations

## État actuel

Le repo contient `supabase/migrations/002_new_features.sql` mais **24 tables existent** dans la DB.

Cause : la majorité du schema a été créé via le dashboard Supabase ou un script externe, sans migration tracking. Seul `002_new_features.sql` est versionné.

La migration `003_security_hardening` (audit 2026-04-19) a été appliquée via MCP `apply_migration` et est tracée par Supabase.

## Pour reconstruire l'historique

```bash
# 1. Login CLI
npx supabase login

# 2. Link au projet
npx supabase link --project-ref ycyxmvzilzkusecpgvbi

# 3. Dump complet schema actuel en migration
npx supabase db dump -f supabase/migrations/001_initial_schema.sql --schema public

# 4. Dump auth + storage policies (séparément)
npx supabase db dump -f supabase/migrations/001b_auth_storage.sql --schema auth,storage

# 5. Vérifier
npx supabase migration list
```

## Pourquoi pas via Claude/MCP ?

Le MCP `apply_migration` est unidirectionnel (apply only). Pour dump le schema actuel, il faudrait écrire un script qui itère `pg_dump`-style via `execute_sql` — possible mais lourd (750 fonctions PostGIS, 52 policies, 24 tables CREATE + indexes + constraints).

La CLI Supabase fait le job en 30 secondes avec format propre.

## Recommandé

Faire le dump CLI **après** validation des actions manuelles dashboard (H4, H2, M3) — comme ça le baseline `001_initial_schema.sql` capture aussi ces fixes.

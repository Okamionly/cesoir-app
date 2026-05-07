# CeSoir Matcher Audit — 2026-05-07

**Scope :** `src/lib/matching.ts` (733 lignes) · `src/lib/compatibility.ts` · `src/lib/karma-tiers.ts` · `src/lib/useMasteryTiers.ts`

---

## 1. Reverse-engineer algo actuel

### Architecture pipeline (findMatches)
1. RPC `nearby_profiles` → over-fetch ×3 (radius + mode_filter + gender_filter)
2. Dedup par id (bug LEFT JOIN multi-modes, fix 2026-04-26)
3. Exclude self + interactions déjà faites
4. Age filter client-side
5. 6 fetches parallèles : modes candidats, karma 90j, reviews, founder set, vibe today, ghost penalties
6. Score chaque candidat → sort desc → slice(limit)

### Poids actuels (score 0-100)

| Signal | Bucket | Max pts | Détail |
|---|---|---|---|
| Mode overlap | mode | 40 | 0 shared=0 / 1=25 / 2=33 / 3+=40 + bonus +5 si primary mode match |
| Distance | distance | 25 | ≤1km=25 / ≤3=20 / ≤5=15 / ≤10=8 / >10=0 |
| Timing (available_time) | timing | 20 | ≤30min=20 / ≤1h=15 / ≤2h=10 / plus tard=5 / null=3 |
| Verification | social | +5 | is_verified |
| Karma 90j | social | 0-5 | clamp(0,100)/100 * 5 |
| Review avg | social | 0-5 | (avg-1)/4 * 5 |
| Broadcast actif | social | +5 | broadcast_until > now() |
| Vibe match | social | +2 | same vibe_today (mig 039) |
| Ghost penalty | social | -5 | ghost_penalties actif (mig 045) |
| **Social cap** | social | **15** | plancher 0, plafond 15 |

### Signaux absents de l'algo actuel
- Mastery tier (apprenti/initié/maître) → calculé côté UI, jamais injecté dans le score
- Freshness (dernière activité) → non scorée
- Rotation anti-burnout (même demographic / même mode en boucle) → absente
- Unmatch 30j exclusion → absente (seule `interactions` table est lue)
- Expiration match (24h) → absente

---

## 2. Faiblesses identifiées

**A — Karma mapping sous-linéaire compressé.**
`Math.round((karma/100)*5)` donne 5 pts max mais un user karma=50 ne vaut que 2.5 pts. Delta vérification/karma trop proche → un non-vérifié karma=100 égale un vérifié karma=0.

**B — getVibesForUsers fan-out N RPC calls.**
Un fan-out individuel par candidat (N appels `get_vibe_today`). À 60 candidats c'est 60 round-trips parallèles. Commentaire TODO présent mais non traité. À 500+ users en beta ce sera le premier goulot.

**C — getReviewAvgForUsers : scan illimité.**
Pas de filtre `created_at` ni de LIMIT sur la table `reviews`. Même problème que karma pré-fix 2026-04-26. Grow vector.

**D — Mode score non-linéaire inégal.**
0 shared = 0 (hard penalty). 1 shared = 25 (saut brutal). En pratique un user Solo Diner ne verra jamais un Night Owl dans son deck même s'ils sont à 200m et disponibles maintenant. Risque désert de résultats dans les premières semaines de beta avec peu d'utilisateurs.

**E — Pas de diversification.**
Sort pur par score → le deck peut être 100% même arrondissement, même âge. No-ghetto rule non implémentée.

---

## 3. Matching v2 — Score 0-100 multi-facteur

### Nouveau mapping de poids

| Signal | Bucket | Max pts | Changement vs v1 |
|---|---|---|---|
| Mode overlap | mode | 35 | -5 pts (partage avec freshness) |
| Distance (500m grid) | distance | 20 | -5 pts |
| Temporal urgency | timing | 20 | = |
| Compatibility (prompts + vibe + langue) | compat | 10 | NOUVEAU — from compatibility.ts |
| Social proof (karma tier + review + verif) | social | 10 | -5 pts, refactoré |
| Freshness (actif ≤48h) | freshness | 5 | NOUVEAU |

**Total max : 100. Chaque bucket plafonné indépendamment.**

### Détail social bucket v2 (10 pts max)
- Verification : +3 (was +5)
- Karma tier gold : +3 / silver : +2 / none : clamp karma/100*2
- Review avg >4 : +2 / >3 : +1
- Broadcast actif : +3 (moved hors social, ajouté au timing bucket)
- Ghost penalty actif : -4
- Plancher 0

### Nouveau timing bucket v2 (20 pts)
- Available ≤30min : 15
- Broadcast actif (intent déclaré) : +3 supplémentaire (cap 18 avant autres)
- Available ≤1h : 12
- Available ≤2h : 8
- Later tonight : 4
- null : 2

### Nouveau compat bucket v2 (10 pts)
- Same vibe today : +4 (was +2 dans social)
- Language overlap via compatibility.ts : 0-3 pts
- Mastery tier candidat (maître=+3 / initié=+2 / apprenti=+1) — signal IRL reliability
- Cap 10

### Freshness bucket (5 pts)
- Actif (mode_activations.updated_at ou last seen) ≤24h : 5
- ≤48h : 3
- >48h : 0

### Anti-patterns v2

**1. Rotation diversité.**
Post-scoring, appliquer une passe de re-ranking : sur les 20 premiers, limiter à max 5 profils du même arrondissement (lat_rough grid). Si >5, downranker les suivants d'un tier (swap avec rang 21-25). Implémentation : groupBy(gridCell) + interleave.

**2. Unmatch cooldown 30j.**
Étendre `getExcludedUserIds` pour inclure un JOIN `unmatches` table (`unmatched_at > now() - interval '30 days'`). Nécessite migration : table `unmatches(from_user, to_user, unmatched_at)`.

**3. Same-mode burnout protection.**
Si le user a swipé 50+ profils Solo Diner aujourd'hui sans match : descendre le poids mode de 35 à 25 et monter distance à 30 pour le reste de la session. Signal : lire `interactions` count par mode aujourd'hui.

---

## 4. Fixes DB critiques

| Fix | Priorité | Effort |
|---|---|---|
| `getVibesForUsers` → batch SELECT `vibe_today, vibe_set_at WHERE id IN (...)` client-side UTC filter | P0 | XS |
| `getReviewAvgForUsers` → ajouter `.gte('created_at', iso90daysAgo).limit(2000)` | P0 | XS |
| RPC `get_karma_totals(user_ids uuid[])` → éliminer agregation client | P1 | S |
| Unmatch cooldown table | P1 | S |
| Mastery tier batch fetch → RPC `compute_mastery_tier` adapté pour array | P2 | M |

---

## 5. 5 features matching Q3

### 5.1 Boost Premium — Visibility Surge 30min
**Mécanisme :** Le user achète/dépense 10 roses → `profiles.boosted_until = now() + interval '30 min'`. Dans `nearby_profiles` RPC : `ORDER BY boosted_until DESC NULLS LAST, score DESC`. Côté scoring v2 : si `boosted_until > now()` → bypass le bucket mode (show même sans mode overlap). Affiché avec un anneau doré pulsant sur la SwipeCard.
**Gate :** Premium ou 10 roses. Limité à 1/jour Free, 3/jour Premium.

### 5.2 Rewind — Last Swipe Undo
**Déjà shippé partiellement** (`useSwipeUndo.ts` + `/api/undos`). Ce qui manque pour le matcher : quand un undo est exécuté, supprimer la row `interactions` (already done in API) ET re-injecter le profil en position 1 du deck avec son score recalculé à chaud (appel `calculateMatchScore` client-side avec les données en cache). Actuellement le profil revient mais à sa position d'origine dans le sort.
**Gate :** 1/jour gratuit, illimité Premium.

### 5.3 Super Likes Ciblés Mode
**Mécanisme :** Au lieu d'un super like générique, le user envoie un super like taggé mode (`superlike_mode: ModeKey`). Côté scoring : quand le destinataire ouvre son deck, si un super like inbound existe pour le mode actif de l'expéditeur, le profil apparaît en position 1 avec badge mode + notification push. Nouvelle colonne `interactions.superlike_mode` nullable.
**Valeur :** Conversion match ×3 sur les super likes ordinaires (signal industrie). Le tagging mode réduit les super likes non pertinents.

### 5.4 "Your Type" — ML léger
**Mécanisme :** Après 30+ swipes, calculer le vecteur préférence implicite : distribution modes likés, tranche d'âge likée, distance moyenne acceptée, karma tier moyen des likés. Stocker dans `profiles.preference_vector jsonb`. Au scoring v2, ajouter un micro-bucket `affinity` (0-5 pts) : cosine similarity entre vecteur préférence user et vecteur de caractéristiques candidat.
**Privacy :** opt-in explicite, supprimé à l'effacement RGPD.
**Pas de modèle externe** — calcul pure SQL/TS sur les interactions existantes.

### 5.5 Match Expiration Intelligente 24h
**Mécanisme :** À la création d'un match (`matches` table), insérer `expires_at = now() + interval '24 hours'`. Cron `0 3 * * *` (3h UTC) : archiver les matches expirés sans conversation (`conversation_count = 0`). Notification push 2h avant expiration : "Votre match avec Sofia expire dans 2h — dites quelque chose !" Côté matching : les matches expirés sans interaction re-tombent dans l'exclusion list uniquement après 7j (pas 30j comme les unmatches volontaires).
**Anti-pattern évité :** Ne pas re-présenter un profil expiré avant 7j, sinon le deck se remplit des mêmes personnes.

---

## 6. Tests à ajouter avant deploy v2

Les tests existants (`matching.test.ts`) couvrent v1 — ajouter :
- Regression : score v2 ≥ score v1 pour profil broadcast + mastery maitre + vibe match (score plus dense)
- Diversification : vérifier que sur 25 candidats même grid, max 5 passent dans le top 20
- Unmatch cooldown : profil unmatché il y a 15j n'apparaît pas dans le deck
- Ghost penalty v2 : -4 pts social, floor 0 même si karma négatif

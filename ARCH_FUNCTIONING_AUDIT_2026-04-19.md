# Functioning Architecture Audit — 2026-04-19

**Scope**: `src/app/**/page.tsx` (~55 routes) + `src/lib/*` business logic + flows.
**Mode**: Read-only. Focus: features and flows, not code style.

---

## Executive Summary

CeSoir a un **product sprawl massif** : 4 features parallèles pour "créer un plan ce soir" (events / soiree / flash-plans / plan), 3 pour "trouver quelqu'un" (browse / discover / map), 3 features groupes (squad / group / rooms) et 5 pages gamification (achievements / challenges / leaderboard / trust / reviews).

La navigation principale (`BottomNav`) n'expose que **5 onglets** : `feed / map / chat / modes / profile`. Résultat : **au moins 30 routes sont orphelines** dans la nav — accessibles uniquement via deep-links ou `CrossLinkCard`, ce qui crée d'énormes zones de l'app jamais visitées.

Le backend n'est pas aussi éclaté que le frontend :
- `useEvents` / `useSoiree` / `useFlashPlans` / `usePlans` = 4 hooks avec 4 tables DB distinctes, alors que 2 suffiraient (events publics vs plans 1:1 privés).
- Gamification : `gamification.ts` + `badges.ts` + `achievements.ts` + `useReputation` sont séparés mais décrivent tous la même mécanique XP/karma/trust.
- `mock-profiles.ts` est encore importé par **5 pages live** (browse, discover, map, chat…).

**Priorité #1** : consolider events+soiree+flash-plans en **un seul concept "Plan"** (avec types : flash / programmé / privé 1:1), exposer dans BottomNav, dégager ~15 routes mortes.

---

## Features redondantes à consolider

### 1. events / soiree / flash-plans / popup_events / plan — **4 features = 1 concept**

| Route | Hook | DB table | Signal distinctif |
|---|---|---|---|
| `/events` + `/events/[id]` + `/events/create` + `/events/marketplace` | `useEvents` | `popup_events` + `event_attendees` | Events publics à attendance ouverte (pop-up events) |
| `/soiree` + `/soiree/[id]` + `/soiree/create` | `useSoiree` | `soirees` (implicite) | Soirées thématiques chez soi / bar, avec dresscode/ambiance |
| `/flash-plans` | `useFlashPlans` | `flash_plans` + `flash_plan_participants` | Plans urgents avec countdown deadline |
| `/plan/[matchId]` | `usePlans` | `plans` | Plan 1:1 **post-match** (flow matching → chat → plan) |

**Overlap réel** : events, soiree et flash-plans sont **trois variantes UX du même objet** (titre + lieu + heure + participants max + mode). Seuls les accents (urgence, ambiance, marketplace) diffèrent — pas la structure de données.

**Proposition** :
- **Unifier en `/plans`** avec paramètre `type: "flash" | "soiree" | "popup" | "private"`.
- **Garder** : `/plan/[id]` (privé 1:1 post-match — flow différent).
- **Consolider** `/events`, `/events/create`, `/soiree`, `/soiree/create`, `/flash-plans` → `/plans`, `/plans/create?type=...`, `/plans/[id]`.
- **Supprimer** : `/events/marketplace` (concept ambigu, non relié à la nav).
- **Deprecate tables** : merger `popup_events` + `soirees` + `flash_plans` en une table `plans` avec colonne `type` + colonnes optionnelles (`deadline`, `ambiance`, `dress_code`).

**Gain** : -10 routes, -3 hooks (useEvents + useSoiree + useFlashPlans → `usePlans`), -3 tables DB.

### 2. discover / browse / map — **3 vues = 1 dataset**

| Route | Signal |
|---|---|
| `/browse` | **Swipe** vertical Tinder-style (vrai matching pipeline via `useMatches`) |
| `/discover` | **Grid + filtres** (age, distance, sort) |
| `/map` | **Carte géographique** MapLibre + hotspots |

Ces 3 pages servent **le même cursor de profils** (`nearby_profiles` RPC), juste avec 3 UI. C'est légitime côté produit, mais :
- `/discover` utilise encore `MOCK_PROFILES` (pas `useMatches` comme `/browse`).
- `/map` mélange real profiles + fake positions (`+ (Math.random() - 0.5) * 0.02`).
- Pas de toggle UI entre les 3 vues — l'utilisateur ne sait pas qu'elles existent.

**Proposition** :
- **Garder les 3** mais les unifier sous `/explore` avec 3 tabs `Swipe | Grid | Map`.
- **Migrer** `/discover` vers `useMatches` (supprimer `mock-profiles` dépendance).
- **Fixer** `/map` : vraies lat/lng depuis Supabase, pas `Math.random()`.

### 3. squad / group / rooms — **3 features groupe, sémantique floue**

| Route | Concept réel (après lecture) |
|---|---|
| `/squad` | Groupes de 2-4 amis qui sortent ensemble (real: `useSquad`) |
| `/group` | Sorties collectives ouvertes ("rejoins une sortie") — **100% mock, pas de hook DB** |
| `/rooms` | Audio/chat rooms live Clubhouse-style (real: `useRooms`) |

**Conflit** : `/group` et `/squad` décrivent la même chose (sortie de groupe), `/group` est juste une version mock. `/rooms` est un concept totalement différent (audio live).

**Proposition** :
- **Supprimer** `/group` (remplacé par `/squad` qui a déjà la même logique mais branché DB).
- **Renommer** `/squad` → `/groups` (plus clair).
- **Garder** `/rooms` tel quel — c'est un feature audio/live distinct.

### 4. Gamification : 5 pages à consolider en 1 hub

| Route | Rôle | Source |
|---|---|---|
| `/achievements` | Badges gagnés/verrouillés | `useBadges` + `badges.ts` |
| `/challenges` | Défis quotidiens/hebdos | `useChallenges` |
| `/leaderboard` | Top users par karma/meetups | Supabase `profiles` |
| `/trust` | Score de confiance + vérifications | `useReputation` |
| `/reviews` | Reviews reçues/données | `useReputation` |

Les 5 pages décrivent des facettes du même système (XP / karma / réputation).
- `gamification.ts` définit XP logic.
- `badges.ts` définit badges.
- `achievements.ts` existe en parallèle (dupliqué).
- `useReputation.ts` gère trust + reviews.

**Proposition** :
- **Consolider** en un hub `/profile/reputation` avec 5 tabs (Badges | Défis | Classement | Confiance | Reviews).
- **Fusionner** `achievements.ts` + `badges.ts` → un seul fichier.
- **Garder** hooks séparés (data fetching différent) mais point d'entrée UI unique.

---

## State management fragmentation

**35 fichiers** utilisent `localStorage`. Inventaire rapide :

| Donnée en localStorage | Devrait être en DB | Raison |
|---|---|---|
| `cesoir_roses` (balance) | **Oui** | Currency payante — doit survivre device switch |
| `cesoir_roses_history` | **Oui** | Audit trail |
| `cesoir_premium` | **Oui** | Déjà en Stripe webhook, redondant côté client |
| `cesoir-swipe-undos` (daily count) | **Oui** | Anti-cheat (effacer localStorage = undos illimités) |
| `cesoir_last_challenge_date` | **Oui** | Lié à `useChallenges` DB |
| `cesoir_match_cap` | **Oui** | Free tier limit — doit être server-enforced |

| Donnée OK en localStorage |
|---|
| DarkMode preference, reducedMotion, i18n locale, sound on/off, tutorial seen |

**Problème structurel** : beaucoup de business logic payante/anti-cheat vit **côté client uniquement**. Un user qui clear localStorage bypass roses cap, undo cap, match cap, premium.

**Proposition** :
- Migrer roses + premium + caps vers Supabase (`user_limits` table avec RLS).
- Garder localStorage **uniquement** pour preferences UI.
- Hook pattern : `useRoses` lit DB en priorité, localStorage en fallback offline.

---

## User flows frictions

### Onboarding

`/` (landing) → `/register` (5 steps : nom+age / email+pwd / gender+looking / modes / bio+photo) → `/onboarding` (sélection modes, re-demandée) → `/welcome` (slides explicatifs) → `/feed`

**Friction** : la sélection des modes est **demandée 2 fois** (step 4 du register + screen principal de `/onboarding`). Le second sert à écrire en DB (`mode_activations`) mais le premier est perdu. **Incohérent**.

**Proposition** : fusionner. Faire `/register` → 4 steps, puis `/welcome` slides, puis directement `/feed` avec modes déjà écrits en DB.

### Match → chat

`/browse` (swipe) → match modal → `/chat/[id]` (conv) → message

**Optimal** ✓. Seul souci : le modal de match ne pousse pas directement vers `/plan/[matchId]` — l'user doit passer par le chat puis retrouver une action "proposer un plan".

### Plan creation

Routes impliquées : `/plan/[matchId]` (post-match) **MAIS AUSSI** `/soiree/create`, `/events/create`, `/flash-plans` — l'user est perdu entre 4 points d'entrée.

**Flow cible post-consolidation** :
- **Plan privé** (post-match) → `/plan/[matchId]`
- **Plan public** (ouvert à tous) → `/plans/create?type=popup|soiree|flash`

### Premium upgrade

`/premium` (pricing) → `/api/stripe/checkout` → Stripe hosted → webhook `/api/stripe/webhook` → DB update → retour app

**Flow linéaire** ✓ mais :
- **Pas de page `/premium/success`** — user revient sur l'app sans feedback.
- `localStorage.cesoir_premium` peut être désynchro avec la vraie sub Stripe.

---

## Dead code candidates

### Routes non linkées depuis BottomNav / CrossLinkCard

Audit des `href=` dans `src/components/*` : aucun lien vers **trending, feed (comme tab seulement), shop, speed-dating, why-free, guide, rooms, group, squad** depuis `components/`. Seules exceptions : `CrossLinkCard` qui link `/discover`, `/map`, `/events`.

Routes probablement orphelines (zéro lien trouvé dans nav/components) :
- `/trending` — concept probable Twitter-style, aucune entrée UI
- `/shop` — marketplace roses/premium, dupliqué avec `/premium`
- `/speed-dating` — feature isolée, pas de rattachement
- `/events/marketplace` — nested orphelin
- `/why-free` — landing FAQ, pas dans nav
- `/guide` — probablement tutorial alternatif à `/welcome`
- `/group` — concurrent de `/squad`, 100% mock
- `/rooms` + `/rooms/[id]` — audio rooms, pas d'entrée UI
- `/modes` + `/modes/[mode]` — tab BottomNav existe mais jamais directement linké pour un mode spécifique
- `/trust`, `/reviews`, `/leaderboard`, `/achievements`, `/challenges` — pages gamification orphelines

### Hooks probablement jamais/peu importés

À vérifier en grep ciblé :
- `useWomenFirst` — 1 référence, composant isolé
- `useMidnightReset` — 1 composant (`MidnightReset`)
- `useAssistant` — AI assistant, statut flou
- `useRendezvous` — jamais référencé dans les pages visitées
- `useSafety` — 1 page `/safety`, pas dans nav
- `usePausableInterval` — utility, probablement ok
- `achievements.ts` (legacy) vs `badges.ts` (actuel) — duplication

### Types exportés

À grep spécifiquement (budget temps dépassé) : `SoireeType`, `BudgetRange`, `Ambiance`, `DressCode`, `BringWhat` exportés par `useSoiree` mais non utilisés hors `soiree/create`. Candidats `private`.

---

## Restructuration proposée (priorité)

1. **[BIG WIN] Consolider events+soiree+flash-plans → `/plans`** avec param `type`.
   - Gain : -10 routes, -3 hooks, -3 tables DB.
   - Risque : migration DB (données existantes), UI à refaire.
   - Effort : 3-5 jours.

2. **[UX] Exposer gamification dans un hub unique** `/profile/reputation` avec 5 tabs.
   - Gain : découverte features, navigation claire.
   - Effort : 1 jour (wrapper + tabs, pages existantes réutilisées).

3. **[SECURITE] Migrer business logic payante de localStorage vers DB**.
   - Tables : `user_limits` (roses, undos, match_cap) + RLS.
   - Gain : anti-cheat + sync multi-device.
   - Effort : 2 jours.

4. **[CLEANUP] Supprimer routes mortes** : `/group`, `/events/marketplace`, `/trending` (si confirmé non utilisé), `/shop` (merger dans `/premium`), `/guide` (merger dans `/welcome`).
   - Gain : -5 routes, code mort enlevé.
   - Effort : 2h.

5. **[FLOW] Unifier onboarding** : supprimer duplication modes entre `/register` et `/onboarding`.
   - Gain : -30% étapes onboarding.
   - Effort : 4h.

6. **[NAV] Ajouter "Plans" et "Reputation" au BottomNav** (ou à un drawer secondaire).
   - Gain : features deviennent découvrables.
   - Effort : 2h.

7. **[DATA] Migrer `/discover` et `/map` du mock vers `useMatches` réel**.
   - Gain : cohérence avec `/browse`, vraies positions.
   - Effort : 1 jour.

---

## Annexe — Inventaire complet des routes (55)

Auth : `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/onboarding`
Public : `/p/[id]`, `/invite/[code]`, `/about`, `/cgu`, `/privacy`, `/why-free`
Core : `/feed`, `/browse`, `/discover`, `/map`, `/chat`, `/chat/[id]`, `/modes`, `/modes/[mode]`, `/notifications`, `/profile`, `/profile/edit`, `/profile/verify`, `/profile/share`, `/profile/delete`, `/profile/notifications`, `/profile/privacy`, `/settings`, `/welcome`
Plans : `/events`, `/events/[id]`, `/events/create`, `/events/marketplace`, `/soiree`, `/soiree/[id]`, `/soiree/create`, `/flash-plans`, `/plan/[matchId]`
Groupes : `/squad`, `/group`, `/rooms`, `/rooms/[id]`
Gamification : `/achievements`, `/challenges`, `/leaderboard`, `/trust`, `/reviews`
Autres : `/premium`, `/shop`, `/speed-dating`, `/guide`, `/safety`, `/trending`

BottomNav expose seulement : `/feed`, `/map`, `/chat`, `/modes`, `/profile` (5/55 = **9%**).

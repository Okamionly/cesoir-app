# Modes Audit — CeSoir — 2026-05-07

## 1. Pourquoi 4 modes actifs sur 14 possibles

La decision est documentee dans `src/lib/modes.ts` (Wave 15 PMF Focus). 10 modes ont ete kills deliberement :

- **tourist / new-in-town** — merges dans l'onboarding flow et Plus-One
- **breakup** — complexite + risque legal (contenu vulnerabilite)
- **langue** — demande <5% a Montpellier
- **dog-date** — demande <3%
- **gamer-night** — chevauchement apps gaming specialisees
- **sober-tonight** — requalifie en filtre, pas mode
- **fit-date / culture-club** — requalifies en activity filters
- **seasonal** — time-boxed, pas dans le core loop

Ce n'est pas un manque de code : les slugs sont conserves en `LEGACY_MODE_KEYS` avec handler `isKilledMode()` qui affiche "Bientot disponible" au lieu d'une 404. La decision est validee dans `audit/ROADMAP-Q2-Q4-2026.md` (anti-pattern #2 : "4 modes cibles > 14 modes diluts").

## 2. Performance par mode (63 actifs total)

| Mode | Actifs | Share | Signal |
|---|---|---|---|
| Plus-One | 26 | 41% | Fort |
| Foodie Quest | 24 | 38% | Fort |
| Solo Diner | 10 | 16% | Moyen |
| Night Owl | 3 | 5% | Faible |

**Plus-One et Foodie Quest = 79% de l'adoption.** Ces deux modes ont un avantage structural : ils sont orientes vers une action concrete (event avec quelqu'un, decouverte restaurant), pas juste une disponibilite floue. Cela reduit la friction post-match.

**Solo Diner** est le flagship narratif mais sous-performe ses 2 concurrents. Hypothese : le user qui mange seul cherche compangie spontanee — le mode est correct mais le wording "manger seul c'est fini" peut etre percu comme negatif.

**Night Owl a 3 actifs** est le cas d'alerte. Le mode est temporellement gate (actif apres 23h selon la description) ce qui reduit mecaniquement son pool. Avec 63 utilisateurs totaux en early stage, ce mode n'a pas encore la masse critique pour se sustenter.

## 3. Mode lifecycle — regles de kill

Regles proposees pour formaliser le processus :

- **Criterion launch** : >= 5 actifs en 7 jours consecutifs sinon kill automatique
- **Criterion sustain** : maintenir >= 5 actifs sur 30 jours ou trigger sunset
- **Sunset process** : annonce 60j avant, migration users vers mode proche, `LEGACY_MODE_KEYS` + message "Bientot disponible"

Night Owl doit etre surveille : si <5 actifs maintenu 30j, soit on le retire du core (serait 3 modes), soit on change son declenchement (mode visible des 21h, pas 23h).

## 4. Les 14 modes brainstormes — analyse

Evaluation des 10 modes proposes en plus des 4 actuels :

| Mode | Potentiel | Raison |
|---|---|---|
| Apero Friday | Eleve | Permanent, usage hebdomadaire previsible, forte culture MTP |
| Brunch Sunday | Eleve | Meme raison — rituel social etabli |
| Cafe Talk | Moyen | Concurrence directe avec Plus-One mode chill |
| Tourist | Faible | Saisonnier, pool dilue hors ete |
| Sport Buddy | Moyen | Niche mais croissante, risque d'etre un filtre pas un mode |
| Beach Day | Saisonnier | Excellent mai-aout Montpellier, inutile 8 mois/an |
| Cultural | Faible | Culture-Club etait deja kill — merge dans Foodie Quest |
| Bookworm | Tres faible | Niche, public plus susceptible d'utiliser Meetup |
| Pet Lovers | Faible | Dog Date etait deja kill pour <3% demande |
| Quick Coffee | Moyen | 15min lunch = use case reel mais retention nulle post-rdv |

## 5. Top 5 modes a lancer Q3 2026

Classes par impact estime sur le marche Montpellier :

**1. Apero Friday**
Trigger : vendredi 16h-22h. Permanent, pas saisonnier. Rituel social fort a Montpellier (place de la Comedie, Antigone, Ecusson). Attendu : depasser Night Owl en 7 jours.

**2. Brunch Sunday**
Trigger : dimanche 9h-14h. Meme logique qu'Apero Friday — acte social ritualise, desir de compangie documentee (pattern de Solo Diner mais en version matin). Cout zero : simple time-gate dans `modes.ts`.

**3. Beach Day (saisonnier mai-aout)**
Unique differentiateur geographique Montpellier vs Paris/Lyon. A gate par date cote serveur et afficher le badge "Actif jusqu'au 31 aout". Sunset automatique septembre.

**4. Sport Buddy**
A implementer comme mode, pas filtre — le filtre ne cree pas de communaute. Focus running/yoga/padel qui explose a MTP. Risque : pool faible hors saison. Lancer en test A/B 20% users d'abord.

**5. Quick Coffee (lunch 11h30-14h)**
Use case distinct de tous les modes existants : rencontre courte a faible enjeu, ideal pour les profils qui hesitent a s'engager sur un repas complet. Peut convertir les users a faible engagement vers le premier IRL meet.

## 6. Saisonnalite

| Mode | Periode | Action |
|---|---|---|
| Beach Day | mai-aout | Flag `seasonal: true` + sunset auto 1 sept |
| Tourist | juillet-aout | Optionnel Wave 17+, non prioritaire |
| Apero Friday | permanent | Core mode |
| Brunch Sunday | permanent | Core mode |

Implementer le champ `activeFrom` / `activeTo` dans `ModeDefinition` pour les modes saisonniers. Les modes hors periode apparaissent grise avec "Disponible en [mois]" — pas supprimes de la liste (discovery maintenu).

## 7. Mode discovery — "Suggested for you"

La page `/modes` actuelle est une liste plate des 4 modes. Amelioration prioritaire :

**Suggested for you** base sur :
- Heure actuelle (Night Owl si 22h+, Brunch Sunday si dim matin)
- Historique activations (si user a fait Foodie Quest 3x, proposer en premier)
- Profil voisins actifs (mettre en avant le mode avec le plus d'actifs proches)

Implementation : tri dynamique de `MODE_KEYS` dans `/modes/page.tsx` via score simple (count actifs proches x poids temporel). Le hook `useModeCounts` retourne deja les compteurs — il suffit d'ajouter un tri cote client avant le rendu.

Afficher le mode top comme une card hero plus grande en position 1, les 3 autres en format compact dessous. Pattern "Featured tonight" coherent avec l'UX existante.

## 8. Recommandations immédiates

1. Night Owl : si <5 actifs semaine 3 de mai — changer declenchement a 21h ou avertissement pre-sunset
2. Lancer Apero Friday + Brunch Sunday en Wave 18 — zero risque, impact eleve, code minimal (time-gate dans `modes.ts`)
3. Ajouter champ `schedule` dans `ModeDefinition` (ex: `{ days: [5], hours: [16, 22] }`) pour modes time-gated
4. Beach Day a coder en juin pour lancement 1 juillet
5. "Suggested for you" : tri dynamique `MODE_KEYS`, 2-3h de dev max

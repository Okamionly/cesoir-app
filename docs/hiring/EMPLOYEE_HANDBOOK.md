# Employee Handbook — CeSoir

> *« Ce handbook, c'est la promesse qu'on fait à chaque nouveau CeSoirien.ne. Si quelque chose n'est pas écrit ici, c'est que ce n'est pas la règle. »*

**Version** : 1.0 (2026-04-23)
**Applicabilité** : tous les membres de l'équipe CeSoir (salariés CDI/CDD, freelances récurrents, stagiaires).
**Docs connexes** : [VALUES.md](../VALUES.md), [CULTURE.md](../CULTURE.md), [BSPCE_POOL.md](../legal/BSPCE_POOL.md), [BUS_FACTOR_PLAN.md](../BUS_FACTOR_PLAN.md).

---

## Sommaire

1. [Welcome](#welcome)
2. [How we work](#how-we-work)
3. [Compensation](#compensation)
4. [Time off](#time-off)
5. [Expenses policy](#expenses-policy)
6. [Performance reviews](#performance-reviews)
7. [Exit process](#exit-process)

---

## Welcome

### Bienvenue

Si tu lis ce doc, c'est que t'es sur le point de rejoindre (ou as rejoint) CeSoir. Merci. Vraiment.

On est une équipe petite (très petite au début) avec une ambition claire : **que personne à Montpellier ne passe une soirée seul**, parce qu'on a créé le moyen le plus simple de se retrouver ce soir, près de chez soi.

Tu ne rejoins pas une "startup comme les autres". Tu rejoins :
- Une équipe qui vise **pas la croissance à tout prix**, mais l'utilité vraie.
- Un produit qui refuse les dark patterns. **Gratuit pour toujours.**
- Une culture **explicite** — rien n'est laissé dans le flou.

### Les 3 premiers jours

- **Day 1** :
  - Setup IT (laptop, Slack, Notion, GitHub, Figma, Supabase).
  - Lecture obligatoire : VALUES.md, CULTURE.md, ce handbook.
  - Café (ou équivalent) avec le fondateur, 30 min, pas de travail.
- **Day 2** :
  - Shadow le fondateur sur 2 heures (peu importe l'activité).
  - Setup de ton environnement de dev/design personnel.
  - Intro Notion : roadmap, specs, histoire produit.
- **Day 3** :
  - Première tâche "real" : petite, scopée, shippable dans la semaine.
  - 1-on-1 buddy (un pair, pas un manager) pour débloquer.

### Les 30 premiers jours

Voir [CULTURE.md — Onboarding](../CULTURE.md#onboarding-30-premiers-jours).

---

## How we work

### Outils officiels

| Domaine | Outil | Usage |
|---|---|---|
| Communication | **Slack** | Messages async, channels par sujet |
| Documentation | **Notion** | Specs, roadmap, docs équipe |
| Code | **GitHub** | PRs, issues, code review |
| Design | **Figma** | Wireframes, design system, prototypes |
| Deploy | **Vercel** | CI/CD, preview deploys |
| Backend | **Supabase** | DB, auth, realtime |
| Monitoring | **Sentry** | Erreurs, performance |
| Paie | **PayFit** (ou équivalent) | Fiches de paie, congés |
| Santé | **Alan** | Mutuelle |
| Video calls | **Google Meet** | Les 3 meetings obligatoires |
| Async walkthroughs | **Loom** | Demo écrans, walkthrough design |

**Aucun autre outil payé par CeSoir n'est imposé.** Si tu veux utiliser un outil perso (Raycast, Notion perso, iTerm), go. Juste ne cumule pas les tools qui font la même chose.

### GitHub workflow

- **Branches** : `main` (production), feature branches `feat/xxx`, hotfix `fix/xxx`.
- **PR obligatoire** : pas de direct push sur `main`. Jamais. Même pour fondateur.
- **Review** : min 1 reviewer. Si urgent, self-merge possible avec mention claire.
- **CI** : lint + typecheck + tests doivent passer avant merge.
- **Commit convention** : [conventional commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- **Squash on merge** : par défaut, pour garder un historique propre.

### Meetings

**Les seuls meetings récurrents** :
- **1-on-1** avec manager (ou fondateur), **mensuel, 45 min**. Toi tu tiens l'agenda.
- **Demo sprint** bi-hebdomadaire, **30 min**. Tout le monde présente ce qu'il a shippé.
- **All-hands** mensuel, **45 min**. Vision + roadmap + questions.

**Tout le reste est async.**

Si quelqu'un te propose une réunion ad-hoc :
- Demande un agenda écrit.
- Demande si ça peut être async (Slack thread, Notion doc).
- Si oui sync, cap à 15-20 min.

### Core hours

- **10h — 16h CEST** : tu es dispo sur Slack (réponse < 1h).
- **Avant 10h / après 16h** : libre. Sport, kids, vie.
- **Weekends** : pas de Slack. Sauf incident P0 (rare).

### Équipements

On fournit :
- **Laptop** : MacBook Air M3 par défaut (ou équivalent 1 400€ budget). Remplacé tous les 4 ans.
- **2e écran + clavier + souris** : remboursés jusqu'à 500€ au onboarding.
- **Casque** (si besoin calls) : 100€ budget.
- **Coworking** : remboursé jusqu'à 150€/mois.

Si tu veux autre chose (stand-up desk, meilleur fauteuil), ask the founder.

---

## Compensation

### Philosophie

- **Grille salariale transparente** — voir section ci-dessous. Pas de négociation individuelle "à l'arrache". Ça crée des injustices (notamment H/F).
- **Revalorisation annuelle** : index inflation au minimum + augmentation mérite sur objectifs atteints.
- **BSPCE** : tout le monde a des BSPCE (voir [BSPCE_POOL.md](../legal/BSPCE_POOL.md)).

### Grille salariale 2026 (CDI brut annuel, base 39h)

> *Ces grilles évolueront avec l'inflation et la taille de la boîte. Mises à jour annuelles.*

| Niveau | Fourchette Paris | Fourchette Province | BSPCE typique |
|---|---|---|---|
| **Junior** (0-2 ans XP) | 38 – 45 k€ | 34 – 40 k€ | 0.1 – 0.3% |
| **Mid** (3-5 ans XP) | 48 – 60 k€ | 42 – 52 k€ | 0.3 – 0.8% |
| **Senior** (6-10 ans XP) | 65 – 85 k€ | 58 – 75 k€ | 0.8 – 2% |
| **Staff/Lead** (10+ ans) | 85 – 110 k€ | 75 – 95 k€ | 2 – 4% |

**Notes** :
- Pas de bonus individuel discrétionnaire (on préfère revalorisation salaire + BSPCE).
- Possible "signing bonus" 1 mois de salaire si gros gap avec précédent poste.
- Pour les freelances : TJM = (brut × 1.5 / 220 jours) en ordre de grandeur.

### Grille freelance 2026 (TJM HT)

| Profil | Fourchette | Remarque |
|---|---|---|
| **Product Designer Senior** | 600 – 1 200 € | Selon XP / spécialisation |
| **Tech Lead Full-stack** | 650 – 1 000 € | Cible high end pour roles critiques |
| **Dev Senior** | 500 – 800 € | |
| **DPO Fractional** | Forfait mensuel 400-600€ | Pas de TJM — forfait prestation |
| **Community Manager** | N/A | On préfère CDD salarié |

### Paie

- **Paiement le 28 de chaque mois** (ou vendredi ouvré précédent).
- **13ème mois** : pas inclus par défaut (on préfère transparence grille).
- **Tickets restaurant** : 9€/jour travaillé, pris en charge 60% par CeSoir.

### BSPCE

Voir [BSPCE_POOL.md](../legal/BSPCE_POOL.md) pour le détail complet.

**Résumé** :
- Vesting 4 ans + cliff 1 an.
- Attribution à la signature du contrat (ou conversion CDI si freelance → CDI).
- Pool total de 12% du capital (Y1).

---

## Time off

### Congés payés (salariés)

- **25 jours ouvrés** + **RTT** selon convention Syntec (environ 10 RTT/an).
- **Pose** : au moins 2 semaines consécutives par an (on insiste, c'est important).
- **Préavis** : 2 semaines pour congés > 3 jours.

### Jours fériés

Tous les jours fériés français + **2 ponts** offerts par an (à la discrétion de l'équipe, décidés en début d'année).

### Sick days

- **Illimités**, on te croit sur parole.
- **Pas de justif médical** demandée (sauf >3 jours consécutifs où c'est la loi française).
- Si tu es malade : Slack à ton manager "je suis out aujourd'hui", c'est tout.

### Mental health days

- **4 par an**, pas besoin de justifier.
- **Pas comptés** sur les congés ou sick days.
- Pose : "Je prends un mental health day aujourd'hui".

### Sabbatique

- **Après 3 ans** de présence continue : 1 mois de sabbatique **payé**.
- **Condition** : 1 mois de notice, transition proprement.
- **Usage** : libre (voyage, formation, projet perso).

### Autres congés légaux

- **Congé maternité** : 16 semaines, 100% maintien salaire (complément au plafond SS).
- **Congé paternité** : 28 jours, 100% maintien salaire.
- **Congé parental** : jusqu'à 3 ans, réintégration garantie même poste.
- **Congé deuil** : 5 jours (au-delà du légal), pas besoin de justifier.
- **Congé mariage** : 4 jours.
- **Congé déménagement** : 1 jour.

### Freelances

Les freelances gèrent leurs congés eux-mêmes (facturation au prorata). On demande juste :
- **Préavis 2 semaines** pour tout congé > 3 jours.
- **Backup/handover** clair si chantier en cours.

---

## Expenses policy

### Philosophie

**Si c'est utile à ton travail, on rembourse. Si t'hésites, demande.**

### Catégories

#### Déplacements professionnels

- Train/avion : classe économique. Remboursement sur facture.
- Voiture personnelle : barème kilométrique fiscal.
- Taxi/Uber : en journée si nécessaire, pas de limite mais justifier. En soirée (après 22h), toujours OK.
- Hôtel : jusqu'à 120€/nuit. Plus si zone chère (Paris centre, conférences).
- Repas pro : jusqu'à 25€/repas si en déplacement.

#### Événements d'équipe

- Restos/bars avec équipe ou partenaires : remboursés, pas de plafond strict mais "raisonnable".
- CeSoir Sessions (events users) : budget dédié au Community Manager.

#### Matériel

- **Laptop & équipement** : voir section "How we work" ci-dessus.
- **Livres pro** : remboursés illimité (demande avant pour > 80€).
- **Apps productivité** : Raycast, Arc, Fig, etc. → remboursés si utiles à ton travail.

#### Formation

- **Budget learning 500€/an** par personne.
- **Conférences** : remboursées (ticket + déplacement) jusqu'à 2k€/an, sur accord.
- **Formations longues** (>1 semaine) : à discuter au cas par cas.

### Process remboursement

1. Tu paies avec ta carte perso (ou carte pro si fournie).
2. Tu uploads la facture/ticket sur Notion (page "Expenses") + case numérotée.
3. Remboursement sous 7 jours (virement direct).

**Règle** : pas de reçu = pas de remboursement.

### Carte pro

- Disponible pour **managers et seniors** (cadre de > 50k€/an).
- Plafond mensuel : 2 000 € par défaut (ajustable selon rôle).

---

## Performance reviews

### Cadence

**4 fois par an** (Q1, Q2, Q3, Q4), format Radical Candor.

Format :
- **1-on-1 manager + employé** : 45-60 min.
- **Pas de grille 1-5**, pas de "ranking".
- **Feedback continu** entre reviews → la review confirme, ne révèle pas.

### Structure review

1. **Auto-évaluation** (employé écrit) :
   - Ce que j'ai accompli ce quarter.
   - Ce qui aurait pu être mieux.
   - Ce qui me motive / bloque.

2. **Feedback manager** :
   - Ce que j'ai observé (positif et négatif).
   - Où je te vois dans 12 mois.

3. **Objectifs next quarter** :
   - 2-3 OKRs max (plus = dilution).
   - Métriques claires (pas "améliorer le produit", mais "réduire temps onboarding à < 90s").

### Revalorisation salaire

- **Revue annuelle** en Q1 chaque année.
- **Index inflation garanti** (minimum).
- **Augmentation mérite** : sur objectifs atteints sur l'année.
- **Pas de négociation individuelle** en dehors de ce cycle.

### Promotions

- Réévaluation niveau (Junior → Mid → Senior → Staff) tous les 6-12 mois.
- Basée sur : XP, impact, autonomie, mentorat.
- Transparence : critères écrits, mêmes pour tous.

---

## Exit process

Si tu pars de CeSoir (peu importe la raison) :

### Notice period

- **Salariés CDI** : 1-3 mois (selon ancienneté et rôle, voir convention Syntec).
- **Salariés CDD** : fin du terme prévu (sauf cas exceptionnels).
- **Freelances** : fin du mois en cours (préavis 2 semaines).

### Knowledge transfer

**Obligatoire** :
- 1 doc Notion par projet dont tu es owner.
- Handover clair à un successeur (ou au fondateur si pas de successeur).
- Revocation accès scheduleé au dernier jour.

### Exit interview

- **1h avec le fondateur**, dernier jour.
- Objectif : comprendre ce qui a marché, ce qui n'a pas marché.
- Pas de piège — on veut apprendre, pas juger.

### BSPCE

- Tu conserves tes BSPCE **vested** (voir [BSPCE_POOL.md](../legal/BSPCE_POOL.md)).
- Les **non-vested** sont annulés.
- **Délai d'exercice post-départ** : 90 jours (standard). Au-delà, annulation.

### Testimonial & références

- Si tu veux : **recommandation LinkedIn** dans les 7 jours.
- **Références** : on accepte d'être contactés par futurs employeurs/clients.

### Alumni

- Slack **channel alumni** : tu restes invité.
- **Événement annuel** : "Fin d'année CeSoir", alumni welcome.
- On reste **pote**. Même après un départ difficile, on garde de la classe.

---

## Ce doc est vivant

Ce handbook évolue avec la boîte. Tout membre peut proposer un changement via PR GitHub.

**Changes récents** :
- **2026-04-23** : v1.0 création initiale.

---

*« Un handbook, c'est ce qu'on aurait aimé lire en arrivant. »*

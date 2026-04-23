# Culture CeSoir

> *« La culture, c'est pas les baby-foots. C'est comment on prend les décisions quand personne ne regarde. »*

Ce doc décrit **comment on travaille** chez CeSoir. Il est valable pour les employés salariés, les freelances récurrents et les stagiaires. Il est **explicite** parce que l'implicite est toujours interprété dans le sens qui arrange.

---

## Founding principles

### 1. Remote-first par défaut

- L'équipe est **distribuée sur la France** (et possiblement l'Europe pour tech).
- On n'a pas de bureau. On n'en aura pas avant 10+ personnes.
- Résidence à Montpellier = bonus pour les events physiques, jamais une condition.
- Chacun choisit son setup : café, coworking (remboursé jusqu'à 150€/mois), home office.

### 2. Async-default

> *« Si la question tient en écrit, elle n'appelle pas une réunion. »*

- **Pas de meetings à 2 participants**. Jamais. On écrit sur Notion/Slack, l'autre répond quand dispo.
- **Meetings obligatoires** uniquement : démo sprint (bi-hebdo, 30 min), 1-on-1 manager (mensuel, 45 min), all-hands (mensuel, 45 min).
- **Tout le reste = async** : specs produit, code review, decisions architecturales, feedback.
- Les réunions ad-hoc doivent avoir un agenda écrit > 2h à l'avance. Sinon, refuse.

### 3. Core hours : 10h-16h CEST, flex le reste

- Entre 10h et 16h CEST, tu es **dispo** (réponse < 1h sur Slack).
- Avant 10h et après 16h : fais ce que tu veux (sport, courses, kid pickup, Netflix).
- Weekend : sacré. Pas de Slack, pas d'email. Sauf incident P0 (≤ 2 fois par an acceptable).

### 4. No-meeting Wednesdays

- **Les mercredis = zéro meeting.** Toute la journée. Pour tout le monde.
- Objectif : 1 jour par semaine où on code/design/écrit sans interruption.
- Si tu dois absolument caller quelqu'un un mercredi, c'est que ton planning est cassé.

### 5. Feedback radically candid (style Kim Scott)

> *« Care personally, challenge directly. »*

- **Direct** : on dit les choses. "Ton code est pas lisible, voilà pourquoi" pas "hmm, intéressant".
- **Bienveillant** : on attaque le travail, jamais la personne. On assume que l'autre fait de son mieux.
- **Rapide** : feedback dans les 48h après l'event, pas 6 mois après en revue annuelle.
- **Public quand positif, privé quand critique**. Toujours.

### 6. Tools & stack

**Communication**
- Slack (messages courts, async)
- Notion (docs, specs, roadmap)
- Google Meet (les 3 meetings obligatoires uniquement)

**Code & design**
- GitHub (code, PRs, issues)
- Figma (design)
- Vercel (deploy)
- Supabase (backend)

**RH & paie**
- Payfit ou Alan Easy (pour la paie)
- Notion (onboarding, handbook)
- Google Drive (contrats, docs légaux)

**Aucun outil imposé qui n'est pas listé ici.** Si tu proposes un tool, argument + cost + qui le maintient.

---

## Perks & benefits

### Santé

- **Mutuelle Alan** (ou équivalent) dès le premier hire. Pris en charge 100% par CeSoir (pas les 50% légaux — 100%).
- **Budget bien-être** : 50€/mois (sport, thérapie, méditation, quoi que ce soit).

### Apprentissage

- **Budget learning** : 500€/an par personne.
  - Conférences, livres, formations, tickets meetups.
  - Pas besoin de justifier l'utilité à l'équipe — si tu penses que c'est utile, go.
- **1 jour par mois** = dédié learning (formation, open source, side project).

### Équipement

- Laptop fourni (MacBook Air M3 par défaut, sauf demande spécifique).
- 2e écran + clavier + souris remboursés jusqu'à 500€ au onboarding.
- Coworking remboursé jusqu'à 150€/mois.

### Temps off

- **25 jours de congés** (standard France) + RTT.
- **Sick days illimités** — on te croit sur parole. Pas de justif.
- **Mental health days** : 4/an, pas besoin de justifier, pas comptés sur les congés.
- **Sabbatique** : après 3 ans de présence, 1 mois de sabbatique payé.

### Cash & equity

- **Salaire** : grille transparente (voir EMPLOYEE_HANDBOOK.md). Pas de négociation individuelle — ça crée des injustices.
- **BSPCE** : tout le monde a des BSPCE (voir docs/legal/BSPCE_POOL.md).
- **Revalorisation annuelle** : index inflation minimum + augmentation mérite.

---

## Ce qu'on ne fait PAS

### Pas de culture du surmenage

- Pas de "crunch" avant un launch. Si le planning impose crunch = mauvais planning.
- Pas de messages Slack à 23h (et si tu en écris, utilise le mode "envoi programmé demain 9h").
- Pas de compétition interne sur "qui a travaillé le plus ce weekend".

### Pas de hiérarchie performative

- Pas de "managers" sans équipe. Si t'as 0 report direct, tu es IC.
- Pas de titres ronflants type "Chief Happiness Officer".
- Le fondateur prend le café en même temps que tout le monde.

### Pas de rituals creux

- Pas de "team building" avec paintball. Si on veut se voir, on boit un verre (vraiment).
- Pas de "valeurs" imprimées sur mug. Les valeurs sont dans VALUES.md, elles sont utiles.
- Pas de slack avec 200 emojis custom. On reste sur les standards.

### Pas de process qui étouffe

- Pas de RACI matrix. Tu décides = tu informes. Tu informes = tu décides pas.
- Pas de "PR template" de 20 sections. Just: "What changed, why, how to test."
- Pas de retro de 2h. Retro = 20 min, 3 bullets each, on passe.

---

## Onboarding (30 premiers jours)

### Semaine 1 — Setup & Context

- Day 1: laptop, comptes, Notion, Slack, Figma, GitHub, Supabase.
- Day 2-3: lire VALUES.md, CULTURE.md, EMPLOYEE_HANDBOOK.md, README.md.
- Day 4-5: shadow le fondateur pendant 2 heures (call client, review PR, décision produit).

### Semaine 2 — First ship

- Objectif : **shipper une feature, même petite**, en semaine 2.
- Peer buddy assigné (pas un manager, un pair) pour débloquer.
- Démo ton ship à l'équipe en all-hands.

### Semaine 3 — Integration

- 1-on-1 avec chaque membre de l'équipe (30 min chacun).
- Proposer 3 améliorations au onboarding (les prochains en bénéficient).

### Semaine 4 — Feedback

- Feedback 360 : équipe donne feedback, toi aussi.
- Si ça matche → contrat final. Si ça matche pas → on se sépare sans drama.

---

## Performance reviews

- **4 fois par an** (quarterly). Format Radical Candor.
- 30 min one-on-one manager. Zéro surprise (feedback continu → la review confirme, pas révèle).
- **Structure** :
  1. Ce que t'as accompli ce quarter (auto-éval).
  2. Ce qui aurait pu être mieux (auto-éval).
  3. Ce que j'ai observé (manager).
  4. Next quarter objectifs (2-3 OKRs max).
- **Pas de rating** (1 à 5, A à F). Feedback qualitatif uniquement.

---

## Exit process

Si tu pars (démission ou fin de CDD/freelance) :

1. **Notice période** : 1 mois (standard France) pour salariés, fin du mois en cours pour freelances.
2. **Knowledge transfer** : document ton travail dans Notion (1 doc par projet).
3. **Exit interview** : 1h avec le fondateur. On veut apprendre.
4. **BSPCE** : garde tes BSPCE vested (4 ans + 1 year cliff — voir docs/legal/BSPCE_POOL.md).
5. **Testimonial** : si tu veux, LinkedIn recommendation dans les 7 jours.
6. **On reste pote** : alumni Slack channel, event annuel.

---

## Diversity & inclusion

CeSoir est une dating app. Si notre équipe est homogène, notre produit sera biaisé.

**Objectifs visibles (public) :**
- 50% de femmes dans l'équipe d'ici fin 2027.
- 0 cas d'homophobie/transphobie toléré (instant firing).
- Hiring pipeline intentionnellement diversifié (voir DESIGNER_FEMININE_JD.md priorité #1).

**Ce qu'on fait concrètement :**
- JDs relues pour éviter biais de genre.
- Panel d'entretien diversifié (min 1 femme dans chaque panel dès qu'on est 3+).
- Salary transparency (empêche les écarts homme/femme à poste égal).
- Pas de "culture fit" vague → grille d'évaluation explicite.

---

## Conflict resolution

1. **Level 1 — Direct** : va parler à la personne. 80% des cas se règlent là.
2. **Level 2 — Médiateur** : un tiers neutre (un autre membre de l'équipe).
3. **Level 3 — Founder** : escalade au fondateur. Decision en 48h max.
4. **Level 4 — Externe** : si conflit grave (harcèlement, discri), DPO + avocat externe.

---

## Ce doc est vivant

- Tout membre de l'équipe peut proposer un changement via PR GitHub.
- Revue par le fondateur + 1 autre → merge.
- Changelog en bas de ce fichier.

---

## Changelog

- **2026-04-23 (v1.0)** — création initiale par Wave 15 CHRO infra.

---

*« La culture qu'on documente, c'est la culture qu'on protège quand la boîte grandit. »*

# User Research Guide — CeSoir Montpellier

_Wave 15 · CPO — PMF validation with the first 10 users._

Le but de ce guide : structurer les 10 premiers entretiens pour valider (ou
invalider) notre hypothese PMF. Les reponses alimentent la roadmap des Waves
16-20 et les decisions de KILL/KEEP pour les modes suivants.

Duree cible : **30-35 min / entretien**. Remote Google Meet ou IRL
(Place de la Comedie, Halle Tropisme). Compensation : un verre offert ou
50€ crypto (selon dispo).

---

## Pourquoi maintenant

- App lancee en invite-only Montpellier. 14 modes → 4 modes (Wave 15).
- Zero user research faite avant. CPO audit 4.6/10 → objectif 10/10.
- Besoin : valider que les 4 modes restants resonnent vraiment.

## Quoi valider (5 hypotheses PMF)

Issues des audits seniors (wave-15-cpo-audit.md) :

1. **H1 — Le "ce soir" est la bonne temporalite.** Les users veulent sortir
   dans les 2-6h, pas planifier demain. Si H1 faux : on reoriente vers
   "this week" comme Meetup.
2. **H2 — 4 modes suffisent.** Solo Diner + Plus-One + Night Owl + Foodie
   Quest couvrent 80% des intents sociaux. Si H2 faux : rajouter 1-2 modes
   qui emergent.
3. **H3 — Les gens veulent etre matches sur l'intention, pas le profil.**
   Swiper sur un mode > swiper sur une photo. Si H3 faux : pivot vers un
   Tinder-like classique.
4. **H4 — Les gens sont prets a bouger pour un match.** 5km max, bar/resto
   inconnu, OK. Si H4 faux : on restreint par quartier.
5. **H5 — Le gratuit ne stigmatise pas.** Les users ne se disent pas
   "c'est nul parce que c'est gratuit". Si H5 faux : add micro-paid tier.

---

## Interview guide structure

### 1. Intro (2 min)
- Merci d'etre la, rien n'est bon/mauvais, on veut juste comprendre.
- Enregistrement audio (consentement oral).
- 30-35 min, tu peux arreter quand tu veux.
- Tes reponses anonymisees.

### 2. Warm-up (5 min)
Situer le contexte social et emotionnel du user.

1. **Parle-moi de ta derniere soiree ou tu es sorti(e) seul(e) ou avec
   l'envie de rencontrer du monde.**
   _(Ouverture, pas de jugement. Laisse raconter.)_

2. **Qu'est-ce qui t'a pousse(e) a sortir ce soir-la ?**
   _(Chercher la push-motivation : ennui, rupture, demenagement, FOMO...)_

### 3. Deep-dive (12 min)
Tester les 5 hypotheses sans les nommer.

3. **Quand tu decides "je vais sortir ce soir", a quel moment tu le decides ?**
   (H1 : valide si majorite dit "entre 17h et 20h le soir meme")

4. **Montre-moi ton telephone. Tu utilises quoi actuellement pour sortir
   rencontrer ? Meetup, Tinder, Bumble, Instagram, groupe WhatsApp... ?**
   _(Context des outils concurrents. Quel comportement actuel on casse ?)_

5. **Si je te dis : une app ou tu choisis ton mood (diner seul, besoin d'un
   +1 pour un event, virée de nuit, aventure culinaire) et elle te matche
   avec quelqu'un qui a le meme mood ce soir — ca te parle ?**
   _(H2 + H3 : observer la reaction spontanee. Lean-in ou retrait ?)_

6. **Parmi ces 4 modes, lequel t'attire le plus ? Pourquoi ? Lequel te fait
   peur / te parait bizarre ? Pourquoi ?**
   _(Prioriser les 4 core. Noter les mots qu'ils emploient.)_

7. **Tu serais pret(e) a te deplacer combien de km pour un match ce soir ?**
   (H4 : valide si majorite dit "entre 2 et 5 km en ville")

8. **Tu paierais combien par mois pour une app comme ca, si c'etait
   vraiment bien fait ?**
   _(Signal prix + willingness-to-pay. Ne pas insister si la personne
   dit "rien" — creuser le pourquoi.)_

### 4. Reaction (10 min)
Montrer le produit reel.

9. **Je te fais une demo 2 minutes. Regarde, dis-moi ce que tu penses en
   live, sans filtre.**
   _(Partager ecran / phone. Observer : ou sa main hesite ? Ou elle
   s'illumine ? Quel ecran fait "click" ?)_

10. **Si ton/ta meilleur(e) ami(e) devait essayer cette app demain, tu lui
    dirais quoi en 1 phrase ?**
    _(Le pitch qu'ils comprennent = le pitch qu'on doit afficher.)_

### 5. Wrap-up (3 min)
- Y a-t-il quelque chose qu'on aurait du te demander et qu'on n'a pas
  demande ?
- Si tu avais une baguette magique pour changer une chose dans l'app, ce
  serait quoi ?
- Merci. On t'enverra un update dans 2 semaines sur ce qu'on a appris.

---

## 10 questions FR (version courte — si pas de temps pour le deep-dive)

Copier-coller pour les Google Form / sondages rapides.

1. La derniere fois que tu es sorti(e) avec l'envie de rencontrer
   quelqu'un, c'etait quand et pourquoi ?
2. Tu decides de sortir le soir-meme, 1 jour avant, ou 1 semaine avant ?
3. Tu utilises quoi aujourd'hui pour sortir rencontrer ? Meetup, Tinder,
   IG, WhatsApp, autre ?
4. Si une app te proposait 4 modes — Solo Diner, Plus-One, Night Owl,
   Foodie Quest — lequel t'attire le plus ? Pourquoi ?
5. Lequel de ces 4 modes te semble bizarre / tu n'utiliserais jamais ?
6. Combien de km tu es pret(e) a faire pour un match ce soir ?
7. Tu preferes swiper sur des profils ou sur des modes/intentions ?
8. Ca coute combien a peu pres dans ta tete une app de rencontre pour
   sortir ce soir ? (0 / 5€ / 15€ / 30€ / plus)
9. Si tu devais pitcher cette app a un ami en 1 phrase, tu dirais quoi ?
10. Qu'est-ce qu'il manquerait pour que tu l'utilises tous les soirs ?

---

## Template Notion — tracker les reponses

```
┌─────────────────────────────────────────────────────────────┐
│  CeSoir · User Research Tracker                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Colonnes :                                                 │
│  - User ID (U01, U02, ... U10)                              │
│  - Prenom (anonymise si public)                             │
│  - Age                                                      │
│  - Genre                                                    │
│  - Date entretien                                           │
│  - Canal (Meet / IRL / Phone)                               │
│  - Mode favori cite                                         │
│  - Mode rejete cite                                         │
│  - Temporalite decision sortir (soir / j-1 / semaine)       │
│  - App actuelle principale                                  │
│  - Km max pret a faire                                      │
│  - Willingness-to-pay (€/mois)                              │
│  - Pitch en 1 phrase (verbatim)                             │
│  - H1 valide ? (Y/N/?)                                      │
│  - H2 valide ? (Y/N/?)                                      │
│  - H3 valide ? (Y/N/?)                                      │
│  - H4 valide ? (Y/N/?)                                      │
│  - H5 valide ? (Y/N/?)                                      │
│  - Quote la plus marquante (verbatim)                       │
│  - Recommandation produit (1-5)                             │
│  - Actions a prendre (Wave 16 implications)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Creer une database Notion avec ces champs. Apres 10 entretiens, synthetiser
dans un doc "WAVE-15-USER-RESEARCH-SYNTHESIS.md" avec :
- Ratio de validation par hypothese (H1 = 8/10 → valide)
- Top 3 verbatims qui font pivoter la roadmap
- Top 3 frustrations recurrentes
- Decision : KEEP les 4 modes ? Ajouter/remplacer ?

---

## Canal de recrutement (Montpellier)

Budget max : **100€ / 10 users** (10€ verre / person).

- **U01-U03 (early adopters)** : beta testeurs existants de l'app
  (via `invite_codes` table, les 3 premiers a avoir claim un code).
- **U04-U06 (20-28 ans)** : poster dans les groupes Facebook
  "Etudiants Montpellier", "Nouveaux a Montpellier", "Montpellier Erasmus".
- **U07-U08 (28-38 ans)** : DM LinkedIn sur des profils "Montpellier /
  Marketing / Tech" — offre 30min + verre.
- **U09-U10 (wild card)** : recrutement IRL a la Halle Tropisme ou
  Place de la Comedie (carton "cherche 10 personnes pour test app
  dating — 30min, verre offert").

Objectif demographique :
- 50/50 homme/femme (biaise vers femmes si Wave 15 early = 60F/40H pour
  diversite de signal).
- Age median cible : 25-32 ans (coeur PMF dating app post-Tinder).
- 3/10 minimum "nouveau a Montpellier < 12 mois" (signal new-in-town).

---

## Antipatterns — ce qu'il faut PAS faire

- ❌ Demander "tu aimes l'app ?" — tout le monde dit oui par politesse.
  Demander : "Qu'est-ce qui te gene / frustre ?"
- ❌ Pitcher l'app avant les questions. Biaise la reponse.
- ❌ Interrompre un verbatim meme s'il est long. L'or est souvent a la fin.
- ❌ Ignorer le langage corporel en IRL. Hesitation = signal fort.
- ❌ Accepter "c'est bien" comme reponse. Rebondir : "C'est bien comment ?"
- ❌ Confondre "j'aimerais utiliser" et "j'utiliserais". Demander : "Tu
  l'ouvrirais quand la prochaine fois ?"

---

## Livrable attendu (fin de sprint research)

Document `docs/WAVE-15-USER-RESEARCH-SYNTHESIS.md` avec :

1. Executive summary (1 page) — decision GO/NO-GO sur les 4 modes.
2. 5 hypotheses : validees / invalidees / inconclusives.
3. Top 5 verbatims qui pivotent la roadmap.
4. Liste des features prioritaires pour Wave 16 (scored par freq + impact).
5. Recommendation : tuer / garder / ajouter un mode ?

Ownership : CPO (moi) + User Researcher (a recruter ou me-pour-l'instant).

_Last updated : 2026-04-23. Wave 15._

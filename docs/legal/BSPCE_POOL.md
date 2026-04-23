# BSPCE Pool — CeSoir

> *« Les BSPCE, c'est un outil tax-efficient pour partager l'upside avec l'équipe. En France, c'est le seul mécanisme qui rivalise avec les stock options US. On doit le mettre en place AVANT le premier hire humain. »*

---

## ⚠️ Disclaimer légal

**Ce document n'est pas un conseil juridique.** C'est un template de travail pour préparer la mise en place du pool BSPCE. Toutes les décisions doivent être validées par :

1. Un **avocat startup spécialisé France** (cabinet recommandé en fin de ce doc).
2. Un **comptable / expert-comptable** familier avec les BSPCE.
3. Les **statuts de la société** (à rédiger/modifier en conséquence).

**En aucun cas ce template ne remplace un conseil juridique personnalisé.**

---

## Qu'est-ce qu'un BSPCE ?

**BSPCE** = Bons de Souscription de Parts de Créateur d'Entreprise.

### Définition simple

- Un BSPCE donne le **droit** (pas l'obligation) d'acheter une action de la société à un prix fixe, pendant une période définie.
- Le prix fixé s'appelle le **prix d'exercice** (strike price).
- Si la valeur de la société monte, l'employé exerce son BSPCE au prix bas, puis revend à la valeur actuelle → plus-value.

### Pourquoi BSPCE plutôt que stock options US-style ?

| | BSPCE (France) | Stock Options (US) |
|---|---|---|
| Taxation à l'exercice | 0% (pas d'IR, pas de charges) | 30-45% selon statut |
| Taxation à la revente | 30% flat tax (PFU) | 30% idem |
| Complexité | Moyenne | Très élevée en France (AGA, étrangers) |
| Signal | "Vraie" startup | Ambigu en France |

**Conclusion** : pour une SAS française, **BSPCE > tout autre mécanisme**.

### Conditions d'éligibilité BSPCE (résumé)

- Société SAS (ou SAS équivalent) avec siège en France.
- < 15 ans d'ancienneté.
- Non cotée ou cotée sur petites capitalisations.
- Au moins 25% du capital détenu par personnes physiques.

CeSoir respecte toutes ces conditions. On est éligibles.

---

## Pool BSPCE cible

### Taille du pool

**Cible : 10-15% du capital post-money après pré-seed.**

- **Standard marché France 2026** : 10% (conservative) à 15% (standard), jusqu'à 20% (généreux).
- **Pour CeSoir** : on vise **12% du capital**.

### Raisons de 12%

- Permet d'attribuer à 5-8 personnes d'ici 2 ans sans dilution excessive.
- Envoi un signal positif aux candidats seniors (plus généreux que la moyenne).
- Préserve la capacité future (on pourra étendre le pool à 15-18% en Series A si besoin).

---

## Structure de vesting standard

### Vesting linéaire 4 ans + cliff 1 an

- **Durée totale** : 4 ans.
- **Cliff** : 1 an (aucun BSPCE vested avant 12 mois de présence).
- **Après cliff** : vesting linéaire mensuel (1/48e de la tranche par mois).

**Exemple** : hire T0 avec 1% BSPCE.
- T0 → M12 : 0% vested (cliff).
- M12 : 25% vested (0.25% utilisable).
- M12 → M48 : vesting linéaire 1/48e par mois.
- M48 : 100% vested (1% utilisable).

### Pourquoi 4 ans + 1 an cliff ?

- **Standard marché** mondial (US, UK, FR).
- **Cliff** protège la société : si l'employé part dans les 12 mois, il repart sans BSPCE → pas de pollution du cap table.
- **4 ans** : correspond à la période où l'impact d'un early employee est maximum.

### Variantes possibles (à discuter avec avocat)

- **3 ans + 6 mois cliff** : plus court, utile pour des freelances récurrents.
- **5 ans + 1 an cliff** : plus long, utile pour co-fondateurs tardifs.
- **Accelerated vesting** : possibilité de "double trigger" (acquisition + licenciement) pour accélérer 100% du vesting restant.

---

## Cap table simulée — Y1 avec 3 hires

Hypothèse : CeSoir émet 100 000 actions au total.

| Actionnaire | Actions | % |
|---|---|---|
| **Founder** | 88 000 | 88% |
| **Pool BSPCE** | 12 000 | 12% |
| **Total** | 100 000 | 100% |

### Répartition pool (cible Y1)

| Bénéficiaire | % BSPCE | Actions | Notes |
|---|---|---|---|
| **Tech Lead** (freelance puis CDI M6) | 2% | 2 000 | Critical hire, high impact |
| **Product Designer** (freelance récurrent) | 1% | 1 000 | Critical hire, 2-3 jours/semaine |
| **Community Manager** (part-time) | 0.5% | 500 | À M6 si passage CDI |
| **DPO externe** | 0.1% | 100 | Symbolic, engagement long terme |
| **Pool réserve futur** | 8.4% | 8 400 | Pour hires Y2 (Head of Product, Senior devs, Head of Growth) |

### Cap table post-attribution Y1 (hypothétique)

| Actionnaire | Actions | % |
|---|---|---|
| Founder | 88 000 | 88% |
| Tech Lead (vesting 4 ans) | 2 000 | 2% |
| Designer (vesting 3 ans) | 1 000 | 1% |
| CM (vesting 4 ans, démarrage M6) | 500 | 0.5% |
| DPO (vesting 4 ans) | 100 | 0.1% |
| Pool restant | 8 400 | 8.4% |

**Note** : c'est un exemple, les % finaux dépendent de la négociation individuelle et du seniority level.

---

## Prix d'exercice (strike price)

### Règle BSPCE

Le prix d'exercice doit être fixé à la **juste valeur** au moment de l'attribution. Typiquement :
- **Valorisation pré-seed** : valeur basse (ex: 100k€-500k€ valo) → strike price bas → gros upside potentiel.
- **Valorisation Series A** : valeur haute → strike plus élevé → moins d'upside mais moins de risque.

### Méthode de valorisation

Plusieurs méthodes acceptées par le fisc français :
1. **Dernière levée de fonds** (si récente) : prix par action = valo / nombre d'actions.
2. **Valorisation indépendante** par expert-comptable (si pas de levée).
3. **Valeur nominale** : pour CeSoir avant levée, typiquement 1€/action → strike price de 1€.

**Recommandation** : attribuer les premiers BSPCE **avant la 1ère levée** pour maximiser l'upside. Le strike sera très bas.

---

## Timeline recommandée

### Phase 1 — Avant le premier hire (maintenant)

- [ ] Identifier avocat startup spécialisé (voir liste bas du doc).
- [ ] Call initial avocat : devis + timing.
- [ ] Rédiger statuts incluant clause pool BSPCE (si SAS déjà créée → modification statuts).
- [ ] Décision AG (Assemblée Générale) attribuant le pool.
- [ ] Enregistrement INPI.
- [ ] **Coût estimé** : 2 000 – 3 500 € TTC (one-shot).

### Phase 2 — Première attribution

- [ ] Choisir bénéficiaire + % + conditions (vesting, cliff).
- [ ] Rédiger "promesse d'attribution de BSPCE" (contrat individuel).
- [ ] Décision AG attribuant BSPCE spécifiques à cette personne.
- [ ] Signature par bénéficiaire.
- [ ] Entrée dans registre des BSPCE.

### Phase 3 — Exercice (plus tard)

- Typiquement quand il y a liquidity event (revente société, Series C, tender offer).
- Bénéficiaire exerce son BSPCE (paie le strike price).
- Si revente immédiate → 30% flat tax sur la plus-value.

---

## Documents nécessaires

### 1. Statuts de la société SAS

Doivent mentionner :
- Autorisation AG d'émettre des BSPCE.
- Nombre maximal de BSPCE émis (correspondant au pool).
- Conditions générales du plan.

### 2. Plan BSPCE (policy générale)

Document unique appliqué à tous les bénéficiaires :
- Vesting standard (4 ans + 1 an cliff).
- Conditions de départ (good leaver / bad leaver).
- Conditions d'exercice (durée, modalités).
- Anti-dilution clauses.

### 3. Promesse d'attribution (par bénéficiaire)

Document individuel signé par l'employé :
- Nombre de BSPCE attribués.
- Strike price.
- Date de démarrage du vesting.
- Conditions spécifiques (accélération, etc.).

### 4. Registre des BSPCE

Tenu par la société :
- Liste de tous les bénéficiaires.
- Nombre de BSPCE attribués, vested, exercés, annulés.
- Mis à jour à chaque mouvement.

---

## Cas de départ (good leaver / bad leaver)

### Good leaver

- Démission normale, fin de CDD, licenciement pour motif économique.
- **Conséquence** : le bénéficiaire conserve tous ses BSPCE vested. Les non-vested sont annulés.
- **Délai d'exercice post-départ** : typiquement 90 jours (standard) à 1 an (généreux).

### Bad leaver

- Licenciement pour faute grave, démission avec concurrence déloyale, manquement aux valeurs.
- **Conséquence** : tous les BSPCE (vested + non-vested) sont annulés.
- Clause à rédiger avec prudence pour éviter abus par la société.

---

## Template email à avocat startup

**Sujet** : Demande devis — Mise en place pool BSPCE CeSoir SAS

> Bonjour [Nom],
>
> Je suis [Nom], fondateur de **CeSoir** (SAS française, en cours de création / immatriculée sous SIREN XXX).
>
> CeSoir est une application de dating locale (PWA Next.js + Supabase) ciblant la région Montpelliéraine. Nous préparons nos premiers hires (tech lead freelance, product designer, community manager, DPO externe) et souhaitons **mettre en place un pool BSPCE avant ces attributions**.
>
> **Objectifs** :
> - Pool de 12% du capital.
> - Vesting 4 ans + cliff 1 an standard.
> - Premiers bénéficiaires : 2-3 freelances/salariés.
> - Accompagnement pour les attributions individuelles.
>
> **Demande** :
> - Devis pour la mise en place initiale du pool (statuts + plan BSPCE + décision AG + enregistrement).
> - Tarif par attribution individuelle (promesse + décision AG complémentaire).
> - Timing réaliste (semaines de démarrage, livraison).
> - Une référence startup récente (type early-stage B2C) accompagnée.
>
> Je suis disponible pour un call 30 min cette semaine.
>
> Cordialement,
> [Nom]
> Founder @ CeSoir
> [mail] / [téléphone]

---

## Avocats startup recommandés (France)

Cabinets spécialisés BSPCE / deal flow early-stage :

### Top picks (reputation 2026)

- **Bruzzo Dubucq** (Paris) — standard startup FR, clientèle eFounders, Kima.
  - Contact : [bruzzo-dubucq.com](https://www.bruzzo-dubucq.com)
- **Stéphane Baller** — cabinet indépendant, spécialiste B2B/B2C early-stage.
- **Sarah Guillou** — spécialiste VC / BSPCE, cabinet indépendant.
- **Osborne Clarke** — international mais très présent sur la tech FR.
- **De Pardieu Brocas Maffei** — grand cabinet mais section startup accessible.

### Alternatives mid-market (tarifs plus accessibles)

- **Valoris Avocats** (Lyon/Paris) — généraliste startup avec expertise BSPCE.
- **K&L Gates** — international, section FR.
- **Fieldfisher** — bon rapport qualité/prix pour BSPCE.

### À éviter (pour early-stage)

- Cabinets "full-service" généralistes sans focus tech/startup → tarifs élevés, deal flow pas adapté.

---

## FAQ

### Q : Peut-on attribuer des BSPCE à des freelances (non-salariés) ?

**R** : Oui, les BSPCE peuvent être attribués aux salariés ET aux mandataires sociaux ET (récemment) aux freelances prestataires récurrents. Vérifier conditions exactes avec avocat.

### Q : Que se passe-t-il en cas de revente de la société ?

**R** : Typiquement, les BSPCE sont exercés au moment de la revente (liquidity event). Le bénéficiaire paye le strike price et reçoit immédiatement la valeur de revente. La plus-value est taxée à 30% (flat tax / PFU).

### Q : Peut-on modifier le pool après attribution ?

**R** : Agrandir le pool oui (nouvelle AG). Diluer les attributions existantes : non (les BSPCE déjà attribués sont protégés).

### Q : Et si on lève des fonds ?

**R** : Les VCs demandent typiquement d'étendre le pool à 15-18% pré-Series A pour couvrir les futurs hires. À négocier.

### Q : Différence BSPCE vs Actions Gratuites (AGA) ?

**R** : Les AGA sont aussi possibles mais plus compliquées fiscalement (charges sociales employeur). BSPCE > AGA pour early-stage dans 95% des cas.

---

## Timeline critique

⚠️ **Fenêtre d'attribution BSPCE au plus bas strike** = avant la première levée de fonds.

Après Series A, le strike price sera basé sur la valo post-money (typiquement 5-10M€+), réduisant drastiquement l'upside pour les bénéficiaires.

**Recommandation forte** : finaliser le pool et faire les 2-3 premières attributions **avant fin 2026** si possible.

---

## Changelog

- **2026-04-23 (v1.0)** — création initiale par Wave 15 CHRO infra.

---

*Disclaimer final : ce document est un template de travail. Consultez un avocat pour toute décision effective.*

# BUSINESS MODEL — CeSoir

> *Free pour les users. B2B pour les venues. Forever.*

Document investor-grade destiné aux due diligences Seed / Série A. Dernière mise à jour : avril 2026.

---

## 1. Positionnement stratégique

**CeSoir n'est pas une app de dating.** C'est une infrastructure de **rencontre spontanée ultra-locale** adossée à un modèle économique **B2B venues-paying** qui garantit la gratuité permanente pour les users finaux.

### Pourquoi c'est critique

Toutes les apps de rencontre historiques (Tinder, Bumble, Hinge, Meetic) ont convergé vers le **freemium piège** : features gratuites inutiles + paywalls agressifs pour les features réellement utiles. Résultat : **27% des users de Tinder paient, 73% sont insatisfaits du gratuit**.

CeSoir refuse ce modèle. Le moat de différenciation est simple et défendable : **"gratuit forever, pour de vrai"**. Pour tenir cette promesse sans perdre d'argent, on déplace la valeur économique sur la **couche B2B venues** — qui ont un intérêt économique direct à remplir leurs soirées creuses.

---

## 2. Sizing du marché

### TAM — Total Addressable Market (Europe latine, 18–35 ans)

- **Pays cibles** : France, Espagne, Italie, Portugal
- **Population 18–35 ans** : ~45M personnes
- **ARPU B2B potentiel an** (via venues) : 28 € / user actif
- **TAM théorique** : **1.26 Md €/an**

### SAM — Serviceable Addressable Market (France uniquement)

- **Population France 18–35 ans** : ~12M personnes
- **Segment urbain actif (villes >100k hab)** : ~7M personnes
- **ARPU B2B an** : 30 € / user actif
- **SAM** : **210M €/an**

### SOM — Serviceable Obtainable Market (année 1, Montpellier)

- **Population cible Montpellier 18–35 ans** : ~90k personnes
- **Target pénétration year 1** : 11% = 10k MAU
- **ARPU B2B** : 33 € / user actif (Montpellier premium density)
- **SOM year 1** : **3.3M €**

### Croissance projetée (conservateur)

| Année | Villes couvertes | MAU | ARPU | ARR |
|---|---|---|---|---|
| 2026 | 1 (Montpellier) | 10k | 33 € | 330k € |
| 2027 | 4 (+ Toulouse, Lyon, Bordeaux) | 80k | 30 € | 2.4M € |
| 2028 | 8 (+ Paris, Nantes, Marseille, Strasbourg) | 250k | 28 € | 7M € |
| 2029 | Europe latine pilote (3 villes) | 500k | 26 € | 13M € |
| 2030 | Europe latine densité | 1.2M | 25 € | 30M € |

---

## 3. Acquisition strategy — Organic-first, viral mechanics

### Principe : zéro paid acquisition en year 1.

Le modèle CeSoir repose sur la **densité locale**. Acheter des users via Meta Ads est inefficace parce que le produit n'est utile que si tes voisins l'utilisent. Donc on construit la densité **quartier par quartier**, pas ville par ville.

### Leviers d'acquisition

1. **Viralité intrinsèque** — Chaque plan posté génère du partage (Instagram Stories, WhatsApp groupes). Target **K-factor ≥ 1.2** dès M+3.
2. **Ambassadeurs campus** — 10 étudiants ambassadeurs par fac (Montpellier = Fac Lettres, Droit, Médecine, IAE, EM Montpellier). Rémunération en crédits B2B (bar tabs, concerts gratuits).
3. **Partenariats venues early-adopters** — 10 bars/restaus pilotes affichent un **QR code CeSoir** sur leurs tables. Le user scanne, voit les plans ce soir dans ce lieu.
4. **Presse locale** — Midi Libre, France Bleu Hérault, Radio Campus Montpellier. Angle : "la startup qui veut que personne ne sorte seul".
5. **Event-hacking** — Présence physique sur événements Gen Z (soirées étudiantes, festivals, marchés nocturnes Peyrou).

### Retention mechanics

- **Push notifications géolocalisées** : "3 plans près de toi ce soir" à 18h30 le mardi-vendredi
- **Squad lock-in** : plus ton groupe d'amis est sur CeSoir, plus tu es bloqué dedans (effet réseau local)
- **14 modes** : couvre 14 situations de vie → user utilise CeSoir 2-3x/semaine, pas 1x/mois
- **Plans récurrents** : "tous les jeudis à l'Heure Bleue" → users reviennent par habitude

### Benchmarks concurrents (French market)

- **Tinder FR** : CAC ~18 €, LTV ~65 €, LTV/CAC = 3.6
- **Hinge FR** : CAC ~22 €, LTV ~85 €, LTV/CAC = 3.9
- **CeSoir target** : CAC ~4 € (quasi-organic), LTV B2B venues ~1800 €, LTV/CAC = **450** (extrême mais logique sur un modèle B2B indirect)

---

## 4. Monetization roadmap

### Phase 0 — Launch (M0 à M6) : 100% gratuit, zéro revenu

Focus : densité users, product-market fit, waitlist venues. Feature flag `MONETIZATION_ENABLED=false` sur toutes les features users. Les 10 venues partenaires pilotes sont gratuites en échange de feedback et de co-marketing.

### Phase 1 — B2B Pilot (M6 à M12) : premier revenu venues

**Produit B2B** :
- **Pin featured** — Un bar paie pour apparaître en haut d'un mode (ex : mode "Solo Diner" → "Épicerie du Pastel featured ce soir")
- **Rubrique Soirées** — Clubs/événements publient leurs soirées + places réservées CeSoir users
- **Dashboard affluence** — Les venues voient "combien de users ont manifesté un intérêt" ce soir

**Pricing indicatif** :
- **Starter** : 49 €/mois — 1 pin featured + soirées illimitées
- **Pro** : 149 €/mois — Dashboard + 5 pins + boost prioritaire
- **Enterprise** : sur mesure — groupes de bars/restaus (Big Mamma, La Belle Époque, etc.)

**Target M12** : 50 venues payantes × 99 € ARPU moy = **4.95k €/mois MRR** = 59k €/an ARR

### Phase 2 — Scale (Year 2) : densité revenue

**Leviers nouveaux** :
- **Performance marketing B2B** — Les venues paient au "plan concrétisé" (+ 2 €/rencontre IRL dans leur établissement), vérifié via QR code check-in
- **API data** — Brasseries, groupes restauration, mairies (étude affluence nocturne) → 500 €/mois/client institutionnel
- **White-label soirées étudiantes** — BDE universités paient pour gérer leurs événements via CeSoir

**Target Y2** : 300 venues × 120 € ARPU + 20 clients API × 500 € = **46k €/mois MRR** = 552k €/an ARR

### Phase 3 — Platform (Year 3+) : infrastructure

CeSoir devient l'infrastructure que les venues utilisent **par défaut** pour remplir leurs soirées creuses (mardi, mercredi, dimanche soir). Précédents similaires : LaFourchette/TheFork pour la restauration (acquis 477M$ par TripAdvisor, 2014), Resy pour le dining US (acquis American Express, 2019).

**Modèle mature** : 30% take rate sur les transactions B2B venues, 10% take rate sur les ventes de tickets événements.

---

## 5. Strategy B2B venues — why it works

### Économie unitaire venue

Un bar/restau à Montpellier qui fait 3000 €/soir les weekends a généralement **500-800 €/soir les mardis-jeudis** (= -75% d'affluence). Un pin featured à 149 €/mois qui génère **5 clients supplémentaires/soir creuse** (= 100 € de CA marginal) rembourse le pin en 1.5 soirée.

**ROI venue** : 4-10x dans les 90 premiers jours.

### Asymétrie d'offre

- **Côté users** : 10k MAU à Montpellier
- **Côté venues** : ~800 bars/restaus/clubs dans le grand Montpellier
- **Ratio 12.5 users / venue** → les venues se battent pour l'attention, pas l'inverse

C'est ce ratio qui garantit que le modèle B2B tient. Il se dégrade dans les très grandes villes (Paris 80k venues) mais reste favorable dans les villes de densité moyenne (Lyon, Bordeaux, Toulouse) — ce qui est précisément notre stratégie d'expansion.

---

## 6. Exit scenarios (horizon 5-7 ans)

### Scénario 1 — Acquihire par Match Group (prob 35%)

Match Group (Tinder, Hinge, OkCupid, Meetic) chasse systématiquement les **produits Gen Z disruptifs**. Précédents :
- **Hinge acquired 2018** — 400M$ cash, 50k MAU FR à l'époque
- **Chispa acquired 2019** — ~50M$, segment LatAm

**Valorisation cible CeSoir à 150k MAU + 4M ARR** : 200-400M€.

### Scénario 2 — Bumble Inc (prob 20%)

Bumble a lancé **Bumble BFF** et **Bumble Bizz** → appétit pour des produits "non-dating" dans le social Gen Z. CeSoir = brique naturelle dans leur portfolio.

**Valorisation cible** : 150-300M€.

### Scénario 3 — Groupe restauration (prob 25%)

**TheFork/LaFourchette (TripAdvisor)**, **Resy (Amex)**, **OpenTable (Priceline)** — tous ont un besoin data-driven sur l'affluence nocturne. CeSoir fournit la couche manquante : **pourquoi les gens sortent**, pas juste **où ils réservent**.

**Valorisation cible** : 100-250M€.

### Scénario 4 — IPO Euronext (prob 10%)

Si CeSoir atteint 2M MAU + 30M € ARR en year 4-5, IPO Euronext Growth possible sur le précédent **BeReal (valo 600M$ refusée, fail éventuel)** ou **Doctolib (7Md€)**.

**Valorisation cible** : 400M€-1Md€.

### Scénario 5 — Acquisition corporate atypique (prob 10%)

**Meta, Snap, TikTok** peuvent voir dans CeSoir un **layer local-social** qui leur manque. Meta notamment a tenté **Facebook Dating** (échec) et cherche une vraie brique Gen Z locale.

**Valorisation cible** : 300-800M€.

---

## 7. Financial projections (5 ans, conservateur)

| Année | ARR | Burn mensuel | Cash needed | Cumul levée |
|---|---|---|---|---|
| 2026 | 60k € | 40k € | 500k € (pre-seed) | 500k € |
| 2027 | 600k € | 130k € | 2M € (Seed) | 2.5M € |
| 2028 | 3M € | 280k € | 3.5M € (reste Seed + Série A 7M €) | 9.5M € |
| 2029 | 10M € | 500k € | 0 (break-even proche) | 9.5M € |
| 2030 | 25M € | — | Profitable | 9.5M € |

**Break-even projeté** : Q3 2029, à ~15k € MRR mature par ville × 8 villes = 120k € MRR × 12 = 1.44M € ARR vs 1.2M € OPEX.

---

## 8. Risques majeurs & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **Faible K-factor** (users ne parrainent pas) | Moyenne | Critique | Build viral mechanics M+0, ambassadeurs campus |
| **Fraude venues / fake check-ins** | Haute | Moyen | QR code + géoloc + machine learning anti-fraud |
| **Réglementation RGPD données géoloc** | Haute | Majeur | Consent-first, anonymisation par défaut, audit trimestriel |
| **Competing platform launch** (Meta, Tinder) | Moyenne | Critique | Moat = densité locale, non-réplicable en top-down |
| **Safety incidents** (agression post-rencontre) | Faible | Critique | Modération 24/7, vérif ID, bouton SOS, partenariat assoc. |
| **Burn rate trop élevé** | Moyenne | Critique | Modèle lean, freelances > CDI en Y1, métriques hebdo |

---

## 9. Thesis d'investissement — One-liner

> *CeSoir combine l'unique trio **plan-first + ultra-local + gratuit-forever** dans un marché (rencontre spontanée Gen Z) où les géants incumbent (Tinder, Bumble) sont cassés et où aucune alternative française n'existe. Le modèle B2B venues est prouvé dans les adjacents (TheFork, Resy), le timing Gen Z post-COVID est parfait, et l'équipe ship à vitesse startup solo. Ask 2M € Seed pour capturer Montpellier puis 7 villes FR en 18 mois.*

---

*Document rédigé en avril 2026. Chiffres basés sur études INSEE 2024, Morning Consult 2025, benchmarks Tinder/Hinge/Bumble 2023-2025, précédents M&A Match Group. Révision trimestrielle.*

**Contact investisseurs** : founder@cesoir.app

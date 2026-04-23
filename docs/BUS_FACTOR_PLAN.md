# Bus Factor Mitigation Plan

> *« Le bus factor, c'est le nombre de personnes qui peuvent se faire renverser par un bus avant que le projet meure. CeSoir est à 1. On veut passer à 3+. »*

**État actuel (2026-04-23)** : bus factor = **1** (le fondateur). Si le fondateur disparaît 1 semaine, CeSoir est en risque existentiel.

**Objectif 2026** : bus factor = **3** (fondateur + tech lead + community manager peuvent chacun maintenir l'activité critique 2 semaines).

---

## Pourquoi c'est un problème

- **Clients/users** : si incident critique (panne Supabase, outage Vercel, bug sécurité), personne d'autre ne peut répondre en moins de 24h.
- **Business** : si opportunity time-sensitive (press, partnership), personne d'autre n'a le contexte pour décider.
- **Investisseurs futurs** : c'est une des premières red flags regardées en due diligence.
- **Mental health** : le fondateur ne peut pas prendre de vraies vacances. Burnout en vue.

---

## Plan en 5 couches

### Couche 1 — Documentation critique (target : 2 semaines)

**Ce qu'on écrit maintenant :**

- [x] `VALUES.md` — les 5 valeurs (fait)
- [x] `CULTURE.md` — how we work (fait)
- [x] `BUS_FACTOR_PLAN.md` — ce doc (fait)
- [ ] `README.md` — mis à jour avec liens vers tous les docs critiques
- [ ] `docs/ARCHITECTURE.md` — stack technique, DB schema, flow users (tl;dr du code)
- [ ] `docs/OPERATIONS.md` — comment déployer, comment rollback, comment débugger prod
- [ ] `docs/INCIDENT_RESPONSE.md` — runbook incident (voir ci-dessous couche 2)
- [ ] `docs/ROADMAP.md` — où on va, pourquoi, dans quel ordre
- [ ] `docs/BUSINESS_MODEL.md` (existe — vérifier à jour)

**Règle :** chaque décision importante = 1 ADR (Architecture Decision Record) dans `docs/adr/`. Format minimal : contexte, decision, conséquences. Max 1 page.

### Couche 2 — Runbook incident (target : 1 semaine)

**Scénarios couverts (avec checklist action) :**

1. **Founder down 1 semaine (maladie, accident, deuil)**
   - Qui contacter : email délégué (à créer), backup contact family
   - Qui décide : Tech Lead (quand hired) pour tech, community manager pour users
   - Budget de décision : jusqu'à 500€ sans validation, au-delà attend founder
   - Communication users : template prêt sur Notion "On prend soin de vous, service normal"

2. **Panne Supabase/Vercel**
   - Statut page monitoring (uptime-robot) → Slack alert
   - Runbook : rollback déployment, contacter support Vercel, statut update users
   - RTO (Recovery Time Objective) : 2h

3. **Incident sécurité (breach, leak)**
   - Notification CNIL 72h (obligation légale RGPD)
   - DPO externe contacté immédiatement
   - Audit log Sentry + Supabase
   - Communication users templatée (honnête, factuelle)

4. **Ban App Store / Google Play**
   - Vu que CeSoir est PWA, ce risque est réduit. Mais :
   - Runbook migration PWA → wrapper natif si besoin (dans `docs/`)

5. **Départ d'un employé clé**
   - Knowledge transfer process (voir CULTURE.md exit process)
   - Revocation accès dans les 24h
   - Repo/credentials handover checklist

### Couche 3 — Access sharing (target : 2 semaines)

**Problème actuel** : 100% des accès critiques sur 1 email (mr.guessousyoussef@gmail.com).

**Solution — 1Password vault partagé** :

- **Vault "CeSoir Production"** partagé entre :
  - Founder (full access)
  - Tech Lead (full access dès hire) 
  - DPO externe (read-only sur secrets RGPD uniquement)

- **Credentials à migrer :**
  - [ ] Supabase (email + 2FA seed)
  - [ ] Vercel (email + 2FA seed)
  - [ ] GitHub org (admin + 2FA seed)
  - [ ] Stripe (email + 2FA seed)
  - [ ] Resend (API key + login)
  - [ ] Google Workspace (admin + recovery codes)
  - [ ] Domain registrar OVH (login + 2FA)
  - [ ] Nom + SIRET société (quand immatriculée)
  - [ ] Compte bancaire pro (au minimum contact conseiller)
  - [ ] Comptable externe (contact + accès FEC)

- **Policy** : nouveau credential = dans le vault dans les 24h. Pas d'exception.

**Backup physique** : 1 USB chiffré (VeraCrypt) avec même contenu, chez le fondateur + coffre bancaire. Mis à jour trimestriellement.

### Couche 4 — Monthly brain dump (target : démarrer ce mois)

**Format** :
- 1 heure enregistrée (audio + vidéo), le 1er lundi de chaque mois.
- Founder parle sans script : état mental, vision produit, inquiétudes, opportunités vues, contexte qu'il/elle a en tête.
- Uploaded sur Notion + Drive privé.
- Accessible aux futurs hires pour qu'ils absorbent vite le contexte.

**Bénéfice** :
- Un nouveau hire peut regarder 6 mois de brain dumps (6h) → gagne 3 mois de ramp-up.
- Si founder disparaît, l'équipe a un mois de contexte frais.

### Couche 5 — OKRs visibles (target : quand équipe ≥ 2)

- OKR trimestriel public (à l'équipe, pas externe).
- 1 page Notion : Objectif global + 3 key results max, avec métrique claire.
- Update hebdo (3 lignes max) : ce qui avance, ce qui bloque, ce qui a changé.
- Quand founder disparaît, l'équipe connaît la priorité.

---

## Hires qui réduisent le bus factor

Priorisés dans `docs/hiring/` :

1. **Tech Lead freelance** (TECH_LEAD_JD.md) — sait déployer, rollback, débugger prod. Réduit risque tech à 50%.
2. **DPO externe** (DPO_EXTERNE_JD.md) — sait répondre à incident RGPD sans founder. Réduit risque légal à 30%.
3. **Community Manager** (COMMUNITY_MANAGER_JD.md) — sait parler aux users si founder absent. Réduit risque communication à 40%.
4. **Designer freelance** (DESIGNER_FEMININE_JD.md) — indirect mais augmente diversité décisionnelle.

**Après ces 4 hires** : bus factor estimé à 2.5.

**Pour passer à 3** : recruter Head of Product ou Head of Growth en CDI (Y2).

---

## Légal & administratif (à mettre en place avant hires)

### Mandat de protection future

Acte notarié qui permet de désigner une personne qui prendra les décisions essentielles si le fondateur est incapacité (accident, coma).

- **Coût** : ~200€ chez notaire.
- **Désigné** : proche de confiance (famille) + avocat startup de référence.

### Testament / directives

Pour les cas extrêmes — prévoir :
- Transmission des parts sociales (famille, associé).
- Accès aux comptes pro (famille informée).
- Instructions CeSoir spécifiques (roadmap, valeurs, culture à protéger).

### Assurance homme-clé

À souscrire dès que CeSoir fait >500k€ ARR :
- **Principe** : assurance qui paie à la boîte si fondateur disparaît (pour recruter remplaçant, pivoter).
- **Coût** : ~1-2k€/an pour 200-500k€ de couverture.
- **Courtiers recommandés** : Luko, Hiscox, Allianz (contact via avocat startup).

---

## Timeline

| Quarter | Action | Responsable | Status |
|---|---|---|---|
| Q2 2026 | VALUES, CULTURE, BUS_FACTOR docs | Founder | Done |
| Q2 2026 | README + ARCHITECTURE + OPERATIONS docs | Founder | Todo |
| Q2 2026 | 1Password vault + migration credentials | Founder | Todo |
| Q2 2026 | Mandat protection future (notaire) | Founder | Todo |
| Q3 2026 | Hire Tech Lead freelance | Founder | Recruiting |
| Q3 2026 | Hire DPO externe | Founder | Recruiting |
| Q3 2026 | Hire Community Manager | Founder | Recruiting |
| Q3 2026 | Brain dump mensuel démarre | Founder | Todo |
| Q4 2026 | Runbook incident complet testé | Tech Lead | Todo |
| Q4 2026 | Réévaluation bus factor | Founder | Todo |
| Q2 2027 | Assurance homme-clé (si ≥500k€ ARR) | Founder | Todo |
| Q4 2027 | Hire CDI Head of Product | Founder | Todo |

---

## Métriques de succès

- **Founder peut prendre 2 semaines off sans intervention** → atteint Q4 2026.
- **Founder peut prendre 1 mois off sans intervention** → atteint Q2 2027.
- **Bus factor = 3** → atteint Q4 2027.

---

## Red flags à surveiller

Si un de ces signaux apparaît, arrêter tout et réinvestir dans bus factor mitigation :

- Founder travaille > 60h/semaine plus de 3 semaines d'affilée.
- Founder dort mal plus de 2 semaines.
- Founder "ne peut pas" aller à un mariage/enterrement/event perso important.
- Founder répond à Slack le dimanche à 22h.
- Un seul employé a les creds pour un truc critique.

---

*Dernière mise à jour : 2026-04-23.*

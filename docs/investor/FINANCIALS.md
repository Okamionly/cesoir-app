# Financials · CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Version synthétique pour investisseurs. Détails opérationnels dans
> `docs/finance/UNIT_ECONOMICS.md` (modèle) et
> `docs/finance/COST_PROJECTION.md` (projection mensuelle).
> Toutes les métriques sont définies dans
> `docs/finance/METRICS_DICTIONARY.md`.

---

## 1. Modèle en une slide

**CeSoir = marketplace inversé** : app gratuite user-side, revenu 100 % B2B venues.

- **Coût / MAU** : 0,10 € (infra variable). Quasi marginal.
- **Revenu / venue active / mois** : 45 € moyen (mix abonnement + events).
- **Gross margin** : 98,6 % (SaaS classique).
- **Break-even** : **19 venues payantes** à ARPU 45 € (scenario réaliste).
- **TAM Montpellier seule** : ~180 venues de nuit.

---

## 2. Unit economics (scénario réaliste)

| Métrique | Valeur |
|---|---|
| ARPU venue / mois | 45 € |
| Churn mensuel venue | 7 % |
| LTV venue | **591 €** |
| CAC cible venue | 80 € |
| **LTV / CAC** | **7,4x** |
| CAC Payback | **1,9 mois** |

Scénarios complets (pessimiste / réaliste / optimiste) :
voir `docs/finance/UNIT_ECONOMICS.md § 3–6`.

## 3. Projection 12 mois (scénario réaliste)

| Trimestre | Users | MAU | Venues payantes | MRR | Cash | Runway |
|---|---|---|---|---|---|---|
| Q0 (M0–M3) | 0 → 500 | 200 | 0 | 0 € | 20 400 € | 14 mois |
| Q1 (M4–M6) | 1 500 | 1 000 | 5 | 225 € | 18 000 € | 11 mois |
| Q2 (M7–M9) | 4 500 | 3 000 | 18 | 810 € | 12 500 € | 7 mois |
| Q3 (M10–M12) | 10 000 | 8 000 | 35 | 1 575 € | 6 350 € | 4 mois |

**Burn net cumulé 12 mois** : 18 650 €.
**Cash M+12 (réaliste, sans levée)** : 6 350 €.

## 4. Apport initial & runway

- **Cash initial** : 25 000 € (apport fondateur).
- **Runway réaliste sans levée** : **15 mois**.
- **Runway pessimiste** : 11 mois.
- **Décision funding** : à M+9 — évaluer si break-even atteignable à M+15 sans
  cash additionnel, ou lever pré-seed 150–300 K€.

## 5. Scénarios de levée

### Scénario A — Bootstrap + pré-seed léger (150 K€)

- **Timing** : M+9 (février 2027).
- **Valuation cible** : 1,5 M€ post-money → 10 % dilution.
- **Emploi des fonds** : recrutement CTO cofounder + designer (2 premiers ETP).
- **Trigger** : si MRR à M+9 > 800 € et LTV/CAC > 3x.

### Scénario B — Seed (600 K€)

- **Timing** : M+15 (août 2027).
- **Valuation cible** : 4–5 M€ post-money → 12–15 % dilution.
- **Emploi des fonds** : expansion Lyon + Toulouse + Bordeaux, équipe passée à 5 ETP.
- **Trigger** : MRR > 4 K€, break-even atteint ou < 3 mois.

### Scénario C — Pas de levée (bootstrap complet)

- **Condition** : break-even atteint à M+12 (scénario optimiste).
- **Reinvestissement** : cashflow pour expansion organique lente, 1 nouvelle ville / an.

## 6. Fiscalité

- **SASU** : IS à 15 % jusqu'à 42 500 € bénéfice, 25 % au-delà.
- **JEI (Jeune Entreprise Innovante)** : dossier à déposer M+3 → exonération charges patronales 8 ans, crédit d'impôt recherche.
- **CII** (crédit impôt innovation) — pas éligible PME non-innovante a priori, à valider.
- **BSA** ou **BSPCE** pour pool advisors / futurs cofondateurs.

## 7. Comptes & banque

- **Banque pro** : Qonto SASU (sélectionnée).
- **Comptable** : cabinet local Montpellier (100 €/mo), comptes annuels
  déposés au greffe.
- **Outils de pilotage** :
  - `/admin/finance` (RunwayCalculator) pour scenarios live.
  - Qonto export CSV → Google Sheets mensuel.
  - Stripe dashboard quotidien (MRR, churn).
  - PostHog cohortes (retention, funnel).

## 8. Hypothèses critiques à confirmer

| Hypothèse | Comment le valider | Impact si faux |
|---|---|---|
| ARPU venue = 45 € | 1ers contrats M+6 | LTV divisé → reprojection |
| Churn venue = 7 %/mo | 3 mois post-launch | LTV / payback / viability |
| CAC venue = 80 € max | campagnes LinkedIn M+3 | revoir canal ou pricing |
| MAU / inscription > 60 % | PostHog funnel T+30 | produit pas activateur |

## 9. Documents demandés avant due diligence

Sur demande signée NDA :
- Comptes prévisionnels 36 mois
- Statuts SASU à jour
- Export Stripe (MRR history) — disponible post M+6
- Registre RGPD
- Cap table détaillée
- Contrats advisors (si existants)

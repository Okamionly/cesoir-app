# Unit Economics — CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Owner : finance ops (aujourd'hui : fondateur). Stratégie : app gratuite
> user-side, monétisation B2B **venues** démarrant à M+6. Montpellier d'abord,
> puis Lyon / Toulouse / Bordeaux.

Ce document est le modèle canonique. Toute métrique présentée en board ou dans
la data room d'investisseurs DOIT sortir d'ici. Trois scénarios : **pessimiste
/ réaliste / optimiste**. On raisonne en **euros HT**.

---

## 1. Coûts par utilisateur (COGS / user)

On décompose en deux natures :

| Nature | Trigger | Formule | Montant estimé |
|---|---|---|---|
| **Infra variable** | 1 MAU actif | (reads + writes + bandwidth) × tarifs Supabase / Vercel / Upstash | **0,08 €** / MAU |
| **Coût paiement** | 1 transaction Stripe (venue side) | `2,9 % × ticket + 0,30 €` | **0,47 €** / tx à 6 € |
| **Emails transac** | ~3 / MAU / mois | Resend 1 € / 1000 | **0,003 €** / MAU |
| **Notifications** | push webpush gratuit | 0 € | 0 € |
| **Storage photos** | 6 photos × 300 Ko | Amorti sur 12 mois | **0,02 €** / MAU amorti |

→ **COGS / MAU (free user) ≈ 0,10 € / mois**
→ **COGS / transaction venue-side ≈ 0,47 €** (déduit du revenu brut avant marge)

### Fixed infra costs (mensuel, indépendant du nombre de MAU jusqu'à X)

| Ligne | Tier actuel | Plafond avant overage | Coût € / mois |
|---|---|---|---|
| Vercel Pro | Pro | 1M fn invocations | 20 $ ≈ 19 € |
| Supabase Pro | Pro | 5M reads / 500k writes / 250 GB egress | 25 $ ≈ 24 € |
| Upstash Redis | Free → pay-go | 10k cmd / jour gratuit | 0 → 10 € à 10k MAU |
| Sentry Team | free → Team | 5k / 50k errors | 0 → 25 € |
| Resend | free → paid | 100 / jour → 50k / mois | 0 → 19 € |
| Nom de domaine | OVH | amorti 1 € / mois | 1 € |
| **Total fixed** |  |  | **~45 € jusqu'à 1k MAU, ~90 € à 10k MAU** |

---

## 2. Modèle de revenu B2B venues (M+6)

Hypothèse : on vend aux venues 3 produits :

| Produit | Prix | Marge brute après Stripe |
|---|---|---|
| **Boost promotionnel évènement** (1 event push 24h) | 29 € / event | 28,16 € (97 %) |
| **Abonnement venue Pro** (badge vérifié + analytics) | 49 € / mois | 47,52 € (97 %) |
| **Pack lancement soirée** (3 events + affichage premium) | 79 € / pack | 76,60 € (97 %) |

Panier moyen par venue active **≈ 45 € / mois** (pondéré : 70 % abo, 30 % à l'event).

---

## 3. LTV projeté — 3 scénarios

LTV venue = `ARPU mensuel × (1 / churn mensuel) × marge brute`

| Scénario | ARPU / venue / mois | Churn mensuel | Marge | **LTV** |
|---|---|---|---|---|
| Pessimiste | 29 € | 12 % | 90 % | **217 €** |
| Réaliste | 45 € | 7 % | 92 % | **591 €** |
| Optimiste | 59 € | 4 % | 93 % | **1 372 €** |

**LTV / user final** reste 0 € (free user-side). On ne monétise pas l'utilisateur, il est le produit (pour la venue, pas pour la revente data ! voir section RGPD).

---

## 4. CAC cible par canal

Budget d'acquisition Montpellier : on cible **100 venues signées** avant ouverture Lyon.

### Côté USER (free)

On ne paie pas de CAC utilisateur. Stratégie : organic + viralité invite-only (migration 021).

| Canal user | Coût / install | Commentaire |
|---|---|---|
| Referral invite-only | 0,00 € | 2 codes par user, pas de récompense cash |
| TikTok organique | 0,00 € | content creator fondateur |
| Instagram Reels | 0,00 € | idem |
| Affiche Montpellier | 0,15 € / impression ciblée | budget max 500 € /mois |

### Côté VENUE (payante)

| Canal venue | Budget test 3 mois | CAC attendu | Conv rate |
|---|---|---|---|
| Door-to-door (fondateur) | 0 € (temps) | ~30 min / venue | 20 % |
| LinkedIn Ads venues patronnes | 500 € | 80 € / venue | 3 % CTR → 10 % conv |
| Partenariat Montpellier Business Club | 0 € (troc) | 0 € | variable |
| Relations presse Midi Libre | 0 € | 0 € | — |

**CAC venue cible : ≤ 100 €** (on cible 30 € en door-to-door, 80 € sur les ads).

---

## 5. CAC Payback

Formule : `CAC / (ARPU × marge)`

| Scénario | CAC | ARPU × marge | Payback |
|---|---|---|---|
| Pessimiste | 100 € | 26,1 € | **3,8 mois** |
| Réaliste | 80 € | 41,4 € | **1,9 mois** |
| Optimiste | 50 € | 54,9 € | **0,9 mois** |

Seuil SaaS sain : payback < 12 mois. On est à < 4 mois dans le pire cas ⇒ modèle viable.

---

## 6. LTV / CAC cible ≥ 3x

| Scénario | LTV | CAC | **LTV/CAC** | Verdict |
|---|---|---|---|---|
| Pessimiste | 217 € | 100 € | **2,2x** | ⚠ insuffisant — renégocier ARPU ou CAC |
| Réaliste | 591 € | 80 € | **7,4x** | ✅ excellent |
| Optimiste | 1 372 € | 50 € | **27,4x** | 🚀 |

Target board : **rester ≥ 3x sur la moyenne trailing 3 mois**. Si passage sous
3x pendant 2 mois consécutifs, déclencher une revue stratégique
(tarif, marché, churn drivers).

---

## 7. Break-even calcul

### Coûts mensuels incompressibles (état M+6, début monétisation)

| Poste | Montant |
|---|---|
| Infra fixed (Vercel + Supabase + Upstash + Sentry + Resend + domain) | **90 €** |
| DPO externe fractional 2j/sem | **500 €** |
| Assurance RC Pro / cyber | **50 €** (amorti annuel 600 €) |
| Comptable LMNP / SASU | **100 €** |
| Frais bancaires SASU (Qonto / Shine) | **15 €** |
| **Total mensuel** |  | **755 €** |

### Break-even en # venues payantes

`# venues = 755 / (ARPU × marge)`

| Scénario | ARPU × marge | **# venues break-even** |
|---|---|---|
| Pessimiste | 26,1 € | **29 venues** |
| Réaliste | 41,4 € | **19 venues** |
| Optimiste | 54,9 € | **14 venues** |

**Montpellier contient ~180 venues de nuit actives.** Break-even atteignable sur
10–15 % de pénétration. Objectif M+9 : **25 venues payantes** ⇒ profitable.

### Break-even en incluant dette technique & legal one-shot

| Dépenses one-shot à amortir sur 24 mois | Montant |
|---|---|
| Legal review CGU / privacy | 4 000 € → 167 € / mois |
| Audit sécurité / pentest léger | 2 000 € → 83 € / mois |
| Design refonte onboarding | 3 000 € → 125 € / mois |
| **Amortissement one-shot mensuel** | **375 € / mois** |

→ **Break-even "all-in" = 1 130 € / mois**, soit **28 venues (réaliste)**.

---

## 8. Gross Margin

Gross margin = `(Revenue - COGS variable) / Revenue`

Revenue / venue = 45 € → COGS = 0,47 € Stripe + 0,15 € infra partagée = 0,62 €
→ **Gross margin = 98,6 %** (SaaS classique).

---

## 9. Rule of 40 & Magic Number (cibles T+12)

- **Rule of 40** : croissance % + marge EBITDA % ≥ 40
  Objectif M+12 : croissance 20 % MoM + EBITDA margin 10 % = 30 % + 10 % = **40 %** ✅ juste
- **Magic Number** : `(Net new ARR × 4) / S&M spend`
  Cible ≥ 1 sur trailing 2 quarters.

---

## 10. Observability roadmap

- [x] Wave 15 : UTM tracking + acquisition_channel (migration 023)
- [x] Wave 15 : `src/lib/infra-metrics.ts` (session aggregator stub)
- [ ] Wave 16 : page admin `/admin/infra-metrics` (owner-only)
- [ ] Wave 17 : ingest BigQuery des events PostHog pour cohortes
- [ ] Wave 18 : dashboard CFO live (MRR, CAC, LTV, Rule of 40, Magic Number)

---

## 11. Glossaire

Voir `docs/finance/METRICS_DICTIONARY.md`.

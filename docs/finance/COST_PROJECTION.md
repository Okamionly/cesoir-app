# Projection des coûts 12 mois — CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Monnaie : **EUR HT**. 1 USD ≈ 0,93 € au 2026-04-23.
> Hypothèse de démarrage : M0 = mai 2026 (launch Montpellier). Monétisation
> venues à M+6 (novembre 2026).

Ce document est la source de vérité pour le **cash burn** et le **runway**. Il
alimente `src/components/admin/RunwayCalculator.tsx`.

---

## 1. Fixed costs (mensuel, indépendant du MAU jusqu'au seuil)

| Poste | Pricing | M0–M5 (beta) | M6–M12 (launch B2B) | Commentaire |
|---|---|---|---|---|
| Vercel Pro | 20 $ / mo | **19 €** | 19 € | PR preview + analytics inclus |
| Supabase Pro | 25 $ / mo | **24 €** | 24 € | jusqu'à 5M reads / 500k writes / 250 GB bandwidth |
| Upstash Redis | free → pay-go | 0 € | **10 €** | active au M+6 (matching queue) |
| Sentry Team | free / 25 $ | 0 € | **25 €** | active au M+3 (5k err/mo dépassé) |
| Resend | free / 20 $ | 0 € | **19 €** | active au M+6 (> 100 mails / jour) |
| Nom de domaine cesoir.app (OVH) | 12 €/an | 1 € | 1 € | amorti mensuel |
| **Sous-total fixed tech** | | **44 €** | **98 €** | |

## 2. Variable costs (scale avec MAU & venues)

Référence barèmes :
- Supabase overage reads : 5 $ / 500k. Writes : 10 $ / 100k.
- Vercel fn invocations > 1M : 0,60 $ / M.
- Stripe : 2,9 % + 0,30 € par transaction.
- Bandwidth Supabase : 0,09 $ / GB au-delà de 250 GB inclus.

| MAU | Reads / mo | Writes / mo | Bandwidth / mo | Coût variable |
|---|---|---|---|---|
| 500 | 2M | 200k | 40 GB | **0 €** (dans le Pro) |
| 2 000 | 8M | 900k | 160 GB | **55 €** |
| 10 000 | 40M | 4,5M | 800 GB | **420 €** |
| 25 000 | 100M | 11M | 2 TB | **1 100 €** |

**Hypothèse retenue :**
- M0–M3 : 200 MAU → variable ≈ 0 €
- M4–M6 : 1 000 MAU → variable ≈ 15 €
- M7–M9 : 3 000 MAU → variable ≈ 85 €
- M10–M12 : 8 000 MAU → variable ≈ 320 €

## 3. Coûts humains

| Poste | M0–M5 | M6–M9 | M10–M12 | Commentaire |
|---|---|---|---|---|
| Fondateur (salaire minimum SASU) | 0 € | **1 500 €** | 1 500 € | différé jusqu'à break-even proche |
| DPO externe fractional (2j/sem) | 0 € | **500 €** | 500 € | obligatoire dès 100 utilisateurs traités régulièrement (CNIL) |
| Comptable LMNP / SASU | 100 € | 100 € | 100 € | |
| Designer freelance (ponctuel) | 0 € | 0 € | 300 € | ~5j par trimestre |
| **Total humain** | **100 €** | **2 100 €** | **2 400 €** | |

## 4. Legal & one-shot

| Poste | Montant | Timing |
|---|---|---|
| Legal review CGU / Privacy / cookies | **4 000 €** | M0 (avant launch) |
| Dépôt marque INPI (FR) | **190 €** | M0 |
| Dépôt marque UE (EUIPO) | **850 €** | M+6 si traction |
| Audit pentest léger (OWASP Top 10) | **2 000 €** | M+3 (pre-public) |
| Assurance RC Pro + cyber | 600 € / an | 50 € / mois |
| Bank setup Qonto SASU | 0 € | M0 |
| **Total one-shot cash burn** | **~7 040 €** | |

## 5. Revenue projection (3 scénarios)

Hypothèses : monétisation démarre M+6. Ramp-up linéaire 5 → 25 venues / mois.

### Pessimiste

| Mois | Venues payantes | ARPU | MRR |
|---|---|---|---|
| M+6 | 3 | 29 € | **87 €** |
| M+9 | 10 | 29 € | **290 €** |
| M+12 | 18 | 29 € | **522 €** |

### Réaliste

| Mois | Venues payantes | ARPU | MRR |
|---|---|---|---|
| M+6 | 5 | 45 € | **225 €** |
| M+9 | 18 | 45 € | **810 €** |
| M+12 | 35 | 45 € | **1 575 €** |

### Optimiste

| Mois | Venues payantes | ARPU | MRR |
|---|---|---|---|
| M+6 | 10 | 59 € | **590 €** |
| M+9 | 30 | 59 € | **1 770 €** |
| M+12 | 60 | 59 € | **3 540 €** |

## 6. Cash burn mensuel (réaliste)

| Mois | Fixed | Variable | Humain | One-shot | Revenue | **Burn net** |
|---|---|---|---|---|---|---|
| M0 | 44 € | 0 € | 100 € | 4 190 € (legal + INPI + bank) | 0 € | **−4 334 €** |
| M1 | 44 € | 0 € | 100 € | 0 € | 0 € | **−144 €** |
| M2 | 44 € | 0 € | 100 € | 0 € | 0 € | **−144 €** |
| M3 | 69 € (Sentry) | 5 € | 100 € | 2 000 € (pentest) | 0 € | **−2 174 €** |
| M4 | 69 € | 10 € | 100 € | 0 € | 0 € | **−179 €** |
| M5 | 69 € | 15 € | 100 € | 0 € | 0 € | **−184 €** |
| M6 | 98 € | 30 € | 2 100 € | 50 € (assurance) | **225 €** | **−2 053 €** |
| M7 | 98 € | 55 € | 2 100 € | 50 € | 450 € | **−1 853 €** |
| M8 | 98 € | 75 € | 2 100 € | 50 € | 630 € | **−1 693 €** |
| M9 | 98 € | 85 € | 2 100 € | 50 € | 810 € | **−1 523 €** |
| M10 | 98 € | 150 € | 2 400 € | 50 € | 1 080 € | **−1 618 €** |
| M11 | 98 € | 220 € | 2 400 € | 50 € | 1 350 € | **−1 418 €** |
| M12 | 98 € | 320 € | 2 400 € | 50 € | 1 575 € | **−1 293 €** |

**Cumulé 12 mois (scénario réaliste) = −18 650 €**

## 7. Runway sans levée

Hypothèse apport personnel fondateur = 25 000 €.
Scénario réaliste → runway **~15 mois**.
Scénario pessimiste → runway **~11 mois**.

→ Première décision funding : **à M+9**, évaluer si break-even atteignable à M+15 sans ajout de cash ou s'il faut lever un pré-seed 150–300 K€.

## 8. Sensibilités (+/- 20 %)

- +20 % MAU organique → +80 € variable / mois → négligeable
- −20 % venues signées → runway −2 mois
- +1 mois retard monétisation → runway −1,5 mois
- Embauche CTO salarié (3 500 € / mois) à M+9 → runway −6 mois (repoussée à post-seed)

## 9. Recommandations action

1. **Negotiate** le DPO fractional à 400 € / mois sur 6 premiers mois (engagement).
2. **Delay** Upstash jusqu'au vrai besoin matching queue — 0 € jusqu'à M+7.
3. **Bootstrap** le legal : utiliser les modèles CNIL + revue ciblée par avocat à 1 500 € max.
4. **Batch** les emails Resend en digest quotidien plutôt qu'immédiat (divise volume par 3).
5. **Ne pas prendre Stripe Premium** (Tax / Billing) tant que < 10 K€ MRR.

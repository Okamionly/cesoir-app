# Dictionnaire des métriques — CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Toute métrique publiée en board, pitch deck ou rapport doit être définie ici.
> Une formule. Une source. Une fréquence. Pas de "je pense que".

---

## 1. Revenus & ARR

### MRR (Monthly Recurring Revenue)
- **Formule** : `Σ (prix abonnement mensuel actif)` au dernier jour du mois.
- **Source** : Stripe Billing → API `list_subscriptions` (status = active) via `mcp__943bbfbc-6830-4d19-a23c-b5ed8455100c__list_subscriptions`.
- **Fréquence** : daily snapshot + mensuel officiel.
- **Exclus** : packs one-shot (pack lancement 79 €), ceux-ci vont dans **transactional revenue**.

### ARR (Annual Recurring Revenue)
- **Formule** : `MRR × 12`.
- **Source** : dérivé de MRR.
- **Fréquence** : dérivé en direct du MRR officiel.

### Net new MRR
- **Formule** : `New MRR + Expansion MRR − Churn MRR − Contraction MRR`.
- **Source** : Stripe events (customer.subscription.created, updated, deleted).
- **Fréquence** : mensuel.

### Transactional revenue
- **Formule** : `Σ (paiements Stripe one-shot)` dans le mois.
- **Source** : Stripe Payment Intents (`type = one_time`).
- **Fréquence** : mensuel.

---

## 2. Utilisateurs

### MAU (Monthly Active Users)
- **Formule** : `COUNT(DISTINCT user_id) WHERE last_active_at ≥ NOW() - 30 days`.
- **Source** : Supabase `profiles.last_seen` (mis à jour à chaque session via AuthContext).
- **Fréquence** : daily snapshot, mensuel officiel.

### DAU (Daily Active Users)
- **Formule** : `COUNT(DISTINCT user_id) WHERE last_active_at ≥ NOW() - 1 day`.
- **Source** : idem MAU.
- **Fréquence** : daily.

### DAU / MAU ratio (stickiness)
- **Formule** : `DAU / MAU`.
- **Target** : > 0,2 = app "engageante". Dating apps top quartile : 0,35–0,45.

### Paid Users (B2B venues)
- **Formule** : `COUNT(DISTINCT venue_id) WHERE subscription.status = 'active'`.
- **Source** : Stripe.
- **Fréquence** : mensuel.

### Free-to-Paid conversion %
- **Formule** : `Paid venues signed this month / venues visited onboarding B2B this month`.
- **Source** : Stripe + PostHog funnel `b2b_signup_funnel`.
- **Fréquence** : mensuel.

---

## 3. Acquisition

### CAC (Customer Acquisition Cost)
- **Formule (global)** : `Total S&M spend / # new paying venues signed` sur le mois.
- **Source** : comptabilité (dépenses LinkedIn Ads, Meta Ads, partenariats payants).
- **Fréquence** : mensuel.

### CAC by channel
- **Formule** : `S&M spend on channel X / # venues attributed to X`.
- **Source** : PostHog + `profiles.acquisition_channel` (migration 023).
- **Attribution model** : first-touch (voir `src/lib/analytics.ts` `inferChannel`).

### CAC Payback
- **Formule** : `CAC / (ARPU × gross margin %)` en mois.
- **Source** : dérivé.
- **Target** : < 12 mois.

---

## 4. Rétention & Churn

### Logo churn mensuel (venues)
- **Formule** : `# venues churned / # venues active début de mois`.
- **Source** : Stripe events `subscription.deleted` (timestamp in window).
- **Fréquence** : mensuel.
- **Target** : < 5 % (benchmark SaaS B2B SMB : 3–7 %).

### Revenue churn mensuel
- **Formule** : `MRR perdu par churn / MRR début de mois`.
- **Source** : Stripe.
- **Target** : < 4 %.

### Net Revenue Retention (NRR)
- **Formule** : `(MRR début + Expansion − Contraction − Churn) / MRR début`.
- **Source** : Stripe.
- **Target** : > 100 % = expansion > churn.
- **World-class** : > 120 %.

### User churn (free users)
- **Formule** : `# users WHERE last_seen < NOW() - 30 days / # users registered before 30 days`.
- **Source** : `profiles.last_seen`.
- **Fréquence** : weekly.

---

## 5. Unit economics

### LTV (Lifetime Value)
- **Formule** : `ARPU mensuel × (1 / churn mensuel) × marge brute`.
- **Source** : dérivé.
- **Scénarios** : voir `UNIT_ECONOMICS.md` § 3.

### LTV / CAC
- **Formule** : `LTV / CAC`.
- **Target** : ≥ 3x moyenne trailing 3 mois.
- **Alerte** : < 3x sur 2 mois consécutifs → revue stratégique.

### Gross Margin %
- **Formule** : `(Revenue − COGS variable) / Revenue`.
- **COGS variable** : Stripe fees + infra variable imputable.
- **Target** : ≥ 80 % (SaaS). CeSoir visé : **98 %**.

### Contribution Margin
- **Formule** : `Revenue − COGS variable − Coûts variables Sales/Marketing`.
- **Source** : dérivé.

---

## 6. Croissance & santé

### Rule of 40
- **Formule** : `Growth % (YoY or MoM annualisé) + EBITDA margin %`.
- **Source** : dérivé.
- **Target** : ≥ 40 (benchmark VC).

### Magic Number
- **Formule** : `(Net new ARR × 4) / Sales & Marketing spend (quarter)`.
- **Target** : ≥ 1,0 = chaque € investi S&M génère 1 € d'ARR annuel.
- **Fréquence** : trimestriel.

### Burn multiple
- **Formule** : `Net burn / Net new ARR`.
- **Target** : < 2x (start-up stade early), < 1x (croissance efficiente).

### Quick ratio
- **Formule** : `(New MRR + Expansion) / (Churn + Contraction)`.
- **Target** : ≥ 4 (croissance saine).

---

## 7. Produit (core loop)

Les 7 events PostHog "core loop" wirés par V3 :

| Event | Trigger | Importance CFO |
|---|---|---|
| `page_viewed` | Route change | attribution |
| `register_complete` | User signed up | top funnel → MAU |
| `profile_created` | Onboarding done | activation |
| `match_created` | Mutual swipe | engagement |
| `message_sent` | Chat message | engagement |
| `rendezvous_created` | Meet-up planned | output |
| `acquisition_tracked` | UTM flush at signup | CAC attribution |

---

## 8. Cash & runway

### Cash position
- **Formule** : solde Qonto SASU au dernier jour du mois.
- **Source** : Qonto export CSV.

### Net monthly burn
- **Formule** : `Cash out − Cash in` sur le mois.

### Runway
- **Formule** : `Cash position / Average monthly net burn (trailing 3 months)`.
- **Target** : > 12 mois en permanence.
- **Alerte rouge** : < 6 mois ⇒ déclencher levée.

### Default alive vs Default dead (Paul Graham)
- **Définition** : *Default alive* si la courbe de revenue croissante intercepte
  la droite des coûts avant l'épuisement du cash, en continuant au rythme actuel
  d'embauche. Sinon *default dead*.
- **Fréquence** : mensuel.
- **Action** : si *default dead*, ne pas embaucher + accélérer monétisation.

---

## 9. Anti-patterns — métriques à refuser

- "Total registered users" **sans** filtre d'activité → vanity metric, interdite en pitch.
- "Valuation" **sans** revenue attaché → jamais publiée.
- "Total GMV" pour un SaaS → no sense, on vend du recurring pas du transactionnel.
- LTV calculé sur 3 mois de données → bruit pur. **Minimum 6 mois** ou étiqueter "preliminary".
- CAC calculé **sans** coûts humains → optimisme trompeur. Inclure 50 % du temps fondateur.

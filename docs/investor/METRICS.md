# Metrics · CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23 — **stub pre-launch**
> Toutes les métriques en données **réelles** seront remplies après launch
> (mai 2026). En attendant : projections 30/60/90 jours + KPI targets.

## Rappel définitions

Voir `docs/finance/METRICS_DICTIONARY.md` (formule, source, fréquence pour
chaque chiffre). Tout ce qui suit est cohérent avec ces définitions.

---

## 1. État à date (pre-launch)

| Métrique | Valeur | Commentaire |
|---|---|---|
| Registered users | **0** | Launch public prévu mai 2026 |
| MAU | 0 | idem |
| Paid venues | 0 | Monétisation prévue M+6 |
| MRR | 0 € | idem |
| ARR | 0 € | idem |
| Cash | 25 000 € | Apport fondateur |
| Runway | 15 mois | Scénario réaliste — voir FINANCIALS.md |

---

## 2. Targets T+30 jours (juin 2026)

| Métrique | Target | Stretch |
|---|---|---|
| Registered users (Montpellier) | 300 | 500 |
| MAU / DAU ratio | > 0,25 | > 0,35 |
| % users avec 1+ match | > 40 % | > 55 % |
| Temps moyen 1er message | < 24h | < 6h |
| NPS (post-rendez-vous IRL) | > 40 | > 55 |
| Venues en contact commercial | 20 | 40 |

## 3. Targets T+90 jours (août 2026)

| Métrique | Target | Stretch |
|---|---|---|
| Registered users | 2 000 | 3 500 |
| MAU | 800 | 1 400 |
| Rendez-vous IRL confirmés / semaine | 30 | 80 |
| User retention D30 | > 25 % | > 40 % |
| Venues LOIs signées | 5 | 15 |

## 4. Targets T+180 jours — launch monétisation (novembre 2026)

| Métrique | Target | Stretch |
|---|---|---|
| MAU | 3 000 | 6 000 |
| Paid venues | 5 | 15 |
| MRR | 225 € | 680 € |
| CAC venue | < 100 € | < 50 € |
| LTV / CAC | > 3x | > 7x |

---

## 5. Funnel d'activation (7 events PostHog)

Couverture du core-loop (wiré Wave 15 par V3) :

```
page_viewed
   ↓
register_complete
   ↓  (onboarding_complete)
first_swipe
   ↓
first_match
   ↓
first_chat_message
   ↓
first_plan_created
   ↓
first_irl_confirmed
```

Benchmarks attendus étape par étape (pré-launch, à confirmer T+30) :

| Étape | Drop-off toléré | Drop-off optimiste |
|---|---|---|
| page_viewed → register_complete | 90 % | 75 % |
| register_complete → onboarding_complete | 20 % | 10 % |
| onboarding_complete → first_swipe | 10 % | 5 % |
| first_swipe → first_match | 60 % | 40 % |
| first_match → first_chat_message | 30 % | 20 % |
| first_chat_message → first_plan_created | 80 % | 60 % |

---

## 6. Acquisition par channel (post-launch)

Colonne `profiles.acquisition_channel` renseignée via migration 023 + first-touch UTM.
À remplir T+30 :

| Channel | Users | % | CAC |
|---|---|---|---|
| organic | — | — | 0 € |
| social | — | — | — |
| paid | — | — | — |
| referral | — | — | 0 € |
| direct | — | — | — |

## 7. Anti-fraud & santé de base

À surveiller dès D7 :

- Bot signup rate < 5 %
- Signalements utilisateurs < 2 % du MAU
- Ratio messages / match > 4 (sinon == ghosting endémique, pivot produit)
- Temps moyen entre inscription et suppression compte > 14 j (proxy satisfaction)

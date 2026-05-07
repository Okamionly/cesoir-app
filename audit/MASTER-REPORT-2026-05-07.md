# CeSoir — Master Report Exécutif
**Date :** 2026-05-07 | **Stade :** Pre-seed / Soft beta Montpellier | **Fondateur :** Solo

---

## Score Global Consolidé : 5.3 / 10

| Domaine | Score brut | Poids | Score pondéré |
|---|---|---|---|
| CEO / Vision & Strategy | 5.2 | 1x | 5.2 |
| CTO / Technique | — | 1x | 6.5 (estimé round3) |
| CPO / Produit | 4.9 | 1x | 4.9 |
| CRO / Revenue & GTM | 3.9 | 1x | 3.9 |
| CCO / Customer | 4.3 | 1x | 4.3 |
| CFO / Finance | 5.6 | 1x | 5.6 |
| CHRO / People | 4.4 | 1x | 4.4 |
| Design | 8.0 | **2x** | 16.0 |
| RGPD + Safety | 4.0 (composite) | **2x** | 8.0 |
| **Score final pondéré** | | **÷ 12** | **5.3 / 10** |

Lecture : score technique et design forts (6.5-8.0), score business et compliance faibles (3.9-5.6). Le produit existe ; le business n'a pas encore démarré.

---

## Top 10 P0 — Critiques, à corriger avant beta publique

Ces 10 items bloquent le launch ou exposent à un risque existentiel immédiat. Aucune nouvelle feature n'est justifiée tant que l'un d'eux reste ouvert.

### P0-1 — Verify selfie / video : UI sans backend fonctionnel
**Source :** Trust + Safety audit, CCO, CPO
**Cross-functional :** oui (Safety + Produit + Customer)
Face-api est intégré mais la moderation_queue n'a aucune interface ops. Les profils flaggés tombent en `pending` indéfini. Aucun humain ne les review. Le badge "Vérifié" n'est pas affiché sur les SwipeCards.
**Fix :** Créer `/admin/moderation` + SLA review 4h + afficher badge vérifié sur SwipeCard. Effort : 4h dev + process.

### P0-2 — MONETIZATION_ENABLED=false + price IDs vides
**Source :** CFO, CRO
**Cross-functional :** oui (Finance + Revenue)
`STRIPE_PRICE_*` non provisionnés en prod. Tout clic "Subscribe" retourne un 400. Il est impossible de générer 1€ de revenu aujourd'hui, ce qui signifie qu'aucune validation de la proposition de valeur n'est possible.
**Fix :** Exécuter `scripts/setup-stripe-products.ts` en test, pousser les price IDs en Vercel env, activer Stripe Tax EU. Effort : 2h.

### P0-3 — 24 migrations Supabase non pushées (Wave 16 + 17 dormantes)
**Source :** CPO, Retention, ROADMAP
**Cross-functional :** oui (Produit + Rétention + Revenue)
Crystal Ball, Streaks, Voice intro, Moments, Passport, Push notifications, Cron Crystal Ball sont tous invisibles en prod. Le produit présenté aux premiers users est une v1 alors que le code est une v3. C'est le seul acte qui débloque 80% de la valeur construite.
**Fix :** `supabase db push` + 7 env vars Vercel (VAPID + ANTHROPIC_API_KEY + CRON_SECRET). Effort : 1h.

### P0-4 — RGPD Art. 9 : orientation sexuelle sans consentement explicite
**Source :** RGPD audit
**Cross-functional :** oui (Legal + Produit)
Le champ `looking_for` ("hommes", "femmes", "tous") révèle l'orientation sexuelle — catégorie spéciale art. 9. Il est collecté dans le formulaire standard sans case de consentement distincte et explicite. Violation directe. Amende CNIL potentielle.
**Fix :** Ajouter une checkbox séparée "Je consens au traitement de mes préférences de rencontre (données sensibles art. 9)" avant soumission du signup. Effort : 1h.

### P0-5 — Validation d'âge absente côté serveur
**Source :** RGPD audit
**Cross-functional :** oui (Legal + Safety)
Le champ `age` est validé `min=18` en HTML uniquement. L'API `/api/auth/signup/route.ts` n'a aucune vérification serveur. Un attaquant peut envoyer `age: 14` directement via curl. Mineur sur plateforme dating = violation obligation légale.
**Fix :** Ajouter `if (age < 18) return 400` dans la route signup serveur. Effort : 15 minutes.

### P0-6 — Fichiers Storage orphelins après suppression de compte
**Source :** RGPD audit, CCO
**Cross-functional :** oui (Legal + Produit)
La cascade `/api/account/delete` supprime les rows DB mais ne supprime pas les fichiers dans les buckets `voice-messages` et `moments`. Les clips audio et photos restent accessibles après effacement du compte. Violation art. 17 RGPD.
**Fix :** Ajouter boucle Storage cleanup dans la route delete pour les deux buckets. Effort : 1h.

### P0-7 — Lifecycle emails inexistants (D1 / D7 / D30)
**Source :** CCO, Retention
**Cross-functional :** oui (Customer + Rétention)
Aucun email automatique n'est configuré. Un user qui s'inscrit jeudi et ne revient pas vendredi est perdu définitivement. Resend est installé mais aucune séquence n'est branchée. Sur une dating app, 60% du churn D7 est récupérable par email selon les benchmarks industrie.
**Fix :** Brancher 3 triggers Resend : J+1 sans swipe, J+3 sans match, J+7 inactif (winback). Effort : 2 jours dev.

### P0-8 — SOS stealth non fonctionnel en conditions réelles
**Source :** Safety audit
**Cross-functional :** oui (Safety + Produit)
Deux gaps critiques : (1) `data-logo-moon` n'est assigné nulle part dans TopNav/BottomNav — le triple-tap peut ne jamais se déclencher car la détection `textContent === "☾"` est fragile sur un SVG ou img. (2) La modal SOS affiche un fond rouge full-screen visible à un agresseur — l'inverse de "stealth".
**Fix :** Ajouter `data-logo-moon="true"` sur le logo lune + mode silencieux (vibration + flash 200ms, pas d'UI visible). Effort : 2h.

### P0-9 — Bus factor = 1 avec 25k€ de cash, zéro advisor
**Source :** CEO, CHRO
**Cross-functional :** oui (Strategy + People)
Indisponibilité du fondateur > 3 semaines = projet à l'arrêt. Aucun runbook documenté, aucun co-founder, aucun advisor formalisé. Red flag #1 pour tout investisseur seed. Le document `BUS_FACTOR_PLAN.md` existe mais un document ne remplace pas une personne.
**Fix :** Rédiger un RUNBOOK.md (5 procédures critiques : deploy, DB rollback, Stripe webhook, Supabase RLS, incidents). Engager un designer freelance + un community ambassador Montpellier. Trouver un co-founder ou advisor opérationnel avant fin Q2. Effort : 4h RUNBOOK + recrutement continu.

### P0-10 — Ratio hommes/femmes non géré au launch
**Source :** CEO
**Cross-functional :** oui (GTM + Produit + Strategy)
Aucun mécanisme de throttle H/F dans le code ou le GTM plan. Toutes les apps de rencontre meurent ou stagnent sur ce problème. Si les premiers 200 users sont à 80% hommes, les femmes quittent en J+7 et les hommes ensuite. Le mode "Women First" est mentionné dans les pitches presse mais n'est pas implémenté dans le process d'invitation.
**Fix :** Réserver 60% des 500 premiers invite codes aux femmes. Mesurer le ratio H/F comme KPI de santé hebdomadaire dès J+1. Throttle automatique si ratio > 60% hommes. Effort : process (0 code), mesure dans PostHog (1h).

---

## Top 10 P1 — High-impact, M+1 à M+3

| # | Finding | Domaines | Effort |
|---|---|---|---|
| P1-1 | /profile : 14 sections en 1 scroll — cognitive overload bloque la complétion | CPO, Design | M |
| P1-2 | Zéro meta tags SEO / OG image — partages WhatsApp/Insta sans preview | CRO | XS |
| P1-3 | PostHog cookie déposé avant consentement (ePrivacy violation) | RGPD | S |
| P1-4 | VoiceIntroRecorder.onSave ne persiste pas (TODO non câblé) | CPO, CCO | S |
| P1-5 | Matching : fan-out N RPC calls getVibesForUsers (bottleneck à 500+ users) | Matcher | XS |
| P1-6 | Contrastes gradient-text / bouton gradient-bg sous WCAG AA (fail CTA principal) | A11y | S |
| P1-7 | Landing 100% SPA non-indexable — SEO local "rencontre Montpellier" impossible | CRO | M |
| P1-8 | Pricing Premium 9,99€ sous-positionné vs Tinder/Bumble (15-31€) | CRO, CFO | XS |
| P1-9 | Crystal Ball cron non configuré — feature dormante même après push migrations | CPO, Retention | S |
| P1-10 | Modération photos : Sightengine non appelé systématiquement à l'upload | Safety | S |

---

## Top 10 P2 — Nice-to-have, Q4 2026

| # | Finding | Domaines |
|---|---|---|
| P2-1 | Palette hors-charte : crystal/manifesto/progress/PageHeader (zinc, neutral, pink) | Design |
| P2-2 | Beat Day / Apero Friday / Brunch Sunday modes à lancer (coût quasi nul) | Modes |
| P2-3 | /api/account/export manquant (art. 20 RGPD portabilité) | RGPD |
| P2-4 | Crons rétention data : ghost_penalties purge 24 mois, messages purge 6 mois post-expiration | RGPD |
| P2-5 | Match expiration 24h intelligente avec push "expire dans 2h" | Retention, Matcher |
| P2-6 | Selfie liveness verification réelle (Onfido ou face-api) vs badge 3 selfies actuel | Trust, CPO |
| P2-7 | Discord beta + programme ambassadeurs Montpellier formalisé | CCO, CHRO |
| P2-8 | waveform Web Audio réelle dans VoiceMessagePlayer | Design |
| P2-9 | Super Likes ciblés par mode (conversion ×3 vs super like générique) | Matcher, CRO |
| P2-10 | TWA Android Play Store soumission | CPO |

---

## Conflits entre audits — Zones de désaccord identifiées

**Conflit 1 — Pricing Premium**
CFO et CRO divergent sur le plan annuel : CRO recommande 79,99€/an (-48%), CFO recommande 79,99€ aussi mais en partant de 12,99€/mois. La ROADMAP existante propose 4,99€/mois (bien en dessous). Consensus recommandé : **12,99€/mois + 79,99€/an** — aligne CRO et CFO, casse avec la ROADMAP initiale.

**Conflit 2 — Feature kill vs garder**
CPO recommande de killer Crystal Ball, QR Check-ins, Passport, Saved Searches immédiatement. La ROADMAP les maintient dans le backlog Q3. Les audits Retention et Modes confirment que Crystal Ball est le pull daily le plus puissant du produit. Consensus recommandé : **killer QR Check-ins + Saved Searches, garder Crystal Ball et Passport en dormant** jusqu'à 500 users.

**Conflit 3 — Premier hire**
CHRO recommande un designer senior freelance en priorité 1. CEO recommande un co-founder ou Head of Product. CCO recommande un community manager. CFO recommande d'attendre M3 pour tout hiring. Consensus recommandé : **designer freelance immédiatement (0 cash burn long terme) + community ambassador Montpellier J+14 post-launch** — les deux peuvent être rémunérés ponctuellement sans burn fixe élevé.

**Conflit 4 — Trigger monétisation**
CRO dit 1 000 MAU avant flip. CFO dit activer en test sur 20 users volontaires cette semaine pour valider le pipe. Consensus recommandé : **activer le pipe Stripe cette semaine en test sur 10 users volontaires** (valider la plomberie) + **flip public à 500 MAU actifs** (pas 1 000 — trop tard pour le feedback pricing).

---

## Quick Wins — Actions faisables aujourd'hui (< 4h chacune)

| Action | Effort | Impact |
|---|---|---|
| `supabase db push` + 7 env vars Vercel | 1h | Débloque 100% des features Wave 16+17 |
| Validation age `>= 18` serveur dans `/api/auth/signup/route.ts` | 15 min | Ferme la faille mineurs |
| `data-logo-moon="true"` sur le logo lune TopNav + BottomNav | 30 min | Rend le SOS stealth fonctionnel |
| `toFixed(4)` → `toFixed(2)` dans LocationCard.tsx ligne 118 | 5 min | Supprime le risk géo-stalking 11m |
| Checkbox art. 9 consentement au signup | 1h | Ferme la violation RGPD la plus exposée |
| `blockUser()` en cascade dans `useSafety.reportUser` | 1h | Protège la victime immédiatement au report |
| `export const metadata` + og:image sur page.tsx landing | 30 min | Partages WhatsApp/Insta avec preview |
| Stripe price IDs provisionnés en Vercel env | 2h | Rend le checkout fonctionnel |
| RUNBOOK.md 5 procédures critiques | 4h | Réduit le bus factor de façon documentée |
| Réserver 60% codes invite aux femmes (process, 0 code) | 30 min | Initie le contrôle du ratio H/F |

---

## Roadmap Consolidée 90 jours

### S1 (7-14 mai 2026) — Infrastructure critique
1. `supabase db push` + env vars Vercel → Wave 16+17 live
2. Validation âge serveur + checkbox art. 9 RGPD
3. `data-logo-moon` sur logo + SOS stealth mode
4. Stripe price IDs + Stripe Tax EU activé
5. RUNBOOK.md 5 procédures critiques

### S2-S4 (14 mai - 4 juin) — Security + Lifecycle + Modération
- Lifecycle emails D1/D3/D7 via Resend (3 triggers)
- Interface `/admin/moderation` + SLA 4h
- Storage cleanup dans `/api/account/delete` (voice + moments)
- Cron Crystal Ball configuré sur cron-job.org
- PostHog events business instrumentés (5 events non-négociables)
- Contrastes WCAG AA corrigés (gradient-text, bouton gradient-bg)
- /profile splitté en vue lecture / /profile/edit

### M+2 (juin) — Design polish + Onboarding + Lancement beta
- Meta tags SEO / OG image sur landing
- 3 pages statiques SEO locales (/montpellier, /blog x2)
- VoiceIntroRecorder câblé (upload Supabase Storage)
- IcebreakerSuggestions unifiées avec fallback statique mode-aware
- Designer freelance engagé
- 100 flyers imprimés + comptes Insta/TikTok activés
- Beta privée 100 users Montpellier lancée (invite codes)

### M+3 (juillet) — Seeding campus + Viral loop + Monétisation
- Community Ambassador Montpellier embauché (J+14 post-launch)
- Ambassadeurs campus Paul Valéry + UM (5 étudiants rémunérés en crédits)
- Invite codes section surfacée sur la landing
- Flip monétisation sur 10 users volontaires (validation pipe)
- Partenariats 5 bars/restos Montpellier QR codes
- Nouveau matching v2 : batch vibes, freshness bucket, anti-burnout rotation
- Modes Apero Friday + Brunch Sunday lancés (time-gate dans modes.ts)

---

## Investment Ask Justifié — Jours-homme pour P0

| P0 | Effort estimé |
|---|---|
| P0-3 : Push migrations + env vars | 1 jour (inclut tests) |
| P0-1 : Interface modération + badge vérifié | 2 jours |
| P0-2 : Stripe activation end-to-end | 1 jour |
| P0-4 + P0-5 + P0-6 : RGPD (checkbox + age serveur + Storage delete) | 2 jours |
| P0-7 : Lifecycle emails D1/D3/D7 | 2 jours |
| P0-8 : SOS stealth fix | 0.5 jour |
| P0-9 : RUNBOOK.md + documentation | 1 jour |
| P0-10 : Process ratio H/F + PostHog tracking | 0.5 jour |
| **Total P0** | **10 jours-homme** |

10 jours-homme solo ou 5 jours avec un second dev. Budget externe si freelance : 5 000-8 000€ (400-600€/jour dev mid-senior Paris). Ces 10 jours débloquent le launch public et ferment les risques légaux immédiats.

---

## Pre-launch Checklist — 30 items avant beta publique

### Légal / RGPD (10 items)
- [ ] Checkbox consentement art. 9 (orientation sexuelle) au signup
- [ ] Validation âge >= 18 côté serveur
- [ ] Endpoint /api/account/export (portabilité art. 20)
- [ ] Storage cleanup voice + moments dans /api/account/delete
- [ ] Banner cookie conforme TCF v2 (PostHog conditionnel)
- [ ] Privacy Policy mise à jour avec liste sous-traitants (PostHog EU, Sentry, Supabase, Vercel, Stripe)
- [ ] DPO externe désigné et notifié CNIL
- [ ] DPIA formelle déposée CNIL
- [ ] Crons rétention data planifiés (ghost_penalties 24m, messages 6m, inactifs 24m)
- [ ] SUPABASE_SERVICE_ROLE_KEY vérifiée en prod (pas d'orphelins auth.users)

### Safety / Trust (8 items)
- [ ] `data-logo-moon="true"` sur logo lune TopNav et BottomNav
- [ ] SOS mode stealth (vibration + flash, pas de fond rouge)
- [ ] `blockUser()` en cascade dans `useSafety.reportUser`
- [ ] Interface /admin/moderation opérationnelle avec SLA
- [ ] `LocationCard.tsx` : `toFixed(4)` → `toFixed(2)`
- [ ] Badge "Vérifié" visible sur SwipeCards
- [ ] Moderation photo Sightengine appelée systématiquement à l'upload
- [ ] Modale safety pre-RDV avant confirmation IRL date

### Technique / Produit (7 items)
- [ ] `supabase db push` (24 migrations) exécuté et validé
- [ ] 7 env vars Vercel provisionnées (VAPID + ANTHROPIC + CRON_SECRET)
- [ ] Stripe price IDs provisionnés + Stripe Tax EU activé
- [ ] Cron Crystal Ball configuré sur cron-job.org
- [ ] VoiceIntroRecorder câblé vers Supabase Storage
- [ ] IcebreakerSuggestions fallback statique mode-aware
- [ ] Crystal Ball empty state palette corrigée (#111 + radial violet)

### GTM / Acquisition (5 items)
- [ ] Meta tags SEO + og:image sur landing page.tsx
- [ ] 60% des 500 premiers invite codes réservés aux femmes
- [ ] Ratio H/F mesuré comme KPI dans PostHog dès J+1
- [ ] Community Ambassador Montpellier identifié avant launch
- [ ] Crisp ou Tawk.to installé (live chat safety, gratuit)

---

## Top 5 Risques Existentiels

| # | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Masse critique non atteinte (chicken-and-egg Montpellier) | Haute | Mortel | Seeding manuel campus + bars, kill metric T+4 mois (500 MAU ou stopper) |
| 2 | Déséquilibre H/F au launch (>60% hommes = fuite féminine) | Haute | Mortel | 60% codes femmes, throttle automatique, Women First |
| 3 | Incident safety IRL (agression post-rencontre) | Faible | Catastrophique | SOS fonctionnel, modération active, Safety page accessible, DPO |
| 4 | Amende CNIL (art. 9 orientation sexuelle, mineurs) | Moyenne | Critique (jusqu'à 4% CA ou 20M€) | P0-4 + P0-5 cette semaine, DPO M+2 |
| 5 | Burnout fondateur solo (60h/semaine, 25k€ cash) | Moyenne | Mortel | RUNBOOK + designer freelance + community ambassador = première redistribution de charge |

---

## Synthèse Exécutive

CeSoir est techniquement le produit de dating app le plus complet construit par un solo-founder en France à ce stade. L'insight "plan-first, pas swipe-first" est défendable, la stack est production-grade (48 migrations, Sentry, PostHog, face-api, NSFWJS, Stripe), le design est au niveau des apps Tier 1 (score 8/10).

Le problème est que le business n'a pas encore démarré : 0 revenu, 0 utilisateur actif validé, 0 traction mesurable. Le produit v3 tourne en mode v1 parce que 24 migrations ne sont pas pushées. Stripe est câblé mais inactivé. Les features de rétention sont dormantes.

La bonne nouvelle : les P0 sont presque tous des actions de quelques heures, pas des refactorisations majeures. 10 jours-homme ferment les risques légaux, débloquent la monétisation, et rendent le produit réel pour les premiers utilisateurs. Le mois de mai est critique : launch beta ou risque de voir Thursday (IRL-first, expansion Paris mars 2026) prendre la fenêtre sur Montpellier avant CeSoir.

La mauvaise nouvelle : aucune feature supplémentaire ne servira à quelque chose tant que ces P0 ne sont pas fermés et que la densité locale n'est pas atteinte. L'ordre d'exécution est la seule variable stratégique qui compte en mai 2026.

---

*Sources : ceo-audit, cpo-audit, cro-audit, cco-audit, cfo-audit, chro-audit, rgpd-audit, safety-audit, retention-audit, matcher-audit, modes-audit, design-audit, a11y-perf-audit, ROADMAP-Q2-Q4-2026.md — tous datés 2026-05-07*

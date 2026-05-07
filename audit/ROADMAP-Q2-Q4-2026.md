# 🚀 CeSoir Roadmap Q2-Q4 2026 — Massive Improvement Wave

**Date :** 2026-05-07
**État actuel :** Master `1e3ad5b` · Wave 17 LIVE · 24 migrations Supabase pending push
**Audience :** Youssef (CEO/CTO solo) — décisions stratégiques + ordre d'exécution

---

## 🎯 Executive Summary

CeSoir a livré 50+ PRs et ~70 features depuis le lancement. Le code est mature, les fondations solides. **La prochaine bataille est la croissance + monétisation + différenciation**, pas l'ajout de features mineures.

**Top 3 Recommandations Stratégiques :**

1. **🔥 LANCER (Q2 mai-juin)** — Push migrations Supabase + 1ère acquisition (100-500 utilisateurs Montpellier beta) avant tout nouveau code. Le produit est prêt, il manque les utilisateurs.
2. **💰 MONÉTISER (Q2-Q3)** — Activer Stripe + Premium tier + 3 paywall placements stratégiques. Sans revenue ≠ sans user feedback de valeur.
3. **🌍 DIFFÉRENCIER (Q3-Q4)** — Doubler down sur "ce soir / IRL meetings" comme moat vs Tinder/Hinge/Bumble. Les features Wave 17 (QR check-in, vu ce soir, IRL confirm) sont uniques au marché — capitaliser.

**Anti-recommandation :** Ne PAS lancer une autre vague de 20 features avant d'avoir 500+ utilisateurs réels. Le code que tu as déjà génère plus de valeur que 20 features de plus.

---

## 📊 6 Thèmes Stratégiques

| # | Thème | Q | Effort | Impact | Status |
|---|---|---|---|---|---|
| 1 | **Launch & Acquisition** | Q2 | M | 🔥🔥🔥🔥🔥 | 0% |
| 2 | **Monétisation** | Q2-Q3 | L | 🔥🔥🔥🔥 | 30% (Stripe scaffold) |
| 3 | **Retention & Habitude** | Q3 | L | 🔥🔥🔥🔥 | 50% (gamification shipped) |
| 4 | **Trust & Safety** | Q2-Q3 | M | 🔥🔥🔥 | 40% (KYC + reports shipped) |
| 5 | **Performance & Scale** | Q3-Q4 | M | 🔥🔥 | 70% (bundle optim shipped) |
| 6 | **Expansion (cités, langues)** | Q4 | XL | 🔥🔥🔥 | 0% |

---

# 🌍 THÈME 1 — LAUNCH & ACQUISITION (Q2)

> **Diagnostic** : Le produit est prêt à 95%. Sans utilisateurs, chaque nouvelle feature est inutile. Priorité 1 = trouver les 100 premiers utilisateurs avant de coder quoi que ce soit d'autre.

## 1.1 — Push migrations Supabase (URGENT — bloquant)
**Effort:** 1h · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Cette semaine

24 migrations en code mais pas en DB. Wave 16 + 17 sont DORMANTES. Sans push :
- Crystal Ball, Vibes, Streaks, Voice messages, Moments, Passport, AI features → invisibles
- L'app fonctionne mais ressemble à une v1 alors que tu as une v3

**Action :** `supabase db push` + 7 env vars Vercel (VAPID keys, ANTHROPIC, CRON_SECRET) → 100% des features Wave 16+17 deviennent live.

## 1.2 — Beta privée 100 users Montpellier
**Effort:** S (post-push) · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Mai 2026

- **Recrutement** : 100 utilisateurs via codes invitations (déjà shippé)
- **Source** : Étudiants Montpellier (Polytech, fac, IDM), bars partenaires (Le Sancho, Le 25, Apothicaire)
- **Format** : Post Insta + flyers QR + stand 1 soir/semaine
- **Tracking** : analytics built-in (signup → activation → first match → first IRL)
- **KPI** : 30% activation (signup → match), 10% IRL meet rate

**Action :** Pas de code. Juste PRINT 100 flyers + posts Insta organique.

## 1.3 — Onboarding video 30s
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juin 2026

Le screen "tu y es en 90 secondes" est tenu, mais l'utilisateur ne sait pas quoi faire APRÈS signup. Une vidéo 30s "voici comment matcher ce soir" → +25% activation.

**Stack :** Kling/Higgsfield génération AI vidéo + Filmora montage. Tu as déjà 826 crédits Kling expirent 6 mai (alerte). Use them.

## 1.4 — Référence stratégique : "tonight" en EN
**Effort:** XS · **Impact:** 🔥🔥 · **Quand:** Juin

Réserver `tonite.app` ($15/an dispo) pour version anglo future. Capitaliser sur le mot-clé `tonight` dans l'App Store ASO quand tu lanceras EN.

## 1.5 — Partenariats venues Montpellier (5 bars)
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juin-Juillet

Approcher 5 bars/restos Montpellier :
- Code QR exclusif "CeSoir 5€ offerts"
- Stand promo 1 soir/semaine
- Échange : ils mentionnent CeSoir, tu les boostes dans /events

Boost loop : utilisateurs viennent au bar via CeSoir → bar happy → recommande l'app → croissance organique.

---

# 💰 THÈME 2 — MONÉTISATION (Q2-Q3)

> **Diagnostic** : Stripe est scaffolded (PR #42 ship) mais désactivé. Sans monétisation, pas de signal sur ce qui crée de la valeur. Activer même à 0 user oblige à designer le produit avec valeur perçue.

## 2.1 — Activer Stripe + plans CeSoir Premium
**Effort:** M · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Mai-Juin

3 tiers :
- **Free** (gratuit) : actuel, 4 modes, 1 broadcast/jour
- **Premium 4,99€/mois** : likes illimités, 5 broadcasts, voir qui a liké, super likes ×3, boost 1/sem
- **Lune ☾ Gold 12,99€/mois** : Premium + AI bio illimité + priorité matching + badge gold + 30 roses/mois

**Action :** Run `scripts/setup-stripe-products.ts` (déjà fait scaffold) en Stripe Test, valider checkout, flip live.

## 2.2 — Roses economy mature
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juin

Aujourd'hui : roses earnable via referral + premier match. Ajouter :
- Pack 10 roses 0,99€
- Pack 50 roses 3,99€
- Pack 200 roses 9,99€
- Spend cases : super likes (1🌹), boost 30min (10🌹), see who liked (5🌹/peek), unlock prompt extra (3🌹)

**Action :** Stripe checkout PaymentLink + webhooks + UI "Boutique" sur /profile.

## 2.3 — Paywall stratégique : "Voir qui m'a liké"
**Effort:** S · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juin

Hinge/Tinder revenue maker : afficher 1 like reçu en floutant + "Pour voir tous les X likes → Premium / 5🌹".

Conversion typique : 8-15% des actifs payent pour ça.

## 2.4 — Boosts payants
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juillet

"Sois en haut de la pile pendant 30 min — 10🌹 ou 1.99€."

Le user achète quand il est en mood / vendredi soir. Tinder revenue 30%+ vient des boosts.

## 2.5 — Plans premium pour venues (B2B)
**Effort:** L · **Impact:** 🔥🔥🔥 · **Quand:** Q4

Bars/clubs payent CeSoir pour :
- Apparaître en featured sur /events
- Dashboard analytics (qui RSVP, démographie)
- Push promotionnels ciblés

Modèle : 99€/mois par venue, 250 venues à 6 mois = 25k€ MRR.

---

# 🔁 THÈME 3 — RETENTION & HABITUDE (Q3)

> **Diagnostic** : Wave 17 a livré la gamification (badges, mastery, streaks). Il manque le RYTHME — pourquoi un user revient demain et après-demain ?

## 3.1 — Push notif strategy 2.0
**Effort:** M · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Juin

Après push migrations, activer 5 push types :
- **Match** (instant) — déjà shippé
- **Message** (instant) — déjà shippé
- **Last Call 19h45** (cron daily) — déjà shippé
- **Rappel rentre 24h** — "Tu n'as pas swipe depuis hier, X nouveaux profils"
- **Streak reminder 23h45** — "Garde ta streak ! +X jours d'affilée"

Mesures clés : opt-in rate >40%, click-through >12%.

## 3.2 — Quêtes journalières
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juillet

3 quêtes / jour :
- "Swipe 10 profils → +50 XP"
- "Engage 1 conversation → +30 XP"
- "Mets à jour ta dispo ce soir → +20 XP"

Renouvellement à minuit. Affichées sur /feed sticky.

## 3.3 — Rewind & Snooze
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juin

Bumble-style :
- **Rewind** : annuler dernier swipe (1/jour gratuit, 3🌹 supplémentaire)
- **Snooze** : pause profil 1-7 jours (sans casser streak)

## 3.4 — Réactiver les inactifs (Win-back)
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juillet

User inactif depuis 7+ jours :
- Email "X profils nouveaux dans ta zone"
- Push "Tu as 2 likes en attente"
- Notification "Ton premier événement gratuit Premium 24h"

Tooling : Resend pour email + push existant.

## 3.5 — Daily Spin Wheel
**Effort:** S · **Impact:** 🔥🔥 · **Quand:** Juillet

Une roue à faire tourner 1×/jour pour gagner :
- 1 super like, 5 roses, boost gratuit, badge éphémère, etc.

Vegas effect → +18% retention D7 typique.

## 3.6 — Achievements progression visible
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juin

Sur /feed, toujours afficher 1 quest active "Plus que X swipes pour Papillon Social". Progression bar visible. Reward toast au unlock.

---

# 🛡️ THÈME 4 — TRUST & SAFETY (Q2-Q3)

> **Diagnostic** : Dating app = magnet à abus. Bumble investit 30%+ engineering en safety. Tu as déjà fait du bon boulot (KYC, RGPD, block, report) mais il faut industrialiser.

## 4.1 — Vérification photo IA selfie
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juin

Aujourd'hui : badge "Vérifié" via 3 selfies poses. Améliorer avec :
- Onfido / Stripe Identity intégration ($1-2/scan)
- Ou face-api.js client-side (gratuit, déjà installé)
- Match liveness (clignement, sourire)

Filtre "Voir uniquement profils vérifiés" → lever de barre qualité.

## 4.2 — AI moderation messages chat
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juillet

Claude Haiku (déjà ANTHROPIC_API_KEY si activé Wave 16) classifie chaque message :
- Harcèlement, menaces, contenu sexuel non-sollicité, scam
- Auto-flag pour review humain
- Top abuser → ban auto si score > seuil

Coût : ~$0.001/message → $30/mois pour 30K messages.

## 4.3 — Anti-bot CAPTCHA progressive
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juin

Cloudflare Turnstile sur :
- Signup
- Login après 3 échecs
- Plus de 50 swipes/heure (= bot probable)

Free, invisible si user humain.

## 4.4 — Trust score visible
**Effort:** S · **Impact:** 🔥🔥🔥 · **Quand:** Juillet

Score 0-100 sur chaque profil basé sur :
- Vérification (+30)
- Bio + photos complets (+20)
- Karma transactions (+30)
- Anciennete + activité (+20)

Affiché en chip sur swipe card. Filtre "Trust >70".

## 4.5 — Modération scalable
**Effort:** L · **Impact:** 🔥🔥🔥 · **Quand:** Q4

Une fois >1k utilisateurs, tu auras besoin :
- Dashboard mod team (Retool / interne Next.js)
- Queue de signalements priorisés
- Actions one-click ban / shadowban / warn

Préparer le scaffold maintenant.

## 4.6 — Tableau de bord RGPD self-service
**Effort:** S · **Impact:** 🔥🔥 · **Quand:** Juillet

Settings → "Mes données" :
- Export JSON one-click
- Effacement 30j (déjà shippé en cascade)
- Accès portabilité, opposition

CNIL aime. SaaS B2B aussi.

---

# 🤖 THÈME 5 — AI & DIFFÉRENCIATION (Q3)

> **Diagnostic** : Le moat de CeSoir vs Tinder n'est pas l'algo (qui sera battu) mais les FEATURES IRL uniques. Doubler down dessus + AI dating coach.

## 5.1 — AI Dating Coach (chat assistant)
**Effort:** L · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Q3

Bouton "💬 Coach" sur /chat :
- "Comment je relance Marie qui n'a pas répondu depuis 2 jours ?"
- "Qu'est-ce que je dis sur ma 1ère soirée ?"
- "Comment refuser poliment un plan qui ne me dit rien ?"

Claude Sonnet, contexte = profil user + historique chat. Coût $0.005/conversation. Premium-only feature.

## 5.2 — AI photo analyzer
**Effort:** M · **Impact:** 🔥🔥🔥 · **Quand:** Juillet

Quand user upload photo :
- "Cette photo est trop sombre"
- "Ton visage n'est pas centré"
- "L'arrière-plan est encombré"
- Suggestion : "Profil Tinder/Hinge stats : photos avec sourire = +30% likes"

face-api.js + Claude vision pour analyse. Côté client gratuit.

## 5.3 — Compatibility AI explanations
**Effort:** S · **Impact:** 🔥🔥🔥🔥 · **Quand:** Juin

Aujourd'hui : compatibility score 87% (donut). Ajouter explication :
"Tu matches avec Sofia parce que :
- Vous activez tous les deux Solo Diner ce soir
- Elle est à 0.6km
- Vous avez 3 vibes en commun ce mois (Festif + Aventure + Calme)"

API : Claude Haiku, $0.0005/profile. Affiché au tap sur donut.

## 5.4 — Voice profile briefing
**Effort:** M · **Impact:** 🔥🔥 · **Quand:** Q4

Au lieu de lire bio → tu écoutes la voice intro 10s du peer (déjà shippé) + AI génère "Sofia, 25 ans, journaliste mode, fan de jazz et de cuisine asiatique. Tu cherches du sens, elle aussi."

Use case : multitasking, marche dans la rue, "voici qui est près de moi".

## 5.5 — AI Mood Detection (vibes auto)
**Effort:** S · **Impact:** 🔥🔥 · **Quand:** Q4

Au lieu que user pick manuellement vibe → AI infère via historique + heure + jour :
"Vendredi 18h, tu as activé Solo Diner 3 vendredis sur 4 → Vibe Festif suggérée"

Just-in-time intent prediction.

---

# 🌍 THÈME 6 — EXPANSION (Q4 2026 → 2027)

> **Diagnostic** : Single-city pour PMF. Mais design pour scaler dès maintenant.

## 6.1 — Ville #2 : Lyon ou Toulouse
**Effort:** M · **Impact:** 🔥🔥🔥🔥🔥 · **Quand:** Q4

Une fois Montpellier validé (1k users actifs) :
- Acquisition : flyers + Insta locale
- Tech : déjà ready (passports, geo, cities.ts)
- Coût : ~500€ marketing + 0 dev (multi-tenant déjà en place)

## 6.2 — Internationalisation (EN, ES)
**Effort:** L · **Impact:** 🔥🔥🔥🔥 · **Quand:** Q4

Use next-intl ou react-i18next :
- Extraire toutes les strings FR
- Traduire EN puis ES
- Détection auto langue navigateur
- Toggle settings

Effort : ~2 semaines pour EN, 1 semaine pour ES (DeepL pour le brut + revue native).

## 6.3 — App native (TWA Android + WrapperApple)
**Effort:** M · **Impact:** 🔥🔥🔥🔥 · **Quand:** Q4

PWA marche déjà mais App Store/Play Store = légitimité.

- **Android** : Trusted Web Activity → Bubblewrap → Play Store. ~4h. 1 fois.
- **iOS** : Capacitor wrap → App Store. Plus complexe (review Apple). ~1 semaine.

Coût : 99$ Apple + 25$ Google = 124$ one-time.

## 6.4 — White-label B2B
**Effort:** XL · **Impact:** 🔥🔥🔥 · **Quand:** 2027

Vendre l'infra à d'autres communautés :
- Dating apps niche (LGBT+, sénior, religieux)
- Apps "trouvez votre [X]" (sport, gaming, voyage)

Stack actuelle = solid foundation pour pivot SaaS.

---

# 🏆 TOP 10 QUICK WINS (< 1 SEMAINE)

| # | Feature | Effort | Impact | Q |
|---|---|---|---|---|
| 1 | Push migrations Supabase + env vars Vercel | 1h | 🔥🔥🔥🔥🔥 | Cette semaine |
| 2 | "Voir qui m'a liké" paywall | S | 🔥🔥🔥🔥 | Juin |
| 3 | Achievements progression visible /feed | S | 🔥🔥🔥 | Juin |
| 4 | Push notif rappel 24h inactivité | S | 🔥🔥🔥🔥 | Juin |
| 5 | AI Compatibility explanations | S | 🔥🔥🔥🔥 | Juin |
| 6 | Daily Spin Wheel | S | 🔥🔥 | Juillet |
| 7 | Reverse + Snooze | S | 🔥🔥🔥 | Juin |
| 8 | Anti-bot Cloudflare Turnstile | S | 🔥🔥🔥 | Juin |
| 9 | Onboarding video 30s (Kling) | S | 🔥🔥🔥 | Juin |
| 10 | Réserver tonite.app ($15) | XS | 🔥🔥 | Cette semaine |

---

# 🚀 TOP 5 TRANSFORMATIVE BETS (3-6 SEMAINES)

| # | Bet | Effort | Impact | Quand | Why |
|---|---|---|---|---|---|
| 1 | **AI Dating Coach** Premium | L (3 sem) | 🔥🔥🔥🔥🔥 | Q3 | Différenciateur unique, conversion Premium ×3 |
| 2 | **Stripe Live + Premium tier** | L (2 sem) | 🔥🔥🔥🔥🔥 | Mai | Sans revenue, pas de validation business |
| 3 | **Vérification photo IA selfie** | M (2 sem) | 🔥🔥🔥🔥 | Juin | Différenciateur trust, filtre "vérifiés only" |
| 4 | **Push Notif Strategy complète** | M (2 sem) | 🔥🔥🔥🔥🔥 | Juin | Habit-forming, retention D7 ×2 |
| 5 | **Ville #2 Lyon ou Toulouse** | M (3 sem) | 🔥🔥🔥🔥🔥 | Q4 | Validation scaling + acquisition multi-villes |

---

# 📅 ROADMAP RECOMMANDÉE PAR TRIMESTRE

## Q2 2026 (Mai-Juin) — LAUNCH

**Semaine 1 (10-17 mai)**
- ✅ Push 24 migrations Supabase
- ✅ Set 7 env vars Vercel
- ✅ Réserver `tonite.app` ($15)
- ✅ Activer Stripe Test
- ✅ 100 flyers imprimés Montpellier

**Semaine 2-4 (mai-juin)**
- ✅ Beta privée 100 users
- ✅ AI Compatibility explanations
- ✅ Onboarding video 30s
- ✅ Push notif strategy 2.0
- ✅ Verification IA selfie

**Semaine 5-8 (juin-juillet)**
- ✅ Stripe Live + Premium 4,99€
- ✅ Roses economy
- ✅ Paywall "Voir qui m'a liké"
- ✅ Quêtes journalières
- ✅ 5 partenariats venues

**KPIs Q2** : 500 utilisateurs, 50 premium (10%), 10 venues partenaires, 1k matchs, 100 IRL meets confirmés.

## Q3 2026 (Juillet-Sept) — DIFFERENTIATE

- AI Dating Coach
- AI Mood detection
- AI Photo analyzer
- Trust score visible
- AI moderation chat
- Quêtes + Rewind + Snooze
- Win-back inactifs

**KPIs Q3** : 2k users, 300 premium (15%), 50 venues partenaires, 5k matchs/mois.

## Q4 2026 (Oct-Déc) — EXPAND

- Ville #2 (Lyon)
- TWA Android Play Store
- iOS App Store
- B2B Plans for venues
- Modération scalable

**KPIs Q4** : 5k users multi-villes, 1k premium, 200 venues, 25k MRR.

## 2027 — INTERNATIONALIZE

- EN, ES versions
- Cities EU (Barcelone, Berlin)
- White-label B2B
- Series A (~3-5M€)

---

# ⚠️ ANTI-PATTERNS À ÉVITER

1. **Lancer une autre vague de 20 features avant 500 users** — le code génère 0 valeur sans utilisateurs
2. **Ajouter 4 modes supplémentaires** — Wave 15 a montré que 4 modes ciblés > 14 modes diluts
3. **Pivot vers app gaming/sociale** — reste dating, c'est ton marché identifié
4. **Custom domain `cesoir.app` (pris)** — pivot nom après 500+ users avec data réelle
5. **Engager un dev frontend payé** — solo + AI agents > équipe à ce stade

---

# 🎯 NEXT STEP IMMEDIATE

**Cette semaine** : Push migrations Supabase. Sans ça, tout le reste attend.

```bash
cd cesoir-app
supabase db push
# Then add env vars on Vercel:
# VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
# NEXT_PUBLIC_VAPID_PUBLIC_KEY, PUSH_INTERNAL_SECRET
# ANTHROPIC_API_KEY, CRON_SECRET
```

Après ça, tu décides : Beta launch (theme 1) ou Stripe activation (theme 2). Ma recommandation forte : **Beta launch first**. Tu as besoin de signal utilisateur réel, pas de revenue à 0 user.

---

**Total propositions :** 33 features détaillées · 6 thèmes · 3 trimestres · 1 next step bloquant.

Tu peux désormais piocher dans ce doc selon ton humeur / temps / budget.

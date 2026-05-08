# RGPD Audit — CeSoir Dating App
**Date :** 2026-05-07  
**Auditeur :** RGPD Officer (Claude Agent)  
**Scope :** Code src/ + 47 migrations Supabase  
**Infra :** Supabase EU (Frankfurt) + Vercel (Paris region probable)

---

## 1. Base légale par catégorie de données

| Donnée | Base légale actuelle | Conforme RGPD ? |
|---|---|---|
| Identité (nom, âge, email) | Contrat (art. 6.1.b) | OK |
| Gender + looking_for (orientation implicite) | Consentement déclaré signup | GAP — art. 9 = consentement EXPLICITE distinct |
| Photos (biométrie potentielle) | Consentement déclaré signup | GAP — consentement non granulaire |
| Géolocalisation précise | Consentement (page signup-quick step 2) | OK en principe, opt-in visible |
| Messages privés | Contrat (art. 6.1.b) | OK |
| Voice messages (mig 031) | Contrat (art. 6.1.b) | OK — bucket privé |
| Travel passport (mig 040) | Contrat (art. 6.1.b) | OK — user-initiated |
| UTM tracking (mig 023) | Intérêt légitime (attribution CAC) | GAP — pas de notice au moment du dépôt localStorage |
| Nightly vibes / moods (mig 039) | Consentement implicite | GAP — donnée comportementale sensible |
| Ghost penalties (mig 045) | Intérêt légitime (trust & safety) | Acceptable mais durée indéfinie = GAP |
| Push notifications (mig 029) | Consentement navigateur | OK — browser prompt |
| PostHog analytics | Intérêt légitime ou consentement | GAP — pas de banner cookie conforme TCF v2 |

**Problème P0 art. 9 :** `looking_for` (ex : "hommes", "femmes", "tous") révèle l'orientation sexuelle — catégorie spéciale art. 9. Le signup actuel l'intègre dans un formulaire standard sans case de consentement explicite et distinct. Cela constitue une violation directe de l'art. 9 RGPD.

---

## 2. DPIA

La page `/legal/dpia` existe et présente un résumé public. Un document `docs/legal/DPIA.md` est référencé mais son existence dans le repo n'est pas confirmée. La DPIA est obligatoire et doit être déposée auprès de la CNIL. Statut : document UI présent, document CNIL-grade à vérifier.

---

## 3. Privacy by Design — état réel

| Mesure | Migration | Statut |
|---|---|---|
| Bucket avatars privé | 028 | OK |
| Bucket voice-messages privé, 1 MB cap | 031 | OK |
| Bucket moments privé | 047 | OK |
| GPS grid-snap 500m (lat/lng exposés) | 024 | OK |
| Antilatération distance 1 km | 026 | OK |
| Blocklist bidirectionnel sur RLS | 024 | OK |
| Travel passport city-level seulement | 040 | OK |
| Signed URLs systématiques (pas public URL) | 028/031/047 | OK |
| Logger redacte email/token/password | logger.ts | OK |
| Sentry redacte email + cookies | sentry.server.config.ts | OK |
| PostHog autocapture = false | analytics.ts | OK |

---

## 4. Data Retention — gaps

- **Ghost penalties** (mig 045) : jamais supprimées ("we never DELETE for the audit trail"). Une trace comportementale permanente sans durée maximale est contraire à l'art. 5.1.e (limitation de conservation). Purge recommandée à 24 mois après `applied_at`.
- **Messages / conversations** : aucune politique de purge automatique trouvée dans les migrations ni dans les crons. Les messages d'un match expiré doivent être purgés (délai recommandé : 6 mois post-expiration).
- **UTM data sur profiles** : `first_visit_at`, `utm_source`, etc. persistent sans limite. Anonymisation ou purge à prévoir à 36 mois.
- **Moments** : expiration 24h en lecture via `expires_at > now()`, mais le commentaire mig 047 indique que les rows stales ne sont jamais DELETE — seulement filtrées. Un cron de hard-delete manque.
- **Inactive accounts** : aucune routine de purge après 24 mois d'inactivité (exigence standard CNIL dating apps).

---

## 5. Droit à l'effacement (Art. 17)

`POST /api/account/delete` est implémenté et couvre :
- 35 tables en cascade explicite (ordre messages → conversations → profil → auth.users)
- Suppression des fichiers Storage (avatars folder)
- Audit log `deleted_users_audit` (best-effort)
- Sign-out de session

**GAPs restants :**
- Voice clips (`voice-messages` bucket) : la cascade `bestEffortDelete` ne supprime pas les fichiers Storage — uniquement les rows `messages`. Les fichiers audio restent dans le bucket après delete compte. GAP Art. 17.
- Moments bucket : même problème — les fichiers `.webp` ne sont pas supprimés par la cascade. La row `moments` est effacée via `ON DELETE CASCADE` sur `auth.users`, mais le fichier Storage reste.
- `SUPABASE_SERVICE_ROLE_KEY` manquante en production = orphan `auth.users`. Le code le documente (`orphanWarning`) mais un compte auth orphelin est une violation Art. 17.

---

## 6. Droit à la portabilité (Art. 20)

**Absent.** Aucun endpoint `/api/account/export` trouvé. Seul le dossier `api/account/` contient `delete/`. L'export ZIP/JSON est requis par l'Art. 20 pour les données soumises à consentement ou contrat. C'est un **GAP P0** pour une app dating avec données de catégorie spéciale.

---

## 7. Conformité CNIL dating-specific

**Mineurs :** Le champ `age` a `min={18}` dans le formulaire côté client (register/page.tsx ligne 393), mais aucune validation serveur de l'âge n'est trouvée dans `src/app/api/auth/signup/route.ts`. Un attaquant peut poster `age: 14` directement via l'API. GAP P0.

**Modération photos :** `/api/moderate-photo` existe. Implémentation non lue en détail — à vérifier qu'elle est appelée systématiquement à l'upload et pas uniquement on-demand.

**Géoloc opt-in :** Visible dans le flow signup-quick step 2. OK en principe.

**Sextorsion / CSAM :** `/api/moderate-message` existe. Couverture à auditer.

---

## 8. Cookies & Tracking

- **PostHog** est initialisé sans banner de consentement préalable (`persistence: "localStorage+cookie"` dans analytics.ts). Les cookies analytics sont déposés avant consentement explicite. Violation ePrivacy + TCF v2.
- **UTM localStorage** : `captureFirstVisit()` écrit dans localStorage au premier chargement sans consentement. Non-bloquant ePrivacy (localStorage n'est pas un cookie au sens strict), mais contestable selon la CNIL.
- **Sentry** : traceur d'erreur, base légitime acceptable (intérêt légitime sécurité), mais doit être mentionné dans la privacy policy.
- Pas de Google Analytics, pas de Mixpanel, pas de Meta Pixel détectés. La surface tracking est faible.
- **Absence de banner cookie conforme TCF v2.** La page privacy indique "uniquement des cookies techniques nécessaires" — si PostHog dépose un cookie avant consentement, cette mention est fausse.

---

## 9. Top 10 Risques RGPD P0/P1

| # | Risque | Priorité | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Art. 9 : `looking_for` = orientation sexuelle sans consentement explicite distinct | P0 | Violation directe, amende possible | Ajouter checkbox séparée "Je consens au traitement de mes préférences de rencontre, données sensibles art. 9" au signup |
| 2 | Art. 20 : pas d'export portable des données | P0 | Droit non respecté | Créer `POST /api/account/export` → ZIP JSON (profil, messages, interactions) |
| 3 | Art. 17 : fichiers Storage (voice + moments) non supprimés à delete compte | P0 | Fuite post-suppression | Ajouter boucle Storage cleanup dans `/api/account/delete` pour buckets `voice-messages` et `moments` |
| 4 | Validation age côté serveur absente | P0 | Mineurs potentiels sur plateforme, obligation légale | Ajouter `if (age < 18) return 400` dans signup route |
| 5 | PostHog cookie déposé avant consentement | P1 | Violation ePrivacy / CNIL | Conditionner `initAnalytics()` à un consentement cookie stocké; ajouter banner conforme |
| 6 | Ghost penalties sans durée maximale de conservation | P1 | Art. 5.1.e violation | Cron mensuel DELETE WHERE `applied_at < now() - interval '24 months'` |
| 7 | Absence de purge des messages après expiration match | P1 | Art. 5.1.e violation | Cron 6 mois post-expiration pour conversations inactives |
| 8 | Aucune purge des comptes inactifs 24 mois | P1 | CNIL dating standard | Cron notification J-30 + delete J0 si aucune connexion 24 mois |
| 9 | `SUPABASE_SERVICE_ROLE_KEY` manquante = auth.users orphelin possible | P1 | Art. 17 non respecté | Vérifier présence clé en env production ; alerter si absente au démarrage |
| 10 | Sentry / PostHog non listés explicitement dans privacy policy | P2 | Obligation de transparence | Mettre à jour `/privacy` avec liste sous-traitants |

---

## 10. DPO

Avec des données d'orientation sexuelle (art. 9) collectées à grande échelle sur une app dating, la désignation d'un DPO est obligatoire (art. 37.1.c RGPD). Un DPO externe mutualisé coûte 3 000–8 000 EUR/an. Il doit être notifié à la CNIL via le registre des DPO.

---

## Synthèse — Actions prioritaires

**Avant tout lancement public :**
1. Checkbox consentement explicite art. 9 au signup
2. Validation serveur `age >= 18` dans `/api/auth/signup/route.ts`
3. Endpoint `/api/account/export`
4. Suppression fichiers Storage (voice + moments) dans `/api/account/delete`
5. Banner cookie conforme + `initAnalytics()` conditionnel

**Dans les 3 mois :**
6. Crons de retention (ghost_penalties, messages, comptes inactifs)
7. Désignation DPO externe
8. DPIA formelle déposée CNIL
9. Vérification systématique `SERVICE_ROLE_KEY` en prod
10. Mise à jour privacy policy avec sous-traitants (PostHog EU, Sentry, Supabase, Vercel, Stripe)

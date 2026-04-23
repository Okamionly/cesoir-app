# DPO Externe Fractional — Dating & Social Apps

> *CeSoir est une dating app traitant des données sensibles (orientation sexuelle, géolocalisation en temps réel, préférences relationnelles). La CNIL ne rigole pas. On cherche un DPO fractional sérieux.*

---

## TL;DR

- **Role** : Délégué à la Protection des Données (DPO) externe fractional
- **Cadence** : ~2 jours/mois (équivalent 16h/mois)
- **Budget** : 400 – 600 € / mois (~400€ cible)
- **Profil** : DPO certifié CNIL avec **expérience dating ou social apps obligatoire**
- **Contrat** : prestation de service, engagement annuel renouvelable
- **Où** : remote France, 1 call mensuel obligatoire

---

## Contexte

### Pourquoi un DPO ?

- **Obligation légale** : CeSoir traite à grande échelle des données sensibles (orientation sexuelle, comportement relationnel, géolocalisation fine) → DPO **obligatoire** dès premier user en prod selon l'article 37 RGPD.
- **Risque** : amendes CNIL jusqu'à 4% du CA mondial en cas de manquement. Pour une dating app, le risque est réel (cf. amendes Grindr, Clearview).
- **Confiance users** : 70% des utilisatrices dating rapportent la sécurité des données comme critère #1.

### État actuel (2026-04-23)

- ❌ Aucun DPO désigné.
- ❌ Aucun DPIA (Data Protection Impact Assessment) réalisé.
- ❌ Aucun registre des activités de traitement (RAT).
- ❌ Aucune procédure d'incident de sécurité documentée.
- ⚠️ Privacy policy existante mais datée, à réauditer.
- ✅ RLS Supabase en place sur la plupart des tables (mais pas audité).

**Conclusion** : on est en non-conformité. On doit corriger vite.

---

## Qui on cherche

### Profil idéal

- **DPO certifié** (CNIL ou AFCDP ou équivalent reconnu).
- **5+ ans** d'expérience en protection des données.
- **Expérience dating / social apps obligatoire** : tu as déjà été DPO pour une app qui traite orientation sexuelle, géolocalisation temps réel, chat messages.
  - Exemples de boîtes : Happn, Fruitz (ex), Meetic, Tinder FR, AdopteUnMec, Once, Bumble FR, Discord FR ops.
- **Connaissance CNIL approfondie** : tu as déjà interagi avec la CNIL (questions, audits, notifications), pas juste lu la doc.

### Hard skills

- **RGPD maîtrisé** : tu connais les 99 articles par cœur (ou presque).
- **RAT** : tu sais structurer un registre des activités de traitement.
- **DPIA** : tu sais conduire une analyse d'impact (méthodologie CNIL).
- **Notification incident** : tu as déjà rédigé une notification CNIL sous 72h.
- **Data minimization** : tu sais challenger les devs "pourquoi tu collectes ça ?".
- **Technique** : tu comprends Supabase/PostgreSQL/RLS suffisamment pour auditer les flows.

### Soft skills

- **Pédagogue** : tu expliques le RGPD à des devs sans les saouler. Tu formes l'équipe.
- **Pragmatique** : tu cherches des solutions, pas des interdictions.
- **Disponible** : en cas d'incident de sécurité, tu réponds en <4h (jour ouvré).
- **Indépendance** : tu peux dire au founder qu'il a tort sans craindre de perdre le contrat.

### Bonus

- **Certifications tech** : ISO 27001, ISO 27701.
- **Expérience PWA / apps mobiles** (CeSoir est PWA).
- **Expérience international** : on vise l'Europe à Y2, donc intérêt si tu connais CCPA (Californie), UK GDPR, LGPD (Brésil).

---

## Missions (année 1)

### Trimestre 1 — Setup conformité (~6 jours)

- **RAT complet** : registre des activités de traitement pour les 24 tables Supabase + processes (inscription, matching, chat, paiement, modération).
- **DPIA complète** : analyse d'impact sur les 5 traitements à haut risque (profils dating, géoloc, messages, signalements, paiements).
- **Privacy policy refondue** : claire, lisible, en français, conforme CNIL 2026.
- **Conditions d'utilisation refondues** : en cohérence avec privacy policy.
- **Bandeau cookies** : audit + mise en conformité (préférer solution simple à Usercentrics usine à gaz).
- **Désignation officielle CNIL** : déclaration + publication coordonnées DPO sur site.

### Trimestre 2 — Process & formation (~4 jours)

- **Procédure incident de sécurité** : runbook + template notification CNIL + procédure communication users.
- **Procédure requêtes users** : accès, rectification, suppression, portabilité → traitement sous 30 jours.
- **Formation équipe** : 2 sessions de 2h (1 initiale, 1 refresher). Tout le monde présent.
- **Audit sous-traitants** : liste des sous-traitants (Supabase, Vercel, Sentry, Stripe, Resend) + vérification contrats DPA.
- **Audit stockage** : durées de conservation, anonymisation, suppression.

### Trimestre 3 — Audit & ajustement (~3 jours)

- **Pentesting data** : revue technique des flows avec tech lead. Cible : fuites potentielles.
- **Audit modération** : traitement des signalements, respect du contradictoire, sanctions.
- **Audit communications** : emails, push, SMS → base légale identifiée pour chaque.

### Trimestre 4 — Scale & prépa Y2 (~3 jours)

- **Prépa ouverture Lyon/Paris** : adjustments RAT si besoin.
- **Vérif conformité CCPA** si users US (bloqué par défaut pour l'instant).
- **Audit annuel** : rapport synthèse pour founder + board (quand board existe).

---

## Missions continues (chaque mois)

- **Call mensuel** (1h) : review roadmap, questions de l'équipe, points d'attention.
- **Veille réglementaire** : si changement RGPD / CNIL / UE IA Act impacte CeSoir → alerte + plan d'action.
- **Réponse questions** : email/Slack, réponse sous 2 jours ouvrés.
- **Gestion requêtes users RGPD** : review + validation des réponses par l'équipe.

---

## Compensation

- **Forfait mensuel** : 400 – 600 € HT selon XP et taille des chantiers.
- **Passage ponctuel à 800€ HT/mois** en cas de :
  - Audit CNIL en cours (on paye l'accompagnement).
  - Incident de sécurité majeur (on paye le temps supplémentaire).
  - Lancement d'un nouveau feature à risque élevé (ex: IA de matching).
- **BSPCE** : pas par défaut. Discuté si engagement long terme >12 mois (voir BSPCE_POOL.md — typique 0.1-0.25%).

---

## Ce qu'on ne te propose pas

- ❌ Salariat (DPO externe = indépendance exigée par RGPD, incompatible avec salariat chez CeSoir).
- ❌ Prise de décision produit (tu conseilles, on décide).
- ❌ Conseil juridique autre que RGPD (on a un avocat startup séparé).

---

## Processus d'entretien

### Étape 1 — Call découverte (30 min)

- Présentation CeSoir (10 min)
- Ton parcours DPO + dating/social apps (10 min)
- Tes attentes, tarif, dispo (10 min)

### Étape 2 — Mini audit de cadrage (2h rémunéré 200€)

Sur la base d'un accès read-only à notre Notion produit + privacy policy actuelle :
- Tu identifies les 5 risques prioritaires.
- Tu proposes un plan d'action 90 jours.
- Tu chiffres ton engagement pour la première année.

### Étape 3 — Vérification références (1 semaine)

On appelle 2-3 références (anciennes boîtes où t'as été DPO).

### Étape 4 — Décision (48h)

Si OK → contrat signé, démarrage immédiat (on est en non-conformité, chaque semaine compte).

**Timeline totale** : ~2 semaines.

---

## Où on poste ce JD

- **Directory CNIL** : liste officielle des DPO disponibles.
- **AFCDP** : Association Française des Correspondants à la Protection des Données (forum + job board).
- **LinkedIn** : post + groupes "DPO France", "RGPD Pratique".
- **Dating / social alumni** : référrals Happn, Meetic, Fruitz, etc.
- **Bureau avocat startup** : demander recommandations (Bruzzo Dubucq, Stéphane Baller).

---

## Légal

- Contrat de prestation de service (pas salariat — incompatible avec indépendance DPO).
- Engagement **minimum 12 mois** pour assurer continuité.
- **Clause de confidentialité** : NDA + charte d'indépendance DPO signée.
- **Responsabilité** : DPO est conseil, la responsabilité finale conformité reste au responsable de traitement (CeSoir).
- **Assurance RC Pro** : le DPO doit en avoir une (on vérifie avant contrat).

---

## Contact

Envoyer : CV + **certificat DPO** + **liste des 3 dernières missions DPO** (confidentiel OK, juste secteur + durée).

À : **contact@cesoir.app** avec sujet `[DPO] Prénom Nom`

*Date du JD : 2026-04-23. Valable jusqu'à pourvu — priorité HAUTE.*

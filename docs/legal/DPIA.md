# Analyse d'Impact Relative a la Protection des Donnees (DPIA / PIA)

**Application** : CeSoir
**Version du document** : 1.0
**Date** : 2026-04-23
**Responsable du traitement** : CeSoir SAS (a immatriculer)
**Delegue a la Protection des Donnees** : a designer
**Base methodologique** : CNIL PIA + EDPB Guidelines 01/2022

> **Avertissement** : Ce document est un template base sur la methode CNIL PIA.
> Il doit etre valide par un DPO officiel avant mise en production. Les champs
> "a definir" doivent etre completes lors de l'incorporation de la societe.

---

## Section 1 — Finalites du traitement

### 1.1 Description generale

CeSoir est une application de rencontres et de mise en relation sociale
localisee. Les utilisateurs creent un profil, activent des modes (date,
soiree, amitie, voyage...), decouvrent d'autres utilisateurs a proximite,
echangent des messages et se rencontrent en personne.

### 1.2 Finalites detaillees

| # | Finalite | Donnees traitees | Finalite technique |
|---|---|---|---|
| F1 | Creation et gestion du compte | Email, mot de passe (hache), prenom, age, genre | Authentification, identification unique |
| F2 | Matching et decouverte | Geolocalisation (ville + coordonnees), photos, bio, preferences | Afficher profils compatibles a proximite |
| F3 | Messagerie | Contenu des messages, horodatage, accuses de lecture | Permettre la conversation |
| F4 | Safety (SOS, check-in) | Contacts de confiance (nom + telephone), position GPS lors d'un SOS | Alerter en cas de probleme |
| F5 | Moderation et trust | Signalements, blocs, historique des strikes | Proteger la communaute |
| F6 | Analytics pseudonymisees | User agent, route visitee, temps passe (sans PII brute) | Ameliorer l'experience produit |
| F7 | Paiement (Premium) | Token Stripe, statut abonnement | Facturer les fonctionnalites payantes |
| F8 | Notifications | Email verifie, opt-in mobile push | Communiquer evenements importants |

---

## Section 2 — Bases legales (RGPD Art. 6)

| Finalite | Base legale RGPD | Justification |
|---|---|---|
| F1 Compte | **Art. 6.1.b** (contrat) | Necessaire a l'execution du service choisi par l'utilisateur |
| F2 Matching avec geolocalisation | **Art. 6.1.a** (consentement explicite) | Opt-in clair au moment de l'activation de la geolocalisation. Revocable a tout moment dans les parametres |
| F2 Photos | **Art. 6.1.a** (consentement) | Upload volontaire, modifiable/supprimable par l'utilisateur |
| F3 Messagerie | **Art. 6.1.b** (contrat) | Au coeur du service |
| F4 Safety SOS | **Art. 6.1.a** (consentement explicite) | Opt-in separe, l'utilisateur ajoute volontairement des contacts |
| F5 Moderation | **Art. 6.1.f** (interet legitime) | Protection des utilisateurs et conformite legale (LCEN, DSA). Interet mis en balance et documente ci-dessous |
| F6 Analytics | **Art. 6.1.f** (interet legitime) | Donnees pseudonymisees, opt-out disponible |
| F7 Paiement | **Art. 6.1.b** (contrat) | Execution du contrat Premium |
| F8 Emails transactionnels | **Art. 6.1.b** (contrat) | Confirmation de compte, alertes safety |
| F8 Emails marketing | **Art. 6.1.a** (consentement) | Opt-in separe, double opt-in obligatoire |

### 2.1 Test de l'interet legitime (F5 Moderation, F6 Analytics)

**F5 Moderation** :
- Interet poursuivi : protection de la communaute contre harcelement, arnaques, contenu illegal
- Necessite : sans moderation, l'app serait inutilisable et illegale (LCEN Art. 6, DSA)
- Mise en balance : les droits des utilisateurs sont preserves (possibilite de contester un signalement, transparence des regles)
- **Conclusion** : interet legitime valable

**F6 Analytics** :
- Interet : ameliorer le produit
- Necessite : absolue pour produit data-driven
- Mise en balance : aucune donnee personnelle brute, opt-out disponible, pas de profilage decisionnel
- **Conclusion** : interet legitime valable

---

## Section 3 — Categories de donnees sensibles (RGPD Art. 9)

CeSoir traite potentiellement les donnees sensibles suivantes :

| Donnee | Art. 9 RGPD | Collecte | Base legale |
|---|---|---|---|
| **Orientation sexuelle** (looking_for: hommes/femmes/tous) | Oui (al. 9.1) | Optionnelle — defaut "tous" | **Art. 9.2.a** : consentement explicite. Case a cocher dediee non pre-cochee |
| Photos contenant traits ethniques | Art. 9 possible | Via avatar | Consentement Art. 9.2.a |
| Donnees de sante (regime alimentaire en Mode Solo-Diner) | Non | N/A | N/A |

**Mesure** :
- L'orientation sexuelle n'est JAMAIS exposee publiquement sans consentement
  supplementaire (ex: mode "LGBTQ+ only" active manuellement)
- Les utilisateurs peuvent modifier ou effacer ce champ a tout moment

---

## Section 4 — Duree de conservation

| Donnee | Duree | Justification |
|---|---|---|
| Compte actif | Duree d'usage | Activite utilisateur |
| Compte inactif | **3 ans apres derniere connexion**, puis suppression | Limitation CNIL pour services de rencontres |
| Messages | 2 ans apres derniere activite du thread, puis anonymisation | Preuve + limitation |
| Signalements | 3 ans apres cloture | Recurrence analyses, litiges |
| Logs techniques (Sentry, logs serveur) | 12 mois | Debugging + forensics |
| Donnees de paiement (Stripe) | 10 ans (obligation comptable) | Code de commerce |
| SOS events | 12 mois | Forensics safety, puis anonymisation |
| Moderation queue (resolus) | 2 ans | Jurisprudence interne |
| Cookies analytics | 13 mois maximum | Recommandation CNIL |

---

## Section 5 — Droits des utilisateurs

CeSoir met en oeuvre les droits suivants (self-service sauf mention contraire) :

| Droit RGPD | Implementation | Delai |
|---|---|---|
| **Acces** (Art. 15) | Export ZIP auto depuis `/profile/privacy` | Immediat |
| **Rectification** (Art. 16) | Edition profil depuis `/profile/edit` | Immediat |
| **Effacement** (Art. 17) | Bouton "Supprimer mon compte" depuis `/profile/delete` | Immediat (soft delete 30j puis purge) |
| **Limitation** (Art. 18) | Desactivation temporaire | Immediat |
| **Portabilite** (Art. 20) | Export JSON machine-readable | Immediat |
| **Opposition** (Art. 21) | Contact DPO via `privacy@cesoir.app` | 30 jours max |
| **Refus automatises** (Art. 22) | Aucune decision entierement automatisee ; revue humaine pour bans | N/A |

---

## Section 6 — Mesures de securite

### 6.1 Techniques

| Mesure | Implementation |
|---|---|
| **Chiffrement en transit** | TLS 1.3 (Vercel + Supabase) |
| **Chiffrement au repos** | AES-256 (PostgreSQL + Supabase Storage) |
| **Mots de passe** | Hash Argon2 (Supabase Auth par defaut) + bcrypt legacy |
| **RLS Supabase** | Row-Level Security active sur TOUTES les tables sensibles (profiles, messages, reports, etc.) |
| **Rate limiting** | Upstash Redis sur auth + endpoints critiques |
| **MFA** | Disponible optionnel pour l'utilisateur |
| **Audit logs** | Sentry (PII-scrubbed) + Supabase logs |
| **Sentry PII scrubbing** | `beforeSend` + `maskText` sur user data |
| **Dependency scanning** | `npm audit` en CI |

### 6.2 Organisationnelles

- Acces developpeur : minimum necessaire, revoque a la sortie
- Formation RGPD annuelle pour toute l'equipe
- Procedure de notification de violation CNIL dans les 72h
- Contrats DPA avec tous les sous-traitants (Supabase, Vercel, Stripe, OpenAI, Sentry, Resend, Upstash)

### 6.3 Trust & Safety specifique

- **NSFW.js** client-side : blocage automatique photos pornographiques
- **OpenAI Moderation** server-side : detection harcelement / menaces dans messages
- **Trigger auto-hide** : 3 signalements en 48h → profil cache automatiquement
- **SOS + check-in** : procedure documentee, alertes SMS aux contacts de confiance
- **Moderation queue** : revue humaine sous 24h pour les cas ambigus

---

## Section 7 — Transferts hors UE

| Sous-traitant | Localisation | Garantie |
|---|---|---|
| **Supabase** | Region EU (Paris / Frankfurt) | UE — pas de transfert |
| **Vercel** | Region EU (Frankfurt fra1) | UE — pas de transfert |
| **Stripe** | Ireland (billing EU) | UE — pas de transfert |
| **Upstash Redis** | EU region | UE — pas de transfert |
| **OpenAI** (Moderation API) | USA | **Clauses Contractuelles Types (SCC) 2021** + Data Processing Addendum OpenAI |
| **Sightengine** (optionnel) | France | UE — pas de transfert |
| **Resend** (emails) | USA | SCC + DPA |
| **Sentry** | Region EU disponible (self-hosted possible) | UE si configure |

**Mesures supplementaires pour les transferts USA** :
- Pseudonymisation des donnees avant envoi quand possible
- Pour OpenAI Moderation : pas de donnees identifiantes envoyees, uniquement le texte du message
- Aucun modele OpenAI n'est entraine sur nos donnees (opt-out par defaut via l'API)

---

## Section 8 — Registre des activites de traitement (RAT — Art. 30)

### Fiche n° 1 — Gestion des comptes utilisateurs

| Champ | Valeur |
|---|---|
| Finalite | Authentification et identification |
| Categories de personnes | Utilisateurs inscrits (adultes >=18 ans) |
| Categories de donnees | Email, hash mot de passe, prenom, age, genre, avatar |
| Destinataires | Supabase (hebergement), Vercel (execution) |
| Transferts hors UE | Non |
| Duree | 3 ans apres inactivite |
| Mesures de securite | TLS 1.3, RLS, Argon2, MFA optionnel |

### Fiche n° 2 — Matching et geolocalisation

| Champ | Valeur |
|---|---|
| Finalite | Mise en relation d'utilisateurs |
| Categories de donnees | Coordonnees GPS, ville, preferences, photos, bio |
| Base legale | Consentement Art. 6.1.a |
| Destinataires | Autres utilisateurs (profil visible) |
| Duree | Duree du compte |
| Securite | Floutage <1km pour non-matches, RLS strict |

### Fiche n° 3 — Moderation et trust & safety

| Champ | Valeur |
|---|---|
| Finalite | Proteger la communaute |
| Categories de donnees | Signalements, blocs, scores NSFW, logs moderation |
| Base legale | Interet legitime Art. 6.1.f |
| Destinataires | Equipe CeSoir (moderation), OpenAI (API Moderation), Sightengine si configure |
| Transferts | OpenAI USA (SCC) |
| Duree | 3 ans signalements |
| Securite | Pseudonymisation envois OpenAI, service_role only sur moderation_queue |

### Fiche n° 4 — Safety SOS & check-in

| Champ | Valeur |
|---|---|
| Finalite | Protection physique des utilisateurs |
| Categories de donnees | Coordonnees GPS ponctuelles, contacts de confiance (nom + tel) |
| Base legale | Consentement explicite Art. 6.1.a |
| Destinataires | Contacts de confiance (SMS via Twilio/provider) |
| Duree | Logs 12 mois puis anonymisation |
| Securite | RLS + chiffrement |

### Fiche n° 5 — Paiement Premium

| Champ | Valeur |
|---|---|
| Finalite | Facturation abonnements |
| Categories de donnees | Token Stripe, statut abonnement |
| Base legale | Execution du contrat Art. 6.1.b |
| Destinataires | Stripe (processeur) |
| Duree | 10 ans (obligation comptable) |
| Securite | Pas de donnees carte stockees cote CeSoir (Stripe Elements / Checkout) |

---

## Section 9 — Risques residuels identifies

| Risque | Niveau | Mesures |
|---|---|---|
| Fuite de donnees localisation | Moyen | Floutage <1km + RLS + logs acces |
| Harcelement via messagerie | Moyen | OpenAI Moderation + keyword screen + auto-hide 3 reports |
| Catfishing / usurpation | Moyen | Verification selfie + photo moderation |
| Breach Supabase | Faible | Chiffrement + auth dedie + DPA |
| Collecte excessive de donnees | Faible | Principe de minimisation applique |

---

## Section 10 — Plan d'action

- [ ] Designer le DPO officiel apres incorporation
- [ ] Inscrire sur registre CNIL (si traitements >5000 personnes apres lancement)
- [ ] Audit RSSI annuel
- [ ] Re-evaluation DPIA tous les 12 mois ou a chaque evolution majeure
- [ ] Tests d'intrusion (pentest) annuels
- [ ] Revue des sous-traitants et DPA

---

## Contact

**DPO provisoire** : privacy@cesoir.app
**Questions RGPD utilisateurs** : privacy@cesoir.app
**Notification breach** : cnil.fr/plaintes (72h max)

**Document valide par** : _________________________ (DPO a designer)
**Date** : 2026-04-23

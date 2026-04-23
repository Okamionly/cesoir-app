# DPO externe fractional — Job Description

> Wave 15 · CFO 10/10 · 2026-04-23
> Poste : **Délégué à la Protection des Données fractional**.
> Type : prestataire indépendant (freelance). Durée : 12 mois renouvelable.
> Volume : 2 jours / semaine moyen (± selon pic de signalements).
> Budget cible : **400–500 € / mois** (early stage), 700 € / mois post-seed.

---

## Contexte CeSoir

CeSoir est une app de rencontre B2C lancée à Montpellier en 2026, gratuite
user-side, monétisée côté venues (soirées / bars / clubs). Stack : Next.js 16 +
Supabase + Vercel, hébergement dans l'UE (Supabase Ireland + Vercel edge).
Nous traitons des données particulièrement sensibles :
- **Orientation sexuelle / genre** (option profil)
- **Photos de visage** (gallery profil)
- **Géolocalisation** (matching par proximité)
- **Messagerie instantanée** chiffrée côté transport
- **Données de mineurs** : strictement interdit (18+ only) — mais contrôle à assurer

---

## Mission principale

Vous êtes le point de contact unique CNIL + utilisateurs sur la protection des
données. Vous accompagnez le fondateur (et plus tard l'équipe) pour rester
conforme RGPD sans ralentir le produit.

---

## Responsabilités

### 1. Cartographie & documentation (40 % du temps)

- Maintenir le **Registre des Activités de Traitement (RAT)** à jour à chaque
  nouvelle feature touchant aux données perso.
- Rédiger et maintenir la **politique de confidentialité** et les **CGU**
  en collaboration avec l'avocat NTIC externe.
- Piloter les **DPIA** (analyses d'impact) pour chaque nouveau traitement
  à risque élevé via `pia.cnil.fr`.
- Documenter les **bases légales** et les **durées de conservation**.

### 2. Interface CNIL & autorités (20 %)

- Répondre aux éventuelles sollicitations CNIL.
- Piloter la notification d'une **violation de données** (breach) ≤ 72h.
- Coordonner avec Pharos / procureur en cas de contenu illicite remonté.

### 3. Droits des utilisateurs (20 %)

- Traiter les **demandes d'exercice de droits** (accès, rectification,
  suppression, opposition, portabilité) dans le délai légal (1 mois).
- Maintenir le **template de réponse** et le process d'escalade.
- Tenir à jour le **registre des demandes** reçues.

### 4. Formation & audits (10 %)

- Former l'équipe (fondateur + futurs devs) aux réflexes RGPD (1 h / mois).
- Auditer trimestriellement les sous-traitants (Supabase, Vercel, Stripe, Resend, Sentry, PostHog) : DPA à jour, transferts UE, logs d'accès.

### 5. Veille juridique (10 %)

- Suivre la jurisprudence CNIL + Cour de cassation + CJUE sur le secteur dating.
- Alerter sur les évolutions (DMA, DSA, AI Act si pertinents).

---

## Compétences requises

- **Certification DPO** : CNIL-référencé, ou AFNOR, ou Bureau Veritas (non
  obligatoire légalement mais recommandé).
- **Formation juridique** : master droit du numérique / IP ou DJCE, ou
  expérience prouvée 3+ ans sur postes DPO.
- **Expérience dating / social / e-commerce B2C** fortement souhaitée (réflexes
  modération + mineurs + données sensibles).
- **Confort tech** : lire un schema SQL, comprendre un JWT, raisonner sur
  Supabase RLS. Pas besoin de coder.
- **Langues** : français natif + anglais professionnel (DPA avec sous-traitants US).

---

## Modalités

- **Type de contrat** : lettre de mission (freelance), facturation mensuelle.
- **Lieu** : 100 % remote, check-in hebdomadaire visio de 30 min.
- **Engagement** : 12 mois avec renouvellement tacite.
- **Rémunération** : **400 € / mois** (démarrage) jusqu'à 1k users, puis 500 € / mois jusqu'à 10k users, puis **révision à 700–900 € / mois** selon volume.
- **Onboarding** : 2 jours offerts (sans facturation) pour prise en main du RAT existant + backlog conformité.
- **Clause KPI** : réponse < 48h sur demande user, < 24h sur incident sécurité.

---

## Canaux de recrutement

### Plateformes spécialisées

- **`data-privacy-freelance.fr`** — plateforme DPO fractional, 150+ profils FR.
- **`malt.fr`** — rechercher "DPO freelance", filtrer Île-de-France + Occitanie
  pour proximité Montpellier.
- **`linkedin.com`** — groupe "DPO France Association" (2 500 membres).
- **`aipd.cnil.fr`** / annuaire DPO CNIL.
- **`comundi.fr`** ou **`devoteam.com`** pour DPO externalisé structure.

### Réseaux sectoriels

- **AFCDP** — Association Française des Correspondants à la Protection des
  Données Personnelles. 4 000 membres, annuaire public.
- **Cap'Com Digital Montpellier** — réseau local entrepreneurs tech.

### Ton de l'annonce

Éviter le jargon corporate. Mettre en avant :
- Vraie mission startup (pas du check-box juridique).
- Secteur sensible, donc intellectuellement exigeant.
- Proximité fondateur, décisions rapides.
- Option d'équity advisor si mission 12 mois réussie.

---

## Process de sélection

1. **Candidature** : CV + cover letter + 1 référence vérifiable.
2. **Appel 30 min** (fondateur) — feeling + contexte.
3. **Cas pratique** : DPIA courte sur le feature "soirées / rendez-vous IRL".
   Temps max 2 h.
4. **Signature** : lettre de mission + accès outils (Notion, Linear, Supabase
   read-only, email `dpo@cesoir.app`).

---

## Alternative : DPO mutualisé

Si budget très serré (< 400 € / mois), explorer **DPO mutualisé** via :
- `privacy-tech.fr` — 250 € / mois, DPO partagé entre 5–10 clients.
- Cabinet local type **Lerins BCW** à Paris ou **Mathieu & Associés** à Lyon —
  400 € / mois pour app < 5k users.

Trade-off : moins de disponibilité, templates plus génériques. OK pour la phase
0–6 mois, à upgrader dès qu'on passe 1 000 users.

---

## Références pour benchmarking

- Grille tarifaire DPO freelance 2026 FR :
  - Junior (< 3 ans) : 300–500 € / j
  - Sénior (5+ ans) : 600–900 € / j
  - Expert (certifié + expérience corporate) : 1 000–1 500 € / j
- Pour 2 j / semaine @ 450 € / j moyen → 3 600 € / mois (full price).
- Notre cible de **400–500 € / mois** = négociation sur engagement 12 mois +
  early adopter + mission cadrée.

---

## Contact

CeSoir SASU (en cours d'immatriculation) — `contact@cesoir.app`
Point de contact unique : fondateur (Mr.guessousyoussef@gmail.com).

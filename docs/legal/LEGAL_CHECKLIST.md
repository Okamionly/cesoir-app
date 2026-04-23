# Legal checklist — CeSoir FR launch

> Wave 15 · CFO 10/10 · 2026-04-23
> 40 items à boucler **avant ouverture publique non-invite-only**. Structure
> inspirée des recommandations CNIL "Dating apps 2023" + LCEN + DMA/DSA.
>
> Budget legal review estimé : **3 000 – 5 000 €** one-shot (avocat spé NTIC,
> 3–5 jours de travail). Cible avocat : Alexandre Archambault, Me Bensoussan,
> cabinet Lerins & BCW, ou Dalloz via `avostart.fr`.
>
> ⚠ Chaque item ✅ doit avoir une pièce justificative dans `docs/legal/evidence/`
> avant de cocher.

---

## A. Structure juridique (5 items)

- [ ] **A1.** Création SASU (capital 1 €, objet social "services numériques de mise en relation sociale"). Voir `legalstart.fr` ou `qonto.com` bundle.
- [ ] **A2.** Inscription RCS ≤ 15 j après immatriculation. Numéro SIREN obtenu.
- [ ] **A3.** Ouverture compte pro (Qonto / Shine). Virement libératoire capital.
- [ ] **A4.** Déclaration de début d'activité à l'URSSAF (code NAF 6311Z).
- [ ] **A5.** Assurance RC Pro + cyber souscrite (Hiscox, Stoïk, ou courtier digital). Couverture min 500 K€.

## B. Propriété intellectuelle (3 items)

- [ ] **B1.** Dépôt marque **CeSoir** classes 9, 38, 42, 45 à l'INPI (190 €). Voir `inpi.fr/marques`.
- [ ] **B2.** Cession explicite du code au fondateur (si co-dev : contrat de cession IP signé).
- [ ] **B3.** Logo + charte graphique sous licence claire (Figma file ownership).

## C. RGPD — documentation obligatoire (8 items)

- [ ] **C1.** **Registre des traitements (RAT)** rempli. Template : <https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement>. Minimum 12 traitements listés : auth, matching, chat, localisation, photos, push notifs, analytics, paiement venue, invite codes, signalement, modération, marketing.
- [ ] **C2.** **DPIA** (analyse d'impact) rédigée pour les traitements à risque élevé : géolocalisation, photos, matching, messagerie. Outil officiel : `pia.cnil.fr`.
- [ ] **C3.** **Politique de confidentialité** publiée sur `/privacy` conforme art. 13 RGPD (8 mentions obligatoires : responsable, DPO, finalité, base légale, destinataires, durée, droits, transferts).
- [ ] **C4.** **Durées de conservation** définies par catégorie de données (profil : 3 ans sans activité, messages : 1 an, logs : 12 mois, photos supprimées : 30 j).
- [ ] **C5.** **Process "exercice des droits"** documenté : email `dpo@cesoir.app`, délai réponse < 1 mois (art. 12), template de réponse disponible.
- [ ] **C6.** **Registre des violations** prêt (même vide). Obligation de notification CNIL ≤ 72h post-découverte.
- [ ] **C7.** **Process notification data breach** aux utilisateurs documenté (template email pré-rédigé).
- [ ] **C8.** **Base légale** documentée par traitement (exécution contrat / intérêt légitime / consentement / obligation légale).

## D. RGPD — côté produit (6 items)

- [ ] **D1.** **Consentement explicite** case à cocher à l'inscription pour (a) CGU, (b) politique de confidentialité, (c) cookies analytics si non-essentiels.
- [ ] **D2.** **Double opt-in email** pour marketing (Resend confirme déjà le link).
- [ ] **D3.** **Bouton "Télécharger mes données"** dans `/profile/settings` → export JSON. (art. 20 portabilité).
- [ ] **D4.** **Bouton "Supprimer mon compte"** avec confirmation + suppression effective ≤ 30 j (art. 17 droit à l'oubli).
- [ ] **D5.** **Anonymisation** des messages dans les conversations où l'autre utilisateur a été supprimé (remplacer `name` par "Utilisateur supprimé").
- [ ] **D6.** **Minimisation** : ne pas demander le nom complet, ni la date de naissance précise — âge uniquement.

## E. Cookies & tracking (3 items)

- [ ] **E1.** **Bannière cookies** conforme (refus aussi facile que accepter). Pas de pré-cochage.
- [ ] **E2.** **PostHog** configuré sans cookies tiers (`persistence: "localStorage"` only) OU sous consentement.
- [ ] **E3.** **Sentry** anonymisé (pas de full-URL, pas d'email dans les tags).

## F. CGU (Conditions Générales d'Utilisation) (4 items)

- [ ] **F1.** **CGU publiées** sur `/cgu`, versionnées, acceptation tracée (colonne `profiles.cgu_accepted_at`).
- [ ] **F2.** **Clause de modération + responsabilité utilisateur** (LCEN art. 6) : CeSoir est hébergeur, pas éditeur du contenu utilisateur. Délai prompt retrait ≤ 24h post-signalement.
- [ ] **F3.** **Clause de droit applicable** : droit français, tribunaux compétents.
- [ ] **F4.** **Clause de résiliation** unilatérale côté user + procédure anti-bot/anti-fraude côté CeSoir.

## G. Droit des apps dating / mineurs (4 items)

- [ ] **G1.** **Interdiction 18 ans** stricte — vérification au signup (case + âge saisi). Mentionné dans CGU.
- [ ] **G2.** **Signalement utilisateur** 1-click disponible dans profil + chat. Suivi post-signal (blocage, enquête, notification utilisateur si action).
- [ ] **G3.** **Lutte contre les contenus illicites** : modération photos avant publication (manuel jusqu'à 1k users, Moderation API Open AI ensuite). Voir `src/lib/messageScreening.ts`.
- [ ] **G4.** **Numéro signal** visible : **3020** (harcèlement) + lien Pharos ≤ clic dans la safety page.

## H. Paiement & facturation B2B (3 items)

- [ ] **H1.** Stripe activation "Business entity verified". SIRET fourni.
- [ ] **H2.** **CGV B2B venues** distinctes des CGU B2C. Mention : pas de droit de rétractation 14j (pros).
- [ ] **H3.** **Facturation** conforme au Code de commerce : mention SIREN, TVA si > 34 400 € CA, conditions de paiement ≤ 60 j.

## I. Hébergement & sous-traitants (3 items)

- [ ] **I1.** **Liste des sous-traitants** publiée dans politique de confidentialité : Supabase (UE-Ireland), Vercel (US-adequacy), Stripe (US), Resend (US), Sentry (US), PostHog (UE-Germany).
- [ ] **I2.** **DPA (Data Processing Agreement)** signés avec chaque sous-traitant. Vercel DPA, Supabase DPA, Stripe DPA = auto-sign dans les dashboards respectifs.
- [ ] **I3.** **Transferts hors UE** encadrés par SCC (Standard Contractual Clauses) — vérifiés pour Vercel, Stripe, Resend, Sentry. Documentés dans le RAT.

## J. Accessibilité & égalité (1 item)

- [ ] **J1.** **Conformité RGAA** niveau AA a minima (obligation si services essentiels). Voir `qa-screenshots/` pour évidence visuelle.

---

## Sources

- `pia.cnil.fr` — outil DPIA officiel
- `legifrance.gouv.fr` — LCEN, RGPD (loi 2018-493), Code de commerce
- `dalloz.fr` — avis et jurisprudence NTIC
- `inpi.fr` — marques, brevets, dessins
- `cnil.fr/fr/reglement-europeen-protection-donnees` — fiches pratiques
- `sig-online.com` — modèles DPA
- Avocat ciblé : Me Alexandre Archambault (Twitter `@archambault_fr`) ou cabinet Lerins BCW

## Estimation budgétaire

| Poste | Prix marché FR 2026 |
|---|---|
| Legal review complète (3 j) | **3 000 – 5 000 €** |
| DPIA externalisée (1 j) | 800 – 1 200 € |
| Dépôt marque FR (INPI) | 190 € (3 classes) |
| DPO externe fractional | 400–600 €/mois |

**Budget total à provisionner : 5 000 €** one-shot + 500 €/mois courant.

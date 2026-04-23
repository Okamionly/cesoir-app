# Legal · CeSoir

> Wave 15 · CFO 10/10 · 2026-04-23
> Vue macro pour investisseurs. Détail opérationnel dans
> `docs/legal/LEGAL_CHECKLIST.md` (40 items).

---

## 1. Structure juridique

- **Forme** : SASU (Société par Actions Simplifiée Unipersonnelle) — en cours
  d'immatriculation M0.
- **Capital social** : 1 € initial, augmentation prévue à 1 000 € post-seed.
- **Président** : Youssef Guessous (fondateur unique).
- **Siège social** : Montpellier (France).
- **Code NAF** : 6311Z (Traitement de données, hébergement).
- **Objet social** : "services numériques de mise en relation sociale et de
  médiation avec les établissements de nuit".

## 2. Cap table — M0

| Associé | Actions | % |
|---|---|---|
| Youssef Guessous (fondateur) | 1 000 | 100 % |
| **Total** | **1 000** | **100 %** |

### Projections post-seed (scenario levée 300 K€ · 15 % dilution)

| Associé | Actions | % post-seed |
|---|---|---|
| Fondateur | 1 000 | 77,5 % |
| Advisors (pool 5 %) | 65 | 5 % |
| Employee pool (10 %) | 130 | 10 % |
| Investisseurs (dilution 15 %) | 195 | 15 % |
| **Total post-seed** | **1 290** | **100 %** |

## 3. Propriété intellectuelle

- **Code source** : 100 % détenu par SASU CeSoir (pas de contribution
  externe non-cédée).
- **Marque "CeSoir"** : dépôt INPI en cours (classes 9, 38, 42, 45).
- **Logo + identité** : propriété fondateur, cession à la SASU au jour de
  l'immatriculation (acte signé).
- **Licences tierces** : stack 100 % open-source permissive (Next.js MIT,
  Supabase Apache 2, React MIT, Tailwind MIT). Pas de dépendance GPL.

## 4. Conformité RGPD — état à date

- [x] **Hébergement UE** : Supabase Ireland + Vercel edge France + PostHog Germany.
- [x] **Logger anonymisé** : `src/lib/logger.ts` redacte tous PII.
- [x] **Consentement** : case CGU + privacy à l'inscription (migration à venir
  pour tracer timestamp d'acceptation).
- [ ] **Politique de confidentialité** conforme art. 13 RGPD — rédaction à
  finaliser avec avocat NTIC (budget 3 000–5 000 € prévu).
- [ ] **DPIA** : en cours, outil `pia.cnil.fr`.
- [ ] **DPO externe** : recrutement en cours — voir `docs/hiring/DPO_JD.md`.

Complet : voir `docs/legal/LEGAL_CHECKLIST.md` (40 items, 8 sections).

## 5. Droit applicable

- **Droit français** exclusif pour les CGU et CGV.
- **Tribunaux** : compétence territoriale Montpellier (siège social).
- **Lutte contre les contenus illicites** (LCEN art. 6) : CeSoir opère comme
  hébergeur, pas éditeur. Procédure de retrait ≤ 24h sur signalement fondé.
- **Conformité dating apps** : âge min 18 ans, signalement 1-clic, lien
  Pharos + numéro 3020 visibles.

## 6. Assurances

- **RC Pro + cyber** : en cours de souscription (Hiscox ou Stoïk), couverture
  min 500 K€, coût estimé 600 €/an.
- **Pas d'assurance D&O** (Directors & Officers) avant post-seed.

## 7. Contrats sous-traitants (DPA)

| Fournisseur | Hébergement | DPA signé | Transfert UE |
|---|---|---|---|
| Supabase | Ireland (UE) | ✅ auto-DPA dashboard | OK |
| Vercel | France edge + US fallback | ✅ DPA pro | SCC signées |
| Stripe | Ireland + US | ✅ auto-DPA | SCC signées |
| Resend | US-Delaware | ✅ | SCC signées |
| Sentry | US | ✅ | SCC signées |
| PostHog | Germany (EU instance) | ✅ | OK |
| Cloudflare (CDN partial) | Global | ⚠ à vérifier | à documenter |

## 8. Contentieux en cours

Aucun.

## 9. Point d'attention pour investisseurs

- **Pas encore de DPO officiel** — recrutement prévu pre-launch, pas bloquant
  légalement à notre volume < 5 000 utilisateurs mais recommandé.
- **Legal review avocat** non encore fait — budgété 3–5 K€, prévu M0.
- **Marque INPI non déposée** à ce jour — risque réputationnel mais faible
  à l'échelle actuelle. Dépôt prévu M0.
- **Pas de pacte d'associés** nécessaire en SASU unipersonnelle. À créer au
  premier co-founder ou investisseur.

## 10. Documents types disponibles sur demande

- Statuts SASU (projet)
- CGU draft
- Privacy policy draft
- NDA light (pour due diligence)
- DPA template (utilisateur → CeSoir)

# Tech Lead Freelance — Senior Full-stack Next.js/Supabase

> *CeSoir est aujourd'hui maintenu par une seule personne. On cherche un tech lead senior pour élever la qualité, scaler l'infra, et réduire notre bus factor à 2.*

---

## TL;DR

- **Role** : Tech Lead freelance, 3 jours/semaine, contrat test 3 mois
- **Budget** : 8 000 – 12 000 € / mois (650 – 1000 € / jour)
- **Stack** : Next.js 15/16, React, TypeScript strict, Tailwind, Supabase (Postgres + Realtime + Auth + Storage), Vercel, PWA (VitePWA)
- **Mission** : élever la qualité (CI/CD, type safety, tests), scaler l'infra, mentorer futur tech lead CDI
- **Contrat** : freelance 3 mois puis renouvellement, possible conversion CDI à terme
- **Où** : remote France, 1 sync mensuel à Montpellier (remboursé)

---

## Contexte

**État technique actuel de CeSoir (résumé honnête)** :

- ✅ **Ce qui marche bien** : stack moderne (Next 16, Supabase), app déployée en prod, 24 tables Supabase, 14 modes fonctionnels, PWA installable.
- ⚠️ **Ce qui boite** : pas de CI complète, tests E2E partiels, pas de staging env rigoureux, RLS Supabase à auditer, monitoring/alerting minimaliste.
- 🔴 **Ce qui manque** : process code review structuré, runbooks incidents, observability sérieuse, security audit RGPD, scalability testée.

**Ce qu'on veut en 3 mois** : un produit qui peut accueillir 10 000 users actifs mensuels sans tomber, avec un founder qui peut prendre 1 semaine off sans que tout explose.

---

## Qui on cherche

### Profil idéal

- **7+ ans d'expérience** full-stack, dont au moins **3 ans en lead role** (tech lead, staff, engineering manager).
- **Expérience scaleup B2C française** : Doctolib, Alan, Back Market, Blablacar, Qonto, PayFit, Spendesk, ManoMano, Welcome to the Jungle.
- **Stack proche** de la nôtre : idéalement Next.js + Supabase, ou Next.js + Postgres, ou Remix/SvelteKit si équivalent.
- **Real-time à l'échelle** : si t'as fait scaler une app avec websockets/Supabase Realtime à 10k+ connexions simultanées, gros bonus.

### Hard skills

- **Next.js 15/16** (App Router, RSC, Server Actions, Streaming) — niveau senior.
- **TypeScript strict** — tu bannis `any`, tu connais conditional types, mapped types, les pièges de `satisfies`.
- **PostgreSQL** — tu écris du SQL, tu lis un `EXPLAIN ANALYZE`, tu sais indexer.
- **Supabase** — RLS policies, edge functions, migrations, auth flows custom.
- **Tests** — Vitest + Playwright E2E, tu sais écrire un test pyramid correct.
- **CI/CD** — GitHub Actions, deploy previews, semantic versioning, auto-releases.
- **Observability** — Sentry, logs structurés, métriques, alerting. Tu dois savoir débugger prod sans redéployer.

### Soft skills (non-négo)

- **Mentorat** : tu kiffes former des gens, pas briller en silo.
- **Pragmatique** : tu choisis la solution qui ship dans la deadline, pas celle qui a la stack la plus "parfaite".
- **Communication écrite** : tu écris des ADRs, des post-mortems, des RFCs. Async-first.
- **Sens du produit** : tu comprends "pourquoi" avant de coder "comment".
- **Direct & honnête** : tu dis quand t'es pas d'accord. Sans drama, avec arguments.

### Bonus

- Contribution open source (GitHub actif).
- Speaking/blog tech (preuve que tu sais vulgariser).
- Expérience dating/social apps (modération, safety, GDPR).
- Français natif ou bilingue.

---

## Missions concrètes (3 premiers mois)

### Mois 1 — Audit & Foundation (~12 jours)

- **Audit complet** : sécurité (RLS, secrets, auth flows), perf (Lighthouse, DB queries lentes), code quality (type coverage, tests).
- **ADRs prioritaires** : choisir stack monitoring (Sentry + autre ?), choisir process release (trunk-based, feature branches ?), choisir règle code review.
- **Setup CI minimal** : lint, typecheck, tests unit, build Vercel preview — bloquant sur merge.
- **Livrable** : audit Notion complet + roadmap 3 mois priorisée + 1er PR structurant mergé.

### Mois 2 — Harden & scale (~12 jours)

- **RLS audit complet** : chaque table Supabase → policy vérifiée, testée, documentée.
- **Tests E2E critiques** : login, match, chat, premium, safety flows — Playwright.
- **Monitoring** : Sentry côté client + server, alerting Slack, dashboard uptime.
- **Rate limiting** : sur endpoints sensibles (login, reports, payments).
- **Staging env** : branch Supabase, déploiement Vercel preview avec seed data.
- **Livrable** : tests >70% coverage sur paths critiques, 0 alerte Sentry non-traitée depuis 7 jours.

### Mois 3 — Scale & mentor (~12 jours)

- **Docs architecture** : `docs/ARCHITECTURE.md` + ADRs pour les 10 décisions structurantes.
- **Runbooks** : `docs/OPERATIONS.md`, `docs/INCIDENT_RESPONSE.md` — tests grandeur nature 1x/mois.
- **Perf work** : scale test à 10k users concurrent, optimiser bottlenecks identifiés.
- **Hire prep** : préparer grille d'entretien tech pour futur CDI senior + junior.
- **Livrable** : founder peut partir 1 semaine en ayant confiance que tu peux gérer tout sauf décision stratégique.

---

## Comment on travaille ensemble

### Engagement

- **3 jours/semaine** (flex dans la semaine, core hours 10-16h CEST).
- **Contrat freelance** (SIRET requis). Factures mensuelles.
- **Durée initiale** : 3 mois, renouvellement tacite ensuite.
- **Possible conversion CDI** à terme si match perfect (pas avant M6).

### Méthode

- **Async-first** : tout passe par GitHub (PRs, issues), Notion (specs), Slack (messagerie).
- **1 sync hebdo** (45 min) + 1 demo review bi-hebdo (30 min).
- **1 on-call "soft"** : tu es le backup du founder sur incidents P0 weekends (rémunéré en plus, 300€/intervention).

### Code & décisions

- **Tu as le dernier mot sur tech** : le founder a droit de véto sur produit/business, pas sur choix de stack.
- **Tu proposes ADRs** pour décisions structurantes. Review par founder → merge.
- **Tu review tous les PRs** : founder + futur dev. Tu es le gardien de la qualité.

---

## Compensation

- **3 jours/semaine = ~12 jours/mois**
- **TJM : 650 – 1000 €** selon séniorité/XP
- **Total mensuel : 8 000 – 12 000 €** HT
- **Bonus** : rémunération on-call weekends (300€/intervention P0).
- **BSPCE** : possibilité d'attribution BSPCE dès M4 (voir BSPCE_POOL.md — typique 1-2% sur 4 ans vesting).
- **Learning budget** : 500€/an (conférences tech, livres).

---

## Ce qu'on ne te propose pas

- ❌ Full-time 5 jours dès le départ (on veut tester 3 mois en part-time d'abord).
- ❌ Un titre C-level (pas avant que tu sois CDI et qu'on ait clairement défini l'org).
- ❌ Du management people (pas encore d'équipe à manager).
- ❌ De la gestion produit/design (pas ton rôle).

---

## Processus d'entretien

### Étape 1 — Call tech (45 min)

Call avec founder. On parle :
- Ton parcours tech (15 min — projets concrets, pas CV marketing)
- CeSoir : stack, problèmes, ambitions (15 min)
- Tes questions (15 min)

### Étape 2 — Test code (4-6h rémunéré 800€)

Un cas concret : **"Audit de sécurité d'une RLS policy Supabase + propose une meilleure version + écris le test E2E qui prouve qu'elle est safe."**

- Brief détaillé fourni (code actuel, contexte produit).
- Livrable : PR GitHub sur repo test privé + 1 Loom (20 min) walkthrough de ton raisonnement.
- Délai : 5 jours calendaires.
- **Rémunéré 800€** qu'on t'embauche ou non.

### Étape 3 — Pair programming live (2h)

Session live en visio sur un bug réel du codebase. L'objectif :
- Voir comment tu raisonnes en temps réel.
- Voir ton rapport aux outils (IDE, LLMs, debuggers).
- Voir ta communication pendant que tu codes.

### Étape 4 — Call culture & vision (30 min)

Discussion valeurs/vision. Questions :
- Raconte une fois où t'as merdé en prod. Comment t'as géré ?
- Radical Candor — donne-moi un feedback direct sur ce qu'on a vu pendant le process.
- Pourquoi CeSoir (pas juste "payez bien") ?

### Étape 5 — Decision (48h)

On tranche. Si OK → contrat envoyé, démarrage 2 semaines après.

**Timeline totale** : ~3 semaines du premier contact au démarrage.

---

## Où on poste ce JD

- **LinkedIn** (post founder + Welcome to the Jungle annonce payante).
- **Hired.com** (cible Senior FR).
- **Malt Senior** (profil tech lead freelance).
- **GitHub Jobs** (via Vercel template community).
- **RemoteOK / We Work Remotely** (secondaire — cible remote FR/EU).
- **Référrals** : Alan alumni, Doctolib alumni, Back Market alumni.

---

## Légal

- **Statut** : freelance obligatoire (SIRET). Si tu es sur autre statut, on peut explorer portage salarial (Stello, Embarq).
- **Durée** : 3 mois renouvelable. Préavis 1 mois pour les deux parties après M3.
- **NDA** : obligatoire avant test case. IP code signée au fondateur.
- **Concurrence** : pas de clause de non-concurrence (on joue fair).

---

## Contact

Envoyer : CV + **lien GitHub profil** + **1 paragraphe** sur le projet le plus complexe que t'as livré.

À : **contact@cesoir.app** avec sujet `[TECH LEAD] Prénom Nom`

*Date du JD : 2026-04-23. Valable jusqu'au 2026-07-31.*

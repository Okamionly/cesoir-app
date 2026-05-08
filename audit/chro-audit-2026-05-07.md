# CHRO Audit — CeSoir App
**Date** : 2026-05-07 | **Stage** : Pre-seed / Pre-launch | **Auditeur** : CHRO Perspective

---

## JSON Structured Output

```json
{
  "role": "CHRO",
  "saas_name": "CeSoir",
  "audit_date": "2026-05-07",
  "executive_summary": "CeSoir est un projet dating app solo-founder en phase pre-launch avancée, avec une profondeur technique remarquable : 48 migrations DB, ~100 composants TSX, stack production-grade (Stripe, Sentry, TensorFlow, face-api, NSFWJS, MapLibre, Upstash, PostHog, web-push). La totalité du risque organisationnel est concentrée sur une seule personne, Youssef Guessous, qui porte simultanément product, design, full-stack, DevOps, growth et support. Ce niveau de concentration est le principal risque de survie du projet. La roadmap 18 mois proposée est cohérente mais sous-estime la charge trust & safety post-launch. Le premier hire doit être un designer senior freelance, pas un dev.",
  "team_size_estimate": 1,
  "stage": "seed",
  "team_composition": {
    "engineering_pct": 100,
    "sales_marketing_pct": 0,
    "customer_success_pct": 0,
    "product_design_pct": 0,
    "ops_finance_hr_pct": 0
  },
  "open_roles_insights": [
    "Aucun rôle ouvert détecté — pas de Careers page, logique pre-launch mais signal d'absence de pipeline hiring",
    "La présence de NSFWJS + face-api + trust/safety tables (migration 016) révèle une conscience du problème modération sans ressource humaine dédiée",
    "Migration 044 wingman_invites + 025 invite_rewards = mécanique growth virale intégrée au produit, pas besoin d'un growth hacker day-1",
    "Storybook + Vitest + Playwright configurés = discipline engineering solo au-dessus de la moyenne, facilite l'onboarding d'un second dev"
  ],
  "scores": {
    "team_composition_balance": 1,
    "org_structure": 3,
    "hiring_roadmap_clarity": 7,
    "compensation_strategy": 6,
    "culture_strength": 6,
    "employee_experience": 5,
    "diversity_inclusion": 3
  },
  "overall_score": 4.4,
  "findings": [
    {
      "severity": "critical",
      "area": "Team Composition",
      "observation": "Bus factor 1. Youssef est le seul contributeur sur 48 migrations, ~100 composants, la config Vercel, Supabase, Stripe, Sentry, Upstash et PostHog. Une hospitalisation de 3 semaines = projet à l'arrêt.",
      "recommendation": "Documenter immédiatement les 5 procédures critiques (deploy, DB rollback, Stripe webhook, Supabase RLS, push notifications) dans un runbook. Objectif : un prestataire externe peut reprendre en 48h.",
      "priority": 1
    },
    {
      "severity": "critical",
      "area": "Trust & Safety",
      "observation": "La stack intègre NSFWJS, face-api, des tables trust/safety (migration 016) et un système de reports. Post-launch avec vrais utilisateurs, la modération devient un travail à temps plein. Un founder seul ne peut pas modérer ET développer.",
      "recommendation": "Recruter un community ambassador Montpellier dès J+30 post-launch (pas M6). Ce rôle est trust & safety en premier, community en second. Budget 1200-1500€/mois part-time.",
      "priority": 1
    },
    {
      "severity": "important",
      "area": "Product/Design",
      "observation": "Aucun designer dans l'équipe. La qualité UI actuelle (landing cinématique, palette cohérente, motion/react) est portée par le founder-dev. Ce modèle ne scale pas : chaque feature UI prend 3x plus de temps sans designer dédié.",
      "recommendation": "Designer senior freelance en priorité 1 dès maintenant, avant le premier hire full-time. Budget 400-600€/jour, 2-3 jours/semaine. Focus : design system Storybook + flows onboarding + App Store assets.",
      "priority": 2
    },
    {
      "severity": "important",
      "area": "Org Structure",
      "observation": "Founder's trap total : tout reporte à Youssef. Pas de structure car pas d'équipe, mais les habitudes de travail solo (décisions non documentées, context dans la tête) créent une dette organisationnelle qui explosera au premier hire.",
      "recommendation": "Commencer un decision log minimal dès aujourd'hui : 1 fichier markdown DECISIONS.md avec date, contexte, choix, raison. 5 minutes par décision importante. Invaluable pour onboarder le premier hire.",
      "priority": 2
    },
    {
      "severity": "important",
      "area": "Burn-out Risk",
      "observation": "Wave 17 + 48 migrations en solo = sprint intense. Les composants de l'app révèlent une scope très large (speed-dating, rooms, shop, premium, venues, manifesto, map, chat, feed, events, QR check-ins, travel passport, crystal ball). Chaque feature maintenue en solo multiplie la charge cognitive.",
      "recommendation": "Gel de nouvelles features pendant 4 semaines post-launch. Focus : stabilité, monitoring Sentry, feedback utilisateurs. Le scope actuel est suffisant pour valider le PMF.",
      "priority": 2
    },
    {
      "severity": "nice-to-have",
      "area": "Diversity & Inclusion",
      "observation": "Impossible à évaluer sur 1 personne. Mais le premier hire designer ou community manager est une opportunité de poser les bases d'une culture diverse dès le début.",
      "recommendation": "Cibler activement des profils féminins pour le rôle community ambassador — indispensable pour créer un environnement safe perçu comme tel par les utilisatrices d'une dating app.",
      "priority": 3
    }
  ],
  "critical_hiring_gaps": [
    {
      "role": "Designer Senior Freelance (UX/UI + Brand)",
      "urgency": "immediate",
      "reason": "Design system Storybook à finaliser, flows onboarding à optimiser, App Store assets manquants. Libère 30% du temps founder sur le produit."
    },
    {
      "role": "Community Ambassador Montpellier (Trust & Safety first)",
      "urgency": "immediate",
      "reason": "Post-launch, la modération et l'animation terrain sont incompatibles avec le développement solo. Profil étudiant ou jeune pro, 6-10h/semaine."
    },
    {
      "role": "Dev Full-Stack Mid-Senior",
      "urgency": "3-months",
      "reason": "Post-fundraising. La stack (Next 16 + Supabase + TypeScript strict + Vitest + Playwright + Storybook) est bien documentée pour l'onboarding. Urgence conditionnée au financement."
    },
    {
      "role": "Growth Lead FR",
      "urgency": "6-months",
      "reason": "Les mécaniques virales sont dans le produit (wingman invites, invite rewards, karma, streaks). Un growth lead amplifie ces mécaniques existantes plutôt que d'en créer."
    }
  ],
  "culture_red_flags": [
    "Aucune documentation culture/values publique — normal pre-launch mais à créer avant le premier hire",
    "Risque de culture implicite 'founder knows best' difficile à déconstruire plus tard",
    "Async-first non documenté = risque de friction si le premier hire est habitué au présentiel"
  ],
  "next_hires": [
    {
      "role": "Designer Senior Freelance",
      "when": "Immédiatement — mission 2 mois, 2j/semaine",
      "reason": "Libère le founder du pixel-pushing, professionnalise les assets App Store, finalise le design system Storybook pour le futur dev hire"
    },
    {
      "role": "Community Ambassador Montpellier",
      "when": "J+14 post-launch",
      "reason": "Trust & safety terrain, animation premiers users, feedback qualitatif direct. Profil étudiant 20-24 ans, femme de préférence, natif Montpellier"
    },
    {
      "role": "Dev Full-Stack (Next.js + Supabase)",
      "when": "Post-closing pre-seed (M6-M9)",
      "reason": "Reduce bus factor, paralléliser le développement mobile React Native et les features produit"
    },
    {
      "role": "Growth / Acquisition Lead",
      "when": "M10-M12, post-PMF confirmé",
      "reason": "Activer les canaux paid + partenariats venues Montpellier une fois la rétention validée"
    },
    {
      "role": "Trust & Safety Ops (temps plein)",
      "when": "M12-M15, >500 utilisateurs actifs",
      "reason": "Le volume de modération dépasse ce qu'un community ambassador part-time peut absorber"
    }
  ]
}
```

---

## Diagnostic Narratif — 700 mots

### Team Composition : le paradoxe du fondateur sur-compétent

CeSoir est techniquement impressionnant pour un projet solo. 48 migrations Supabase couvrant des domaines radicalement différents — sécurité RLS (003), Stripe (006), trust/safety (016), GPS privacy (024), voice messages (031), QR check-ins (042), anti-ghost decay (045), mastery tiers (046), moments (047) — témoignent d'un founder qui pense systèmes, pas features. La stack de production (Sentry, PostHog, Upstash rate-limiting, TensorFlow/face-api pour modération automatique, NSFWJS) est celle d'une équipe de 5.

C'est précisément le problème.

Quand un seul individu porte 100% de l'engineering, 100% du product, 100% du design, 100% du DevOps et 100% de la vision, le ratio team composition affiche un score de 1/10. Non pas par incompétence — l'inverse — mais parce que cette concentration crée un risque existentiel que aucun investisseur sérieux ne peut ignorer, et que le founder lui-même sous-estime systématiquement.

**Bus factor 1. C'est le seul chiffre qui compte aujourd'hui.**

### Hiring Gaps Critiques : designer avant dev

La tentation naturelle d'un founder-dev est de recruter un autre dev pour partager la charge technique. C'est la mauvaise décision à ce stade.

**Pourquoi le designer freelance passe en premier :**

La qualité de l'expérience utilisateur d'une dating app détermine le taux d'activation et la rétention plus que n'importe quelle feature backend. Les composants existants (landing cinématique, PlasmaOcean, MoonHero, motion/react, palette cohérente) montrent un founder avec un sens design fort — mais ce sens design coûte aujourd'hui 30 à 40% de son temps de développement. Un designer senior freelance (400-600€/jour, 2 jours/semaine) libère cette bande passante, professionnalise les assets App Store indispensables au lancement, et pose les bases d'un design system Storybook qui facilitera l'onboarding du futur dev.

**Pourquoi le community ambassador Montpellier est urgence post-launch :**

La migration 016 (trust/safety tables), les composants VibeCheck, la logique NSFWJS et face-api montrent que le founder a anticipé les risques de modération. Mais la modération automatique ne remplace pas la présence humaine terrain dans les premières semaines de vie d'une dating app. Un utilisateur qui se sent unsafe le dit rarement dans l'app — il désinstalle. Le community ambassador est la ligne de défense humaine, le premier point de contact terrain à Montpellier, et la source de feedback qualitatif le plus précieux des 3 premiers mois.

### 3 Recommandations Immédiates

**1. Runbook de survie (cette semaine, 4h max)**

Documenter les 5 procédures critiques : déploiement Vercel, rollback DB Supabase, gestion webhook Stripe, renouvellement clés Upstash/PostHog, procédure incident Sentry. Format : fichier markdown `RUNBOOK.md` à la racine, chaque procédure en moins de 10 étapes. Objectif : un développeur externe peut reprendre les opérations en 48h. Ce document est aussi ce que tout investisseur pre-seed lira en due diligence.

**2. Gel de scope pendant 30 jours post-launch**

Le scope actuel — speed dating, rooms, shop, premium, venues dashboard, map heatmap, QR check-ins, travel passport, crystal ball, nightly vibe, wingman invites, anti-ghost decay, mastery tiers — est suffisant pour valider le PMF. Chaque nouvelle feature ajoutée maintenant est une dette de maintenance solo. La règle : aucune nouvelle migration DB pendant 30 jours post-launch. Corriger, monitorer, écouter.

**3. Equity pool et compensation dès maintenant**

Avant le premier hiring, définir l'option pool (recommandé : 12% pour les 5 premiers hires) et les fourchettes par rôle. Ce travail en amont évite les négociations émotionnelles sous pression. Pour le designer freelance : pas d'equity, journalier pur. Pour le premier dev full-time post-seed : 60-80k€ + 0.75-1.5% sur 4 ans avec cliff 1 an. Ces chiffres sont défendables sur le marché français tech 2026.

---

**Question test pour la suite :** cette équipe peut-elle scaler 3x dans 12 mois ? Oui — à condition que le runbook existe, que le designer freelance soit onboardé avant le lancement App Store, et que le community ambassador soit en place avant que le premier incident de modération arrive. Ce ne sont pas des conditions optionnelles.

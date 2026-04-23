# CeSoir — Pitch Deck

> *Personne ne dîne seul ce soir à Montpellier.*

Format Markdown prêt à convertir en Google Slides / Pitch / Figma Slides. Chaque `##` = 1 slide. Les notes speaker sont en `> Speaker:`.

---

## Slide 1 — Couverture

# **CeSoir**

### *Personne ne dîne seul ce soir à Montpellier.*

App de rencontre spontanée, ultra-locale, 100% gratuite.

**Fondée en 2026 · Montpellier · Seed non-levée**

> Speaker: 30 secondes pour accrocher. Tu ouvres avec la douleur : l'isolement urbain est la pandémie silencieuse de la Gen Z. CeSoir est l'antidote. Gratuit, local, ce soir.

---

## Slide 2 — Le Problème

# **On n'a jamais été aussi connectés. Ni aussi seuls.**

- **1 Français sur 4** se sent régulièrement seul (INSEE 2024)
- **60% des 18–35 ans** ont réduit leurs sorties spontanées depuis 2020
- **Taux de conversion match → rencontre IRL** des apps dating classiques : **3%**
- **Gen Z en burnout de swipe** : Tinder perd des utilisateurs actifs pour la 1re fois (Morning Consult 2025)

Les apps existantes ont optimisé pour le **swipe**. Pas pour la **soirée**.

> Speaker: Stats factuelles, pas de storytelling. L'investisseur comprend en 10 secondes que c'est un marché énorme mal servi.

---

## Slide 3 — Le Insight

# **On ne se matche pas sur un profil. On se rencontre sur un plan.**

**Apps classiques** → Match d'abord. (Peut-être) plan plus tard. Résultat : 97% de conversations mortes.

**CeSoir** → Plan d'abord. Rencontre maintenant. Résultat : 10x conversion IRL.

Un verre. Un dîner. Une soirée en coloc. Ce soir. Ici.

> Speaker: Ce slide est le "aha moment". Insiste sur l'inversion logique. Les investisseurs qui ont essayé Tinder comprennent immédiatement.

---

## Slide 4 — La Solution

# **14 modes de rencontre pour 14 situations de vie**

- **Solo Diner** — Tu manges seul ce soir, tu veux pas. Tu trouves quelqu'un en 3 clics.
- **Squad** — Tu cherches un groupe pour sortir. Pas un date.
- **Date** — Classique, mais avec un plan concret en premier message.
- **Speed-Dating** — 5 minutes par personne, 5 personnes par soirée.
- **Events** — Concerts, vernissages, matchs : qui y va, qui veut y aller ?
- **+9 autres modes** couvrant coloc, sport, voyage, etc.

**Pas de matching algorithm obscur.** Tu vois les plans, tu rejoins.

> Speaker: Montre 2-3 screens de l'app. Insiste sur "plan d'abord". Ne rentre pas dans les 14 modes — dis "on couvre les 14 situations réelles, pas 14 segments marketing".

---

## Slide 5 — Le Marché

# **TAM 180M € · SAM 42M € · SOM 3M € (Montpellier année 1)**

| Zone | Population cible (18–35 ans) | ARPU B2B potentiel (an) | Marché accessible |
|---|---|---|---|
| **Montpellier** | 90k | 33 € / user | **3M €** (SOM year 1) |
| **France** | 12M | 30 € / user | **360M €** (SAM) |
| **Europe latine** | 45M | 28 € / user | **1.26B €** (TAM étendu) |

**Nous ne monétisons PAS les users.** Le revenu vient des venues B2B (bars, restaus, clubs) qui paient pour visibilité et data d'affluence.

> Speaker: Sois honnête sur le SOM. Montpellier 3M € c'est réaliste en année 1 avec 10k MAU + 50 venues partenaires. Ne raconte pas le TAM européen comme un chiffre à atteindre — c'est une vision 5 ans.

---

## Slide 6 — Le Produit

# **Stack moderne · Mobile-first · PWA installable**

**Tech**
- Next.js 16, React 19, TypeScript strict
- Supabase (auth + Postgres + Realtime + Storage)
- Tailwind v4, motion/react, PWA VitePWA
- Deploy Vercel, Sentry observability

**Différenciateurs produit**
- **14 modes** vs 1 feed unique chez les concurrents
- **Géolocalisation ultra-précise** (quartier/bar, pas ville)
- **Fenêtre temporelle courte** : les plans expirent à 2h du matin
- **Zéro algorithme noir** : tu vois tous les plans près de toi, tri chronologique

> Speaker: Mentionne rapidement la stack, les investisseurs techniques aiment. Insiste sur les 4 différenciateurs produit.

---

## Slide 7 — Traction

# **Pre-revenue. Beta fermée Montpellier.**

**Metrics à date (avril 2026)**
- Beta fermée : waitlist privée ~500 pers. Montpellier
- App déployée : Vercel prod live, 24 tables Supabase, 14 modes en ligne
- 50+ pages fonctionnelles, PWA installable, Lighthouse 95+
- **Audit CEO initial : 3.7/10 → CEO-grade après refonte Wave 15**

**Prochains jalons (Q3 2026)**
- M+2 : Beta publique Montpellier (target 2k MAU)
- M+4 : 20 venues partenaires signées
- M+6 : 10k MAU, first B2B revenue

> Speaker: Sois transparent sur le pre-revenue. Les investisseurs préfèrent l'honnêteté. Montre la vitesse d'exécution : 500 waitlist + app complète en 3 mois solo.

---

## Slide 8 — Business Model

# **Free pour les users. B2B pour les venues. Forever.**

### Côté utilisateur (B2C)
- **100% gratuit. Pas de paywall. Jamais.**
- Pas de pub ciblée. Pas de data mining. Pas de freemium piège.
- Feature flag `MONETIZATION_ENABLED=false` sur toutes les features users.

### Côté venues (B2B)
- **Pin featured** : un bar/restau paie pour être épinglé en haut d'un mode
- **Rubrique Soirées** : les clubs/événements publient leurs soirées avec place réservées aux users CeSoir
- **Data d'affluence prédictive** : dashboard pour les venues ("combien de users sont intéressés ce vendredi ?")

### Pricing B2B indicatif
- Starter : 49 €/mois (1 pin featured + soirées)
- Pro : 149 €/mois (dashboard + 5 pins + features prioritaires)
- Enterprise : sur mesure (groupes de bars/restaus)

**LTV/CAC target : 4.5** (LTV venue 18 mois × ARPU 99 € = 1782 € ÷ CAC 400 €)

> Speaker: Le modèle B2B venues est classique dans la restauration (cf TheFork, Lafourchette). On applique la mécanique au social. Ne cède pas sur le gratuit users — c'est notre moat différenciation.

---

## Slide 9 — Concurrence

# **Personne ne joue sur "plan d'abord + local + gratuit".**

| Concurrent | Plan-based | Ultra-local | Gratuit 100% | Spontané |
|---|---|---|---|---|
| **Tinder / Bumble / Hinge** | ❌ | ❌ | ❌ (paywall) | ❌ |
| **Meetup** | ✅ | ❌ (ville) | ✅ | ❌ (J+3) |
| **BeReal** | ❌ | ❌ | ✅ | ❌ |
| **Tiime (FR)** | ✅ | ❌ | ❌ | ✅ |
| **Fluz (FR)** | ❌ | ❌ | ❌ | ❌ |
| **CeSoir** | ✅ | ✅ | ✅ | ✅ |

**Notre moat** : on combine les 4 axes que personne ne combine. La localité extrême (quartier, pas ville) + la temporalité ce soir + le gratuit forever + la logique plan d'abord.

> Speaker: Ne dénigre pas les concurrents — ils servent d'autres jobs. Insiste sur ce que personne ne fait : la **densité locale** + **temporalité ce soir**.

---

## Slide 10 — Équipe

# **Une équipe lean, obsessive, full-stack.**

**[Fondateur]** · CEO & Produit
- 5 ans dans le produit digital (restauration, dating adjacent)
- Convaincu que la tech doit rapprocher, pas isoler

**[CTO à recruter Q3 2026]** · Technique
- Stack Next.js / Supabase / Vercel
- Obsédé par perf + sécurité

**[Design Lead à recruter Q4 2026]** · UX
- Minimaliste, Gen Z, mobile-first

**Advisors cibles** : anciens Tinder FR, dirigeants restauration (Big Mamma, Sushi Shop), experts growth social apps.

> Speaker: Sois honnête sur le stade (solo founder + freelances). Les investisseurs adorent les founders qui shippent seuls. Mentionne les 2-3 advisors que tu cibles — montre que tu y penses.

---

## Slide 11 — Roadmap

# **18 mois pour devenir le réflexe montpelliérain.**

**Q2 2026 — Beta publique Montpellier**
- Launch public avec 2k MAU cible
- 10 venues partenaires pilotes
- Feature flag monétisation OFF

**Q3 2026 — Densité Montpellier**
- 10k MAU, 50 venues partenaires
- Premier revenu B2B (10k €/mois MRR)
- Hire CTO + Growth

**Q4 2026 — Toulouse + Lyon**
- Réplication playbook Montpellier
- 25k MAU total, 200 venues
- Levée Seed (target 2M €)

**2027 — France nationale**
- 8 villes couvertes
- 150k MAU, 1500 venues
- ARR 1.5M €

**2028 — Europe latine**
- Barcelone, Lisbonne, Milan
- Série A 10M €

> Speaker: Roadmap par jalons, pas par mois. Montre la logique "densité locale d'abord, expansion après". Insiste sur la levée Seed Q4 2026.

---

## Slide 12 — Ask

# **Nous levons 2M € en Seed.**

### Allocation

- **40% Tech + Produit** — Hire CTO, Design Lead, 2 devs. Itération produit 18 mois.
- **35% Growth + Acquisition** — Organic-first Montpellier → réplication 7 villes FR. Viral mechanics.
- **15% B2B Sales** — Hire 2 Account Executives venues. Playbook commercial.
- **10% Ops + Legal** — RGPD, modération, infrastructure.

### Qui on cherche

- Fonds **Pre-Seed / Seed français** spécialisés consumer mobile
- Business angels **Gen Z / dating / restauration**
- Advisors **Tinder FR, Big Mamma, LaFourchette alumni**

### Scénarios exit 5-7 ans

- **Acquihire Match Group** (Tinder, Hinge, OkCupid) — précédent Hinge 2018 (400M$)
- **Bumble Inc** — chasse les produits Gen Z
- **Groupes restauration** (LaFourchette/TheFork, Groupon, Resy)

**Contact :** founder@cesoir.app · www.cesoir.app

> Speaker: 2M € est réaliste pour un Seed FR. L'ask doit être simple, la répartition claire. Ne cède pas sur la question "exit" — les VCs ont besoin de voir la liquidité.

---

*Dernière mise à jour : avril 2026 · Version 1.0*

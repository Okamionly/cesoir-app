# Discord "CeSoir Insiders" — setup complet

**Objectif** : créer une communauté privée de 20 early users (Montpellier Wave 1)
qui donnent du feedback ultra-rapide, testent les features en beta et portent le
bouche-à-oreille avant le lancement public.

**Nom du serveur** : `CeSoir Insiders` · avatar : lune violette ☾ · bannière :
palette Dark Fluo cinematique

---

## Structure du serveur

### Catégorie 1 — BIENVENUE

| Channel | Type | Description | Permissions |
|---|---|---|---|
| `#welcome` | text | Message de welcome, rules, presentations | Read-only sauf onboarding bot |
| `#annonces` | text | Annonces founder uniquement | Read-only pour insiders |
| `#regles` | text | Code de conduite, ton, modération | Read-only |

### Catégorie 2 — PRODUCT

| Channel | Type | Description |
|---|---|---|
| `#feedback` | text | Feedback général sur l'app — un thread = un sujet |
| `#bug-reports` | forum | Forum style, un post = un bug |
| `#mode-requests` | text | Demandes de nouveaux modes de rencontre |
| `#beta-testers` | text | Features en beta (voir permissions rôle) |

### Catégorie 3 — COMMUNITY

| Channel | Type | Description |
|---|---|---|
| `#events-cesoir` | text | Soirées CeSoir à Montpellier + ailleurs |
| `#dating-fails-anon` | text | Storytime anonyme (modération active) |
| `#montpellier-chat` | text | Discussions MTP, bars, sorties |
| `#memes` | text | Zone meme libre |

### Catégorie 4 — FOUNDER

| Channel | Type | Description |
|---|---|---|
| `#journal-founder` | text | Je share ma roadmap, mes ratés, mes wins |
| `#ask-me-anything` | text | AMA hebdomadaire tous les vendredis 18h |
| `#recrutement` | text | Si on embauche / cherche des freelances |

---

## Rôles

| Rôle | Couleur | Pouvoir |
|---|---|---|
| `Founder` | Violet #8B5CF6 | Admin total |
| `Insider` | Or #FBBF24 | Accès à tout sauf admin |
| `Verified` | Vert #00FF88 | Sous-ensemble des Insiders avec compte CeSoir verified sur l'app |
| `Beta` | Rose #EC4899 | Accès à #beta-testers + preview features en dev |
| `Bar Partenaire` | Bleu #3B82F6 | Accès à #events-cesoir + channel dédié privé |

**Règle d'attribution** :
- `Insider` : donné manuellement par le founder après un message de bienvenue
- `Verified` : auto-attribué quand le user connecte son compte CeSoir verified
  (bot custom — voir section Bots)
- `Beta` : volontariat, dans `#ask-me-anything` avec la question "qui veut tester
  la feature X"
- `Bar Partenaire` : donné quand signature partnership confirmée

---

## Onboarding bot — questions

Bot `MEE6` ou `Carl-bot` configuré avec le flow suivant :

**Message de bienvenue privé** au join :

> Salut !
>
> Bienvenue sur CeSoir Insiders. Vous êtes parmi les 20 premières personnes à
> rejoindre cette communauté. Avant de vous donner l'accès aux channels, 3
> questions :

**Q1 — Présente-toi en 2 phrases (prénom, âge, Montpellier ou ailleurs, ce que
tu fais dans la vie).**

**Q2 — Tu es ici pour :**
- a) Tester l'app en beta
- b) Partager des idées de features
- c) Juste voir l'évolution du projet
- d) Autre (précise)

**Q3 — Une galère que tu as eue avec un dating app classique (Tinder, Bumble,
Hinge, autres). Précise ce qui t'a le plus agacé.**

Après les 3 réponses postées dans `#welcome` :
- Attribution automatique du rôle `Insider`
- Envoi d'un message welcome par le founder dans les 24h
- Épinglage de la présentation dans `#welcome`

---

## Code de conduite (`#regles`)

```
CESOIR INSIDERS — CODE DE CONDUITE

1. RESPECT. Zéro tolérance harcèlement, discrimination, homophobie, misogynie,
   racisme. Ban direct, pas de warning.

2. FEEDBACK CONSTRUCTIF. "C'est nul" ne sert à rien. "C'est nul parce que X
   me coûte Y étapes et je préfèrerais Z" c'est l'or.

3. CONFIDENTIALITÉ. Tu vois des features en beta (channel #beta-testers).
   Pas de screenshot publiable sans accord du founder.

4. PAS DE SPAM. Pas de pub perso, pas de liens externes crypto/ponzi/MLM.

5. DATING-FAILS-ANON. Si tu partages une anecdote qui implique quelqu'un d'autre,
   change le prénom et les détails identifiants.

6. MODÉRATION. 3 reports concordants = timeout 24h. Décision finale par le
   founder.
```

## Rules Discord officielles (à coller dans `#regles` aussi)

1. Respect zéro tolérance
2. Feedback constructif
3. Pas de pub perso
4. Contenu SFW partout sauf channels NSFW explicites (il n'y en a pas)
5. Un sujet = un thread, pas de fork dans le canal principal
6. Mentions @here et @everyone réservées au founder

---

## Bots recommandés

| Bot | Usage |
|---|---|
| **MEE6** | Onboarding, auto-roles, welcome messages |
| **Dyno** | Modération auto (mute, kick, ban, anti-raid) |
| **Statbot** | Analytics du serveur (messages, activité par channel) |
| **YAGPDB** | Reaction roles (Verified / Beta / Bar Partenaire) |
| **Custom CeSoir Bot** (v2, optionnel) | Sync Discord role ↔ compte CeSoir verified |

## Premiers 20 users à inviter depuis waitlist

À extraire de la waitlist CeSoir (via Supabase) une fois le seuil atteint.
Critères d'éligibilité :

1. Compte créé dans les 30 premiers jours
2. Onboarding 100% complété (photo + bio + mode actif)
3. Au moins 1 RSVP à une soirée
4. Ville = Montpellier
5. Pas de report ni ban dans les 7 derniers jours

**Query Supabase à préparer** :
```sql
SELECT p.id, p.name, p.avatar_url, u.email, p.created_at,
       count(r.event_id) FILTER (WHERE r.status IN ('going','interested')) AS rsvps
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.event_rsvps r ON r.user_id = p.id
WHERE p.city = 'Montpellier'
  AND p.avatar_url IS NOT NULL
  AND p.bio IS NOT NULL
  AND p.created_at >= now() - interval '30 days'
GROUP BY p.id, u.email
HAVING count(r.event_id) >= 1
ORDER BY p.created_at ASC
LIMIT 20;
```

Puis envoi d'un email perso avec invite permanent Discord :

```
Salut [PRÉNOM],

Tu fais partie des 20 premières personnes à avoir vraiment utilisé CeSoir à
Montpellier. Merci.

J'aimerais t'inviter sur le serveur Discord privé qu'on est en train de
monter. 20 personnes max pour le Wave 1. Feedback direct, features en beta,
AMA hebdomadaire avec moi, et pas mal de memes sur les paywalls Tinder.

Lien : [DISCORD_INVITE_PERMANENT]

Pas d'obligation, pas de chiant. Si Discord te parle pas, tout va bien.

[NOM]
```

## Launch timeline

| Semaine | Action |
|---|---|
| S0 | Création serveur + setup rôles + channels + règles |
| S0 | Install MEE6 + Dyno + YAGPDB |
| S1 | Invitation des 5 premiers insiders (cercle proche) |
| S2 | Ouverture à 10 insiders depuis waitlist |
| S3 | Ouverture à 20 insiders + premier AMA vendredi |
| S4 | Review engagement, si <30% actifs → pivot |

## Success metrics

- **Actifs hebdo** : 70%+ des insiders envoient au moins 1 message/sem
- **Feedback loop** : bugs reportés → fixés → annoncés dans `#annonces` sous 48h
- **Retention** : <10% quittent le serveur dans les 30 premiers jours
- **Virality** : chaque insider invite au moins 1 nouvelle personne qualifiée
  à la fin du Wave 1

## KPIs signaling DANGER

Si au bout de 3 semaines :
- `<30%` d'insiders actifs → problème de cohésion/curation
- Plus de 5 départs → le contenu/le ton a loupé
- Zéro feedback produit dans `#feedback` → communauté passive, pas de repeat
  engagement. **Forcer le founder à poser des questions tous les 2 jours** pour
  relancer.

# CeSoir — Brand Guidelines

**Version : 1.0 · 23 avril 2026 · Assets versionnés — pas de modifications visuelles sans ADR.**

> Ce document consolide l'identité visuelle, la voix, la photographie et les règles d'usage de la marque CeSoir.
> Source des tokens : [`src/lib/design-tokens.ts`](../src/lib/design-tokens.ts). Assets logo : [`src/brand/`](../src/brand/).

---

## Table des matières

1. [Identité visuelle](#1-identité-visuelle)
2. [Voix de marque par contexte](#2-voix-de-marque-par-contexte)
3. [Illustrations & photographie](#3-illustrations--photographie)
4. [Do's & Don'ts](#4-dos--donts)
5. [Templates & downloads](#5-templates--downloads)

---

## 1. Identité visuelle

### 1.1 Palette — double identité

CeSoir vit sur **deux palettes qui ne se mélangent jamais** :

#### Palette LANDING (public, cinématique, dark)

Utilisée sur les pages publiques avant login : landing, `/manifesto`, `/why-free`, OG images générales.

| Token | Hex | Usage |
|---|---|---|
| `landing.bg` | `#0A0A0D` | Fond cinématique |
| `landing.fg` | `#FFFFFF` | Texte principal |
| `landing.violet` | `#8B5CF6` | Accent primaire (lune, CTA) |
| `landing.rose` | `#EC4899` | Accent secondaire (gradient) |
| `landing.vert` | `#00FF88` | Fluo accent (sparkle, success) |

#### Palette APP (post-login, White Fluo Minimal)

Utilisée sur toutes les surfaces produit après authentification.

| Token | Hex | Usage |
|---|---|---|
| `app.bg` | `#FFFFFF` | Fond principal |
| `app.bgCard` | `#FAFAFA` | Fond cards, layered surfaces |
| `app.bgDark` | `#111111` | Fond inversé (carousel, modals dark) |
| `app.text` | `#111111` | Texte principal |
| `app.textMuted` | `#888888` | Texte secondaire |
| `app.border` | `#EBEBEB` | Séparateurs, borders |
| `app.violet` | `#8B5CF6` | Accent primaire |
| `app.vert` | `#00FF88` | Accent secondaire, succès |
| `app.rose` | `#EC4899` | Super-like, match toasts |

**Règle dure :** aucun hex hors tokens. Tout nouveau besoin passe par un ajout dans `src/lib/design-tokens.ts` + ADR.

### 1.2 Typographie

- **Display** : Space Grotesk — pour tout ce qui est titre, wordmark, CTA fort, chiffres.
  Tracking : `-0.02em` à `-0.04em` sur les tailles display/hero.
- **Body** : Outfit — pour tout texte courant (paragraphes, labels, descriptions).
  Tracking : par défaut (0em), léger `+0.01em` pour les captions.

Font stack (tokens typés) :

```ts
export const fonts = {
  display: "var(--font-space-grotesk), sans-serif",
  body: "var(--font-outfit), sans-serif",
};
```

8 tailles canoniques : `caption 10px · micro 11px · small 12px · body 14px · title 16px · heading 22px · display 32px · hero 48px`.

### 1.3 Logo

La marque CeSoir = **lune violette croissante (☾) + wordmark "CeSoir"**.

4 versions officielles dans `src/brand/` :

| Fichier | Contexte |
|---|---|
| `logo-full.svg` | Défaut — moon violet + wordmark noir, fond clair |
| `logo-mark-only.svg` | Favicon, app icon, watermarks |
| `logo-mono-dark.svg` | Landing header, fond sombre (`#0A0A0D`) — tout blanc |
| `logo-mono-light.svg` | App header, fond clair (`#FFFFFF`) — tout noir |

#### Règles d'usage logo

| Do | Don't |
|---|---|
| Lune violette `#8B5CF6` (palette app) ou blanche (mono-dark) | ❌ Lune rose, verte, bleue ou dégradée |
| Espace minimum autour = hauteur de la lune | ❌ Logo collé au bord sans padding |
| Utiliser le SVG fourni | ❌ Re-dessiner la lune à la main ou depuis unicode brut dans un rendu design |
| Taille minimale : 120 px de large (logo-full), 24 px (mark-only) | ❌ < 24px pour le mark-only (illisible) |

**La forme et l'angle de la lune ☾ sont verrouillés.** Toute modification nécessite un ADR formel dans `docs/architecture/decisions/`.

---

## 2. Voix de marque par contexte

### 2.1 Landing (public, avant login)

**Registre :** cinématique, poétique, ambition, contre-culture.

**Ce qu'on fait :**
- Phrases courtes, percutantes, presque manifestes.
- Vocabulaire du cinéma, de la nuit, de la ville.
- Premier degré mais sans grandiloquence — on parle aux gens qui en ont marre des apps.
- Tutoiement universel.

**Exemples landing :**

> ☾ Personne ne dîne seul ce soir à Montpellier.
>
> Swiper, c'est un jeu vidéo triste.
> Ce soir, on joue pour de vrai.
>
> Le feed se vide à 6 h. Recommence demain.

### 2.2 App (post-login, produit)

**Registre :** direct, chaleureux, anti-bullshit, efficacité.

**Ce qu'on fait :**
- Phrases courtes et informatives.
- Micro-copy empathique : quand quelque chose rate, on l'explique simplement.
- Humour léger dans les empty states, les 404, les toasts.
- Pas d'emojis dans le produit (sauf cas réservés : réactions, badges).
- Jamais de "Please" — toujours un ton pair-à-pair.

**Exemples app :**

> Aucun mode pour ce soir ? Choisis-en un avant 20 h — le feed se vide à 6 h.
>
> Tu as 3 nouveaux matchs · message-les avant que ça refroidisse.
>
> Pas de karma pour l'instant — 3 rendez-vous et tu apparais.

### 2.3 Presse & investisseurs

**Registre :** clair, factuel, chiffré, premier degré — avec une touche d'ambition.

**Ce qu'on fait :**
- Une idée par paragraphe.
- Toujours un chiffre clé dans les 3 premières lignes.
- Pas de jargon startup ("growth hacking", "virality", "engagement loop" → interdits).
- On parle de rencontre, de ville, de quartier, de soirées — pas de "user journey".

### 2.4 Table contextes → ton

| Contexte | Longueur | Ton | Emoji | Exemple |
|---|---|---|---|---|
| Landing hero | 1 phrase | Cinématique | ☾ OK | "Personne ne dîne seul ce soir." |
| Landing body | 2-3 phrases | Manifeste | ❌ | "On remplace l'inventaire par un instant." |
| Push notif | 80 chars | Direct, utile | ⚠️ parcimonie | "3 matchs ce soir. Envoie avant 6 h." |
| Toast succès | 40 chars | Chaleureux | ❌ | "Match ! Dites-vous bonsoir." |
| Erreur | 60 chars | Empathique | ❌ | "Connexion perdue — on reprend dans 5 s." |
| Empty state | 2 lignes | Encourageant | ❌ | "Rien ici. Change de mode ou reviens à 18 h." |
| Email transactionnel | Sobre | Pro, chaleureux | ❌ | "Quelqu'un veut te voir ce soir." |

---

## 3. Illustrations & photographie

### 3.1 Photographie — règles Unsplash

On utilise **uniquement** des photos qui ressemblent à la vraie vie d'une ville le soir. **Pas de stock cheesy.**

#### Do

- Scènes de vie nocturne réelle : terrasses, marchés du soir, vélos, rues mouillées.
- Lumières sodium, néons, bougies — jamais de flash brutal.
- Mains, ombres, silhouettes — on suggère la présence, on ne fétichise pas les visages.
- Grain argentique léger accepté (jamais photoshop HDR).
- Local = Montpellier reconnaissable quand possible (la Comédie, l'Écusson, Port Marianne).

#### Don't

- ❌ Couples "stock photo" en contre-jour doré.
- ❌ Smartphones mis en scène avec app Tinder-like ouverte.
- ❌ Tables de restaurant avec 4 verres de vin et 4 mains qui trinquent.
- ❌ Photos d'influenceuses Instagram posées devant un mur rose.
- ❌ Tout ce qui a l'air généré par IA avec des mains bizarres.

### 3.2 Illustrations

Pas d'illustrations mascotte. L'identité est typographique + photographique.
Si un pictogramme est nécessaire : **Lucide icons** (déjà dans le stack), trait 1.5 px, couleur tokens uniquement.

### 3.3 Emojis

- Autorisés sur landing : ☾ uniquement (marque).
- Autorisés dans le produit : réactions utilisateur, badges karma.
- Interdits : dans le wording officiel (hero, CTA, press, legal, comm).

---

## 4. Do's & Don'ts

### 4.1 Palette

| ✓ Do | ✗ Don't |
|---|---|
| Violet `#8B5CF6` pour tous les accents primaires | Violet Material Design `#9C27B0` |
| Vert fluo `#00FF88` pour success/sparkle | Vert Bootstrap `#28A745` |
| Fond `#FFFFFF` pur en app | Toute teinte grisée style `slate-50` |
| Mélange visible uniquement : landing OU app | Un écran qui mixe les deux palettes |

### 4.2 Typographie

| ✓ Do | ✗ Don't |
|---|---|
| Space Grotesk Bold pour tous les H1/H2 | Montserrat, Poppins, Inter pour les titres |
| Outfit Regular pour le body | Space Grotesk en body (trop display) |
| Tracking `-0.02em` sur hero/display | Tracking `+letter-spacing` > 0.05em partout |
| 8 tailles canoniques | Tailles custom (`text-[13.5px]`) |

### 4.3 Logo

| ✓ Do | ✗ Don't |
|---|---|
| Utiliser le SVG officiel depuis `src/brand/` | Re-dessiner, copier l'emoji ☾, screenshot |
| Lune toujours orientée comme dans le master | Retourner la lune, la faire pleine, la rendre 3D |
| Padding min = hauteur de la lune | Lune collée au texte du layout |

### 4.4 Copy & voix

| ✓ Do | ✗ Don't |
|---|---|
| "Personne ne dîne seul ce soir" | "Trouve l'amour de ta vie" |
| "Le feed se vide à 6 h" | "Swipe 24/7" |
| "Dis-toi bonsoir" | "Send a message to your match 💘" |
| Tutoiement universel | Vouvoiement dans l'app |
| Emojis parcimonie | Emojis sur chaque CTA |

---

## 5. Templates & downloads

Tous les assets sont versionnés dans le repo :

### Logo

- [`src/brand/logo-full.svg`](../src/brand/logo-full.svg)
- [`src/brand/logo-mark-only.svg`](../src/brand/logo-mark-only.svg)
- [`src/brand/logo-mono-dark.svg`](../src/brand/logo-mono-dark.svg)
- [`src/brand/logo-mono-light.svg`](../src/brand/logo-mono-light.svg)
- [`src/brand/favicon-config.md`](../src/brand/favicon-config.md) — instructions pour générer favicon stack complète

### OG / Social share (Edge Runtime)

- [`src/app/opengraph-image.tsx`](../src/app/opengraph-image.tsx) — default, 1200×630
- [`src/app/(app)/events/[id]/opengraph-image.tsx`](../src/app/(app)/events/[id]/opengraph-image.tsx) — event share
- [`src/app/p/[id]/opengraph-image.tsx`](../src/app/p/[id]/opengraph-image.tsx) — profile share

### Templates flyers (SVG → Figma import)

- [`src/brand/templates/event-flyer-template.svg`](../src/brand/templates/event-flyer-template.svg) — 1080×1350 (Instagram Story)
- [`src/brand/templates/event-og-template.svg`](../src/brand/templates/event-og-template.svg) — 1200×630 (OG landscape)

### Press kit

- [`docs/press/ONE_PAGER.md`](./press/ONE_PAGER.md)
- [`docs/press/PITCHES.md`](./press/PITCHES.md)
- [`docs/press/FAQ.md`](./press/FAQ.md)
- [`docs/press/FOUNDER_BIO.md`](./press/FOUNDER_BIO.md)
- [`docs/press/LOGOS.md`](./press/LOGOS.md)
- [`docs/press/SCREENSHOTS.md`](./press/SCREENSHOTS.md)

### Documents fondateurs

- [`docs/MANIFESTO.md`](./MANIFESTO.md) — manifeste produit
- [`docs/PITCH_DECK.md`](./PITCH_DECK.md) — deck investisseurs
- [`docs/VALUES.md`](./VALUES.md) — valeurs internes
- [`docs/CULTURE.md`](./CULTURE.md) — culture équipe

---

<div align="center">

☾ _Ce kit est versionné — pas de modifications visuelles sans ADR._

**CeSoir** · Montpellier · 2026

</div>

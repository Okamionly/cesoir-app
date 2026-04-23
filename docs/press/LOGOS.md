# Logos CeSoir — guide usage presse

## Fichiers à fournir aux médias

À livrer dans un dossier `cesoir_logos.zip` :

```
cesoir_logos/
├── svg/
│   ├── cesoir_logo_full.svg           — logo complet (lune + mot "CeSoir")
│   ├── cesoir_logo_moon.svg           — juste la lune
│   └── cesoir_logo_wordmark.svg       — juste "CeSoir" (typo)
├── png/
│   ├── cesoir_logo_full_512.png       — 512×512 transparent
│   ├── cesoir_logo_full_1024.png      — 1024×1024 transparent
│   ├── cesoir_logo_full_2048.png      — 2048×2048 transparent
│   ├── cesoir_logo_moon_512.png       — lune seule 512×512
│   └── cesoir_logo_wordmark_1024.png  — wordmark 1024×256
└── palette/
    ├── cesoir_colors.pdf              — palette officielle
    └── cesoir_colors.png              — référence visuelle
```

## Palette officielle

| Nom | Hex | Usage |
|---|---|---|
| Violet (primaire) | `#8B5CF6` | Logo lune, accents, CTAs |
| Vert fluo | `#00FF88` | Succès, accents secondaires, icônes actives |
| Blanc pur | `#FFFFFF` | Fonds app |
| Noir profond | `#111111` | Textes app, strip admin |
| Dark cinema | `#0A0A0D` | Fonds landing |
| Rose | `#EC4899` | Accents match, super-like |

**Dégradé signature** (à réserver au logo et aux CTAs premium) :
```
linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)
```

## Règles d'usage du logo

**FAIRE** :
- Utiliser le SVG en priorité
- Respecter l'espace vide minimum autour du logo (= hauteur de la lune ☾)
- Version monochrome autorisée sur fonds photo denses
- Taille minimum : 48px de hauteur

**NE PAS FAIRE** :
- Modifier les couleurs de la lune (toujours violet #8B5CF6)
- Incliner, déformer, ajouter d'effets (ombre, néon, glow) autres que ceux officiels
- Remplacer la lune par une autre icône
- Mixer avec d'autres logos dans le même bloc visuel
- Utiliser sur fond rouge ou orange (contraste rompu)

## Typographie

- **Display / titres** : Space Grotesk Bold (Google Fonts, open source)
- **Corps / UI** : Outfit Regular (Google Fonts, open source)

## Consigne de remplissage (pour le founder)

Le logo actuel est généré via CSS/Unicode (`☾`). Pour un asset SVG propre à
distribuer à la presse :

1. Ouvrir Figma
2. Créer frame 1024×1024
3. Caractère ☾ (U+263E) en Space Grotesk Bold, taille ~600px, couleur #8B5CF6
4. Ajouter glow : box-shadow simulé par duplicate + blur + opacity 40%
5. Exporter SVG + PNG (1x/2x/4x) + PDF

## Fallback SVG (à utiliser tant que pas d'asset officiel)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <text
    x="50%" y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Space Grotesk, sans-serif"
    font-weight="700"
    font-size="380"
    fill="#8B5CF6"
    filter="url(#glow)"
  >☾</text>
</svg>
```

Sauvegarder ce snippet en `public/logo-fallback.svg` et pointer dessus depuis
les meta tags OG/Twitter tant qu'un asset final n'est pas livré.

## Livraison presse

Après création des assets finaux :

- Upload dans `public/press/logos/` du repo
- Générer URL publique stable : `https://cesoir.app/press/logos/cesoir_logos.zip`
- Ajouter le lien dans `docs/press/README.md`

# Favicon & App Icons — CeSoir

Version: 1.0 — 2026-04-23
Source master: `src/brand/logo-mark-only.svg` (64×64, violet #8B5CF6)

## Génération (étapes)

1. Ouvrir `src/brand/logo-mark-only.svg` dans Figma/Illustrator/Inkscape et exporter **en PNG 512×512** fond transparent.
2. Aller sur <https://realfavicongenerator.net> et uploader le PNG 512×512.
3. Configurer :
   - **iOS** : background `#FFFFFF` (l'icône vit sur l'app store qui a un fond blanc), padding 12 %.
   - **Android Chrome** : theme color `#8B5CF6`, background `#FFFFFF`, maskable ON.
   - **macOS Safari** : pinned tab `#8B5CF6`.
   - **Windows** : tile color `#8B5CF6`.
4. Télécharger le package et remplacer `public/favicon.ico` + `public/apple-touch-icon.png` + `public/android-chrome-*.png`.
5. Mettre à jour `src/app/manifest.ts` avec `theme_color: "#8B5CF6"` et `background_color: "#FFFFFF"`.

## Fichiers attendus (final)

| Fichier | Taille | Usage |
|---|---|---|
| `public/favicon.ico` | 16, 32, 48 multi | Desktop tabs |
| `public/favicon-16x16.png` | 16×16 | Fallback |
| `public/favicon-32x32.png` | 32×32 | Fallback |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/android-chrome-192x192.png` | 192×192 | Android A2HS |
| `public/android-chrome-512x512.png` | 512×512 | Splash / maskable |
| `public/safari-pinned-tab.svg` | SVG mono | macOS pinned tabs (mono noir) |

## Règles non-négociables

- **Lune jamais déformée** : exporter depuis le master SVG, ne jamais re-dessiner.
- **Palette** : seule le violet `#8B5CF6` autorisé sur l'icône produit.
- **Padding** : 12 % margin intérieur pour les versions maskable Android (sinon rogné par les launchers).
- **Pas de wordmark** dans les favicons — jamais lisible <48 px.
- **Pas de gradient** dans l'icône produit — plat violet pur pour lisibilité iconographie.

## ADR requis si changement

Toute modification de cette configuration requiert un nouvel ADR dans `docs/architecture/decisions/` — la forme de la lune est un asset marque, pas un paramètre de design.

# QA Live Test — CeSoir App

**Date** : 2026-04-19
**Environnement** : http://localhost:3000 (dev server)
**Mode** : Anonyme (non authentifié)
**Outil** : Playwright MCP
**Routes testées** : 8 (7 publiques + 1 protégée pour vérif redirect)

---

## Résumé exécutif

| Métrique | Valeur |
|---|---|
| Pages screenshot OK | 9/9 |
| Console errors total | 1 (sur /login submit vide) |
| Erreurs hydration/React | 0 |
| Crashes | 0 |
| Bugs critiques 🔴 | **2** |
| Bugs majeurs 🟠 | **3** |
| Bugs mineurs 🟡 | **4** |
| Redirect /browse → /login | OK (proxy.ts/middleware fonctionne) |

---

## Bugs prioritaires

### 🔴 CRITIQUES (à fixer avant prod)

1. **[security/leak]** `/safety` accessible sans authentification — la page interne app (SOS Urgence, Check-in, Cercle de confiance) s'affiche en mode anonyme. Le proxy.ts/middleware ne protège PAS cette route. Données utilisateur potentiellement exposées si la page tente de fetch.
   - Fichier suspect : `app/safety/page.tsx` ou middleware
   - Fix : ajouter `/safety` à la liste des routes protégées dans middleware/proxy.ts

2. **[ux/leak]** Pages publiques (`/about`, `/safety`, `/cgu`, `/privacy`) affichent la **navigation app interne** en bas (Explorer / Carte / Chat / Modes / Profil) — destinée aux users authentifiés. Confusion totale pour visiteurs, et clic sur ces liens va probablement crasher ou redirect.
   - Fichier suspect : layout partagé `app/(public)/layout.tsx` qui include BottomNav par erreur
   - Fix : conditionner l'affichage de BottomNav sur état auth

### 🟠 MAJEURS

3. **[validation]** `/login` — clic "Se connecter" avec champs vides envoie un POST `/api/auth/login` qui retourne **400 Bad Request**. Pas de validation client-side. Mauvaise UX + waste de requête backend.
   - Fix : `required` HTML5 ou validation Zod côté client avant submit

4. **[design/inconsistance]** Incohérence design entre pages auth :
   - `/login` : fond noir/violet dégradé + cards translucides (style "dark fluo")
   - `/register` : même style dark
   - `/forgot-password` : fond BLANC clair (style "white fluo")
   - Selon CLAUDE.md, la palette CeSoir est "White Fluo Minimal après login" → la cohérence doit être : auth = clair OU auth = sombre, pas mixte
   - Fix : choisir un style unique pour le tunnel auth

5. **[content/heading]** `/cgu` et `/privacy` n'ont **aucun h1 visible** affiché dans la page (le `<title>` HTML est correct mais à l'écran, on saute direct à "Dernière mise à jour"). Mauvais SEO + accessibilité.
   - Fix : ajouter `<h1>Conditions Générales</h1>` et `<h1>Politique de Confidentialité</h1>` visibles

### 🟡 MINEURS

6. **[ux]** `/login` — pas de loading state visible sur le bouton "Se connecter" pendant le POST (testé : pas de spinner, bouton reste actif).

7. **[icon/widget]** Icône "N" en bas à gauche présente sur toutes les pages — c'est probablement le bouton dev Next.js dev tools, mais devrait être caché en build prod.

8. **[ux]** `/about` — bulle violette flottante en bas à droite (FAB ?) sans label/aria — utilité incertaine.

9. **[content]** `/about` section "L'équipe" — placeholders "Fondateur" / "CTO" sans noms réels. Soit on remplit, soit on retire jusqu'à avoir du vrai contenu.

---

## Détail page par page

### Page : /
- **Status** : 🟢
- **Console errors** : 0
- **Screenshot** : qa-screenshots/landing.png
- **Issues** : aucune
- **Notes** : Landing dark fluo conforme aux specs (Plasma Ocean + lune violette + typo "Maintenant" gradient). Indicateur "INTRO · molette · flèches · espace" pour navigation cinématique présent. Logo lune ☾ violet présent.

### Page : /login
- **Status** : 🟠
- **Console errors** : 1 (POST 400 sur submit vide)
- **Screenshot** : qa-screenshots/login.png
- **Issues** :
  - [bug] Submit avec champs vides → POST /api/auth/login → 400 (pas de validation client)
  - [missing] Pas de loading state au submit
  - [design] Style dark fluo, incohérent avec /forgot-password (white)
- **Notes** : Form email + password + lien "Mot de passe oublié ?" + lien "Créer un compte" tous présents. Logo CeSoir en haut. Bouton CTA gradient violet→vert.

### Page : /register
- **Status** : 🟢
- **Console errors** : 0
- **Screenshot** : qa-screenshots/register.png
- **Issues** : aucune
- **Notes** : Multi-step form 4 étapes avec progressbar. Bouton "Suivant" désactivé tant que champs requis vides (bonne UX). Sélection genre + orientation par boutons. Champs prénom/age/email/password tous présents. Style cohérent avec /login.

### Page : /about
- **Status** : 🟠
- **Console errors** : 0
- **Screenshot** : qa-screenshots/about.png
- **Issues** :
  - [leak] Bottom nav app (Explorer/Carte/Chat/Modes/Profil) affichée alors que non authentifié
  - [content] Équipe avec placeholders "Fondateur"/"CTO" sans noms
  - [ux] FAB violet en bas à droite sans label
- **Notes** : Sections "Nos valeurs" (Connexion/Respect/Gratuit/Inclusif) propres avec emojis. Header "À propos" minimal avec back-arrow.

### Page : /safety
- **Status** : 🔴
- **Console errors** : 0
- **Screenshot** : qa-screenshots/safety.png
- **Issues** :
  - [security] **Page sécurité interne accessible sans auth** — montre SOS Urgence, Check-in 30min, Cercle de confiance (3 slots), historique. Devrait redirect vers /login.
  - [leak] Bottom nav app présente
- **Notes** : Page magnifique en soi (carte rouge SOS, cercle confiance vide 0/3) mais ne devrait PAS être en accès libre.

### Page : /cgu
- **Status** : 🟡
- **Console errors** : 0
- **Screenshot** : qa-screenshots/cgu.png
- **Issues** :
  - [a11y] Pas de h1 visible (saute direct à "Dernière mise à jour")
  - [leak] Bottom nav app présente
- **Notes** : 8 paragraphes contenu CGU corrects (âge 18+, responsabilité, modération, IP). Header "Retour" en haut à gauche.

### Page : /privacy
- **Status** : 🟡
- **Console errors** : 0
- **Screenshot** : qa-screenshots/privacy.png
- **Issues** :
  - [a11y] Pas de h1 visible
  - [leak] Bottom nav app présente
- **Notes** : Contenu RGPD complet (collecte, usage, GPS, vente données, chiffrement, rétention 30j, droits, cookies). Email contact `privacy@cesoir.app` mentionné.

### Page : /forgot-password
- **Status** : 🟡
- **Console errors** : 0
- **Screenshot** : qa-screenshots/forgot-password.png
- **Issues** :
  - [design] Style WHITE fluo alors que /login et /register sont DARK
- **Notes** : Form simple email + bouton "Envoyer le lien" + lien "Retour à la connexion". Submit champ vide ne génère pas d'erreur (pas de POST envoyé apparemment, validation HTML native).

### Test : /browse (route protégée)
- **Status** : 🟢
- **Comportement** : Redirige bien vers `/login` ✓
- **Screenshot** : qa-screenshots/browse-redirect.png
- **Notes** : Le middleware/proxy.ts protège correctement `/browse`. À vérifier pour les autres routes app : `/explore`, `/chat`, `/modes`, `/profile`, `/map` — et surtout `/safety` qui actuellement N'EST PAS protégée (cf bug critique #1).

---

## Recommandations actions

### Priorité 1 (cette semaine)
- Ajouter `/safety` à la liste routes protégées dans middleware
- Conditionner BottomNav sur état auth (cacher si !user)
- Ajouter validation client login form (HTML5 `required` minimum)

### Priorité 2 (sprint suivant)
- Décider style unique tunnel auth (dark OU light)
- Ajouter h1 visibles sur /cgu et /privacy
- Loading state bouton login

### Priorité 3 (backlog)
- Remplir équipe /about avec vrais noms ou retirer la section
- Cacher Next.js dev tools en prod
- Auditer autres routes potentiellement non protégées (/explore, /chat, /modes, /profile, /map)

---

## Méthodologie

Pour chaque route :
1. `browser_navigate` → URL
2. `browser_snapshot` (depth 3-10 selon besoin)
3. `browser_take_screenshot` → qa-screenshots/<slug>.png
4. `browser_console_messages` (level error, all)
5. Click sur 1-2 éléments interactifs principaux
6. Re-check console après interaction

Total : ~15 navigations, 9 screenshots, 0 hydration errors, 1 erreur réseau (login 400 attendue avec champs vides).

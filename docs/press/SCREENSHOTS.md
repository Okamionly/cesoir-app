# Screenshots — checklist presse

Les 5 screenshots obligatoires à joindre à tout envoi press, en **PNG haute
résolution** (1080×2340 iPhone standard, ou captures réelles PWA installée).

---

## 1. `/feed` — Feed social local

**Ce qu'on veut montrer** : la ville en temps réel, les activités dispo ce soir,
les reactions Gen Z (🔥❤️🎉), l'aspect communautaire.

**Setup** :
- Compte test avec feed peuplé (5+ activités récentes visibles)
- Ville : Montpellier centre
- Mode : tous modes actifs
- Notification badge : 2-3
- Fichier : `cesoir_screenshot_01_feed.png`

## 2. `/map` — Map avec hotspots

**Ce qu'on veut montrer** : géolocalisation des profils dispo, des bars
partenaires, des hotspots dynamiques.

**Setup** :
- Montpellier centré (Écusson / Comédie)
- 8-12 pins visibles dont 2-3 featured (pins violets)
- Cluster avec compteur visible
- Filter : "ce soir" actif
- Fichier : `cesoir_screenshot_02_map.png`

## 3. `/events` — Rubrique Soirées

**Ce qu'on veut montrer** : la rubrique B2B, l'éditorial "soirées à Montpellier
ce soir", le mix gratuit/payant.

**Setup** :
- 4-5 event cards visibles scrollées
- Au moins 1 featured en haut (pin violet)
- Au moins 1 gratuit
- Dates de ce soir / ce week-end
- Fichier : `cesoir_screenshot_03_events.png`

## 4. `/modes` — Les 14 modes de rencontre

**Ce qu'on veut montrer** : la diversité des modes — pas juste du dating
romantique.

**Setup** :
- Grid 2-colonnes avec 6-8 modes visibles
- Modes sélectionnés mis en avant : Solo Dîner, Plus One, Night Owl, Breakup
- Mode actif épinglé en haut avec l'animation cinematic hover
- Fichier : `cesoir_screenshot_04_modes.png`

## 5. `/chat` — Conversation

**Ce qu'on veut montrer** : l'interface chat safety-first, pas de pubs, pas de
push paywall.

**Setup** :
- Conversation avec un match, 8-10 messages échangés
- Message le plus récent : question ouverte ("on se voit ce soir au Rockstore ?")
- Badge "verified" visible sur le profil
- Pas d'encart premium, pas de pub
- Fichier : `cesoir_screenshot_05_chat.png`

---

## Bonus — à joindre si le media pousse un long-form

### 6. `/profile` — Profil utilisateur

Profil personnel, vue depuis /profile. Montrer le badge "Early Moon" (☾) si
compte dans les 10 premiers.

### 7. `/safety` — Page safety

SOS button, trusted contacts, share location. Preuve que la safety est
first-class, pas un addon.

### 8. `/venues/dashboard` — Dashboard B2B

Screenshot du dashboard B2B (admin strip en haut, liste d'events, KPIs). Pour
les articles tech qui veulent voir le modèle business.

---

## Consignes techniques

- **Résolution** : 1080×2340 iPhone standard (ou 1179×2556 iPhone Pro).
- **Format** : PNG (pas JPG, pas de compression).
- **Status bar** : cachée ou clean (9:41 AM, batterie 100%, WiFi plein).
- **Device frame** : pas de frame (la presse encadrera selon son gabarit).
- **Accents linguistiques** : fr-FR, tout accentué correctement (é à è ç).
- **Données** : 100% test, pas de vrais users ni photos.

## Outils recommandés

- **Capture** : Chrome DevTools > Device Mode > "Capture full size screenshot"
- **Nettoyage** : Figma ou Photopea pour retirer status bar si besoin
- **Automatisation** (optionnelle) : script Playwright `scripts/press-screenshots.ts`
  qui génère les 5 captures en batch

## Livraison

Une fois les 5 PNG prêts :

1. Commit dans `public/press/screenshots/`
2. Générer URL publique : `https://cesoir.app/press/screenshots/cesoir_screenshot_XX.png`
3. Créer un ZIP consolidé `cesoir_screenshots.zip` en parallèle
4. Ajouter lien ZIP dans `docs/press/README.md`

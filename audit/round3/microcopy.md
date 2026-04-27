# UX Copy Audit — CeSoir (Round 3)
Date : 2026-04-26 | Langue cible : FR Gen Z (tu), EN fallback

---

## Top 20 Issues — classés par impact

---

### #1 — Accents manquants partout (impact critique — cohérence brand)
**Fichiers** : `safety/page.tsx`, `help/articles-data.ts`, `chat/page.tsx`, `profile/page.tsx`

Masse de strings sans accents dans les données statiques. Certaines visibles à l'écran, d'autres dans l'aria-label = lecteurs d'écran lisent "Securite" à voix haute.

| Actuel | Suggéré |
|---|---|
| "Retrouvez-vous toujours dans un lieu public et anime" | "Retrouvez-vous toujours dans un lieu public et animé" |
| "Prevenez un(e) ami(e)" | "Prévenez un(e) ami(e)" |
| "Faites confiance a votre instinct" | "Faites confiance à votre instinct" |
| "Tes alertes SOS et check-ins apparaitront ici." | "Tes alertes SOS et check-ins apparaîtront ici." |
| "Securite" (PageHeader title) | "Sécurité" |
| "Demarrer" (CATEGORY_LABELS) | "Démarrer" |
| "Problemes techniques" | "Problèmes techniques" |
| "Cercle de confiance" section: "Decouvrir" | "Découvrir" |
| "Reglages" (profile/page.tsx:433) | "Réglages" |
| "Deconnecter" (profile/page.tsx:463) | "Se déconnecter" |
| "FlashNotes recus" (chat/page.tsx:192) | "FlashNotes reçus" |
| "Brise-glaces suggeres" (chat/page.tsx:275) | "Brise-glaces suggérés" |
| "Conversations epinglees" | "Conversations épinglées" |

**Pourquoi** : Les accents manquants rompent la crédibilité — une app de rencontre Gen Z sans accent ressemble à une traduction automatique.

---

### #2 — Empty state browse : pas de raison, pas d'action alternative
**Fichier** : `browse/page.tsx:593`

| Actuel | Suggéré |
|---|---|
| "C'est tout pour ce soir" | "Tu as tout vu pour ce soir." |
| "Reviens plus tard ou change de mode" | "Change de mode ou reviens cette nuit — de nouveaux profils arrivent." |
| CTA : "Recommencer" | "Voir d'autres modes" |

**Pourquoi** : "Recommencer" recharge le même deck vide. Le CTA doit pointer vers un changement de contexte utile.

---

### #3 — Error state browse : générique et sans solution
**Fichier** : `browse/page.tsx:327`

| Actuel | Suggéré |
|---|---|
| `{error}` (variable brute serveur) | "On n'arrive pas à charger les profils. Vérifie ta connexion." |
| CTA : "Reessayer" (sans accent) | "Réessayer" |

**Pourquoi** : Exposer la string serveur brute = jargon technique en production. Toujours humaniser.

---

### #4 — Match cap overlay : accents + message ambigu
**Fichier** : `browse/page.tsx:401-409`

| Actuel | Suggéré |
|---|---|
| "Tu as atteint ta limite !" | "Tu as utilisé tous tes matchs ce soir." |
| "{matchesUsed} matchs utilises ce soir." | "{matchesUsed} matchs aujourd'hui." |
| "Reviens a {resetTime} ou passe Premium." | "Reviens à {resetTime} pour continuer — ou passe Premium pour illimité." |
| "Reviens a {resetTime} pour continuer." | "Reviens à {resetTime}." |

**Pourquoi** : "Limite" est péjoratif. "Utilisé tous tes matchs" est neutre et factuellement précis.

---

### #5 — Empty state plans : générique, ton passif
**Fichier** : `plans/page.tsx:114-117`

| Actuel | Suggéré |
|---|---|
| "Aucun plan pour le moment" | "Rien de prévu pour ce soir." |
| "Sois le premier a en creer un !" | "Lance le premier plan du quartier." |
| CTA : "Creer un plan" | "Créer un plan" (accent) |

**Pourquoi** : "Sois le premier" est un cliché. "Lance le premier plan du quartier" est plus ancré dans le contexte local de l'app.

---

### #6 — Plans : "interesses" sans accent + pluriel flou
**Fichier** : `plans/page.tsx:179`

| Actuel | Suggéré |
|---|---|
| "{n} interesses" | "{n} intéressé{n > 1 ? 's' : ''}" |

**Pourquoi** : Accord du participe + accent. Visible sur chaque carte plan.

---

### #7 — Plans CTA bouton "J'y vais" vs "Inscrit ✓" — ok, mais "Complet" manque d'empathie
**Fichier** : `plans/page.tsx:198`

| Actuel | Suggéré |
|---|---|
| "Complet" (état désactivé) | "Complet — liste d'attente ?" |

**Pourquoi** : Quand un plan est complet, ne pas fermer la porte — proposer une liste d'attente ou au moins un chemin de sortie. Même si la feature n'est pas encore là, le copy peut préparer le terrain.

---

### #8 — EmptyConversations : "Decouvre" sans accent
**Fichier** : `components/messages/EmptyConversations.tsx:71`

| Actuel | Suggéré |
|---|---|
| "Decouvre des profils et commence ta premiere conversation CeSoir." | "Découvre des profils et commence ta première conversation." |

**Pourquoi** : Deux accents manquants sur la phrase principale de l'empty state le plus visible.

---

### #9 — EmptyConversations CTA : trop descriptif, pas assez actif
**Fichier** : `components/messages/EmptyConversations.tsx:88`

| Actuel | Suggéré |
|---|---|
| "Decouvrir des profils" | "Explorer les profils" |

**Pourquoi** : "Explorer" = verbe d'action avec une notion de plaisir. "Découvrir" est le verbe utilisé dans tous les menus de nav — collision de hiérarchie.

---

### #10 — Signup step 1 : validation error trop technique
**Fichier** : `signup-quick/page.tsx:88`

| Actuel | Suggéré |
|---|---|
| "Email, mot de passe (8+ caractères), âge 18+ requis." | "Vérifie : email valide, mot de passe 8 caractères min, et tu dois avoir 18 ans." |

**Pourquoi** : L'erreur actuelle est une liste de champs, pas un guide. La suggestion guide dans l'ordre de saisie.

---

### #11 — Signup step 1 : "Inscription refusée" = ton brutal
**Fichier** : `signup-quick/page.tsx:128`

| Actuel | Suggéré |
|---|---|
| "Inscription refusée. Si l'email existe déjà, va sur /login." | "Cet email est déjà utilisé. Connecte-toi à la place." |

**Pourquoi** : "Refusée" est autoritaire. La vraie cause probable (email existant) mérite d'être la réponse principale, avec un CTA direct.

---

### #12 — Signup step 2 : géoloc "emoji + status text" comme seul feedback
**Fichier** : `signup-quick/page.tsx:418`

| Actuel | Suggéré |
|---|---|
| "📍 Demande de ta position..." | "Position en cours de détection..." |
| "📍 Position non partagée — tu pourras swiper en mode ville par défaut." | "Position non partagée. Tu verras quand même des profils dans ta ville." |
| "📍 Position détectée (précision ~{n} m)" | "Position détectée." |

**Pourquoi** : Afficher les mètres de précision est du debug UI. L'utilisateur ne sait pas si 300 m est bon ou mauvais.

---

### #13 — Signup step 3 : CTA arrow peu conventionnel en FR
**Fichier** : `signup-quick/page.tsx:501`

| Actuel | Suggéré |
|---|---|
| "Commencer à swiper →" | "Commencer" |

**Pourquoi** : La flèche "→" dans les CTA primaires est un pattern anglophone. En FR Gen Z, un CTA net sans ponctuation est plus propre. Le contexte (bouton pleine largeur, page de fin d'onboarding) suffit.

---

### #14 — Profile : "Montpellier, France" hardcodé
**Fichier** : `profile/page.tsx:248`

| Actuel | Suggéré |
|---|---|
| `Montpellier, France` (string litérale) | Dynamique depuis la DB — fallback : "Localisation non renseignée" |

**Pourquoi** : Tous les utilisateurs qui ne sont pas à Montpellier voient une information fausse. C'est un bug copy autant qu'un bug technique.

---

### #15 — Profile section "Reglages" : labels sans accents + "Confidentialite"
**Fichier** : `profile/page.tsx:436-442`

| Actuel | Suggéré |
|---|---|
| "Reglages" | "Réglages" |
| "Confidentialite" | "Confidentialité" |
| "Verification du compte" | "Vérification du compte" |
| "A propos" | "À propos" |

**Pourquoi** : Section navigation centrale — quatre labels visibles en permanence, tous sans accent.

---

### #16 — Profile aria-label "Parametres" manque accent
**Fichier** : `profile/page.tsx:141`

| Actuel | Suggéré |
|---|---|
| `aria-label="Parametres"` | `aria-label="Paramètres"` |

**Pourquoi** : Lecteurs d'écran lisent le mot phonétiquement — "Parametres" est illisible à voix haute.

---

### #17 — Safety : SOS confirmation dialog, ton trop neutre pour une urgence
**Fichier** : `safety/page.tsx:237`

| Actuel | Suggéré |
|---|---|
| "Ta position sera envoyee a tous tes contacts de confiance ({n} contact{s})." | "Ta position GPS va être envoyée maintenant à {n} contact{s}." |
| Boutons : "Annuler" / "Confirmer SOS" | "Annuler" / "Envoyer l'alerte" |

**Pourquoi** : Le futur "sera" crée une ambiguïté temporelle dans une situation d'urgence. "va être envoyée maintenant" est immédiat. "Confirmer SOS" répète le terme technique — "Envoyer l'alerte" est plus humain.

---

### #18 — Safety tips : "vous" au lieu de "tu" — incohérence tone
**Fichier** : `safety/page.tsx:17-24`

| Actuel | Suggéré |
|---|---|
| "Retrouvez-vous toujours dans un lieu public" | "Retrouve-toi toujours dans un lieu public" |
| "Prevenez un(e) ami(e)" | "Préviens un(e) ami(e)" |
| "Utilisez le bouton SOS" | "Utilise le bouton SOS" |
| "Ne partagez jamais" | "Ne partage jamais" |
| "Faites confiance" | "Fais confiance" |
| "Signalez tout" | "Signale tout" |

**Pourquoi** : Tout le reste de l'app est en "tu". Cette section bascule en "vous" — choc de cohérence majeur dans un contexte émotionnellement sensible.

---

### #19 — Chat : section header "FlashNotes recus" sans accent + mauvais cas
**Fichier** : `chat/page.tsx:192`

| Actuel | Suggéré |
|---|---|
| "FlashNotes recus" | "FlashNotes reçus" |
| "Brise-glaces suggeres" | "Brise-glaces suggérés" |
| "Epinglees" (aria-label) | "Épinglées" |

**Pourquoi** : Ces labels sont des titres de section — leur visibilité est haute.

---

### #20 — Help articles : category labels sans accents
**Fichier** : `help/articles-data.ts:26-34`

| Actuel | Suggéré |
|---|---|
| "Demarrer" | "Démarrer" |
| "Securite" | "Sécurité" |
| "Confidentialite" | "Confidentialité" |
| "Problemes techniques" | "Problèmes techniques" |

**Pourquoi** : Ces labels apparaissent dans les filtres du help center — visibles dès l'arrivée sur la page.

---

## Résumé par catégorie

| Catégorie | Issues | Priorité |
|---|---|---|
| Accents manquants (FR) | #1, #6, #8, #14, #15, #16, #18, #19, #20 | Critique — fix groupé en 20 min |
| Incohérence tu/vous | #18 | Critique — safety page |
| Empty states | #2, #5, #9 | Haute |
| Error messages | #3, #11 | Haute |
| CTAs | #4, #7, #13 | Moyenne |
| Formulaires / validation | #10, #12 | Moyenne |
| Bug copy (hardcodé) | #14 | Haute |

---

## Note de ton global

Le produit oscille entre Gen Z conversationnel ("C'est parti →", "Tu veux quoi ce soir ?") et registre formel/passif ("Inscription refusée", "Retrouvez-vous", "sera envoyee"). La résolution des #18 + #11 + les accents (#1) ramènerait 80% de la cohérence de ton.

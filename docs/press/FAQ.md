# FAQ presse — CeSoir

Réponses pré-rédigées aux 15 questions les plus probables en interview/mail.

---

### 1. C'est quoi CeSoir en une phrase ?

La première app de rencontre française **100% gratuite à vie pour les users**,
lancée à Montpellier, avec un modèle économique B2B où les bars payent pour
apparaître sur l'app.

### 2. Comment vous financez-vous si les users ne payent pas ?

Par les **bars et les venues** qui payent pour apparaître en **pins featured**
dans la rubrique Soirées, dans le feed local ou dans la map. Pricing
hebdomadaire ou à la soirée. Pas de pub display, pas de data revente, pas de
freemium user-side.

### 3. Pourquoi Montpellier et pas Paris ?

Trois raisons :
1. **Taille gérable** : assez grande pour générer de la densité, assez petite
   pour contrôler la qualité.
2. **Démographie étudiante + sortie** : 70k étudiants, 30+ bars/clubs actifs,
   une vraie scène.
3. **Coût d'acquisition** : 10x moins cher qu'à Paris pour tester le modèle
   avant scaling.

Paris + Lyon + Bordeaux sont prévus pour l'été 2026.

### 4. Qui êtes-vous ? Y a-t-il une équipe ?

Solo founder mode. [NOM] porte le projet à 100%, épaulé par un collectif de
designers et développeurs en freelance basés à Montpellier, Paris et Lisbonne.
Pas de CEO/CTO/CMO classique, pas de levée de fonds, pas de Y Combinator.

### 5. Pourquoi "invite-only" pendant 3 mois ?

Pour qualifier la première communauté et garantir une densité locale
Montpellier avant d'ouvrir. Chaque user qui s'inscrit reçoit 3 codes à
partager. On préfère 500 users ultra-engagés qu'un lancement ouvert avec 5000
comptes dormants.

### 6. Combien de modes de rencontre et pourquoi 14 ?

14 modes : Solo Dîner, Plus One, Night Owl, Breakup Mode, Tourist, New in
Town, Langue, Dog Date, Seasonal + quelques autres. Le chiffre est le
résultat des conversations user-research avec 150 personnes à Montpellier
pendant l'été 2025. On a mappé tous les contextes où les gens cherchent à
rencontrer quelqu'un "ce soir" sans passer par le dating romantique classique.

### 7. C'est différent de Tinder / Bumble / Hinge comment ?

| | Tinder | CeSoir |
|---|---|---|
| Paywall | oui, dur | aucun |
| Algo de matching | oui, ML | non, géolocalisation simple |
| Logique | "qui veut de toi ?" | "qui est dispo ce soir ?" |
| Modes | dating | 14 modes sociaux |
| Monétisation | users | bars |

### 8. Est-ce que c'est vraiment gratuit ou c'est un piège ?

Vraiment gratuit, pour toujours. Le code `MONETIZATION_ENABLED` est un feature
flag explicitement désactivé dans le code source (disponible en open-source
partiel si demandé). Les CGU et la Politique de confidentialité contiennent
une clause "free forever" signée par [NOM].

### 9. Comment vous gérez la sécurité et le harcèlement ?

Features built-in :
- **Safety page** : SOS button one-tap, partage de localisation avec contact
  de confiance pré-configuré
- **Women First** : les femmes choisissent qui leur parle en premier
- **Message screening** : détection automatique du harcèlement sur les
  premiers messages, filtrage pré-inbox
- **Verify** : vérification photo par selfie contre profil pour lutter contre
  les fake profiles
- **Modération 24/7** : équipe modération sous-traitée (étape 2) + ban
  automatique sur 3 reports concordants

### 10. RGPD & data ?

- Stockage EU (Supabase Francfort)
- Données locales supprimables à 1 clic depuis /profile/delete
- Pas de revente, pas de scraping ads network
- DPO à désigner dès 10k users

### 11. App native iOS/Android ou web ?

**PWA** (Progressive Web App) installable. Pas d'App Store, pas de Play Store
(pour l'instant). Ça évite la commission 30%, ça permet de shipper en
quelques minutes, et ça marche sur iOS et Android sans duplication de code.
Débat App Store natif à rouvrir en 2027.

### 12. Quelle est la différence avec Shotgun / Dice sur la partie Soirées ?

Shotgun et Dice vendent des billets. CeSoir ne vend **pas** de billets.
CeSoir **référence** les soirées de Montpellier (gratuites ou payantes
ailleurs), avec un lien externe Shotgun/Dice quand il y a billetterie. Le
modèle business, c'est d'être l'app "où sortir ce soir à Montpellier" avec
RSVP et découverte, pas un concurrent ticketing.

### 13. Vous avez levé ?

Non. Pas de pre-seed, pas de business angel, pas de VC. Bootstrapping pur sur
fonds propres. L'approche est délibérée : tant que le product-market fit
n'est pas prouvé à Montpellier, on ne veut pas de pression VC sur le
roadmap.

### 14. Quels sont les partenaires bars actuels ?

Liste des 10 bars Montpellier ciblés en Wave 1 : Rockstore, L'Antirouille,
Panama, Black Sheep, Le Dôme, La Barbote, Secret Place, Les Berges du Lez, Le
Corum, Comédie area. *Signatures en cours.*

### 15. Comment vous positionnez-vous sur le débat "addiction aux dating apps" ?

Pleinement conscients. CeSoir est **built anti-addiction** by design :
- Pas de swipe infini (liste statique "ce soir", refresh toutes les 6h)
- Pas de "qui t'a liké" payant (tous les likes visibles)
- Pas de notifications push agressives (opt-in granulaire)
- Pas de paywall "booste ton profil pour 10x plus de matchs" (inexistant)
- Mode `/breakup` dédié aux gens en rupture — pas une cible commerciale, une
  communauté safety-first

On est l'anti-dopamine app dans un marché dopamine. C'est un parti-pris
clairement assumé.

/**
 * Help Center content — V5 Wave 15.
 * Static markdown stored as TS to avoid filesystem reads on edge runtime.
 */

export interface HelpArticle {
  slug: string;
  title: string;
  category: HelpCategory;
  summary: string;
  content: string; // Plain text (paragraphs separated by \n\n)
  keywords: string[];
}

export type HelpCategory =
  | "getting-started"
  | "profile"
  | "matching"
  | "safety"
  | "events"
  | "premium"
  | "privacy"
  | "troubleshooting";

export const CATEGORY_LABELS: Record<HelpCategory, string> = {
  "getting-started": "Démarrer",
  profile: "Profil",
  matching: "Matching",
  safety: "Sécurité",
  events: "Soirées",
  premium: "Premium",
  privacy: "Confidentialité",
  troubleshooting: "Problèmes techniques",
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "create-account",
    title: "Comment créer mon compte",
    category: "getting-started",
    summary: "Les étapes pour t'inscrire sur CeSoir en moins de 2 minutes.",
    keywords: ["inscription", "compte", "email", "signup", "register"],
    content: `Ouvre l'app CeSoir sur ton téléphone ou rends-toi sur cesoir.app.

Clique sur "Créer un compte" et renseigne ton email + un mot de passe (au moins 8 caractères).

Tu recevras un email de confirmation — clique sur le lien pour valider ton compte.

Ajoute ensuite ton prénom, ton âge (18 ans minimum), une photo de profil et une courte bio.

Choisis tes modes (Date, Soirée, Amitié, Voyage...) et active la géolocalisation pour voir les profils à proximité. C'est tout !`,
  },
  {
    slug: "why-free",
    title: "Pourquoi CeSoir est gratuit",
    category: "getting-started",
    summary: "Notre modèle économique et comment on reste indépendants.",
    keywords: ["gratuit", "prix", "business model", "premium", "abonnement"],
    content: `CeSoir est gratuit parce que nous croyons que rencontrer les bonnes personnes ne devrait jamais être un luxe.

Les fonctionnalités de base (swiper, matcher, messagerie, soirées gratuites) sont et resteront 100% gratuites.

Nous finançons l'app via CeSoir Premium (optionnel, 4,99€/mois) qui donne accès à des fonctionnalités bonus : likes illimités, boost, messages avant match, et la suppression des pubs (il n'y en a pas aujourd'hui).

Nous ne vendons JAMAIS tes données. Notre engagement : aucune publicité ciblée, aucun partage avec des tiers commerciaux.`,
  },
  {
    slug: "how-matching-works",
    title: "Comment marche le matching",
    category: "matching",
    summary: "L'algorithme, les modes, et ce qui influence ta découverte.",
    keywords: ["matching", "swipe", "like", "algorithme", "discover"],
    content: `Le matching CeSoir n'est pas un simple Tinder. Nous combinons plusieurs signaux :

1. Ta proximité géographique (rayon configurable dans les paramètres).
2. Tes modes actifs (on te montre les utilisateurs compatibles : par exemple, si tu es en mode "Solo Diner", on privilégie les autres mode "Solo Diner" près de toi).
3. Tes préférences (genre recherché, tranche d'âge).
4. Votre compatibilité calculée (centres d'intérêt communs, réponses aux prompts).
5. L'activité récente (les profils en ligne sont légèrement boostés pour favoriser les conversations rapides).

Quand tu "likes" quelqu'un et qu'il/elle te "like" en retour, c'est un match : vous pouvez vous écrire.`,
  },
  {
    slug: "block-report-user",
    title: "Comment bloquer ou signaler un utilisateur",
    category: "safety",
    summary: "Protéger son expérience et la communauté.",
    keywords: ["bloquer", "signaler", "report", "block", "abuse", "harcelement"],
    content: `Si un utilisateur te met mal à l'aise, tu peux le bloquer ou le signaler depuis son profil ou une conversation.

Pour bloquer : appuie sur les trois points (...) en haut à droite du profil ou du chat, puis "Bloquer". La personne ne pourra plus te voir ni te contacter.

Pour signaler : même menu, "Signaler", puis choisis un motif (faux profil, harcèlement, contenu inapproprié, arnaque, mineur, menace de violence, catfish, autre). Tu peux ajouter des détails et des captures d'écran.

Toutes les actions sont anonymes. Notre équipe examine chaque signalement sous 24h. Si 3 personnes ou plus signalent un même profil dans les 48h, il est automatiquement caché en attendant notre revue.`,
  },
  {
    slug: "how-events-work",
    title: "Comment fonctionnent les Soirées",
    category: "events",
    summary: "Découvrir, réserver et rejoindre les événements CeSoir.",
    keywords: ["soirees", "events", "evenements", "rsvp", "sorties"],
    content: `Les Soirées CeSoir sont des événements réels organisés par nos partenaires ou la communauté : bars, rooftops, clubs, expos, afterworks, concerts...

Pour les découvrir : ouvre l'onglet "Soirées" ou la map. Filtre par catégorie (techno, jazz, brunch...), par date ou par prix.

Pour RSVP : clique sur un événement, lis la description, et choisis "Intéressé" ou "J'y vais". Tu verras qui d'autre y va parmi tes matchs ou les profils compatibles.

Les événements gratuits sont signalés. Certains proposent des places réservées par CeSoir (priorité à la communauté).

Nos partenaires vérifiés arborent un badge bleu. Nous recommandons de privilégier les événements vérifiés.`,
  },
  {
    slug: "rgpd-my-data",
    title: "RGPD & mes données personnelles",
    category: "privacy",
    summary: "Tes droits, comment exporter ou supprimer tes données.",
    keywords: ["rgpd", "gdpr", "privacy", "donnees", "export"],
    content: `Tu as un contrôle total sur tes données. Tes droits RGPD :

- Accès : télécharge un export complet depuis Paramètres > Confidentialité > Télécharger mes données.
- Rectification : modifie ton profil à tout moment.
- Effacement : supprime ton compte depuis Paramètres > Confidentialité > Supprimer mon compte (effectif sous 30 jours).
- Portabilité : export au format JSON.
- Opposition : écris à privacy@cesoir.app.

Nous ne vendons JAMAIS tes données. Les seuls partages : Supabase (hébergement UE), Vercel (exécution UE), Stripe (paiements), OpenAI (modération — uniquement le texte, aucune donnée identifiante). Tout est encadré par les Clauses Contractuelles Types (SCC) quand nécessaire.

Consulte notre DPIA complet sur /legal/dpia.`,
  },
  {
    slug: "disable-deactivate-account",
    title: "Comment désactiver ou supprimer mon compte",
    category: "profile",
    summary: "Pause temporaire ou suppression définitive.",
    keywords: ["desactiver", "supprimer", "pause", "delete", "close"],
    content: `Deux options :

Désactivation temporaire (pause) : Paramètres > Compte > Mettre en pause. Ton profil devient invisible pour les autres, mais tes données et conversations sont conservées. Tu peux te réactiver à tout moment en te reconnectant.

Suppression définitive : Paramètres > Confidentialité > Supprimer mon compte. Tu dois confirmer avec ton mot de passe. Le compte est marqué pour suppression (soft-delete 30 jours puis purge définitive, conformément à la CNIL).

Attention : après la purge, tes messages, matchs et signalements éventuels sont irrécupérables.`,
  },
  {
    slug: "verify-profile",
    title: "Comment obtenir le badge Vérifié",
    category: "profile",
    summary: "Vérification selfie pour prouver que tu es bien toi.",
    keywords: ["verifier", "badge", "selfie", "verification"],
    content: `Le badge Vérifié inspire confiance et augmente ton nombre de matchs.

Pour l'obtenir : Profil > "Me vérifier" ou ouvre /verify directement.

Prends 3 selfies dans différentes poses (regarder à gauche, sourire, hocher la tête). Notre système compare localement ton visage avec ta photo de profil (aucune image n'est envoyée sans ton accord).

Si la correspondance est forte, le badge apparaît immédiatement. Sinon, notre équipe fait une revue manuelle sous 24h.

Le badge est retiré si tu changes de photo de profil — il faut alors re-vérifier.`,
  },
  {
    slug: "change-location",
    title: "Changer ma ville ou mon rayon de recherche",
    category: "matching",
    summary: "Ajuster ta zone de découverte.",
    keywords: ["ville", "rayon", "distance", "location", "geoloc"],
    content: `Tu peux ajuster ton rayon de recherche depuis Paramètres > Découverte > Rayon. Minimum 1 km, maximum 200 km.

Pour changer de ville (voyage, déménagement) : tu peux passer en Mode Touriste ou Mode New-in-Town pour signaler que tu es de passage. Ton profil sera visible dans cette ville temporairement.

Note : nous utilisons ta géolocalisation en temps réel pour le matching, mais nous floutons ta position exacte pour les non-matchs (précision ~1 km).`,
  },
  {
    slug: "modes-explained",
    title: "Les 4 modes expliqués",
    category: "matching",
    summary: "Solo Diner, Plus-One, Night Owl, Foodie Quest — quand les utiliser.",
    keywords: ["modes", "solo diner", "plus-one", "night owl", "foodie quest"],
    content: `CeSoir propose 4 modes qui correspondent à différentes intentions de soirée.

Les 4 modes :

- Solo Diner : trouver quelqu'un pour dîner ce soir.
- Plus-One : besoin d'un(e) partenaire pour un événement précis (concert, vernissage, cinéma).
- Night Owl : tu es dispo en soirée, après 23h, pour sortir.
- Foodie Quest : aventure culinaire à deux, découvrir un restaurant ensemble.

Active plusieurs modes à la fois pour maximiser tes matchs. Chaque mode a sa propre couleur et son ambiance.`,
  },
  {
    slug: "safety-sos-checkin",
    title: "SOS et Check-in — fonctionnalités safety",
    category: "safety",
    summary: "Protéger tes sorties en informant tes proches.",
    keywords: ["sos", "checkin", "safety", "securite", "urgence"],
    content: `CeSoir prend ta sécurité au sérieux. Deux outils :

SOS : un bouton d'urgence dans l'onglet Safety. Quand tu l'actives, ta position GPS est envoyée par SMS à tes contacts de confiance avec un lien Google Maps. Utilise-le si tu te sens en danger.

Check-in : planifie un rappel (ex: toutes les 30 minutes pendant une sortie). Si tu ne confirmes pas que tu vas bien, tes contacts de confiance reçoivent automatiquement une alerte SMS avec ta dernière position.

Configure tes contacts de confiance depuis Paramètres > Sécurité > Contacts de confiance. 3 contacts max recommandés.`,
  },
  {
    slug: "premium-benefits",
    title: "CeSoir Premium — ce que ça apporte",
    category: "premium",
    summary: "Comparer gratuit vs Premium.",
    keywords: ["premium", "abonnement", "paiement", "subscription"],
    content: `CeSoir Premium coûte 4,99€/mois ou 39,99€/an (soit ~3,33€/mois).

Avantages :
- Likes illimités (vs 30/jour en gratuit)
- Voir qui t'a likée avant de matcher
- 1 boost par mois (profil mis en avant 30 min)
- Envoyer un message avant le match (5 SuperLikes par mois)
- Passeport : match partout dans le monde
- Mode Invisible (parcourir sans être vu)
- Pas de pubs (il n'y en a pas actuellement sur CeSoir, mais si on en ajoutait, les Premium seraient épargnés)

Tu peux annuler à tout moment depuis Paramètres > Abonnement.`,
  },
  {
    slug: "cancel-subscription",
    title: "Annuler mon abonnement Premium",
    category: "premium",
    summary: "Procédure pour résilier sans frais.",
    keywords: ["annuler", "resilier", "cancel", "abonnement"],
    content: `Tu peux annuler ton abonnement CeSoir Premium à tout moment.

Depuis l'app : Paramètres > Abonnement > Annuler. La résiliation est effective à la fin de la période en cours (tu gardes Premium jusqu'à l'échéance prévue).

Depuis le navigateur Stripe : tu recevras un email avec un lien vers ton portail client Stripe où tu peux gérer ton abonnement.

Aucun frais d'annulation, aucune question posée. Nous respectons ton choix.

Si tu as des soucis, écris à support@cesoir.app.`,
  },
  {
    slug: "photo-not-uploading",
    title: "Ma photo ne s'upload pas",
    category: "troubleshooting",
    summary: "Les causes fréquentes et comment les résoudre.",
    keywords: ["photo", "upload", "bug", "probleme"],
    content: `Si ton upload échoue :

1. Vérifie la taille : la photo doit faire moins de 5 Mo. Si elle est plus grosse, compresse-la (TinyPNG, ton téléphone propose souvent un "Resize" natif).

2. Vérifie le format : seuls JPG, PNG et WebP sont acceptés. Les HEIC (iPhone) doivent être convertis.

3. Vérifie ta connexion internet. Un réseau instable coupe l'upload.

4. Assure-toi que ta photo ne contient PAS de contenu explicite : nous utilisons un filtre automatique qui bloque les images inappropriées.

5. Si ton avatar n'apparaît pas après l'upload, force un refresh (tirer vers le bas sur l'écran profil).

Si rien ne marche, écris à support@cesoir.app avec une capture du problème.`,
  },
  {
    slug: "not-getting-matches",
    title: "Je ne reçois pas de matchs",
    category: "troubleshooting",
    summary: "Comment optimiser ton profil.",
    keywords: ["match", "matching", "likes", "profil"],
    content: `Plusieurs leviers :

1. Ajoute au moins 3 photos variées (portrait, activité, voyage). Les profils avec 4+ photos reçoivent 2x plus de matchs.

2. Écris une bio (même courte). Un profil sans bio est 40% moins likée.

3. Active plusieurs modes pour élargir ta découverte.

4. Vérifie ton profil (badge Vérifié) : +3x de matchs.

5. Connecte-toi aux heures de pointe (19h-23h en semaine, 15h-minuit le week-end).

6. Si ton rayon est trop restreint (<5 km), élargis-le.

7. Évite les filtres trop restrictifs (tranche d'âge super étroite).

Patience : les premiers jours, l'algorithme apprend tes préférences. Après 1 semaine d'usage actif, tes résultats s'améliorent nettement.`,
  },
  {
    slug: "change-password",
    title: "Changer mon mot de passe",
    category: "profile",
    summary: "Réinitialiser ou modifier ton mot de passe.",
    keywords: ["mot de passe", "password", "reset"],
    content: `Deux cas :

Tu connais ton mot de passe actuel : Paramètres > Compte > Changer le mot de passe. Renseigne l'ancien + le nouveau (8 caractères min, avec au moins 1 chiffre recommandé).

Tu l'as oublié : sur l'écran de connexion, clique "Mot de passe oublié". Tu recevras un email avec un lien de réinitialisation valide 1 heure.

Nos mots de passe sont hachés avec Argon2 (standard industrie) — même nos développeurs ne peuvent pas les lire en clair.

Active la double authentification (MFA) depuis Paramètres > Sécurité pour une protection supplémentaire.`,
  },
  {
    slug: "notifications-not-working",
    title: "Je ne reçois pas de notifications",
    category: "troubleshooting",
    summary: "Configurer les alertes matchs, messages, SOS.",
    keywords: ["notifications", "push", "alertes", "notif"],
    content: `Vérifications :

1. Les notifications sont actives dans l'app : Paramètres > Notifications > Active les types qui t'intéressent (matchs, messages, smart notifications).

2. Les notifications sont autorisées au niveau du système :
   - iOS : Réglages > CeSoir > Notifications > Autoriser
   - Android : Paramètres système > Applications > CeSoir > Notifications

3. Mode concentration / Ne pas déranger : désactive-le ou exclus CeSoir.

4. Sur PWA (web app) : autorise les notifications lors du prompt initial. Tu peux revérifier dans les paramètres du navigateur (Chrome > Paramètres > Site > cesoir.app).

Les notifications safety (check-in manqué, SOS) contournent le Ne pas déranger si tu actives "Urgences" dans les réglages iOS/Android.`,
  },
  {
    slug: "community-guidelines",
    title: "Les règles de la communauté CeSoir",
    category: "safety",
    summary: "Ce qui est autorisé, ce qui ne l'est pas.",
    keywords: ["regles", "conditions", "comportement", "moderation"],
    content: `CeSoir est une communauté basée sur le respect. Les règles :

AUTORISÉ :
- Être toi-même, sincèrement.
- Draguer respectueusement.
- Refuser poliment, bloquer si nécessaire.
- Signaler un comportement déplacé.

INTERDIT :
- Harcèlement, menaces, discours haineux (racisme, homophobie, transphobie, etc.)
- Photos sexuellement explicites (la nudité complète est filtrée automatiquement)
- Profils faux, usurpation d'identité, catfishing
- Spam, arnaques, sollicitation commerciale
- Utilisateurs mineurs (moins de 18 ans) — interdit strict
- Photos d'enfants identifiables sans floutage

Sanctions progressives : avertissement > timeout 24h > timeout 7j > ban permanent. Les cas graves (menaces, mineurs, violence) conduisent à un ban immédiat et un signalement aux autorités si nécessaire.

Notre équipe de modération est disponible 7j/7 et examine chaque signalement sous 24h.`,
  },
  {
    slug: "premium-refund",
    title: "Demander un remboursement Premium",
    category: "premium",
    summary: "Cas où un remboursement est possible.",
    keywords: ["remboursement", "refund", "stripe"],
    content: `Les abonnements CeSoir Premium sont en principe non-remboursables une fois la période commencée (conformément à l'article L221-28 du Code de la Consommation sur les prestations pleinement exécutées).

Cas de remboursement exceptionnel :

- Bug technique avéré (Premium non activé après paiement).
- Double facturation.
- Résiliation dans les 14 jours si Premium n'a jamais été utilisé (droit de rétractation).

Contact support@cesoir.app avec ton email de compte + capture d'écran de la facture. Réponse sous 48h.`,
  },
  {
    slug: "pwa-install",
    title: "Installer CeSoir sur mon téléphone (PWA)",
    category: "getting-started",
    summary: "Avoir CeSoir comme une vraie app, sans passer par l'App Store.",
    keywords: ["pwa", "installer", "home screen", "app"],
    content: `CeSoir est une Progressive Web App (PWA) : tu peux l'installer sur ton écran d'accueil comme une vraie app, sans passer par l'App Store ou Google Play.

iOS (Safari) : ouvre cesoir.app dans Safari > tape sur l'icône "Partager" > "Sur l'écran d'accueil" > "Ajouter".

Android (Chrome) : ouvre cesoir.app dans Chrome > menu (3 points) > "Installer l'application".

Avantages : plus rapide, notifications push, mode hors ligne partiel. Pas besoin de stockage supplémentaire (< 1 Mo).

Pour désinstaller : comme n'importe quelle app de ton téléphone (appui long sur l'icône > Supprimer).`,
  },
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.keywords.some((k) => k.includes(q)) ||
      a.content.toLowerCase().includes(q),
  );
}

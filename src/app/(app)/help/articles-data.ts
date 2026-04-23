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
  "getting-started": "Demarrer",
  profile: "Profil",
  matching: "Matching",
  safety: "Securite",
  events: "Soirees",
  premium: "Premium",
  privacy: "Confidentialite",
  troubleshooting: "Problemes techniques",
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "create-account",
    title: "Comment creer mon compte",
    category: "getting-started",
    summary: "Les etapes pour t'inscrire sur CeSoir en moins de 2 minutes.",
    keywords: ["inscription", "compte", "email", "signup", "register"],
    content: `Ouvre l'app CeSoir sur ton telephone ou rends-toi sur cesoir.app.

Clique sur "Creer un compte" et renseigne ton email + un mot de passe (au moins 8 caracteres).

Tu recevras un email de confirmation — clique sur le lien pour valider ton compte.

Ajoute ensuite ton prenom, ton age (18 ans minimum), une photo de profil et une courte bio.

Choisis tes modes (Date, Soiree, Amitie, Voyage...) et active la geolocalisation pour voir les profils a proximite. C'est tout !`,
  },
  {
    slug: "why-free",
    title: "Pourquoi CeSoir est gratuit",
    category: "getting-started",
    summary: "Notre modele economique et comment on reste independants.",
    keywords: ["gratuit", "prix", "business model", "premium", "abonnement"],
    content: `CeSoir est gratuit parce que nous croyons que rencontrer les bonnes personnes ne devrait jamais etre un luxe.

Les fonctionnalites de base (swiper, matcher, messagerie, soirees gratuites) sont et resteront 100% gratuites.

Nous finançons l'app via CeSoir Premium (optionnel, 4,99€/mois) qui donne acces a des fonctionnalites bonus : likes illimites, boost, messages avant match, et la suppression des pubs (il n'y en a pas aujourd'hui).

Nous ne vendons JAMAIS vos donnees. Notre engagement : aucune publicite ciblee, aucun partage avec des tiers commerciaux.`,
  },
  {
    slug: "how-matching-works",
    title: "Comment marche le matching",
    category: "matching",
    summary: "L'algorithme, les modes, et ce qui influence ta decouverte.",
    keywords: ["matching", "swipe", "like", "algorithme", "discover"],
    content: `Le matching CeSoir n'est pas un simple Tinder. Nous combinons plusieurs signaux :

1. Ta proximite geographique (rayon configurable dans les parametres).
2. Tes modes actifs (on te montre les utilisateurs compatibles : par exemple, si tu es en mode "Solo Diner", on privilegie les autres mode "Solo Diner" pres de toi).
3. Tes preferences (genre recherche, tranche d'age).
4. Votre compatibilite calculee (centres d'interet communs, reponses aux prompts).
5. L'activite recente (les profils en ligne sont legerement boostes pour favoriser les conversations rapides).

Quand tu "likes" quelqu'un et qu'il/elle te "like" en retour, c'est un match : vous pouvez vous ecrire.`,
  },
  {
    slug: "block-report-user",
    title: "Comment bloquer ou signaler un utilisateur",
    category: "safety",
    summary: "Proteger son experience et la communaute.",
    keywords: ["bloquer", "signaler", "report", "block", "abuse", "harcelement"],
    content: `Si un utilisateur te met mal a l'aise, tu peux le bloquer ou le signaler depuis son profil ou une conversation.

Pour bloquer : appuie sur les trois points (...) en haut a droite du profil ou du chat, puis "Bloquer". La personne ne pourra plus te voir ni te contacter.

Pour signaler : meme menu, "Signaler", puis choisis un motif (faux profil, harcelement, contenu inapproprie, arnaque, mineur, menace de violence, catfish, autre). Tu peux ajouter des details et des captures d'ecran.

Toutes les actions sont anonymes. Notre equipe examine chaque signalement sous 24h. Si 3 personnes ou plus signalent un meme profil dans les 48h, il est automatiquement cache en attendant notre revue.`,
  },
  {
    slug: "how-events-work",
    title: "Comment fonctionnent les Soirees",
    category: "events",
    summary: "Decouvrir, reserver et rejoindre les evenements CeSoir.",
    keywords: ["soirees", "events", "evenements", "rsvp", "sorties"],
    content: `Les Soirees CeSoir sont des evenements reels organises par nos partenaires ou la communaute : bars, rooftops, clubs, expos, afterworks, concerts...

Pour les decouvrir : ouvre l'onglet "Soirees" ou la map. Filtre par categorie (techno, jazz, brunch...), par date ou par prix.

Pour RSVP : clique sur un evenement, lis la description, et choisis "Interesse" ou "J'y vais". Tu verras qui d'autre y va parmi tes matchs ou les profils compatibles.

Les evenements gratuits sont signales. Certains proposent des places reservees par CeSoir (priorite a la communaute).

Nos partenaires verifies arborent un badge bleu. Nous recommandons de privilegier les evenements verifies.`,
  },
  {
    slug: "rgpd-my-data",
    title: "RGPD & mes donnees personnelles",
    category: "privacy",
    summary: "Tes droits, comment exporter ou supprimer tes donnees.",
    keywords: ["rgpd", "gdpr", "privacy", "donnees", "export"],
    content: `Tu as un controle total sur tes donnees. Tes droits RGPD :

- Acces : telecharge un export complet depuis Parametres > Confidentialite > Telecharger mes donnees.
- Rectification : modifie ton profil a tout moment.
- Effacement : supprime ton compte depuis Parametres > Confidentialite > Supprimer mon compte (effectif sous 30 jours).
- Portabilite : export au format JSON.
- Opposition : ecris a privacy@cesoir.app.

Nous ne vendons JAMAIS tes donnees. Les seuls partages : Supabase (hebergement UE), Vercel (execution UE), Stripe (paiements), OpenAI (moderation — uniquement le texte, aucune donnee identifiante). Tout est encadre par les Clauses Contractuelles Types (SCC) quand necessaire.

Consulte notre DPIA complet sur /legal/dpia.`,
  },
  {
    slug: "disable-deactivate-account",
    title: "Comment desactiver ou supprimer mon compte",
    category: "profile",
    summary: "Pause temporaire ou suppression definitive.",
    keywords: ["desactiver", "supprimer", "pause", "delete", "close"],
    content: `Deux options :

Desactivation temporaire (pause) : Parametres > Compte > Mettre en pause. Ton profil devient invisible pour les autres, mais tes donnees et conversations sont conservees. Tu peux te reactiver a tout moment en te reconnectant.

Suppression definitive : Parametres > Confidentialite > Supprimer mon compte. Tu dois confirmer avec ton mot de passe. Le compte est marque pour suppression (soft-delete 30 jours puis purge definitive, conformement a la CNIL).

Attention : apres la purge, tes messages, matchs et signalements eventuels sont irrecuperables.`,
  },
  {
    slug: "verify-profile",
    title: "Comment obtenir le badge Verifie",
    category: "profile",
    summary: "Verification selfie pour prouver que tu es bien toi.",
    keywords: ["verifier", "badge", "selfie", "verification"],
    content: `Le badge Verifie inspire confiance et augmente ton nombre de matchs.

Pour l'obtenir : Profil > "Me verifier" ou ouvre /verify directement.

Prends 3 selfies dans differentes poses (regarder a gauche, sourire, hocher la tete). Notre systeme compare localement ton visage avec ta photo de profil (aucune image n'est envoyee sans ton accord).

Si la correspondance est forte, le badge apparait immediatement. Sinon, notre equipe fait une revue manuelle sous 24h.

Le badge est retire si tu changes de photo de profil — il faut alors re-verifier.`,
  },
  {
    slug: "change-location",
    title: "Changer ma ville ou mon rayon de recherche",
    category: "matching",
    summary: "Ajuster ta zone de decouverte.",
    keywords: ["ville", "rayon", "distance", "location", "geoloc"],
    content: `Tu peux ajuster ton rayon de recherche depuis Parametres > Decouverte > Rayon. Minimum 1 km, maximum 200 km.

Pour changer de ville (voyage, demenagement) : tu peux passer en Mode Touriste ou Mode New-in-Town pour signaler que tu es de passage. Ton profil sera visible dans cette ville temporairement.

Note : nous utilisons ta geolocalisation en temps reel pour le matching, mais nous floutons ta position exacte pour les non-matchs (precision ~1 km).`,
  },
  {
    slug: "modes-explained",
    title: "Les 14 modes expliques",
    category: "matching",
    summary: "Date, Soiree, Amitie, Tourist, Night Owl, Breakup... quand les utiliser.",
    keywords: ["modes", "date", "soiree", "amitie", "breakup"],
    content: `CeSoir propose 14 modes qui correspondent a differentes intentions ou moments de vie.

Quelques exemples :

- Solo Diner : trouver quelqu'un pour diner ce soir.
- Plus One : besoin d'un(e) partenaire pour un evenement precis.
- Tourist : tu visites une nouvelle ville.
- Night Owl : tu es dispo en soiree pour sortir.
- Breakup : tu sors d'une rupture, tu veux du soutien.
- New in Town : tu viens d'emmenager.
- Langue : tu cherches a pratiquer une langue.
- Dog Date : tu as un chien, trouver une sortie canine.

Active plusieurs modes a la fois pour maximiser tes matchs. Chaque mode a sa propre couleur et son ambiance.`,
  },
  {
    slug: "safety-sos-checkin",
    title: "SOS et Check-in — fonctionnalites safety",
    category: "safety",
    summary: "Proteger tes sorties en informant tes proches.",
    keywords: ["sos", "checkin", "safety", "securite", "urgence"],
    content: `CeSoir prend ta securite au serieux. Deux outils :

SOS : un bouton d'urgence dans l'onglet Safety. Quand tu l'actives, ta position GPS est envoyee par SMS a tes contacts de confiance avec un lien Google Maps. Utilise-le si tu te sens en danger.

Check-in : planifie un rappel (ex: toutes les 30 minutes pendant une sortie). Si tu ne confirmes pas que tu vas bien, tes contacts de confiance reçoivent automatiquement une alerte SMS avec ta derniere position.

Configure tes contacts de confiance depuis Parametres > Securite > Contacts de confiance. 3 contacts max recommandes.`,
  },
  {
    slug: "premium-benefits",
    title: "CeSoir Premium — ce que ca apporte",
    category: "premium",
    summary: "Comparer gratuit vs Premium.",
    keywords: ["premium", "abonnement", "paiement", "subscription"],
    content: `CeSoir Premium coute 4,99€/mois ou 39,99€/an (soit ~3,33€/mois).

Avantages :
- Likes illimites (vs 30/jour en gratuit)
- Voir qui t'a likee avant de matcher
- 1 boost par mois (profil mis en avant 30 min)
- Envoyer un message avant le match (5 SuperLikes par mois)
- Passeport : match partout dans le monde
- Mode Invisible (parcourir sans etre vu)
- Pas de pubs (il n'y en a pas actuellement sur CeSoir, mais si on en ajoutait, les Premium seraient epargnes)

Tu peux annuler a tout moment depuis Parametres > Abonnement.`,
  },
  {
    slug: "cancel-subscription",
    title: "Annuler mon abonnement Premium",
    category: "premium",
    summary: "Procedure pour resilier sans frais.",
    keywords: ["annuler", "resilier", "cancel", "abonnement"],
    content: `Tu peux annuler ton abonnement CeSoir Premium a tout moment.

Depuis l'app : Parametres > Abonnement > Annuler. La resiliation est effective a la fin de la periode en cours (tu gardes Premium jusqu'a l'echeance prevue).

Depuis le navigateur Stripe : tu recevras un email avec un lien vers ton portail client Stripe ou tu peux gerer ton abonnement.

Aucun frais d'annulation, aucune question posee. Nous respectons ton choix.

Si tu as des soucis, ecris a support@cesoir.app.`,
  },
  {
    slug: "photo-not-uploading",
    title: "Ma photo ne s'upload pas",
    category: "troubleshooting",
    summary: "Les causes frequentes et comment les resoudre.",
    keywords: ["photo", "upload", "bug", "probleme"],
    content: `Si ton upload echoue :

1. Verifie la taille : la photo doit faire moins de 5 Mo. Si elle est plus grosse, compresse-la (TinyPNG, ton telephone propose souvent un "Resize" natif).

2. Verifie le format : seuls JPG, PNG et WebP sont acceptes. Les HEIC (iPhone) doivent etre convertis.

3. Verifie ta connexion internet. Un reseau instable coupe l'upload.

4. Assure-toi que ta photo ne contient PAS de contenu explicite : nous utilisons un filtre automatique qui bloque les images inappropriees.

5. Si ton avatar n'apparait pas apres l'upload, force un refresh (tirer vers le bas sur l'ecran profil).

Si rien ne marche, ecris a support@cesoir.app avec une capture du probleme.`,
  },
  {
    slug: "not-getting-matches",
    title: "Je ne reçois pas de matchs",
    category: "troubleshooting",
    summary: "Comment optimiser ton profil.",
    keywords: ["match", "matching", "likes", "profil"],
    content: `Plusieurs leviers :

1. Ajoute au moins 3 photos variees (portrait, activite, voyage). Les profils avec 4+ photos reçoivent 2x plus de matchs.

2. Ecris une bio (meme courte). Un profil sans bio est 40% moins likee.

3. Active plusieurs modes pour elargir ta decouverte.

4. Verifie ton profil (badge Verifie) : +3x de matchs.

5. Connecte-toi aux heures de pointe (19h-23h en semaine, 15h-minuit le week-end).

6. Si ton rayon est trop restreint (<5 km), elargis-le.

7. Evite les filtres trop restrictifs (tranche d'age super etroite).

Patience : les premiers jours, l'algorithme apprend tes preferences. Apres 1 semaine d'usage actif, tes resultats s'ameliorent nettement.`,
  },
  {
    slug: "change-password",
    title: "Changer mon mot de passe",
    category: "profile",
    summary: "Reinitialiser ou modifier ton mot de passe.",
    keywords: ["mot de passe", "password", "reset"],
    content: `Deux cas :

Tu connais ton mot de passe actuel : Parametres > Compte > Changer le mot de passe. Renseigne l'ancien + le nouveau (8 caracteres min, avec au moins 1 chiffre recommande).

Tu l'as oublie : sur l'ecran de connexion, clique "Mot de passe oublie". Tu recevras un email avec un lien de reinitialisation valide 1 heure.

Nos mots de passe sont haches avec Argon2 (standard industrie) — meme nos developpeurs ne peuvent pas les lire en clair.

Active la double authentification (MFA) depuis Parametres > Securite pour une protection supplementaire.`,
  },
  {
    slug: "notifications-not-working",
    title: "Je ne reçois pas de notifications",
    category: "troubleshooting",
    summary: "Configurer les alertes matchs, messages, SOS.",
    keywords: ["notifications", "push", "alertes", "notif"],
    content: `Verifications :

1. Les notifications sont actives dans l'app : Parametres > Notifications > Active les types qui t'interessent (matchs, messages, smart notifications).

2. Les notifications sont autorisees au niveau du systeme :
   - iOS : Reglages > CeSoir > Notifications > Autoriser
   - Android : Parametres systeme > Applications > CeSoir > Notifications

3. Mode concentration / Ne pas deranger : desactive-le ou exclus CeSoir.

4. Sur PWA (web app) : autorise les notifications lors du prompt initial. Tu peux reverifier dans les parametres du navigateur (Chrome > Parametres > Site > cesoir.app).

Les notifications safety (check-in manque, SOS) contournent le Ne pas deranger si tu actives "Urgences" dans les reglages iOS/Android.`,
  },
  {
    slug: "community-guidelines",
    title: "Les regles de la communaute CeSoir",
    category: "safety",
    summary: "Ce qui est autorise, ce qui ne l'est pas.",
    keywords: ["regles", "conditions", "comportement", "moderation"],
    content: `CeSoir est une communaute basee sur le respect. Les regles :

AUTORISE :
- Etre toi-meme, sincerement.
- Draguer respectueusement.
- Refuser poliment, bloquer si necessaire.
- Signaler un comportement deplace.

INTERDIT :
- Harcelement, menaces, discours haineux (racisme, homophobie, transphobie, etc.)
- Photos sexuellement explicites (la nudite complete est filtree automatiquement)
- Profils faux, usurpation d'identite, catfishing
- Spam, arnaques, sollicitation commerciale
- Utilisateurs mineurs (moins de 18 ans) — interdit strict
- Photos d'enfants identifiables sans floutage

Sanctions progressives : avertissement > timeout 24h > timeout 7j > ban permanent. Les cas graves (menaces, mineurs, violence) conduisent a un ban immediat et un signalement aux autorites si necessaire.

Notre equipe de moderation est disponible 7j/7 et examine chaque signalement sous 24h.`,
  },
  {
    slug: "premium-refund",
    title: "Demander un remboursement Premium",
    category: "premium",
    summary: "Cas ou un remboursement est possible.",
    keywords: ["remboursement", "refund", "stripe"],
    content: `Les abonnements CeSoir Premium sont en principe non-remboursables une fois la periode commencee (conformement a l'article L221-28 du Code de la Consommation sur les prestations pleinement executees).

Cas de remboursement exceptionnel :

- Bug technique avere (Premium non active apres paiement).
- Double facturation.
- Resiliation dans les 14 jours si Premium n'a jamais ete utilise (droit de retractation).

Contact support@cesoir.app avec ton email de compte + capture d'ecran de la facture. Reponse sous 48h.`,
  },
  {
    slug: "pwa-install",
    title: "Installer CeSoir sur mon telephone (PWA)",
    category: "getting-started",
    summary: "Avoir CeSoir comme une vraie app, sans passer par l'App Store.",
    keywords: ["pwa", "installer", "home screen", "app"],
    content: `CeSoir est une Progressive Web App (PWA) : tu peux l'installer sur ton ecran d'accueil comme une vraie app, sans passer par l'App Store ou Google Play.

iOS (Safari) : ouvre cesoir.app dans Safari > tape sur l'icone "Partager" > "Sur l'ecran d'accueil" > "Ajouter".

Android (Chrome) : ouvre cesoir.app dans Chrome > menu (3 points) > "Installer l'application".

Avantages : plus rapide, notifications push, mode hors ligne partiel. Pas besoin de stockage supplementaire (< 1 Mo).

Pour desinstaller : comme n'importe quelle app de ton telephone (appui long sur l'icone > Supprimer).`,
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

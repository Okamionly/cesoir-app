import type { Metadata } from "next";
import PresentationClient from "./PresentationClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Demo profile data - in production this would come from Supabase
async function getPublicProfile(id: string) {
  return {
    id,
    name: "Youssef",
    age: 28,
    bio: "Passione de cuisine, de langues et de decouvertes. Toujours partant pour un bon diner ou une balade nocturne. J'adore les conversations qui durent jusqu'a 3h du matin et les restaurants ou il faut sonner pour entrer.",
    activeModes: ["solo-diner", "langue", "dog-date"],
    city: "Paris, France",
    meetupCount: 12,
    avatarUrl: undefined as string | undefined,
    isVerified: true,
    trustScore: 87,
    karmaScore: 4.8,
    isAvailableTonight: true,
    currentMode: "solo-diner",
    moodEmoji: "🔥",
    moodText: "Envie de decouvrir un nouveau quartier",
    tonightChips: ["Diner", "Boire un verre", "Balade"],
    prompts: [
      {
        question: "Mon restaurant prefere a Paris...",
        answer: "Un petit izakaya cache dans le 11e. Je te montre si tu viens.",
      },
      {
        question: "La derniere chose qui m'a fait rire...",
        answer: "Mon chien Rex qui essaie de voler un croissant a une terrasse.",
      },
      {
        question: "Ce soir, j'ai envie de...",
        answer: "Decouvrir un endroit que je connais pas avec quelqu'un que je connais pas encore.",
      },
    ],
    reviews: [
      {
        name: "Sarah",
        rating: 5,
        text: "Super soiree ! Youssef est vraiment cool et drole. On a decouvert un bar incroyable.",
        tags: ["Ponctuel", "Drole", "Bonne ambiance"],
        date: "Il y a 3j",
      },
      {
        name: "Camille",
        rating: 5,
        text: "Tres bonne compagnie pour un diner. Conversation passionnante sur les voyages.",
        tags: ["Respectueux", "Cultivee", "Genereux"],
        date: "Il y a 1 sem",
      },
      {
        name: "Thomas",
        rating: 4,
        text: "Bonne soiree jeux de societe. Il connait plein d'endroits sympa dans le Marais.",
        tags: ["Fun", "Bon guide", "A l'heure"],
        date: "Il y a 2 sem",
      },
    ],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return {
    title: `${profile.name}, ${profile.age} - ${profile.city} | CeSoir`,
    description: `Decouvre le profil de ${profile.name} sur CeSoir. ${profile.bio.slice(0, 120)}...`,
    openGraph: {
      title: `${profile.name} sur CeSoir`,
      description: profile.bio.slice(0, 160),
      url: `https://cesoir-app.vercel.app/p/${id}`,
      siteName: "CeSoir",
      locale: "fr_FR",
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  return <PresentationClient profile={profile} />;
}

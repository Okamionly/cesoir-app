import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PresentationClient from "./PresentationClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-side Supabase client for public profile lookups.
 *
 * This file runs in a Server Component, so we can't use the browser client
 * singleton. We build a fresh anon-key client — RLS on `profiles` must allow
 * anonymous reads of public fields for this to work.
 */
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type ReviewRow = {
  reviewer_name?: string | null;
  rating?: number | null;
  text?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
};

type ProfileRow = {
  id: string;
  name?: string | null;
  age?: number | null;
  bio?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  trust_score?: number | null;
  karma_score?: number | null;
  meetup_count?: number | null;
  is_online?: boolean | null;
  is_available_tonight?: boolean | null;
  current_mode?: string | null;
  active_modes?: string[] | null;
  mood_emoji?: string | null;
  mood_text?: string | null;
  tonight_chips?: string[] | null;
  prompts?: { question: string; answer: string }[] | null;
  reviews?: ReviewRow[] | null;
};

/**
 * Shape returned by `getPublicProfile`. `null` means "profile not found".
 * Real data only — no fallback mocks.
 */
type PublicProfile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  activeModes: string[];
  city: string;
  meetupCount: number;
  avatarUrl?: string;
  isVerified: boolean;
  trustScore: number;
  karmaScore: number;
  isAvailableTonight: boolean;
  currentMode: string;
  moodEmoji: string;
  moodText: string;
  tonightChips: string[];
  prompts: { question: string; answer: string }[];
  reviews: {
    name: string;
    rating: number;
    text: string;
    tags: string[];
    date: string;
  }[];
};

function formatRelativeDate(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const deltaMs = Date.now() - then;
  const days = Math.floor(deltaMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an(s)`;
}

async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const client = getServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .select(
      "id, name, age, bio, city, avatar_url, is_verified, trust_score, karma_score, meetup_count, is_available_tonight, current_mode, active_modes, mood_emoji, mood_text, tonight_chips, prompts, reviews",
    )
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name ?? "Inconnu",
    age: data.age ?? 0,
    bio: data.bio ?? "",
    activeModes: data.active_modes ?? [],
    city: data.city ?? "",
    meetupCount: data.meetup_count ?? 0,
    avatarUrl: data.avatar_url ?? undefined,
    isVerified: Boolean(data.is_verified),
    trustScore: data.trust_score ?? 0,
    karmaScore: data.karma_score ?? 0,
    isAvailableTonight: Boolean(data.is_available_tonight),
    currentMode: data.current_mode ?? "",
    moodEmoji: data.mood_emoji ?? "",
    moodText: data.mood_text ?? "",
    tonightChips: data.tonight_chips ?? [],
    prompts: data.prompts ?? [],
    reviews: (data.reviews ?? []).map((r) => ({
      name: r.reviewer_name ?? "Anonyme",
      rating: r.rating ?? 5,
      text: r.text ?? "",
      tags: r.tags ?? [],
      date: formatRelativeDate(r.created_at),
    })),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    return {
      title: "Profil introuvable | CeSoir",
      description: "Ce profil n'existe pas ou n'est plus disponible.",
    };
  }
  return {
    title: `${profile.name}, ${profile.age} - ${profile.city} | CeSoir`,
    description: `Découvre le profil de ${profile.name} sur CeSoir. ${profile.bio.slice(0, 120)}...`,
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4" aria-hidden="true">
          🔍
        </span>
        <h1 className="text-xl font-bold mb-2">Profil introuvable</h1>
        <p className="text-sm text-text-muted mb-6 max-w-xs">
          Ce profil n&apos;existe pas, a été supprimé, ou n&apos;est plus disponible.
        </p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold"
        >
          Découvrir d&apos;autres profils
        </Link>
      </div>
    );
  }

  return <PresentationClient profile={profile} />;
}

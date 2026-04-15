import Link from "next/link";
import type { Metadata } from "next";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { getBadgeById, RARITY_CONFIG, type Badge } from "@/lib/badges";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Demo profile data - in production this would come from Supabase
async function getPublicProfile(id: string) {
  return {
    id,
    name: "Youssef",
    age: 28,
    bio: "Passione de cuisine, de langues et de decouvertes. Toujours partant pour un bon diner ou une balade nocturne.",
    activeModes: ["solo-diner", "langue", "dog-date"] as string[],
    badges: ["verifie", "foodie-certifie", "fondateur"] as string[],
    city: "Paris",
    meetupCount: 12,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return {
    title: `${profile.name}, ${profile.age} - ${profile.city}`,
    description: `Decouvre le profil de ${profile.name} sur CeSoir. ${profile.bio.slice(0, 100)}`,
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
  const profileBadges = profile.badges.map((key) => getBadgeById(key)).filter((b): b is Badge => b !== undefined);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header gradient */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-[13px] text-text-muted hover:text-text transition-colors">
            ← cesoir-app.vercel.app
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <div className="relative -mt-16 px-5 max-w-md mx-auto">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-2xl gradient-bg p-[3px] shadow-glow">
          <div className="w-full h-full rounded-[13px] bg-bg flex items-center justify-center text-[36px] font-black text-accent">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Name + age + city */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-black tracking-tight text-text">{profile.name}</h1>
            <span className="text-[16px] text-text-muted font-light">{profile.age}</span>
          </div>
          <p className="text-[13px] text-text-muted">{profile.city}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-4">
          <div className="bg-bg-card border border-border rounded-xl px-4 py-2 text-center">
            <p className="text-[18px] font-black gradient-text">{profile.meetupCount}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Rencontres</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl px-4 py-2 text-center">
            <p className="text-[18px] font-black gradient-text">{profile.activeModes.length}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Modes actifs</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-2">A propos</p>
          <p className="text-[14px] text-text leading-relaxed">{profile.bio}</p>
        </div>

        {/* Active modes */}
        <div className="mt-6">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Modes actifs</p>
          <div className="flex flex-wrap gap-2">
            {profile.activeModes.map((key) => {
              const mode = MODES[key as keyof typeof MODES];
              if (!mode) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-bg-card border border-border rounded-full px-3 py-1.5"
                >
                  <span className="text-[14px]" aria-hidden="true">{mode.icon}</span>
                  <span className="text-[12px] font-medium text-text">{mode.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        {profileBadges.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Badges</p>
            <div className="flex flex-wrap gap-2">
              {profileBadges.map((badge) => {
                const color = RARITY_CONFIG[badge.rarity].borderColor;
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-medium"
                    style={{
                      borderColor: `${color}30`,
                      background: `${color}10`,
                      color,
                    }}
                  >
                    <span aria-hidden="true">{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA for non-users */}
        <div className="mt-10 mb-24">
          <div className="bg-bg-card border border-accent/15 rounded-2xl p-6 text-center">
            <p className="text-[14px] font-bold text-text mb-1">
              Envie de rencontrer {profile.name} ce soir ?
            </p>
            <p className="text-[12px] text-text-muted mb-5">
              Rejoins CeSoir gratuitement et connecte-toi avec des gens pres de toi.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 rounded-xl gradient-bg text-white text-[14px] font-bold shadow-glow active:scale-[0.97] transition-transform tap-target"
            >
              Rejoindre CeSoir
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

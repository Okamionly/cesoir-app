"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

interface Feature {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: "NEW" | "PRO" | "BETA";
}

const SECTIONS: { title: string; features: Feature[] }[] = [
  {
    title: "Decouverte",
    features: [
      { emoji: "🌙", title: "Explorer", subtitle: "Feed en direct", href: "/feed" },
      { emoji: "🃏", title: "Browse", subtitle: "Swipe les profils", href: "/browse" },
      { emoji: "🔍", title: "Discover", subtitle: "Grille avec filtres", href: "/discover" },
      { emoji: "✨", title: "Pour toi", subtitle: "Recommandations IA", href: "/pour-toi", badge: "NEW" },
      { emoji: "🎯", title: "Smart Queue", subtitle: "8 matchs/heure", href: "/queue" },
      { emoji: "⭐", title: "Standouts", subtitle: "Top 5%", href: "/standouts", badge: "PRO" },
      { emoji: "🔥", title: "Trending", subtitle: "Profils populaires", href: "/trending-profiles" },
      { emoji: "📍", title: "Croises", subtitle: "Vous etes croises", href: "/crossed" },
    ],
  },
  {
    title: "Matching",
    features: [
      { emoji: "🎯", title: "Mood Match", subtitle: "Match par humeur", href: "/mood-match" },
      { emoji: "🤖", title: "Assistant IA", subtitle: "Concierge perso", href: "/assistant", badge: "NEW" },
      { emoji: "💖", title: "CrushTime", subtitle: "Devine qui t'a like", href: "/crushtime" },
      { emoji: "⚡", title: "Speed Dating", subtitle: "5 rounds video", href: "/speed-dating" },
    ],
  },
  {
    title: "Soirees & Events",
    features: [
      { emoji: "🎉", title: "Soirees", subtitle: "Organiser & rejoindre", href: "/soiree", badge: "NEW" },
      { emoji: "✨", title: "Creer une soiree", subtitle: "Wizard 4 etapes", href: "/soiree/create", badge: "NEW" },
      { emoji: "📅", title: "Events", subtitle: "Pop-up events", href: "/events" },
      { emoji: "🎫", title: "Marketplace", subtitle: "Events partenaires", href: "/events/marketplace" },
      { emoji: "👥", title: "Groupe", subtitle: "Sortie a plusieurs", href: "/group" },
      { emoji: "🎙️", title: "Salons vocaux", subtitle: "Audio rooms", href: "/rooms" },
    ],
  },
  {
    title: "Communication",
    features: [
      { emoji: "💬", title: "Chat", subtitle: "Tes conversations", href: "/chat" },
      { emoji: "❤️", title: "Compatibilite", subtitle: "Quiz de couple", href: "/quiz" },
      { emoji: "💡", title: "Date Ideas", subtitle: "50 idees de soiree", href: "/ideas" },
      { emoji: "🎵", title: "Vibes", subtitle: "Mood musical", href: "/vibes" },
    ],
  },
  {
    title: "Carte & Quartier",
    features: [
      { emoji: "🗺️", title: "Carte", subtitle: "Hotspots live", href: "/map" },
      { emoji: "📍", title: "Guide quartier", subtitle: "8 quartiers Paris", href: "/guide" },
      { emoji: "📸", title: "Stories", subtitle: "Vibes de la soiree", href: "/stories" },
    ],
  },
  {
    title: "Profil & Progression",
    features: [
      { emoji: "👤", title: "Mon Profil", subtitle: "Ce que tu vois", href: "/profile" },
      { emoji: "🎨", title: "Modes", subtitle: "14 ambiances", href: "/modes" },
      { emoji: "📊", title: "Insights", subtitle: "Tes stats", href: "/insights" },
      { emoji: "🏆", title: "Achievements", subtitle: "30 badges", href: "/achievements" },
      { emoji: "📅", title: "Timeline", subtitle: "Ton parcours", href: "/timeline" },
      { emoji: "📜", title: "Memories", subtitle: "Souvenirs", href: "/memories" },
      { emoji: "🎫", title: "Battle Pass", subtitle: "Saison en cours", href: "/battle-pass" },
      { emoji: "📈", title: "Leaderboard", subtitle: "Classement", href: "/leaderboard" },
    ],
  },
  {
    title: "Securite & Confiance",
    features: [
      { emoji: "🛡️", title: "Trust Center", subtitle: "Score de confiance", href: "/trust", badge: "NEW" },
      { emoji: "🚨", title: "Securite", subtitle: "SOS, check-in", href: "/safety" },
      { emoji: "✅", title: "Verification", subtitle: "Selfie, SMS, video", href: "/profile/verify" },
      { emoji: "⭐", title: "Avis", subtitle: "Mes reviews", href: "/reviews" },
    ],
  },
  {
    title: "Premium & Boutique",
    features: [
      { emoji: "👑", title: "Premium", subtitle: "Debloquer tout", href: "/premium", badge: "PRO" },
      { emoji: "🛒", title: "Boutique", subtitle: "Roses, boosts", href: "/shop" },
      { emoji: "🎁", title: "Referral", subtitle: "Invite des amis", href: "/referral" },
      { emoji: "📤", title: "Partager", subtitle: "Carte profil", href: "/profile/share" },
    ],
  },
  {
    title: "Parametres",
    features: [
      { emoji: "⚙️", title: "Settings", subtitle: "Preferences", href: "/settings" },
      { emoji: "🔔", title: "Notifications", subtitle: "Alertes", href: "/notifications" },
      { emoji: "📊", title: "Admin", subtitle: "Dashboard", href: "/admin" },
    ],
  },
];

const BADGE_STYLE: Record<string, string> = {
  NEW: "bg-accent-2 text-black",
  PRO: "bg-amber-500 text-white",
  BETA: "bg-blue-500 text-white",
};

export default function AllFeaturesPage() {
  const router = useRouter();
  const totalFeatures = SECTIONS.reduce((acc, s) => acc + s.features.length, 0);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted"
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-text">Toutes les features</h1>
            <p className="text-[10px] text-text-muted">{totalFeatures} fonctionnalites</p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="px-5 py-6 space-y-8">
        {SECTIONS.map((section, sectionIndex) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.04 }}
          >
            <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {section.features.map((feature, featureIndex) => (
                <motion.div
                  key={feature.href}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: sectionIndex * 0.04 + featureIndex * 0.02,
                  }}
                >
                  <Link
                    href={feature.href}
                    className="block p-3 bg-bg-card border border-border rounded-xl hover:border-accent transition-colors active:scale-[0.97] tap-target"
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[26px] leading-none">{feature.emoji}</span>
                      {feature.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_STYLE[feature.badge]}`}>
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold text-text leading-tight mb-0.5">
                      {feature.title}
                    </div>
                    <div className="text-[10px] text-text-muted leading-tight">
                      {feature.subtitle}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-[11px] text-text-muted">
            ☾ CeSoir · {totalFeatures} fonctionnalites
          </p>
        </div>
      </div>
    </div>
  );
}

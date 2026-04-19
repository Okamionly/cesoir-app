"use client";

import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";

type Tab = "achievements" | "challenges" | "leaderboard" | "trust" | "reviews";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "achievements", label: "Badges", emoji: "\uD83C\uDFC6" },
  { key: "challenges", label: "Defis", emoji: "\u26A1" },
  { key: "leaderboard", label: "Classement", emoji: "\uD83D\uDC51" },
  { key: "trust", label: "Confiance", emoji: "\u2728" },
  { key: "reviews", label: "Reviews", emoji: "\uD83D\uDCAC" },
];

function AchievementsTab() {
  return (
    <div className="py-6 px-5 text-center">
      <div className="text-5xl mb-3">{"\uD83C\uDFC6"}</div>
      <h2 className="text-base font-bold text-text">Badges et achievements</h2>
      <p className="text-xs text-text-muted mt-1">Demarre une conversation, valide ton profil, sors — debloque des badges.</p>
    </div>
  );
}

function ChallengesTab() {
  return (
    <div className="py-6 px-5 text-center">
      <div className="text-5xl mb-3">{"\u26A1"}</div>
      <h2 className="text-base font-bold text-text">Defis du jour</h2>
      <p className="text-xs text-text-muted mt-1">Nouveaux defis chaque matin minuit. Termine-les pour gagner du karma.</p>
    </div>
  );
}

function LeaderboardTab() {
  return (
    <div className="py-6 px-5 text-center">
      <div className="text-5xl mb-3">{"\uD83D\uDC51"}</div>
      <h2 className="text-base font-bold text-text">Classement</h2>
      <p className="text-xs text-text-muted mt-1">Le top 10 des sorteurs, par karma et meetups confirmes.</p>
    </div>
  );
}

function TrustTab() {
  return (
    <div className="py-6 px-5 text-center">
      <div className="text-5xl mb-3">{"\u2728"}</div>
      <h2 className="text-base font-bold text-text">Score de confiance</h2>
      <p className="text-xs text-text-muted mt-1">Verification photo + ID + reviews = score visible par tout le monde.</p>
    </div>
  );
}

function ReviewsTab() {
  return (
    <div className="py-6 px-5 text-center">
      <div className="text-5xl mb-3">{"\uD83D\uDCAC"}</div>
      <h2 className="text-base font-bold text-text">Reviews recues & donnees</h2>
      <p className="text-xs text-text-muted mt-1">Apres chaque meetup, laisse une review. Aide la communaute a faire confiance.</p>
    </div>
  );
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("achievements");

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Progression"
        backHref="/profile"
        slotBelowTitle={
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <m.button
                key={t.key}
                onClick={() => setTab(t.key)}
                whileTap={{ scale: 0.92 }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border tap-target transition-all ${
                  tab === t.key
                    ? "border-accent gradient-bg text-white"
                    : "border-border text-text-muted"
                }`}
              >
                <span className="mr-1" aria-hidden="true">{t.emoji}</span>
                {t.label}
              </m.button>
            ))}
          </div>
        }
      />

      <main className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <m.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={springs.snap}
          >
            {tab === "achievements" && <AchievementsTab />}
            {tab === "challenges" && <ChallengesTab />}
            {tab === "leaderboard" && <LeaderboardTab />}
            {tab === "trust" && <TrustTab />}
            {tab === "reviews" && <ReviewsTab />}
          </m.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

"use client";

// ========================================
// Crossed Paths — People you crossed paths with
// ========================================
//
// Shows profiles of people who were in the same area recently.
// Location + time context: "Vous vous etes croises a {location} il y a {time}"
//
// Animation signature: Path trace
// Cards slide in along a curved path mimicking a walking route.
// Location pins drop with rubber bounce, time badges fade
// with cinematic blur-to-sharp transition.

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

// ─────────────────────────────────────────
// Springs — path trace physics
// ─────────────────────────────────────────

const pathSprings = {
  /** Card slide — sweeping curve entrance */
  cardSweep: { type: "spring" as const, stiffness: 160, damping: 24, mass: 1.3 },
  /** Pin drop — rubber bounce */
  pinDrop: { type: "spring" as const, stiffness: 380, damping: 15, mass: 0.7 },
  /** Time badge — smooth deblur */
  timeFade: { type: "spring" as const, stiffness: 100, damping: 25, mass: 1.5 },
  /** CTA button — playful bounce */
  ctaBounce: { type: "spring" as const, stiffness: 420, damping: 18, mass: 0.6 },
};

// ─────────────────────────────────────────
// Types & Mock data
// ─────────────────────────────────────────

interface CrossedProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  timeAgo: string;
  distance: number;
  crossCount: number;
}

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MOCK_CROSSED: CrossedProfile[] = [
  {
    id: "cx1",
    name: "Camille",
    age: 27,
    photo: photo("women", 14),
    bio: "Brunch addict, toujours au meme cafe le dimanche matin",
    location: "Canal Saint-Martin",
    timeAgo: "Il y a 2h",
    distance: 0.3,
    crossCount: 3,
  },
  {
    id: "cx2",
    name: "Adrien",
    age: 30,
    photo: photo("men", 45),
    bio: "Je cours tous les soirs le long du canal. On se croise souvent !",
    location: "Parc des Buttes-Chaumont",
    timeAgo: "Il y a 4h",
    distance: 0.8,
    crossCount: 5,
  },
  {
    id: "cx3",
    name: "Lina",
    age: 25,
    photo: photo("women", 63),
    bio: "Freelance qui travaille toujours dans les cafes du 11e",
    location: "Rue Oberkampf",
    timeAgo: "Il y a 6h",
    distance: 0.2,
    crossCount: 8,
  },
  {
    id: "cx4",
    name: "Hugo",
    age: 33,
    photo: photo("men", 71),
    bio: "Photographe, souvent au Marais pour les vernissages",
    location: "Place des Vosges",
    timeAgo: "Hier soir",
    distance: 1.2,
    crossCount: 2,
  },
  {
    id: "cx5",
    name: "Sana",
    age: 28,
    photo: photo("women", 38),
    bio: "En mode exploration, j'adore decouvrir de nouveaux quartiers",
    location: "Belleville",
    timeAgo: "Hier a 19h",
    distance: 0.6,
    crossCount: 1,
  },
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function CrossedPathsPage() {
  const [greetedIds, setGreetedIds] = useState<Set<string>>(new Set());

  const handleGreet = (id: string) => {
    setGreetedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border/50 px-5 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-[20px] font-black text-text">Chemins croises</h1>
          <p className="text-[12px] text-text-muted">
            Des gens que vous avez croises recemment
          </p>
        </div>
      </header>

      {/* Path visualization line */}
      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="relative">
          {/* Vertical path line */}
          <motion.div
            className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent via-accent/50 to-accent/10"
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Crossed path cards */}
          <div className="space-y-4">
            {MOCK_CROSSED.map((person, i) => (
              <CrossedCard
                key={person.id}
                person={person}
                index={i}
                greeted={greetedIds.has(person.id)}
                onGreet={() => handleGreet(person.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <motion.div
          className="mt-8 p-4 rounded-2xl bg-border/20 border border-border/50 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...pathSprings.timeFade, delay: 1 }}
        >
          <p className="text-[12px] text-text-muted">
            Votre position est approximative et jamais partagee en temps reel.
            <br />
            Seuls les croisements passes sont affiches.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CrossedCard
// ─────────────────────────────────────────

function CrossedCard({
  person,
  index,
  greeted,
  onGreet,
}: {
  person: CrossedProfile;
  index: number;
  greeted: boolean;
  onGreet: () => void;
}) {
  return (
    <motion.div
      className="relative pl-12"
      initial={{ opacity: 0, x: -30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        ...pathSprings.cardSweep,
        delay: 0.2 + index * 0.12,
      }}
    >
      {/* Path dot */}
      <motion.div
        className="absolute left-[16px] top-5 w-[16px] h-[16px] rounded-full bg-accent border-[3px] border-bg z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          ...pathSprings.pinDrop,
          delay: 0.3 + index * 0.12,
        }}
      />

      {/* Card */}
      <div className="bg-bg border border-border/60 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          {/* Photo */}
          <motion.div
            className="relative shrink-0"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              ...pathSprings.pinDrop,
              delay: 0.35 + index * 0.12,
            }}
          >
            <img
              src={person.photo}
              alt={person.name}
              loading="lazy"
              decoding="async"
              className="w-14 h-14 rounded-full object-cover border-2 border-accent/20"
            />
            {person.crossCount > 1 && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...pathSprings.pinDrop, delay: 0.5 + index * 0.12 }}
              >
                {person.crossCount}x
              </motion.div>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="text-[15px] font-bold text-text">
                {person.name}, {person.age}
              </h3>
              <motion.span
                className="text-[10px] text-text-muted"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{
                  ...pathSprings.timeFade,
                  delay: 0.4 + index * 0.12,
                }}
              >
                {person.timeAgo}
              </motion.span>
            </div>

            {/* Location badge */}
            <motion.div
              className="flex items-center gap-1 mb-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                ...pathSprings.cardSweep,
                delay: 0.45 + index * 0.12,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[11px] text-accent font-medium">
                {person.location}
              </span>
              <span className="text-[10px] text-text-muted">
                &middot; {person.distance} km
              </span>
            </motion.div>

            <p className="text-[12px] text-text-muted line-clamp-1 mb-2.5">
              {person.bio}
            </p>

            {/* CTA */}
            <motion.button
              onClick={onGreet}
              disabled={greeted}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                greeted
                  ? "bg-accent/10 border border-accent/20 text-accent"
                  : "gradient-bg text-white shadow-sm"
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...pathSprings.ctaBounce,
                delay: 0.5 + index * 0.12,
              }}
              whileTap={!greeted ? { scale: 0.92 } : {}}
            >
              {greeted ? "\u2705 Bonjour envoye" : "\uD83D\uDC4B Dire bonjour"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

// ========================================
// DoubleMatch — Squad matching (2v2)
// ========================================
//
// UI for matching your squad (2 people) with another squad.
// Shows both pairs side by side. "Match de groupe" button.
//
// Animation signature: Collision merge
// Two squads slide in from opposite sides and merge at center.
// Avatars orbit with magnetic pull physics, connection lines
// draw between matched pairs, group button ignites with energy.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─────────────────────────────────────────
// Springs — collision merge physics
// ─────────────────────────────────────────

const collisionSprings = {
  /** Squad slide — heavy momentum from sides */
  squadSlide: { type: "spring" as const, stiffness: 180, damping: 22, mass: 1.6 },
  /** Avatar orbit — gentle gravitational pull */
  avatarOrbit: { type: "spring" as const, stiffness: 120, damping: 18, mass: 1.0 },
  /** Connection line — smooth draw */
  lineDraw: { type: "spring" as const, stiffness: 80, damping: 28, mass: 1.4 },
  /** Ignite button — explosive pop */
  ignite: { type: "spring" as const, stiffness: 500, damping: 12, mass: 0.5 },
  /** Celebration — big elastic burst */
  celebrate: { type: "spring" as const, stiffness: 300, damping: 10, mass: 0.8 },
};

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SquadMember {
  id: string;
  name: string;
  photo: string;
  age: number;
}

interface SquadPair {
  id: string;
  members: [SquadMember, SquadMember];
  activity: string;
  location: string;
}

// ─────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MY_SQUAD: SquadPair = {
  id: "my-squad",
  members: [
    { id: "me1", name: "Vous", photo: photo("men", 32), age: 28 },
    { id: "me2", name: "Theo", photo: photo("men", 84), age: 26 },
  ],
  activity: "Bar + concert",
  location: "Oberkampf",
};

const MATCH_SQUADS: SquadPair[] = [
  {
    id: "sq1",
    members: [
      { id: "o1", name: "Sarah", photo: photo("women", 44), age: 27 },
      { id: "o2", name: "Chloe", photo: photo("women", 67), age: 25 },
    ],
    activity: "Cocktails + danse",
    location: "Le Marais",
  },
  {
    id: "sq2",
    members: [
      { id: "o3", name: "Ines", photo: photo("women", 52), age: 27 },
      { id: "o4", name: "Luna", photo: photo("women", 18), age: 24 },
    ],
    activity: "Cinema + bar",
    location: "Chatelet",
  },
  {
    id: "sq3",
    members: [
      { id: "o5", name: "Nadia", photo: photo("women", 28), age: 29 },
      { id: "o6", name: "Manon", photo: photo("women", 57), age: 25 },
    ],
    activity: "Escape game",
    location: "Bastille",
  },
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface DoubleMatchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoubleMatch({ isOpen, onClose }: DoubleMatchProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matched, setMatched] = useState(false);
  const [passed, setPassed] = useState<Set<string>>(new Set());

  const currentSquad = MATCH_SQUADS[currentIndex];

  const handleMatch = useCallback(() => {
    setMatched(true);
  }, []);

  const handlePass = useCallback(() => {
    setPassed((prev) => new Set(prev).add(currentSquad.id));
    if (currentIndex < MATCH_SQUADS.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, currentSquad]);

  const handleDismiss = useCallback(() => {
    setMatched(false);
    setCurrentIndex(0);
    setPassed(new Set());
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-label="Match de groupe"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70"
            onClick={handleDismiss}
          />

          {/* Content */}
          <motion.div
            className="relative bg-bg rounded-3xl border border-border w-full max-w-sm shadow-xl overflow-hidden"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={collisionSprings.squadSlide}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-black text-text">
                    Double Match
                  </h2>
                  <p className="text-[11px] text-text-muted">
                    Votre squad rencontre un autre squad
                  </p>
                </div>
                <motion.button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-border/50 flex items-center justify-center text-text-muted"
                  whileTap={{ scale: 0.85 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Match celebration */}
            <AnimatePresence mode="wait">
              {matched ? (
                <MatchCelebration
                  mySquad={MY_SQUAD}
                  otherSquad={currentSquad}
                  onDismiss={handleDismiss}
                />
              ) : (
                <motion.div
                  key={currentSquad.id}
                  className="px-5 py-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* VS Layout */}
                  <div className="flex items-center justify-center gap-4 mb-5">
                    {/* My Squad */}
                    <SquadBubble
                      squad={MY_SQUAD}
                      side="left"
                      label="Votre squad"
                    />

                    {/* VS indicator */}
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...collisionSprings.ignite, delay: 0.3 }}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-glow"
                        animate={{
                          scale: [1, 1.08, 1],
                          boxShadow: [
                            "0 0 0px rgba(139,92,246,0)",
                            "0 0 16px rgba(139,92,246,0.5)",
                            "0 0 0px rgba(139,92,246,0)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <span className="text-white font-black text-[12px]">VS</span>
                      </motion.div>
                    </motion.div>

                    {/* Other Squad */}
                    <SquadBubble
                      squad={currentSquad}
                      side="right"
                      label={currentSquad.activity}
                    />
                  </div>

                  {/* Squad info */}
                  <div className="text-center mb-5">
                    <p className="text-[13px] text-text-muted mb-1">
                      {currentSquad.members[0].name} & {currentSquad.members[1].name}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[11px] text-accent font-medium">
                        {"\uD83D\uDCCD"} {currentSquad.location}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        &middot; {currentSquad.activity}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handlePass}
                      className="flex-1 py-3 rounded-2xl bg-border/50 border border-border text-text-muted font-bold text-[14px]"
                      whileTap={{ scale: 0.95, transition: collisionSprings.ignite }}
                    >
                      Passer
                    </motion.button>
                    <motion.button
                      onClick={handleMatch}
                      className="flex-1 py-3 rounded-2xl gradient-bg text-white font-bold text-[14px] shadow-glow flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.95, transition: collisionSprings.ignite }}
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(139,92,246,0)",
                          "0 0 24px rgba(139,92,246,0.4)",
                          "0 0 0px rgba(139,92,246,0)",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {"\uD83D\uDE4C"} Match de groupe
                    </motion.button>
                  </div>

                  {/* Counter */}
                  <div className="flex justify-center mt-3">
                    <span className="text-[10px] text-text-muted">
                      {currentIndex + 1} / {MATCH_SQUADS.length} squads
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────
// SquadBubble — two overlapping avatars
// ─────────────────────────────────────────

function SquadBubble({
  squad,
  side,
  label,
}: {
  squad: SquadPair;
  side: "left" | "right";
  label: string;
}) {
  const dir = side === "left" ? -1 : 1;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ x: dir * 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        ...collisionSprings.squadSlide,
        delay: side === "left" ? 0.1 : 0.2,
      }}
    >
      {/* Overlapping avatars */}
      <div className="relative flex -space-x-3 mb-2">
        {squad.members.map((member, i) => (
          <motion.div
            key={member.id}
            className="relative"
            style={{ zIndex: 2 - i }}
            initial={{
              x: dir * (20 + i * 15),
              scale: 0.5,
              opacity: 0,
            }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            transition={{
              ...collisionSprings.avatarOrbit,
              delay: 0.15 + i * 0.1,
            }}
          >
            <img
              src={member.photo}
              alt={member.name}
              className="w-14 h-14 rounded-full object-cover border-[3px] border-bg"
              loading="lazy"
              decoding="async"
            />
            {/* Subtle glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(139,92,246,0)",
                  "0 0 10px rgba(139,92,246,0.3)",
                  "0 0 0px rgba(139,92,246,0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ))}
      </div>

      <span className="text-[10px] text-text-muted font-medium text-center max-w-[80px] truncate">
        {label}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// MatchCelebration — post-match celebration
// ─────────────────────────────────────────

function MatchCelebration({
  mySquad,
  otherSquad,
  onDismiss,
}: {
  mySquad: SquadPair;
  otherSquad: SquadPair;
  onDismiss: () => void;
}) {
  const allMembers = [...mySquad.members, ...otherSquad.members];

  return (
    <motion.div
      className="px-5 py-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Celebration burst */}
      <motion.div
        className="text-[56px] mb-3"
        initial={{ scale: 0, rotate: -20 }}
        animate={{
          scale: [0, 1.5, 0.9, 1.15, 1],
          rotate: [-20, 15, -8, 5, 0],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.25, 0.45, 0.65, 1],
        }}
      >
        {"\uD83C\uDF89"}
      </motion.div>

      <motion.h3
        className="text-[22px] font-black gradient-text mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...collisionSprings.celebrate, delay: 0.3 }}
      >
        Match de groupe !
      </motion.h3>

      <motion.p
        className="text-[13px] text-text-muted mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Vous allez pouvoir organiser une sortie ensemble
      </motion.p>

      {/* Merged avatars */}
      <div className="flex items-center justify-center -space-x-2 mb-6">
        {allMembers.map((member, i) => (
          <motion.img
            key={member.id}
            src={member.photo}
            alt={member.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-bg"
            initial={{ scale: 0, x: (i - 1.5) * 30 }}
            animate={{ scale: 1, x: 0 }}
            transition={{
              ...collisionSprings.celebrate,
              delay: 0.4 + i * 0.08,
            }}
          />
        ))}
      </div>

      {/* Action */}
      <motion.button
        onClick={onDismiss}
        className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-bold shadow-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...collisionSprings.celebrate, delay: 0.7 }}
        whileTap={{ scale: 0.95 }}
      >
        Organiser la soiree
      </motion.button>
    </motion.div>
  );
}

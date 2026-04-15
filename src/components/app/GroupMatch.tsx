"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MOCK_PROFILES } from "@/lib/mock-profiles";

// ─── Types ───────────────────────────────────────

interface SquadMember {
  id: string;
  name: string;
  photo: string;
}

interface Squad {
  id: string;
  members: SquadMember[];
  activity: string;
  emoji: string;
  time: string;
}

// ─── Mock data ───────────────────────────────────

const MY_FRIENDS: SquadMember[] = MOCK_PROFILES.slice(0, 6).map((p) => ({
  id: p.id,
  name: p.name,
  photo: p.photo,
}));

const ACTIVITIES = [
  { label: "Bar / Drinks", emoji: "\uD83C\uDF7B" },
  { label: "Restaurant", emoji: "\uD83C\uDF7D\uFE0F" },
  { label: "Cinema", emoji: "\uD83C\uDFAC" },
  { label: "Concert", emoji: "\uD83C\uDFB5" },
  { label: "Karaoke", emoji: "\uD83C\uDFA4" },
  { label: "Escape game", emoji: "\uD83D\uDD10" },
];

const OTHER_SQUADS: Squad[] = [
  {
    id: "s1",
    members: MOCK_PROFILES.slice(8, 10).map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
    })),
    activity: "Bar / Drinks",
    emoji: "\uD83C\uDF7B",
    time: "21h",
  },
  {
    id: "s2",
    members: MOCK_PROFILES.slice(10, 13).map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
    })),
    activity: "Karaoke",
    emoji: "\uD83C\uDFA4",
    time: "22h",
  },
  {
    id: "s3",
    members: MOCK_PROFILES.slice(6, 8).map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
    })),
    activity: "Bar / Drinks",
    emoji: "\uD83C\uDF7B",
    time: "20h30",
  },
];

// ─── Component ───────────────────────────────────

export default function GroupMatch() {
  const [step, setStep] = useState<"select" | "activity" | "results" | "matched">("select");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [matchedSquad, setMatchedSquad] = useState<Squad | null>(null);

  const toggleFriend = (id: string) => {
    const next = new Set(selectedFriends);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 3) {
      // Max 3 friends + you = 4
      next.add(id);
    }
    setSelectedFriends(next);
  };

  const mySquadMembers: SquadMember[] = [
    { id: "me", name: "Toi", photo: "https://randomuser.me/api/portraits/men/1.jpg" },
    ...MY_FRIENDS.filter((f) => selectedFriends.has(f.id)),
  ];

  const filteredSquads = OTHER_SQUADS.filter(
    (s) => !selectedActivity || s.activity === selectedActivity
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.heavy}
        className="text-center"
      >
        <h2 className="text-lg font-bold text-text">Match de groupe</h2>
        <p className="text-sm text-text-muted mt-1">
          Formez votre squad et trouvez d&apos;autres groupes
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Select friends ─── */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springs.heavy}
            className="space-y-4"
          >
            <p className="text-sm font-semibold text-text">
              Choisis tes co-equipiers (1-3)
            </p>

            <div className="grid grid-cols-3 gap-3">
              {MY_FRIENDS.map((friend, i) => {
                const isSelected = selectedFriends.has(friend.id);
                return (
                  <motion.button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.elastic, delay: i * 0.06 }}
                    whileTap={micro.tapScale}
                    className={`
                      relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors
                      ${isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg-card hover:border-accent/40"
                      }
                    `}
                  >
                    <div className="relative">
                      <img
                        src={friend.photo}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springs.elastic}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-text truncate max-w-full">
                      {friend.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => selectedFriends.size > 0 && setStep("activity")}
              whileTap={micro.tapScale}
              className={`
                w-full py-3 rounded-xl font-semibold text-sm transition-all
                ${selectedFriends.size > 0
                  ? "bg-accent text-white"
                  : "bg-border text-text-muted cursor-not-allowed"
                }
              `}
            >
              Continuer avec {selectedFriends.size + 1} personnes
            </motion.button>
          </motion.div>
        )}

        {/* ─── Step 2: Choose activity ─── */}
        {step === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={springs.heavy}
            className="space-y-4"
          >
            <p className="text-sm font-semibold text-text">
              Quelle activite ce soir ?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map((act, i) => (
                <motion.button
                  key={act.label}
                  onClick={() => setSelectedActivity(act.label)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.elastic, delay: i * 0.05 }}
                  whileTap={micro.tapScale}
                  className={`
                    p-4 rounded-2xl border-2 text-left transition-colors
                    ${selectedActivity === act.label
                      ? "border-accent bg-accent/10"
                      : "border-border bg-bg-card"
                    }
                  `}
                >
                  <span className="text-2xl">{act.emoji}</span>
                  <p className="text-sm font-medium text-text mt-1">{act.label}</p>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={() => setStep("select")}
                whileTap={micro.tapScale}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text-muted"
              >
                Retour
              </motion.button>
              <motion.button
                onClick={() => selectedActivity && setStep("results")}
                whileTap={micro.tapScale}
                className={`
                  flex-1 py-3 rounded-xl font-semibold text-sm
                  ${selectedActivity ? "bg-accent text-white" : "bg-border text-text-muted cursor-not-allowed"}
                `}
              >
                Chercher des squads
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Results ─── */}
        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={springs.heavy}
            className="space-y-4"
          >
            {/* My squad preview */}
            <div className="p-4 rounded-2xl border border-accent/30 bg-accent/5">
              <p className="text-xs font-semibold text-accent mb-2">Votre squad</p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {mySquadMembers.map((m) => (
                    <img
                      key={m.id}
                      src={m.photo}
                      alt={m.name}
                      className="w-9 h-9 rounded-full border-2 border-bg object-cover"
                    />
                  ))}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-text">
                    {mySquadMembers.map((m) => m.name).join(", ")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {selectedActivity}
                  </p>
                </div>
              </div>
            </div>

            {/* Other squads */}
            <p className="text-sm font-semibold text-text">
              Squads dispo ({filteredSquads.length})
            </p>

            {filteredSquads.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                Aucun squad trouve pour cette activite
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSquads.map((squad, i) => (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.heavy, delay: i * 0.1 }}
                    className="p-4 rounded-2xl border border-border bg-bg-card"
                  >
                    {/* Side by side squads */}
                    <div className="flex items-center justify-between mb-3">
                      {/* Their squad */}
                      <div className="flex -space-x-2">
                        {squad.members.map((m) => (
                          <img
                            key={m.id}
                            src={m.photo}
                            alt={m.name}
                            className="w-10 h-10 rounded-full border-2 border-bg object-cover"
                          />
                        ))}
                      </div>

                      {/* VS divider */}
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mx-3 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center"
                      >
                        <span className="text-xs font-bold text-accent">VS</span>
                      </motion.div>

                      {/* My squad */}
                      <div className="flex -space-x-2">
                        {mySquadMembers.map((m) => (
                          <img
                            key={m.id}
                            src={m.photo}
                            alt={m.name}
                            className="w-10 h-10 rounded-full border-2 border-bg object-cover"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">
                          {squad.emoji} {squad.activity}
                        </p>
                        <p className="text-xs text-text-muted">
                          {squad.members.length} personnes &middot; {squad.time}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => {
                          setMatchedSquad(squad);
                          setStep("matched");
                        }}
                        whileTap={micro.tapScale}
                        whileHover={micro.hoverLift}
                        className="px-4 py-2 bg-[#00FF88] text-black rounded-xl text-sm font-bold"
                      >
                        On se retrouve ?
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.button
              onClick={() => setStep("activity")}
              whileTap={micro.tapScale}
              className="w-full py-3 rounded-xl border border-border text-sm font-medium text-text-muted"
            >
              Retour
            </motion.button>
          </motion.div>
        )}

        {/* ─── Step 4: Match celebration ─── */}
        {step === "matched" && matchedSquad && (
          <motion.div
            key="matched"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
            className="text-center space-y-5 py-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl"
            >
              {matchedSquad.emoji}
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-text">
                Match de groupe !
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {matchedSquad.members.length + mySquadMembers.length} personnes pour{" "}
                {matchedSquad.activity.toLowerCase()} ce soir
              </p>
            </div>

            {/* Combined avatars */}
            <div className="flex items-center justify-center -space-x-3">
              {[...matchedSquad.members, ...mySquadMembers].map((m, i) => (
                <motion.img
                  key={m.id}
                  src={m.photo}
                  alt={m.name}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ ...springs.elastic, delay: 0.3 + i * 0.1 }}
                  className="w-12 h-12 rounded-full border-2 border-accent object-cover"
                />
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.8 }}
              whileTap={micro.tapScale}
              className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm"
              onClick={() => setStep("select")}
            >
              Ouvrir le chat de groupe
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

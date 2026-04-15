"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface SquadMember {
  id: string;
  name: string;
  photo: string;
}

interface Squad {
  id: string;
  members: SquadMember[];
  activity: string;
  distance: number;
  mode: string;
}

// --- Helpers ---

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// --- Mock Data (8 squads) ---

const MOCK_SQUADS: Squad[] = [
  {
    id: "s1",
    members: [
      { id: "m1", name: "Marie", photo: photo("women", 90) },
      { id: "m2", name: "Lucas", photo: photo("men", 24) },
      { id: "m3", name: "Chloe", photo: photo("women", 67) },
    ],
    activity: "Soiree cinema",
    distance: 2.1,
    mode: "Plus-One",
  },
  {
    id: "s2",
    members: [
      { id: "m4", name: "Thomas", photo: photo("men", 75) },
      { id: "m5", name: "Ines", photo: photo("women", 52) },
    ],
    activity: "Bar gaming",
    distance: 1.5,
    mode: "Gamer Night",
  },
  {
    id: "s3",
    members: [
      { id: "m6", name: "Hugo", photo: photo("men", 41) },
      { id: "m7", name: "Lea", photo: photo("women", 42) },
      { id: "m8", name: "Priya", photo: photo("women", 64) },
      { id: "m9", name: "Kevin", photo: photo("men", 29) },
    ],
    activity: "Running nocturne",
    distance: 0.8,
    mode: "Fit Date",
  },
  {
    id: "s4",
    members: [
      { id: "m10", name: "Manon", photo: photo("women", 57) },
      { id: "m11", name: "Agathe", photo: photo("women", 76) },
    ],
    activity: "Salon de the",
    distance: 3.2,
    mode: "Sober Tonight",
  },
  {
    id: "s5",
    members: [
      { id: "m12", name: "Gabriel", photo: photo("men", 73) },
      { id: "m13", name: "Elise", photo: photo("women", 31) },
      { id: "m14", name: "Raphael", photo: photo("men", 82) },
    ],
    activity: "Expo Basquiat",
    distance: 4.0,
    mode: "Culture Club",
  },
  {
    id: "s6",
    members: [
      { id: "m15", name: "Claire", photo: photo("women", 25) },
      { id: "m16", name: "Maxime", photo: photo("men", 62) },
    ],
    activity: "Balade chiens",
    distance: 1.9,
    mode: "Dog Date",
  },
  {
    id: "s7",
    members: [
      { id: "m17", name: "Enzo", photo: photo("men", 16) },
      { id: "m18", name: "Nina", photo: photo("women", 83) },
      { id: "m19", name: "Axel", photo: photo("men", 39) },
    ],
    activity: "Escape game",
    distance: 2.6,
    mode: "Gamer Night",
  },
  {
    id: "s8",
    members: [
      { id: "m20", name: "Yasmine", photo: photo("women", 71) },
      { id: "m21", name: "Luna", photo: photo("women", 18) },
    ],
    activity: "Street food Belleville",
    distance: 3.5,
    mode: "Foodie Quest",
  },
];

// --- Component ---

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function SquadPage() {
  const [inviteCode] = useState(generateInviteCode);
  const [joinCode, setJoinCode] = useState("");
  const [mySquad, setMySquad] = useState<SquadMember[]>([]);
  const [copied, setCopied] = useState(false);

  const inviteLink = `cesoir.app/invite/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for unsupported browsers
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = () => {
    if (joinCode.trim().length === 6) {
      // Simulate joining a squad
      setMySquad([
        { id: "me", name: "Moi", photo: photo("men", 10) },
        { id: "friend1", name: "Alex", photo: photo("men", 32) },
      ]);
      setJoinCode("");
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1
          className="text-lg font-display font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
        >
          Squad Mode
        </h1>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Create squad card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5"
          aria-label="Creer ton squad"
        >
          <h2 className="text-base font-display font-bold text-text mb-1">Cree ton squad</h2>
          <p className="text-xs text-text-muted mb-4">Invite jusqu&apos;a 3 amis pour matcher ensemble</p>

          {/* My squad members */}
          {mySquad.length > 0 && (
            <div className="flex items-center gap-[-8px] mb-4" aria-label="Membres de ton squad">
              {mySquad.map((member, i) => (
                <div
                  key={member.id}
                  className="w-10 h-10 rounded-full border-2 border-bg overflow-hidden"
                  style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: mySquad.length - i }}
                >
                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {mySquad.length < 4 && (
                <div
                  className="w-10 h-10 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center text-text-muted"
                  style={{ marginLeft: "-8px" }}
                  aria-label="Place disponible"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Join with code */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Code d'invitation"
              maxLength={6}
              className="flex-1 px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent font-mono tracking-wider"
              aria-label="Code d'invitation"
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
            >
              Rejoindre
            </button>
          </div>

          {/* Share invite link */}
          <div className="flex items-center gap-2 bg-bg rounded-xl p-2.5 border border-border">
            <span className="flex-1 text-xs font-mono text-text-muted truncate">{inviteLink}</span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: copied ? "#00FF88" : "#8B5CF6" }}
              aria-label={copied ? "Lien copie" : "Copier le lien d'invitation"}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Copie
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    Copier
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.section>

        {/* Active squads section */}
        <section aria-label="Squads actifs ce soir">
          <h2 className="text-base font-display font-bold text-text mb-3">Squads actifs ce soir</h2>

          <div className="space-y-3">
            {MOCK_SQUADS.map((squad, i) => (
              <motion.div
                key={squad.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                {/* Overlapping avatars */}
                <div className="flex flex-shrink-0" aria-label={`${squad.members.length} membres`}>
                  {squad.members.slice(0, 3).map((member, j) => (
                    <div
                      key={member.id}
                      className="w-9 h-9 rounded-full border-2 border-card overflow-hidden"
                      style={{ marginLeft: j > 0 ? "-10px" : 0, zIndex: squad.members.length - j }}
                    >
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {squad.members.length > 3 && (
                    <div
                      className="w-9 h-9 rounded-full bg-accent/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-accent"
                      style={{ marginLeft: "-10px" }}
                    >
                      +{squad.members.length - 3}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {squad.members[0].name} + {squad.members.length - 1}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{squad.activity}</span>
                    <span className="text-[10px] text-text-muted">{squad.distance} km</span>
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                    {squad.mode}
                  </span>
                </div>

                {/* Propose button */}
                <button
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                  aria-label={`Proposer un plan au squad de ${squad.members[0].name}`}
                >
                  Proposer
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Fallback solo link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-2 pb-4"
        >
          <a href="/browse" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
            Matcher en solo &rarr;
          </a>
        </motion.div>
      </div>
    </div>
  );
}

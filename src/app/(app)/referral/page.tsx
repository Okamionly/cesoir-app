"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro, leaderboardVariants } from "@/lib/motion-design";
import { generateReferralCode } from "@/lib/referral";

// ─── Types ───────────────────────────────────────

interface ReferralFriend {
  id: string;
  name: string;
  photo: string;
  joinedAt: string;
  rosesEarned: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  photo: string;
  invites: number;
  rank: number;
}

// ─── Mock data ───────────────────────────────────

const MOCK_FRIENDS_JOINED: ReferralFriend[] = [
  {
    id: "rf1",
    name: "Marie",
    photo: "https://randomuser.me/api/portraits/women/45.jpg",
    joinedAt: "Il y a 3 jours",
    rosesEarned: 1,
  },
  {
    id: "rf2",
    name: "Lucas",
    photo: "https://randomuser.me/api/portraits/men/52.jpg",
    joinedAt: "Il y a 1 semaine",
    rosesEarned: 1,
  },
  {
    id: "rf3",
    name: "Emma",
    photo: "https://randomuser.me/api/portraits/women/33.jpg",
    joinedAt: "Il y a 2 semaines",
    rosesEarned: 1,
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lb1", name: "Sophie", photo: "https://randomuser.me/api/portraits/women/11.jpg", invites: 28, rank: 1 },
  { id: "lb2", name: "Maxime", photo: "https://randomuser.me/api/portraits/men/22.jpg", invites: 21, rank: 2 },
  { id: "lb3", name: "Clara", photo: "https://randomuser.me/api/portraits/women/66.jpg", invites: 15, rank: 3 },
  { id: "lb4", name: "Toi", photo: "https://randomuser.me/api/portraits/men/1.jpg", invites: 3, rank: 12 },
  { id: "lb5", name: "Julien", photo: "https://randomuser.me/api/portraits/men/35.jpg", invites: 2, rank: 13 },
];

// ─── Stats ───────────────────────────────────────

const MOCK_STATS = {
  invitesSent: 8,
  invitesAccepted: 3,
  rosesEarned: 3,
};

// ─── Confetti keyframes ──────────────────────────

const confettiKeyframes = `
@keyframes confetti-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}
`;

// ─── Page ────────────────────────────────────────

export default function ReferralPage() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"friends" | "leaderboard">("friends");
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  useEffect(() => {
    setCode(generateReferralCode("user-me-001"));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "Rejoins CeSoir !",
      text: `Utilise mon code ${code} pour rejoindre CeSoir et on gagne chacun une rose gratuite !`,
      url: `https://cesoir.app/join?ref=${code}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 3000);
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy link
      handleCopy();
    }
  }, [code, handleCopy]);

  const rankBadge = (rank: number) => {
    if (rank === 1) return "\uD83E\uDD47";
    if (rank === 2) return "\uD83E\uDD48";
    if (rank === 3) return "\uD83E\uDD49";
    return `#${rank}`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: confettiKeyframes }} />

      <div className="min-h-screen bg-bg pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
          className="px-4 pt-6 pb-4 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-5xl mb-3"
          >
            {"\uD83C\uDF81"}
          </motion.div>
          <h1 className="text-xl font-bold text-text">Invite tes amis</h1>
          <p className="text-sm text-text-muted mt-1">
            Pour chaque ami qui rejoint : +1 Rose gratuite {"\uD83C\uDF39"}
          </p>
        </motion.div>

        {/* Referral code card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springs.elastic, delay: 0.1 }}
          className="mx-4 p-5 rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            Ton code personnel
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 rounded-xl bg-bg border border-border font-mono text-lg font-bold text-text tracking-widest text-center">
              {code}
            </div>

            <motion.button
              onClick={handleCopy}
              whileTap={micro.tapScale}
              className={`
                shrink-0 p-3 rounded-xl transition-colors
                ${copied ? "bg-[#00FF88] text-black" : "bg-bg-card border border-border text-text"}
              `}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.svg
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Share button */}
          <motion.button
            onClick={handleShare}
            whileTap={micro.tapScale}
            whileHover={micro.hoverLift}
            className="w-full mt-4 py-3.5 bg-accent text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Partager le lien
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mx-4 mt-5">
          {[
            { value: MOCK_STATS.invitesSent, label: "Envoyes", icon: "\uD83D\uDCE8" },
            { value: MOCK_STATS.invitesAccepted, label: "Acceptes", icon: "\u2705" },
            { value: MOCK_STATS.rosesEarned, label: "Roses", icon: "\uD83C\uDF39" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.2 + i * 0.08 }}
              className="p-4 rounded-2xl bg-bg-card border border-border text-center"
            >
              <span className="text-lg">{stat.icon}</span>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.4 + i * 0.08 }}
                className="text-xl font-bold text-text mt-1"
              >
                {stat.value}
              </motion.p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-6 p-1 rounded-xl bg-bg-card border border-border">
          {(["friends", "leaderboard"] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileTap={micro.tapScale}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${tab === t ? "bg-accent text-white" : "text-text-muted"}
              `}
            >
              {t === "friends" ? "Amis rejoint" : "Classement"}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mx-4 mt-4">
          <AnimatePresence mode="wait">
            {tab === "friends" ? (
              <motion.div
                key="friends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={springs.heavy}
                className="space-y-3"
              >
                {MOCK_FRIENDS_JOINED.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">{"\uD83D\uDC4B"}</span>
                    <p className="text-sm text-text-muted mt-2">
                      Tes amis n&apos;ont pas encore rejoint
                    </p>
                  </div>
                ) : (
                  MOCK_FRIENDS_JOINED.map((friend, i) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.heavy, delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-bg-card border border-border"
                    >
                      <img
                        src={friend.photo}
                        alt={friend.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text">{friend.name}</p>
                        <p className="text-xs text-text-muted">{friend.joinedAt}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10">
                        <span className="text-xs">{"\uD83C\uDF39"}</span>
                        <span className="text-xs font-bold text-accent">+{friend.rosesEarned}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={springs.heavy}
                className="space-y-2"
              >
                {MOCK_LEADERBOARD.map((entry, i) => {
                  const isMe = entry.name === "Toi";
                  return (
                    <motion.div
                      key={entry.id}
                      variants={leaderboardVariants.row}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className={`
                        flex items-center gap-3 p-3 rounded-2xl border transition-all
                        ${isMe
                          ? "border-accent/30 bg-accent/5"
                          : "border-border bg-bg-card"
                        }
                      `}
                    >
                      {/* Rank */}
                      <div className="w-8 text-center shrink-0">
                        {entry.rank <= 3 ? (
                          <motion.span
                            animate={entry.rank === 1 ? leaderboardVariants.crown.idle : {}}
                            className="text-lg inline-block"
                          >
                            {rankBadge(entry.rank)}
                          </motion.span>
                        ) : (
                          <span className="text-sm font-bold text-text-muted">
                            {rankBadge(entry.rank)}
                          </span>
                        )}
                      </div>

                      <img
                        src={entry.photo}
                        alt={entry.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isMe ? "text-accent" : "text-text"}`}>
                          {entry.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {entry.invites} invitations
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs">{"\uD83C\uDF39"}</span>
                        <span className="text-sm font-bold text-text">{entry.invites}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share success toast */}
        <AnimatePresence>
          {showShareSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={springs.elastic}
              className="fixed bottom-24 left-4 right-4 z-50 p-4 rounded-2xl bg-[#00FF88] text-black text-center"
            >
              <p className="text-sm font-bold">
                {"\u2705"} Lien partage avec succes !
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

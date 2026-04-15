"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MOCK_PROFILES } from "@/lib/mock-profiles";

// ─── Types ───────────────────────────────────────

interface Friend {
  id: string;
  name: string;
  photo: string;
}

interface WingmanMatch {
  id: string;
  name: string;
  photo: string;
  time: string;
}

// ─── Mock data ───────────────────────────────────

const FRIENDS: Friend[] = MOCK_PROFILES.slice(0, 5).map((p) => ({
  id: p.id,
  name: p.name,
  photo: p.photo,
}));

const WINGMAN_MATCHES: WingmanMatch[] = [
  { id: "wm1", name: "Camille", photo: "https://randomuser.me/api/portraits/women/22.jpg", time: "il y a 12min" },
  { id: "wm2", name: "Manon", photo: "https://randomuser.me/api/portraits/women/55.jpg", time: "il y a 34min" },
  { id: "wm3", name: "Julie", photo: "https://randomuser.me/api/portraits/women/19.jpg", time: "il y a 1h" },
];

// ─── Keyframes ───────────────────────────────────

const shieldPulse = `
@keyframes shield-glow {
  0%, 100% { box-shadow: 0 0 0px rgba(139,92,246,0); }
  50% { box-shadow: 0 0 24px rgba(139,92,246,0.5); }
}
`;

// ─── Component ───────────────────────────────────

export default function WingmanMode() {
  const [active, setActive] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Simulate wingman finding matches after activation
  useEffect(() => {
    if (active && selectedFriend) {
      const timer = setTimeout(() => setShowResults(true), 2000);
      return () => clearTimeout(timer);
    }
    setShowResults(false);
  }, [active, selectedFriend]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shieldPulse }} />

      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
          className="text-center"
        >
          <motion.div
            animate={active ? {
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1],
            } : {}}
            transition={{ duration: 1.5, repeat: active ? Infinity : 0, repeatDelay: 3 }}
            className="text-4xl mb-2"
          >
            {active ? "\uD83E\uDDB8" : "\uD83E\uDDB8\u200D\u2642\uFE0F"}
          </motion.div>
          <h2 className="text-lg font-bold text-text">Mode Wingman</h2>
          <p className="text-sm text-text-muted mt-1">
            Laisse un ami gerer ton profil pour la soiree
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springs.elastic, delay: 0.1 }}
          className="p-4 rounded-2xl border border-border bg-bg-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">
                Activer le mode Wingman
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Ton ami pourra swiper pour toi
              </p>
            </div>

            <motion.button
              onClick={() => {
                if (active) {
                  setActive(false);
                  setSelectedFriend(null);
                } else if (selectedFriend) {
                  setActive(true);
                }
              }}
              whileTap={micro.tapScale}
              className={`
                relative w-14 h-8 rounded-full transition-colors duration-300
                ${active ? "bg-accent" : "bg-border"}
                ${!selectedFriend && !active ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <motion.div
                animate={{ x: active ? 24 : 2 }}
                transition={springs.snap}
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
                style={active ? { animation: "shield-glow 2s infinite" } : {}}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Friend selector */}
        {!active && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 0.15 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-text">
              Choisis ton wingman
            </p>

            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {FRIENDS.map((friend, i) => {
                const isSelected = selectedFriend?.id === friend.id;
                return (
                  <motion.button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.elastic, delay: i * 0.06 }}
                    whileTap={micro.tapScale}
                    className="shrink-0 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`
                        p-[2.5px] rounded-full transition-all
                        ${isSelected ? "bg-accent" : "bg-border"}
                      `}
                    >
                      <div className="p-[2px] rounded-full bg-bg">
                        <img
                          src={friend.photo}
                          alt={friend.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${isSelected ? "text-accent" : "text-text-muted"}`}>
                      {friend.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Active state */}
        <AnimatePresence>
          {active && selectedFriend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={springs.elastic}
              className="p-5 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 text-center space-y-4"
            >
              {/* Wingman avatar with ring */}
              <div className="flex items-center justify-center">
                <div
                  className="p-[3px] rounded-full"
                  style={{
                    background: "conic-gradient(#8B5CF6, #00FF88, #8B5CF6)",
                    animation: "ring-rotate 3s linear infinite",
                  }}
                >
                  <div className="p-[2px] rounded-full bg-bg">
                    <img
                      src={selectedFriend.photo}
                      alt={selectedFriend.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-text">
                  {selectedFriend.name} est ton wingman
                </p>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs text-accent mt-1"
                >
                  En train de swiper pour toi...
                </motion.p>
              </div>

              {/* Stats bar */}
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <motion.p
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    className="text-lg font-bold text-accent"
                  >
                    12
                  </motion.p>
                  <p className="text-[10px] text-text-muted">Swipes</p>
                </div>
                <div className="text-center">
                  <motion.p
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="text-lg font-bold text-[#00FF88]"
                  >
                    3
                  </motion.p>
                  <p className="text-[10px] text-text-muted">Matchs</p>
                </div>
                <div className="text-center">
                  <motion.p
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    className="text-lg font-bold text-text"
                  >
                    45min
                  </motion.p>
                  <p className="text-[10px] text-text-muted">Actif</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wingman results notification */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={springs.elastic}
              className="p-4 rounded-2xl border border-[#00FF88]/30 bg-[#00FF88]/5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  className="text-xl"
                >
                  {"\uD83C\uDF89"}
                </motion.span>
                <p className="text-sm font-bold text-text">
                  Ton wingman a trouve {WINGMAN_MATCHES.length} matchs ce soir !
                </p>
              </div>

              <div className="space-y-2">
                {WINGMAN_MATCHES.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.heavy, delay: i * 0.12 }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-bg"
                  >
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{m.name}</p>
                      <p className="text-[10px] text-text-muted">{m.time}</p>
                    </div>
                    <motion.button
                      whileTap={micro.tapScale}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold"
                    >
                      Voir
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-2 p-3 rounded-xl bg-bg-card border border-border"
        >
          <span className="text-sm shrink-0">{"\uD83D\uDD12"}</span>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Mode demo uniquement. En production, ton wingman devra accepter
            l&apos;invitation et ne pourra pas acceder a tes messages.
          </p>
        </motion.div>
      </div>
    </>
  );
}

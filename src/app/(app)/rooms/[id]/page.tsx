"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import AudioWave from "@/components/app/AudioWave";
import { useParams, useRouter } from "next/navigation";

// --- Types ---

interface Speaker {
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isHost?: boolean;
}

interface Listener {
  name: string;
  avatar: string;
}

interface HandRaise {
  name: string;
  avatar: string;
  raisedAt: number;
}

interface RoomData {
  id: string;
  title: string;
  modeLabel: string;
  modeColor: string;
  modeIcon: string;
  speakers: Speaker[];
  listeners: Listener[];
  handRaises: HandRaise[];
  startedAt: number; // timestamp ms
}

// --- Mock data ---

// Per-mode brand colors encoded on mock rooms — domain meta (matches modeMeta
// semantics in src/app/(app)/rooms/page.tsx). Not UI surface tokens.
const MOCK_ROOM_DATA: Record<string, RoomData> = {
  r1: {
    id: "r1",
    title: "Apero virtuel",
    modeLabel: "Night Owl",
    modeColor: "#6366f1",
    modeIcon: "\uD83C\uDF19",
    speakers: [
      { name: "Sofia M.", avatar: "https://i.pravatar.cc/150?img=1", isSpeaking: true, isHost: true },
      { name: "Lucas D.", avatar: "https://i.pravatar.cc/150?img=3", isSpeaking: false },
      { name: "Nadia K.", avatar: "https://i.pravatar.cc/150?img=5", isSpeaking: false },
    ],
    listeners: [
      { name: "Alex T.", avatar: "https://i.pravatar.cc/150?img=6" },
      { name: "Marie L.", avatar: "https://i.pravatar.cc/150?img=7" },
      { name: "Pierre B.", avatar: "https://i.pravatar.cc/150?img=10" },
      { name: "Jade W.", avatar: "https://i.pravatar.cc/150?img=13" },
      { name: "Sam R.", avatar: "https://i.pravatar.cc/150?img=14" },
      { name: "Eva C.", avatar: "https://i.pravatar.cc/150?img=17" },
      { name: "Leo F.", avatar: "https://i.pravatar.cc/150?img=18" },
      { name: "Nina S.", avatar: "https://i.pravatar.cc/150?img=19" },
      { name: "Tom H.", avatar: "https://i.pravatar.cc/150?img=22" },
      { name: "Amel K.", avatar: "https://i.pravatar.cc/150?img=24" },
      { name: "Rayan D.", avatar: "https://i.pravatar.cc/150?img=26" },
      { name: "Lucie G.", avatar: "https://i.pravatar.cc/150?img=27" },
      { name: "Djamel A.", avatar: "https://i.pravatar.cc/150?img=28" },
      { name: "Sarah P.", avatar: "https://i.pravatar.cc/150?img=29" },
      { name: "Mehdi O.", avatar: "https://i.pravatar.cc/150?img=30" },
      { name: "Zoe R.", avatar: "https://i.pravatar.cc/150?img=31" },
      { name: "Adam V.", avatar: "https://i.pravatar.cc/150?img=34" },
      { name: "Lila M.", avatar: "https://i.pravatar.cc/150?img=35" },
      { name: "Karim H.", avatar: "https://i.pravatar.cc/150?img=36" },
      { name: "Julie N.", avatar: "https://i.pravatar.cc/150?img=37" },
      { name: "Elias T.", avatar: "https://i.pravatar.cc/150?img=38" },
      { name: "Mona F.", avatar: "https://i.pravatar.cc/150?img=39" },
      { name: "Yassin B.", avatar: "https://i.pravatar.cc/150?img=40" },
    ],
    handRaises: [
      { name: "Alex T.", avatar: "https://i.pravatar.cc/150?img=6", raisedAt: Date.now() - 30000 },
      { name: "Jade W.", avatar: "https://i.pravatar.cc/150?img=13", raisedAt: Date.now() - 15000 },
    ],
    startedAt: Date.now() - 12 * 60 * 1000,
  },
};

// Build a fallback for any room id not specifically mocked
function getRoomData(id: string): RoomData {
  if (MOCK_ROOM_DATA[id]) return MOCK_ROOM_DATA[id];
  // Generic fallback
  return {
    id,
    title: "Salon vocal",
    modeLabel: "Night Owl",
    modeColor: "#6366f1",
    modeIcon: "\uD83C\uDF19",
    speakers: [
      { name: "Hote", avatar: "https://i.pravatar.cc/150?img=60", isSpeaking: true, isHost: true },
      { name: "Invit\u00E9 1", avatar: "https://i.pravatar.cc/150?img=61", isSpeaking: false },
    ],
    listeners: [
      { name: "Auditeur 1", avatar: "https://i.pravatar.cc/150?img=62" },
      { name: "Auditeur 2", avatar: "https://i.pravatar.cc/150?img=63" },
      { name: "Auditeur 3", avatar: "https://i.pravatar.cc/150?img=64" },
    ],
    handRaises: [],
    startedAt: Date.now() - 5 * 60 * 1000,
  };
}

// --- Timer hook ---

function useTimer(startedAt: number) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const diff = Math.floor((Date.now() - startedAt) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

// --- Simulated speaking toggle ---

function useSpeakingSimulation(speakers: Speaker[]) {
  const [speakerStates, setSpeakerStates] = useState(speakers);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeakerStates((prev) =>
        prev.map((s) => ({
          ...s,
          isSpeaking: Math.random() > 0.55,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return speakerStates;
}

// --- Main page ---

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = typeof params.id === "string" ? params.id : "r1";
  const room = getRoomData(roomId);

  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showHandQueue, setShowHandQueue] = useState(false);

  const elapsed = useTimer(room.startedAt);
  const liveSpeakers = useSpeakingSimulation(room.speakers);

  const totalListening = room.listeners.length + room.speakers.length + 1; // +1 for current user

  const handleLeave = useCallback(() => {
    router.push("/rooms");
  }, [router]);

  return (
    <div className="min-h-screen bg-bg pb-36 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <motion.button
                onClick={handleLeave}
                whileTap={{ scale: 0.85, transition: springs.micro }}
                className="p-1 -ml-1 shrink-0"
                aria-label="Retour"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-muted"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div className="min-w-0">
                <h1 className="text-[15px] font-display font-bold text-text truncate">
                  {room.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-white"
                    style={{ backgroundColor: room.modeColor }}
                  >
                    <span aria-hidden="true">{room.modeIcon}</span>
                    {room.modeLabel}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {elapsed}
                  </span>
                </div>
              </div>
            </div>

            {/* Live pill */}
            <motion.span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500 shrink-0"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {totalListening} en ligne
            </motion.span>
          </div>
        </motion.div>
      </header>

      {/* Speakers area */}
      <section className="px-4 pt-6" aria-label="Speakers">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
          Speakers
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {liveSpeakers.map((speaker, i) => (
            <motion.div
              key={speaker.name}
              className="flex flex-col items-center gap-1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.elastic, delay: i * 0.1 }}
            >
              <AudioWave
                size={speaker.isHost ? 76 : 64}
                color={room.modeColor}
                active={speaker.isSpeaking}
                avatar={speaker.avatar}
                name={speaker.name}
              />
              <span className="text-[11px] font-semibold text-text text-center max-w-[80px] truncate">
                {speaker.name}
              </span>
              {speaker.isHost && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: room.modeColor }}
                >
                  Hote
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hand raise queue */}
      {room.handRaises.length > 0 && (
        <section className="px-4 pt-6" aria-label="Mains levees">
          <button
            onClick={() => setShowHandQueue(!showHandQueue)}
            className="flex items-center gap-2 mb-2"
          >
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Mains levees ({room.handRaises.length})
            </p>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-text-muted transition-transform ${showHandQueue ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <AnimatePresence>
            {showHandQueue && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.heavy}
                className="overflow-hidden"
              >
                <div className="flex gap-3">
                  {room.handRaises.map((hr, i) => (
                    <motion.div
                      key={hr.name}
                      className="flex flex-col items-center gap-1"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ ...springs.elastic, delay: i * 0.1 }}
                    >
                      <div className="relative">
                        <img
                          src={hr.avatar}
                          alt={hr.name}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                        />
                        <motion.span
                          className="absolute -top-2 -right-2 text-sm"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            ...springs.rubber,
                            duration: 0.6,
                            repeat: Infinity,
                            repeatDelay: 0.5,
                          }}
                        >
                          {"\u270B"}
                        </motion.span>
                      </div>
                      <span className="text-[10px] text-text-muted truncate max-w-[60px]">
                        {hr.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Listeners area */}
      <section className="px-4 pt-6 flex-1" aria-label="Auditeurs">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          {totalListening} personnes ecoutent
        </p>
        <div className="flex flex-wrap gap-2.5">
          {room.listeners.map((listener, i) => (
            <motion.div
              key={listener.name}
              className="flex flex-col items-center gap-0.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springs.elastic, delay: i * 0.03 }}
            >
              <img
                src={listener.avatar}
                alt={listener.name}
                loading="lazy"
                decoding="async"
                className="w-9 h-9 rounded-full object-cover border border-border"
              />
              <span className="text-[9px] text-text-muted truncate max-w-[50px]">
                {listener.name.split(" ")[0]}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Controls bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border px-5 py-3 pb-safe">
        <div className="flex items-center justify-center gap-5 max-w-md mx-auto">
          {/* Mute/Unmute */}
          <motion.button
            onClick={() => setIsMuted(!isMuted)}
            whileTap={{ scale: 0.85, transition: springs.micro }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
              isMuted
                ? "border-border bg-card text-text-muted"
                : "border-accent bg-accent/10 text-accent"
            }`}
            aria-label={isMuted ? "Activer le micro" : "Couper le micro"}
          >
            {isMuted ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.17" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </motion.button>

          {/* Raise hand */}
          <motion.button
            onClick={() => setHandRaised(!handRaised)}
            whileTap={{ scale: 0.85, transition: springs.micro }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
              handRaised
                ? "border-warn bg-warn/10"
                : "border-border bg-card"
            }`}
            aria-label={handRaised ? "Baisser la main" : "Lever la main"}
          >
            <motion.span
              className="text-xl"
              animate={
                handRaised
                  ? { y: [0, -6, 0], rotate: [0, 15, -15, 0] }
                  : {}
              }
              transition={
                handRaised
                  ? {
                      ...springs.rubber,
                      duration: 0.6,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }
                  : {}
              }
            >
              {"\u270B"}
            </motion.span>
          </motion.button>

          {/* Leave room */}
          <motion.button
            onClick={handleLeave}
            whileTap={{ scale: 0.85, transition: springs.micro }}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-danger bg-danger/10 text-danger"
            aria-label="Quitter le salon"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import AudioWave from "@/components/app/AudioWave";
import PageHeader from "@/components/ui/PageHeader";
import { useParams, useRouter } from "next/navigation";
import { ROOM_MODE_COLORS } from "@/lib/rooms-meta";
import { ArrowLeft, ChevronDown, Mic, MicOff, LogOut } from "@/components/ui/lucide";

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
    modeColor: ROOM_MODE_COLORS["night-owl"],
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
    modeColor: ROOM_MODE_COLORS["night-owl"],
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
      {/* Header — PageHeader with `onHeader` render-prop: live-room chrome
          needs a bare-icon back button + multi-row title (title → mode pill +
          timer) + pulsing live pill. `onHeader` preserves PageHeader's shell
          (sticky/z-40/backdrop-blur/hairline) while giving us full control
          over the inner layout. */}
      <PageHeader
        sticky
        className="!z-40 bg-bg/95 !backdrop-blur-md"
        onHeader={() => (
          <div className="px-5 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <m.button
                  onClick={handleLeave}
                  whileTap={{ scale: 0.85, transition: springs.micro }}
                  className="p-1 -ml-1 shrink-0"
                  aria-label="Retour"
                >
                  <ArrowLeft size={20} strokeWidth={2} className="text-text-muted" />
                </m.button>
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
              <m.span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500 shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <m.span
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                {totalListening} en ligne
              </m.span>
            </div>
          </div>
        )}
      />

      {/* Speakers area */}
      <section className="px-4 pt-6" aria-label="Speakers">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
          Speakers
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {liveSpeakers.map((speaker, i) => (
            <m.div
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
            </m.div>
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
            <ChevronDown size={12} strokeWidth={2} className={`text-text-muted transition-transform ${showHandQueue ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showHandQueue && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.heavy}
                className="overflow-hidden"
              >
                <div className="flex gap-3">
                  {room.handRaises.map((hr, i) => (
                    <m.div
                      key={hr.name}
                      className="flex flex-col items-center gap-1"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ ...springs.elastic, delay: i * 0.1 }}
                    >
                      <div className="relative">
                        <Image
                          src={hr.avatar}
                          alt={hr.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                        />
                        <m.span
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
                        </m.span>
                      </div>
                      <span className="text-[10px] text-text-muted truncate max-w-[60px]">
                        {hr.name}
                      </span>
                    </m.div>
                  ))}
                </div>
              </m.div>
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
            <m.div
              key={listener.name}
              className="flex flex-col items-center gap-0.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springs.elastic, delay: i * 0.03 }}
            >
              <Image
                src={listener.avatar}
                alt={listener.name}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border border-border"
              />
              <span className="text-[9px] text-text-muted truncate max-w-[50px]">
                {listener.name.split(" ")[0]}
              </span>
            </m.div>
          ))}
        </div>
      </section>

      {/* Controls bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border px-5 py-3 pb-safe">
        <div className="flex items-center justify-center gap-5 max-w-md mx-auto">
          {/* Mute/Unmute */}
          <m.button
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
              <MicOff size={22} strokeWidth={2} />
            ) : (
              <Mic size={22} strokeWidth={2} />
            )}
          </m.button>

          {/* Raise hand */}
          <m.button
            onClick={() => setHandRaised(!handRaised)}
            whileTap={{ scale: 0.85, transition: springs.micro }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
              handRaised
                ? "border-warn bg-warn/10"
                : "border-border bg-card"
            }`}
            aria-label={handRaised ? "Baisser la main" : "Lever la main"}
          >
            <m.span
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
            </m.span>
          </m.button>

          {/* Leave room */}
          <m.button
            onClick={handleLeave}
            whileTap={{ scale: 0.85, transition: springs.micro }}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-danger bg-danger/10 text-danger"
            aria-label="Quitter le salon"
          >
            <LogOut size={22} strokeWidth={2} />
          </m.button>
        </div>
      </div>
    </div>
  );
}

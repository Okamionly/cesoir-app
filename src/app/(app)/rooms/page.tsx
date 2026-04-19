"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import Link from "next/link";
import Image from "next/image";
import { useRooms, type Room } from "@/lib/useRooms";
import { modeMeta, ROOM_MODE_COLORS } from "@/lib/rooms-meta";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

// --- Helpers ---
function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

// --- Types ---

type RoomCategory = "tous" | "discussion" | "debat" | "ambiance";

interface RoomSpeaker {
  name: string;
  avatar: string;
}

interface MockRoom {
  id: string;
  title: string;
  host: RoomSpeaker;
  speakers: RoomSpeaker[];
  listenerCount: number;
  category: Exclude<RoomCategory, "tous">;
  modeLabel: string;
  modeColor: string;
  modeIcon: string;
  startedMinutesAgo: number;
}

// --- Categories ---

const CATEGORIES: { key: RoomCategory; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "discussion", label: "Discussion" },
  { key: "debat", label: "Debat" },
  { key: "ambiance", label: "Ambiance" },
];

// --- Mock data ---

const MOCK_ROOMS: MockRoom[] = [
  {
    id: "r1",
    title: "Apero virtuel",
    host: { name: "Sofia M.", avatar: "https://i.pravatar.cc/150?img=1" },
    speakers: [
      { name: "Lucas D.", avatar: "https://i.pravatar.cc/150?img=3" },
      { name: "Nadia K.", avatar: "https://i.pravatar.cc/150?img=5" },
    ],
    listenerCount: 23,
    category: "discussion",
    modeLabel: "Night Owl",
    modeColor: ROOM_MODE_COLORS["night-owl"],
    modeIcon: "\uD83C\uDF19",
    startedMinutesAgo: 12,
  },
  {
    id: "r2",
    title: "Debat du soir",
    host: { name: "Maxime R.", avatar: "https://i.pravatar.cc/150?img=8" },
    speakers: [
      { name: "Chloe V.", avatar: "https://i.pravatar.cc/150?img=9" },
      { name: "Youssef G.", avatar: "https://i.pravatar.cc/150?img=11" },
      { name: "Lina B.", avatar: "https://i.pravatar.cc/150?img=16" },
    ],
    listenerCount: 41,
    category: "debat",
    modeLabel: "Culture Club",
    modeColor: ROOM_MODE_COLORS["culture-club"],
    modeIcon: "\uD83C\uDFAD",
    startedMinutesAgo: 34,
  },
  {
    id: "r3",
    title: "Musique chill",
    host: { name: "Amira L.", avatar: "https://i.pravatar.cc/150?img=20" },
    speakers: [
      { name: "Thomas P.", avatar: "https://i.pravatar.cc/150?img=12" },
    ],
    listenerCount: 15,
    category: "ambiance",
    modeLabel: "Sober Tonight",
    modeColor: ROOM_MODE_COLORS["sober-tonight"],
    modeIcon: "\uD83C\uDF75",
    startedMinutesAgo: 8,
  },
  {
    id: "r4",
    title: "Speed dating vocal",
    host: { name: "Julien F.", avatar: "https://i.pravatar.cc/150?img=15" },
    speakers: [
      { name: "Camille H.", avatar: "https://i.pravatar.cc/150?img=23" },
      { name: "Robin T.", avatar: "https://i.pravatar.cc/150?img=33" },
    ],
    listenerCount: 37,
    category: "discussion",
    modeLabel: "Plus-One",
    modeColor: ROOM_MODE_COLORS["plus-one"],
    modeIcon: "\uD83C\uDFAC",
    startedMinutesAgo: 19,
  },
  {
    id: "r5",
    title: "Raconter sa soiree",
    host: { name: "Ines D.", avatar: "https://i.pravatar.cc/150?img=25" },
    speakers: [
      { name: "Nathan W.", avatar: "https://i.pravatar.cc/150?img=53" },
      { name: "Lea S.", avatar: "https://i.pravatar.cc/150?img=44" },
      { name: "Omar B.", avatar: "https://i.pravatar.cc/150?img=52" },
    ],
    listenerCount: 29,
    category: "debat",
    modeLabel: "Solo Diner",
    modeColor: ROOM_MODE_COLORS["solo-diner"],
    modeIcon: "\uD83C\uDF7D\uFE0F",
    startedMinutesAgo: 45,
  },
  {
    id: "r6",
    title: "Conseils mode",
    host: { name: "Clara J.", avatar: "https://i.pravatar.cc/150?img=32" },
    speakers: [
      { name: "Hugo M.", avatar: "https://i.pravatar.cc/150?img=57" },
    ],
    listenerCount: 11,
    category: "ambiance",
    modeLabel: "Foodie Quest",
    modeColor: ROOM_MODE_COLORS["foodie-quest"],
    modeIcon: "\uD83D\uDD25",
    startedMinutesAgo: 5,
  },
];

// --- Variants ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.heavy,
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
};

// --- Live badge ---

function LiveBadge() {
  return (
    <motion.span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-white"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      Live
    </motion.span>
  );
}

// --- Room card ---

function RoomCard({ room }: { room: MockRoom }) {
  const totalPeople = room.speakers.length + 1 + room.listenerCount;

  return (
    <Link href={`/rooms/${room.id}`} className="block">
      <motion.div
        className="bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors"
        whileHover={{
          y: -3,
          boxShadow: "0 8px 25px color-mix(in srgb, var(--color-text) 15%, transparent)",
          transition: springs.gentle,
        }}
        whileTap={{ scale: 0.98, transition: springs.micro }}
      >
        {/* Top row: title + live */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[14px] font-bold text-text leading-tight">
            {room.title}
          </h3>
          <LiveBadge />
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-full p-[2px] shrink-0"
            style={{
              background: `linear-gradient(135deg, ${room.modeColor}, var(--color-accent))`,
            }}
          >
            <Image
              src={room.host.avatar}
              alt={room.host.name}
              width={32}
              height={32}
              className="w-full h-full rounded-full object-cover border-2 border-card"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[12px] font-semibold text-text truncate block">
              {room.host.name}
            </span>
            <span className="text-[10px] text-text-muted">Hote</span>
          </div>
        </div>

        {/* Speakers avatars */}
        <div className="flex -space-x-2 mb-3">
          {room.speakers.map((s, i) => (
            <motion.img
              key={s.name}
              src={s.avatar}
              alt={s.name}
              loading="lazy"
              decoding="async"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.elastic, delay: i * 0.05 }}
              className="w-7 h-7 rounded-full border-2 border-card object-cover shrink-0"
              style={{ zIndex: 10 - i }}
            />
          ))}
          {room.listenerCount > 0 && (
            <div
              className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-semibold text-text-muted bg-bg shrink-0"
              style={{ zIndex: 0 }}
            >
              +{room.listenerCount}
            </div>
          )}
        </div>

        {/* Bottom row: mode badge + listener count + duration */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0"
            style={{ backgroundColor: room.modeColor }}
          >
            <span aria-hidden="true">{room.modeIcon}</span>
            {room.modeLabel}
          </span>

          <span className="text-[10px] text-text-muted font-medium">
            {totalPeople} personnes
          </span>

          <div className="flex-1" />

          <span className="text-[10px] text-text-muted">
            {room.startedMinutesAgo}min
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// --- Main page ---

export default function RoomsPage() {
  const [activeCategory, setActiveCategory] = useState<RoomCategory>("tous");
  const { rooms: dbRooms, loading } = useRooms();

  // Map DB rooms to MockRoom shape (UI contract), fall back to mock if empty
  const liveRooms: MockRoom[] = useMemo(() => {
    if (dbRooms.length === 0) return MOCK_ROOMS;
    return dbRooms.map((r: Room): MockRoom => {
      const m = modeMeta(r.mode);
      return {
        id: r.id,
        title: r.title,
        host: {
          name: r.hostName,
          avatar: r.hostAvatar ?? `https://i.pravatar.cc/150?u=${r.hostId}`,
        },
        speakers: [],
        listenerCount: r.currentListeners,
        category: m.category,
        modeLabel: m.label,
        modeColor: m.color,
        modeIcon: m.icon,
        startedMinutesAgo: minutesSince(r.startedAt),
      };
    });
  }, [dbRooms]);

  const filteredRooms = useMemo(() => {
    if (activeCategory === "tous") return liveRooms;
    return liveRooms.filter((r) => r.category === activeCategory);
  }, [activeCategory, liveRooms]);

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Salons vocaux
            <span className="text-[10px] text-accent/70 font-medium ml-1">
              {loading ? "..." : `${liveRooms.length} live`}
            </span>
          </span>
        }
        icon={<span className="text-lg" aria-hidden="true">{"\uD83C\uDF99\uFE0F"}</span>}
        actions={
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px color-mix(in srgb, var(--color-accent) 40%, transparent)",
            }}
            whileTap={{ scale: 0.92 }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-glow"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Creer
          </motion.button>
        }
        slotBelowTitle={
          <div className="flex gap-1.5">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                whileTap={{ scale: 0.92 }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border tap-target transition-all ${
                  activeCategory === cat.key
                    ? "border-accent gradient-bg text-white"
                    : "border-border text-text-muted"
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>
        }
      />

      {/* Rooms list */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          emoji="🎙️"
          title="Aucun salon dans cette categorie"
          subtitle="Sois le premier a lancer la conversation!"
        />
      ) : (
        <motion.div
          className="px-4 pt-3 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="list"
          aria-label="Liste des salons vocaux"
        >
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room) => (
              <motion.div
                key={room.id}
                variants={cardVariants}
                layout
                role="listitem"
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

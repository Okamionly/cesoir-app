"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { MOCK_EVENTS, type PopUpEvent } from "@/lib/popup-events";
import Link from "next/link";
import CrossLinkCard from "@/components/app/CrossLinkCard";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";

// --- Filter tabs ---

type FilterTab = "tous" | "pres" | "mes";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "pres", label: "Pres de moi" },
  { key: "mes", label: "Mes events" },
];

// --- Fake distances for "pres de moi" ---

const DISTANCES: Record<string, number> = {
  e1: 0.3, e2: 1.2, e3: 2.1, e4: 0.8, e5: 1.5, e6: 3.4, e7: 0.5, e8: 1.8,
};

// --- Sort by time (soonest first) ---

function sortByTime(events: PopUpEvent[]): PopUpEvent[] {
  return [...events].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
}

// --- Variants ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
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

// --- Avatar Stack ---

function AvatarStack({ attendees, max = 4 }: { attendees: { avatar: string; name: string }[]; max?: number }) {
  const shown = attendees.slice(0, max);
  const extra = attendees.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((a, i) => (
        <motion.img
          key={a.name + i}
          src={a.avatar}
          alt={a.name}
          loading="lazy"
          decoding="async"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springs.elastic, delay: i * 0.05 }}
          className="w-6 h-6 rounded-full border-2 border-card object-cover shrink-0"
          style={{ zIndex: max - i }}
        />
      ))}
      {extra > 0 && (
        <div
          className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-semibold text-text-muted bg-bg shrink-0"
          style={{ zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// --- Event Card ---

function EventCard({
  event,
  distance,
  isJoined,
  onToggleJoin,
}: {
  event: PopUpEvent;
  distance?: number;
  isJoined: boolean;
  onToggleJoin: () => void;
}) {
  const mode = MODES[event.mode] ?? MODES["night-owl"];
  const isFull = event.maxAttendees > 0 && event.currentAttendees >= event.maxAttendees;

  return (
    <Link href={`/events/${event.id}`} className="block">
      <motion.div
        className="bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors"
        whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", transition: springs.gentle }}
        whileTap={{ scale: 0.98, transition: springs.micro }}
      >
        <div className="flex items-start gap-3">
          {/* Creator avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-full p-[2px]"
              style={{ background: `linear-gradient(135deg, ${mode.color}, #8B5CF6)` }}
            >
              <img
                src={event.creatorAvatar}
                alt={event.creator}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-full object-cover border-2 border-card"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-text leading-tight truncate">
              {event.title}
            </h3>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-text-muted">{event.creator}</span>
              <span className="text-text-muted/40">·</span>
              <span className="text-[11px] text-text-muted font-medium">{event.time}</span>
              {distance !== undefined && (
                <>
                  <span className="text-text-muted/40">·</span>
                  <span className="text-[11px] text-accent font-medium">{distance.toFixed(1)} km</span>
                </>
              )}
            </div>

            {/* Venue + arrondissement */}
            <div className="flex items-center gap-1 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-muted shrink-0" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="text-[11px] text-text-muted truncate">{event.venue}, {event.arrondissement}</span>
            </div>

            {/* Bottom row: mode badge + attendees + join button */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {/* Mode badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0"
                style={{ backgroundColor: mode.color }}
              >
                <span aria-hidden="true">{mode.icon}</span>
                {mode.name}
              </span>

              {/* Attendee count */}
              <div className="flex items-center gap-1.5">
                <AvatarStack attendees={event.attendees} max={3} />
                <span className="text-[10px] text-text-muted font-medium">
                  {event.currentAttendees}{event.maxAttendees > 0 ? `/${event.maxAttendees}` : ""}
                </span>
              </div>

              {/* Voir sur la carte */}
              <Link
                href={`/map?lat=${event.lat}&lng=${event.lng}&event=${event.id}`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-[10px] font-semibold text-text-muted hover:border-accent/30 hover:text-accent transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                Carte
              </Link>

              {/* Spacer */}
              <div className="flex-1" />

              {/* J'y vais button */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleJoin();
                }}
                disabled={isFull && !isJoined}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  isJoined
                    ? "gradient-bg text-white shadow-glow"
                    : isFull
                      ? "border border-border text-text-muted/50 cursor-not-allowed"
                      : "border border-accent/30 text-accent hover:bg-accent/10"
                }`}
                whileHover={!isFull || isJoined ? {
                  scale: 1.05,
                  boxShadow: isJoined
                    ? "0 0 20px rgba(139,92,246,0.5)"
                    : "0 0 15px rgba(139,92,246,0.3)",
                } : {}}
                whileTap={!isFull || isJoined ? { scale: 0.92 } : {}}
              >
                {isJoined ? "Inscrit \u2713" : isFull ? "Complet" : "J'y vais"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// --- Skeleton ---

function EventsSkeleton() {
  return (
    <div className="px-4 space-y-3" role="status" aria-label="Chargement des events">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-border shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-border rounded-full w-3/4" />
              <div className="h-3 bg-border rounded-full w-1/2" />
              <div className="h-3 bg-border rounded-full w-2/3" />
              <div className="flex gap-2 mt-1">
                <div className="h-5 bg-border rounded-full w-20" />
                <div className="h-5 bg-border rounded-full w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("tous");
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PopUpEvent[]>([]);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(sortByTime(MOCK_EVENTS));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredEvents = useMemo(() => {
    switch (activeTab) {
      case "pres":
        return [...events].sort((a, b) => (DISTANCES[a.id] ?? 99) - (DISTANCES[b.id] ?? 99));
      case "mes":
        return events.filter((e) => joined.has(e.id));
      default:
        return events;
    }
  }, [activeTab, events, joined]);

  const toggleJoin = useCallback((id: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setEvents(sortByTime(MOCK_EVENTS).sort(() => Math.random() - 0.5));
    setRefreshing(false);
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header — moon glow + hairline pulse */}
      <header className="relative sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <RackFocus duration={0.5}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-lg"
                aria-hidden="true"
                animate={{ rotate: [0, 4, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                {"\u263E"}
              </motion.span>
              <h1 className="text-base font-display font-bold text-text">Events ce soir</h1>
              <span className="text-[10px] text-accent/70 font-medium ml-1">
                {events.length} events
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Magnetic strength={0.16} radius={70}>
                <Link href="/events/marketplace">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-accent/30 text-accent text-[11px] font-bold hover:bg-accent/5 transition-colors">
                    🛍️ Marketplace
                  </span>
                </Link>
              </Magnetic>
              <Magnetic strength={0.18} radius={80}>
                <Link href="/events/create">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-glow hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Creer
                  </span>
                </Link>
              </Magnetic>
            </div>
          </div>
        </RackFocus>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(0,255,136,0.3), transparent)",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Filter tabs */}
        <div className="flex gap-1.5 mt-2">
          {FILTER_TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileTap={{ scale: 0.92 }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border tap-target transition-all ${
                activeTab === tab.key
                  ? "border-accent gradient-bg text-white"
                  : "border-border text-text-muted"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Pull to refresh */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full py-2.5 text-center text-xs font-semibold text-text-muted hover:text-accent transition-colors disabled:opacity-50"
        aria-label="Actualiser les events"
      >
        {refreshing ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </motion.span>
        ) : (
          "Actualiser"
        )}
      </button>

      {/* Speed Dating link */}
      <div className="px-4 pb-3">
        <CrossLinkCard
          emoji="⚡"
          title="Speed Dating"
          subtitle="Rencontres express de 5 min ce soir"
          href="/speed-dating"
          gradient="linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,255,136,0.08))"
        />
      </div>

      {/* Content */}
      {loading ? (
        <EventsSkeleton />
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text-muted">
            {activeTab === "mes" ? "Tu n'as rejoint aucun event" : "Aucun event pour le moment"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {activeTab === "mes" ? "Rejoins un event ou cree le tien!" : "Sois le premier a en creer un!"}
          </p>
          <Link href="/events/create">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-full gradient-bg text-white text-xs font-bold shadow-glow"
            >
              Creer un event
            </motion.span>
          </Link>
        </div>
      ) : (
        <motion.div
          className="px-4 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="list"
          aria-label="Liste des events"
        >
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => (
              <motion.div key={event.id} variants={cardVariants} layout role="listitem">
                <EventCard
                  event={event}
                  distance={activeTab === "pres" ? DISTANCES[event.id] : undefined}
                  isJoined={joined.has(event.id)}
                  onToggleJoin={() => toggleJoin(event.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type EventCategory = "all" | "speed-dating" | "soiree" | "atelier" | "concert" | "degustation";

interface PartnerEvent {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  price: string;
  category: EventCategory;
  image: string;
  gradient: string;
  spots: number;
  spotsLeft: number;
  description: string;
}

// ─────────────────────────────────────────
// Categories
// ─────────────────────────────────────────

const CATEGORIES: { key: EventCategory; label: string; icon: string }[] = [
  { key: "all", label: "Tous", icon: "\u2728" },
  { key: "speed-dating", label: "Speed-dating", icon: "\uD83D\uDC95" },
  { key: "soiree", label: "Soiree a theme", icon: "\uD83C\uDF89" },
  { key: "atelier", label: "Atelier", icon: "\uD83C\uDFA8" },
  { key: "concert", label: "Concert", icon: "\uD83C\uDFB5" },
  { key: "degustation", label: "Degustation", icon: "\uD83C\uDF77" },
];

// ─────────────────────────────────────────
// Mock events
// ─────────────────────────────────────────

const MOCK_PARTNER_EVENTS: PartnerEvent[] = [
  {
    id: "pe1",
    title: "Speed Dating Parisien",
    venue: "Le Petit Cler",
    date: "Ce soir",
    time: "20h30",
    price: "25\u20AC",
    category: "speed-dating",
    image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&h=250&fit=crop",
    gradient: "from-pink-500/80 to-rose-600/80",
    spots: 20,
    spotsLeft: 4,
    description: "Rencontrez 10 personnes en une soiree. Ambiance intime, cocktail offert.",
  },
  {
    id: "pe2",
    title: "Soiree Gatsby Annees 20",
    venue: "Le Ballroom",
    date: "Vendredi",
    time: "21h",
    price: "35\u20AC",
    category: "soiree",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=250&fit=crop",
    gradient: "from-amber-500/80 to-yellow-600/80",
    spots: 60,
    spotsLeft: 12,
    description: "Dress code annees 20 obligatoire. DJ live, champagne et photobooth.",
  },
  {
    id: "pe3",
    title: "Atelier Poterie & Vin",
    venue: "L'Atelier du Marais",
    date: "Samedi",
    time: "16h",
    price: "45\u20AC",
    category: "atelier",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=250&fit=crop",
    gradient: "from-orange-500/80 to-amber-600/80",
    spots: 14,
    spotsLeft: 0,
    description: "Creez ensemble un vase unique. Verre de vin naturel inclus.",
  },
  {
    id: "pe4",
    title: "Concert Jazz Intime",
    venue: "Sunset Sunside",
    date: "Ce soir",
    time: "22h",
    price: "20\u20AC",
    category: "concert",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=250&fit=crop",
    gradient: "from-indigo-500/80 to-blue-600/80",
    spots: 40,
    spotsLeft: 8,
    description: "Trio de jazz manouche dans une cave historique du Chatelet.",
  },
  {
    id: "pe5",
    title: "Degustation Vins Naturels",
    venue: "Cave Septime",
    date: "Dimanche",
    time: "18h",
    price: "30\u20AC",
    category: "degustation",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=250&fit=crop",
    gradient: "from-purple-500/80 to-violet-600/80",
    spots: 16,
    spotsLeft: 5,
    description: "6 vins bio, fromages affines et rencontres entre oenophiles.",
  },
  {
    id: "pe6",
    title: "Speed Dating Crepes & Cidre",
    venue: "Breizh Cafe",
    date: "Samedi",
    time: "19h30",
    price: "22\u20AC",
    category: "speed-dating",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
    gradient: "from-emerald-500/80 to-teal-600/80",
    spots: 24,
    spotsLeft: 10,
    description: "Format original : chaque round commence avec une nouvelle crepe !",
  },
];

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.heavy,
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const chipVariants: Variants = {
  hidden: { opacity: 0, x: -15, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springs.snap, delay: i * 0.04 },
  }),
};

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function EventMarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>("all");
  const [reserved, setReserved] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredEvents = useMemo(() => {
    if (activeCategory === "all") return MOCK_PARTNER_EVENTS;
    return MOCK_PARTNER_EVENTS.filter((e) => e.category === activeCategory);
  }, [activeCategory]);

  const handleReserve = (event: PartnerEvent) => {
    if (event.spotsLeft === 0) return;
    setReserved((prev) => new Set(prev).add(event.id));
    toast("Place reservee ! A bientot \uD83C\uDF89", "success");
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link href="/events" className="text-text-muted hover:text-text transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
              <h1 className="text-base font-display font-bold text-text">Events partenaires</h1>
            </div>
            <span className="text-[10px] text-accent/70 font-medium">
              {filteredEvents.length} events
            </span>
          </div>
        </motion.div>

        {/* Category chips */}
        <motion.div
          className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide"
          initial="hidden"
          animate="visible"
        >
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.key}
              custom={i}
              variants={chipVariants}
              onClick={() => setActiveCategory(cat.key)}
              whileTap={{ scale: 0.92 }}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                activeCategory === cat.key
                  ? "border-accent gradient-bg text-white"
                  : "border-border text-text-muted hover:border-accent/20"
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.label}
            </motion.button>
          ))}
        </motion.div>
      </header>

      {/* Events grid */}
      <motion.div
        className="px-4 py-4 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={activeCategory}
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event) => {
            const isFull = event.spotsLeft === 0;
            const isReserved = reserved.has(event.id);

            return (
              <motion.div
                key={event.id}
                variants={cardVariants}
                layout
                className="relative rounded-2xl overflow-hidden border border-border bg-card"
              >
                {/* Event poster with gradient overlay */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${event.gradient} to-transparent`} />

                  {/* Complet badge */}
                  {isFull && (
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: -12 }}
                      transition={springs.elastic}
                      className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg"
                    >
                      Complet
                    </motion.div>
                  )}

                  {/* Price tag */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                    {event.price}
                  </div>

                  {/* Category icon */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
                      {CATEGORIES.find((c) => c.key === event.category)?.icon}{" "}
                      {CATEGORIES.find((c) => c.key === event.category)?.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-text leading-tight">
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-muted shrink-0" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span className="text-[11px] text-text-muted">{event.venue}</span>
                    <span className="text-text-muted/40">{"\u00B7"}</span>
                    <span className="text-[11px] text-accent font-medium">{event.date}, {event.time}</span>
                  </div>

                  <p className="text-xs text-text-muted mt-2 leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-3">
                    {/* Spots */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {Array.from({ length: Math.min(3, event.spots - event.spotsLeft) }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ ...springs.elastic, delay: i * 0.05 }}
                            className="w-5 h-5 rounded-full bg-border border-2 border-card"
                            style={{ zIndex: 3 - i }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-text-muted font-medium">
                        {isFull
                          ? `${event.spots}/${event.spots}`
                          : `${event.spots - event.spotsLeft}/${event.spots}`}
                      </span>
                    </div>

                    {/* Reserve button */}
                    <motion.button
                      onClick={() => handleReserve(event)}
                      disabled={isFull || isReserved}
                      whileHover={
                        !isFull && !isReserved
                          ? { scale: 1.05, boxShadow: "0 0 20px rgba(139,92,246,0.5)" }
                          : {}
                      }
                      whileTap={!isFull && !isReserved ? { scale: 0.92 } : {}}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        isReserved
                          ? "gradient-bg text-white shadow-glow"
                          : isFull
                            ? "border border-border text-text-muted/50 cursor-not-allowed"
                            : "gradient-bg text-white shadow-glow"
                      }`}
                    >
                      {isReserved ? "Reservee \u2713" : isFull ? "Complet" : "Reserver"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl" aria-hidden="true">{"\uD83C\uDF89"}</span>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Aucun event dans cette categorie
            </p>
            <p className="text-xs text-text-muted mt-1">
              De nouveaux events arrivent bientot !
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

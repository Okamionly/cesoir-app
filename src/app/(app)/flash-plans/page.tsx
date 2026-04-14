"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";

interface FlashPlan {
  id: string;
  emoji: string;
  title: string;
  venue: string;
  time: string;
  interested: number;
  category: string;
}

const PLANS: FlashPlan[] = [
  { id: "1", emoji: "🍸", title: "Happy Hour 2-pour-1", venue: "Le Comptoir", time: "19h-21h", interested: 12, category: "Food" },
  { id: "2", emoji: "🎵", title: "Concert jazz gratuit", venue: "Le Baiser Sale", time: "21h", interested: 8, category: "Musique" },
  { id: "3", emoji: "💃", title: "Cours de salsa debutant", venue: "Studio Bleu", time: "20h", interested: 5, category: "Sport" },
  { id: "4", emoji: "🎲", title: "Soiree jeux de societe", venue: "Le Dernier Bar", time: "19h30", interested: 15, category: "Jeux" },
  { id: "5", emoji: "🎨", title: "Vernissage + cocktails", venue: "Galerie Perrotin", time: "18h30", interested: 9, category: "Culture" },
  { id: "6", emoji: "🍕", title: "Pizza party rooftop", venue: "Le Perchoir", time: "20h", interested: 22, category: "Food" },
  { id: "7", emoji: "🎸", title: "Open mic acoustique", venue: "L'International", time: "21h30", interested: 7, category: "Musique" },
  { id: "8", emoji: "🏃", title: "Running nocturne 5km", venue: "Canal Saint-Martin", time: "19h30", interested: 11, category: "Sport" },
  { id: "9", emoji: "🎭", title: "Impro theatre gratuit", venue: "Theatre de Belleville", time: "20h30", interested: 6, category: "Culture" },
  { id: "10", emoji: "🎮", title: "Tournoi Mario Kart", venue: "Meltdown Bar", time: "21h", interested: 18, category: "Jeux" },
];

const CATEGORIES = ["Tous", "Food", "Musique", "Sport", "Culture", "Jeux"];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function FlashPlansPage() {
  const [filter, setFilter] = useState("Tous");
  const [interested, setInterested] = useState<Set<string>>(new Set());

  const filtered = filter === "Tous" ? PLANS : PLANS.filter(p => p.category === filter);

  const toggleInterest = (id: string) => {
    setInterested(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Flash Plans</span>
          </div>
          <p className="text-[11px] text-text-muted">Ce soir pres de toi</p>
        </motion.div>

        {/* Filter chips */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target transition-all ${
                filter === cat
                  ? "border-accent gradient-bg text-white"
                  : "border-border text-text-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <motion.main
        className="px-4 pb-24 pt-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des plans flash"
      >
        {filtered.map(plan => {
          const isInterested = interested.has(plan.id);
          return (
            <motion.div key={plan.id} variants={cardVariants}>
              <div className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-[20px] shrink-0">
                    {plan.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-text">{plan.title}</h3>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {plan.venue} · {plan.time}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-text-muted bg-bg border border-border px-2 py-0.5 rounded-full">
                        {plan.category}
                      </span>
                      <span className="text-[10px] text-accent font-semibold">
                        {isInterested ? plan.interested + 1 : plan.interested} interesses
                      </span>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => toggleInterest(plan.id)}
                    className={`shrink-0 px-3 py-2 rounded-full text-[11px] font-semibold transition-all tap-target ${
                      isInterested
                        ? "gradient-bg text-white shadow-glow"
                        : "border border-border text-text-muted hover:border-accent/30"
                    }`}
                    whileTap={{ scale: 0.92 }}
                  >
                    {isInterested ? "Inscrit ✓" : "J'y vais"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.main>
    </div>
  );
}

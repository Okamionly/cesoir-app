"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { memoriesVariants, springs } from "@/lib/motion-design";
import Link from "next/link";

interface Memory {
  id: string;
  gradient: string;
  date: string;
  withName: string;
  withPhoto: string;
  mode: string;
  modeColor: string;
}

const MOCK_MEMORIES: Memory[] = [
  { id: "m1", gradient: "linear-gradient(135deg, #8B5CF6, #ec4899)", date: "12 Avr 2026", withName: "Claire", withPhoto: "https://randomuser.me/api/portraits/women/25.jpg", mode: "Diner", modeColor: "#f59e0b" },
  { id: "m2", gradient: "linear-gradient(135deg, #00FF88, #06b6d4)", date: "10 Avr 2026", withName: "Thomas", withPhoto: "https://randomuser.me/api/portraits/men/75.jpg", mode: "Night Owl", modeColor: "#8B5CF6" },
  { id: "m3", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", date: "8 Avr 2026", withName: "Priya", withPhoto: "https://randomuser.me/api/portraits/women/64.jpg", mode: "Cafe", modeColor: "#a16207" },
  { id: "m4", gradient: "linear-gradient(135deg, #3b82f6, #8B5CF6)", date: "5 Avr 2026", withName: "Hugo", withPhoto: "https://randomuser.me/api/portraits/men/41.jpg", mode: "Culture", modeColor: "#2563eb" },
  { id: "m5", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", date: "2 Avr 2026", withName: "Sarah", withPhoto: "https://randomuser.me/api/portraits/women/44.jpg", mode: "Sport", modeColor: "#00FF88" },
  { id: "m6", gradient: "linear-gradient(135deg, #06b6d4, #00FF88)", date: "30 Mar 2026", withName: "Karim", withPhoto: "https://randomuser.me/api/portraits/men/37.jpg", mode: "Foodie", modeColor: "#f97316" },
  { id: "m7", gradient: "linear-gradient(135deg, #a855f7, #6366f1)", date: "28 Mar 2026", withName: "Lea", withPhoto: "https://randomuser.me/api/portraits/women/42.jpg", mode: "Aventure", modeColor: "#22c55e" },
  { id: "m8", gradient: "linear-gradient(135deg, #f97316, #facc15)", date: "25 Mar 2026", withName: "Gabriel", withPhoto: "https://randomuser.me/api/portraits/men/73.jpg", mode: "Flash", modeColor: "#EF4444" },
];


export default function MemoriesPage() {
  const [selected, setSelected] = useState<Memory | null>(null);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-card"
          aria-label="Retour"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </Link>
        <h1
          className="text-white font-bold text-[22px]"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
        >
          Souvenirs
        </h1>
      </div>

      {/* Stats */}
      <div
        className="rounded-xl p-3 mb-6 flex items-center gap-3 bg-bg-card border border-border"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.2)" }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-[16px]">{MOCK_MEMORIES.length} soirees ensemble</p>
          <p className="text-[12px] text-text-muted">Tes meilleurs moments</p>
        </div>
      </div>

      {/* Grid */}
      {MOCK_MEMORIES.length > 0 ? (
        <motion.div
          className="grid grid-cols-3 gap-2"
          variants={memoriesVariants.container}
          initial="hidden"
          animate="visible"
          role="list"
          aria-label="Galerie de souvenirs"
        >
          {MOCK_MEMORIES.map((memory, i) => (
            <motion.button
              key={memory.id}
              variants={memoriesVariants.photo}
              custom={i}
              className="relative aspect-square rounded-xl overflow-hidden"
              style={{ background: memory.gradient }}
              onClick={() => setSelected(memory)}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 10, transition: springs.snap }}
              whileTap={{ scale: 0.95, transition: springs.micro }}
              role="listitem"
              aria-label={`Souvenir avec ${memory.withName}, ${memory.date}`}
            >
              {/* Avatar overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <img
                  src={memory.withPhoto}
                  alt={memory.withName}
                  className="w-6 h-6 rounded-full object-cover"
                  style={{ border: "2px solid rgba(255,255,255,0.6)" }}
                />
                <span className="text-white text-[10px] font-semibold drop-shadow-lg">
                  {memory.withName}
                </span>
              </div>
              {/* Mode badge */}
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                style={{ background: "rgba(0,0,0,0.5)", color: memory.modeColor, backdropFilter: "blur(4px)" }}
              >
                {memory.mode}
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-bg-card"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#444">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-[16px] mb-1">
            Pas encore de souvenirs
          </p>
          <p className="text-[13px] text-text-muted">
            Ta premiere soiree t&apos;attend !
          </p>
        </div>
      )}

      {/* Full screen detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.9)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            role="dialog"
            aria-label={`Detail du souvenir avec ${selected.withName}`}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl overflow-hidden bg-bg-card"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={springs.heavy}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo area */}
              <div
                className="w-full aspect-[4/3]"
                style={{ background: selected.gradient }}
              />

              {/* Details */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={selected.withPhoto}
                    alt={selected.withName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-white font-semibold text-[15px]">{selected.withName}</p>
                    <p className="text-[12px] text-text-muted">{selected.date}</p>
                  </div>
                  <div
                    className="ml-auto px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: `${selected.modeColor}20`, color: selected.modeColor }}
                  >
                    {selected.mode}
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-3 rounded-xl font-semibold text-[14px] text-white"
                  style={{ background: "#222" }}
                  aria-label="Fermer le detail"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

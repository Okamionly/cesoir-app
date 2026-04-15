"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  requirement: string;
  xp: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first-match", name: "Premier Match", description: "Tu as eu ton tout premier match", icon: "\u2764", earned: true, earnedDate: "12 avr. 2026", requirement: "Matcher avec quelqu'un", xp: 50 },
  { id: "10-evenings", name: "10 Soirees", description: "10 soirees organisees avec succes", icon: "\u2B50", earned: false, requirement: "Completer 10 soirees", xp: 200 },
  { id: "globe-trotter", name: "Globe-Trotter", description: "Utilise 5 modes differents", icon: "\u2708", earned: true, earnedDate: "14 avr. 2026", requirement: "Essayer 5 modes", xp: 100 },
  { id: "karma-100", name: "Karma +100", description: "Atteins 100 points karma", icon: "\u2728", earned: false, requirement: "Accumuler 100 karma", xp: 150 },
  { id: "noctambule", name: "Noctambule", description: "Actif apres minuit 5 fois", icon: "\uD83C\uDF19", earned: true, earnedDate: "13 avr. 2026", requirement: "5 sessions apres 0h", xp: 100 },
  { id: "polyglotte", name: "Polyglotte", description: "3 soirees en Langue Exchange", icon: "\uD83C\uDF0D", earned: false, requirement: "3 sessions Langue Exchange", xp: 120 },
  { id: "squad-leader", name: "Squad Leader", description: "Cree un squad de 4 personnes", icon: "\uD83D\uDC65", earned: false, requirement: "Former un squad complet", xp: 150 },
  { id: "foodie-master", name: "Foodie Master", description: "5 soirees Foodie Quest", icon: "\uD83C\uDF72", earned: true, earnedDate: "15 avr. 2026", requirement: "5 sessions Foodie Quest", xp: 120 },
  { id: "streak-7", name: "Streak 7 jours", description: "7 jours consecutifs actif", icon: "\uD83D\uDD25", earned: false, requirement: "Maintenir un streak de 7j", xp: 200 },
  { id: "verificateur", name: "Verificateur", description: "Profil verifie par selfie", icon: "\uD83D\uDEE1", earned: true, earnedDate: "12 avr. 2026", requirement: "Completer la verification", xp: 50 },
  { id: "100-messages", name: "100 Messages", description: "Envoyer 100 messages", icon: "\uD83D\uDCAC", earned: true, earnedDate: "14 avr. 2026", requirement: "Envoyer 100 messages", xp: 80 },
  { id: "date-parfait", name: "Date Parfait", description: "5 etoiles sur un avis", icon: "\uD83C\uDFC6", earned: false, requirement: "Recevoir un avis 5 etoiles", xp: 250 },
];

const LEVEL = 7;
const LEVEL_NAME = "Explorateur Nocturne";
const TOTAL_XP = 680;
const NEXT_LEVEL_XP = 1000;

export default function AchievementsPage() {
  const [selected, setSelected] = useState<Achievement | null>(null);
  const earned = ACHIEVEMENTS.filter((a) => a.earned);
  const locked = ACHIEVEMENTS.filter((a) => !a.earned);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-black text-text font-display">Mes trophees</h1>
        <p className="text-[13px] text-text-muted mt-1">{earned.length}/{ACHIEVEMENTS.length} debloques</p>
      </header>

      {/* Level card */}
      <div className="mx-5 mb-6 p-5 rounded-2xl border border-accent/20 bg-accent/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] text-accent font-semibold">Niveau {LEVEL}</p>
            <p className="text-[18px] font-black text-text">{LEVEL_NAME}</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-black gradient-text">{TOTAL_XP}</p>
            <p className="text-[11px] text-text-muted">XP total</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
            initial={{ width: 0 }}
            animate={{ width: `${(TOTAL_XP / NEXT_LEVEL_XP) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1.5">{TOTAL_XP}/{NEXT_LEVEL_XP} XP pour le niveau {LEVEL + 1}</p>
      </div>

      {/* Earned */}
      <section className="px-5 mb-6">
        <h2 className="text-[15px] font-bold text-text mb-3">Debloques</h2>
        <div className="grid grid-cols-3 gap-3">
          {earned.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(a)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[11px] font-semibold text-text text-center leading-tight">{a.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Locked */}
      <section className="px-5 mb-6">
        <h2 className="text-[15px] font-bold text-text mb-3">A debloquer</h2>
        <div className="grid grid-cols-3 gap-3">
          {locked.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.3 }}
              onClick={() => setSelected(a)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-bg-card opacity-50 hover:opacity-70 transition-opacity relative"
            >
              <span className="text-2xl grayscale">{a.icon}</span>
              <span className="text-[11px] font-semibold text-text-muted text-center leading-tight">{a.name}</span>
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-border flex items-center justify-center">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none"><path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2"/><path d="M17 11V7A5 5 0 007 7V11" stroke="currentColor" strokeWidth="2"/></svg>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-bg rounded-3xl p-6 max-w-sm w-full border border-border shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <span className="text-5xl mb-3 block">{selected.icon}</span>
                <h3 className="text-[20px] font-black text-text mb-1">{selected.name}</h3>
                <p className="text-[14px] text-text-muted mb-4">{selected.description}</p>
                {selected.earned ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-safe/10 text-safe text-[12px] font-semibold">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Debloque le {selected.earnedDate}
                  </div>
                ) : (
                  <p className="text-[12px] text-text-muted">{selected.requirement}</p>
                )}
                <p className="text-[13px] font-bold gradient-text mt-3">+{selected.xp} XP</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-full mt-5 py-3 rounded-full border border-border text-[14px] font-semibold text-text-muted hover:text-text transition-colors"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

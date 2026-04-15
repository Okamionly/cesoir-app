"use client";

import { motion, type Variants } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODE_ICONS } from "@/components/ui/Icons";
import Link from "next/link";
import { modesVariants, springs, ambient } from "@/lib/motion-design";

const containerVariants: Variants = modesVariants.grid;

const cardVariants: Variants = modesVariants.modeCard;

export default function ModesPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Modes</span>
          </div>
          <p className="text-[11px] text-text-muted">Choisis ton ambiance pour ce soir</p>
        </motion.div>
      </header>

      <motion.main
        className="px-4 pb-24 pt-4 space-y-2.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des modes"
      >
        {/* Sorties de groupe link */}
        <motion.div
          variants={cardVariants}
          custom={0}
          whileHover={{ y: -6, scale: 1.05, transition: springs.gentle }}
          whileTap={{ scale: 0.92, transition: springs.micro }}
        >
          <Link
            href="/group"
            className="block bg-accent/5 border border-accent/20 rounded-2xl p-4 hover:border-accent/40"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[18px] text-white" aria-hidden="true">👥</span>
              </motion.div>
              <div className="flex-1">
                <h2 className="text-[15px] font-bold text-text">Sorties de groupe</h2>
                <p className="text-[11px] text-text-muted">Rejoins une sortie ou cree la tienne</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-accent font-semibold">8 sorties</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {MODE_KEYS.map((key, index) => {
          const mode = MODES[key];
          const count = MOCK_PROFILES.filter(p => p.mode === key).length;
          const Icon = MODE_ICONS[key];

          return (
            <motion.div
              key={key}
              variants={cardVariants}
              custom={index}
              whileHover={{ y: -6, scale: 1.05, transition: springs.gentle }}
              whileTap={{ scale: 0.92, transition: springs.micro }}
              animate={modesVariants.floatLoop(index)}
            >
              <Link
                href={`/browse?mode=${key}`}
                className="block bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${mode.color}15` }}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {Icon && <Icon size={20} className="text-accent" />}
                    </motion.div>
                    <div>
                      <h2 className="text-[15px] font-bold text-text">{mode.name}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-safe" aria-hidden="true" />
                        <span className="text-[10px] text-text-muted">{count * 12 + (key.length * 7 % 30)} actifs</span>
                      </div>
                    </div>
                  </div>
                  {mode.badge && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent">{mode.badge}</span>
                  )}
                </div>
                <p className="text-[12px] text-text-muted leading-relaxed mb-3">{mode.description}</p>
                <div className="flex flex-wrap gap-1">
                  {mode.tags.slice(0, 4).map(t => (
                    <span key={t} className="text-[9px] bg-bg border border-border px-2 py-0.5 rounded text-text-muted">{t}</span>
                  ))}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.main>
    </div>
  );
}

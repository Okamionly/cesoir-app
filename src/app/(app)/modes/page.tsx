"use client";

import { motion, type Variants } from "framer-motion";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODE_ICONS } from "@/components/ui/Icons";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

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
        {MODE_KEYS.map((key) => {
          const mode = MODES[key];
          const count = MOCK_PROFILES.filter(p => p.mode === key).length;
          const Icon = MODE_ICONS[key];

          return (
            <motion.div key={key} variants={cardVariants}>
              <Link
                href={`/browse?mode=${key}`}
                className="block bg-bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform hover:border-accent/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${mode.color}15` }}>
                      {Icon && <Icon size={20} className="text-accent" />}
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-text">{mode.name}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-safe" aria-hidden="true" />
                        <span className="text-[10px] text-text-muted">{count * 12 + Math.floor(Math.random() * 30)} actifs</span>
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

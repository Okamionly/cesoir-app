"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODE_ICONS } from "@/components/ui/Icons";
import Link from "next/link";
import { modesVariants, springs, easings } from "@/lib/motion-design";

const containerVariants: Variants = modesVariants.grid;

const cardVariants: Variants = modesVariants.modeCard;

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3 relative">
        <motion.div
          initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: easings.out }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <motion.span
              className="text-lg text-accent"
              aria-hidden="true"
              animate={
                reducedMotion
                  ? undefined
                  : { rotate: [0, 8, 0, -8, 0], scale: [1, 1.05, 1] }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              ☾
            </motion.span>
            <span className="text-base font-bold">Modes</span>
          </div>
          <p className="text-[11px] text-text-muted">Choisis ton ambiance pour ce soir</p>
        </motion.div>
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-[1px] origin-left"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #8B5CF6 50%, #00FF88 100%)",
              opacity: 0.4,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: easings.out, delay: 0.2 }}
          />
        )}
      </header>

      <motion.main
        className="px-4 pb-24 pt-4 space-y-2.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des modes"
      >
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
              animate={reducedMotion ? undefined : modesVariants.floatLoop(index)}
            >
              <Link
                href={`/modes/${key}`}
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

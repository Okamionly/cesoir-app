"use client";

import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import Link from "next/link";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface PremiumGateProps {
  /** Whether the gate is visible */
  open: boolean;
  /** Callback to dismiss the gate */
  onDismiss: () => void;
  /** Name of the feature being gated */
  featureName?: string;
  /** Short description of what they're missing */
  featureDescription?: string;
  /** Icon for the gated feature */
  featureIcon?: string;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PremiumGate({
  open,
  onDismiss,
  featureName = "Fonctionnalite Premium",
  featureDescription = "Cette fonctionnalite est reservee aux membres Premium. Debloque-la pour profiter de l'experience complete.",
  featureIcon = "👑",
}: PremiumGateProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={onDismiss}
          role="dialog"
          aria-modal="true"
          aria-label={featureName}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springs.heavy}
            className="bg-bg rounded-3xl p-6 max-w-sm w-full border border-border shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.elastic, delay: 0.1 }}
              className="text-[48px] text-center mb-4"
              aria-hidden="true"
            >
              {featureIcon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.15 }}
              className="text-[20px] font-display font-bold text-center"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {featureName}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.2 }}
              className="text-[13px] text-text-muted text-center mt-3 leading-relaxed"
            >
              {featureDescription}
            </motion.p>

            {/* Preview benefits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.25 }}
              className="mt-5 space-y-2"
            >
              {[
                { icon: "👁️", label: "Voir qui t'a like" },
                { icon: "💚", label: "Likes illimites" },
                { icon: "🚀", label: "Boost profil" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-card border border-border"
                >
                  <span className="text-[16px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-[13px] font-medium text-text">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.3 }}
              className="mt-6 space-y-3"
            >
              <Link
                href="/premium"
                className="block w-full py-3.5 rounded-full text-[15px] font-bold text-center text-white"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                }}
              >
                <motion.span
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  Debloquer
                </motion.span>
              </Link>

              <button
                onClick={onDismiss}
                className="w-full py-3 rounded-full text-[14px] font-semibold text-text-muted border border-border hover:text-text transition-colors tap-target"
              >
                Plus tard
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

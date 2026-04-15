"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import Link from "next/link";

// ─────────────────────────────────────────
// Benefits data
// ─────────────────────────────────────────

const BENEFITS = [
  {
    icon: "👁️",
    iconColor: "#8B5CF6",
    title: "Voir qui t'a like",
    description: "Decouvre qui s'interesse a toi avant meme de swiper.",
  },
  {
    icon: "💚",
    iconColor: "#00FF88",
    title: "Likes illimites",
    description: "Plus aucune limite. Like autant que tu veux, chaque soir.",
  },
  {
    icon: "↩️",
    iconColor: "#3B82F6",
    title: "Retour en arriere",
    description: "Tu as passe quelqu'un trop vite ? Reviens en arriere.",
  },
  {
    icon: "🚀",
    iconColor: "#F59E0B",
    title: "Boost profil 1x/semaine",
    description: "Ton profil en tete pendant 30 minutes, chaque semaine.",
  },
  {
    icon: "👻",
    iconColor: "#9CA3AF",
    title: "Mode Invisible",
    description: "Navigue sans etre vu. Toi seul decides qui te voit.",
  },
  {
    icon: "👑",
    iconColor: "#F59E0B",
    title: "Badge Premium exclusif",
    description: "Un badge dore qui te distingue sur tous les profils.",
  },
] as const;

// ─────────────────────────────────────────
// FAQ data
// ─────────────────────────────────────────

const FAQ = [
  {
    question: "Puis-je annuler a tout moment ?",
    answer:
      "Oui, tu peux annuler ton abonnement quand tu veux. Tu conserves les avantages jusqu'a la fin de la periode payee.",
  },
  {
    question: "L'essai gratuit est-il vraiment gratuit ?",
    answer:
      "Absolument. Pendant 7 jours, tu as acces a toutes les fonctionnalites Premium sans etre debite. Annule avant la fin si ca ne te convient pas.",
  },
  {
    question: "Comment fonctionne le boost profil ?",
    answer:
      "Chaque semaine, tu peux activer un boost qui place ton profil en priorite pendant 30 minutes. Les autres utilisateurs te voient en premier.",
  },
] as const;

// ─────────────────────────────────────────
// Plan type
// ─────────────────────────────────────────

type Plan = "monthly" | "annual";

// ─────────────────────────────────────────
// FAQ Item component
// ─────────────────────────────────────────

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.elastic, delay: 0.8 + index * 0.1 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left tap-target"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-text pr-4">
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={springs.snap}
          className="text-text-muted text-[18px] shrink-0"
          aria-hidden="true"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snap}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-[13px] text-text-muted leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Page component
// ─────────────────────────────────────────

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* ── Header ── */}
      <div className="relative px-6 pt-14 pb-10 text-center overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, #F59E0B 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.elastic}
          className="text-[48px] mb-3"
          aria-hidden="true"
        >
          👑
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.1 }}
          className="text-[28px] font-display font-bold"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #FBBF24, #F59E0B)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CeSoir Premium
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.2 }}
          className="text-[14px] text-text-muted mt-2"
        >
          Debloques toutes les fonctionnalites. Fais la difference.
        </motion.p>
      </div>

      {/* ── Benefits ── */}
      <div className="px-6 space-y-3">
        {BENEFITS.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.elastic, delay: 0.15 + i * 0.08 }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-bg-card border border-border"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0"
              style={{ backgroundColor: `${benefit.iconColor}15` }}
              aria-hidden="true"
            >
              {benefit.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-text">
                {benefit.title}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Pricing cards ── */}
      <div className="px-6 mt-10">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[18px] font-display font-bold text-center mb-5"
        >
          Choisis ton plan
        </motion.h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Monthly */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.elastic, delay: 0.65 }}
            whileHover={{
              rotateY: 3,
              transition: springs.gentle,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedPlan("monthly")}
            className="relative p-5 rounded-2xl border-2 text-left transition-colors"
            style={{
              perspective: "800px",
              borderColor:
                selectedPlan === "monthly" ? "#F59E0B" : "#EBEBEB",
              backgroundColor:
                selectedPlan === "monthly"
                  ? "rgba(245,158,11,0.05)"
                  : "transparent",
              boxShadow:
                selectedPlan === "monthly"
                  ? "0 0 20px rgba(245,158,11,0.15)"
                  : "none",
            }}
            aria-pressed={selectedPlan === "monthly"}
            aria-label="Plan mensuel, 9 euros 99 par mois"
          >
            {selectedPlan === "monthly" && (
              <motion.div
                layoutId="plan-glow"
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "0 0 25px rgba(245,158,11,0.2)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(245,158,11,0.15)",
                    "0 0 30px rgba(245,158,11,0.25)",
                    "0 0 15px rgba(245,158,11,0.15)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <p className="text-[12px] text-text-muted font-medium">Mensuel</p>
            <p className="text-[24px] font-display font-bold text-text mt-1">
              9.99<span className="text-[14px] font-normal text-text-muted">/mois</span>
            </p>
          </motion.button>

          {/* Annual */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.elastic, delay: 0.7 }}
            whileHover={{
              rotateY: 3,
              transition: springs.gentle,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedPlan("annual")}
            className="relative p-5 rounded-2xl border-2 text-left transition-colors"
            style={{
              perspective: "800px",
              borderColor:
                selectedPlan === "annual" ? "#F59E0B" : "#EBEBEB",
              backgroundColor:
                selectedPlan === "annual"
                  ? "rgba(245,158,11,0.05)"
                  : "transparent",
              boxShadow:
                selectedPlan === "annual"
                  ? "0 0 20px rgba(245,158,11,0.15)"
                  : "none",
            }}
            aria-pressed={selectedPlan === "annual"}
            aria-label="Plan annuel, 4 euros 99 par mois, facture 59 euros 99 par an"
          >
            {selectedPlan === "annual" && (
              <motion.div
                layoutId="plan-glow"
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "0 0 25px rgba(245,158,11,0.2)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(245,158,11,0.15)",
                    "0 0 30px rgba(245,158,11,0.25)",
                    "0 0 15px rgba(245,158,11,0.15)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            {/* Save badge */}
            <div
              className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: "#00FF88", color: "#111" }}
            >
              Economise 50%
            </div>
            <p className="text-[12px] text-text-muted font-medium">Annuel</p>
            <p className="text-[24px] font-display font-bold text-text mt-1">
              4.99<span className="text-[14px] font-normal text-text-muted">/mois</span>
            </p>
            <p className="text-[11px] text-text-muted mt-1">
              Facture 59.99/an
            </p>
          </motion.button>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-6 mt-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.75 }}
          whileHover={{
            y: -3,
            boxShadow: "0 8px 30px rgba(245,158,11,0.35)",
          }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 rounded-full text-[16px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
          }}
          aria-label="Commencer l'essai gratuit de 7 jours"
        >
          Essai gratuit 7 jours
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="text-[11px] text-text-muted text-center mt-3"
        >
          Annule a tout moment. Aucun engagement.
        </motion.p>
      </div>

      {/* ── Social proof ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.elastic, delay: 0.9 }}
        className="mx-6 mt-8 py-4 px-5 rounded-2xl bg-bg-card border border-border text-center"
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[14px]" style={{ color: "#F59E0B" }} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
        <p className="text-[13px] font-semibold text-text">
          Rejoint par{" "}
          <span style={{ color: "#F59E0B" }}>1,247</span>{" "}
          membres premium
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Les membres premium ont 3x plus de matchs
        </p>
      </motion.div>

      {/* ── FAQ ── */}
      <div className="px-6 mt-10 mb-8">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[16px] font-display font-bold mb-4"
        >
          Questions frequentes
        </motion.h2>

        <div className="space-y-2">
          {FAQ.map((faq, i) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Back link ── */}
      <div className="px-6 pb-6 text-center">
        <Link
          href="/browse"
          className="text-[13px] text-text-muted underline underline-offset-2"
        >
          Retour
        </Link>
      </div>
    </div>
  );
}

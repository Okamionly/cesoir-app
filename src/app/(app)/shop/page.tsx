"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useToast } from "@/components/ui/Toast";
import { useRoses } from "@/lib/useRoses";
import Link from "next/link";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ShopItem {
  id: string;
  name: string;
  amount: number;
  price: string;
  icon: string;
  popular?: boolean;
  bestValue?: boolean;
}

// ─────────────────────────────────────────
// Shop items
// ─────────────────────────────────────────

const ROSE_PACKS: ShopItem[] = [
  { id: "r5", name: "Bouquet", amount: 5, price: "2,99\u20AC", icon: "\uD83C\uDF39" },
  { id: "r15", name: "Jardin", amount: 15, price: "6,99\u20AC", icon: "\uD83C\uDF3A", popular: true },
  { id: "r30", name: "Roseraie", amount: 30, price: "9,99\u20AC", icon: "\uD83C\uDF37", bestValue: true },
];

const BOOST_PACKS: ShopItem[] = [
  { id: "b3", name: "Pack Starter", amount: 3, price: "3,99\u20AC", icon: "\u26A1" },
  { id: "b10", name: "Pack Pro", amount: 10, price: "9,99\u20AC", icon: "\u26A1\u26A1", bestValue: true },
];

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.heavy,
  },
};

const floatVariants: Variants = {
  idle: {
    y: [0, -6, 0],
    rotate: [0, 3, -3, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function ShopPage() {
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);
  const { toast } = useToast();
  const { roses, addRoses, isPremium, nextFreeRose } = useRoses();

  const handlePurchase = (item: ShopItem, type: "rose" | "boost") => {
    setPurchaseAnimation(item.id);
    setTimeout(() => {
      setPurchaseAnimation(null);
      if (type === "rose") {
        addRoses(item.amount, `Achat ${item.name}`);
      }
      toast(`Achat simule ! +${item.amount} ${type === "rose" ? "Roses" : "Boosts"}`, "success");
    }, 800);
  };

  // Time until next free rose
  const nextRoseLabel = nextFreeRose
    ? (() => {
        const diff = nextFreeRose.getTime() - Date.now();
        if (diff <= 0) return "Disponible !";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `${days}j ${hours}h` : `${hours}h`;
      })()
    : "7 jours";

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{"\uD83D\uDECD\uFE0F"}</span>
              <h1 className="text-base font-display font-bold text-text">Boutique</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] font-semibold text-pink-400">
                {"\uD83C\uDF39"} {roses} Roses
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      <motion.div
        className="px-5 pt-6 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ Balance card ═══ */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-accent/20 p-5"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.08))",
          }}
        >
          {/* Floating rose */}
          <motion.span
            variants={floatVariants}
            animate="idle"
            className="absolute top-3 right-4 text-3xl opacity-20"
            aria-hidden="true"
          >
            {"\uD83C\uDF39"}
          </motion.span>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
              <span className="text-2xl">{"\uD83C\uDF39"}</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Ton solde</p>
              <p className="text-2xl font-display font-bold text-text">{roses} Roses</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Prochaine rose gratuite : {nextRoseLabel}
                {isPremium && <span className="text-accent ml-1">(Premium: 5/sem)</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ Roses section ═══ */}
        <div>
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">{"\uD83C\uDF39"}</span>
            <h2 className="text-sm font-display font-bold text-text">Acheter des Roses</h2>
          </motion.div>
          <p className="text-xs text-text-muted mb-4">
            Like les Standouts, envoie des FlashNotes, like les profils tendance
          </p>

          <div className="space-y-3">
            {ROSE_PACKS.map((pack) => (
              <motion.div
                key={pack.id}
                variants={itemVariants}
                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  purchaseAnimation === pack.id
                    ? "border-accent bg-accent/5 scale-[0.98]"
                    : "border-border bg-card hover:border-accent/20"
                }`}
              >
                {/* Popular / Best value badge */}
                {(pack.popular || pack.bestValue) && (
                  <div className="absolute -top-2 right-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
                        pack.bestValue ? "gradient-bg" : "bg-amber-500"
                      }`}
                    >
                      {pack.bestValue ? "Meilleur prix" : "Populaire"}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xl"
                  animate={
                    purchaseAnimation === pack.id
                      ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {pack.icon}
                </motion.div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-text">{pack.name}</p>
                  <p className="text-xs text-text-muted">{pack.amount} Roses</p>
                </div>

                {/* Buy button */}
                <motion.button
                  onClick={() => handlePurchase(pack, "rose")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={purchaseAnimation === pack.id}
                  className="px-4 py-2 rounded-full gradient-bg text-white text-xs font-bold shadow-glow disabled:opacity-60"
                >
                  {purchaseAnimation === pack.id ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      {"\u2728"}
                    </motion.span>
                  ) : (
                    pack.price
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══ Boosts section ═══ */}
        <div>
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">{"\u26A1"}</span>
            <h2 className="text-sm font-display font-bold text-text">Acheter des Boosts</h2>
          </motion.div>
          <p className="text-xs text-text-muted mb-4">
            30 minutes de visibilite maximale sur ton profil
          </p>

          <div className="space-y-3">
            {BOOST_PACKS.map((pack) => (
              <motion.div
                key={pack.id}
                variants={itemVariants}
                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  purchaseAnimation === pack.id
                    ? "border-accent bg-accent/5 scale-[0.98]"
                    : "border-border bg-card hover:border-accent/20"
                }`}
              >
                {pack.bestValue && (
                  <div className="absolute -top-2 right-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white gradient-bg">
                      Meilleur prix
                    </span>
                  </div>
                )}

                <motion.div
                  className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl"
                  animate={
                    purchaseAnimation === pack.id
                      ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {pack.icon}
                </motion.div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-text">{pack.name}</p>
                  <p className="text-xs text-text-muted">{pack.amount} Boosts</p>
                </div>

                <motion.button
                  onClick={() => handlePurchase(pack, "boost")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={purchaseAnimation === pack.id}
                  className="px-4 py-2 rounded-full gradient-bg text-white text-xs font-bold shadow-glow disabled:opacity-60"
                >
                  {purchaseAnimation === pack.id ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      {"\u2728"}
                    </motion.span>
                  ) : (
                    pack.price
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══ Premium card ═══ */}
        <motion.div variants={itemVariants}>
          <Link href="/premium">
            <motion.div
              whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(139,92,246,0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl border border-accent/30 p-5"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(168,85,247,0.08), rgba(236,72,153,0.06))",
              }}
            >
              {/* Animated glow */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
                  <span className="text-2xl" aria-hidden="true">{"\uD83D\uDC8E"}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-display font-bold text-text">CeSoir Premium</h3>
                    <motion.span
                      animate={{ rotate: [0, -5, 5, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs"
                      aria-hidden="true"
                    >
                      {"\uD83D\uDC51"}
                    </motion.span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    5 Roses/sem, 1 Boost/jour, likes illimites et plus
                  </p>
                  <p className="text-xs text-accent font-semibold mt-1">
                    A partir de 9,99\u20AC/mois
                  </p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent shrink-0" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* ═══ How Roses work ═══ */}
        <motion.div variants={itemVariants} className="pb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Comment fonctionnent les Roses ?
          </h3>
          <div className="space-y-3">
            {[
              { icon: "\uD83C\uDF1F", title: "Like un Standout", desc: "Montre ton interet pour un profil exceptionnel" },
              { icon: "\uD83D\uDCDD", title: "Envoie une FlashNote", desc: "Un message personnalise qui se demarque" },
              { icon: "\uD83D\uDD25", title: "Like un profil tendance", desc: "Distingue-toi parmi les profils populaires" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.snap, delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="text-base mt-0.5" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-text">{item.title}</p>
                  <p className="text-[10px] text-text-muted">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

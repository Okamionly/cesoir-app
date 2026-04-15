"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface KarmaTransaction {
  id: string;
  label: string;
  amount: number;
  date: string;
}

interface KarmaDisplayProps {
  karma: number;
  transactions?: KarmaTransaction[];
}

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
}

interface EarnRule {
  label: string;
  amount: number;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "s1", name: "Boost profil 1h", cost: 50, description: "Ton profil en priorite pendant 1 heure" },
  { id: "s2", name: "Super Like x3", cost: 100, description: "3 super likes pour te demarquer" },
  { id: "s3", name: "Priorite dans le feed", cost: 200, description: "Apparais en premier pendant 24h" },
  { id: "s4", name: "Badge Exclusif", cost: 500, description: "Un badge unique sur ton profil" },
];

const EARN_RULES: EarnRule[] = [
  { label: "Profil complet", amount: 10 },
  { label: "Par soiree", amount: 5 },
  { label: "Bonne review", amount: 20 },
  { label: "Par message", amount: 2 },
];

const DEFAULT_TRANSACTIONS: KarmaTransaction[] = [
  { id: "t1", label: "Soiree avec Claire", amount: 5, date: "Aujourd'hui" },
  { id: "t2", label: "Review recue", amount: 20, date: "Aujourd'hui" },
  { id: "t3", label: "Boost profil", amount: -50, date: "Hier" },
  { id: "t4", label: "Message envoye", amount: 2, date: "Hier" },
  { id: "t5", label: "Profil complete", amount: 10, date: "13 Avr" },
  { id: "t6", label: "Soiree avec Thomas", amount: 5, date: "12 Avr" },
];

const shopItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function KarmaDisplay({
  karma,
  transactions = DEFAULT_TRANSACTIONS,
}: KarmaDisplayProps) {
  const [showShop, setShowShop] = useState(false);
  const [tab, setTab] = useState<"depenser" | "gagner" | "historique">("depenser");

  return (
    <div role="region" aria-label="Points Karma">
      {/* Karma number */}
      <div className="text-center mb-6">
        <p className="text-[12px] font-medium mb-1" style={{ color: "#888" }}>
          Tes points Karma
        </p>
        <motion.p
          className="font-bold text-[48px] leading-none"
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk')",
            background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          key={karma}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          aria-live="polite"
        >
          {karma}
        </motion.p>
      </div>

      {/* Action button */}
      <motion.button
        onClick={() => setShowShop(true)}
        className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white mb-4"
        style={{ background: "#8B5CF6" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Ouvrir la boutique karma"
      >
        Depenser
      </motion.button>

      {/* Quick earn rules preview */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{ background: "#141414", border: "1px solid #222" }}
      >
        <p className="text-[12px] font-semibold mb-2 text-white">Comment gagner</p>
        <div className="space-y-1.5">
          {EARN_RULES.map((rule, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: "#999" }}>
                {rule.label}
              </span>
              <span className="text-[12px] font-bold" style={{ color: "#00FF88" }}>
                +{rule.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions preview */}
      <div
        className="rounded-xl p-3"
        style={{ background: "#141414", border: "1px solid #222" }}
      >
        <p className="text-[12px] font-semibold mb-2 text-white">Historique recent</p>
        <div className="space-y-2">
          {transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-white">{tx.label}</p>
                <p className="text-[10px]" style={{ color: "#666" }}>{tx.date}</p>
              </div>
              <span
                className="text-[13px] font-bold"
                style={{ color: tx.amount > 0 ? "#00FF88" : "#EF4444" }}
              >
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shop bottom sheet */}
      <AnimatePresence>
        {showShop && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShop(false)}
              aria-hidden="true"
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[80vh] flex flex-col"
              style={{ background: "#141414", borderTop: "1px solid #222" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-label="Boutique Karma"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full" style={{ background: "#444" }} />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <h3
                  className="text-white font-bold text-[18px]"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
                >
                  Boutique Karma
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}
                >
                  {karma} pts
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-4 pb-3" role="tablist">
                {([
                  { key: "depenser" as const, label: "Depenser" },
                  { key: "gagner" as const, label: "Comment gagner" },
                  { key: "historique" as const, label: "Historique" },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                    style={{
                      background: tab === t.key ? "#8B5CF6" : "#222",
                      color: tab === t.key ? "#FFF" : "#999",
                    }}
                    role="tab"
                    aria-selected={tab === t.key}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {tab === "depenser" && (
                  <motion.div
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                    role="list"
                    aria-label="Articles de la boutique"
                  >
                    {SHOP_ITEMS.map((item) => {
                      const canAfford = karma >= item.cost;
                      return (
                        <motion.div
                          key={item.id}
                          variants={shopItemVariants}
                          className="rounded-xl p-4 flex items-center gap-3"
                          style={{ background: "#1a1a1a", border: "1px solid #222" }}
                          role="listitem"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(139,92,246,0.15)" }}
                            aria-hidden="true"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B5CF6">
                              <path d="M12 2l2.09 6.26L20.18 9l-5 4.39L16.82 20 12 16.54 7.18 20l1.64-6.61L3.82 9l6.09-.74z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-[14px]">{item.name}</p>
                            <p className="text-[11px]" style={{ color: "#888" }}>{item.description}</p>
                          </div>
                          <motion.button
                            className="px-3 py-1.5 rounded-lg text-[12px] font-bold flex-shrink-0"
                            style={{
                              background: canAfford ? "#8B5CF6" : "#333",
                              color: canAfford ? "#FFF" : "#666",
                            }}
                            disabled={!canAfford}
                            whileHover={canAfford ? { scale: 1.05 } : {}}
                            whileTap={canAfford ? { scale: 0.95 } : {}}
                            aria-label={`Acheter ${item.name} pour ${item.cost} karma`}
                          >
                            {item.cost}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {tab === "gagner" && (
                  <div className="space-y-3" role="list" aria-label="Methodes pour gagner du karma">
                    {EARN_RULES.map((rule, i) => (
                      <motion.div
                        key={i}
                        className="rounded-xl p-4 flex items-center justify-between"
                        style={{ background: "#1a1a1a", border: "1px solid #222" }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        role="listitem"
                      >
                        <span className="text-white text-[14px]">{rule.label}</span>
                        <span
                          className="text-[14px] font-bold px-3 py-1 rounded-full"
                          style={{ background: "rgba(0,255,136,0.1)", color: "#00FF88" }}
                        >
                          +{rule.amount}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {tab === "historique" && (
                  <div className="space-y-2" role="list" aria-label="Historique des transactions karma">
                    {transactions.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        className="flex items-center justify-between py-3"
                        style={{ borderBottom: i < transactions.length - 1 ? "1px solid #1a1a1a" : "none" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        role="listitem"
                      >
                        <div>
                          <p className="text-white text-[13px]">{tx.label}</p>
                          <p className="text-[11px]" style={{ color: "#666" }}>{tx.date}</p>
                        </div>
                        <span
                          className="text-[14px] font-bold"
                          style={{ color: tx.amount > 0 ? "#00FF88" : "#EF4444" }}
                        >
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplitBillProps {
  open: boolean;
  onClose: () => void;
  onSend: (summary: string) => void;
}

type SplitMode = "50/50" | "jinvite" | "tuinvites" | "custom";

const CALC_BUTTONS = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  ".", "0", "del",
];

export default function SplitBill({ open, onClose, onSend }: SplitBillProps) {
  const [amount, setAmount] = useState("0");
  const [splitMode, setSplitMode] = useState<SplitMode>("50/50");
  const [customPercent, setCustomPercent] = useState(50);

  const numericAmount = parseFloat(amount) || 0;

  const getPerPerson = useCallback((): { self: number; other: number } => {
    switch (splitMode) {
      case "50/50":
        return { self: numericAmount / 2, other: numericAmount / 2 };
      case "jinvite":
        return { self: numericAmount, other: 0 };
      case "tuinvites":
        return { self: 0, other: numericAmount };
      case "custom":
        return {
          self: (numericAmount * customPercent) / 100,
          other: (numericAmount * (100 - customPercent)) / 100,
        };
    }
  }, [numericAmount, splitMode, customPercent]);

  const handleCalcPress = useCallback((key: string) => {
    if (key === "del") {
      setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === "." && amount.includes(".")) return;
    if (amount === "0" && key !== ".") {
      setAmount(key);
    } else {
      setAmount((prev) => prev + key);
    }
  }, [amount]);

  const handleSend = useCallback(() => {
    const pp = getPerPerson();
    const label =
      splitMode === "50/50"
        ? "50/50"
        : splitMode === "jinvite"
          ? "J'invite"
          : splitMode === "tuinvites"
            ? "Tu invites"
            : `${customPercent}% / ${100 - customPercent}%`;
    const summary = `Addition: ${numericAmount.toFixed(2)} EUR - ${label} (Toi: ${pp.self.toFixed(2)} EUR / Autre: ${pp.other.toFixed(2)} EUR)`;
    onSend(summary);
  }, [getPerPerson, numericAmount, splitMode, customPercent, onSend]);

  const perPerson = getPerPerson();

  const splitOptions: { key: SplitMode; label: string }[] = [
    { key: "50/50", label: "50/50" },
    { key: "jinvite", label: "J'invite" },
    { key: "tuinvites", label: "Tu invites" },
    { key: "custom", label: "Custom %" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col"
            style={{ background: "#141414", borderTop: "1px solid #222" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-label="Calculateur de partage d'addition"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "#444" }} />
            </div>

            {/* Amount display */}
            <div className="text-center px-4 pb-4">
              <p className="text-[12px] font-medium mb-1" style={{ color: "#888" }}>
                Montant total
              </p>
              <p
                className="font-bold text-[42px] leading-none text-white"
                style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
                aria-live="polite"
                aria-label={`Montant: ${amount} euros`}
              >
                {amount}
                <span className="text-[20px] ml-1" style={{ color: "#666" }}>EUR</span>
              </p>
            </div>

            {/* Split options */}
            <div className="flex gap-2 px-4 pb-3" role="radiogroup" aria-label="Mode de partage">
              {splitOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSplitMode(opt.key)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                  style={{
                    background: splitMode === opt.key ? "#8B5CF6" : "#222",
                    color: splitMode === opt.key ? "#FFF" : "#999",
                  }}
                  role="radio"
                  aria-checked={splitMode === opt.key}
                  aria-label={opt.label}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom slider */}
            {splitMode === "custom" && (
              <div className="px-4 pb-3">
                <div className="flex justify-between text-[11px] mb-1" style={{ color: "#888" }}>
                  <span>Toi: {customPercent}%</span>
                  <span>Autre: {100 - customPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customPercent}
                  onChange={(e) => setCustomPercent(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                  aria-label="Pourcentage de partage"
                />
              </div>
            )}

            {/* Per-person amounts */}
            <div className="flex gap-3 px-4 pb-3">
              <div
                className="flex-1 p-3 rounded-xl text-center"
                style={{ background: "#1a1a1a" }}
              >
                <p className="text-[11px] mb-1" style={{ color: "#888" }}>Toi</p>
                <p className="text-white font-bold text-[18px]">
                  {perPerson.self.toFixed(2)}
                  <span className="text-[12px] ml-0.5" style={{ color: "#666" }}>EUR</span>
                </p>
              </div>
              <div
                className="flex-1 p-3 rounded-xl text-center"
                style={{ background: "#1a1a1a" }}
              >
                <p className="text-[11px] mb-1" style={{ color: "#888" }}>Autre</p>
                <p className="text-white font-bold text-[18px]">
                  {perPerson.other.toFixed(2)}
                  <span className="text-[12px] ml-0.5" style={{ color: "#666" }}>EUR</span>
                </p>
              </div>
            </div>

            {/* Calculator pad */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-3">
              {CALC_BUTTONS.map((key) => (
                <motion.button
                  key={key}
                  onClick={() => handleCalcPress(key)}
                  className="h-12 rounded-xl font-semibold text-[18px] flex items-center justify-center"
                  style={{
                    background: key === "del" ? "#333" : "#222",
                    color: key === "del" ? "#EF4444" : "#FFF",
                  }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={key === "del" ? "Supprimer" : key}
                >
                  {key === "del" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
                    </svg>
                  ) : (
                    key
                  )}
                </motion.button>
              ))}
            </div>

            {/* Send button */}
            <div className="px-4 pb-6">
              <motion.button
                onClick={handleSend}
                className="w-full py-3.5 rounded-xl font-semibold text-[14px]"
                style={{
                  background: numericAmount > 0 ? "#8B5CF6" : "#333",
                  color: numericAmount > 0 ? "#FFF" : "#666",
                }}
                disabled={numericAmount <= 0}
                whileHover={numericAmount > 0 ? { scale: 1.02 } : {}}
                whileTap={numericAmount > 0 ? { scale: 0.98 } : {}}
                aria-label="Envoyer le recap de l'addition"
              >
                Envoyer le recap
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

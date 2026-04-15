"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CheckInProps {
  peerName: string;
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "rating" | "super" | "moyen" | "bad" | "report";

export default function CheckIn({ peerName, isOpen, onClose }: CheckInProps) {
  const [phase, setPhase] = useState<Phase>("rating");

  const handleRating = (rating: "super" | "moyen" | "bad") => {
    setPhase(rating);
    if (rating === "super" || rating === "moyen") {
      setTimeout(() => {
        onClose();
        setPhase("rating");
      }, 2500);
    }
  };

  const handleDismissBad = () => {
    onClose();
    setPhase("rating");
  };

  const handleReport = () => {
    setPhase("report");
    setTimeout(() => {
      onClose();
      setPhase("rating");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-label="Check-in post rencontre"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={handleDismissBad} />

          {/* Content */}
          <motion.div
            className="relative bg-bg rounded-3xl border border-border p-6 w-full max-w-sm shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {phase === "rating" && (
              <div className="text-center">
                <p className="text-[17px] font-bold text-text mb-2">
                  Comment s&apos;est passee ta rencontre avec {peerName} ?
                </p>
                <p className="text-[12px] text-text-muted mb-6">
                  Ton retour aide la communaute
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleRating("super")}
                    className="flex flex-col items-center gap-2 tap-target active:scale-95 transition-transform"
                    aria-label="Super rencontre"
                  >
                    <span className="text-[40px]">😊</span>
                    <span className="text-[12px] font-semibold text-text">Super</span>
                  </button>
                  <button
                    onClick={() => handleRating("moyen")}
                    className="flex flex-col items-center gap-2 tap-target active:scale-95 transition-transform"
                    aria-label="Rencontre moyenne"
                  >
                    <span className="text-[40px]">😐</span>
                    <span className="text-[12px] font-semibold text-text">Moyen</span>
                  </button>
                  <button
                    onClick={() => handleRating("bad")}
                    className="flex flex-col items-center gap-2 tap-target active:scale-95 transition-transform"
                    aria-label="Mauvaise rencontre"
                  >
                    <span className="text-[40px]">😞</span>
                    <span className="text-[12px] font-semibold text-text">Pas bien</span>
                  </button>
                </div>
              </div>
            )}

            {phase === "super" && (
              <motion.div
                className="text-center py-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.span
                  className="text-[48px] block mb-3"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.6 }}
                  aria-hidden="true"
                >
                  🎉
                </motion.span>
                <p className="text-[16px] font-bold text-text mb-1">Genial !</p>
                <p className="text-[13px] text-text-muted">
                  +1 karma pour vous deux
                </p>
                {/* Sparkle particles */}
                <div className="relative h-8 mt-2">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        left: `${30 + i * 8}%`,
                        background: i % 2 === 0 ? "#8B5CF6" : "#00FF88",
                      }}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -20 - Math.random() * 20, opacity: 0 }}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "moyen" && (
              <motion.div
                className="text-center py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-[40px] block mb-3" aria-hidden="true">🙏</span>
                <p className="text-[16px] font-bold text-text">Merci pour ton retour</p>
              </motion.div>
            )}

            {phase === "bad" && (
              <div className="text-center">
                <span className="text-[40px] block mb-3" aria-hidden="true">😞</span>
                <p className="text-[15px] font-bold text-text mb-4">Desole que ca n&apos;ait pas ete top</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleReport}
                    className="w-full py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[13px] font-semibold text-[#EF4444] tap-target active:scale-95 transition-transform"
                  >
                    Signaler un probleme
                  </button>
                  <button
                    onClick={handleDismissBad}
                    className="w-full py-3 rounded-xl border border-border text-[13px] font-semibold text-text-muted tap-target active:scale-95 transition-transform"
                  >
                    C&apos;etait juste pas le feeling
                  </button>
                </div>
              </div>
            )}

            {phase === "report" && (
              <motion.div
                className="text-center py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-[40px] block mb-3" aria-hidden="true">🛡️</span>
                <p className="text-[16px] font-bold text-text mb-1">Signalement envoye</p>
                <p className="text-[12px] text-text-muted">Notre equipe va examiner la situation</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

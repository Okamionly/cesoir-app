"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";

// ─── Types ───────────────────────────────────────
type SheetAction = "idle" | "menu" | "report-reason" | "blocked" | "reported";

interface QuickBlockProps {
  /** The profile ID to block/report */
  profileId: string;
  /** The profile name for display */
  profileName: string;
  /** Children that trigger long-press */
  children: React.ReactNode;
  /** Callback when user is blocked */
  onBlock?: (profileId: string) => void;
  /** Callback when user is reported */
  onReport?: (profileId: string, reason: string) => void;
}

const REPORT_REASONS = [
  { id: "fake", icon: "🎭", label: "Faux profil" },
  { id: "harassment", icon: "⚠️", label: "Harcelement" },
  { id: "inappropriate", icon: "🚫", label: "Contenu inapproprie" },
  { id: "scam", icon: "💰", label: "Arnaque" },
  { id: "minor", icon: "👶", label: "Utilisateur mineur" },
  { id: "other", icon: "📝", label: "Autre raison" },
];

// ─── Variants ────────────────────────────────────
const sheetVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.heavy,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.25 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...springs.snap, delay: 0.1 + i * 0.05 },
  }),
};

const toastVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.elastic,
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// ─── Component ───────────────────────────────────
export default function QuickBlock({
  profileId,
  profileName,
  children,
  onBlock,
  onReport,
}: QuickBlockProps) {
  const [action, setAction] = useState<SheetAction>("idle");
  const [showToast, setShowToast] = useState<string | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressed = useRef(false);

  const handleLongPressStart = useCallback(() => {
    isPressed.current = true;
    longPressRef.current = setTimeout(() => {
      if (isPressed.current) {
        haptics.heavy();
        setAction("menu");
      }
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    isPressed.current = false;
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleBlock = useCallback(() => {
    haptics.success();
    onBlock?.(profileId);
    setAction("blocked");
    setShowToast("Utilisateur bloque");
    setTimeout(() => {
      setAction("idle");
      setShowToast(null);
    }, 2500);
  }, [profileId, onBlock]);

  const handleReport = useCallback(
    (reason: string) => {
      haptics.success();
      onReport?.(profileId, reason);
      setAction("reported");
      setShowToast("Signalement envoye");
      setTimeout(() => {
        setAction("idle");
        setShowToast(null);
      }, 2500);
    },
    [profileId, onReport]
  );

  const handleClose = useCallback(() => {
    haptics.light();
    setAction("idle");
  }, []);

  return (
    <>
      {/* Wrap children with long-press handler */}
      <div
        onPointerDown={handleLongPressStart}
        onPointerUp={handleLongPressEnd}
        onPointerLeave={handleLongPressEnd}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none" }}
      >
        {children}
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {(action === "menu" || action === "report-reason") && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-3xl shadow-2xl"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-label={action === "menu" ? "Actions sur le profil" : "Raison du signalement"}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pb-8">
                {action === "menu" && (
                  <>
                    <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4 mt-2">
                      {profileName}
                    </p>

                    {/* Block */}
                    <motion.button
                      onClick={handleBlock}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-border mb-2 tap-target"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      whileTap={micro.tapScale}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-[#EF4444]">Bloquer</p>
                        <p className="text-[11px] text-text-muted">Ne verra plus ton profil</p>
                      </div>
                    </motion.button>

                    {/* Report */}
                    <motion.button
                      onClick={() => setAction("report-reason")}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-border mb-2 tap-target"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={1}
                      whileTap={micro.tapScale}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-[#f59e0b]">Signaler</p>
                        <p className="text-[11px] text-text-muted">Envoyer un rapport a l&apos;equipe</p>
                      </div>
                    </motion.button>

                    {/* Cancel */}
                    <motion.button
                      onClick={handleClose}
                      className="w-full py-3.5 rounded-full text-[14px] font-semibold text-text-muted border border-border mt-2 tap-target"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={2}
                      whileTap={micro.tapScale}
                    >
                      Annuler
                    </motion.button>
                  </>
                )}

                {action === "report-reason" && (
                  <>
                    <button
                      onClick={() => setAction("menu")}
                      className="flex items-center gap-2 text-[13px] text-accent font-semibold mb-4 mt-2 tap-target"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      Retour
                    </button>

                    <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">
                      Pourquoi signaler {profileName} ?
                    </p>

                    <div className="space-y-2">
                      {REPORT_REASONS.map((reason, i) => (
                        <motion.button
                          key={reason.id}
                          onClick={() => handleReport(reason.id)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-bg-card border border-border tap-target"
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          whileTap={micro.tapScale}
                        >
                          <span className="text-[18px]">{reason.icon}</span>
                          <span className="text-[13px] font-semibold text-text">{reason.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-28 left-4 right-4 z-[60]"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-text text-bg text-center py-3.5 px-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[14px] font-bold">{showToast}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

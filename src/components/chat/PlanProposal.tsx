"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ---------- Types ----------

export interface PlanData {
  activity: string;
  location: string;
  time: string;
  status: "pending" | "accepted";
}

// ---------- Activity chips ----------

const ACTIVITIES = [
  { label: "Diner", icon: "🍽️" },
  { label: "Verre", icon: "🍷" },
  { label: "Cinema", icon: "🎬" },
  { label: "Balade", icon: "🚶" },
  { label: "Concert", icon: "🎵" },
];

const TIME_OPTIONS = ["19h", "20h", "21h", "22h", "23h"];

// ---------- PlanProposalButton ----------

interface PlanProposalButtonProps {
  onSubmit: (plan: PlanData) => void;
}

export function PlanProposalButton({ onSubmit }: PlanProposalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activity, setActivity] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = useCallback(() => {
    const finalActivity = activity || customActivity;
    if (!finalActivity || !time) return;
    onSubmit({
      activity: finalActivity,
      location: location || "A definir",
      time,
      status: "pending",
    });
    setIsOpen(false);
    setActivity("");
    setCustomActivity("");
    setLocation("");
    setTime("");
  }, [activity, customActivity, location, time, onSubmit]);

  const canSubmit = (activity || customActivity) && time;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95"
        aria-label="Proposer un plan"
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* Bottom sheet modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-2xl border-t border-border max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              role="dialog"
              aria-label="Proposer un plan"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pb-4">
                <h3 className="text-lg font-bold text-text mb-4">Proposer un plan</h3>

                {/* Quoi */}
                <label className="text-[11px] text-text-muted uppercase tracking-widest font-semibold block mb-2">
                  Quoi
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {ACTIVITIES.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        setActivity(a.label === activity ? "" : a.label);
                        if (a.label !== activity) setCustomActivity("");
                      }}
                      className={`px-3 py-2 rounded-xl text-[13px] font-medium border transition-all active:scale-95 ${
                        activity === a.label
                          ? "gradient-bg text-white border-transparent"
                          : "bg-bg-card border-border text-text hover:border-accent/30"
                      }`}
                    >
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
                {!activity && (
                  <input
                    type="text"
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    placeholder="Ou ecris ta propre idee..."
                    className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-4"
                  />
                )}
                {activity && <div className="mb-4" />}

                {/* Ou */}
                <label className="text-[11px] text-text-muted uppercase tracking-widest font-semibold block mb-2">
                  Ou
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nom du lieu ou adresse"
                  className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-4"
                />

                {/* Quelle heure */}
                <label className="text-[11px] text-text-muted uppercase tracking-widest font-semibold block mb-2">
                  Quelle heure
                </label>
                <div className="flex gap-2 flex-wrap mb-6">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t === time ? "" : t)}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-all active:scale-95 ${
                        time === t
                          ? "gradient-bg text-white border-transparent"
                          : "bg-bg-card border-border text-text hover:border-accent/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  Proposer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------- PlanCard (displayed in chat) ----------

interface PlanCardProps {
  plan: PlanData;
  isOwn: boolean;
  time: string;
  onAccept?: () => void;
  onModify?: () => void;
}

export function PlanCard({ plan, isOwn, time, onAccept, onModify }: PlanCardProps) {
  const activityInfo = ACTIVITIES.find((a) => a.label === plan.activity);
  const icon = activityInfo?.icon ?? "📅";
  const isAccepted = plan.status === "accepted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div
        className={`max-w-[80%] rounded-2xl overflow-hidden border-2 ${
          isAccepted ? "border-safe" : "border-transparent"
        }`}
        style={!isAccepted ? { border: "2px solid transparent", backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #8B5CF6, #00FF88)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" } : {}}
      >
        <div className="bg-bg p-3.5">
          {isAccepted && (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-safe text-[13px] font-bold mb-2"
            >
              Plan confirme !
            </motion.p>
          )}

          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-text">{plan.activity}</p>
              <p className="text-[12px] text-text-muted mt-0.5">
                📍 {plan.location}
              </p>
              <p className="text-[12px] text-text-muted">
                🕐 {plan.time}
              </p>
            </div>
          </div>

          {!isAccepted && !isOwn && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={onAccept}
                className="flex-1 py-2 rounded-xl gradient-bg text-white text-[13px] font-semibold active:scale-95 transition-transform"
              >
                Accepter
              </button>
              <button
                onClick={onModify}
                className="flex-1 py-2 rounded-xl bg-bg-card border border-border text-text text-[13px] font-semibold active:scale-95 transition-transform"
              >
                Modifier
              </button>
            </div>
          )}

          {!isAccepted && isOwn && (
            <p className="text-[11px] text-text-muted mt-2 text-center">En attente de reponse...</p>
          )}

          <span className={`block text-[10px] mt-2 text-text-muted text-right`}>
            {time}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

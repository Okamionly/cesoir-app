"use client";

// ========================================
// Rendezvous Page — Live "J'arrive" meeting tracker
// ========================================
//
// Like Uber's "track your ride" but for dates.
// Shows both users converging on a venue with live status updates.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { useRendezvous, QUICK_MESSAGES } from "@/lib/useRendezvous";
import LiveMeetingMap from "@/components/app/LiveMeetingMap";
import ArrivalStatus from "@/components/app/ArrivalStatus";

// ─── Mock data (in production, fetched from Supabase) ───
const MOCK_MATCH = {
  name: "Camille",
  avatar: "C",
  venue: "Le Petit Cler",
};

export default function RendezvousPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = (params?.matchId as string) ?? "demo";

  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showSafetyShare, setShowSafetyShare] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);

  const {
    state,
    sendQuickMessage,
    updateStatus,
    confirmMet,
    notifyArriving,
  } = useRendezvous({
    matchId,
    matchName: MOCK_MATCH.name,
  });

  const isMet = state.myStatus === "met";
  const isStarted = state.myStatus !== "pending";

  // Handle quick message send with feedback
  const handleQuickMessage = (msgId: string) => {
    haptics.medium();
    sendQuickMessage(msgId);
    setSentMessageId(msgId);
    setTimeout(() => setSentMessageId(null), 2000);
  };

  // Handle "J'arrive!" button
  const handleArrive = () => {
    haptics.success();
    notifyArriving();
  };

  // Handle confirm met
  const handleConfirmMet = () => {
    haptics.match();
    confirmMet();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      {/* ─── Header ────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-4 pb-3 pt-safe"
        style={{
          backgroundColor: "rgba(250,250,250,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center gap-3 pt-3">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            aria-label="Retour"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Match avatar */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "#00FF88" }}
          >
            {MOCK_MATCH.avatar}
          </div>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold" style={{ color: "#111111" }}>
              Rendez-vous avec {MOCK_MATCH.name}
            </h1>
            <p className="text-xs" style={{ color: "#666666" }}>
              {MOCK_MATCH.venue}
              {!isMet && state.distance > 0 && ` \u2022 ${state.distance}m`}
            </p>
          </div>

          {/* Live indicator */}
          {isStarted && !isMet && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
              <motion.div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#EF4444" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[10px] font-semibold" style={{ color: "#EF4444" }}>
                LIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Content ───────────────────────────── */}
      <div className="space-y-4 p-4">
        {/* Map */}
        <LiveMeetingMap
          myPosition={state.myPosition}
          theirPosition={state.theirPosition}
          venuePosition={state.venuePosition}
          myName="Toi"
          theirName={MOCK_MATCH.name}
          myStatus={state.myStatus}
          theirStatus={state.theirStatus}
          distance={state.distance}
          venueName={MOCK_MATCH.venue}
        />

        {/* Arrival status */}
        <ArrivalStatus
          myName="Toi"
          theirName={MOCK_MATCH.name}
          myStatus={state.myStatus}
          theirStatus={state.theirStatus}
          eta={state.eta}
          bothArrived={state.bothArrived}
          isMet={isMet}
        />

        {/* ─── Action Buttons ──────────────────── */}
        {!isMet && (
          <div className="space-y-3">
            {/* J'arrive! button */}
            {!isStarted ? (
              <motion.button
                type="button"
                onClick={handleArrive}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
                }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springs.snap}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                J&apos;arrive !
              </motion.button>
            ) : (
              <>
                {/* Confirm met button (when both arrived) */}
                {state.bothArrived && (
                  <motion.button
                    type="button"
                    onClick={handleConfirmMet}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #22C55E 0%, #00FF88 100%)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={springs.elastic}
                  >
                    <span className="text-lg">&#x2728;</span>
                    On s&apos;est trouve !
                  </motion.button>
                )}

                {/* Quick message button */}
                <motion.button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setShowQuickMessages(!showQuickMessages);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#111111",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Message rapide
                </motion.button>
              </>
            )}

            {/* Quick messages panel */}
            <AnimatePresence>
              {showQuickMessages && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {QUICK_MESSAGES.map((msg) => (
                    <motion.button
                      key={msg.id}
                      type="button"
                      onClick={() => handleQuickMessage(msg.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: sentMessageId === msg.id ? "rgba(139,92,246,0.1)" : "#FFFFFF",
                        color: "#111111",
                        border: sentMessageId === msg.id
                          ? "1px solid rgba(139,92,246,0.3)"
                          : "1px solid rgba(0,0,0,0.06)",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-base">{msg.icon}</span>
                      <span className="flex-1">{msg.text}</span>
                      {sentMessageId === msg.id && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs"
                          style={{ color: "#8B5CF6" }}
                        >
                          Envoye !
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ─── Messages Feed ───────────────────── */}
        {state.messages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: "#999999" }}>
              Messages
            </p>
            {state.messages.map((msg) => (
              <motion.div
                key={msg.id}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: msg.from === "me" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springs.snap}
                style={{
                  justifyContent: msg.from === "me" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  className="max-w-[75%] rounded-2xl px-3.5 py-2"
                  style={{
                    backgroundColor: msg.from === "me" ? "#8B5CF6" : "#FFFFFF",
                    color: msg.from === "me" ? "#FFFFFF" : "#111111",
                    border: msg.from === "me" ? "none" : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className="mt-0.5 text-[10px]"
                    style={{
                      color: msg.from === "me" ? "rgba(255,255,255,0.6)" : "#999999",
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── Safety Section ──────────────────── */}
        <div className="space-y-2 pb-24">
          {/* Share with trusted contact */}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setShowSafetyShare(!showSafetyShare);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#111111" }}>
                Partager avec un proche
              </p>
              <p className="text-xs" style={{ color: "#999999" }}>
                Envoie ta position en temps reel
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#CCCCCC"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Safety share panel */}
          <AnimatePresence>
            {showSafetyShare && (
              <motion.div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="mb-3 text-xs font-medium" style={{ color: "#22C55E" }}>
                  Contacts de confiance
                </p>
                {["Maman", "Juliette", "Lucas"].map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border-b py-2.5 last:border-0"
                    style={{ borderColor: "rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        {name.charAt(0)}
                      </div>
                      <span className="text-sm" style={{ color: "#111111" }}>
                        {name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => haptics.light()}
                      className="rounded-lg px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                    >
                      Partager
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Met confirmation (if already met) */}
          {isMet && (
            <motion.div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(236,72,153,0.05) 100%)",
                border: "1px solid rgba(139,92,246,0.1)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.heavy}
            >
              <motion.p
                className="mb-2 text-4xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                &#x1F942;
              </motion.p>
              <p className="text-lg font-bold" style={{ color: "#111111" }}>
                Bonne soiree !
              </p>
              <p className="mt-1 text-sm" style={{ color: "#666666" }}>
                Profitez bien de votre rendez-vous
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-4 rounded-xl px-6 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#8B5CF6" }}
              >
                Retour a l&apos;accueil
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

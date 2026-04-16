"use client";

// ========================================
// ArrivalStatus — Shows status of both users
// ========================================
//
// Displays real-time meeting status for you and your match.
// Celebration animation when both arrive.

import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { MeetingStatus } from "@/lib/useRendezvous";

interface ArrivalStatusProps {
  myName: string;
  theirName: string;
  myStatus: MeetingStatus;
  theirStatus: MeetingStatus;
  eta: number;
  bothArrived: boolean;
  isMet: boolean;
}

function statusLabel(status: MeetingStatus): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "en_route":
      return "En route";
    case "nearby":
      return "Proche";
    case "arrived":
      return "Arrive !";
    case "met":
      return "Retrouve !";
  }
}

function statusIcon(status: MeetingStatus): string {
  switch (status) {
    case "pending":
      return "\u23F3";
    case "en_route":
      return "\u{1F6B6}";
    case "nearby":
      return "\u{1F4CD}";
    case "arrived":
      return "\u2705";
    case "met":
      return "\u{1F389}";
  }
}

function statusColor(status: MeetingStatus): string {
  switch (status) {
    case "pending":
      return "rgba(255,255,255,0.4)";
    case "en_route":
      return "#FBBF24";
    case "nearby":
      return "#F97316";
    case "arrived":
      return "#22C55E";
    case "met":
      return "#8B5CF6";
  }
}

export default function ArrivalStatus({
  myName,
  theirName,
  myStatus,
  theirStatus,
  eta,
  bothArrived,
  isMet,
}: ArrivalStatusProps) {
  return (
    <div className="w-full space-y-3">
      {/* Status cards */}
      <div className="flex gap-3">
        {/* My status */}
        <motion.div
          className="flex flex-1 items-center gap-3 rounded-2xl p-3"
          style={{
            backgroundColor: "#FFFFFF",
            border: `2px solid ${myStatus === "arrived" || isMet ? "#8B5CF6" : "rgba(0,0,0,0.06)"}`,
          }}
          animate={{
            borderColor: myStatus === "arrived" || isMet ? "#8B5CF6" : "rgba(0,0,0,0.06)",
          }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(139,92,246,0.1)" }}
          >
            <span className="text-base">{statusIcon(myStatus)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: "#111111" }}>
              {myName} (toi)
            </p>
            <p className="text-xs font-semibold" style={{ color: statusColor(myStatus) }}>
              {statusLabel(myStatus)}
            </p>
          </div>
          {/* Status dot */}
          <motion.div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor(myStatus) }}
            animate={
              myStatus === "en_route"
                ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : {}
            }
            transition={
              myStatus === "en_route"
                ? { duration: 1.5, repeat: Infinity }
                : {}
            }
          />
        </motion.div>

        {/* Their status */}
        <motion.div
          className="flex flex-1 items-center gap-3 rounded-2xl p-3"
          style={{
            backgroundColor: "#FFFFFF",
            border: `2px solid ${theirStatus === "arrived" || isMet ? "#00FF88" : "rgba(0,0,0,0.06)"}`,
          }}
          animate={{
            borderColor: theirStatus === "arrived" || isMet ? "#00FF88" : "rgba(0,0,0,0.06)",
          }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,255,136,0.1)" }}
          >
            <span className="text-base">{statusIcon(theirStatus)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: "#111111" }}>
              {theirName}
            </p>
            <p className="text-xs font-semibold" style={{ color: statusColor(theirStatus) }}>
              {statusLabel(theirStatus)}
            </p>
          </div>
          {/* Status dot */}
          <motion.div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor(theirStatus) }}
            animate={
              theirStatus === "en_route"
                ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : {}
            }
            transition={
              theirStatus === "en_route"
                ? { duration: 1.5, repeat: Infinity }
                : {}
            }
          />
        </motion.div>
      </div>

      {/* ETA bar */}
      {!isMet && eta > 0 && (
        <motion.div
          className="flex items-center justify-center gap-2 rounded-xl py-2"
          style={{ backgroundColor: "rgba(139,92,246,0.06)" }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snap}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs font-medium" style={{ color: "#8B5CF6" }}>
            Arrive dans ~{eta} min
          </span>
        </motion.div>
      )}

      {/* Celebration when both arrive */}
      <AnimatePresence>
        {(bothArrived || isMet) && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 text-center"
            style={{
              background: isMet
                ? "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
                : "linear-gradient(135deg, #22C55E 0%, #00FF88 100%)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={springs.elastic}
          >
            {/* Sparkle particles */}
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute h-1 w-1 rounded-full bg-white/40"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.25,
                }}
              />
            ))}

            <motion.p
              className="text-2xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isMet ? "\u{1F389}" : "\u2728"}
            </motion.p>
            <p className="mt-1 text-sm font-bold text-white">
              {isMet ? "Bonne soiree !" : "Vous etes tous les deux la !"}
            </p>
            {!isMet && (
              <p className="mt-0.5 text-xs text-white/80">
                Retrouvez-vous et confirmez
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

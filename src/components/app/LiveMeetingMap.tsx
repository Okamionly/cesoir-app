"use client";

// ========================================
// LiveMeetingMap — Mock map with two animated dots
// ========================================
//
// Pure CSS/SVG map showing two users converging on a venue.
// No map library needed -- this is an intimate, stylized view.

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { MeetingStatus } from "@/lib/useRendezvous";

interface LiveMeetingMapProps {
  myPosition: { x: number; y: number };
  theirPosition: { x: number; y: number };
  venuePosition: { x: number; y: number };
  myName: string;
  theirName: string;
  myStatus: MeetingStatus;
  theirStatus: MeetingStatus;
  distance: number;
  venueName: string;
}

export default function LiveMeetingMap({
  myPosition,
  theirPosition,
  venuePosition,
  myName,
  theirName,
  myStatus,
  theirStatus,
  distance,
  venueName,
}: LiveMeetingMapProps) {
  // Calculate midpoint for distance label
  const midX = (myPosition.x + theirPosition.x) / 2;
  const midY = (myPosition.y + theirPosition.y) / 2;

  // Calculate angle for direction arrow from me to them
  const angle = Math.atan2(
    theirPosition.y - myPosition.y,
    theirPosition.x - myPosition.x,
  ) * (180 / Math.PI);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        aspectRatio: "1 / 1",
        background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 50%, #16213e 100%)",
      }}
    >
      {/* Grid lines for map feel */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Subtle grid */}
        {Array.from({ length: 10 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 10}
            x2="100"
            y2={i * 10}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.2"
          />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 10}
            y1="0"
            x2={i * 10}
            y2="100"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.2"
          />
        ))}

        {/* Mock streets */}
        <line x1="20" y1="0" x2="20" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="80" y1="0" x2="80" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="0" y1="55" x2="100" y2="55" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Diagonal street */}
        <line x1="10" y1="90" x2="90" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

        {/* Dotted line between the two users */}
        <line
          x1={myPosition.x}
          y1={myPosition.y}
          x2={theirPosition.x}
          y2={theirPosition.y}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
          strokeDasharray="1.5 1.5"
        />

        {/* Line from me to venue */}
        <line
          x1={myPosition.x}
          y1={myPosition.y}
          x2={venuePosition.x}
          y2={venuePosition.y}
          stroke="rgba(139,92,246,0.2)"
          strokeWidth="0.3"
          strokeDasharray="1 1"
        />

        {/* Line from them to venue */}
        <line
          x1={theirPosition.x}
          y1={theirPosition.y}
          x2={venuePosition.x}
          y2={venuePosition.y}
          stroke="rgba(0,255,136,0.2)"
          strokeWidth="0.3"
          strokeDasharray="1 1"
        />
      </svg>

      {/* Venue pin */}
      <motion.div
        className="absolute z-10 flex flex-col items-center"
        style={{
          left: `${venuePosition.x}%`,
          top: `${venuePosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.elastic}
      >
        {/* Venue pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(239,68,68,0.1)",
          }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Venue dot */}
        <div
          className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: "#EF4444" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" fill="#EF4444" />
          </svg>
        </div>
        {/* Venue label */}
        <span
          className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-medium"
          style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#EF4444" }}
        >
          {venueName}
        </span>
      </motion.div>

      {/* My dot (purple) */}
      <motion.div
        className="absolute z-20 flex flex-col items-center"
        style={{
          left: `${myPosition.x}%`,
          top: `${myPosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          left: `${myPosition.x}%`,
          top: `${myPosition.y}%`,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(139,92,246,0.15)",
          }}
          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: "rgba(139,92,246,0.25)",
          }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        {/* Dot */}
        <div
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20"
          style={{ backgroundColor: "#8B5CF6" }}
        >
          <span className="text-[8px] font-bold text-white">
            {myName.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Name label */}
        <span
          className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={{ backgroundColor: "rgba(139,92,246,0.2)", color: "#C4B5FD" }}
        >
          {myStatus === "arrived" ? "Arrive !" : myName}
        </span>
      </motion.div>

      {/* Their dot (green) */}
      <motion.div
        className="absolute z-20 flex flex-col items-center"
        style={{
          left: `${theirPosition.x}%`,
          top: `${theirPosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          left: `${theirPosition.x}%`,
          top: `${theirPosition.y}%`,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(0,255,136,0.12)",
          }}
          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: "rgba(0,255,136,0.2)",
          }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
        />
        {/* Dot */}
        <div
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20"
          style={{ backgroundColor: "#00FF88" }}
        >
          <span className="text-[8px] font-bold" style={{ color: "#0A0A0A" }}>
            {theirName.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Name label */}
        <span
          className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={{ backgroundColor: "rgba(0,255,136,0.15)", color: "#00FF88" }}
        >
          {theirStatus === "arrived" ? "Arrive !" : theirName}
        </span>
      </motion.div>

      {/* Distance label at midpoint */}
      {distance > 0 && (
        <motion.div
          className="absolute z-30 flex items-center gap-1 rounded-full px-2.5 py-1 shadow-lg"
          style={{
            left: `${midX}%`,
            top: `${midY}%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.snap}
        >
          {/* Direction arrow */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <span className="text-[10px] font-semibold text-white">
            {distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`}
          </span>
        </motion.div>
      )}

      {/* Corner info */}
      <div
        className="absolute bottom-3 left-3 z-30 rounded-xl px-3 py-1.5"
        style={{
          backgroundColor: "rgba(10,10,10,0.7)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
            <span className="text-[10px] text-white/60">Toi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00FF88" }} />
            <span className="text-[10px] text-white/60">{theirName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#EF4444" }} />
            <span className="text-[10px] text-white/60">Lieu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

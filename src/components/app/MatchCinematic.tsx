"use client";

/**
 * MatchCinematic — Full-screen match takeover (Wave 15 · CPO brief).
 *
 * Replaces the small bottom MatchToast with an overlay that earns the moment:
 * - Peer avatar zooms 0.3 → 1.05 → 1.0 (overshoot spring)
 * - Confetti particles (borrowed from the onboarding celebration screen)
 * - Sound + haptics (safe no-ops when unsupported)
 * - Phrase dynamique anchored on the shared mode
 * - Pre-filled conversation starter from `conversationStarters.ts`
 * - Dismiss button top-right (subtle)
 *
 * Motion lib = motion/react (not framer-motion) — see constraints.
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { springs, easings } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { playSound } from "@/lib/sounds";
import { MODES, type ModeKey, isActiveMode } from "@/lib/modes";
import { getStarters } from "@/lib/conversationStarters";
import { X } from "@/components/ui/lucide";

export interface MatchCinematicProps {
  open: boolean;
  peerId: string;
  peerName: string;
  peerPhoto: string;
  sharedMode?: string | null;
  conversationId?: string | null;
  onDismiss: () => void;
}

// Confetti ring — 16 colored dots radiating outward. Uses the same palette
// as the onboarding celebration screen for consistency.
const CONFETTI_COLORS = ["#8B5CF6", "#00FF88", "#EC4899", "#FACC15", "#06B6D4"];

export default function MatchCinematic({
  open,
  peerId,
  peerName,
  peerPhoto,
  sharedMode,
  conversationId,
  onDismiss,
}: MatchCinematicProps) {
  // Resolve mode data — fallback gracefully if mode is legacy / null.
  const mode = useMemo(() => {
    if (sharedMode && isActiveMode(sharedMode)) return MODES[sharedMode as ModeKey];
    return null;
  }, [sharedMode]);

  // Generate the pre-filled starter (one, short).
  const starter = useMemo(() => {
    if (!mode) return `Salut ${peerName} !`;
    const lines = getStarters(mode.key, peerName);
    return lines[0] ?? `Salut ${peerName} !`;
  }, [mode, peerName]);

  const phrase = useMemo(() => {
    if (mode) return `Vous cherchez tous les deux un ${mode.name} ce soir`;
    return "Vous etes dispos ce soir";
  }, [mode]);

  // Side-effects when overlay opens
  useEffect(() => {
    if (!open) return;
    try {
      haptics.match();
    } catch {
      /* unsupported */
    }
    try {
      playSound("match");
    } catch {
      /* unsupported */
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  const chatHref = conversationId
    ? `/chat/${conversationId}?starter=${encodeURIComponent(starter)}`
    : `/chat/new?peer=${encodeURIComponent(peerId)}&starter=${encodeURIComponent(starter)}`;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-cinematic-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop — dark, blurred */}
          <m.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(139,92,246,0.22) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.92) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Ambient radial halo */}
          <m.div
            className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(236,72,153,0.3) 40%, transparent 70%)",
              filter: "blur(36px)",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Confetti burst — 16 radial particles */}
          {[...Array(16)].map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const radius = 180 + (i % 3) * 40;
            const targetX = Math.cos(angle) * radius;
            const targetY = Math.sin(angle) * radius;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            return (
              <m.div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}`,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: targetX,
                  y: targetY,
                  scale: [0, 1.4, 0.9],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.4,
                  delay: 0.35 + i * 0.04,
                  ease: easings.overshoot,
                }}
              />
            );
          })}

          {/* Dismiss button */}
          <m.button
            type="button"
            onClick={onDismiss}
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white tap-target"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            aria-label="Fermer"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </m.button>

          {/* Content */}
          <div className="relative z-[2] flex flex-col items-center text-center px-6 max-w-md">
            {/* Top label */}
            <m.p
              className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3"
              style={{ color: "rgba(255,255,255,0.7)" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              C&apos;est un match
            </m.p>

            {/* Peer avatar — overshoot spring (0.3 → 1.05 → 1.0) */}
            <m.div
              className="relative mb-6"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.05, 1], opacity: 1 }}
              transition={{
                duration: 0.9,
                times: [0, 0.7, 1],
                ease: easings.overshoot,
                delay: 0.1,
              }}
            >
              {/* Glow ring */}
              <m.div
                className="absolute -inset-3 rounded-full"
                aria-hidden="true"
                style={{
                  background:
                    "conic-gradient(from 0deg, #8B5CF6, #EC4899, #00FF88, #8B5CF6)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-black border-4 border-white/10">
                <Image
                  src={peerPhoto}
                  alt={peerName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </m.div>

            {/* Name */}
            <m.h2
              id="match-cinematic-title"
              className="text-3xl font-black text-white mb-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.6 }}
            >
              {peerName}
            </m.h2>

            {/* Dynamic phrase */}
            <m.p
              className="text-[14px] text-white/70 leading-relaxed mb-8 max-w-xs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.75 }}
            >
              {phrase}
            </m.p>

            {/* Starter preview card */}
            <m.div
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.9 }}
            >
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                Message propose
              </p>
              <p className="text-[14px] text-white/90 italic">&ldquo;{starter}&rdquo;</p>
            </m.div>

            {/* Single CTA */}
            <m.div
              className="w-full"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springs.elastic, delay: 1.05 }}
            >
              <Link
                href={chatHref}
                onClick={onDismiss}
                className="w-full inline-block gradient-bg text-white px-8 py-4 rounded-full text-[15px] font-bold shadow-glow tap-target"
              >
                Dis bonjour
              </Link>
            </m.div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

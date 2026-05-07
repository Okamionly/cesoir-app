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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { springs, easings, moodMatchVariants } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { playSound } from "@/lib/sounds";
import { MODES, type ModeKey, isActiveMode } from "@/lib/modes";
import { getStarters } from "@/lib/conversationStarters";
import { trackFirstTime } from "@/lib/analytics";
import { Check, Share2, X } from "@/components/ui/lucide";
import { announceToSR } from "@/components/ui/LiveRegion";

export interface MatchCinematicProps {
  open: boolean;
  peerId: string;
  peerName: string;
  peerPhoto: string;
  sharedMode?: string | null;
  conversationId?: string | null;
  onDismiss: () => void;
  /**
   * Auto-dismiss timer in ms. Defaults to 8000 (Tinder/Bumble pattern).
   * Set to 0 / null to disable auto-dismiss entirely.
   */
  autoDismissMs?: number | null;
}

const DEFAULT_AUTO_DISMISS_MS = 8000;

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
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: MatchCinematicProps) {
  // Auto-dismiss timer with pause-on-hover/tap support.
  // Tracks whether the user is currently engaging with the card so we don't
  // cut them off mid-read. Pausing clears the existing timer; unpausing restarts.
  const [isPaused, setIsPaused] = useState(false);
  const [hasFiredOnce, setHasFiredOnce] = useState(false);
  const dismissedRef = useRef(false);

  // Share UX state — tracks the post-share confirmation toast and a sticky
  // "share dialog open" pause flag (separate from hover-pause so the timer
  // stays frozen while the OS share sheet is up, even after pointer leaves).
  const [shareCopied, setShareCopied] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Reset internal state every time the overlay reopens for a new match.
  useEffect(() => {
    if (open) {
      setIsPaused(false);
      setHasFiredOnce(false);
      setShareCopied(false);
      setIsShareDialogOpen(false);
      dismissedRef.current = false;
    }
  }, [open]);

  // Wrap onDismiss so we can guard against double-fire (CTA click + timer race).
  const safeDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss();
  }, [onDismiss]);

  // Pause/resume helpers wired to pointer + focus events on the card.
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  // -------------------------------------------------------------------------
  // Privacy-safe share handler.
  //
  // CRITICAL CONSTRAINT (Privacy by Default):
  //   The share payload NEVER includes the matched person's name, photo, id,
  //   or any other identifying info. We only share a generic teaser + the app
  //   URL. This is intentional — bragging about a match is OK, doxxing the
  //   other person is not.
  //
  // Strategy:
  //   1. Pause the auto-dismiss timer while the share sheet is up.
  //   2. Try Web Share API (with optional Level 2 image attachment).
  //   3. Fall back to clipboard copy on desktop Safari / unsupported browsers.
  //   4. Show a 2s confirmation toast ("Lien copié !" or "Partagé !").
  //   5. Fire `first_match_share` analytics — peerId is sent to PostHog
  //      (server-side), NOT exposed in the share payload itself.
  // -------------------------------------------------------------------------
  const handleShare = useCallback(async () => {
    const shareUrl = "https://cesoir-app.vercel.app";
    const shareText =
      "J'ai fait un match sur CeSoir 💜 Ce soir c'est ton soir aussi → cesoir.app";
    const shareTitle = "CeSoir";

    // Mark the share dialog as open so the auto-dismiss timer pauses for the
    // duration of the OS share sheet (or the brief clipboard copy window).
    setIsShareDialogOpen(true);

    // Track first share — peerId is OK to send to PostHog (server-side only),
    // it's never embedded in the public share payload.
    try {
      trackFirstTime("first_match_share", { peer_id: peerId });
    } catch {
      /* analytics never throws in prod, but defensive guard */
    }

    // ---- Path 1: Web Share API (mobile + Edge/Chrome desktop). -------------
    type NavigatorWithShare = Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    const nav =
      typeof navigator === "undefined"
        ? null
        : (navigator as NavigatorWithShare);
    if (nav?.share) {
      // Web Share Level 2 — try attaching the static OG image as a File so the
      // share sheet can render a rich preview. This is a best-effort: many
      // browsers/targets ignore `files` and only use text+url. If anything
      // fails (fetch, CSP, canShare returns false) we fall back to text-only.
      let files: File[] | undefined;
      try {
        const res = await fetch("/share/match-og.png");
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], "cesoir-match.png", {
            type: blob.type || "image/png",
          });
          if (!nav.canShare || nav.canShare({ files: [file] })) {
            files = [file];
          }
        }
      } catch {
        /* image unavailable — share text-only */
      }

      try {
        await nav.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          ...(files ? { files } : {}),
        });
        // Success path — show "Partagé !" toast briefly, then resume timer.
        setShareCopied(true);
        try {
          haptics.light();
        } catch {
          /* unsupported */
        }
        window.setTimeout(() => setShareCopied(false), 2000);
        setIsShareDialogOpen(false);
        return;
      } catch (err) {
        // AbortError = user dismissed the sheet — silent close, no toast.
        // Other errors fall through to the clipboard path.
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        if (isAbort) {
          setIsShareDialogOpen(false);
          return;
        }
      }
    }

    // ---- Path 2: Clipboard fallback (desktop Safari, no-share contexts). ---
    const fallbackPayload = `${shareText}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fallbackPayload);
      setShareCopied(true);
      try {
        haptics.light();
      } catch {
        /* unsupported */
      }
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ---- Path 3: Legacy execCommand fallback (very old browsers). --------
      try {
        const input = document.createElement("textarea");
        input.value = fallbackPayload;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      } catch {
        /* nothing more we can do */
      }
    } finally {
      setIsShareDialogOpen(false);
    }
  }, [peerId]);
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
    return "Vous êtes dispos ce soir";
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
    // a11y round 2 (2026-04-27): announce the match to SR users via the
    // assertive channel — this event is time-critical (the cinematic auto-
    // dismisses in 8s) so interruption is acceptable.
    try {
      announceToSR(`C'est un match avec ${peerName}`, "assertive");
    } catch {
      /* defensive */
    }
  }, [open, peerName]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") safeDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, safeDismiss]);

  // Auto-dismiss timer — pausable. Re-creates the timer whenever isPaused flips
  // back to false. Disabled when autoDismissMs is null/0. Also paused while the
  // share sheet is open so users mid-share don't get the overlay yanked from
  // under them. Only fires once per open cycle (hasFiredOnce gate) so we don't
  // re-fire if the user briefly hovers then unhovers near the deadline.
  useEffect(() => {
    if (!open) return;
    if (!autoDismissMs || autoDismissMs <= 0) return;
    if (isPaused) return;
    if (isShareDialogOpen) return;
    if (hasFiredOnce) return;
    const t = window.setTimeout(() => {
      setHasFiredOnce(true);
      safeDismiss();
    }, autoDismissMs);
    return () => window.clearTimeout(t);
  }, [open, autoDismissMs, isPaused, isShareDialogOpen, hasFiredOnce, safeDismiss]);

  const showCountdown = Boolean(autoDismissMs && autoDismissMs > 0);
  const countdownSeconds = autoDismissMs ? Math.round(autoDismissMs / 1000) : 0;

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
          {/* Backdrop — dark, blurred. Tapping outside the card dismisses. */}
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
            onClick={safeDismiss}
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

          {/* Dismiss button (X top-right) */}
          <m.button
            type="button"
            onClick={safeDismiss}
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white tap-target"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            aria-label="Fermer"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </m.button>

          {/* Content — hovering/tapping pauses the auto-dismiss timer so users
              reading carefully don't get cut off mid-thought. */}
          <div
            className="relative z-[2] flex flex-col items-center text-center px-6 max-w-md"
            onPointerEnter={pause}
            onPointerLeave={resume}
            onPointerDown={pause}
            onFocus={pause}
            onBlur={resume}
          >
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
                  sizes="128px"
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </m.div>

            {/* Name — rubber spring reveal + single scale pulse to earn the moment */}
            <m.h2
              id="match-cinematic-title"
              className="text-3xl font-black text-white mb-2"
              variants={{
                ...moodMatchVariants.matchCard,
                visible: {
                  ...(moodMatchVariants.matchCard.visible as object),
                },
              }}
              initial="hidden"
              animate={{
                scale: [0, 1.05, 0.97, 1.03, 1],
                opacity: 1,
                rotateZ: 0,
              }}
              transition={{
                duration: 0.9,
                times: [0, 0.45, 0.65, 0.82, 1],
                delay: 0.5,
                ease: "easeOut",
              }}
            >
              {peerName}
            </m.h2>

            {/* Dynamic phrase — uses moodMatchVariants.compatText signature (blur → clear cinematic) */}
            <m.p
              className="text-[14px] text-white/70 leading-relaxed mb-8 max-w-xs"
              variants={moodMatchVariants.compatText}
              initial="hidden"
              animate="visible"
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
                Message proposé
              </p>
              <p className="text-[14px] text-white/90 italic">&ldquo;{starter}&rdquo;</p>
            </m.div>

            {/* CTAs — primary "Dis bonjour" + secondary privacy-safe share. */}
            <m.div
              className="w-full flex items-center gap-3"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springs.elastic, delay: 1.05 }}
            >
              <Link
                href={chatHref as Route}
                onClick={() => {
                  // Mark the cycle as fired so the auto-timer effect won't
                  // re-fire onDismiss after navigation, then dismiss cleanly.
                  setHasFiredOnce(true);
                  safeDismiss();
                }}
                className="flex-1 inline-block text-center gradient-bg text-white px-8 py-4 rounded-full text-[15px] font-bold shadow-glow tap-target"
              >
                Dis bonjour
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-4 rounded-full text-[13px] font-semibold border tap-target transition-colors ${
                  shareCopied
                    ? "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30"
                    : "bg-white/5 text-white/80 border-white/15 hover:bg-white/10 hover:text-white"
                }`}
                aria-label={shareCopied ? "Lien copié" : "Partager mon match"}
                title="Partager (sans révéler l'identité du match)"
              >
                {shareCopied ? (
                  <>
                    <Check size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span>Lien copié&nbsp;!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span>Partager</span>
                  </>
                )}
              </button>
            </m.div>
          </div>

          {/* Countdown indicator — bottom progress bar that drains over the
              auto-dismiss window. Pauses (CSS animation-play-state) when the
              user is hovering/tapping. Hidden if auto-dismiss is disabled. */}
          {showCountdown && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-2 px-6 pb-4 pointer-events-none"
              aria-hidden="true"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
                {isPaused || isShareDialogOpen
                  ? "En pause"
                  : `Fermeture auto dans ${countdownSeconds}s`}
              </div>
              <div className="w-32 h-[2px] rounded-full bg-white/10 overflow-hidden">
                <m.div
                  key={`countdown-${open}-${isPaused}-${isShareDialogOpen}-${hasFiredOnce}`}
                  className="h-full bg-white/50"
                  initial={{ width: "100%" }}
                  animate={{
                    width:
                      isPaused || isShareDialogOpen || hasFiredOnce
                        ? "100%"
                        : "0%",
                  }}
                  transition={{
                    duration:
                      isPaused || isShareDialogOpen || hasFiredOnce
                        ? 0
                        : (autoDismissMs ?? DEFAULT_AUTO_DISMISS_MS) / 1000,
                    ease: "linear",
                  }}
                />
              </div>
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}

"use client";

/**
 * VoiceMiniPlayer — floating chip shown above the input bar while:
 *   1. A voice clip is currently playing (the coordinator has an
 *      active controller that is in the `isPlaying === true` state).
 *   2. The user is typing in the chat input (so the bubble is likely
 *      pushed off-screen or the user wants to focus on writing).
 *
 * The chip looks like "▶ 0:23 · Marie". Tap → re-expands by scrolling
 * the originating bubble into view (the underlying audio keeps playing
 * — we never pause on takeover).
 *
 * Why a separate file:
 *   The chat page already mounts ~30 chat-feature components. Keeping
 *   the chip in its own file keeps the page slim and lets us evolve
 *   the look (waveform progress, drag-to-seek, etc.) without touching
 *   the page layout.
 */

import { m, AnimatePresence } from "motion/react";
import { Pause, Play } from "@/components/ui/lucide";
import {
  expandActive,
  pauseAll,
  resumeActive,
  useActiveVoice,
} from "./voice-player-coordinator";

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VoiceMiniPlayerProps {
  /** True only when the chat input is currently focused. */
  visible: boolean;
}

export default function VoiceMiniPlayer({ visible }: VoiceMiniPlayerProps) {
  const snap = useActiveVoice();
  const showChip = visible && snap !== null;

  return (
    <AnimatePresence>
      {showChip && snap && (
        <m.button
          key="voice-mini-player"
          type="button"
          onClick={() => {
            // Tap on the chip body re-expands the bubble — does NOT pause.
            expandActive();
          }}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="mx-3 mb-1 flex items-center gap-2 px-3 h-8 rounded-full gradient-bg shadow-sm self-start text-white"
          aria-label={`Message vocal en cours${snap.peerName ? ` de ${snap.peerName}` : ""} — toucher pour ouvrir`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // Inner pause/play button toggles playback without expanding.
              if (snap.isPlaying) {
                pauseAll();
              } else {
                void resumeActive();
              }
            }}
            className="w-5 h-5 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors"
            aria-label={snap.isPlaying ? "Pause" : "Lecture"}
          >
            {snap.isPlaying ? (
              <Pause size={10} strokeWidth={2.4} fill="white" color="white" aria-hidden="true" />
            ) : (
              <Play size={10} strokeWidth={2.4} fill="white" color="white" aria-hidden="true" />
            )}
          </button>
          <span className="text-[11px] font-semibold tabular-nums">
            {formatDuration(snap.currentMs)} / {formatDuration(snap.durationMs)}
          </span>
          {snap.peerName && (
            <>
              <span className="text-white/60 text-[10px]">·</span>
              <span className="text-[11px] font-semibold truncate max-w-[8rem]">
                {snap.peerName}
              </span>
            </>
          )}
          {snap.speed !== 1 && (
            <span className="px-1.5 h-4 rounded-full bg-white/25 text-[9px] font-bold tabular-nums leading-none flex items-center">
              {snap.speed}x
            </span>
          )}
        </m.button>
      )}
    </AnimatePresence>
  );
}

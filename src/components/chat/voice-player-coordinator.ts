"use client";

/**
 * voice-player-coordinator — module-scoped singleton that lets a chat page
 * coordinate state across many <VoiceMessagePlayer> bubbles plus the
 * surrounding chat shell (input bar, scroll container, mini-player).
 *
 * Why a singleton (rather than React context):
 *   - The chat page already mounts dozens of components. Threading a
 *     provider through the `messages` map + the input bar + the FAB
 *     requires touching every render branch. A tiny pub/sub keeps the
 *     surface area minimal — the only public API is the `useActiveVoice`
 *     hook + the `pauseAll()` helper.
 *   - There is exactly one chat page on screen at a time (full-screen
 *     route), so a global is the right shape.
 *
 * Lifecycle:
 *   - A player calls `register(controller)` on mount and unregisters on
 *     unmount. When it begins playback it calls `setActive(controller)`
 *     which (a) pauses any other active controller, (b) updates the
 *     subscribed `useActiveVoice` consumers (e.g. the mini-player chip).
 *   - When the player ends or pauses, it calls `clearActive(controller)`.
 *   - `pauseAll()` is wired to the chat scroll listener: any upward
 *     scroll past a small dead-zone calls it; the player keeps its
 *     `currentTime` so the user can resume on tap.
 */
import { useSyncExternalStore } from "react";

export interface VoicePlayerSnapshot {
  /** Stable id matching the message row id. */
  messageId: string;
  /** Display name shown next to the mini-player time. */
  peerName: string | null;
  /** Authoritative duration (ms) — drives the "0:23 · Marie" label. */
  durationMs: number;
  /** Current playhead (ms) — updated by the active player. */
  currentMs: number;
  /** Playback rate at the moment of the snapshot. */
  speed: 1 | 1.5 | 2;
  /** True while the underlying <audio> is playing. */
  isPlaying: boolean;
}

export interface VoicePlayerController {
  /** Always-current snapshot getter — used by `useActiveVoice`. */
  getSnapshot(): VoicePlayerSnapshot;
  /** Pause without losing position. Called on cross-bubble takeover + scroll. */
  pause(): void;
  /** Resume from current position. Called by the mini-player tap. */
  resume(): Promise<void>;
  /** Re-expand to the full bubble — scrolls the bubble into view. */
  expand(): void;
}

type Listener = () => void;

let activeController: VoicePlayerController | null = null;
const controllers = new Set<VoicePlayerController>();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function registerController(c: VoicePlayerController): () => void {
  controllers.add(c);
  return () => {
    controllers.delete(c);
    if (activeController === c) {
      activeController = null;
      notify();
    }
  };
}

/** Mark a controller as active — auto-pauses any previous active controller. */
export function setActiveController(c: VoicePlayerController): void {
  if (activeController && activeController !== c) {
    try {
      activeController.pause();
    } catch {
      /* ignore */
    }
  }
  activeController = c;
  notify();
}

export function clearActiveController(c: VoicePlayerController): void {
  if (activeController === c) {
    activeController = null;
    notify();
  }
}

/** Force a refresh of subscribers (mini-player) — used on tick updates. */
export function pingActive(): void {
  notify();
}

/** Pause any currently active voice — used on chat scroll. */
export function pauseAll(): void {
  if (activeController) {
    try {
      activeController.pause();
    } catch {
      /* ignore */
    }
  }
}

function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getActiveSnapshot(): VoicePlayerSnapshot | null {
  if (!activeController) return null;
  try {
    return activeController.getSnapshot();
  } catch {
    return null;
  }
}

let lastSnapshot: VoicePlayerSnapshot | null = null;
let lastSerial = "";

function getCachedSnapshot(): VoicePlayerSnapshot | null {
  // useSyncExternalStore requires a stable reference between renders when
  // nothing changed — we re-issue a new object only when fields actually
  // diverge so React doesn't enter an infinite re-render loop.
  const next = getActiveSnapshot();
  if (!next) {
    if (lastSnapshot !== null) {
      lastSnapshot = null;
      lastSerial = "";
    }
    return null;
  }
  const serial = `${next.messageId}|${next.currentMs}|${next.isPlaying ? 1 : 0}|${next.speed}|${next.durationMs}|${next.peerName ?? ""}`;
  if (serial !== lastSerial) {
    lastSnapshot = next;
    lastSerial = serial;
  }
  return lastSnapshot;
}

/** Subscribe to the currently active voice's snapshot (or null). */
export function useActiveVoice(): VoicePlayerSnapshot | null {
  return useSyncExternalStore(
    subscribe,
    getCachedSnapshot,
    () => null, // SSR snapshot — no active voice on the server
  );
}

/** Imperative resume — the mini-player calls this on tap. */
export async function resumeActive(): Promise<void> {
  if (!activeController) return;
  try {
    await activeController.resume();
  } catch {
    /* ignore */
  }
}

/** Imperative expand — the mini-player calls this on tap to re-show. */
export function expandActive(): void {
  if (!activeController) return;
  try {
    activeController.expand();
  } catch {
    /* ignore */
  }
}

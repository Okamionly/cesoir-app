"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import type { Gender } from "./supabase-types";

// ── Storage ───────────────────────────────────────

const STORAGE_KEY = "cesoir_women_first";

export interface WomenFirstSettings {
  /** Whether women-first mode is globally enabled by this user */
  enabled: boolean;
  /** Per-mode overrides (mode key -> enabled). Absent = use global. */
  modes: Record<string, boolean>;
}

const DEFAULT: WomenFirstSettings = { enabled: false, modes: {} };

function load(): WomenFirstSettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

function save(s: WomenFirstSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable
  }
}

// ── Settings hook (for the toggle) ────────────────

export function useWomenFirstSettings() {
  const [settings, setSettings] = useState<WomenFirstSettings>(DEFAULT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(load());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    save(settings);
  }, [settings, mounted]);

  const toggle = () =>
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));

  const setModeOverride = (mode: string, value: boolean) =>
    setSettings((prev) => ({
      ...prev,
      modes: { ...prev.modes, [mode]: value },
    }));

  return { settings, toggle, setModeOverride };
}

// ── Time helpers ──────────────────────────────────

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(deadlineMs: number): TimeLeft {
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function formatTimeLeft(tl: TimeLeft): string {
  if (tl.total <= 0) return "Expire";
  const h = tl.hours;
  const m = String(tl.minutes).padStart(2, "0");
  const s = String(tl.seconds).padStart(2, "0");
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// ── Main hook ─────────────────────────────────────

export interface UseWomenFirstReturn {
  /** Whether the women-first rule applies to this conversation */
  isWomenFirst: boolean;
  /** Whether the current user can send a message right now */
  canSendMessage: boolean;
  /** Name of the person we are waiting for (or null) */
  waitingFor: string | null;
  /** Time remaining before the match expires */
  timeLeft: TimeLeft;
  /** Human-readable time left string */
  timeLeftFormatted: string;
  /** Whether the match has expired */
  expired: boolean;
  /** Prompt text to show the current user */
  prompt: string | null;
}

/**
 * Determines if the current conversation requires "women first" messaging.
 *
 * @param conversationId  - current conversation
 * @param userId          - current authenticated user
 * @param userGender      - current user's gender
 * @param peerName        - display name of the other user
 * @param peerGender      - gender of the other user
 * @param conversationCreatedAt - ISO timestamp of when the match/conversation was created
 * @param hasMessages     - whether any messages exist yet
 * @param firstSenderId   - sender_id of the very first message (if any)
 * @param mode            - the mode under which this conversation was created
 */
export function useWomenFirst(
  conversationId: string | undefined,
  userId: string | undefined,
  userGender: Gender | undefined,
  peerName: string | undefined,
  peerGender: Gender | undefined,
  conversationCreatedAt: string | undefined,
  hasMessages: boolean,
  firstSenderId: string | null,
  mode: string | null,
): UseWomenFirstReturn {
  const [now, setNow] = useState(Date.now());
  const settings = useMemo(() => load(), []);

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine if women-first applies to this conversation
  const isWomenFirst = useMemo(() => {
    if (!settings.enabled) return false;
    // Mode-specific override
    if (mode && mode in settings.modes) return settings.modes[mode];
    // Only applies when one user is "femme" and the other is "homme"
    if (!userGender || !peerGender) return false;
    const genders = new Set([userGender, peerGender]);
    return genders.has("homme") && genders.has("femme");
  }, [settings, mode, userGender, peerGender]);

  // Deadline: 24h after conversation creation
  const deadlineMs = conversationCreatedAt
    ? new Date(conversationCreatedAt).getTime() + TWENTY_FOUR_HOURS_MS
    : Infinity;

  const timeLeft = calcTimeLeft(deadlineMs);
  const expired = isWomenFirst && !hasMessages && timeLeft.total <= 0;

  // Determine who should write first
  const isUserFemme = userGender === "femme";
  const isPeerFemme = peerGender === "femme";

  // Can the current user send a message?
  let canSendMessage = true;
  let waitingFor: string | null = null;
  let prompt: string | null = null;

  if (isWomenFirst && !hasMessages && !expired) {
    if (isUserFemme) {
      // The woman CAN send, and must
      canSendMessage = true;
      prompt = "C'est a toi ! Envoie le premier message";
    } else if (isPeerFemme) {
      // The man must wait
      canSendMessage = false;
      waitingFor = peerName ?? "elle";
      prompt = `En attente de ${waitingFor}...`;
    }
  }

  // Once the woman has sent the first message, normal behavior resumes
  if (hasMessages) {
    canSendMessage = true;
    waitingFor = null;
    prompt = null;
  }

  return {
    isWomenFirst,
    canSendMessage,
    waitingFor,
    timeLeft,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    expired,
    prompt,
  };
}

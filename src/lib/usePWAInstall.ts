"use client";

/**
 * usePWAInstall — install-prompt orchestration for the Custom PWA banner.
 *
 * PWA audit 2026-04-26 (audit/round3/pwa.md, gap #6) flagged the missing
 * `beforeinstallprompt` capture. The browser default banner shows whenever
 * Chrome decides; users dismiss it with a thumb without reading. We need:
 *   1. Capture the deferred event so we can fire `prompt()` on demand.
 *   2. Track engagement (active session ≥ 2 min, ≥ 3 swipes) so we only
 *      ask qualified users.
 *   3. Detect iOS Safari (no `beforeinstallprompt` support) and switch to
 *      a manual instruction banner instead.
 *   4. Respect a 7-day "later" dismissal stored in localStorage.
 *   5. Hide entirely if the app is already running standalone (installed).
 *
 * This hook is the single source of truth for the install state — the
 * `<InstallPromptBanner>` component reads `canInstall` and calls
 * `promptInstall()` / `dismissForWeek()`.
 *
 * Storage keys (stable — analytics dashboards depend on these):
 *   cesoir_pwa_dismissed_at — ISO timestamp of last "Plus tard"
 *   cesoir_pwa_swipe_count  — running counter, bumped via `recordSwipe()`
 *   cesoir_pwa_session_at   — first-active-tick of the current session
 *   cesoir_pwa_installed    — set by the `appinstalled` event listener
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { track } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const KEY_DISMISSED_AT = "cesoir_pwa_dismissed_at";
const KEY_SWIPE_COUNT = "cesoir_pwa_swipe_count";
const KEY_SESSION_AT = "cesoir_pwa_session_at";
const KEY_INSTALLED = "cesoir_pwa_installed";

const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ENGAGEMENT_MIN_MS = 2 * 60 * 1000; // 2 minutes
const ENGAGEMENT_MIN_SWIPES = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The shape we capture from `beforeinstallprompt`. The DOM type lib doesn't
 * include `BeforeInstallPromptEvent` so we declare a minimal local interface.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallPlatform = "android" | "ios" | "desktop" | "unknown";

export interface UsePWAInstallResult {
  /** True when the banner should render (deferred event ready OR iOS + qualified). */
  canInstall: boolean;
  /** True when the user has actually been engaged enough to prompt. */
  isEngaged: boolean;
  /** True when running as installed PWA — we never prompt in that case. */
  isStandalone: boolean;
  /** True for iOS Safari where we have to show manual instructions. */
  isIOS: boolean;
  /** Detected install platform — drives banner copy + analytics props. */
  platform: InstallPlatform;
  /** Trigger the native install prompt (no-op on iOS). */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** User tapped "Plus tard" — silence the banner for 7 days. */
  dismissForWeek: () => void;
  /** Bump the swipe counter — wire this from /browse swipe handlers. */
  recordSwipe: () => void;
}

// ---------------------------------------------------------------------------
// Detection helpers (pure)
// ---------------------------------------------------------------------------

/**
 * `display-mode: standalone` covers Android Chrome installed PWAs and
 * desktop Chromium. iOS Safari only sets `navigator.standalone` instead.
 */
function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari proprietary flag — narrowly typed.
  const navStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  return navStandalone === true;
}

/**
 * iOS Safari sniff. We accept the false-positive risk on iPad+desktop-mode
 * because the banner copy is harmless ("tap the share icon") if shown wrong.
 *
 * Two checks:
 *   1. UA contains iPhone/iPad/iPod (covers most cases).
 *   2. macOS-on-iPad reports "Macintosh" UA — we add `maxTouchPoints > 1`
 *      to catch iPad masquerading as macOS Safari (Apple did this in iOS 13).
 *
 * We also exclude in-app browsers (FBAN/Twitter/Line) where install isn't
 * possible — they get the unsupported state.
 */
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPhone|iPad|iPod/i.test(ua);
  const isIPadMasq =
    /Macintosh/i.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line\//i.test(ua);
  if (isInAppBrowser) return false;
  // iOS Safari (not Chrome iOS / Firefox iOS — they share the WebKit engine
  // but their UA includes CriOS/FxiOS and do NOT support add-to-home from
  // their UI; we still show the iOS banner but with copy noting Safari).
  return isAppleDevice || isIPadMasq;
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  if (detectIOS()) return "ios";
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  // Desktop Chromium browsers also fire `beforeinstallprompt`.
  if (/Windows|Macintosh|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Storage I/O — wrapped so SSR + private-mode browsers never throw.
// ---------------------------------------------------------------------------

function safeRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota exceeded / private mode — silently ignore */
  }
}

function isDismissedRecently(): boolean {
  const raw = safeRead(KEY_DISMISSED_AT);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_WINDOW_MS;
}

function readSwipeCount(): number {
  const raw = safeRead(KEY_SWIPE_COUNT);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function readSessionStart(): number | null {
  const raw = safeRead(KEY_SESSION_AT);
  if (!raw) return null;
  const ts = Number(raw);
  return Number.isFinite(ts) ? ts : null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePWAInstall(): UsePWAInstallResult {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferred, setHasDeferred] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("unknown");
  const [isEngaged, setIsEngaged] = useState(false);

  // ── 1. One-time platform / standalone detection ────────────────────────
  useEffect(() => {
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());
    setPlatform(detectPlatform());

    // Mark this session as started if not already.
    if (!readSessionStart()) {
      safeWrite(KEY_SESSION_AT, String(Date.now()));
    }
  }, []);

  // ── 2. Capture beforeinstallprompt ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onBeforeInstallPrompt(e: Event) {
      // Critical: prevent the default mini-infobar so we can decide WHEN
      // to surface our own UI.
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setHasDeferred(true);
      track("pwa_install_prompt_captured", {
        platform: detectPlatform(),
      });
    }

    function onAppInstalled() {
      safeWrite(KEY_INSTALLED, String(Date.now()));
      setIsStandalone(true);
      setHasDeferred(false);
      deferredRef.current = null;
      track("pwa_app_installed", {
        platform: detectPlatform(),
      });
    }

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // ── 3. Engagement watcher — re-evaluate every 15s ──────────────────────
  // We don't need real-time precision; this avoids running an interval
  // tighter than necessary and lets the banner appear within ~15s of
  // crossing the threshold.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone) return;
    if (isDismissedRecently()) return;

    function check() {
      const start = readSessionStart() ?? Date.now();
      const elapsed = Date.now() - start;
      const swipes = readSwipeCount();
      const engaged =
        elapsed >= ENGAGEMENT_MIN_MS && swipes >= ENGAGEMENT_MIN_SWIPES;
      setIsEngaged(engaged);
    }

    check();
    const id = window.setInterval(check, 15_000);
    return () => window.clearInterval(id);
  }, [isStandalone]);

  // ── 4. Public API ──────────────────────────────────────────────────────

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    const deferred = deferredRef.current;
    if (!deferred) {
      // iOS path: no programmatic prompt available — the banner shows
      // manual instructions; this branch is mostly defensive.
      track("pwa_install_prompt_unavailable", { platform });
      return "unavailable";
    }

    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      track("pwa_install_prompt_outcome", {
        outcome: choice.outcome,
        platform: choice.platform || platform,
      });
      // The deferred event is one-shot — drop the reference whatever the
      // outcome is; the browser will fire `beforeinstallprompt` again only
      // after another qualifying engagement window.
      deferredRef.current = null;
      setHasDeferred(false);
      if (choice.outcome === "dismissed") {
        // Treat a native dismissal the same as "Plus tard" — don't pester.
        safeWrite(KEY_DISMISSED_AT, String(Date.now()));
      }
      return choice.outcome;
    } catch (err) {
      logger.warn("pwa_install_prompt_failed", { err: String(err) });
      return "unavailable";
    }
  }, [platform]);

  const dismissForWeek = useCallback(() => {
    safeWrite(KEY_DISMISSED_AT, String(Date.now()));
    track("pwa_install_prompt_dismissed", {
      platform,
      reason: "user_later",
    });
    // Force the banner to disappear immediately — `canInstall` will recompute.
    setIsEngaged(false);
  }, [platform]);

  const recordSwipe = useCallback(() => {
    const next = readSwipeCount() + 1;
    safeWrite(KEY_SWIPE_COUNT, String(next));
  }, []);

  // ── 5. Final visibility decision ───────────────────────────────────────
  // canInstall = "we have something to show":
  //   - not already installed
  //   - not within the 7-day cooldown
  //   - either we have a captured deferred event (Android/desktop) OR we
  //     are on iOS Safari (manual instructions path)
  //   - user is engaged enough to be worth interrupting
  const canInstall =
    !isStandalone &&
    !isDismissedRecently() &&
    isEngaged &&
    (hasDeferred || isIOS);

  return {
    canInstall,
    isEngaged,
    isStandalone,
    isIOS,
    platform,
    promptInstall,
    dismissForWeek,
    recordSwipe,
  };
}

"use client";

/**
 * InstallPromptBanner — branded PWA install CTA.
 *
 * PWA audit 2026-04-26 (audit/round3/pwa.md, gap #6) flagged the missing
 * custom install prompt. The default browser banner is dismissed by reflex
 * and shows zero brand. We replace it with a slide-in banner pinned to the
 * top of /browse, only after the user is engaged (≥ 2 min, ≥ 3 swipes).
 *
 * Two render paths share the same shell:
 *   - Android / desktop Chromium: tap "Installer" calls the captured
 *     `beforeinstallprompt.prompt()` and we react to `userChoice`.
 *   - iOS Safari: no programmatic prompt exists, so we tell the user to
 *     tap the share icon and pick "Sur l'ecran d'accueil".
 *
 * Mounted from the (app) layout but self-gates on `pathname === "/browse"`
 * — keeps the layout tree simple while only firing the engagement
 * observers on the page that actually matters for this feature.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal=false (this is non-blocking, like a snackbar
 *     promoted to a banner)
 *   - aria-labelledby points to the headline
 *   - Focus moves to the primary CTA on mount and is restored on close
 *   - Esc dismisses for 7 days (matches "Plus tard")
 */

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePWAInstall } from "@/lib/usePWAInstall";
import { useToast } from "@/components/ui/Toast";
import { X } from "@/components/ui/lucide";
import { track } from "@/lib/analytics";

// Routes the banner is allowed to appear on. /browse is the swipe surface
// where the engagement signal (>= 3 swipes) actually accumulates.
const ELIGIBLE_PATHS = new Set<string>(["/browse"]);

export default function InstallPromptBanner() {
  const pathname = usePathname();
  const {
    canInstall,
    isIOS,
    platform,
    promptInstall,
    dismissForWeek,
  } = usePWAInstall();
  const { toast } = useToast();
  const installButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Self-gate to /browse — keeps the banner contextual.
  const onEligibleRoute = pathname ? ELIGIBLE_PATHS.has(pathname) : false;
  const visible = onEligibleRoute && canInstall;

  // ── Focus management ──────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    // Push focus to the primary CTA on the next paint so the slide-in
    // animation has a frame to settle. Using rAF avoids "focus stolen"
    // jitter on iOS.
    const id = requestAnimationFrame(() => {
      installButtonRef.current?.focus();
    });
    track("pwa_install_banner_shown", {
      platform,
      mode: isIOS ? "ios_manual" : "native_prompt",
    });
    return () => {
      cancelAnimationFrame(id);
      // Restore focus when the banner closes — keeps keyboard users on
      // whatever swipe card they were on.
      previousFocusRef.current?.focus?.();
    };
  }, [visible, platform, isIOS]);

  // Esc closes (UX expectation for any banner-as-dialog).
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        dismissForWeek();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismissForWeek]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleInstallClick = useCallback(async () => {
    track("pwa_install_banner_cta_clicked", {
      platform,
      mode: isIOS ? "ios_manual" : "native_prompt",
    });

    if (isIOS) {
      // Nothing to fire — instructions remain on screen until "Plus tard".
      return;
    }

    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast("Bienvenue dans la famille ☾", "match", 4000);
    }
    // "dismissed" + "unavailable" are already logged inside the hook; the
    // banner will hide itself because the captured event was consumed.
  }, [isIOS, platform, promptInstall, toast]);

  const handleLaterClick = useCallback(() => {
    dismissForWeek();
  }, [dismissForWeek]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="pwa-install-banner"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0, transition: springs.snap }}
          transition={springs.heavy}
          // top-2 leaves room for the OfflineBanner if both ever stack —
          // OfflineBanner is z-50, this is z-[60] so install always wins
          // when both are visible (offline is the rarer case).
          className="fixed top-0 right-0 left-0 z-[60] flex justify-center px-3 pt-3 pointer-events-none"
          role="dialog"
          aria-modal="false"
          aria-labelledby="pwa-install-headline"
        >
          <div
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-accent/30 bg-bg/95 px-4 py-3 shadow-xl backdrop-blur-md"
            style={{
              // Use the brand accent (purple) as a soft glow ring so the
              // banner reads as "ours", not generic system UI.
              boxShadow:
                "0 10px 40px -10px rgba(139, 92, 246, 0.45), 0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <div className="flex items-start gap-3">
              {/* Brand mark — moon emoji keeps parity with the rest of the
                  app (the lune violette is sacred per CLAUDE.md). */}
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg"
              >
                {"☾"}
              </span>

              <div className="flex-1 min-w-0">
                <h2
                  id="pwa-install-headline"
                  className="text-sm font-semibold text-text leading-snug"
                >
                  {isIOS
                    ? "Ajoute CeSoir a ton ecran d'accueil"
                    : "Installe CeSoir sur ton ecran d'accueil"}
                </h2>

                <p className="mt-1 text-xs text-text/70 leading-relaxed">
                  {isIOS ? (
                    <>
                      Sur iPhone : tape l&apos;icone{" "}
                      <span aria-hidden="true">⎙</span>{" "}
                      <span className="sr-only">Partager</span> puis{" "}
                      <strong className="font-semibold">
                        &laquo; Sur l&apos;ecran d&apos;accueil &raquo;
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      Acces direct, notifications, mode hors-ligne. Aucun
                      App Store.
                    </>
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {/* Primary CTA — hidden on iOS (no programmatic prompt
                      to fire). We still show a "J'ai compris" so keyboard
                      users have a focus target that resolves the dialog. */}
                  <button
                    ref={installButtonRef}
                    type="button"
                    onClick={handleInstallClick}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {isIOS ? "J'ai compris" : "Installer"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLaterClick}
                    className="rounded-full px-3 py-2 text-xs font-medium text-text/70 transition-colors hover:bg-text/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Plus tard
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaterClick}
                className="shrink-0 rounded-full p-1 text-text/60 transition-colors hover:bg-text/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Fermer la banniere d'installation"
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

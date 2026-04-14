"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------- Types ----------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ---------- Helpers ----------

const STORAGE_KEY = "cesoir_install_dismissed";
const SESSION_COUNT_KEY = "cesoir_session_count";
const SHOW_AFTER_SESSIONS = 3;

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable
  }
}

function incrementSession(): number {
  try {
    const count = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// ---------- Component ----------

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed or already dismissed
    if (isStandalone() || isDismissed()) return;

    const sessionCount = incrementSession();

    // On Android/Chrome: listen for beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      // Show if enough sessions
      if (sessionCount >= SHOW_AFTER_SESSIONS) {
        setVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);

    // On iOS: show guide after enough sessions
    if (isIOS() && sessionCount >= SHOW_AFTER_SESSIONS) {
      setShowIOSGuide(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  // Called after first match (can be triggered externally)
  // Exposed via window for other components to call
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __cesoir_showInstall?: () => void }).__cesoir_showInstall = () => {
      if (!isStandalone() && !isDismissed()) {
        setVisible(true);
      }
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      deferredPromptRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    persistDismiss();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-black border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/40 hover:text-white text-lg leading-none"
        aria-label="Fermer"
      >
        x
      </button>

      {showIOSGuide ? (
        /* iOS Guide */
        <div>
          <p className="text-white font-semibold text-sm mb-2">
            Installe CeSoir sur ton iPhone
          </p>
          <ol className="text-white/60 text-xs space-y-1.5 list-decimal list-inside">
            <li>
              Appuie sur{" "}
              <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                Partager
              </span>{" "}
              en bas de Safari
            </li>
            <li>
              Fais defiler et appuie sur{" "}
              <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                Sur l&apos;ecran d&apos;accueil
              </span>
            </li>
            <li>
              Appuie sur{" "}
              <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                Ajouter
              </span>
            </li>
          </ol>
        </div>
      ) : (
        /* Android / Desktop prompt */
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white text-lg shrink-0">
            C
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Installe CeSoir</p>
            <p className="text-white/50 text-xs">
              Acces rapide, notifs en temps reel
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#7C3AED] transition-colors shrink-0"
          >
            Installer
          </button>
        </div>
      )}
    </div>
  );
}

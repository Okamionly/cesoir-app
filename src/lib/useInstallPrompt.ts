"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------- Types ----------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptHook {
  /** Whether the install prompt can be triggered */
  canInstall: boolean;
  /** Trigger the native install prompt */
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
}

// ---------- Helpers ----------

function getIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// ---------- Hook ----------

export function useInstallPrompt(): InstallPromptHook {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const installed = getIsInstalled();
    setIsInstalled(installed);
    if (installed) return;

    // Listen for the browser's install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    // Detect display-mode change (iOS / manual add to homescreen)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", handleDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | null
  > => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return null;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === "accepted") {
        setCanInstall(false);
        setIsInstalled(true);
      }

      deferredPromptRef.current = null;
      return outcome;
    } catch (error) {
      console.error("[Install] Echec du prompt :", error);
      return null;
    }
  }, []);

  return {
    canInstall,
    promptInstall,
    isInstalled,
  };
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type DarkMode = "auto" | "light" | "dark";

interface DarkModeContextType {
  mode: DarkMode;
  isDark: boolean;
  setMode: (mode: DarkMode) => void;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  mode: "auto",
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

/**
 * `auto` mode respects the user's OS / browser preference instead of
 * flipping on the clock. Nighttime auto-dark was too aggressive and
 * exposed unfixed dark-mode styling bugs (QA UI audit 2026-04-19).
 */
function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DarkMode>("auto");
  const [isDark, setIsDark] = useState(false);

  const applyDark = useCallback((dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const setMode = useCallback(
    (newMode: DarkMode) => {
      setModeState(newMode);
      localStorage.setItem("cesoir_theme", newMode);
      if (newMode === "auto") {
        applyDark(prefersDark());
      } else {
        applyDark(newMode === "dark");
      }
    },
    [applyDark],
  );

  const toggle = useCallback(() => {
    if (mode === "auto") {
      setMode(isDark ? "light" : "dark");
    } else if (mode === "dark") {
      setMode("light");
    } else {
      setMode("dark");
    }
  }, [mode, isDark, setMode]);

  useEffect(() => {
    const stored = localStorage.getItem("cesoir_theme") as DarkMode | null;
    const initial = stored || "auto";
    setModeState(initial);
    if (initial === "auto") {
      applyDark(prefersDark());
    } else {
      applyDark(initial === "dark");
    }

    // Re-check every minute when in auto mode
    const interval = setInterval(() => {
      if ((localStorage.getItem("cesoir_theme") || "auto") === "auto") {
        applyDark(prefersDark());
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [applyDark]);

  return (
    <DarkModeContext.Provider value={{ mode, isDark, setMode, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function DarkModeToggle() {
  const { isDark, toggle, mode } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className="tap-target flex items-center justify-center rounded-full p-2 transition-colors hover:bg-bg-card"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={
        mode === "auto"
          ? "Mode auto (selon l'heure)"
          : isDark
            ? "Mode sombre"
            : "Mode clair"
      }
    >
      {isDark ? (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          focusable="false"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {mode === "auto" && (
        <span className="ml-1 text-[8px] font-semibold uppercase text-text-muted">
          Auto
        </span>
      )}
    </button>
  );
}

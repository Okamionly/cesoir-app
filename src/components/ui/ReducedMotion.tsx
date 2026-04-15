"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

// ── Types ─────────────────────────────────────

export type FontSize = "normal" | "large" | "xlarge";

interface AccessibilityState {
  /** true when the OS prefers-reduced-motion is on OR the user toggled it */
  reducedMotion: boolean;
  /** manual override — `null` means "follow OS" */
  reducedMotionOverride: boolean | null;
  /** high contrast (reserved for future use) */
  highContrast: boolean;
  /** body text scale */
  fontSize: FontSize;
  setReducedMotionOverride: (v: boolean | null) => void;
  setHighContrast: (v: boolean) => void;
  setFontSize: (v: FontSize) => void;
}

const STORAGE_KEY = "cesoir_a11y";

const defaultState: AccessibilityState = {
  reducedMotion: false,
  reducedMotionOverride: null,
  highContrast: false,
  fontSize: "normal",
  setReducedMotionOverride: () => {},
  setHighContrast: () => {},
  setFontSize: () => {},
};

const AccessibilityContext = createContext<AccessibilityState>(defaultState);

// ── CSS class map ─────────────────────────────

const FONT_SIZE_CLASS: Record<FontSize, string> = {
  normal: "cesoir-font-normal",
  large: "cesoir-font-large",
  xlarge: "cesoir-font-xlarge",
};

// ── Provider ──────────────────────────────────

interface Props {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: Props) {
  const osReducedMotion = useReducedMotion() ?? false;

  const [reducedMotionOverride, setReducedMotionOverrideRaw] = useState<boolean | null>(null);
  const [highContrast, setHighContrastRaw] = useState(false);
  const [fontSize, setFontSizeRaw] = useState<FontSize>("normal");
  const [mounted, setMounted] = useState(false);

  // Load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.reducedMotionOverride !== undefined)
          setReducedMotionOverrideRaw(parsed.reducedMotionOverride);
        if (parsed.highContrast !== undefined)
          setHighContrastRaw(parsed.highContrast);
        if (parsed.fontSize !== undefined)
          setFontSizeRaw(parsed.fontSize);
      }
    } catch {
      // localStorage unavailable
    }
    setMounted(true);
  }, []);

  // Persist on change
  const persist = useCallback(
    (override: boolean | null, hc: boolean, fs: FontSize) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ reducedMotionOverride: override, highContrast: hc, fontSize: fs }),
        );
      } catch {
        // localStorage unavailable
      }
    },
    [],
  );

  const setReducedMotionOverride = useCallback(
    (v: boolean | null) => {
      setReducedMotionOverrideRaw(v);
      persist(v, highContrast, fontSize);
    },
    [highContrast, fontSize, persist],
  );

  const setHighContrast = useCallback(
    (v: boolean) => {
      setHighContrastRaw(v);
      persist(reducedMotionOverride, v, fontSize);
    },
    [reducedMotionOverride, fontSize, persist],
  );

  const setFontSize = useCallback(
    (v: FontSize) => {
      setFontSizeRaw(v);
      persist(reducedMotionOverride, highContrast, v);
    },
    [reducedMotionOverride, highContrast, persist],
  );

  // Effective reduced motion: override wins, otherwise OS
  const reducedMotion =
    reducedMotionOverride !== null ? reducedMotionOverride : osReducedMotion;

  // Apply body CSS classes
  useEffect(() => {
    if (!mounted) return;
    const body = document.body;

    // Font size classes
    Object.values(FONT_SIZE_CLASS).forEach((cls) => body.classList.remove(cls));
    body.classList.add(FONT_SIZE_CLASS[fontSize]);

    // Reduced motion class
    if (reducedMotion) {
      body.classList.add("cesoir-reduced-motion");
    } else {
      body.classList.remove("cesoir-reduced-motion");
    }

    // High contrast class
    if (highContrast) {
      body.classList.add("cesoir-high-contrast");
    } else {
      body.classList.remove("cesoir-high-contrast");
    }
  }, [mounted, fontSize, reducedMotion, highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        reducedMotionOverride,
        highContrast,
        fontSize,
        setReducedMotionOverride,
        setHighContrast,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

"use client";

import { useAnimationControls, m, AnimatePresence } from "motion/react";
import { useEffect, type ReactNode, type MouseEventHandler } from "react";
import { springs, micro } from "@/lib/motion-design";
import { landing } from "@/lib/design-tokens";
import { Magnetic } from "@/components/motion/Magnetic";

export interface FormSubmitProps {
  children: ReactNode;
  /** Shows spinner + disables button. */
  isLoading?: boolean;
  /** Triggers a success pop animation when flipping `false → true`. */
  isSuccess?: boolean;
  /** Triggers a shake when flipping `false → true`. */
  hasError?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  /** Label replacement while loading. Default "Chargement...". */
  loadingLabel?: string;
  /** Dark (landing/auth) vs light (app) surfaces. Default "light". */
  variant?: "dark" | "light";
  /** Full-width by default — set false for inline buttons. */
  fullWidth?: boolean;
  /** Disable the magnetic cursor attraction. Default enabled. */
  magnetic?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  "aria-label"?: string;
}

/**
 * FormSubmit — the canonical CTA for every form.
 *
 * Handles idle / loading / success / error states with built-in motion:
 *   - idle     → gradient-bg, lift on hover, magnetic pointer attraction
 *   - loading  → spinner + disabled, label replaced
 *   - success  → bounce pop (via micro.successPop)
 *   - error    → horizontal shake
 *
 * Accessibility:
 *   - `aria-busy={isLoading}`
 *   - `aria-live="polite"` on status text inside
 *   - min 44px tap target enforced
 */
export function FormSubmit({
  children,
  isLoading = false,
  isSuccess = false,
  hasError = false,
  disabled = false,
  type = "submit",
  loadingLabel = "Chargement...",
  variant = "light",
  fullWidth = true,
  magnetic = true,
  onClick,
  className = "",
  ...rest
}: FormSubmitProps) {
  const controls = useAnimationControls();

  // Success pop
  useEffect(() => {
    if (isSuccess) controls.start(micro.successPop);
  }, [isSuccess, controls]);

  // Error shake
  useEffect(() => {
    if (hasError) {
      controls.start({
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [hasError, controls]);

  const isDark = variant === "dark";
  const button = (
    <m.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      animate={controls}
      aria-busy={isLoading || undefined}
      aria-label={rest["aria-label"]}
      whileHover={
        disabled || isLoading
          ? undefined
          : {
              y: -2,
              boxShadow: isDark
                ? "0 14px 60px rgba(0,255,136,0.35)"
                : "0 12px 32px color-mix(in srgb, var(--color-accent) 45%, transparent), 0 0 24px color-mix(in srgb, var(--color-accent-2) 18%, transparent)",
              transition: springs.gentle,
            }
      }
      whileTap={{ scale: 0.97, transition: springs.micro }}
      transition={springs.snap}
      className={`${fullWidth ? "w-full" : ""} font-semibold py-3.5 rounded-full text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed tap-target min-h-[44px] transition-shadow ${
        isDark ? "" : "gradient-bg"
      } ${className}`}
      style={
        isDark
          ? { background: landing.gradient, boxShadow: landing.shadow }
          : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <m.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-2"
            aria-live="polite"
          >
            <m.span
              className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
            {loadingLabel}
          </m.span>
        ) : isSuccess ? (
          <m.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2"
            aria-live="polite"
          >
            <span aria-hidden>✓</span>
            {children}
          </m.span>
        ) : (
          <m.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );

  if (!magnetic) return button;
  return (
    <Magnetic as="div" strength={0.1} radius={140}>
      {button}
    </Magnetic>
  );
}

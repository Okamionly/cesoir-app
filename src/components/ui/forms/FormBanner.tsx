"use client";

import { m, AnimatePresence } from "motion/react";
import { type ReactNode } from "react";
import { springs } from "@/lib/motion-design";

export interface FormBannerProps {
  /** When null/empty/undefined — renders nothing. */
  children?: ReactNode | null;
  /** Visual tone. Default "error". */
  tone?: "error" | "success" | "info";
  /** Dark landing surfaces vs light app surfaces. Default "light". */
  variant?: "dark" | "light";
  className?: string;
}

/**
 * FormBanner — compact alert strip for form-level messages (wrong credentials,
 * rate-limited, network failure…). Use FormField's inline error for per-field
 * errors; use this for summary errors above the form.
 */
export function FormBanner({
  children,
  tone = "error",
  variant = "light",
  className = "",
}: FormBannerProps) {
  const isDark = variant === "dark";

  const palettes = {
    error: isDark
      ? {
          background: "rgba(239,68,68,0.08)",
          borderColor: "rgba(239,68,68,0.25)",
          color: "#FCA5A5",
        }
      : {
          background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-danger) 30%, transparent)",
          color: "var(--color-danger)",
        },
    success: isDark
      ? {
          background: "rgba(34,197,94,0.08)",
          borderColor: "rgba(34,197,94,0.25)",
          color: "#86EFAC",
        }
      : {
          background: "color-mix(in srgb, var(--color-safe) 10%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-safe) 30%, transparent)",
          color: "var(--color-safe)",
        },
    info: isDark
      ? {
          background: "rgba(139,92,246,0.08)",
          borderColor: "rgba(139,92,246,0.3)",
          color: "#C4B5FD",
        }
      : {
          background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
          color: "var(--color-accent)",
        },
  };

  return (
    <AnimatePresence>
      {children && (
        <m.div
          role={tone === "error" ? "alert" : "status"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={springs.snap}
          className={`border text-[13px] px-4 py-3 rounded-xl ${className}`}
          style={palettes[tone]}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

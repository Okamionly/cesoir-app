"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  variant?: "dark" | "light";
}

/**
 * FormTextarea — the only <textarea> styling allowed in the app.
 * Same tokens as <FormInput/>, with `resize-none` + comfy vertical padding.
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ error, variant = "light", className = "", style, rows = 4, ...props }, ref) {
    const isDark = variant === "dark";
    const base =
      "w-full rounded-xl px-4 py-3 text-sm font-medium resize-none outline-none transition-colors focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const lightStyles = error
      ? "bg-bg border border-danger text-text placeholder:text-text-muted focus:ring-danger/30"
      : "bg-bg border border-border text-text placeholder:text-text-muted focus:border-accent/50 focus:ring-accent/20";

    const darkStyles = error
      ? "text-white placeholder:text-white/30"
      : "text-white placeholder:text-white/30 focus:ring-white/20";

    const darkInlineStyle = isDark
      ? {
          background: "rgba(255,255,255,0.04)",
          border: error
            ? "1px solid rgba(239,68,68,0.55)"
            : "1px solid rgba(255,255,255,0.1)",
        }
      : undefined;

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${base} ${isDark ? darkStyles : lightStyles} ${className}`}
        style={{ ...darkInlineStyle, ...style }}
        {...props}
      />
    );
  },
);

FormTextarea.displayName = "FormTextarea";

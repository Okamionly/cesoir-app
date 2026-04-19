"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visual size. Default "md". 44px+ tap target on all sizes. */
  size?: "sm" | "md" | "lg";
  /** Forces error styling (red border + ring). Usually auto-wired by <FormField/>. */
  error?: boolean;
  /** Dark landing surface vs light app surface. Default "light". */
  variant?: "dark" | "light";
}

const sizeMap = {
  sm: "px-3 py-2.5 text-[13px] min-h-[40px]",
  md: "px-4 py-3 text-sm min-h-[44px]",
  lg: "px-4 py-3.5 text-sm min-h-[48px]",
};

/**
 * FormInput — the only <input> styling allowed in the app.
 *
 * Handles focus ring, error state, and dark/light variants while preserving
 * every native input prop (value, onChange, autoComplete, type, min, max...).
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { size = "md", error, variant = "light", className = "", style, ...props },
  ref,
) {
  const isDark = variant === "dark";
  const base = `w-full rounded-xl font-medium outline-none transition-colors focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed ${sizeMap[size]}`;

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
    <input
      ref={ref}
      className={`${base} ${isDark ? darkStyles : lightStyles} ${className}`}
      style={{ ...darkInlineStyle, ...style }}
      {...props}
    />
  );
});

FormInput.displayName = "FormInput";

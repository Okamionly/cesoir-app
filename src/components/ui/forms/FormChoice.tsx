"use client";

import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { landing } from "@/lib/design-tokens";

export interface FormChoiceOption<V extends string = string> {
  value: V;
  label: string;
}

export interface FormChoiceProps<V extends string = string> {
  /** Fieldset label shown as <legend>. */
  legend: string;
  options: readonly FormChoiceOption<V>[];
  /** Current value ([] for multi). */
  value: V | V[] | "";
  onChange: (value: V) => void;
  /** Allow multiple selection. When true, `value` must be `V[]`. */
  multi?: boolean;
  /** Dark (landing) vs light (app) surfaces. Default "light". */
  variant?: "dark" | "light";
  /** Grid columns — defaults to number of options (max 3). */
  columns?: 2 | 3 | 4;
  /** Optional error string — turns legend red + shows alert. */
  error?: string | null;
  name?: string;
  className?: string;
}

/**
 * FormChoice — radiogroup / checkboxgroup styled as pill buttons.
 *
 * Used for mutually exclusive answers (gender, looking_for, mode) or multi
 * toggles. Replaces the inline `aria-pressed` buttons that register and
 * profile/edit were each reinventing.
 */
export function FormChoice<V extends string = string>({
  legend,
  options,
  value,
  onChange,
  multi = false,
  variant = "light",
  columns,
  error,
  name,
  className,
}: FormChoiceProps<V>) {
  const isDark = variant === "dark";
  const cols = columns ?? Math.min(options.length, 3);
  const gridClass =
    cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-4" : "grid-cols-3";

  const values: V[] = Array.isArray(value) ? value : value ? [value] : [];
  const role = multi ? "group" : "radiogroup";

  return (
    <fieldset className={className} aria-describedby={error ? `${name ?? legend}-err` : undefined}>
      <legend
        className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${
          isDark ? "text-white/50" : "text-text-muted"
        }`}
        style={error ? { color: "var(--color-danger)" } : undefined}
      >
        {legend}
      </legend>
      <div className={`grid ${gridClass} gap-2`} role={role}>
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <m.button
              key={opt.value}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={selected}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.94 }}
              transition={springs.micro}
              className={
                isDark
                  ? "py-3 rounded-xl text-sm font-medium transition-all tap-target min-h-[44px]"
                  : `py-3 rounded-xl text-sm font-medium border transition-all tap-target min-h-[44px] ${
                      selected
                        ? "border-accent gradient-bg text-white shadow-glow"
                        : "border-border text-text-muted hover:border-accent/30"
                    }`
              }
              style={
                isDark
                  ? selected
                    ? {
                        background: landing.gradient,
                        color: "#FFFFFF",
                        border: "1px solid transparent",
                        boxShadow: "0 0 24px rgba(139,92,246,0.35)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }
                  : undefined
              }
            >
              {opt.label}
            </m.button>
          );
        })}
      </div>
      {error && (
        <p
          id={`${name ?? legend}-err`}
          role="alert"
          className="text-[12px] mt-1.5 font-medium"
          style={{ color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

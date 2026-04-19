"use client";

import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

/**
 * FormField — label + hint + children (input/textarea/select) + error.
 *
 * Automatically wires `id`, `aria-invalid`, `aria-describedby` between the
 * label, the hint, and the error message so you don't have to. Accepts a
 * single form control child (input / textarea / select); extra children are
 * rendered untouched (counter text, file upload, etc.).
 *
 * Visual variants:
 *   - `variant="dark"`  — dark landing surfaces (login/register)
 *   - `variant="light"` — app surfaces (profile/edit)
 */
export interface FormFieldProps {
  label: string;
  /** Optional short description shown under the label. */
  hint?: string;
  /** Error string — when present: field turns red, error <p role="alert"> renders. */
  error?: string | null;
  /** Appends a red " *" to the label and sets `required` on the control. */
  required?: boolean;
  /** Dark surfaces (landing/auth) vs light app surfaces. Default "light". */
  variant?: "dark" | "light";
  /** Override the auto-generated id. Useful when hooking into external libs. */
  id?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  required,
  variant = "light",
  id,
  className,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const isDark = variant === "dark";

  // Wire a11y props into the single form control child (input / textarea / select).
  const wiredChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<Record<string, unknown>>;
    const tag = (el.type as unknown as { displayName?: string; name?: string })?.displayName
      ?? (typeof el.type === "string" ? el.type : (el.type as unknown as { name?: string })?.name);

    const isControl =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "FormInput" ||
      tag === "FormTextarea" ||
      tag === "FormSelect";

    if (!isControl) return child;

    return cloneElement(el, {
      id: (el.props?.id as string) ?? fieldId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
      "aria-required": required || undefined,
      required: required ?? (el.props?.required as boolean | undefined),
    });
  });

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${
          isDark ? "text-white/50" : "text-text-muted"
        }`}
      >
        {label}
        {required && (
          <span
            className="ml-1"
            style={{ color: "var(--color-danger)" }}
            aria-hidden
          >
            *
          </span>
        )}
      </label>

      {hint && (
        <p
          id={hintId}
          className={`text-[11px] mb-1.5 leading-relaxed ${
            isDark ? "text-white/40" : "text-text-soft"
          }`}
        >
          {hint}
        </p>
      )}

      {wiredChildren}

      <AnimatePresence>
        {error && (
          <m.p
            key="err"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={springs.snap}
            className="text-[12px] mt-1.5 font-medium"
            style={{ color: "var(--color-danger)" }}
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}

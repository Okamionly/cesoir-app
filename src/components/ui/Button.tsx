"use client";

/**
 * Button — unified primitive (2026-04-23 design-audit)
 *
 * Replaces 400+ ad-hoc button strings scattered across landing/chat/onboarding/profile.
 *
 * Variants
 *   - primary       violet→vert gradient, white ink, shadow glow (CTA)
 *   - secondary     bg-bg-card, text-text, 1px border (default action)
 *   - ghost         transparent, text-text, hover bg-bg-card (subtle)
 *   - destructive   bg-danger, white ink (delete / leave)
 *   - outline       transparent, 1px border-accent, text-accent (bordered CTA)
 *
 * Sizes (respect 44px tap-target on md+)
 *   - sm   32px tall / text-xs   (inline actions, chips)
 *   - md   44px tall / text-sm   (default — hits tap-target AA)
 *   - lg   52px tall / text-base (hero CTAs)
 *
 * Accessibility
 *   - Focus-visible ring uses --color-accent (inherited from globals.css *:focus-visible)
 *   - disabled state disables pointer events + opacity-50
 *   - loading state sets aria-busy + disables click + shows spinner
 *   - icon-only buttons must receive `aria-label` (TS @deprecated warning else)
 *
 * Haptics compatibility
 *   - Pass `onClick={(e) => { haptic.tap(); onClick?.(e); }}` at call site.
 *     We intentionally don't couple Button to haptics-store to keep it a dumb primitive.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { app } from "@/lib/design-tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Visual style — maps to design tokens. */
  variant?: ButtonVariant;
  /** Height tier — sm (32) / md (44) / lg (52). */
  size?: ButtonSize;
  /** Optional Lucide icon component. */
  icon?: LucideIcon;
  /** Icon placement vs. label. Default "left". */
  iconPosition?: "left" | "right";
  /** Show spinner, set aria-busy, block clicks. */
  loading?: boolean;
  /** Full-width block button. */
  block?: boolean;
  /** Button label — can be empty for icon-only (pass `aria-label` then). */
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-tight " +
  "transition-all duration-150 active:scale-[0.97] " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none";

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg min-w-8",
  md: "h-11 px-5 text-sm rounded-xl min-w-11",
  lg: "h-[52px] px-7 text-base rounded-2xl min-w-[52px]",
};

const variantClass: Record<ButtonVariant, string> = {
  // Primary uses inline style for gradient — see render block below.
  primary: "text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_8px_26px_rgba(139,92,246,0.5)]",
  secondary:
    "bg-bg-card text-text border border-border hover:border-text/20 hover:bg-bg-card/80",
  ghost:
    "bg-transparent text-text hover:bg-bg-card",
  destructive:
    "bg-danger text-white hover:bg-danger/90",
  outline:
    "bg-transparent text-accent border border-accent/40 hover:bg-accent/5 hover:border-accent",
};

const Spinner = ({ size }: { size: ButtonSize }) => {
  const px = size === "sm" ? 12 : size === "md" ? 14 : 18;
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: px, height: px }}
      aria-hidden
    />
  );
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    icon: Icon,
    iconPosition = "left",
    loading = false,
    block = false,
    className = "",
    disabled,
    children,
    style,
    type = "button",
    ...rest
  },
  ref
) {
  const primaryStyle =
    variant === "primary"
      ? { background: app.gradient, ...style }
      : style;

  const iconSize = size === "sm" ? 14 : size === "md" ? 16 : 20;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        base,
        sizeClass[size],
        variantClass[variant],
        block ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={primaryStyle}
      {...rest}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        Icon && iconPosition === "left" && (
          <Icon size={iconSize} strokeWidth={2.25} aria-hidden />
        )
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon size={iconSize} strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
});

export default Button;

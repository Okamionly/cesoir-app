"use client";

import Link from "next/link";
import type { Route } from "next";
import { m, useReducedMotion, type Transition, type TargetAndTransition } from "motion/react";
import { springs, easings } from "@/lib/motion-design";
import { RackFocus } from "@/components/motion/RackFocus";
import { Magnetic } from "@/components/motion/Magnetic";
import { ChevronLeft, X } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type IconAnimation =
  | "pulse"
  | "rotate"
  | "float"
  | "glow"
  | "glow-green"
  | "glow-violet"
  | "none";

export type HairlineVariant =
  | "default"
  | "gold-violet"
  | "pink-violet"
  | "red-glow"
  | "vert-violet"
  | "green-violet";

export type HeaderTone = "default" | "white";

export type BackIconVariant = "chevron" | "close";

export interface PageHeaderProps {
  /** Page title (string or node for custom formatting) */
  title?: React.ReactNode;
  /** Extra class applied to the <h1> (useful for gradient-text, color tweaks) */
  titleClassName?: string;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /** Back link href. Renders a chevron-left button when provided. */
  backHref?: string;
  /** Back button callback (alternative to `backHref` — use for router.back() flows) */
  onBack?: () => void;
  /** Aria-label for the back button */
  backLabel?: string;
  /** Legacy right-action slot (deprecated — prefer `actions`) */
  rightAction?: React.ReactNode;
  /** Right-side slot for buttons/chips/etc. */
  actions?: React.ReactNode;
  /** Custom icon/glyph to render before the title */
  icon?: React.ReactNode;
  /** Preset animation applied to the icon wrapper */
  iconAnimation?: IconAnimation;
  /** Bottom hairline gradient style */
  hairlineVariant?: HairlineVariant;
  /** Whether the header is sticky (default true) */
  sticky?: boolean;
  /** Extra class applied to the outer <header> */
  className?: string;
  /** Wrap title in <RackFocus> for cinematic reveal */
  rackFocus?: boolean;

  // ─────────────────────────────────────────
  // Advanced props (C2 extension)
  // ─────────────────────────────────────────

  /** Content slot rendered below title + above hairline, inside sticky viewport. */
  slotBelowTitle?: React.ReactNode;
  /** Alternative color scheme. "white" swaps bg-bg to bg-white and adjusts borders. */
  tone?: HeaderTone;
  /** Back button icon variant. "chevron" = "<" (default), "close" = "X" for modal-like pages. */
  backIconVariant?: BackIconVariant;
  /** Wrap back button with Magnetic pull-to-cursor (only on fine pointer + no reduced-motion). */
  magneticBack?: boolean;
  /** Render a custom left slot (replaces icon+back). Advanced use — e.g. avatar in chat/[id]. */
  leftSlot?: React.ReactNode;
  /** Disable title rendering (useful if leftSlot + rightSlot cover everything). */
  hideTitle?: boolean;
  /** No bottom padding/border — for pages wanting full-bleed content immediately. */
  borderless?: boolean;

  // ─────────────────────────────────────────
  // Advanced props (D3 extension)
  // ─────────────────────────────────────────

  /**
   * Slot rendered SOUS le hairline gradient, still inside the sticky area.
   * Use for secondary rows like mode-count chips, horizontal filters, etc.
   * Distinct from `slotBelowTitle` which renders ABOVE the hairline.
   */
  bottomSlot?: React.ReactNode;
  /**
   * Replace the ENTIRE title area content (keeps icon + back visible).
   * Use when the title region needs multi-line custom layout (badge row,
   * mode pill + timer, etc.) that `title`/`subtitle` can't express.
   * When provided, `title`, `subtitle`, `titleClassName`, `rackFocus`,
   * and `hideTitle` are ignored for the title area.
   */
  titleSlot?: React.ReactNode;
  /**
   * Escape hatch render-prop: fully replace the header chrome while
   * preserving the outer <header> shell (sticky/tone/hairline/borderless).
   * Receives a `defaults` object with the standard layout nodes so callers
   * can opt-in to reusing pieces.
   *
   * Usage: only reach for this when leftSlot/bottomSlot/titleSlot can't
   * express the layout (e.g. live-room with pulsing indicators + multi-row
   * controls). Most pages should use the declarative props instead.
   */
  onHeader?: (defaults: PageHeaderRenderDefaults) => React.ReactNode;
}

/**
 * Default nodes passed to `onHeader` render-prop so callers can compose
 * pieces of the standard chrome (back button, title, actions) without
 * rebuilding them from scratch.
 */
export interface PageHeaderRenderDefaults {
  backButton: React.ReactNode | null;
  titleNode: React.ReactNode;
  actions: React.ReactNode;
  icon: React.ReactNode;
}

// ─────────────────────────────────────────
// Icon animation presets
// ─────────────────────────────────────────

interface IconMotion {
  animate?: TargetAndTransition;
  transition?: Transition;
}

function getIconMotion(kind: IconAnimation): IconMotion {
  switch (kind) {
    case "pulse":
      return {
        animate: { opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      };
    case "rotate":
      return {
        animate: { rotate: [0, 8, 0, -8, 0], scale: [1, 1.05, 1] },
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      };
    case "float":
      return {
        animate: { y: [0, -3, 0, 2, 0], rotate: [0, 4, -3, 0] },
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      };
    case "glow":
    case "glow-violet":
      return {
        animate: {
          filter: [
            "drop-shadow(0 0 0px rgba(139,92,246,0))",
            "drop-shadow(0 0 8px rgba(139,92,246,0.7))",
            "drop-shadow(0 0 0px rgba(139,92,246,0))",
          ],
        },
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      };
    case "glow-green":
      return {
        animate: {
          filter: [
            "drop-shadow(0 0 0px rgba(34,197,94,0))",
            "drop-shadow(0 0 8px rgba(34,197,94,0.7))",
            "drop-shadow(0 0 0px rgba(34,197,94,0))",
          ],
        },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      };
    case "none":
    default:
      return {};
  }
}

// ─────────────────────────────────────────
// Hairline gradient presets
// ─────────────────────────────────────────

function getHairlineGradient(variant: HairlineVariant): string | null {
  switch (variant) {
    case "gold-violet":
      return "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), rgba(139,92,246,0.4), transparent)";
    case "pink-violet":
      return "linear-gradient(90deg, transparent, rgba(236,72,153,0.4), rgba(139,92,246,0.4), transparent)";
    case "red-glow":
      return "linear-gradient(90deg, transparent, rgba(239,68,68,0.45), rgba(220,38,38,0.55), rgba(239,68,68,0.45), transparent)";
    case "vert-violet":
      return "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(0,255,136,0.4), transparent)";
    case "green-violet":
      return "linear-gradient(90deg, transparent, rgba(34,197,94,0.4), rgba(139,92,246,0.3), transparent)";
    case "default":
    default:
      return null;
  }
}

// ─────────────────────────────────────────
// Back button
// ─────────────────────────────────────────

const chevronIcon = <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />;

const closeIcon = <X size={18} strokeWidth={2} aria-hidden="true" />;

function BackButton({
  href,
  onBack,
  label = "Retour",
  variant = "chevron",
  tone = "default",
  magnetic = false,
}: {
  href?: string;
  onBack?: () => void;
  label?: string;
  variant?: BackIconVariant;
  tone?: HeaderTone;
  magnetic?: boolean;
}) {
  const cls =
    tone === "white"
      ? "flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors"
      : "flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border text-text-muted hover:text-text transition-colors";
  const iconNode = variant === "close" ? closeIcon : chevronIcon;

  let node: React.ReactNode;
  if (href) {
    node = (
      <m.div whileTap={{ scale: 0.9 }} transition={springs.micro}>
        <Link href={href as Route} className={cls} aria-label={label}>
          {iconNode}
        </Link>
      </m.div>
    );
  } else {
    node = (
      <m.button
        type="button"
        onClick={onBack}
        whileTap={{ scale: 0.9 }}
        transition={springs.micro}
        className={cls}
        aria-label={label}
      >
        {iconNode}
      </m.button>
    );
  }

  if (magnetic) {
    return (
      <Magnetic strength={0.18} radius={70}>
        {node}
      </Magnetic>
    );
  }
  return <>{node}</>;
}

// ─────────────────────────────────────────
// Skeleton (loading state)
// ─────────────────────────────────────────

function PageHeaderSkeleton({ sticky = true }: { sticky?: boolean }) {
  const pos = sticky ? "sticky top-0 z-30" : "relative";
  return (
    <header
      className={`${pos} bg-bg/80 backdrop-blur-xl border-b border-border`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-5 w-28 rounded-md bg-border/40 animate-pulse" />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

function PageHeader({
  title,
  titleClassName,
  subtitle,
  backHref,
  onBack,
  backLabel,
  rightAction,
  actions,
  icon,
  iconAnimation = "none",
  hairlineVariant = "default",
  sticky = true,
  className,
  rackFocus = false,
  slotBelowTitle,
  tone = "default",
  backIconVariant = "chevron",
  magneticBack = false,
  leftSlot,
  hideTitle = false,
  borderless = false,
  bottomSlot,
  titleSlot,
  onHeader,
}: PageHeaderProps) {
  const reducedMotion = useReducedMotion();

  const stickyClass = sticky ? "sticky top-0 z-30" : "relative";
  const hairline = getHairlineGradient(hairlineVariant);
  const rightSlot = actions ?? rightAction;

  const iconMotion = getIconMotion(iconAnimation);
  const shouldAnimateIcon =
    !reducedMotion && iconAnimation !== "none" && icon != null;

  const toneClass =
    tone === "white"
      ? "bg-white/90 border-neutral-200"
      : "bg-bg/80 border-border";
  const borderClass = borderless ? "" : "border-b";

  const titleNode = (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {icon != null && (
        <m.span
          className="inline-flex items-center justify-center shrink-0"
          aria-hidden="true"
          animate={shouldAnimateIcon ? iconMotion.animate : undefined}
          transition={shouldAnimateIcon ? iconMotion.transition : undefined}
        >
          {icon}
        </m.span>
      )}
      <div className="flex-1 min-w-0">
        <h1
          className={[
            "text-lg font-display font-bold truncate",
            tone === "white" ? "text-neutral-900" : "text-text",
            titleClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={[
              "text-xs truncate",
              tone === "white" ? "text-neutral-500" : "text-text-muted",
            ].join(" ")}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  const showTitle = !hideTitle && (titleSlot != null || title != null);

  // Renderable slots passed to `onHeader` render-prop.
  const backButtonNode =
    (backHref || onBack) ? (
      <BackButton
        href={backHref}
        onBack={onBack}
        label={backLabel}
        variant={backIconVariant}
        tone={tone}
        magnetic={magneticBack}
      />
    ) : null;

  const renderedTitleArea: React.ReactNode = titleSlot != null ? (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {icon != null && (
        <m.span
          className="inline-flex items-center justify-center shrink-0"
          aria-hidden="true"
          animate={shouldAnimateIcon ? iconMotion.animate : undefined}
          transition={shouldAnimateIcon ? iconMotion.transition : undefined}
        >
          {icon}
        </m.span>
      )}
      <div className="flex-1 min-w-0">{titleSlot}</div>
    </div>
  ) : titleNode;

  // Compose the default topbar row so render-prop callers can reuse it.
  const defaultTopRow = (
    <div className="flex items-center gap-3 px-4 py-3">
      {leftSlot != null ? (
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {backButtonNode}
          <div className="flex-1 min-w-0">{leftSlot}</div>
        </div>
      ) : (
        <>
          {backButtonNode}
          {showTitle && (rackFocus && titleSlot == null ? <RackFocus duration={0.5}>{renderedTitleArea}</RackFocus> : renderedTitleArea)}
        </>
      )}
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );

  const headerClassName = [
    stickyClass,
    "relative backdrop-blur-xl",
    toneClass,
    borderClass,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // Render-prop escape hatch: gives callers full control over inner chrome
  // while preserving the <header> shell + hairline semantics.
  if (onHeader) {
    const defaults: PageHeaderRenderDefaults = {
      backButton: backButtonNode,
      titleNode: renderedTitleArea,
      actions: rightSlot ?? null,
      icon: icon ?? null,
    };
    return (
      <header className={headerClassName}>
        <m.div
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easings.out }}
        >
          {onHeader(defaults)}
        </m.div>
        {hairline && !reducedMotion && !borderless && (
          <m.div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: hairline }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </header>
    );
  }

  return (
    <header className={headerClassName}>
      <m.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easings.out }}
      >
        {defaultTopRow}
      </m.div>

      {slotBelowTitle && <div className="px-4 pb-3">{slotBelowTitle}</div>}

      {/* Hairline gradient bottom */}
      {hairline && !reducedMotion && !borderless && (
        <m.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: hairline }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Secondary row below the hairline (still inside sticky area). */}
      {bottomSlot && <div className="px-4 pb-2">{bottomSlot}</div>}
    </header>
  );
}

// ─────────────────────────────────────────
// Attach static members & export
// ─────────────────────────────────────────

type PageHeaderComponent = typeof PageHeader & {
  Skeleton: typeof PageHeaderSkeleton;
};

(PageHeader as PageHeaderComponent).Skeleton = PageHeaderSkeleton;

export default PageHeader as PageHeaderComponent;
export { PageHeaderSkeleton };

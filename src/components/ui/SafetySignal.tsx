"use client";

/**
 * SafetySignal — unified trust/safety chip (2026-04-23 design-audit)
 *
 * Replaces 12+ ad-hoc "Vérifié / En attente / Signalé" chips scattered across
 * SwipeCard / TrustBadge / KarmaBadge / VerificationChecklist / ReportSheet.
 *
 * Status → visual mapping (consumes CSS vars from globals.css)
 *   verified   vert fluo #00FF88  — "Profil vérifié"
 *   pending    warn #F59E0B       — "Vérification en cours"
 *   flagged    danger #EF4444     — "Profil signalé"
 *   blocked    neutral dark       — "Utilisateur bloqué"
 *   neutral    grey #888888       — "Non vérifié"
 *
 * Sizes follow button tiers so chips align with CTAs.
 */

import type { ReactNode } from "react";
import { ShieldCheck, Clock, AlertTriangle, Ban, Shield } from "lucide-react";

export type SafetyStatus =
  | "verified"
  | "pending"
  | "flagged"
  | "blocked"
  | "neutral";

export type SafetySize = "sm" | "md" | "lg";

export interface SafetySignalProps {
  status: SafetyStatus;
  size?: SafetySize;
  /** Override default FR-FR copy. */
  label?: ReactNode;
  /** Icon-only compact mode (still renders aria-label). */
  iconOnly?: boolean;
  className?: string;
}

interface StatusConfig {
  icon: typeof ShieldCheck;
  tokenBg: string;
  tokenFg: string;
  tokenBorder: string;
  label: string;
  ariaLabel: string;
}

const CONFIG: Record<SafetyStatus, StatusConfig> = {
  verified: {
    icon: ShieldCheck,
    tokenBg: "color-mix(in srgb, var(--color-trust-verified) 12%, transparent)",
    tokenFg: "var(--color-trust-verified)",
    tokenBorder: "color-mix(in srgb, var(--color-trust-verified) 35%, transparent)",
    label: "Vérifié",
    ariaLabel: "Profil vérifié",
  },
  pending: {
    icon: Clock,
    tokenBg: "color-mix(in srgb, var(--color-trust-pending) 12%, transparent)",
    tokenFg: "var(--color-trust-pending)",
    tokenBorder: "color-mix(in srgb, var(--color-trust-pending) 35%, transparent)",
    label: "En cours",
    ariaLabel: "Vérification en cours",
  },
  flagged: {
    icon: AlertTriangle,
    tokenBg: "color-mix(in srgb, var(--color-trust-flagged) 12%, transparent)",
    tokenFg: "var(--color-trust-flagged)",
    tokenBorder: "color-mix(in srgb, var(--color-trust-flagged) 40%, transparent)",
    label: "Signalé",
    ariaLabel: "Profil signalé",
  },
  blocked: {
    icon: Ban,
    tokenBg: "var(--color-bg-dark)",
    tokenFg: "#FFFFFF",
    tokenBorder: "var(--color-bg-dark)",
    label: "Bloqué",
    ariaLabel: "Utilisateur bloqué",
  },
  neutral: {
    icon: Shield,
    tokenBg: "var(--color-bg-card)",
    tokenFg: "var(--color-trust-neutral)",
    tokenBorder: "var(--color-border)",
    label: "Non vérifié",
    ariaLabel: "Profil non vérifié",
  },
};

const sizeClass: Record<SafetySize, string> = {
  sm: "h-5 px-2 text-[11px] gap-1 rounded-full",
  md: "h-7 px-2.5 text-xs gap-1.5 rounded-full",
  lg: "h-9 px-3.5 text-sm gap-2 rounded-full",
};

const iconPx: Record<SafetySize, number> = { sm: 10, md: 12, lg: 14 };

export default function SafetySignal({
  status,
  size = "md",
  label,
  iconOnly = false,
  className = "",
}: SafetySignalProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      role="status"
      aria-label={cfg.ariaLabel}
      className={[
        "inline-flex items-center font-semibold select-none border",
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: cfg.tokenBg,
        color: cfg.tokenFg,
        borderColor: cfg.tokenBorder,
      }}
    >
      <Icon size={iconPx[size]} strokeWidth={2.5} aria-hidden />
      {!iconOnly && <span>{label ?? cfg.label}</span>}
    </span>
  );
}

/**
 * Verification checklist status semantics.
 *
 * Status-tier colors and gradients for VerificationChecklist.
 * Product-semantic (status tier → color) — not UI tokens.
 */

export type VerificationStatus = "verified" | "pending" | "not_started" | "coming_soon";

export interface VerificationStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, VerificationStatusConfig> = {
  verified: {
    label: "Vérifié",
    bg: "rgba(0,255,136,0.1)",
    text: "#00FF88",
    border: "rgba(0,255,136,0.25)",
    icon: "check",
  },
  pending: {
    label: "En cours",
    bg: "rgba(245,158,11,0.1)",
    text: "#F59E0B",
    border: "rgba(245,158,11,0.25)",
    icon: "clock",
  },
  not_started: {
    label: "À faire",
    bg: "rgba(239,68,68,0.1)",
    text: "#EF4444",
    border: "rgba(239,68,68,0.25)",
    icon: "x",
  },
  coming_soon: {
    label: "Bientôt",
    bg: "rgba(100,116,139,0.1)",
    text: "#94A3B8",
    border: "rgba(100,116,139,0.25)",
    icon: "clock",
  },
};

// Progress bar gradients
export const VERIFICATION_PROGRESS_GRADIENT = {
  done: "linear-gradient(90deg, #00FF88, #10B981)",
  inProgress: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
} as const;

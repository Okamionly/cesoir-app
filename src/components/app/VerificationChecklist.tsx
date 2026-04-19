"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { springs } from "@/lib/motion-design";
import { Check, Clock, X, ChevronRight } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type VerificationStatus = "verified" | "pending" | "not_started" | "coming_soon";

interface VerificationMethod {
  id: string;
  icon: string;
  name: string;
  description: string;
  status: VerificationStatus;
  href?: string;
}

interface VerificationChecklistProps {
  /** Whether selfie has been verified */
  selfieVerified?: boolean;
  /** Whether phone has been verified */
  phoneVerified?: boolean;
  /** Whether video liveness has been verified */
  videoVerified?: boolean;
  /** Whether social links have been connected */
  socialLinked?: boolean;
  /** Whether ID has been verified */
  idVerified?: boolean;
}

// ─────────────────────────────────────────
// Status config
// ─────────────────────────────────────────

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  verified: {
    label: "Verifie",
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
    label: "A faire",
    bg: "rgba(239,68,68,0.1)",
    text: "#EF4444",
    border: "rgba(239,68,68,0.25)",
    icon: "x",
  },
  coming_soon: {
    label: "Bientot",
    bg: "rgba(100,116,139,0.1)",
    text: "#94A3B8",
    border: "rgba(100,116,139,0.25)",
    icon: "clock",
  },
};

// ─────────────────────────────────────────
// Status icons (inline SVGs)
// ─────────────────────────────────────────

function StatusIcon({ type }: { type: string }) {
  if (type === "check") {
    return <Check size={14} strokeWidth={2.5} aria-hidden="true" />;
  }
  if (type === "clock") {
    return <Clock size={14} strokeWidth={2} aria-hidden="true" />;
  }
  return <X size={14} strokeWidth={2.5} aria-hidden="true" />;
}

// ─────────────────────────────────────────
// Arrow icon
// ─────────────────────────────────────────

function ArrowRight() {
  return <ChevronRight size={16} strokeWidth={2} className="text-text-muted" aria-hidden="true" />;
}

// ─────────────────────────────────────────
// Row variants
// ─────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springs.heavy, delay: 0.15 + i * 0.08 },
  }),
  tap: { scale: 0.98, transition: springs.snap },
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function VerificationChecklist({
  selfieVerified = false,
  phoneVerified = false,
  videoVerified = false,
  socialLinked = false,
  idVerified = false,
}: VerificationChecklistProps) {
  const methods: VerificationMethod[] = [
    {
      id: "selfie",
      icon: "📸",
      name: "Photo selfie",
      description: "Verification par pose specifique",
      status: selfieVerified ? "verified" : "not_started",
      href: "/profile/verify",
    },
    {
      id: "phone",
      icon: "📱",
      name: "Telephone",
      description: "Code SMS a 6 chiffres",
      status: phoneVerified ? "verified" : "not_started",
      href: "/profile/verify",
    },
    {
      id: "video",
      icon: "🎥",
      name: "Video liveness",
      description: "Detection de visage en direct",
      status: videoVerified ? "verified" : "not_started",
      href: "/profile/verify",
    },
    {
      id: "social",
      icon: "🔗",
      name: "Reseaux sociaux",
      description: "Connecte Instagram ou LinkedIn",
      status: socialLinked ? "verified" : "coming_soon",
    },
    {
      id: "id",
      icon: "🪪",
      name: "Piece d'identite",
      description: "Verification officielle",
      status: idVerified ? "verified" : "coming_soon",
    },
  ];

  const completedCount = methods.filter((m) => m.status === "verified").length;
  const totalVerifiable = methods.filter((m) => m.status !== "coming_soon").length;
  const progressPct = totalVerifiable > 0 ? (completedCount / methods.length) * 100 : 0;
  const allDone = completedCount === methods.length;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-text">
            {completedCount}/{methods.length} verifications
          </span>
          {allDone ? (
            <span className="text-[11px] font-bold text-[#00FF88] uppercase tracking-wider">
              Badge Or obtenu
            </span>
          ) : (
            <span className="text-[11px] font-medium text-text-muted">
              Complete tout pour le badge Or
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: allDone
                ? "linear-gradient(90deg, #00FF88, #10B981)"
                : "linear-gradient(90deg, #3B82F6, #8B5CF6)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ ...springs.cinematic, delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Method rows */}
      <div className="space-y-2">
        {methods.map((method, i) => {
          const config = STATUS_CONFIG[method.status];
          const isActionable = method.href && method.status === "not_started";

          const content = (
            <motion.div
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              whileTap={isActionable ? "tap" : undefined}
              custom={i}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                isActionable
                  ? "bg-card border-border hover:border-accent/30 cursor-pointer"
                  : "bg-card border-border"
              }`}
            >
              {/* Method icon */}
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                {method.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text">
                  {method.name}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {method.description}
                </p>
              </div>

              {/* Status badge */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0"
                style={{
                  backgroundColor: config.bg,
                  color: config.text,
                  border: `1px solid ${config.border}`,
                }}
              >
                <StatusIcon type={config.icon} />
                {config.label}
              </div>

              {/* Arrow for actionable items */}
              {isActionable && <ArrowRight />}
            </motion.div>
          );

          if (isActionable && method.href) {
            return (
              <Link key={method.id} href={method.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={method.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}

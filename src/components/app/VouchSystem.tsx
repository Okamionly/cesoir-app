"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";

// ─── Types ───────────────────────────────────────
interface Voucher {
  id: string;
  name: string;
  photo: string;
  since: string;
}

interface VouchSystemProps {
  /** Vouchers already existing on the profile */
  vouchers?: Voucher[];
  /** Whether the current user can vouch (is a friend) */
  canVouch?: boolean;
  /** Whether viewing own profile */
  isOwnProfile?: boolean;
  /** Trust score bonus from vouches */
  trustBonus?: number;
  /** Callback when vouch button is pressed */
  onVouch?: () => void;
}

// ─── Mock data ───────────────────────────────────
const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: "v1",
    name: "Emma",
    photo: "https://randomuser.me/api/portraits/women/55.jpg",
    since: "Amie depuis 2023",
  },
  {
    id: "v2",
    name: "Lucas",
    photo: "https://randomuser.me/api/portraits/men/62.jpg",
    since: "Collegue",
  },
  {
    id: "v3",
    name: "Chloe",
    photo: "https://randomuser.me/api/portraits/women/71.jpg",
    since: "Amie d'enfance",
  },
];

// ─── Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const avatarVariants = {
  hidden: { opacity: 0, scale: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { ...springs.elastic, delay: i * 0.1 },
  }),
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.elastic,
  },
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.snap,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

const vouchButtonVariants = {
  idle: { scale: 1 },
  pressed: {
    scale: [1, 1.15, 0.95, 1.05, 1],
    transition: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 1] },
  },
};

// ─── Component ───────────────────────────────────
export default function VouchSystem({
  vouchers = DEFAULT_VOUCHERS,
  canVouch = true,
  isOwnProfile = false,
  trustBonus = 15,
  onVouch,
}: VouchSystemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [hasVouched, setHasVouched] = useState(false);
  const [localVouchers, setLocalVouchers] = useState(vouchers);

  const handleVouch = useCallback(() => {
    if (hasVouched) return;
    haptics.success();
    setHasVouched(true);
    setLocalVouchers((prev) => [
      ...prev,
      {
        id: `v-self-${Date.now()}`,
        name: "Toi",
        photo: "https://randomuser.me/api/portraits/men/85.jpg",
        since: "A l'instant",
      },
    ]);
    onVouch?.();
  }, [hasVouched, onVouch]);

  return (
    <motion.div
      className="bg-bg-card border border-border rounded-2xl p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Systeme de garants"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-safe/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text">
              {localVouchers.length} ami{localVouchers.length > 1 ? "s" : ""} se porte{localVouchers.length > 1 ? "nt" : ""} garant{localVouchers.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Trust bonus badge */}
        <motion.div
          className="flex items-center gap-1 bg-safe/8 border border-safe/15 rounded-full px-2.5 py-1"
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-[10px] font-bold text-safe">+{trustBonus}% confiance</span>
        </motion.div>
      </div>

      {/* Avatar row */}
      <button
        type="button"
        onClick={() => {
          haptics.light();
          setShowDetails(!showDetails);
        }}
        className="flex items-center gap-1 mb-3 tap-target"
        aria-expanded={showDetails}
        aria-label="Voir les garants"
      >
        <div className="flex -space-x-2.5">
          {localVouchers.slice(0, 5).map((voucher, i) => (
            <motion.div
              key={voucher.id}
              className="relative"
              variants={avatarVariants}
              custom={i}
              style={{ zIndex: localVouchers.length - i }}
            >
              <img
                src={voucher.photo}
                alt={voucher.name}
                className="w-10 h-10 rounded-full border-2 border-bg object-cover"
              />
              {/* Green checkmark on each */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-safe flex items-center justify-center border border-bg">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          ))}

          {localVouchers.length > 5 && (
            <div className="w-10 h-10 rounded-full bg-border border-2 border-bg flex items-center justify-center">
              <span className="text-[10px] font-bold text-text-muted">+{localVouchers.length - 5}</span>
            </div>
          )}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`text-text-muted ml-1 transition-transform ${showDetails ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="space-y-2 mb-3"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {localVouchers.map((voucher, i) => (
              <motion.div
                key={voucher.id}
                className="flex items-center gap-3 bg-bg border border-border rounded-xl p-2.5"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.snap, delay: i * 0.05 }}
              >
                <img
                  src={voucher.photo}
                  alt={voucher.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text">{voucher.name}</p>
                  <p className="text-[10px] text-text-muted">{voucher.since}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vouch button (for friends viewing, not own profile) */}
      {!isOwnProfile && canVouch && (
        <motion.button
          onClick={handleVouch}
          disabled={hasVouched}
          className={`w-full py-3 rounded-full text-[13px] font-bold tap-target transition-all ${
            hasVouched
              ? "bg-safe/10 text-safe border border-safe/20"
              : "gradient-bg text-white shadow-glow"
          }`}
          variants={vouchButtonVariants}
          animate={hasVouched ? "pressed" : "idle"}
          whileTap={!hasVouched ? micro.tapScale : undefined}
        >
          {hasVouched ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tu te portes garant
            </span>
          ) : (
            "Se porter garant"
          )}
        </motion.button>
      )}

      {/* Own profile info */}
      {isOwnProfile && (
        <div className="bg-accent/5 border border-accent/10 rounded-xl p-3">
          <p className="text-[11px] text-text-muted leading-relaxed">
            Invite tes amis a se porter garants pour augmenter ton score de confiance. Chaque garant ajoute +5% a ton profil.
          </p>
        </div>
      )}
    </motion.div>
  );
}

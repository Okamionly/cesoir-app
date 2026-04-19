"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useReputation } from "@/lib/useReputation";
import { supabase } from "@/lib/supabase";
import TrustGauge from "@/components/app/TrustGauge";
import VerificationChecklist from "@/components/app/VerificationChecklist";
import TrustBadge from "@/components/app/TrustBadge";
import type { DbReport, DbProfile } from "@/lib/supabase-types";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface VerificationState {
  selfie: boolean;
  phone: boolean;
  video: boolean;
  social: boolean;
  id: boolean;
}

interface Voucher {
  id: string;
  name: string;
  avatar_url: string | null;
  since: string;
}

interface SafetyAction {
  id: string;
  type: "checkin" | "sos_test" | "report_made" | "block";
  label: string;
  date: string;
}

// ─────────────────────────────────────────
// Section header
// ─────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.heavy, delay: 0.1 + index * 0.15 }}
      className="flex items-center gap-3 mb-4"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-[15px] font-bold text-text">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-text-muted">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Star display
// ─────────────────────────────────────────

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} etoiles`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "#8B5CF6" : "none"}
            stroke="#8B5CF6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// Icons (inline SVGs)
// ─────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-muted" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─────────────────────────────────────────
// Safety action type config
// ─────────────────────────────────────────

const SAFETY_ACTION_CONFIG: Record<string, { icon: string; color: string }> = {
  checkin: { icon: "📍", color: "#3B82F6" },
  sos_test: { icon: "🆘", color: "#EF4444" },
  report_made: { icon: "🚩", color: "#F59E0B" },
  block: { icon: "🚫", color: "#94A3B8" },
};

// ─────────────────────────────────────────
// Mock data (until backend is wired)
// ─────────────────────────────────────────

const MOCK_VOUCHERS: Voucher[] = [
  { id: "v1", name: "Emma L.", avatar_url: null, since: "Amie depuis 2023" },
  { id: "v2", name: "Lucas M.", avatar_url: null, since: "Collegue" },
  { id: "v3", name: "Chloe R.", avatar_url: null, since: "Amie d'enfance" },
];

const MOCK_SAFETY_ACTIONS: SafetyAction[] = [
  { id: "s1", type: "checkin", label: "Check-in automatique envoye", date: "2026-04-14T20:30:00" },
  { id: "s2", type: "sos_test", label: "Test SOS effectue", date: "2026-04-12T18:00:00" },
  { id: "s3", type: "report_made", label: "Signalement envoye", date: "2026-04-10T22:15:00" },
];

// ─────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────

export default function TrustCenterPage() {
  const { user } = useAuth();
  const { reviews, averageRating, totalReviews, trustScore, loading } = useReputation();
  const [verifications, setVerifications] = useState<VerificationState>({
    selfie: false,
    phone: false,
    video: false,
    social: false,
    id: false,
  });
  const [reportsAgainst, setReportsAgainst] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // ─── Fetch verification + report data ───
  useEffect(() => {
    if (!user?.id) return;

    // Get profile verification status
    supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_verified) {
          setIsVerified(true);
          setVerifications((prev) => ({
            ...prev,
            selfie: true,
            phone: true,
          }));
        }
      });

    // Get reports against the user
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reported_id", user.id)
      .then(({ count }) => {
        setReportsAgainst(count ?? 0);
      });
  }, [user?.id]);

  // ─── Trust breakdown calculation ───
  const verifiedCount = Object.values(verifications).filter(Boolean).length;
  const breakdown = [
    {
      label: "Verification",
      points: Math.round((verifiedCount / 5) * 25),
      maxPoints: 25,
      color: "#3B82F6",
      tip: "Verifie ton profil par selfie, telephone et video",
    },
    {
      label: "Avis",
      points: Math.min(Math.round((averageRating / 5) * 25), 25),
      maxPoints: 25,
      color: "#8B5CF6",
      tip: "Recois des avis positifs apres tes rencontres",
    },
    {
      label: "Activite",
      points: Math.min(totalReviews * 2, 20),
      maxPoints: 20,
      color: "#00FF88",
      tip: "Sois actif regulierement sur l'app",
    },
    {
      label: "Profil",
      points: isVerified ? 15 : 5,
      maxPoints: 15,
      color: "#F59E0B",
      tip: "Complete toutes les sections de ton profil",
    },
    {
      label: "Communaute",
      points: Math.min(MOCK_VOUCHERS.length * 5, 15),
      maxPoints: 15,
      color: "#EC4899",
      tip: "Participe aux evenements et invite des garants",
    },
  ];

  // ─── Last 3 reviews ───
  const lastReviews = reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          className="w-9 h-9 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(59,130,246,0), rgba(59,130,246,1), rgba(139,92,246,0.6), rgba(59,130,246,0))",
            mask: "radial-gradient(circle, transparent 50%, black 53%)",
            WebkitMask: "radial-gradient(circle, transparent 50%, black 53%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header — pulse line + rack-focus title */}
      <motion.header
        initial={{ opacity: 0, y: -16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={springs.heavy}
        className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(59,130,246,0)",
                  "0 0 14px rgba(59,130,246,0.4)",
                  "0 0 0px rgba(59,130,246,0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldIcon />
            </motion.div>
            <div>
              <h1 className="text-[17px] font-bold text-text">Centre de confiance</h1>
              <p className="text-[11px] text-text-muted">Ta securite, notre priorite</p>
            </div>
          </div>
          <TrustBadge trustScore={trustScore} isVerified={isVerified} />
        </div>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(139,92,246,0.4), transparent)",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.header>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        {/* ━━━ Section 1: Mon score de confiance ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-6"
          aria-labelledby="trust-score-heading"
        >
          <SectionHeader
            icon={<ShieldIcon />}
            title="Mon score de confiance"
            subtitle="Plus ton score est eleve, plus tu inspires confiance"
            index={0}
          />
          <h2 id="trust-score-heading" className="sr-only">Score de confiance</h2>

          <TrustGauge score={trustScore} breakdown={breakdown} size={200} />

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...springs.heavy, delay: 1.2 }}
            className="mt-6 space-y-2"
          >
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Conseils pour ameliorer
            </p>
            {breakdown
              .filter((b) => b.points < b.maxPoints)
              .slice(0, 3)
              .map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.heavy, delay: 1.3 + i * 0.08 }}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-white/3"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-[12px] text-text-muted leading-relaxed">
                    {item.tip}
                  </p>
                </motion.div>
              ))}
          </motion.div>
        </motion.section>

        {/* ━━━ Section 2: Mes verifications ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.25 }}
          className="bg-card border border-border rounded-3xl p-6"
          aria-labelledby="verifications-heading"
        >
          <SectionHeader
            icon={<CheckCircleIcon />}
            title="Mes verifications"
            subtitle="Prouve que tu es bien toi"
            index={1}
          />
          <h2 id="verifications-heading" className="sr-only">Verifications</h2>

          <VerificationChecklist
            selfieVerified={verifications.selfie}
            phoneVerified={verifications.phone}
            videoVerified={verifications.video}
            socialLinked={verifications.social}
            idVerified={verifications.id}
          />
        </motion.section>

        {/* ━━━ Section 3: Mes avis ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.4 }}
          className="bg-card border border-border rounded-3xl p-6"
          aria-labelledby="reviews-heading"
        >
          <SectionHeader
            icon={<StarIcon />}
            title="Mes avis"
            subtitle={totalReviews > 0 ? `${totalReviews} avis recus` : "Aucun avis pour le moment"}
            index={2}
          />
          <h2 id="reviews-heading" className="sr-only">Avis</h2>

          {totalReviews > 0 ? (
            <div className="space-y-4">
              {/* Average rating display */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
                <div className="text-center">
                  <span className="text-3xl font-black text-text font-display">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-lg text-text-muted">/5</span>
                </div>
                <div>
                  <Stars rating={averageRating} size={18} />
                  <p className="text-[11px] text-text-muted mt-1">
                    Moyenne sur {totalReviews} avis
                  </p>
                </div>
              </div>

              {/* Last 3 reviews */}
              <div className="space-y-2">
                {lastReviews.map((review, i) => {
                  const date = new Date(review.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.heavy, delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/3"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-accent">
                          {review.reviewer?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[12px] font-semibold text-text truncate">
                            {review.anonymous ? "Anonyme" : review.reviewer?.name || "Utilisateur"}
                          </span>
                          <span className="text-[10px] text-text-muted">{date}</span>
                        </div>
                        <Stars rating={review.rating} size={12} />
                        {review.comment && (
                          <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* View all link */}
              <Link
                href="/reviews"
                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-accent/20 transition-colors"
              >
                <span className="text-[13px] font-semibold text-accent">
                  Voir tous mes avis
                </span>
                <ArrowRightIcon />
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-[13px] text-text-muted">
                Tes avis apparaitront ici apres tes premieres rencontres
              </p>
            </div>
          )}
        </motion.section>

        {/* ━━━ Section 4: Mes garants ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.55 }}
          className="bg-card border border-border rounded-3xl p-6"
          aria-labelledby="vouchers-heading"
        >
          <SectionHeader
            icon={<UsersIcon />}
            title="Mes garants"
            subtitle="Amis qui se portent garants de toi"
            index={3}
          />
          <h2 id="vouchers-heading" className="sr-only">Garants</h2>

          <div className="space-y-3">
            {/* Voucher avatars */}
            <div className="space-y-2">
              {MOCK_VOUCHERS.map((voucher, i) => (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.heavy, delay: 0.6 + i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                    <span className="text-[12px] font-bold text-[#F59E0B]">
                      {voucher.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text">{voucher.name}</p>
                    <p className="text-[11px] text-text-muted">{voucher.since}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Garant
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Invite button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.8 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-accent/30 text-text-muted hover:text-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span className="text-[13px] font-semibold">Inviter un garant</span>
            </motion.button>
          </div>
        </motion.section>

        {/* ━━━ Section 5: Historique de securite ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.7 }}
          className="bg-card border border-border rounded-3xl p-6"
          aria-labelledby="safety-heading"
        >
          <SectionHeader
            icon={<HistoryIcon />}
            title="Historique de securite"
            subtitle="Tes actions de securite recentes"
            index={4}
          />
          <h2 id="safety-heading" className="sr-only">Historique de securite</h2>

          <div className="space-y-3">
            {/* Clean record badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.elastic, delay: 0.8 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl border"
              style={{
                backgroundColor: reportsAgainst === 0 ? "rgba(0,255,136,0.06)" : "rgba(239,68,68,0.06)",
                borderColor: reportsAgainst === 0 ? "rgba(0,255,136,0.2)" : "rgba(239,68,68,0.2)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: reportsAgainst === 0 ? "rgba(0,255,136,0.15)" : "rgba(239,68,68,0.15)",
                }}
              >
                {reportsAgainst === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className="text-[13px] font-bold"
                  style={{ color: reportsAgainst === 0 ? "#00FF88" : "#EF4444" }}
                >
                  {reportsAgainst === 0
                    ? "0 signalements contre toi"
                    : `${reportsAgainst} signalement${reportsAgainst > 1 ? "s" : ""}`}
                </p>
                <p className="text-[11px] text-text-muted">
                  {reportsAgainst === 0 ? "Dossier vierge" : "Consulte les details"}
                </p>
              </div>
            </motion.div>

            {/* Recent safety actions */}
            {MOCK_SAFETY_ACTIONS.map((action, i) => {
              const config = SAFETY_ACTION_CONFIG[action.type] || SAFETY_ACTION_CONFIG.checkin;
              const date = new Date(action.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.heavy, delay: 0.9 + i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3"
                >
                  <span className="text-lg" aria-hidden="true">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-text">{action.label}</p>
                    <p className="text-[10px] text-text-muted">{date}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* View report history */}
            <Link
              href="/trust/report-history"
              className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-accent/20 transition-colors"
            >
              <span className="text-[13px] font-semibold text-accent">
                Voir l'historique complet
              </span>
              <ArrowRightIcon />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

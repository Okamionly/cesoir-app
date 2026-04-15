"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useReputation, type ReviewWithAuthor } from "@/lib/useReputation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import TrustBadge from "@/components/app/TrustBadge";
import type { DbReview, DbProfile } from "@/lib/supabase-types";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

type FilterTab = "received" | "given";

const TAG_EMOJI: Record<string, string> = {
  Fun: "🎉",
  Respectueux: "🤝",
  Ponctuel: "⏰",
  "Bonne conversation": "💬",
  Genereux: "💝",
  Ponctuel_legacy: "⏰",
  Sympa: "😊",
  "A revoir": "🔄",
};

// ─────────────────────────────────────────
// Trust Score Gauge (circular SVG)
// ─────────────────────────────────────────

function TrustGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const offset = circumference * (1 - progress);

  // Color based on score
  const color =
    score >= 80 ? "#00FF88" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative w-36 h-36 mx-auto" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de confiance: ${score} sur 100`}>
      <svg width="144" height="144" viewBox="0 0 144 144" className="transform -rotate-90" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={springs.cinematic}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springs.elastic, delay: 0.3 }}
          className="text-3xl font-black text-text font-display"
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
          Confiance
        </span>
      </div>
    </div>
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
// Review Card
// ─────────────────────────────────────────

function ReviewCard({ review, index, showAuthor }: { review: ReviewWithAuthor; index: number; showAuthor: boolean }) {
  const date = new Date(review.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.heavy, delay: index * 0.06 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      {/* Header: author + rating + date */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar or anonymous icon */}
          {review.anonymous || !showAuthor ? (
            <div className="w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-muted" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden">
              {review.reviewer?.avatar_url ? (
                <img
                  src={review.reviewer.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-accent">
                  {review.reviewer?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-text">
              {review.anonymous || !showAuthor ? "Anonyme" : review.reviewer?.name || "Utilisateur"}
            </p>
            <p className="text-[11px] text-text-muted">{date}</p>
          </div>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {review.tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.snap, delay: 0.3 + i * 0.04 }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent/8 text-accent border border-accent/15"
            >
              {TAG_EMOJI[tag] || "✨"} {tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-[13px] text-text-muted leading-relaxed">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      {/* Anonymous badge */}
      {review.anonymous && showAuthor && (
        <div className="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-muted" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[10px] text-text-muted">Avis anonyme</span>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Given Reviews Card (reviews you wrote)
// ─────────────────────────────────────────

interface GivenReview extends DbReview {
  reviewed?: Pick<DbProfile, "name" | "avatar_url"> | null;
}

function GivenReviewCard({ review, index }: { review: GivenReview; index: number }) {
  const date = new Date(review.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.heavy, delay: index * 0.06 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[13px] font-semibold text-text">
            {review.reviewed?.name || "Utilisateur"}
          </p>
          <p className="text-[11px] text-text-muted">{date}</p>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-bg text-text-muted border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {review.comment && (
        <p className="text-[12px] text-text-muted">&ldquo;{review.comment}&rdquo;</p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function ReviewsPage() {
  const { user } = useAuth();
  const { reviews, averageRating, totalReviews, trustScore, loading } = useReputation();
  const [filter, setFilter] = useState<FilterTab>("received");
  const [givenReviews, setGivenReviews] = useState<GivenReview[]>([]);
  const [givenLoading, setGivenLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // ─── Fetch verification status ───
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setIsVerified(data.is_verified);
      });
  }, [user?.id]);

  // ─── Fetch given reviews when tab switches ───
  useEffect(() => {
    if (filter !== "given" || !user?.id || givenReviews.length > 0) return;

    setGivenLoading(true);

    async function fetchGiven() {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewer_id", user!.id)
        .order("created_at", { ascending: false });

      if (!data) {
        setGivenLoading(false);
        return;
      }

      // Fetch reviewed profile names
      const reviewedIds = (data as DbReview[]).map((r) => r.reviewed_id);
      let profileMap: Record<string, Pick<DbProfile, "name" | "avatar_url">> = {};

      if (reviewedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", reviewedIds);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: { id: string; name: string; avatar_url: string | null }) => [
              p.id,
              { name: p.name, avatar_url: p.avatar_url },
            ]),
          );
        }
      }

      setGivenReviews(
        (data as DbReview[]).map((r) => ({
          ...r,
          reviewed: profileMap[r.reviewed_id] || null,
        })),
      );
      setGivenLoading(false);
    }

    fetchGiven();
  }, [filter, user?.id, givenReviews.length]);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-black text-text font-display">Mes Avis</h1>
        {totalReviews > 0 ? (
          <div className="flex items-center gap-3 mt-2">
            <Stars rating={averageRating} size={18} />
            <span className="text-[14px] font-bold text-text">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-[12px] text-text-muted">
              ({totalReviews} avis)
            </span>
          </div>
        ) : (
          <p className="text-[13px] text-text-muted mt-1">Aucun avis pour le moment</p>
        )}
      </header>

      {/* Trust Score Gauge */}
      <div className="px-5 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <TrustGauge score={trustScore} />
          <div className="flex justify-center mt-4">
            <TrustBadge trustScore={trustScore} isVerified={isVerified} />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 mb-5">
        <div className="flex bg-bg border border-border rounded-xl p-1" role="tablist">
          {([
            { key: "received" as const, label: "Recus" },
            { key: "given" as const, label: "Donnes" },
          ]).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                filter === tab.key
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 space-y-3">
        <AnimatePresence mode="wait">
          {filter === "received" ? (
            <motion.div
              key="received"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review, i) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    index={i}
                    showAuthor
                  />
                ))
              ) : (
                /* Empty state */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.gentle}
                  className="text-center py-16"
                >
                  <div className="text-5xl mb-4">🌙</div>
                  <p className="text-[15px] font-display font-bold text-text mb-1">
                    Pas encore d&apos;avis
                  </p>
                  <p className="text-[13px] text-text-muted max-w-[240px] mx-auto">
                    Sors ce soir pour en avoir !
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="given"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {givenLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : givenReviews.length > 0 ? (
                givenReviews.map((review, i) => (
                  <GivenReviewCard key={review.id} review={review} index={i} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.gentle}
                  className="text-center py-16"
                >
                  <div className="text-5xl mb-4">✍️</div>
                  <p className="text-[15px] font-display font-bold text-text mb-1">
                    Aucun avis donne
                  </p>
                  <p className="text-[13px] text-text-muted max-w-[240px] mx-auto">
                    Apres une sortie, laisse un avis pour gagner du XP
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

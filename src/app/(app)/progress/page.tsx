"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList, SkeletonCard } from "@/components/ui/skeletons";
import { useBadges } from "@/lib/useBadges";
import { useChallenges } from "@/lib/useChallenges";
import { useReputation, type ReviewWithAuthor } from "@/lib/useReputation";
import { useGamification } from "@/lib/useGamification";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { RARITY_CONFIG, type BadgeRarity } from "@/lib/badges";
import type { DbReview, DbProfile } from "@/lib/supabase-types";

type Tab = "achievements" | "challenges" | "leaderboard" | "trust" | "reviews";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "achievements", label: "Badges", emoji: "\uD83C\uDFC6" },
  { key: "challenges", label: "Défis", emoji: "\u26A1" },
  { key: "leaderboard", label: "Classement", emoji: "\uD83D\uDC51" },
  { key: "trust", label: "Confiance", emoji: "\u2728" },
  { key: "reviews", label: "Reviews", emoji: "\uD83D\uDCAC" },
];

// ─────────────────────────────────────────
// Badges tab — reads from useBadges()
// ─────────────────────────────────────────

function AchievementsTab() {
  const { all, earned, totalEarned, loading } = useBadges();

  if (loading) {
    return (
      <div className="px-5 py-4">
        <SkeletonList count={4} itemHeight={72} />
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <EmptyState
        emoji="🏆"
        title="Aucun badge pour le moment"
        subtitle="Démarre une conversation, valide ton profil, sors — débloque des badges."
      />
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="mb-4 flex items-center justify-between text-[12px] text-text-muted">
        <span>
          <strong className="text-text">{totalEarned}</strong>/{all.length} badges débloqués
        </span>
        <span>{earned.reduce((sum, bp) => sum + bp.badge.xp, 0)} XP</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {all.map((bp, i) => (
          <m.div
            key={bp.badge.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.snap, delay: Math.min(i, 12) * 0.02 }}
            className={`relative rounded-xl border p-3 ${
              bp.earned
                ? "bg-bg-card border-accent/30"
                : "bg-bg-card/40 border-border/40 opacity-60"
            }`}
            style={
              bp.earned
                ? {
                    boxShadow: `0 0 12px ${RARITY_CONFIG[bp.badge.rarity as BadgeRarity].glowColor}`,
                  }
                : undefined
            }
          >
            <div className="flex items-start gap-2">
              <div className="text-2xl shrink-0" aria-hidden="true">
                {bp.badge.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-text truncate">
                  {bp.badge.name}
                </p>
                <p className="text-[10px] text-text-muted line-clamp-2">
                  {bp.badge.description}
                </p>
              </div>
            </div>
            {!bp.earned && bp.progressLabel && (
              <div className="mt-2">
                <div className="h-1 rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full gradient-bg"
                    style={{ width: `${Math.round((bp.progress ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-text-muted mt-1">{bp.progressLabel}</p>
              </div>
            )}
            {bp.earned && (
              <p className="text-[9px] text-accent font-semibold mt-1">
                +{bp.badge.xp} XP
              </p>
            )}
          </m.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Challenges tab — reads today's challenges
// ─────────────────────────────────────────

function ChallengesTab() {
  const { challenges, loading, totalXpToday } = useChallenges();

  if (loading) {
    return (
      <div className="px-5 py-4">
        <SkeletonList count={3} itemHeight={80} />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <EmptyState
        emoji="⚡"
        title="Pas de défis aujourd'hui"
        subtitle="3 nouveaux défis quotidiens s'activent chaque soir à minuit. Reviens demain pour en décrocher."
      />
    );
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between text-[12px] text-text-muted mb-2">
        <span>{challenges.length} defis du jour</span>
        <span>
          <strong className="text-accent">{totalXpToday}</strong> XP gagnes
        </span>
      </div>
      {challenges.map((c, i) => (
        <m.div
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.snap, delay: i * 0.05 }}
          className={`rounded-xl border p-4 ${
            c.completed
              ? "bg-accent/10 border-accent/30"
              : "bg-bg-card border-border/50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-text">{c.challengeType}</p>
            <span className="text-[11px] font-semibold text-accent">
              +{c.xpEarned || 50} XP
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border/50 overflow-hidden mb-1.5">
            <div
              className={`h-full ${c.completed ? "bg-accent" : "gradient-bg"}`}
              style={{
                width: `${Math.min(100, (c.progress / c.total) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-text-muted">
            {c.progress}/{c.total} {c.completed ? "· termine" : ""}
          </p>
        </m.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Leaderboard tab — reads leaderboard_view
// ─────────────────────────────────────────

interface LeaderboardRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  karma: number | null;
  total_meetups: number | null;
  reliability_score: number | null;
}

function LeaderboardTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrored(false);
      const { data, error } = await supabase
        .from("leaderboard_view")
        .select(
          "id, name, avatar_url, is_verified, karma, total_meetups, reliability_score",
        )
        .order("karma", { ascending: false, nullsFirst: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        setErrored(true);
        setRows([]);
      } else {
        setRows((data ?? []) as LeaderboardRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="px-5 py-4">
        <SkeletonList count={6} itemHeight={64} />
      </div>
    );
  }

  if (errored || !rows || rows.length === 0) {
    return (
      <EmptyState
        emoji="👑"
        title="Classement indisponible"
        subtitle="Le top des sorteurs apparaîtra ici dès qu'il y aura assez d'activité."
      />
    );
  }

  return (
    <div className="px-5 py-4 space-y-1.5">
      {rows.map((row, i) => {
        const isMe = row.id === user?.id;
        const rank = i + 1;
        const rankColor =
          rank === 1
            ? "text-amber-400"
            : rank === 2
            ? "text-[--color-silver]"
            : rank === 3
            ? "text-orange-300"
            : "text-text-muted";
        return (
          <m.div
            key={row.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.snap, delay: Math.min(i, 12) * 0.02 }}
            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
              isMe
                ? "bg-accent/10 border-accent/40"
                : "bg-bg-card border-border/40"
            }`}
          >
            <span className={`text-[14px] font-black w-6 text-center ${rankColor}`}>
              {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
            </span>
            {row.avatar_url ? (
              <Image
                src={row.avatar_url}
                alt={row.name ?? ""}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {row.name?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-text truncate">
                {row.name ?? "..."} {isMe && <span className="text-accent">(toi)</span>}
                {row.is_verified && <span className="text-accent ml-1">✓</span>}
              </p>
              <p className="text-[10px] text-text-muted">
                {row.total_meetups ?? 0} meetups · score {row.reliability_score ?? 0}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-black gradient-text-deco">{row.karma ?? 0}</p>
              <p className="text-[9px] text-text-muted -mt-0.5">karma</p>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// Trust tab — reads useReputation() + useGamification()
// ─────────────────────────────────────────

function TrustTab() {
  const { trustScore, averageRating, totalReviews, loading } = useReputation();
  const { xp, level, title } = useGamification();

  if (loading) {
    return (
      <div className="px-5 py-4">
        <SkeletonCard />
      </div>
    );
  }

  // Breakdown components mirror useReputation internal math (read-only display).
  const ratingPts = totalReviews > 0 ? Math.round(((averageRating - 1) / 4) * 30) : 0;
  const volumePts = Math.round(Math.min(totalReviews / 20, 1) * 25);
  const karmaPts = Math.round(Math.min(xp / 5000, 1) * 20);

  // First-time user: no reviews yet — show instructional state instead of a
  // 0/100 hero that looks broken.
  if (totalReviews === 0 && trustScore === 0) {
    return (
      <div className="px-5 py-12 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl" aria-hidden="true">
          ✨
        </div>
        <div>
          <p className="text-[16px] font-bold text-text mb-1.5">Ton score de confiance se construit</p>
          <p className="text-[13px] text-text-muted leading-relaxed max-w-[280px]">
            Après ton premier meetup, tes matches pourront te laisser un avis. Le score démarre dès le premier retour.
          </p>
        </div>
        <div className="w-full max-w-[260px] space-y-2 pt-2">
          <BreakdownRow label="Avis reçus" value="0/30" percent={0} />
          <BreakdownRow label="Volume d'avis" value="0/25" percent={0} />
          <BreakdownRow label="Karma (XP)" value={`${karmaPts}/20`} percent={karmaPts / 20} />
        </div>
        <a
          href="/browse"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", boxShadow: "0 0 20px rgba(139,92,246,0.25)" }}
        >
          Trouver des matchs
        </a>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Trust score hero */}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.gentle}
        className="rounded-2xl bg-bg-card border border-accent/30 p-5 text-center"
        style={{ boxShadow: "0 0 24px rgba(139,92,246,0.25)" }}
      >
        <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
          Score de confiance
        </p>
        <p className="text-[44px] font-black gradient-text-deco leading-none">
          {trustScore}
        </p>
        <p className="text-[11px] text-text-muted mt-1">sur 100</p>
      </m.div>

      {/* Breakdown */}
      <div className="space-y-2">
        <BreakdownRow label="Avis moyens" value={`${ratingPts}/30`} percent={ratingPts / 30} />
        <BreakdownRow label="Volume d'avis" value={`${volumePts}/25`} percent={volumePts / 25} />
        <BreakdownRow label="Karma (XP)" value={`${karmaPts}/20`} percent={karmaPts / 20} />
      </div>

      {/* Stats rail */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <StatPill label="Niveau" value={`${level}`} sub={title} />
        <StatPill label="XP" value={`${xp}`} sub="karma total" />
        <StatPill label="Avis" value={`${totalReviews}`} sub={averageRating > 0 ? `${averageRating.toFixed(1)}★` : "pas encore"} />
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text font-semibold">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full gradient-bg"
          style={{ width: `${Math.max(0, Math.min(100, percent * 100))}%` }}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-bg-card border border-border/50 p-2.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-[16px] font-black text-text leading-tight">{value}</p>
      <p className="text-[9px] text-text-muted truncate">{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// Reviews tab — received via hook + given via direct query
// ─────────────────────────────────────────

type ReviewsSubTab = "received" | "given";

interface ReviewGiven extends DbReview {
  reviewed?: Pick<DbProfile, "name" | "avatar_url"> | null;
}

function ReviewsTab() {
  const { user } = useAuth();
  const { reviews: received, loading: loadingReceived } = useReputation();
  const [given, setGiven] = useState<ReviewGiven[] | null>(null);
  const [loadingGiven, setLoadingGiven] = useState(false);
  const [sub, setSub] = useState<ReviewsSubTab>("received");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingGiven(true);
      const { data: rows } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewer_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const typed = (rows ?? []) as DbReview[];
      const ids = typed.map((r) => r.reviewed_id);
      let profileMap: Record<string, Pick<DbProfile, "name" | "avatar_url">> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", ids);
        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: { id: string; name: string; avatar_url: string | null }) => [
              p.id,
              { name: p.name, avatar_url: p.avatar_url },
            ]),
          );
        }
      }
      if (cancelled) return;
      setGiven(
        typed.map((r) => ({
          ...r,
          reviewed: profileMap[r.reviewed_id] ?? null,
        })),
      );
      setLoadingGiven(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loading = sub === "received" ? loadingReceived : loadingGiven;
  const list = sub === "received" ? received : given ?? [];

  return (
    <div className="px-5 py-4 space-y-3">
      {/* Sub-tabs */}
      <div className="flex gap-1.5">
        <SubTabButton active={sub === "received"} onClick={() => setSub("received")}>
          Recues ({received.length})
        </SubTabButton>
        <SubTabButton active={sub === "given"} onClick={() => setSub("given")}>
          Donnees ({given?.length ?? 0})
        </SubTabButton>
      </div>

      {loading ? (
        <SkeletonList count={3} itemHeight={100} />
      ) : list.length === 0 ? (
        <EmptyState
          emoji="💬"
          title={sub === "received" ? "Pas encore d'avis" : "Tu n'as pas encore laisse d'avis"}
          subtitle={
            sub === "received"
              ? "Apres ton premier meetup, tes matches pourront te laisser un avis."
              : "Apres chaque meetup, laisse une review pour aider la communaute."
          }
        />
      ) : sub === "received" ? (
        (list as ReviewWithAuthor[]).map((r) => (
          <ReceivedReviewCard key={r.id} review={r} />
        ))
      ) : (
        (list as ReviewGiven[]).map((r) => <GivenReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
        active ? "gradient-bg text-white" : "bg-border/30 text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value}/5`} className="text-[11px] text-amber-400">
      {"★".repeat(Math.max(0, Math.min(5, value)))}
      <span className="text-border">{"★".repeat(Math.max(0, 5 - value))}</span>
    </span>
  );
}

function ReceivedReviewCard({ review }: { review: ReviewWithAuthor }) {
  const authorName = review.anonymous
    ? "Anonyme"
    : review.reviewer?.name ?? "Utilisateur";
  return (
    <div className="rounded-xl bg-bg-card border border-border/50 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        {!review.anonymous && review.reviewer?.avatar_url ? (
          <Image
            src={review.reviewer.avatar_url}
            alt={authorName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-border/50 flex items-center justify-center text-[11px] font-bold">
            {review.anonymous ? "?" : authorName[0]}
          </div>
        )}
        <span className="text-[12px] font-semibold text-text">{authorName}</span>
        <span className="ml-auto">
          <Stars value={review.rating} />
        </span>
      </div>
      {review.comment && (
        <p className="text-[12px] text-text-muted line-clamp-3">{review.comment}</p>
      )}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {review.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GivenReviewCard({ review }: { review: ReviewGiven }) {
  const name = review.reviewed?.name ?? "Utilisateur";
  return (
    <div className="rounded-xl bg-bg-card border border-border/50 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        {review.reviewed?.avatar_url ? (
          <Image
            src={review.reviewed.avatar_url}
            alt={name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-border/50 flex items-center justify-center text-[11px] font-bold">
            {name[0]}
          </div>
        )}
        <span className="text-[12px] font-semibold text-text">Pour {name}</span>
        <span className="ml-auto">
          <Stars value={review.rating} />
        </span>
      </div>
      {review.comment && (
        <p className="text-[12px] text-text-muted line-clamp-3">{review.comment}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("achievements");

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Progression"
        backHref="/profile"
        slotBelowTitle={
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <m.button
                key={t.key}
                onClick={() => setTab(t.key)}
                whileTap={{ scale: 0.92 }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border tap-target transition-all ${
                  tab === t.key
                    ? "border-accent gradient-bg text-white"
                    : "border-border text-text-muted"
                }`}
              >
                <span className="mr-1" aria-hidden="true">
                  {t.emoji}
                </span>
                {t.label}
              </m.button>
            ))}
          </div>
        }
      />

      <main className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <m.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={springs.snap}
          >
            {tab === "achievements" && <AchievementsTab />}
            {tab === "challenges" && <ChallengesTab />}
            {tab === "leaderboard" && <LeaderboardTab />}
            {tab === "trust" && <TrustTab />}
            {tab === "reviews" && <ReviewsTab />}
          </m.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

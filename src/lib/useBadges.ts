"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ALL_BADGES, type Badge } from "@/lib/badges";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  earnedAt?: string;
  /** Progress 0-1 toward earning, null if not trackable */
  progress: number | null;
  /** Human-readable progress label, e.g. "3/10" */
  progressLabel: string | null;
}

export interface UseBadgesReturn {
  /** All 30 badges with earned status and progress */
  all: BadgeProgress[];
  /** Only the earned badges */
  earned: BadgeProgress[];
  /** In-progress badges (not earned, has trackable progress) */
  inProgress: BadgeProgress[];
  /** The closest badge to being earned */
  nextClosest: BadgeProgress | null;
  /** Total number of earned badges */
  totalEarned: number;
  /** Check all badges and award any newly earned ones */
  checkAndAward: () => Promise<string[]>;
  /** Loading state */
  loading: boolean;
}

// ─────────────────────────────────────────
// User stats shape for badge checking
// ─────────────────────────────────────────

interface UserBadgeStats {
  matchCount: number;
  matchesThisWeek: number;
  referralCount: number;
  likesReceivedToday: number;
  modesMatchedIn: number;
  modesUsed: number;
  nightSessionCount: number;
  earlyActivations: number;
  arrondissements: number;
  foodieQuestCount: number;
  cultureClubCount: number;
  currentStreak: number;
  maxStreak: number;
  totalDaysActive: number;
  isVerified: boolean;
  hasTrustedContacts: boolean;
  reportedFakeProfiles: number;
  checkInCount: number;
  averageRating: number;
  respectueuxTagCount: number;
  ponctuelTagCount: number;
  messageCount: number;
  joinedAt: string;
  isBetaUser: boolean;
  isHolidaySeason: boolean;
  wasOnlineAtMidnight: boolean;
  hadQuickMatch: boolean;
}

// ─────────────────────────────────────────
// Badge checking logic
// ─────────────────────────────────────────

function checkBadgeProgress(
  badgeId: string,
  stats: UserBadgeStats,
): { earned: boolean; progress: number | null; progressLabel: string | null } {
  switch (badgeId) {
    // ── Social ──
    case "premier-match":
      return {
        earned: stats.matchCount >= 1,
        progress: Math.min(stats.matchCount / 1, 1),
        progressLabel: `${Math.min(stats.matchCount, 1)}/1`,
      };
    case "papillon-social":
      return {
        earned: stats.matchesThisWeek >= 10,
        progress: Math.min(stats.matchesThisWeek / 10, 1),
        progressLabel: `${Math.min(stats.matchesThisWeek, 10)}/10`,
      };
    case "ambassadeur":
      return {
        earned: stats.referralCount >= 5,
        progress: Math.min(stats.referralCount / 5, 1),
        progressLabel: `${Math.min(stats.referralCount, 5)}/5`,
      };
    case "populaire":
      return {
        earned: stats.likesReceivedToday >= 10,
        progress: Math.min(stats.likesReceivedToday / 10, 1),
        progressLabel: `${Math.min(stats.likesReceivedToday, 10)}/10`,
      };
    case "connecteur":
      return {
        earned: stats.modesMatchedIn >= 5,
        progress: Math.min(stats.modesMatchedIn / 5, 1),
        progressLabel: `${Math.min(stats.modesMatchedIn, 5)}/5`,
      };
    case "cent-matchs":
      return {
        earned: stats.matchCount >= 100,
        progress: Math.min(stats.matchCount / 100, 1),
        progressLabel: `${Math.min(stats.matchCount, 100)}/100`,
      };

    // ── Explorer ──
    case "globe-trotter":
      return {
        earned: stats.modesUsed >= 14,
        progress: Math.min(stats.modesUsed / 14, 1),
        progressLabel: `${Math.min(stats.modesUsed, 14)}/14`,
      };
    case "noctambule":
      return {
        earned: stats.nightSessionCount >= 10,
        progress: Math.min(stats.nightSessionCount / 10, 1),
        progressLabel: `${Math.min(stats.nightSessionCount, 10)}/10`,
      };
    case "early-bird":
      return {
        earned: stats.earlyActivations >= 1,
        progress: Math.min(stats.earlyActivations / 1, 1),
        progressLabel: stats.earlyActivations >= 1 ? "1/1" : "0/1",
      };
    case "routard":
      return {
        earned: stats.arrondissements >= 10,
        progress: Math.min(stats.arrondissements / 10, 1),
        progressLabel: `${Math.min(stats.arrondissements, 10)}/10`,
      };
    case "foodie-certifie":
      return {
        earned: stats.foodieQuestCount >= 10,
        progress: Math.min(stats.foodieQuestCount / 10, 1),
        progressLabel: `${Math.min(stats.foodieQuestCount, 10)}/10`,
      };
    case "culture-vulture":
      return {
        earned: stats.cultureClubCount >= 5,
        progress: Math.min(stats.cultureClubCount / 5, 1),
        progressLabel: `${Math.min(stats.cultureClubCount, 5)}/5`,
      };

    // ── Streak ──
    case "trois-jours":
      return {
        earned: stats.maxStreak >= 3,
        progress: Math.min(stats.currentStreak / 3, 1),
        progressLabel: `${Math.min(stats.currentStreak, 3)}/3`,
      };
    case "semaine-parfaite":
      return {
        earned: stats.maxStreak >= 7,
        progress: Math.min(stats.currentStreak / 7, 1),
        progressLabel: `${Math.min(stats.currentStreak, 7)}/7`,
      };
    case "deux-semaines":
      return {
        earned: stats.maxStreak >= 14,
        progress: Math.min(stats.currentStreak / 14, 1),
        progressLabel: `${Math.min(stats.currentStreak, 14)}/14`,
      };
    case "mois-legendaire":
      return {
        earned: stats.maxStreak >= 30,
        progress: Math.min(stats.currentStreak / 30, 1),
        progressLabel: `${Math.min(stats.currentStreak, 30)}/30`,
      };
    case "sans-relache":
      return {
        earned: stats.maxStreak >= 60,
        progress: Math.min(stats.currentStreak / 60, 1),
        progressLabel: `${Math.min(stats.currentStreak, 60)}/60`,
      };
    case "habitue":
      return {
        earned: stats.totalDaysActive >= 100,
        progress: Math.min(stats.totalDaysActive / 100, 1),
        progressLabel: `${Math.min(stats.totalDaysActive, 100)}/100`,
      };

    // ── Safety ──
    case "verifie":
      return {
        earned: stats.isVerified,
        progress: stats.isVerified ? 1 : 0,
        progressLabel: stats.isVerified ? "1/1" : "0/1",
      };
    case "ange-gardien":
      return {
        earned: stats.hasTrustedContacts,
        progress: stats.hasTrustedContacts ? 1 : 0,
        progressLabel: stats.hasTrustedContacts ? "1/1" : "0/1",
      };
    case "bon-citoyen":
      return {
        earned: stats.reportedFakeProfiles >= 3,
        progress: Math.min(stats.reportedFakeProfiles / 3, 1),
        progressLabel: `${Math.min(stats.reportedFakeProfiles, 3)}/3`,
      };
    case "check-in-pro":
      return {
        earned: stats.checkInCount >= 20,
        progress: Math.min(stats.checkInCount / 20, 1),
        progressLabel: `${Math.min(stats.checkInCount, 20)}/20`,
      };

    // ── Quality ──
    case "top-rated":
      return {
        earned: stats.averageRating >= 4.5,
        progress:
          stats.averageRating > 0
            ? Math.min(stats.averageRating / 4.5, 1)
            : null,
        progressLabel:
          stats.averageRating > 0
            ? `${stats.averageRating.toFixed(1)}/4.5`
            : null,
      };
    case "gentleman-lady":
      return {
        earned: stats.respectueuxTagCount >= 5,
        progress: Math.min(stats.respectueuxTagCount / 5, 1),
        progressLabel: `${Math.min(stats.respectueuxTagCount, 5)}/5`,
      };
    case "ponctuel":
      return {
        earned: stats.ponctuelTagCount >= 10,
        progress: Math.min(stats.ponctuelTagCount / 10, 1),
        progressLabel: `${Math.min(stats.ponctuelTagCount, 10)}/10`,
      };
    case "bavard-pro":
      return {
        earned: stats.messageCount >= 500,
        progress: Math.min(stats.messageCount / 500, 1),
        progressLabel: `${Math.min(stats.messageCount, 500)}/500`,
      };

    // ── Special ──
    case "fondateur":
      return {
        earned: stats.isBetaUser,
        progress: null,
        progressLabel: null,
      };
    case "saisonnier":
      return {
        earned: stats.isHolidaySeason,
        progress: null,
        progressLabel: null,
      };
    case "midnight-king":
      return {
        earned: stats.wasOnlineAtMidnight,
        progress: null,
        progressLabel: null,
      };
    case "lucky-match":
      return {
        earned: stats.hadQuickMatch,
        progress: null,
        progressLabel: null,
      };

    default:
      return { earned: false, progress: null, progressLabel: null };
  }
}

// ─────────────────────────────────────────
// Default stats (used when data not yet loaded)
// ─────────────────────────────────────────

const DEFAULT_STATS: UserBadgeStats = {
  matchCount: 0,
  matchesThisWeek: 0,
  referralCount: 0,
  likesReceivedToday: 0,
  modesMatchedIn: 0,
  modesUsed: 0,
  nightSessionCount: 0,
  earlyActivations: 0,
  arrondissements: 0,
  foodieQuestCount: 0,
  cultureClubCount: 0,
  currentStreak: 0,
  maxStreak: 0,
  totalDaysActive: 0,
  isVerified: false,
  hasTrustedContacts: false,
  reportedFakeProfiles: 0,
  checkInCount: 0,
  averageRating: 0,
  respectueuxTagCount: 0,
  ponctuelTagCount: 0,
  messageCount: 0,
  joinedAt: new Date().toISOString(),
  isBetaUser: false,
  isHolidaySeason: false,
  wasOnlineAtMidnight: false,
  hadQuickMatch: false,
};

const BETA_CUTOFF = new Date("2027-01-01").getTime();

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useBadges(): UseBadgesReturn {
  const { user } = useAuth();
  const [earnedIds, setEarnedIds] = useState<Map<string, string>>(new Map()); // badge_id -> earned_at
  const [stats, setStats] = useState<UserBadgeStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  // ─── Fetch earned badges from DB ───
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      // Fetch already-earned achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("achievement_key, earned_at")
        .eq("user_id", user!.id);

      if (achievements) {
        const map = new Map<string, string>();
        for (const a of achievements) {
          map.set(a.achievement_key, a.earned_at);
        }
        setEarnedIds(map);
      }

      // Fetch user stats for progress calculation
      // We gather what we can from available tables
      const [
        { data: profile },
        { data: matches },
        { data: messages },
        { data: referrals },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_verified, created_at")
          .eq("id", user!.id)
          .single(),
        supabase
          .from("matches")
          .select("id, created_at, mode")
          .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`),
        supabase
          .from("messages")
          .select("id")
          .eq("sender_id", user!.id),
        supabase
          .from("referrals")
          .select("id")
          .eq("referrer_id", user!.id)
          .eq("status", "completed"),
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const isHoliday =
        now.getMonth() === 11 && now.getDate() >= 20 && now.getDate() <= 31;
      const joinedAt = profile?.created_at ?? now.toISOString();
      const isBeta = new Date(joinedAt).getTime() < BETA_CUTOFF;

      // Count matches this week
      const matchesThisWeek = (matches ?? []).filter(
        (m: { created_at: string }) => new Date(m.created_at) >= weekAgo,
      ).length;

      // Count unique modes matched in
      const uniqueModes = new Set(
        (matches ?? []).map((m: { mode?: string }) => m.mode).filter(Boolean),
      );

      setStats({
        matchCount: matches?.length ?? 0,
        matchesThisWeek,
        referralCount: referrals?.length ?? 0,
        likesReceivedToday: 0, // would need likes table
        modesMatchedIn: uniqueModes.size,
        modesUsed: uniqueModes.size, // best approximation
        nightSessionCount: 0, // tracked via activity_logs
        earlyActivations: 0,
        arrondissements: 0,
        foodieQuestCount: (matches ?? []).filter(
          (m: { mode?: string }) => m.mode === "foodie-quest",
        ).length,
        cultureClubCount: (matches ?? []).filter(
          (m: { mode?: string }) => m.mode === "culture-club",
        ).length,
        currentStreak: 0,
        maxStreak: 0,
        totalDaysActive: 0,
        isVerified: profile?.is_verified ?? false,
        hasTrustedContacts: false,
        reportedFakeProfiles: 0,
        checkInCount: 0,
        averageRating: 0,
        respectueuxTagCount: 0,
        ponctuelTagCount: 0,
        messageCount: messages?.length ?? 0,
        joinedAt,
        isBetaUser: isBeta,
        isHolidaySeason: isHoliday,
        wasOnlineAtMidnight: false,
        hadQuickMatch: false,
      });

      setLoading(false);
    }

    fetchData();
  }, [user?.id]);

  // ─── Compute badge progress for all 30 ───
  const all = useMemo<BadgeProgress[]>(() => {
    return ALL_BADGES.map((badge) => {
      const alreadyEarned = earnedIds.has(badge.id);
      const earnedAt = earnedIds.get(badge.id);

      if (alreadyEarned) {
        return {
          badge,
          earned: true,
          earnedAt,
          progress: 1,
          progressLabel: null,
        };
      }

      const check = checkBadgeProgress(badge.id, stats);
      return {
        badge,
        earned: check.earned,
        earnedAt: undefined,
        progress: check.progress,
        progressLabel: check.progressLabel,
      };
    });
  }, [earnedIds, stats]);

  const earned = useMemo(
    () => all.filter((bp) => bp.earned),
    [all],
  );

  const inProgress = useMemo(
    () =>
      all.filter(
        (bp) =>
          !bp.earned && bp.progress !== null && bp.progress > 0 && bp.progress < 1,
      ),
    [all],
  );

  const nextClosest = useMemo(() => {
    const candidates = all.filter(
      (bp) => !bp.earned && bp.progress !== null && bp.progress > 0,
    );
    if (candidates.length === 0) return null;
    return candidates.sort(
      (a, b) => (b.progress ?? 0) - (a.progress ?? 0),
    )[0];
  }, [all]);

  const totalEarned = earned.length;

  // ─── Check and award newly earned badges ───
  const checkAndAward = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return [];

    const newlyEarned: string[] = [];

    for (const bp of all) {
      if (bp.earned && !earnedIds.has(bp.badge.id)) {
        // Insert into achievements table
        const { error } = await supabase.from("achievements").insert({
          user_id: user.id,
          achievement_key: bp.badge.id,
        });

        if (!error) {
          newlyEarned.push(bp.badge.id);

          // Award XP via karma_transactions
          await supabase.from("karma_transactions").insert({
            user_id: user.id,
            amount: bp.badge.xp,
            reason: `Badge: ${bp.badge.name}`,
          });
        }
      }
    }

    if (newlyEarned.length > 0) {
      // Refresh earned ids
      const { data: achievements } = await supabase
        .from("achievements")
        .select("achievement_key, earned_at")
        .eq("user_id", user.id);

      if (achievements) {
        const map = new Map<string, string>();
        for (const a of achievements) {
          map.set(a.achievement_key, a.earned_at);
        }
        setEarnedIds(map);
      }
    }

    return newlyEarned;
  }, [user?.id, all, earnedIds]);

  return {
    all,
    earned,
    inProgress,
    nextClosest,
    totalEarned,
    checkAndAward,
    loading,
  };
}

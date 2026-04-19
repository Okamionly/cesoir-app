"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/lib/useGamification";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import type { DbReview, DbProfile } from "@/lib/supabase-types";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface ReviewWithAuthor extends DbReview {
  reviewer?: Pick<DbProfile, "name" | "avatar_url" | "is_verified"> | null;
}

export interface UseReputationReturn {
  reviews: ReviewWithAuthor[];
  averageRating: number;
  totalReviews: number;
  trustScore: number;
  submitReview: (
    reviewedId: string,
    rating: number,
    tags: string[],
    comment: string,
    anonymous: boolean,
  ) => Promise<void>;
  loading: boolean;
}

interface ReputationPayload {
  reviews: ReviewWithAuthor[];
  profile: DbProfile | null;
}

// ─────────────────────────────────────────
// Trust score calculation
// ─────────────────────────────────────────

function calculateTrustScore(
  avgRating: number,
  totalReviews: number,
  isVerified: boolean,
  xp: number,
  accountAgeDays: number,
): number {
  const ratingPts = totalReviews > 0 ? ((avgRating - 1) / 4) * 30 : 0;
  const volumePts = Math.min(totalReviews / 20, 1) * 25;
  const verifyPts = isVerified ? 15 : 0;
  const karmaPts = Math.min(xp / 5000, 1) * 20;
  const agePts = Math.min(accountAgeDays / 90, 1) * 10;

  return Math.round(ratingPts + volumePts + verifyPts + karmaPts + agePts);
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useReputation(targetUserId?: string): UseReputationReturn {
  const { user } = useAuth();
  const { xp, addXP } = useGamification();

  const userId = targetUserId || user?.id;

  const { data, loading } = useAsyncResource<ReputationPayload>(
    async (signal) => {
      if (!userId) return { reviews: [], profile: null };

      const [{ data: profileData }, { data: reviewData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .abortSignal(signal)
          .single(),
        supabase
          .from("reviews")
          .select("*")
          .eq("reviewed_id", userId)
          .order("created_at", { ascending: false })
          .abortSignal(signal),
      ]);

      const reviewsRaw = (reviewData ?? []) as DbReview[];

      const nonAnonIds = reviewsRaw.filter((r) => !r.anonymous).map((r) => r.reviewer_id);

      let profileMap: Record<
        string,
        Pick<DbProfile, "name" | "avatar_url" | "is_verified">
      > = {};

      if (nonAnonIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, is_verified")
          .in("id", nonAnonIds)
          .abortSignal(signal);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map(
              (p: {
                id: string;
                name: string;
                avatar_url: string | null;
                is_verified: boolean;
              }) => [
                p.id,
                {
                  name: p.name,
                  avatar_url: p.avatar_url,
                  is_verified: p.is_verified,
                },
              ],
            ),
          );
        }
      }

      const enriched: ReviewWithAuthor[] = reviewsRaw.map((r) => ({
        ...r,
        reviewer: r.anonymous ? null : profileMap[r.reviewer_id] || null,
      }));

      return {
        reviews: enriched,
        profile: (profileData ?? null) as DbProfile | null,
      };
    },
    [userId],
  );

  const reviews = data?.reviews ?? [];
  const profile = data?.profile ?? null;

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  const accountAgeDays = profile?.created_at
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  const trustScore = calculateTrustScore(
    averageRating,
    totalReviews,
    profile?.is_verified ?? false,
    xp,
    accountAgeDays,
  );

  const submitReview = useCallback(
    async (
      reviewedId: string,
      rating: number,
      tags: string[],
      comment: string,
      anonymous: boolean,
    ) => {
      if (!user?.id) return;

      await supabase.from("reviews").insert({
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        rating,
        tags,
        comment,
        anonymous,
      });

      await addXP("receive_good_review");
    },
    [user?.id, addXP],
  );

  return {
    reviews,
    averageRating,
    totalReviews,
    trustScore,
    submitReview,
    loading,
  };
}

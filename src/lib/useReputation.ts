"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/lib/useGamification";
import type { DbReview, DbProfile } from "@/lib/supabase-types";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface ReviewWithAuthor extends DbReview {
  reviewer?: Pick<DbProfile, "name" | "avatar_url" | "is_verified"> | null;
}

export interface UseReputationReturn {
  /** Reviews received by the user */
  reviews: ReviewWithAuthor[];
  /** Average rating (1-5), 0 if no reviews */
  averageRating: number;
  /** Total number of reviews received */
  totalReviews: number;
  /**
   * Trust score 0-100 calculated from:
   * - Review average (0-30 pts)
   * - Review volume (0-25 pts)
   * - Verification status (0-15 pts)
   * - Karma/XP (0-20 pts)
   * - Account age (0-10 pts)
   */
  trustScore: number;
  /** Submit a review for another user */
  submitReview: (
    reviewedId: string,
    rating: number,
    tags: string[],
    comment: string,
    anonymous: boolean,
  ) => Promise<void>;
  /** Whether data is loading */
  loading: boolean;
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
  // Review quality: 0-30 pts (scales from rating 1-5)
  const ratingPts = totalReviews > 0 ? ((avgRating - 1) / 4) * 30 : 0;

  // Review volume: 0-25 pts (caps at 20 reviews)
  const volumePts = Math.min(totalReviews / 20, 1) * 25;

  // Verification: 0-15 pts
  const verifyPts = isVerified ? 15 : 0;

  // Karma/XP: 0-20 pts (caps at 5000 XP)
  const karmaPts = Math.min(xp / 5000, 1) * 20;

  // Account age: 0-10 pts (caps at 90 days)
  const agePts = Math.min(accountAgeDays / 90, 1) * 10;

  return Math.round(ratingPts + volumePts + verifyPts + karmaPts + agePts);
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useReputation(targetUserId?: string): UseReputationReturn {
  const { user } = useAuth();
  const { xp, addXP } = useGamification();
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DbProfile | null>(null);

  const userId = targetUserId || user?.id;
  const fetchedRef = useRef(false);

  // ─── Fetch profile for trust score inputs ───
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();

      if (data) setProfile(data as DbProfile);
    }

    fetchProfile();
  }, [userId]);

  // ─── Fetch reviews received ───
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Prevent double-fetches in strict mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchReviews() {
      // Fetch reviews where this user was reviewed
      const { data: reviewData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId!)
        .order("created_at", { ascending: false });

      if (error || !reviewData) {
        setLoading(false);
        return;
      }

      // Fetch reviewer profiles for non-anonymous reviews
      const nonAnonIds = (reviewData as DbReview[])
        .filter((r) => !r.anonymous)
        .map((r) => r.reviewer_id);

      let profileMap: Record<string, Pick<DbProfile, "name" | "avatar_url" | "is_verified">> = {};

      if (nonAnonIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, is_verified")
          .in("id", nonAnonIds);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: { id: string; name: string; avatar_url: string | null; is_verified: boolean }) => [
              p.id,
              { name: p.name, avatar_url: p.avatar_url, is_verified: p.is_verified },
            ]),
          );
        }
      }

      const enriched: ReviewWithAuthor[] = (reviewData as DbReview[]).map((r) => ({
        ...r,
        reviewer: r.anonymous ? null : profileMap[r.reviewer_id] || null,
      }));

      setReviews(enriched);
      setLoading(false);
    }

    fetchReviews();
  }, [userId]);

  // ─── Reset fetch ref when userId changes ───
  useEffect(() => {
    fetchedRef.current = false;
  }, [userId]);

  // ─── Computed values ───
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const accountAgeDays = profile?.created_at
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const trustScore = calculateTrustScore(
    averageRating,
    totalReviews,
    profile?.is_verified ?? false,
    xp,
    accountAgeDays,
  );

  // ─── Submit review ───
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

      // Award XP for leaving a review
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

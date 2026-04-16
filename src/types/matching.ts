// Shared types for the matching API — used by both frontend and API routes.

export type SwipeDirection = "like" | "pass" | "superlike";

export interface SwipeRequest {
  targetId: string;
  direction: SwipeDirection;
  mode?: string;
}

export interface SwipeResponse {
  matched: boolean;
  conversationId: string | null;
  swipesRemaining: number;
  resetAt: string; // ISO — midnight UTC
}

export interface RecommendationsResponse {
  candidates: RecommendationCandidate[];
}

export interface RecommendationCandidate {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string | null;
  is_verified: boolean;
  distance_km: number;
  score: number;
  sharedModes: string[];
  activeModes: string[];
  availableTime: string | null;
}

import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "./matching";
import type { ModeKey } from "./modes";

/**
 * These tests target the pure `calculateMatchScore` function.
 * The full `findMatches` pipeline (which hits Supabase via RPC + multiple
 * tables) is left for the integration suite.
 */

type NearbyRow = Parameters<typeof calculateMatchScore>[1];

function makeCandidate(overrides: Partial<NearbyRow> = {}): NearbyRow {
  return {
    id: "c1",
    name: "Test",
    age: 28,
    gender: "f",
    bio: "",
    avatar_url: null,
    is_verified: false,
    distance_km: 2,
    mode: "solo-diner",
    available_time: null,
    mode_details: null,
    lat: 48.85,
    lng: 2.35,
    ...overrides,
  };
}

describe("calculateMatchScore", () => {
  it("returns score 0-100 and breakdown with 4 axes", () => {
    const userModes: ModeKey[] = ["solo-diner"];
    const { score, breakdown, sharedModes } = calculateMatchScore(
      userModes,
      makeCandidate(),
      ["solo-diner"],
      0,
      0,
    );

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(breakdown.mode).toBeGreaterThanOrEqual(0);
    expect(breakdown.distance).toBeGreaterThanOrEqual(0);
    expect(breakdown.timing).toBeGreaterThanOrEqual(0);
    expect(breakdown.social).toBeGreaterThanOrEqual(0);
    expect(sharedModes).toEqual(["solo-diner"]);
  });

  it("penalises zero shared modes with 0 mode points", () => {
    const userModes: ModeKey[] = ["solo-diner"];
    const { breakdown, sharedModes } = calculateMatchScore(
      userModes,
      makeCandidate({ mode: "night-owl" }),
      ["night-owl"],
      0,
      0,
    );

    expect(sharedModes).toEqual([]);
    expect(breakdown.mode).toBe(0);
  });

  it("rewards 3+ shared modes with 40 pts (cap)", () => {
    const userModes: ModeKey[] = ["solo-diner", "night-owl", "tourist"];
    const { breakdown } = calculateMatchScore(
      userModes,
      makeCandidate({ mode: "solo-diner" }),
      ["solo-diner", "night-owl", "tourist"],
      0,
      0,
    );

    expect(breakdown.mode).toBe(40);
  });

  it("gives max distance score (25) for same-spot candidates", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ distance_km: 0.3 }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.distance).toBe(25);
  });

  it("gives 0 distance score for >10km candidates", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ distance_km: 25 }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.distance).toBe(0);
  });

  it("maxes timing score (20) for candidates available within 30 min", () => {
    const in20min = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ available_time: in20min }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.timing).toBe(20);
  });

  it("gives baseline timing score (3) when available_time is null", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ available_time: null }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.timing).toBe(3);
  });

  it("caps social score at 15", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ is_verified: true }),
      ["solo-diner"],
      1_000, // huge karma
      5, // perfect reviews
    );
    expect(breakdown.social).toBeLessThanOrEqual(15);
    expect(breakdown.social).toBeGreaterThanOrEqual(10);
  });

  it("clamps the final score to 100 even if raw sums exceed it", () => {
    const { score } = calculateMatchScore(
      ["solo-diner", "night-owl", "tourist"],
      makeCandidate({ distance_km: 0.1, is_verified: true, available_time: new Date().toISOString() }),
      ["solo-diner", "night-owl", "tourist"],
      100,
      5,
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});

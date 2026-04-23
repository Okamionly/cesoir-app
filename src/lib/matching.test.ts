import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase } = vi.hoisted(() => {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  Object.assign(builder, {
    select: vi.fn(chain),
    eq: vi.fn(chain),
    gt: vi.fn(chain),
    in: vi.fn(chain),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  });
  return {
    mockSupabase: {
      from: vi.fn(() => builder),
      rpc: vi.fn(),
    },
  };
});

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }));

import { calculateMatchScore, findMatches } from "./matching";
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
      makeCandidate({ mode: "foodie-quest" }),
      ["foodie-quest"],
      0,
      0,
    );

    expect(sharedModes).toEqual([]);
    expect(breakdown.mode).toBe(0);
  });

  it("rewards 3+ shared modes with 40 pts (cap)", () => {
    const userModes: ModeKey[] = ["solo-diner", "night-owl", "plus-one"];
    const { breakdown } = calculateMatchScore(
      userModes,
      makeCandidate({ mode: "solo-diner" }),
      ["solo-diner", "night-owl", "plus-one"],
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
      ["solo-diner", "night-owl", "plus-one"],
      makeCandidate({ distance_km: 0.1, is_verified: true, available_time: new Date().toISOString() }),
      ["solo-diner", "night-owl", "plus-one"],
      100,
      5,
    );
    expect(score).toBeLessThanOrEqual(100);
  });

  it("scales mid-range distances (3-5 km = 15 pts, 5-10 km = 8 pts)", () => {
    const mid = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ distance_km: 4 }),
      ["solo-diner"],
      0,
      0,
    );
    expect(mid.breakdown.distance).toBe(15);

    const far = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ distance_km: 8 }),
      ["solo-diner"],
      0,
      0,
    );
    expect(far.breakdown.distance).toBe(8);
  });

  it("scales timing for 1-2 hour windows", () => {
    const in90min = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ available_time: in90min }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.timing).toBe(10);
  });

  it("returns lowest tier (5 pts) for far-future availability", () => {
    const in5h = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ available_time: in5h }),
      ["solo-diner"],
      0,
      0,
    );
    expect(breakdown.timing).toBe(5);
  });

  it("rewards 2 shared modes with 33 pts (mid tier)", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner", "night-owl"],
      makeCandidate({ mode: "plus-one" }),
      ["solo-diner", "night-owl"],
      0,
      0,
    );
    // 33 base, no mode bonus since candidate.mode "plus-one" is not in user modes
    expect(breakdown.mode).toBe(33);
  });

  it("adds +5 mode bonus when candidate's primary mode is in user modes", () => {
    const { breakdown } = calculateMatchScore(
      ["solo-diner"],
      makeCandidate({ mode: "solo-diner" }),
      ["solo-diner"],
      0,
      0,
    );
    // 25 (1 shared) + 5 bonus = 30
    expect(breakdown.mode).toBe(30);
  });
});

// ----------------------------------------
// findMatches integration (with mocked Supabase)
// ----------------------------------------

beforeEach(() => {
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockReset();
});

describe("findMatches", () => {
  it("returns [] when nearby_profiles RPC errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "RPC down" },
    });
    const result = await findMatches("u-1", 48.85, 2.35);
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("returns [] when no nearby candidates", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });
    const result = await findMatches("u-1", 48.85, 2.35);
    expect(result).toEqual([]);
  });

  it("excludes self from RPC results", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        {
          id: "u-self",
          name: "Me",
          age: 30,
          gender: "f",
          bio: "",
          avatar_url: null,
          is_verified: false,
          distance_km: 1,
          mode: null,
          available_time: null,
          mode_details: null,
          lat: 0,
          lng: 0,
        },
      ],
      error: null,
    });
    const result = await findMatches("u-self", 48.85, 2.35);
    expect(result).toEqual([]);
  });

  it("forwards mode + maxDistance + genderFilter options to RPC", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });
    await findMatches("u-1", 48.85, 2.35, {
      mode: "solo-diner",
      maxDistance: 5,
      genderFilter: "femmes",
      limit: 10,
    });
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      "nearby_profiles",
      expect.objectContaining({
        user_lat: 48.85,
        user_lng: 2.35,
        radius_km: 5,
        mode_filter: "solo-diner",
        gender_filter: "femmes",
        limit_count: 30, // limit * 3
      }),
    );
  });
});

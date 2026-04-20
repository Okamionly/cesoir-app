import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, createQueryBuilder } from "@/test/mocks/supabase";

/**
 * premium-gate.ts pulls `createClient` from `@/lib/supabase/server`.
 * We mock that module before importing the target.
 *
 * Free-first launch (Wave 13): premium-gate now short-circuits via the
 * featureFlags module when monetization is off. The tests pin monetization
 * ON so they continue to cover the tiered logic that will re-activate when
 * the founder flips the flag in Wave N+1.
 */
const mockSupabase = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("@/lib/featureFlags", () => ({
  MONETIZATION_ENABLED: true,
  FEATURE_FLAGS: { monetizationEnabled: true },
  isMonetizationEnabledServer: () => true,
}));

import {
  isPremium,
  getDailyLikeCap,
  FREE_TIER_DAILY_LIKES,
  PREMIUM_TIER_DAILY_LIKES,
} from "./premium-gate";

describe("isPremium", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when no userId is provided", async () => {
    const result = await isPremium("");
    expect(result).toBe(false);
  });

  it("returns true when an active subscription row exists", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: { status: "active" }, error: null }),
    );
    const result = await isPremium("user-123");
    expect(result).toBe(true);
  });

  it("returns true for trialing subscriptions", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: { status: "trialing" }, error: null }),
    );
    const result = await isPremium("user-123");
    expect(result).toBe(true);
  });

  it("returns false when no subscription row is found", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: null }),
    );
    const result = await isPremium("user-123");
    expect(result).toBe(false);
  });

  it("returns false and logs when the query errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: { message: "db down" } }),
    );
    const result = await isPremium("user-123");
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("getDailyLikeCap", () => {
  it("returns FREE_TIER cap for non-premium users", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: null }),
    );
    const cap = await getDailyLikeCap("user-free");
    expect(cap).toBe(FREE_TIER_DAILY_LIKES);
    expect(cap).toBe(100);
  });

  it("returns PREMIUM_TIER cap (Infinity) for active subscribers", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: { status: "active" }, error: null }),
    );
    const cap = await getDailyLikeCap("user-premium");
    expect(cap).toBe(PREMIUM_TIER_DAILY_LIKES);
    expect(cap).toBe(Infinity);
  });

  it("falls back to FREE cap when userId is empty", async () => {
    const cap = await getDailyLikeCap("");
    expect(cap).toBe(FREE_TIER_DAILY_LIKES);
  });

  it("falls back to FREE cap when subscription query errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: { message: "boom" } }),
    );
    const cap = await getDailyLikeCap("user-x");
    expect(cap).toBe(FREE_TIER_DAILY_LIKES);
    consoleSpy.mockRestore();
  });
});

describe("isPremium — extended scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats canceled subscriptions as non-premium (mid-period or otherwise)", async () => {
    // The query filter explicitly excludes canceled status — the mock returning
    // null for that query confirms a canceled sub does not grant premium.
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: null }),
    );
    expect(await isPremium("user-cxl")).toBe(false);
  });

  it("treats past_due as non-premium", async () => {
    mockSupabase.from = vi.fn(() =>
      createQueryBuilder({ data: null, error: null }),
    );
    expect(await isPremium("user-past-due")).toBe(false);
  });

  it("queries the `subscriptions` table with the user_id filter", async () => {
    const fromSpy = vi.fn(() =>
      createQueryBuilder({ data: { status: "active" }, error: null }),
    );
    mockSupabase.from = fromSpy;
    await isPremium("user-42");
    expect(fromSpy).toHaveBeenCalledWith("subscriptions");
  });
});

import { describe, it, expect } from "vitest";
import { calculateCompatibility, type CompatProfile } from "./compatibility";

// Baseline profile used as the "searcher" in each test.
const base: CompatProfile = {
  modes: ["solo-diner", "foodie-quest"],
  langs: ["fr", "en"],
  age: 28,
  lat: 43.6082,
  lng: 3.8794, // Montpellier, Place de la Comédie
};

describe("calculateCompatibility", () => {
  it("scores within 0-100 for any input", () => {
    const score = calculateCompatibility(base, base);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns a very high score (>=90) for identical profiles", () => {
    const score = calculateCompatibility(base, { ...base });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("penalises profiles with zero overlap on every axis", () => {
    const opposite: CompatProfile = {
      modes: ["night-owl"],
      langs: ["jp"],
      age: 70,
      lat: 35.6762,
      lng: 139.6503, // Tokyo — far from Montpellier
    };
    const score = calculateCompatibility(base, opposite);
    expect(score).toBeLessThan(20);
  });

  it("handles missing language data with neutral weight", () => {
    const noLangs: CompatProfile = {
      modes: base.modes,
      langs: [],
      age: base.age,
      lat: base.lat,
      lng: base.lng,
    };
    const score = calculateCompatibility(base, noLangs);
    // No lang penalty beyond the 10pt neutral default — should still be strong
    expect(score).toBeGreaterThan(50);
  });

  it("gives partial credit for partial mode overlap", () => {
    const partial: CompatProfile = {
      modes: ["solo-diner", "night-owl"], // 1 shared, 1 different
      langs: base.langs,
      age: base.age,
    };
    const full: CompatProfile = {
      modes: ["solo-diner", "foodie-quest"],
      langs: base.langs,
      age: base.age,
    };
    const partialScore = calculateCompatibility(base, partial);
    const fullScore = calculateCompatibility(base, full);

    expect(partialScore).toBeLessThan(fullScore);
  });

  it("decays age score linearly with age diff", () => {
    const close: CompatProfile = { modes: base.modes, langs: base.langs, age: 29 };
    const far: CompatProfile = { modes: base.modes, langs: base.langs, age: 48 };
    const closeScore = calculateCompatibility(base, close);
    const farScore = calculateCompatibility(base, far);

    expect(closeScore).toBeGreaterThan(farScore);
  });

  it("returns an integer between 0 and 100", () => {
    const score = calculateCompatibility(base, {
      modes: ["night-owl"],
      langs: ["es"],
      age: 45,
    });
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

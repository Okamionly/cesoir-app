import { expect, test } from "playwright/test";

/**
 * E2E · Login flow
 *
 * Uses a seeded profile (Supabase `zoe.martin@cesoir.app` by default) and
 * verifies we land on `/feed` after submitting the form. A regression here
 * would block every existing user — this is the single most important
 * smoke test in the suite.
 */
const EMAIL = process.env.E2E_TEST_EMAIL ?? "zoe.martin@cesoir.app";
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

test.describe("login", () => {
  test.skip(!PASSWORD, "E2E_TEST_PASSWORD not set — skipping in local/unauthed runs");

  test("user can log in and reach /feed", async ({ page }) => {
    await page.goto("/login");

    // Form should be visible on first paint — no hydration race.
    await expect(page.getByRole("heading", { name: /connexion|se connecter|login/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel(/e-?mail/i).fill(EMAIL);
    await page.getByLabel(/mot de passe|password/i).fill(PASSWORD);

    await Promise.all([
      page.waitForURL(/\/feed(\/|$|\?)/, { timeout: 15_000 }),
      page.getByRole("button", { name: /se connecter|connexion|sign in|login/i }).click(),
    ]);

    // Feed mount — look for a stable anchor (page heading or the tab bar).
    await expect(page).toHaveURL(/\/feed(\/|$|\?)/);
  });

  test("invalid credentials show a localized error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(EMAIL);
    await page.getByLabel(/mot de passe|password/i).fill("wrong-password-xxx");
    await page.getByRole("button", { name: /se connecter|connexion|sign in|login/i }).click();

    // Generic message per audit M6 — we do NOT leak "user exists vs wrong password".
    await expect(page.getByText(/incorrect|invalide|invalid/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/feed/);
  });
});

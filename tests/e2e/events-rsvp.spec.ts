import { expect, test } from "playwright/test";

/**
 * E2E · Events → RSVP
 *
 * Walks the core Soirées flow: browse /events → click a card → submit
 * RSVP. We don't assert a specific event (seed data changes), just that
 * the list renders at least one card and the RSVP button transitions
 * from inert to confirmed.
 */
const EMAIL = process.env.E2E_TEST_EMAIL ?? "zoe.martin@cesoir.app";
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

test.describe("events rsvp", () => {
  test.skip(!PASSWORD, "E2E_TEST_PASSWORD not set — skipping in local/unauthed runs");

  test.beforeEach(async ({ page }) => {
    // Log in once per test — tokens live on cookies so subsequent nav is authed.
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(EMAIL);
    await page.getByLabel(/mot de passe|password/i).fill(PASSWORD);
    await Promise.all([
      page.waitForURL(/\/feed(\/|$|\?)/, { timeout: 15_000 }),
      page.getByRole("button", { name: /se connecter|connexion|sign in|login/i }).click(),
    ]);
  });

  test("browse /events and RSVP to the first card", async ({ page }) => {
    await page.goto("/events");

    // At least one event card should render. Use a generous selector so
    // a minor component rename doesn't break the test.
    const card = page.locator("[data-testid='event-card'], a[href^='/events/']").first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await card.click();
    await expect(page).toHaveURL(/\/events\//);

    // RSVP button — matches "RSVP", "Je viens", "Participer" variants.
    const rsvpBtn = page
      .getByRole("button", { name: /rsvp|je viens|participer|going|interested/i })
      .first();
    await expect(rsvpBtn).toBeVisible({ timeout: 10_000 });

    const initialText = (await rsvpBtn.textContent())?.trim() ?? "";
    await rsvpBtn.click();

    // After click, the button text should flip (confirmed / enrolled / cancel).
    // 5 s tolerance for the POST round-trip.
    await expect(async () => {
      const nowText = (await rsvpBtn.textContent())?.trim() ?? "";
      expect(nowText).not.toBe(initialText);
    }).toPass({ timeout: 8_000 });
  });
});

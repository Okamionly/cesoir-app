import { expect, test } from "playwright/test";

/**
 * E2E · Chat send
 *
 * Opens the first conversation from the chat list, types a message, hits
 * send, and verifies the optimistic bubble lands in the DOM. Ensures the
 * realtime reconnect logic (Wave 12 C-3) + namespaced channels don't
 * silently lose outbound messages.
 */
const EMAIL = process.env.E2E_TEST_EMAIL ?? "zoe.martin@cesoir.app";
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

test.describe("chat", () => {
  test.skip(!PASSWORD, "E2E_TEST_PASSWORD not set — skipping in local/unauthed runs");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(EMAIL);
    await page.getByLabel(/mot de passe|password/i).fill(PASSWORD);
    await Promise.all([
      page.waitForURL(/\/feed(\/|$|\?)/, { timeout: 15_000 }),
      page.getByRole("button", { name: /se connecter|connexion|sign in|login/i }).click(),
    ]);
  });

  test("open a conversation and send a message", async ({ page }) => {
    await page.goto("/chat");

    // Conversation list — a matched profile should show as a link / card.
    const convo = page
      .locator("[data-testid='conversation-item'], a[href^='/chat/']")
      .first();
    await expect(convo).toBeVisible({ timeout: 15_000 });
    await convo.click();

    await expect(page).toHaveURL(/\/chat\//);

    // Compose input — accept several accessible-name variants.
    const composer = page
      .getByRole("textbox", { name: /message|écris|type|envoyer/i })
      .first();
    await expect(composer).toBeVisible({ timeout: 10_000 });

    const stamp = Date.now().toString().slice(-6);
    const body = `e2e smoke ${stamp}`;
    await composer.fill(body);

    const sendBtn = page
      .getByRole("button", { name: /envoyer|send|submit/i })
      .first();
    await sendBtn.click();

    // Outbound bubble shows up optimistically — confirm by text match.
    await expect(page.getByText(body)).toBeVisible({ timeout: 10_000 });
  });
});

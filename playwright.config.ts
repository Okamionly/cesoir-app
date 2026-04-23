import { defineConfig, devices } from "playwright/test";

/**
 * Playwright config — E2E smoke suite.
 *
 * Runs against a production-like `next start` server (via `webServer`) so
 * we exercise the same route handlers + middleware + headers CI will ship.
 *
 * Browsers: Chromium desktop + WebKit mobile (iOS emulation) — covers the
 * primary PWA surface (iPhone Safari is where the install prompt matters
 * most). Firefox is intentionally omitted — we'll add it when we move
 * beyond smoke tests.
 *
 * Required env for CI (skipped locally if absent):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - E2E_TEST_EMAIL       — a real profile (e.g. seeded `zoe.martin@cesoir.app`)
 *   - E2E_TEST_PASSWORD    — password for that profile
 */
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 1 worker locally (avoid Supabase rate limits); CI gets half the cores.
  workers: process.env.CI ? "50%" : 1,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Limit payload size logged on failure — Supabase responses can be huge.
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 14"] },
    },
  ],

  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: BASE_URL,
    // Build is the CI job prerequisite; dev server boots fast locally.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

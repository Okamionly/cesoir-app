# Contributing to cesoir-app

Short version: open a PR against `main`, wait for green CI, wait for a review,
then your change ships. This file documents the guardrails so you don't have
to guess.

---

## Branch protection (main)

`main` is protected on GitHub with the following rules. These are **not**
optional — the settings are mirrored by `.github/workflows/ci.yml` but
the human guard is the branch protection config.

| Rule | Value |
|---|---|
| Require a pull request before merging | ✅ |
| Require approvals | 1 (code owner preferred) |
| Dismiss stale reviews on new commits | ✅ |
| Require status checks to pass | ✅ — see below |
| Require branches to be up to date | ✅ |
| Require conversation resolution | ✅ |
| Require signed commits | ✅ |
| Do not allow bypassing (incl. admins) | ✅ |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

### Required status checks

All of these must be green before merge:

- **CI · Lint · Types · Test · Build** — `ci.yml > lint-types-test-build`
- **CI · Supabase types drift guard** — `ci.yml > db-types-drift`
- **CI · E2E (Playwright)** — `ci.yml > e2e`
- **Secret scan · Gitleaks** — `secret-scan.yml > gitleaks`

Set these checks as required under **Settings → Branches → main →
Require status checks**. Exact names must match the `name:` field on
each workflow / job.

---

## Local workflow

```bash
# First time
npm ci
cp .env.local.example .env.local   # ask a maintainer for the real values

# While coding
npm run dev                         # Next.js dev server
npm run test                        # Vitest (watch)
npx tsc --noEmit                    # type check

# Before pushing
npm run lint
npm run test:run                    # Vitest (CI mode)
npm run build                       # Next.js production build
```

E2E smoke suite (optional locally, **required in CI**):

```bash
npx playwright install chromium webkit        # first time
npm run e2e                                    # runs tests/e2e/**
```

---

## Commit hygiene

- Conventional-commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`, `perf:`, `build:`, `ci:`.
- Keep commits focused. Squash-merge is the default on GitHub.
- Never push unsigned commits to `main`. CI rejects them.
- Never commit `.env*`, credentials, or test-account passwords. The
  secret scan will catch common patterns; that's a safety net, not a
  license to be sloppy.

---

## What NOT to do

- Do **not** push directly to `main` (enforced by branch protection).
- Do **not** `git push --force` on `main` or on any branch under review.
- Do **not** skip hooks (`--no-verify`) or signing (`--no-gpg-sign`)
  without explicit approval from a maintainer.
- Do **not** merge a PR with a failing CI check — even "flaky" ones.
  Retry the check, or fix it.
- Do **not** regenerate Supabase types without committing the result.
  The `db-types-drift` job will fail the PR otherwise.

---

## Reporting issues

Security issues: email the maintainer directly, do not open a public issue.
Everything else: use GitHub issues with the appropriate label.

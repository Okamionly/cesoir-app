# Wave 16/17 Migrations — Push to Prod Checklist

**Project:** cesoir-app
**Target Supabase:** ycyxmvzilzkusecpgvbi (eu-west-3)
**Audit date:** 2026-05-05
**Last prod baseline assumed:** mig 025 (`invite_rewards_hybrid`)
**To push:** mig **026 → 048** (23 migrations)

---

## 1. Migrations to Push (in numeric order)

Migrations are designed to apply sequentially. Numeric order is also the **only valid push order** because of RPC + table dependencies (see §2).

| #   | Name                          | Tables / objects affected                                          | Type          | Depends on              | Risk |
|-----|-------------------------------|--------------------------------------------------------------------|---------------|-------------------------|------|
| 026 | distance_from_grid            | RPC `nearby_profiles` (DROP+RECREATE 8-arg)                        | rpc           | 024                     | YEL  |
| 027 | fix_events_seed_photos        | UPDATE `events` (1 row, idempotent WHERE)                          | data fix      | 020                     | GRN  |
| 028 | avatar_bucket_security        | `storage.buckets.avatars` flip public→private + 4 storage policies | storage       | 003                     | RED  |
| 029 | push_subscriptions            | CREATE TABLE `push_subscriptions` + RLS                            | additive      | —                       | GRN  |
| 030 | availability_broadcast        | ADD COLUMN `profiles.broadcast_until` + RPC `nearby_profiles` v2   | rpc + col     | 026                     | YEL  |
| 031 | voice_messages                | ADD COLUMN `messages.voice_*` + bucket `voice-messages` + 3 pols    | storage + col | —                       | YEL  |
| 032 | irl_confirmations             | CREATE TABLE `irl_confirmations` + RLS                             | additive      | conversations           | GRN  |
| 033 | push_triggers                 | EXT `pg_net` + fns `send_push_notification` / trigger `messages`   | trigger       | 029, pg_net             | RED  |
| 034 | push_last_call_log            | CREATE TABLE `push_last_call_log` + RPC `events_nearby_in_window`  | additive+rpc  | 019 (events)            | GRN  |
| 035 | icebreakers_cache             | CREATE TABLE `icebreakers_cache` + RLS                             | additive      | —                       | GRN  |
| 036 | profile_prompts               | CREATE TABLE `profile_prompts` + RLS + fn `set_updated_at`         | additive      | —                       | GRN  |
| 037 | user_streaks                  | CREATE TABLE `user_streaks` + RLS (NEW table, NOT legacy `streaks`)| additive      | —                       | GRN  |
| 038 | message_read_receipts         | ADD COLUMN `profiles.read_receipts_enabled` + RPC `mark_messages_read` | rpc + col | messages.read_at exists | YEL  |
| 039 | nightly_vibe                  | ADD COL `profiles.vibe_today`/`vibe_set_at` + CHECK + RPC          | additive+rpc  | —                       | GRN  |
| 040 | travel_passport               | ADD 5 cols `profiles.passport_*` + RPC `nearby_profiles` v3        | rpc + col     | 030                     | YEL  |
| 041 | crystal_ball                  | CREATE TABLE `crystal_ball_matches` + RLS + generator RPC          | additive      | —                       | GRN  |
| 042 | qr_checkins                   | CREATE TABLE `qr_checkins` + ADD COL `achievements.meta` + RPC     | additive      | 002 (achievements), 032 | GRN  |
| 043 | event_rsvp_match_trigger      | CREATE TABLE `plan_suggestions` + AFTER INSERT trigger on RSVP     | trigger       | 019, flash_plans        | YEL  |
| 044 | wingman_invites               | ADD 2 cols `flash_plans.wingman_*` + CREATE TABLE `wingman_invites`| additive      | flash_plans             | GRN  |
| 045 | anti_ghost_decay              | CREATE TABLE `ghost_penalties` + RPC `apply_ghost_decay`           | additive+rpc  | conversations, plans    | GRN  |
| 046 | mastery_tiers                 | RPC `compute_mastery_tier` + AFTER INSERT trigger on `irl_confirmations` | trigger | 032, 002 (achievements) | YEL  |
| 047 | moments                       | CREATE TABLE `moments` + private bucket `moments` + RLS            | storage       | matches view            | YEL  |
| 048 | saved_searches                | CREATE TABLE `saved_searches` + per-surface cap trigger            | additive      | —                       | GRN  |

**Categorisation totals:** 12 GRN (pure additive) · 8 YEL (RPC swap or storage) · 3 RED (cross-cutting).

---

## 2. Push Order — Bloc or Staged?

**Recommendation: push the whole block 026→048 in one `supabase db push` run.**

Reasons:
- Numeric ordering matches the actual dependency DAG (no skips, no cycles).
- `nearby_profiles` is rewritten 3× (026 → 030 → 040). Each migration `DROP FUNCTION` then `CREATE OR REPLACE` with the same 8-arg signature, so the **last one wins** even if pushed atomically. Clients calling `nearby_profiles()` keep working at every intermediate state.
- `irl_confirmations` is created in 032 and referenced by 042 + 046 — sequential push covers it.
- `pg_net` is `CREATE EXTENSION IF NOT EXISTS` in 033. On Supabase prod, **pg_net is enabled by default**. Verify via dashboard → Database → Extensions before push (1 click).

**Two-pass option** (only if you want to reduce blast radius):
- **Pass A — additive only (GRN):** 027, 029, 032, 034, 035, 036, 037, 039, 041, 042, 044, 045, 048. Zero risk, ship anytime.
- **Pass B — RPC + storage + triggers (YEL/RED):** 026, 028, 030, 031, 033, 038, 040, 043, 046, 047. Push during low-traffic window (use the 02:00–06:00 ET dead zone — your trading killzone reference).

---

## 3. Risk Detail (RED migrations)

### 028 — Avatar bucket flip to PRIVATE (RED)
- **What breaks:** every `https://<project>.supabase.co/storage/v1/object/public/avatars/...` URL returns **401**.
- **Affected surfaces:**
  - OG image route `/p/[id]/opengraph-image.tsx` → falls back to ui-avatars.com placeholder (acceptable per migration comment).
  - Any cached email / external embed using the public URL.
- **Mitigation:** ensure `PhotoUpload.tsx` and chat thumbnails call `getPublicUrl()` from an authenticated session (now goes through RLS gate transparently). Smoke-test before declaring success.
- **Rollback:** `UPDATE storage.buckets SET public = true WHERE id = 'avatars';` then re-run migration 003 to restore old policy. **Avatar binaries already uploaded stay accessible** — no data loss.

### 033 — Push trigger on `messages` (RED)
- **What breaks:** if `pg_net` is disabled OR `app.push_send_url`/`app.push_internal_secret` settings are unset, the trigger silently no-ops (defensive `IF send_url IS NULL …` early return). **Will not fail INSERTs.**
- **Pre-push action required:**
  ```sql
  ALTER DATABASE postgres SET app.push_send_url        TO 'https://cesoir.app/api/push/send';
  ALTER DATABASE postgres SET app.push_internal_secret TO '<value of PUSH_INTERNAL_SECRET>';
  ```
  Run these AFTER deploying the Vercel side (env vars + `/api/push/send` route live), otherwise pushes will hit a 404.
- **Rollback:** `DROP TRIGGER trg_new_message_push ON messages; DROP FUNCTION on_new_message_send_push(); DROP FUNCTION send_push_notification(uuid, jsonb);`. INSERTs continue normally.

### 026 / 030 / 040 — `nearby_profiles` chain (3× RPC swap)
- **Risk:** mid-push, a client could call the function between two `DROP FUNCTION` and `CREATE OR REPLACE`. Window is sub-second per migration in a single transaction.
- **Mitigation:** each migration wraps DDL in `BEGIN;…COMMIT;` — the function is invisible only inside that one transaction. PostgREST callers get a transient 404 at worst; the hook in `useProfiles.ts` already retries on Supabase errors.
- **Signature stability:** all 3 versions share `(FLOAT, FLOAT, FLOAT, TEXT, TEXT, INTEGER, INTEGER, INTEGER)` — no client code change needed.

---

## 4. Env Vars / Secrets Required in Prod

Variables needed BEFORE pushing 033 (push trigger) and BEFORE features become functional:

| Variable                         | Required by              | Where to set                  | Without it                                 |
|----------------------------------|--------------------------|-------------------------------|--------------------------------------------|
| `SUPABASE_SERVICE_ROLE_KEY`      | `/api/push/send`, crons  | Vercel + GH Actions           | Push fan-out fails silently                |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`   | Service worker subscribe | Vercel (NEXT_PUBLIC_)         | UI can't request permission                |
| `VAPID_PUBLIC_KEY`               | `web-push` lib server    | Vercel                        | `/api/push/send` 500s                      |
| `VAPID_PRIVATE_KEY`              | `web-push` lib server    | Vercel (secret)               | `/api/push/send` 500s                      |
| `VAPID_SUBJECT`                  | `web-push` headers       | Vercel                        | Mozilla push gateway 400                   |
| `PUSH_INTERNAL_SECRET`           | trigger ↔ /api/push auth | Vercel + Postgres (`ALTER DATABASE`) | Trigger no-ops silently            |
| `ANTHROPIC_API_KEY`              | `/api/chat/icebreakers`  | Vercel                        | Icebreakers feature returns empty array    |
| `STRIPE_SECRET_KEY`              | Stripe routes            | Vercel                        | Existing — already prod                    |
| `STRIPE_WEBHOOK_SECRET`          | Stripe webhook           | Vercel                        | Existing — already prod                    |

**Links:**
- Vercel project env: https://vercel.com/dashboard → cesoir-app → Settings → Environment Variables
- Supabase project SQL: https://supabase.com/dashboard/project/ycyxmvzilzkusecpgvbi/sql/new
- Supabase Database → Extensions: confirm `pg_net` is ENABLED (default on Supabase paid tier; verify on free).

**Features gracefully degraded if a secret is missing:**
- ANTHROPIC missing → `icebreakers_cache` stays empty, UI shows fallback chips (per `.env.sample` design).
- VAPID/PUSH missing → message INSERTs still work, just no notification fan-out.
- Voice messages: no env required — uses Supabase Storage signed URLs only.
- Travel passport, vibe, prompts, streaks, moments, saved searches, crystal ball: zero new env required.

---

## 5. Migration-by-Migration Risk Color Code

- **GRN** (push anytime, no client coordination): 027, 029, 032, 034, 035, 036, 037, 039, 041, 042, 044, 045, 048
- **YEL** (RPC/RLS swap or storage write — coordinate with deploy): 026, 030, 031, 038, 040, 043, 046, 047
- **RED** (cross-cutting, needs env or breaks public URL): 028, 033

---

## 6. Pre-push Checklist

- [ ] `pg_net` enabled in Supabase Dashboard → Database → Extensions
- [ ] All env vars in §4 set in Vercel **Production** (not just Preview)
- [ ] `/api/push/send` route deployed in cesoir.app prod
- [ ] Run `ALTER DATABASE postgres SET app.push_send_url …` + `app.push_internal_secret`
- [ ] Snapshot DB (Supabase Dashboard → Database → Backups → "Create on-demand backup")
- [ ] Pick a 30 min low-traffic window (≥ 23h00 Europe/Paris)
- [ ] Tag a release `vWave17-pre-migration` in git for fast rollback

## 7. Push Plan (recommended)

```bash
# 1. Verify migration list
supabase db diff --linked --schema public

# 2. Dry run (read-only)
supabase db push --linked --dry-run

# 3. Push the lot
supabase db push --linked

# 4. Apply Postgres settings for push trigger (mig 033)
supabase db execute --linked "ALTER DATABASE postgres SET app.push_send_url TO 'https://cesoir.app/api/push/send'"
supabase db execute --linked "ALTER DATABASE postgres SET app.push_internal_secret TO '${PUSH_INTERNAL_SECRET}'"
```

## 8. Rollback Strategy

- **Per-migration:** each migration has a "Rollback" comment block. For RPC migrations, re-applying the previous numbered migration restores the prior signature.
- **Nuclear:** restore the on-demand backup from §6.
- **028 only:** `UPDATE storage.buckets SET public = true WHERE id = 'avatars';` restores public URLs (binaries kept).
- **033 only:** `DROP TRIGGER trg_new_message_push ON messages;` stops the fan-out without touching messages.

---

## 9. Post-push Smoke Tests (in order)

1. **Auth still works** — sign in as `Mr.guessousyoussef@gmail.com`, /profile loads avatar (proves 028 + getPublicUrl in authed context).
2. **/browse renders profiles** — proves `nearby_profiles` v3 (mig 040) returns `passport_active`/`broadcast_active` columns.
3. **Send a message in /chat** — message appears in real-time + (if VAPID set) push lands on a subscribed device. Check Postgres logs for `pg_net` errors.
4. **/profile prompts editor** — write 3 prompts, save, reload, see them on own SwipeCard preview.
5. **Streak badge** — open app once, badge increments to 1; reopen tomorrow, increments to 2.
6. **Voice message** — record a 3s clip in chat, peer can play it (proves 031 bucket + RLS).
7. **Vibe picker** — set "festif" on /profile, see chip on own card; midnight UTC test → cleared next day.
8. **Saved search** — create one on /events with a filter, reload, click chip → filters reapply.
9. **Crystal Ball generator** — call RPC manually as service-role: `SELECT generate_daily_crystal_ball();` and check rows land in `crystal_ball_matches`.
10. **Push trigger smoke** — INSERT a fake message via SQL editor with service role → check `net.http_request_queue` for outgoing POST to `/api/push/send`.

If any of 1-4 fail, **rollback immediately** — they map to features the user touches in their first 30s of session.

---

**Files referenced:**
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/supabase/migrations/026_distance_from_grid.sql` … `048_saved_searches.sql`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/.env.sample`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/audit/round4/WAVE-16-PUSH-NOTIFS.md`

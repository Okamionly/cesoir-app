-- ═══════════════════════════════════════════════════════════════════
-- Migration 029 — Web Push subscriptions table (Wave 16 — Bet #4)
--
-- One row per (user_id, endpoint). The endpoint is the unique URL
-- returned by `pushManager.subscribe()` and is what `web-push` needs
-- to deliver a notification. p256dh + auth are the encryption keys
-- pulled out of `subscription.toJSON().keys`.
--
-- RLS:
--   - Users can SELECT / INSERT / DELETE only their own rows
--   - The /api/push/send route uses the service role key, which
--     bypasses RLS, to read endpoints when fan-ing out a push
--   - Account deletion (api/account/delete/route.ts) cascades
--     automatically via the FK ON DELETE CASCADE
--
-- Indexes:
--   - idx_push_subscriptions_user (user_id) — fast lookup when
--     reading every device for one user before sending a push
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh       TEXT NOT NULL, -- public key from subscription.toJSON().keys.p256dh
  auth         TEXT NOT NULL, -- auth secret from subscription.toJSON().keys.auth
  user_agent   TEXT,          -- diagnostic only (Chrome/Safari/Firefox version)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- Endpoint alone is not globally unique across users (different sessions on
-- the same device can in theory mint similar endpoints), but per (user_id,
-- endpoint) the upsert from /api/push/subscribe must collapse to one row.

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_id);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_push_subscriptions"   ON push_subscriptions;
DROP POLICY IF EXISTS "users_insert_own_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "users_delete_own_push_subscriptions" ON push_subscriptions;

CREATE POLICY "users_read_own_push_subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_push_subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_push_subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE push_subscriptions IS
  'Web push subscription endpoints (Wave 16 Bet #4). One row per device.
   Written by /api/push/subscribe (Bearer auth) and read by sendPushToUser
   in src/lib/push/sendPush.ts via service-role to fan out to every device
   for a user. Stale endpoints (404/410 from FCM/APNs/Mozilla) are deleted
   automatically by sendPushToUser.';

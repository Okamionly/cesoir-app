-- ═══════════════════════════════════════════════════════════════════
-- Migration 033 — Push notification trigger for new messages
-- (Wave 16 — Bet #4)
--
-- Background:
--   - Match notifications are fired server-side from the swipe API
--     route (src/app/api/swipe/route.ts → sendPushToUser).
--   - Messages, however, are inserted client-side by useChat.sendMessage
--     using the Supabase JS client (RLS-enforced). There is no API
--     route to hook into, so we fire the push from the database itself
--     via a Postgres trigger that POSTs to /api/push/send.
--
-- Required Postgres settings (run ONCE per environment, NOT in this
-- migration so engineers can flip URL between staging/prod without
-- editing SQL):
--   ALTER DATABASE postgres SET app.push_send_url        TO 'https://cesoir.app/api/push/send';
--   ALTER DATABASE postgres SET app.push_internal_secret TO '<value of PUSH_INTERNAL_SECRET>';
-- The trigger NO-OPs if either setting is missing — safe for fresh
-- branches / preview DBs that don't have push wired yet.
--
-- Required Vercel env vars:
--   - PUSH_INTERNAL_SECRET   (matches the Postgres setting above)
--   - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
--   - SUPABASE_SERVICE_ROLE_KEY
--   - NEXT_PUBLIC_SUPABASE_URL
--
-- Extension dependency: pg_net (already enabled by 002_new_features.sql
-- in this project; we still CREATE EXTENSION IF NOT EXISTS as a guard).
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Helper: POST a push payload to /api/push/send ──────────────────
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_payload JSONB
) RETURNS VOID AS $$
DECLARE
  send_url TEXT := current_setting('app.push_send_url', true);
  secret   TEXT := current_setting('app.push_internal_secret', true);
BEGIN
  IF send_url IS NULL OR secret IS NULL OR send_url = '' OR secret = '' THEN
    -- Settings missing — preview branch / dev DB. Skip silently.
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := send_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-internal-secret', secret
               ),
    body    := jsonb_build_object('user_id', p_user_id, 'payload', p_payload)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_push_notification(UUID, JSONB) IS
  'Wave 16 Bet #4 — fires a push notification by POSTing to the Next.js
   /api/push/send route via pg_net. NO-OPs if app.push_send_url or
   app.push_internal_secret postgres settings are unset.';

-- ─── Trigger: new chat message → push to recipient ──────────────────
CREATE OR REPLACE FUNCTION on_new_message_send_push() RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name  TEXT;
  prefs        JSONB;
  preview      TEXT;
BEGIN
  -- The recipient is "the other user" in the conversation.
  SELECT
    CASE
      WHEN c.user_a = NEW.sender_id THEN c.user_b
      ELSE c.user_a
    END
  INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Defensive: don't notify the sender themselves.
  IF recipient_id IS NULL OR recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  -- Honor user_settings.notifications_prefs.messages = false if present.
  -- The table is created in earlier migrations; if the row doesn't
  -- exist yet we treat it as "all notifications on" (default).
  BEGIN
    SELECT notifications_prefs INTO prefs
    FROM user_settings
    WHERE user_id = recipient_id;

    IF prefs IS NOT NULL AND (prefs->>'messages')::boolean = false THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    -- Older schemas without notifications_prefs — push everything.
    NULL;
  END;

  SELECT name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  preview := LEFT(COALESCE(NEW.content, ''), 80);

  PERFORM send_push_notification(
    recipient_id,
    jsonb_build_object(
      'title',   COALESCE(sender_name, 'Nouveau message'),
      'body',    preview,
      'tag',     'cesoir-message',
      'url',     '/chat/' || NEW.conversation_id,
      'chatUrl', '/chat/' || NEW.conversation_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_message_push ON messages;

CREATE TRIGGER trg_new_message_push
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION on_new_message_send_push();

COMMENT ON TRIGGER trg_new_message_push ON messages IS
  'Wave 16 Bet #4 — fires a web push to the message recipient.
   Skips if the recipient has notifications_prefs.messages = false.
   No-op if push env / postgres settings are not configured.';

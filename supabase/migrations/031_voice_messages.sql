-- ═══════════════════════════════════════════════════════════════════
-- Migration 031 — Voice messages in chat
--
-- Adds two nullable columns to `messages` so the same row can carry
-- either a text body, a voice clip, or both. Voice-only messages have
-- `content = ''` (the column is NOT NULL from the original schema —
-- we keep it that way and use empty string as the voice-only sentinel)
-- with `voice_url` + `voice_duration_ms` populated.
--
-- Also creates a PRIVATE storage bucket `voice-messages` with RLS so:
--   - Only authenticated users in the same conversation can read clips
--   - A user can only upload into `<userId>/...` (their own folder)
--   - 1MB per-file cap enforced server-side via bucket file_size_limit
--
-- Read flow:
--   Client calls `supabase.storage.from('voice-messages').createSignedUrl(path, 3600)`
--   to mint a 1h pre-signed URL each time a voice bubble mounts.
--   We deliberately do NOT use `getPublicUrl` because the bucket is
--   private — the gateway would 401 even for authenticated users
--   unless the SELECT RLS policy specifically grants access.
--
-- Why store in `messages` rather than a sidecar `voice_messages` table:
--   Keeps the realtime subscription on `messages` as the single source
--   of truth for the chat timeline. A sidecar would require a second
--   subscription and a join on every message render.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Schema additions to `messages` ──────────────────────────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS voice_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_duration_ms INTEGER;

-- Sanity constraint: if a voice clip is referenced, duration must be > 0
-- and within the 60s hard cap enforced client-side. Defensive — protects
-- against a buggy client uploading a 10-minute clip.
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_voice_duration_range;

ALTER TABLE messages
  ADD CONSTRAINT messages_voice_duration_range
  CHECK (
    voice_duration_ms IS NULL
    OR (voice_duration_ms > 0 AND voice_duration_ms <= 65000)
  );

-- Sanity constraint: voice_url and voice_duration_ms travel together.
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_voice_pair;

ALTER TABLE messages
  ADD CONSTRAINT messages_voice_pair
  CHECK (
    (voice_url IS NULL AND voice_duration_ms IS NULL)
    OR (voice_url IS NOT NULL AND voice_duration_ms IS NOT NULL)
  );

-- Permissive content rule: voice-only messages carry an empty body but
-- the original column stays NOT NULL. No schema change needed — clients
-- send `content: ''` when the message is voice-only.

COMMENT ON COLUMN messages.voice_url IS
  'Storage path inside the `voice-messages` bucket (e.g. `<senderId>/<uuid>.webm`). '
  'NOT a full URL — the client mints a signed URL on read via createSignedUrl(path, 3600). '
  'Null for text-only messages.';

COMMENT ON COLUMN messages.voice_duration_ms IS
  'Duration of the voice clip in milliseconds. Hard cap 65000 (60s + 5s safety). '
  'Null for text-only messages. Travels with voice_url (paired CHECK constraint).';

-- ─── 2. Storage bucket `voice-messages` (private, 1MB cap) ──────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  false,                                   -- PRIVATE — RLS-gated reads only
  1048576,                                 -- 1 MB hard cap (enforced by Supabase Storage)
  ARRAY['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 3. RLS policies on storage.objects for `voice-messages` ────────
-- INSERT: user can only upload into their own folder `<userId>/...`
DROP POLICY IF EXISTS "Voice messages: own folder insert" ON storage.objects;
CREATE POLICY "Voice messages: own folder insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-messages'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: user can only delete clips in their own folder (cleanup on
-- account delete + future "unsend" UX).
DROP POLICY IF EXISTS "Voice messages: own folder delete" ON storage.objects;
CREATE POLICY "Voice messages: own folder delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-messages'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: a user can read a clip if they are a participant of the
-- conversation that referenced it. We resolve the link by joining
-- `messages.voice_url` against the storage object name.
--
-- Naming convention enforced client-side AND in this policy:
--   `<senderId>/<conversationId>/<uuid>.webm`
-- The middle segment (folder index [2]) is the conversation id, which
-- we use to verify the reader is a participant via the `conversations`
-- table.
--
-- Why two folder levels: it lets the SELECT policy be a pure SQL check
-- (no need to scan the `messages` table on every read) and supports
-- per-conversation cleanup if a chat is deleted.
DROP POLICY IF EXISTS "Voice messages: participants read" ON storage.objects;
CREATE POLICY "Voice messages: participants read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-messages'
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

COMMENT ON TABLE storage.objects IS
  'Storage objects. Buckets with custom RLS: avatars (028, private, '
  'authenticated read + own-folder write), voice-messages (031, '
  'private, participants read + own-folder write, 1MB cap, opus/webm).';

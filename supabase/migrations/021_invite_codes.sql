-- ========================================================================
-- Migration 021: Invite codes (invite-gated signup for first 3 months)
-- ========================================================================
-- Wave 15 · CRO 10/10 — Strategy memo 2026-04-23:
--   Launch is invite-only for the first quarter to manufacture scarcity.
--   Each new user receives 3 invite codes on signup, viewable in
--   /profile/invites. Before a user can register, they must present a valid
--   code. When they do, the code is claimed (used_by + used_at set) and 3
--   new codes are minted for them.
--
-- Design decisions:
--   - codes are PRIMARY KEY (short random ASCII, e.g. 8 chars). Uniqueness
--     enforced at the DB level; client picks the value and the DB rejects
--     collisions via an upsert on conflict do nothing.
--   - used_by is UNIQUE so a user can never claim two different codes.
--   - expires_at defaults to 30 days in the future (stale codes die so the
--     supply doesn't accumulate forever).
--   - Claiming uses a RPC `claim_invite_code(p_code text)` so the auth-gated
--     UPDATE runs with the caller's auth.uid() — never trust client to
--     insert the `used_by` row directly.
--   - View `v_invite_waitlist_count` exposes the public waitlist counter
--     without leaking any PII.
-- ========================================================================

CREATE TABLE public.invite_codes (
  code        TEXT PRIMARY KEY,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by     UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invite_codes_used_integrity CHECK (
    (used_by IS NULL AND used_at IS NULL) OR
    (used_by IS NOT NULL AND used_at IS NOT NULL)
  )
);

COMMENT ON TABLE public.invite_codes IS 'Invite codes for scarcity-gated signup (first 3 months). Each user gets 3 codes on register.';
COMMENT ON COLUMN public.invite_codes.created_by IS 'User who minted this code. NULL for system-seeded codes (founder team).';
COMMENT ON COLUMN public.invite_codes.used_by IS 'User who claimed this code during register. UNIQUE to prevent double-claim.';
COMMENT ON COLUMN public.invite_codes.expires_at IS 'Unused codes die 30 days after mint. Claimed codes keep their row forever (audit trail).';

CREATE INDEX idx_invite_codes_created_by_unused
  ON public.invite_codes (created_by)
  WHERE used_by IS NULL;

CREATE INDEX idx_invite_codes_unused_active
  ON public.invite_codes (expires_at)
  WHERE used_by IS NULL;

-- ---- RLS ----

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- A user may read the codes they minted (so /profile/invites renders their
-- 3 codes) and the code they themselves claimed (so the register success
-- screen can echo it back).
CREATE POLICY "Users read own codes"
  ON public.invite_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = used_by);

-- Inserts happen through the server (service_role) side on register. We
-- intentionally leave no INSERT/UPDATE policy for authenticated users —
-- client code must go through the RPC.

-- ---- RPC: claim_invite_code ----

CREATE OR REPLACE FUNCTION public.claim_invite_code(p_code TEXT)
RETURNS TABLE (
  code        TEXT,
  claimed_by  UUID,
  claimed_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_code_row public.invite_codes%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'Code required' USING ERRCODE = '22023';
  END IF;

  -- Case-insensitive match on the code
  SELECT * INTO v_code_row
    FROM public.invite_codes
   WHERE upper(code) = upper(trim(p_code))
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid code' USING ERRCODE = 'P0001';
  END IF;

  IF v_code_row.used_by IS NOT NULL THEN
    RAISE EXCEPTION 'Code already claimed' USING ERRCODE = 'P0002';
  END IF;

  IF v_code_row.expires_at < now() THEN
    RAISE EXCEPTION 'Code expired' USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.invite_codes
     SET used_by = v_caller,
         used_at = now()
   WHERE code = v_code_row.code;

  RETURN QUERY
    SELECT v_code_row.code, v_caller, now();
END;
$$;

COMMENT ON FUNCTION public.claim_invite_code(TEXT) IS 'Atomically claims an invite code for the authenticated caller. Raises on invalid/used/expired.';

GRANT EXECUTE ON FUNCTION public.claim_invite_code(TEXT) TO authenticated;

-- ---- RPC: mint_user_invite_codes ----

CREATE OR REPLACE FUNCTION public.mint_user_invite_codes(p_count INT DEFAULT 3)
RETURNS TABLE (
  code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_existing INT;
  v_new_code TEXT;
  v_attempts INT := 0;
  v_count INT := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_count IS NULL OR p_count < 1 OR p_count > 10 THEN
    RAISE EXCEPTION 'Count must be 1..10' USING ERRCODE = '22023';
  END IF;

  -- Cap per user : we never mint more than 3 unused codes at a time.
  SELECT count(*) INTO v_existing
    FROM public.invite_codes
   WHERE created_by = v_caller
     AND used_by IS NULL
     AND expires_at > now();

  IF v_existing >= 3 THEN
    RETURN QUERY
      SELECT c.code
        FROM public.invite_codes c
       WHERE c.created_by = v_caller
         AND c.used_by IS NULL
         AND c.expires_at > now();
    RETURN;
  END IF;

  WHILE v_count < LEAST(p_count, 3 - v_existing) LOOP
    v_attempts := v_attempts + 1;
    -- 8-char uppercase alphanumeric. Omit O/0/I/1 for legibility.
    v_new_code := upper(substring(
      translate(encode(gen_random_bytes(8), 'hex'), 'oOi1l0', 'ABCDEF')
      FROM 1 FOR 8
    ));

    BEGIN
      INSERT INTO public.invite_codes (code, created_by)
        VALUES (v_new_code, v_caller);
      v_count := v_count + 1;
    EXCEPTION WHEN unique_violation THEN
      -- collision — retry up to 20 times then bail
      IF v_attempts > 20 THEN
        RAISE EXCEPTION 'Could not mint unique code after 20 retries';
      END IF;
    END;
  END LOOP;

  RETURN QUERY
    SELECT c.code
      FROM public.invite_codes c
     WHERE c.created_by = v_caller
       AND c.used_by IS NULL
       AND c.expires_at > now();
END;
$$;

COMMENT ON FUNCTION public.mint_user_invite_codes(INT) IS 'Mints invite codes for caller, up to a cap of 3 unused. Idempotent (no-op if cap reached).';

GRANT EXECUTE ON FUNCTION public.mint_user_invite_codes(INT) TO authenticated;

-- ---- Waitlist counter view ----
-- Public counter — number of signed-up users. Surfaced on the landing.
-- NB: `auth.users` row count would leak — instead we count public.profiles
-- which is the post-onboarding user set.

CREATE OR REPLACE VIEW public.v_waitlist_count
WITH (security_invoker = true) AS
  SELECT count(*)::INT AS signed_up FROM public.profiles;

COMMENT ON VIEW public.v_waitlist_count IS 'Public counter of onboarded users. Shown on the landing "N Montpelliérains inscrits".';

GRANT SELECT ON public.v_waitlist_count TO anon, authenticated;

-- ---- Seed the founder's codes ----
-- 5 bootstrapping codes so the founder can invite the first cohort manually.
-- Once these are distributed, every new user self-generates 3 more on signup.
-- Codes are intentionally fixed/readable so they can be shared verbally.

INSERT INTO public.invite_codes (code, created_by, expires_at)
VALUES
  ('CESOIR01', NULL, now() + INTERVAL '365 days'),
  ('CESOIR02', NULL, now() + INTERVAL '365 days'),
  ('CESOIR03', NULL, now() + INTERVAL '365 days'),
  ('CESOIR04', NULL, now() + INTERVAL '365 days'),
  ('CESOIR05', NULL, now() + INTERVAL '365 days'),
  ('EARLYMOON', NULL, now() + INTERVAL '365 days'),
  ('MOONWALK', NULL, now() + INTERVAL '365 days')
ON CONFLICT DO NOTHING;

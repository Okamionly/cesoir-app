-- Migration 051: lifecycle_emails_log
-- Tracks D1/D3/D7 retention emails sent to users.
-- UNIQUE constraint on (user_id, email_type, day) ensures idempotency:
-- re-running the cron in the same UTC day for the same user+type is a silent no-op.

create table if not exists lifecycle_emails_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email_type   text not null check (email_type in ('d1_no_swipe', 'd3_no_match', 'd7_inactive')),
  sent_at      timestamptz not null default now(),
  -- Idempotency: one email per (user, type, calendar day UTC)
  constraint lifecycle_emails_log_unique_day
    unique (user_id, email_type, (sent_at::date))
);

-- Index for the cron query: "which users got which email today?"
create index if not exists lifecycle_emails_log_user_type_day
  on lifecycle_emails_log (user_id, email_type, (sent_at::date));

-- RLS: only service-role can read/write (cron uses service-role client)
alter table lifecycle_emails_log enable row level security;

-- No user-facing policy needed — this table is internal.
-- Service-role bypasses RLS by design.

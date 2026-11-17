-- Run AFTER schema.sql when updating an existing Supabase project.
-- Pseudonymized (HMAC) source fingerprints, not raw IP addresses.
create table if not exists submission_attempts (
  id bigint generated always as identity primary key,
  source_hash text not null,
  reporter_hash text not null,
  accepted_at timestamptz not null default now()
);
create index if not exists submission_attempts_source_time_idx on submission_attempts(source_hash, accepted_at desc);
create index if not exists submission_attempts_reporter_time_idx on submission_attempts(reporter_hash, accepted_at desc);
alter table submission_attempts enable row level security;

-- A single transaction locks the source bucket, checks two limits and records the attempt.
-- Per reporter UUID: 3 reports / 10 minutes. Per source address: 10 reports / 10 minutes.
-- This is persistent across Vercel function instances.
create or replace function reserve_submission(p_source_hash text, p_reporter_hash text)
returns boolean language plpgsql set search_path = public as $$
declare
  start_at timestamptz := clock_timestamp() - interval '10 minutes';
  source_lock bigint := hashtextextended(p_source_hash, 0);
  reporter_lock bigint := hashtextextended(p_reporter_hash, 0);
begin
  -- Lock both buckets in a consistent order to prevent concurrent bypass and deadlocks.
  if source_lock <= reporter_lock then
    perform pg_advisory_xact_lock(source_lock);
    if source_lock <> reporter_lock then
      perform pg_advisory_xact_lock(reporter_lock);
    end if;
  else
    perform pg_advisory_xact_lock(reporter_lock);
    perform pg_advisory_xact_lock(source_lock);
  end if;
  if (select count(*) from submission_attempts
      where source_hash = p_source_hash and accepted_at > start_at) >= 10
     or (select count(*) from submission_attempts
      where reporter_hash = p_reporter_hash and accepted_at > start_at) >= 3 then
    return false;
  end if;
  insert into submission_attempts(source_hash, reporter_hash)
    values (p_source_hash, p_reporter_hash);
  return true;
end;
$$;
revoke all on function reserve_submission(text, text) from public, anon, authenticated;

-- Periodically remove old attempts in deployment maintenance (e.g. older than one day).
-- delete from submission_attempts where accepted_at < now() - interval '1 day';

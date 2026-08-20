-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Sets up the table backing the Adde ki Baatein chat panel.
--
-- Safe to re-run in full any time this file changes — every statement
-- below is written to not error on a second run (create/drop-if-exists,
-- or plain idempotent by nature), so you can always just paste the whole
-- file again instead of tracking which parts are new.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  author text not null,
  place text,
  content text not null,
  constraint author_length check (char_length(author) between 1 and 30),
  constraint content_length check (char_length(content) between 1 and 300)
);

-- Real enforcement for the blocklist in src/lib/moderation.ts — that
-- client-side check is fast-fail UX only; a request straight to the REST
-- API skips the app entirely, so this is what actually stops it. Keep this
-- pattern in sync with BLOCKED_WORDS/BLOCKED_WHOLE_WORDS in that file by
-- hand — same prefix-vs-whole-word split, for the same reason (catch
-- "fucking"/"shitty"/etc. as prefixes, but only match "cock" as a whole
-- word since cockpit/cocktail/cockroach/cockney are real words).
alter table public.messages drop constraint if exists content_no_blocked_words;
alter table public.messages add constraint content_no_blocked_words check (
  content !~* '(\y(fuck|shit|bitch|bastard|asshole|cunt|whore|slut|nigger|faggot|retard|motherfucker|dickhead|pussy))|(\ycock\y)'
);

alter table public.messages enable row level security;

-- No auth in this app (see README) — every visitor uses the public anon
-- key, so these policies are intentionally wide open: anyone can read the
-- last messages, and anyone can post one within the length limits above.
-- The per-IP rate limit at the bottom of this file is what keeps "anyone
-- can post" from meaning "anyone can flood".
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
  on public.messages for select
  to anon
  using (true);

drop policy if exists "Anyone can send a message" on public.messages;
create policy "Anyone can send a message"
  on public.messages for insert
  to anon
  with check (true);

-- Enables realtime INSERT notifications for this table. Guarded because
-- ALTER PUBLICATION ... ADD TABLE has no IF NOT EXISTS and errors if this
-- script is ever re-run after the first successful run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Backs the "अनुरोध करें" (request) buttons in the playlist panel: each
-- row is one vote for a song. Counts are tallied client-side over a
-- rolling recent window (see src/hooks/useSongRequests.ts) — this never
-- changes what actually plays, it's just a shared "people want to hear
-- this" signal.
create table if not exists public.song_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  video_id text not null
);

alter table public.song_requests enable row level security;

-- Same open-anon-key tradeoff as the messages table above — same rate
-- limit at the bottom of this file covers it too.
drop policy if exists "Anyone can read song requests" on public.song_requests;
create policy "Anyone can read song requests"
  on public.song_requests for select
  to anon
  using (true);

drop policy if exists "Anyone can request a song" on public.song_requests;
create policy "Anyone can request a song"
  on public.song_requests for insert
  to anon
  with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'song_requests'
  ) then
    alter publication supabase_realtime add table public.song_requests;
  end if;
end $$;

-- ---------- abuse protection: per-IP write rate limit ----------
-- Neither table above has any per-visitor identity to key off (there's no
-- auth in this app), and RLS's `with check (true)` can't throttle a burst
-- by itself — someone calling the REST API directly with the public anon
-- key can otherwise insert as fast as the network allows. This follows
-- Supabase's documented pattern (a "pre-request" function, run by
-- PostgREST before every request) instead: a private table nobody can
-- query through the API records one row per write, keyed on the real
-- edge-observed client IP from the x-forwarded-for header, and the
-- function rejects the request once an IP has made too many writes too
-- recently. It applies to every write on the project (both tables above),
-- not just one — this project doesn't have any other public write
-- endpoint, so that's exactly the coverage this needs.
create schema if not exists private;

create table if not exists private.rate_limits (
  client_ip inet not null,
  requested_at timestamptz not null default now()
);

create index if not exists rate_limits_ip_time_idx
  on private.rate_limits (client_ip, requested_at desc);

create or replace function public.pahadi_adda_rate_limit_check()
  returns void
  language plpgsql
  security definer
  set search_path = public
  as $$
declare
  req_method text := current_setting('request.method', true);
  -- Falls back to a shared placeholder IP (rather than NULL, which would
  -- violate client_ip's not-null constraint below and break every write
  -- app-wide) on the rare request that arrives without the header.
  req_ip inet := coalesce(
    nullif(split_part(
      current_setting('request.headers', true)::json ->> 'x-forwarded-for',
      ',', 1), ''),
    '0.0.0.0'
  )::inet;
  recent_writes integer;
  -- Generous enough for real chatting/voting, tight enough to stop a
  -- flood script: 15 writes per rolling minute, per IP.
  max_writes constant integer := 15;
  window_interval constant interval := interval '60 seconds';
begin
  if req_method is null or req_method in ('GET', 'HEAD') then
    return;
  end if;

  select count(*) into recent_writes
  from private.rate_limits
  where client_ip = req_ip
    and requested_at > now() - window_interval;

  if recent_writes >= max_writes then
    raise sqlstate 'PGRST' using
      message = json_build_object(
        'message', 'बहुत तेज़ भेज रहे हैं, कृपया थोड़ी देर बाद कोशिश करें'
      )::text,
      detail = json_build_object(
        'status', 429,
        'status_text', 'Too Many Requests'
      )::text;
  end if;

  insert into private.rate_limits (client_ip) values (req_ip);
end;
  $$;

alter role authenticator
  set pgrst.db_pre_request = 'public.pahadi_adda_rate_limit_check';

notify pgrst, 'reload config';

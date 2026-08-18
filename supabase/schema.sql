-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Sets up the table backing the Adde ki Baatein chat panel.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  author text not null,
  place text,
  content text not null,
  constraint author_length check (char_length(author) between 1 and 30),
  constraint content_length check (char_length(content) between 1 and 300)
);

alter table public.messages enable row level security;

-- No auth in this app (see README) — every visitor uses the public anon
-- key, so these policies are intentionally wide open: anyone can read the
-- last messages, and anyone can post one within the length limits above.
-- That's fine for a small, friendly audience; before a public launch,
-- tighten this (e.g. Supabase Anonymous Auth + per-user rate limiting).
create policy "Anyone can read messages"
  on public.messages for select
  to anon
  using (true);

create policy "Anyone can send a message"
  on public.messages for insert
  to anon
  with check (true);

-- Enables realtime INSERT notifications for this table.
alter publication supabase_realtime add table public.messages;

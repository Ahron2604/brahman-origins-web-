-- =============================================================================
-- BRAHMAN ORIGINS — Supabase Database Schema
-- University of Batangas · Capstone Project
--
-- Run this entire script in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Tables created:
--   profiles   — one row per auth.users entry; stores role & display name
--   players    — game player records (linked to auth.users via id)
--   tickets    — game bug / feedback reports
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";


-- -----------------------------------------------------------------------------
-- 1. PROFILES  (role lookup — used by redirectAfterLogin in main.js)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  role        text        not null default 'student'   -- 'student' | 'admin'
                          check (role in ('student', 'admin')),
  display_name text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up.
-- IMPORTANT: security definer + set search_path = public is required.
-- The trigger fires as supabase_auth_admin which has no access to public schema
-- by default. security definer makes it run as the function owner (postgres),
-- which bypasses RLS and can see all schemas.
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.email
    )
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- Never let a profiles insert failure block user creation
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 2. PLAYERS  (game progress — queried by loadSupabaseStudents & loadSupabaseOverview)
--
-- Column reference used in main.js:
--   name        → player display name
--   username    → fallback display identifier
--   email       → used for UB-mail check (ends with @ub.edu.ph)
--   course      → e.g. "BSIT 3A" — shown in Student Directory
--   active      → boolean — counts "Active Players" in Overview
--   level       → integer — shown in leaderboard
--   xp_total    → integer — leaderboard sort key
-- -----------------------------------------------------------------------------
create table if not exists public.players (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        references auth.users (id) on delete set null,
  name        text        not null,
  username    text        unique,
  email       text        not null,
  course      text,
  active      boolean     not null default true,
  level       integer     not null default 1,
  xp_total    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at
  before update on public.players
  for each row execute procedure public.set_updated_at();

-- Indexes used by the search/filter queries in main.js
create index if not exists idx_players_email       on public.players (email);
create index if not exists idx_players_active      on public.players (active);
create index if not exists idx_players_xp_total    on public.players (xp_total desc);


-- -----------------------------------------------------------------------------
-- 3. TICKETS  (game reports — queried by loadSupabaseTickets & initTicketActions)
--
-- Column reference used in main.js:
--   id          → UUID, passed as data-ticket-id on Resolve buttons
--   title       → ticket heading shown in the feed
--   tag         → category label, e.g. "Technical Issue" | "Gameplay Feedback"
--   user_name   → reporter display name
--   status      → 'open' | 'resolved'
--   created_at  → timestamptz — used for timeSince() display
-- -----------------------------------------------------------------------------
create table if not exists public.tickets (
  id          uuid        primary key default uuid_generate_v4(),
  player_id   uuid        references public.players (id) on delete set null,
  user_name   text,
  title       text        not null,
  description text,
  tag         text        not null default 'Technical Issue',
  status      text        not null default 'open'
                          check (status in ('open', 'resolved', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.set_updated_at();

create index if not exists idx_tickets_status     on public.tickets (status);
create index if not exists idx_tickets_created_at on public.tickets (created_at desc);


-- -----------------------------------------------------------------------------
-- 3.5 INQUIRIES  (school questions — submitted by students/visitors)
--
-- Column reference used in main.js loadSupabaseInquiries():
--   name       → sender display name
--   email      → sender email for reply
--   message    → inquiry text body
--   status     → 'open' | 'resolved'
--   created_at → timestamptz for timeSince() display
-- -----------------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  email       text        not null,
  message     text        not null,
  status      text        not null default 'open'
                          check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
  before update on public.inquiries
  for each row execute procedure public.set_updated_at();

create index if not exists idx_inquiries_status     on public.inquiries (status);
create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);


-- RLS for inquiries
alter table public.inquiries enable row level security;

drop policy if exists "Admins can manage all inquiries" on public.inquiries;
drop policy if exists "Anyone can submit inquiry"       on public.inquiries;

create policy "Admins can manage all inquiries"
  on public.inquiries for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Public insert: visitors & students can submit without being logged in
create policy "Anyone can submit inquiry"
  on public.inquiries for insert
  with check (true);
-- Drop before recreating so the script is safe to re-run.
-- -----------------------------------------------------------------------------

-- ── profiles ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Service role bypass profiles" on public.profiles;
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Authenticated users can read their own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Authenticated users can update their own row
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read every profile row
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ── players ───────────────────────────────────────────────────────────────────
alter table public.players enable row level security;

drop policy if exists "Admins can manage all players" on public.players;
drop policy if exists "Players can read own record"   on public.players;
drop policy if exists "Public leaderboard read"       on public.players;

create policy "Admins can manage all players"
  on public.players for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Players can read own record"
  on public.players for select
  using (user_id = auth.uid());

-- Leaderboard is public — read by anyone (including unauthenticated visitors)
create policy "Public leaderboard read"
  on public.players for select
  using (true);

-- ── tickets ───────────────────────────────────────────────────────────────────
alter table public.tickets enable row level security;

drop policy if exists "Admins can manage all tickets" on public.tickets;
drop policy if exists "Players can submit tickets"    on public.tickets;
drop policy if exists "Players can view own tickets"  on public.tickets;

create policy "Admins can manage all tickets"
  on public.tickets for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Players can submit tickets"
  on public.tickets for insert
  with check (auth.uid() is not null);

create policy "Players can view own tickets"
  on public.tickets for select
  using (
    player_id in (
      select id from public.players where user_id = auth.uid()
    )
  );


-- -----------------------------------------------------------------------------
-- 5. SAMPLE DATA  (remove or comment out before production)
-- -----------------------------------------------------------------------------

insert into public.players (name, username, email, course, active, level, xp_total)
values
  ('Miguel Santos',    'msantos',    'miguel.santos@ub.edu.ph',    'BSIT 3A', true,  42, 18940),
  ('Alyssa Reyes',     'areyes',     'alyssa.reyes@ub.edu.ph',     'BSCS 4B', true,  39, 16820),
  ('Christian Cruz',   'ccruz',      'christian.cruz@ub.edu.ph',   'BSED 2C', true,  35, 14500),
  ('Kai Alvarado',     'kalvarado',  'kai.alvarado@ub.edu.ph',     'BSIT 3A', true,  24, 12420),
  ('Bea Dimaculangan', 'bdimaculangan', 'bea.dimaculangan@ub.edu.ph', 'BSBA 1A', true, 19,  9180),
  ('Marco Reyes',      'mreyes',     'marco.reyes@gmail.com',      'BSCS 4B', true,  12,  4320),
  ('Lila Domingo',     'ldomingo',   'lila.domingo@ub.edu.ph',     'BSED 2C', true,  8,   2100),
  ('Jose Tan',         'jtan',       'jtan_2024@yahoo.com',        'BSBA 1A', false, 3,    540)
on conflict do nothing;

insert into public.tickets (user_name, title, tag, status)
values
  ('Marco Reyes', 'Game crashed during Old Library quest',                'Technical Issue',   'open'),
  ('Kai Alvarado', 'XP not updating after completing the History Hall puzzle', 'Gameplay Feedback', 'open')
on conflict do nothing;


-- =============================================================================
-- HOW TO CREATE THE DEFAULT ADMIN ACCOUNT
--
-- The admin account CANNOT be created via SQL — Supabase manages password
-- hashing internally. Follow these two steps instead:
--
-- STEP 1 — Create the user in the Dashboard:
--   Authentication → Users → "Add user" → "Create new user"
--     Email    : admin@brahmanorigins.com
--     Password : BrahmanAdmin2026!
--     ✓ Check "Auto Confirm User"
--   Click "Create User" — copy the UUID shown in the users list.
--
-- STEP 2 — Run set-admin.sql (separate file) in the SQL Editor.
--   Open set-admin.sql, replace YOUR-UUID-HERE with the UUID from step 1,
--   then run that file on its own — NOT together with this file.
-- =============================================================================

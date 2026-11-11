-- =============================================================================
-- BRAHMAN ORIGINS — Supabase Database Schema
-- University of Batangas · Capstone Project
--
-- WARNING: This schema matches the ACTUAL Supabase database structure.
-- It includes all tables, RLS policies, and triggers.
--
-- Run this entire script in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- =============================================================================


-- =============================================================================
-- 0. ENABLE EXTENSIONS
-- =============================================================================
create extension if not exists "uuid-ossp";


-- =============================================================================
-- 1. PROFILES TABLE (unified user/player data)
-- =============================================================================
-- This is the main table that stores all user data:
-- - Authenticated users linked to auth.users via user_id
-- - Both admins (role='admin') and students (role='student')
-- - Contains player progression data: level, xp_total, current_chapter
--
create table if not exists public.profiles (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        unique references auth.users (id) on delete cascade,
  role            text        not null default 'student'
                              check (role in ('student', 'admin')),
  name            text        not null,
  username        text        unique,
  email           text        not null,
  course          text,
  active          boolean     not null default true,
  level           integer     not null default 1,
  xp_total        integer     not null default 0,
  current_chapter integer     default 1,
  display_name    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up via auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, role, name, email, display_name)
  values (
    uuid_generate_v4(),
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (user_id) do nothing;
  return new;
exception
  when others then
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh
drop trigger if exists trg_profiles_updated_at on public.profiles;
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Indexes for common queries
create index if not exists idx_profiles_user_id   on public.profiles (user_id);
create index if not exists idx_profiles_email     on public.profiles (email);
create index if not exists idx_profiles_role      on public.profiles (role);
create index if not exists idx_profiles_active    on public.profiles (active);
create index if not exists idx_profiles_xp_total  on public.profiles (xp_total desc);


-- =============================================================================
-- 2. TASK TABLE
-- =============================================================================
create table if not exists public.task (
  task_id          uuid        primary key default uuid_generate_v4(),
  title            text        not null,
  description      text,
  points           integer     default 0,
  chapter_number   integer     default 1,
  created_at       timestamptz default now()
);

create index if not exists idx_task_chapter on public.task (chapter_number);


-- =============================================================================
-- 3. TASK_RESULT TABLE (player task progress)
-- =============================================================================
create table if not exists public.task_result (
  result_id        uuid        primary key default uuid_generate_v4(),
  player_id        uuid        references public.profiles (id) on delete cascade,
  task_id          uuid        references public.task (task_id) on delete cascade,
  status           text        default 'Pending',
  score            integer     default 0,
  completed_at     timestamptz default now()
);

create index if not exists idx_task_result_player on public.task_result (player_id);
create index if not exists idx_task_result_task   on public.task_result (task_id);


-- =============================================================================
-- 4. TICKETS TABLE (bug reports & feedback)
-- =============================================================================
create table if not exists public.tickets (
  id               uuid        primary key default uuid_generate_v4(),
  player_id        uuid        references public.profiles (id) on delete set null,
  user_name        text,
  email            text,
  title            text        not null,
  description      text,
  tag              text        not null default 'Technical Issue'
                               check (tag in ('Technical Issue', 'Gameplay Feedback', 'Inquiry')),
  status           text        not null default 'open'
                               check (status in ('open', 'resolved', 'closed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.set_updated_at();

create index if not exists idx_tickets_status       on public.tickets (status);
create index if not exists idx_tickets_player_id    on public.tickets (player_id);
create index if not exists idx_tickets_created_at   on public.tickets (created_at desc);


-- =============================================================================
-- 5. REWARD TABLE
-- =============================================================================
create table if not exists public.reward (
  reward_id        uuid        primary key default uuid_generate_v4(),
  player_id        uuid        not null references public.profiles (id) on delete cascade,
  reward_name      text        not null,
  description      text,
  requirement      text,
  points           integer     default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_reward_player on public.reward (player_id);


-- =============================================================================
-- 6. ACHIEVEMENT TABLE
-- =============================================================================
create table if not exists public.achievement (
  achievement_id   uuid        primary key default uuid_generate_v4(),
  player_id        uuid        references public.profiles (id) on delete cascade,
  achievement_name text        not null,
  description      text,
  requirement      text,
  icon             text,
  created_at       timestamptz default now()
);

create index if not exists idx_achievement_player on public.achievement (player_id);


-- =============================================================================
-- 7. NOTIFICATION TABLE
-- =============================================================================
create table if not exists public.notification (
  notification_id  uuid        primary key default uuid_generate_v4(),
  player_id        uuid        references public.profiles (id) on delete cascade,
  title            text        not null,
  message          text,
  is_read          boolean     not null default false,
  created_at       timestamptz default now()
);

create index if not exists idx_notification_player on public.notification (player_id);
create index if not exists idx_notification_read   on public.notification (is_read);


-- =============================================================================
-- 8. QUESTS TABLE
-- =============================================================================
create table if not exists public.quests (
  id               bigint      generated always as identity primary key,
  player_id        uuid        references public.profiles (id) on delete cascade,
  title            text        not null,
  description      text,
  progress         integer     default 0,
  status           text        default 'active',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

drop trigger if exists trg_quests_updated_at on public.quests;
create trigger trg_quests_updated_at
  before update on public.quests
  for each row execute procedure public.set_updated_at();

create index if not exists idx_quests_player on public.quests (player_id);
create index if not exists idx_quests_status on public.quests (status);


-- =============================================================================
-- 9. ACTIVITY_LOG TABLE
-- =============================================================================
create table if not exists public.activity_log (
  id               bigint      generated always as identity primary key,
  player_id        uuid        references public.profiles (id) on delete cascade,
  title            text        not null,
  meta             text,
  xp_gain          integer     default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_activity_log_player     on public.activity_log (player_id);
create index if not exists idx_activity_log_created_at on public.activity_log (created_at desc);


-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- ── PROFILES TABLE RLS ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public can read leaderboard" on public.profiles;

-- Admins can read ALL profiles (check user_id matches auth.uid())
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    user_id = auth.uid() AND
    (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Authenticated users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (user_id = auth.uid());

-- Leaderboard is public (anyone can read, excluding admins)
create policy "Public can read leaderboard"
  on public.profiles for select
  using (role != 'admin');



-- ── TICKETS TABLE RLS ───────────────────────────────────────────────────────
alter table public.tickets enable row level security;

drop policy if exists "Admins can manage all tickets" on public.tickets;
drop policy if exists "Players can submit tickets" on public.tickets;
drop policy if exists "Players can view own tickets" on public.tickets;

-- Admins can manage all tickets
create policy "Admins can manage all tickets"
  on public.tickets for all
  using (auth.uid() is not null);

-- Players can submit tickets (insert)
create policy "Players can submit tickets"
  on public.tickets for insert
  with check (auth.uid() is not null);

-- Players can view their own tickets (select)
create policy "Players can view own tickets"
  on public.tickets for select
  using (
    player_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );


-- ── OTHER TABLES RLS ────────────────────────────────────────────────────────
alter table public.task_result enable row level security;
drop policy if exists "Admins can manage task results" on public.task_result;
drop policy if exists "Players can read own results" on public.task_result;

create policy "Admins can manage task results"
  on public.task_result for all
  using (auth.uid() is not null);

create policy "Players can read own results"
  on public.task_result for select
  using (
    player_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Quests
alter table public.quests enable row level security;
drop policy if exists "Admins can manage all quests" on public.quests;
drop policy if exists "Players can read own quests" on public.quests;

create policy "Admins can manage all quests"
  on public.quests for all
  using (auth.uid() is not null);

create policy "Players can read own quests"
  on public.quests for select
  using (
    player_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Activity Log
alter table public.activity_log enable row level security;
drop policy if exists "Admins can read all activity" on public.activity_log;
drop policy if exists "Players can read own activity" on public.activity_log;

create policy "Admins can read all activity"
  on public.activity_log for select
  using (auth.uid() is not null);

create policy "Players can read own activity"
  on public.activity_log for select
  using (
    player_id in (select id from public.profiles where user_id = auth.uid())
  );


-- =============================================================================
-- 11. SAMPLE DATA (Insert after schema is created)
-- =============================================================================
-- WARNING: This data is for DEVELOPMENT only. Remove before production.
--
-- Note: These are profile records only. To link to auth.users, you must:
-- 1. Create the auth user in Supabase Dashboard → Authentication → Users
-- 2. Copy the UUID from that user
-- 3. Update the user_id in these inserts OR use the profile trigger
--
insert into public.profiles (name, username, email, course, active, level, xp_total, role)
values
  ('Miguel Santos',    'msantos',    'miguel.santos@ub.edu.ph',    'BSIT 3A', true,  42, 18940, 'student'),
  ('Alyssa Reyes',     'areyes',     'alyssa.reyes@ub.edu.ph',     'BSCS 4B', true,  39, 16820, 'student'),
  ('Christian Cruz',   'ccruz',      'christian.cruz@ub.edu.ph',   'BSED 2C', true,  35, 14500, 'student'),
  ('Kai Alvarado',     'kalvarado',  'kai.alvarado@ub.edu.ph',     'BSIT 3A', true,  24, 12420, 'student'),
  ('Bea Dimaculangan', 'bdimaculangan', 'bea.dimaculangan@ub.edu.ph', 'BSBA 1A', true, 19,  9180, 'student'),
  ('Marco Reyes',      'mreyes',     'marco.reyes@gmail.com',      'BSCS 4B', true,  12,  4320, 'student'),
  ('Lila Domingo',     'ldomingo',   'lila.domingo@ub.edu.ph',     'BSED 2C', true,  8,   2100, 'student'),
  ('Jose Tan',         'jtan',       'jtan_2024@yahoo.com',        'BSBA 1A', false, 3,    540, 'student')
on conflict (username) do nothing;

insert into public.tickets (user_name, email, title, description, tag, status)
values
  ('Marco Reyes', 'marco.reyes@gmail.com', 'Game crashed during Old Library quest', 'The game crashes when entering the Old Library area during the quest.', 'Technical Issue', 'open'),
  ('Kai Alvarado', 'kai.alvarado@ub.edu.ph', 'XP not updating after History Hall puzzle', 'Completed the History Hall puzzle but XP did not increase.', 'Gameplay Feedback', 'open')
on conflict do nothing;


-- =============================================================================
-- 12. HOW TO CREATE THE ADMIN ACCOUNT
-- =============================================================================
--
-- The admin account CANNOT be created via SQL — Supabase manages passwords.
-- Follow these steps instead:
--
-- STEP 1 — Create the auth user:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Click "Add user" → "Create new user"
--   3. Enter email: admin@brahmanorigins.com
--   4. Enter password: 12345678
--   5. Check "Auto Confirm User"
--   6. Click "Create User"
--   7. Copy the UUID from the users list
--
-- STEP 2 — Create the profile entry (run this query):
--   Replace YOUR-ADMIN-UUID with the UUID you copied:
--
/*
INSERT INTO public.profiles (id, user_id, name, email, role, active, level, xp_total)
VALUES (
  uuid_generate_v4(),
  'YOUR-ADMIN-UUID'::uuid,
  'System Administrator',
  'admin@brahmanorigins.com',
  'admin',
  true,
  99,
  999999
)
ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin', name = 'System Administrator';
*/
--
-- STEP 3 — Verify the admin was created:
--   Run this query to confirm:
--
/*
SELECT id, user_id, name, email, role FROM public.profiles WHERE role = 'admin';
*/
--
-- If you see a row with role='admin', you're all set!
--
-- =============================================================================

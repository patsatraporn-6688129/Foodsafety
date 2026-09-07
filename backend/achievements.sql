-- ============================================================
-- achievements.sql — idempotent, and REPLACES the old achievements /
-- user_achievements definition (id uuid + code) with this required_level
-- based one. Safe to run multiple times, and safe to run even if the old
-- version already exists in your project.
--
-- Why "drop and recreate" instead of "add column": the old schema's
-- primary key (`id` uuid) and this one's (`achievement_id` varchar) are
-- fundamentally different columns, not something ALTER TABLE can migrate
-- automatically — and nothing in the app reads from this table yet
-- (getMyAchievements() in src/lib/progress.js is defined but never
-- called; Rewards.jsx / the Profile screen currently render the static
-- REWARDS.achievements / PROFILE.badges mock data instead), so there's no
-- real data to preserve.
-- ============================================================

drop table if exists public.user_achievements cascade;
drop table if exists public.achievements cascade;

create table public.achievements (
    achievement_id   varchar(50) primary key,
    title            varchar(100) not null,
    description      text,
    required_level   int not null,
    icon             varchar(255)
);

create table public.user_achievements (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references auth.users(id) on delete cascade,
    achievement_id   varchar(50) not null references public.achievements(achievement_id),
    unlocked_at      timestamptz not null default now(),
    unique (user_id, achievement_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "Allow public read access"
on public.achievements for select
using (true);

create policy "Users can view own achievements"
on public.user_achievements for select
using (auth.uid() = user_id);

create policy "Users can insert own achievements"
on public.user_achievements for insert
with check (auth.uid() = user_id);

-- Base table grants — see backend/fix-grants.sql for why these matter
-- (RLS policies alone aren't enough; the role also needs the underlying
-- GRANT or every query 403s with "permission denied for table X").
grant usage on schema public to anon, authenticated;
grant select on public.achievements to anon, authenticated;
grant select, insert on public.user_achievements to authenticated;
grant select on public.user_achievements to anon;

insert into public.achievements (achievement_id, title, description, required_level, icon)
values
  ('fridge_freshies', 'Fridge Freshies', 'New to cooking — ready to learn safe fridge habits.', 20, '🐣'),
  ('kitchen_keeper', 'Kitchen Keeper', 'Cooks at home — sharpening your storage skills.', 30, '👩‍🍳'),
  ('fridge_safety_masters', 'Fridge Safety Masters', 'Nutrition & food service pros — bring on the toughest challenges.', 40, '🏆')
on conflict (achievement_id) do update
set title = excluded.title,
    description = excluded.description,
    required_level = excluded.required_level,
    icon = excluded.icon;

-- ============================================================
-- Fridge Master — Database Schema (users / game_progress / game_history)
-- How to use: Supabase Dashboard → SQL Editor → New query → paste all → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) users — player profile (extends auth.users)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  total_stars int not null default 0,
  coins int not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create a row in `users` the moment someone signs up via
-- supabase.auth.signUp()
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2) game_progress — latest state, ONE row per (user, level).
--    Used to render the Level Select screen (best score / stars / unlocked).
-- ------------------------------------------------------------
create table public.game_progress (
  user_id uuid references auth.users(id) on delete cascade not null,
  level int not null,
  best_score int not null default 0,
  best_stars int not null default 0,
  times_played int not null default 0,
  unlocked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, level)
);

-- ------------------------------------------------------------
-- 3) game_history — one row logged every time a level finishes
--    (used for stats / graphs over time).
-- ------------------------------------------------------------
create table public.game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  level int not null,
  score int not null,
  stars int not null default 0,
  correct_count int,
  total_items int,
  played_at timestamptz not null default now()
);

create index game_history_user_level_idx on public.game_history (user_id, level);

-- ------------------------------------------------------------
-- achievements / user_achievements now live in backend/achievements.sql
-- (their own migration, run separately, AFTER this file) — not defined
-- here anymore. See that file for why.
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- Helper RPC: called once from the game when a level finishes.
-- Inserts a history row AND upserts progress (keeping only the best
-- score/stars) AND recomputes the player's total_stars — all in one call.
-- ------------------------------------------------------------
create function public.submit_level_result(
  p_level int,
  p_score int,
  p_stars int,
  p_correct_count int,
  p_total_items int
)
returns void as $$
begin
  insert into public.game_history (user_id, level, score, stars, correct_count, total_items)
  values (auth.uid(), p_level, p_score, p_stars, p_correct_count, p_total_items);

  insert into public.game_progress (user_id, level, best_score, best_stars, times_played, unlocked, updated_at)
  values (auth.uid(), p_level, p_score, p_stars, 1, true, now())
  on conflict (user_id, level) do update
  set best_score   = greatest(public.game_progress.best_score, excluded.best_score),
      best_stars   = greatest(public.game_progress.best_stars, excluded.best_stars),
      times_played = public.game_progress.times_played + 1,
      unlocked     = true,
      updated_at   = now();

  update public.users
  set total_stars = (select coalesce(sum(best_stars), 0) from public.game_progress where user_id = auth.uid())
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.game_progress enable row level security;
alter table public.game_history enable row level security;

create policy "Users are viewable by everyone"
on public.users for select using (true);

create policy "Users can update their own row"
on public.users for update using (auth.uid() = id);

create policy "Progress is viewable by everyone"
on public.game_progress for select using (true);

create policy "Users can upsert their own progress"
on public.game_progress for insert with check (auth.uid() = user_id);

create policy "Users can update their own progress"
on public.game_progress for update using (auth.uid() = user_id);

create policy "History is viewable by everyone"
on public.game_history for select using (true);

create policy "Users can insert their own history"
on public.game_history for insert with check (auth.uid() = user_id);

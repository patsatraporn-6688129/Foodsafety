-- ============================================================
-- game_snapshot — cross-device "resume where I left off" mid-level save.
-- Run this AFTER supabase-schema.sql (Supabase Dashboard → SQL Editor).
--
-- Why this exists: the old save-state only lived in localStorage on the
-- device the player was using, so closing the app on Phone A and opening
-- it on Phone B (or a different browser) could not resume mid-level —
-- only the FINAL score/stars per level (game_progress/game_history) synced
-- across devices, not progress made *during* a level that hasn't been
-- checked yet.
--
-- ONE row per user, overwritten every time (upsert), never grows — so this
-- costs a few KB per player no matter how long they play, not per-save.
-- ============================================================

create table public.game_snapshot (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  level        int not null,
  difficulty   text,
  current_items jsonb not null default '[]'::jsonb,
  placements   jsonb not null default '{}'::jsonb,
  time_left    int not null default 0,
  hints_used   int not null default 0,
  total        int not null default 0,
  selected_id  text,
  score_x2     boolean not null default false,
  free_hints   int not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.game_snapshot enable row level security;

-- A player can only ever see/write/erase their OWN mid-level snapshot.
create policy "Users can view their own snapshot"
on public.game_snapshot for select using (auth.uid() = user_id);

create policy "Users can upsert their own snapshot"
on public.game_snapshot for insert with check (auth.uid() = user_id);

create policy "Users can update their own snapshot"
on public.game_snapshot for update using (auth.uid() = user_id);

create policy "Users can delete their own snapshot"
on public.game_snapshot for delete using (auth.uid() = user_id);

-- ============================================================
-- Daily Mystery Box — server-enforced random reward, once per 24h
-- Run this AFTER supabase-schema.sql (Supabase Dashboard → SQL Editor).
--
-- Why this exists: the old Rewards.jsx tracked the 24h timer with
-- localStorage only, so a player could reset their own clock (clear
-- storage / edit the value) and re-claim instantly, and "opening" the box
-- never actually granted anything. This migration moves both the 24h gate
-- AND the reward roll onto the backend, where the player can't touch them.
-- ============================================================

-- ------------------------------------------------------------
-- 1) daily_mystery_claims — ONE row per user, tracks the last time they
--    opened the box and what they got, so the client can render a
--    countdown without needing to guess or trust its own clock.
-- ------------------------------------------------------------
create table public.daily_mystery_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_claimed_at timestamptz not null,
  last_reward_type text not null,   -- 'hint' | 'multiplier'
  last_reward_amount int not null,  -- e.g. 1 or 2 free hints; always 1 for multiplier
  updated_at timestamptz not null default now()
);

alter table public.daily_mystery_claims enable row level security;

create policy "Users can view their own mystery-box claim"
on public.daily_mystery_claims for select using (auth.uid() = user_id);

-- No insert/update policy for regular clients on purpose — every write
-- happens through claim_daily_mystery_box() below (security definer), so
-- a player can never write their own last_claimed_at directly and skip
-- the 24h wait.

-- ------------------------------------------------------------
-- 2) claim_daily_mystery_box() — the only way to open the box.
--
--    Reward odds (rolled server-side with random(), not visible to the
--    client until after the roll):
--      65% → 1 free hint
--      20% → 2 free hints
--      15% → Score x2 boost for the next level
--
--    Returns a single row: (ok, reward_type, reward_amount, next_available_at)
--      ok = false  → box wasn't ready yet; nothing is changed, and
--                     next_available_at tells the client exactly when it
--                     will be (used to keep the countdown accurate even if
--                     the client's own clock drifts).
--      ok = true   → box was opened just now; reward_type/reward_amount
--                     is what the player won, and it's already recorded.
-- ------------------------------------------------------------
create function public.claim_daily_mystery_box()
returns table (
  ok boolean,
  reward_type text,
  reward_amount int,
  next_available_at timestamptz
) as $$
declare
  v_last timestamptz;
  v_roll double precision;
  v_reward_type text;
  v_reward_amount int;
begin
  select last_claimed_at into v_last
  from public.daily_mystery_claims
  where user_id = auth.uid();

  -- Never claimed before → box is ready immediately (first-login bonus).
  -- Otherwise ready once a full 24h has passed, measured by the SERVER's
  -- clock (now()), not anything the client sends up.
  if v_last is not null and now() < v_last + interval '24 hours' then
    return query select false, null::text, null::int, v_last + interval '24 hours';
    return;
  end if;

  -- Roll the reward.
  v_roll := random();
  if v_roll < 0.65 then
    v_reward_type := 'hint';
    v_reward_amount := 1;
  elsif v_roll < 0.85 then
    v_reward_type := 'hint';
    v_reward_amount := 2;
  else
    v_reward_type := 'multiplier';
    v_reward_amount := 1; -- one level's worth of Score x2
  end if;

  insert into public.daily_mystery_claims (user_id, last_claimed_at, last_reward_type, last_reward_amount, updated_at)
  values (auth.uid(), now(), v_reward_type, v_reward_amount, now())
  on conflict (user_id) do update
  set last_claimed_at = excluded.last_claimed_at,
      last_reward_type = excluded.last_reward_type,
      last_reward_amount = excluded.last_reward_amount,
      updated_at = now();

  return query select true, v_reward_type, v_reward_amount, now() + interval '24 hours';
end;
$$ language plpgsql security definer;

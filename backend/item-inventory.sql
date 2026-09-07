-- ============================================================
-- item-inventory.sql — turns Shop power-ups into a real, persistent
-- inventory instead of "buy it and it auto-applies to whatever level
-- starts next". Run this AFTER supabase-schema.sql and coin-wallet.sql
-- (Supabase Dashboard → SQL Editor).
--
-- Why this exists: buyPowerup() used to spend coins and immediately bank
-- the boost into a client-only `pendingBoosts` object that got consumed
-- the moment ANY level started — so a player buying "Score x2" while
-- browsing the Shop from the main menu had no control over which level it
-- applied to, and the boost didn't survive closing the app. Now every
-- purchase (and every Daily Mystery Box win) increments a durable count on
-- public.users — same pattern as `coins` — and the player taps an item
-- from their inventory (shown next to the Hint button, in-game) whenever
-- they actually want to use it, in any level.
--
-- ONE row per user (columns on public.users, same table `coins` lives
-- on), so this never grows unbounded — just three small integers per
-- player, always incremented/decremented in place.
-- ============================================================

alter table public.users add column if not exists inv_time       int not null default 0;
alter table public.users add column if not exists inv_hint       int not null default 0;
alter table public.users add column if not exists inv_multiplier int not null default 0;

-- ------------------------------------------------------------
-- buy_item(p_item, p_cost) — atomically spends coins AND credits the
-- matching inventory column in ONE update, so a purchase can never end up
-- half-applied (coins gone but item not granted, or vice versa) even if
-- two purchases fire back-to-back.
-- p_item must be 'time' | 'hint' | 'multiplier' (matches SHOP item ids in
-- src/gameData.js) — anything else raises an exception.
-- Returns (ok, balance, qty):
--   ok = false → not enough coins; nothing deducted, nothing granted.
--   ok = true  → coins deducted, inventory count incremented by 1.
-- ------------------------------------------------------------
create function public.buy_item(p_item text, p_cost int)
returns table (ok boolean, balance int, qty int) as $$
declare
  v_balance int;
  v_qty int;
begin
  if p_item not in ('time', 'hint', 'multiplier') then
    raise exception 'invalid item %', p_item;
  end if;
  if p_cost is null or p_cost <= 0 then
    select coins into v_balance from public.users where id = auth.uid();
    return query select false, coalesce(v_balance, 0), 0;
    return;
  end if;

  if p_item = 'time' then
    update public.users set coins = coins - p_cost, inv_time = inv_time + 1
      where id = auth.uid() and coins >= p_cost
      returning coins, inv_time into v_balance, v_qty;
  elsif p_item = 'hint' then
    update public.users set coins = coins - p_cost, inv_hint = inv_hint + 1
      where id = auth.uid() and coins >= p_cost
      returning coins, inv_hint into v_balance, v_qty;
  else
    update public.users set coins = coins - p_cost, inv_multiplier = inv_multiplier + 1
      where id = auth.uid() and coins >= p_cost
      returning coins, inv_multiplier into v_balance, v_qty;
  end if;

  if v_balance is null then
    select coins into v_balance from public.users where id = auth.uid();
    return query select false, coalesce(v_balance, 0), 0;
  else
    return query select true, v_balance, v_qty;
  end if;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- use_item(p_item) — spends ONE unit from the caller's own inventory
-- (tapped from the in-game inventory row). Returns (ok, qty):
--   ok = false → they had none left; qty is just the current (0) count.
--   ok = true  → one unit consumed; qty is the new remaining count.
-- ------------------------------------------------------------
create function public.use_item(p_item text)
returns table (ok boolean, qty int) as $$
declare
  v_qty int;
begin
  if p_item not in ('time', 'hint', 'multiplier') then
    raise exception 'invalid item %', p_item;
  end if;

  if p_item = 'time' then
    update public.users set inv_time = inv_time - 1
      where id = auth.uid() and inv_time > 0
      returning inv_time into v_qty;
  elsif p_item = 'hint' then
    update public.users set inv_hint = inv_hint - 1
      where id = auth.uid() and inv_hint > 0
      returning inv_hint into v_qty;
  else
    update public.users set inv_multiplier = inv_multiplier - 1
      where id = auth.uid() and inv_multiplier > 0
      returning inv_multiplier into v_qty;
  end if;

  if v_qty is null then
    return query select false, 0;
  else
    return query select true, v_qty;
  end if;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- grant_item(p_item, p_amount) — credits inventory WITHOUT touching coins,
-- for non-purchase sources (currently: Daily Mystery Box rewards). Returns
-- the new total for that item. A non-positive amount is a no-op that just
-- returns the current count.
-- ------------------------------------------------------------
create function public.grant_item(p_item text, p_amount int)
returns int as $$
declare
  v_qty int;
begin
  if p_item not in ('time', 'hint', 'multiplier') then
    raise exception 'invalid item %', p_item;
  end if;
  if p_amount is null or p_amount <= 0 then
    if p_item = 'time' then select inv_time into v_qty from public.users where id = auth.uid();
    elsif p_item = 'hint' then select inv_hint into v_qty from public.users where id = auth.uid();
    else select inv_multiplier into v_qty from public.users where id = auth.uid();
    end if;
    return coalesce(v_qty, 0);
  end if;

  if p_item = 'time' then
    update public.users set inv_time = inv_time + p_amount where id = auth.uid() returning inv_time into v_qty;
  elsif p_item = 'hint' then
    update public.users set inv_hint = inv_hint + p_amount where id = auth.uid() returning inv_hint into v_qty;
  else
    update public.users set inv_multiplier = inv_multiplier + p_amount where id = auth.uid() returning inv_multiplier into v_qty;
  end if;

  return coalesce(v_qty, 0);
end;
$$ language plpgsql security definer;

-- Remember to also run/re-run backend/fix-grants.sql after this — it now
-- grants EXECUTE on buy_item / use_item / grant_item too.

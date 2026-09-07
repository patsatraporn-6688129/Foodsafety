-- ============================================================
-- Coin wallet — moves coins from localStorage into public.users.coins
-- Run this AFTER supabase-schema.sql (Supabase Dashboard → SQL Editor).
-- If you're setting up a brand-new project, supabase-schema.sql already
-- includes the `coins` column, so you only need this file's two RPCs.
--
-- Why this exists: src/lib/wallet.js used to keep the coin balance in
-- localStorage (fridgemaster_coins_<userId>), which meant coins didn't
-- follow the player across devices and could be edited by hand in
-- devtools. This migration makes public.users.coins the source of truth
-- and moves both credit (add_coins) and debit (spend_coins) onto the
-- server, the same pattern already used by submit_level_result()
-- (total_stars) and claim_daily_mystery_box().
-- ============================================================

-- Skip if you already ran the updated supabase-schema.sql, which creates
-- this column on the table directly.
alter table public.users add column if not exists coins int not null default 0;

-- ------------------------------------------------------------
-- add_coins(p_amount) — credits the caller's own balance (e.g. a
-- level-complete reward). Returns the new balance. A non-positive amount
-- is a no-op that just returns the current balance, so callers never need
-- to branch on `amount > 0` before calling this.
-- ------------------------------------------------------------
create function public.add_coins(p_amount int)
returns int as $$
declare
  v_balance int;
begin
  if p_amount is null or p_amount <= 0 then
    select coins into v_balance from public.users where id = auth.uid();
    return coalesce(v_balance, 0);
  end if;

  update public.users
  set coins = coins + p_amount
  where id = auth.uid()
  returning coins into v_balance;

  return coalesce(v_balance, 0);
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- spend_coins(p_amount) — debits the caller's own balance for a purchase.
-- Returns (ok, balance):
--   ok = false → balance can't cover it (or amount is invalid); nothing
--                is deducted, `balance` is just the current balance.
--   ok = true  → the amount was deducted; `balance` is the new total.
-- Runs as ONE atomic update so two purchases fired back-to-back can't both
-- read the same "before" balance and overspend.
-- ------------------------------------------------------------
create function public.spend_coins(p_amount int)
returns table (ok boolean, balance int) as $$
declare
  v_balance int;
begin
  if p_amount is null or p_amount <= 0 then
    select coins into v_balance from public.users where id = auth.uid();
    return query select false, coalesce(v_balance, 0);
    return;
  end if;

  update public.users
  set coins = coins - p_amount
  where id = auth.uid() and coins >= p_amount
  returning coins into v_balance;

  if v_balance is null then
    select coins into v_balance from public.users where id = auth.uid();
    return query select false, coalesce(v_balance, 0);
  else
    return query select true, v_balance;
  end if;
end;
$$ language plpgsql security definer;

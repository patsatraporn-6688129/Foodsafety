-- ============================================================
-- fix-grants.sql — repairs "permission denied for table X" errors.
--
-- Symptom: browser console shows things like
--   "permission denied for table users"
--   "permission denied for table game_snapshot"  (403 Forbidden)
-- even though the RLS policies for that table look correct.
--
-- Why this happens: RLS policies only control WHICH ROWS a role can see/
-- write — the role still needs a base GRANT on the table itself first, or
-- Postgres denies the request before it ever checks a policy. Supabase
-- normally grants this automatically to `anon`/`authenticated` the moment
-- a table is created, but if an earlier statement in a migration errored
-- out (e.g. "relation already exists"), everything after it — including
-- these grants — may never have run.
--
-- Safe to run anytime, as many times as you want; it only ever ADDS
-- privileges, never removes any. Run in Supabase Dashboard → SQL Editor.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.users            to authenticated;
grant select                        on public.users            to anon;

grant select, insert, update, delete on public.game_progress     to authenticated;
grant select                        on public.game_progress     to anon;

grant select, insert            on public.game_history          to authenticated;
grant select                        on public.game_history      to anon;

grant select, insert, update, delete on public.game_snapshot     to authenticated;

grant select                        on public.achievements       to anon, authenticated;
grant select, insert                on public.user_achievements  to authenticated;
grant select                        on public.user_achievements  to anon;

grant select                        on public.daily_mystery_claims to authenticated;

-- Functions (RPCs) called from the client — EXECUTE is a separate grant
-- from table access, and these are `security definer` so the function's
-- OWNER's table privileges apply inside it, but the caller still needs
-- EXECUTE to invoke it at all.
grant execute on function public.submit_level_result(int, int, int, int, int) to authenticated;
grant execute on function public.add_coins(int) to authenticated;
grant execute on function public.spend_coins(int) to authenticated;
grant execute on function public.claim_daily_mystery_box() to authenticated;
grant execute on function public.buy_item(text, int) to authenticated;
grant execute on function public.use_item(text) to authenticated;
grant execute on function public.grant_item(text, int) to authenticated;

-- ------------------------------------------------------------
-- Quick self-check: run this SELECT afterwards — every row here should
-- show 'YES' for the privileges your code actually uses. If any of your
-- tables are missing from this list entirely, the GRANT above didn't
-- take (double-check the table name/spelling).
-- ------------------------------------------------------------
-- select table_name, grantee, privilege_type
-- from information_schema.table_privileges
-- where table_schema = 'public' and grantee in ('anon', 'authenticated')
-- order by table_name, grantee, privilege_type;

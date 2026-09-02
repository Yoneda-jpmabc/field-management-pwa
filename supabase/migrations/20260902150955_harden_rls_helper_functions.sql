-- rls_by_worker_permission の後始末。Supabase のセキュリティアドバイザーが
-- 拾った 2 点を潰す。
--
-- 1. 判定関数の search_path が固定されていない
--    呼び出し元が search_path を細工すると、public.current_worker_permission
--    のつもりで別スキーマの同名関数を掴まされうる。SECURITY DEFINER の
--    2 つは最初から固定してあるので、残りの 3 つも揃える。
-- 2. 判定関数が anon からも呼べる
--    ポリシーは authenticated 向けにしか張っていないので、anon がこれらを
--    呼ぶ場面は無い。REST に生えている必要も無いので閉じる。
--
-- authenticated からは revoke しないこと。ポリシーの式は「問い合わせている
-- ロールの権限」で評価されるため、EXECUTE を落とすと全員が何も読めなくなる。

create or replace function public.is_active_worker()
returns boolean
language sql
stable
set search_path = ''
as $$ select public.current_worker_permission() is not null $$;

create or replace function public.can_edit_records()
returns boolean
language sql
stable
set search_path = ''
as $$ select public.current_worker_permission() in ('all', 'allowed') $$;

create or replace function public.can_edit_masters()
returns boolean
language sql
stable
set search_path = ''
as $$ select public.current_worker_permission() = 'all' $$;

revoke execute on function public.current_worker_permission() from anon, public;
revoke execute on function public.is_active_worker() from anon, public;
revoke execute on function public.can_edit_records() from anon, public;
revoke execute on function public.can_edit_masters() from anon, public;

grant execute on function public.current_worker_permission() to authenticated;
grant execute on function public.is_active_worker() to authenticated;
grant execute on function public.can_edit_records() to authenticated;
grant execute on function public.can_edit_masters() to authenticated;

-- login_email_for だけは anon に開けたままにする。ログイン前に呼ぶ唯一の窓口で、
-- ここを閉じると誰もログインできなくなる（アドバイザーの警告は承知のうえ）。

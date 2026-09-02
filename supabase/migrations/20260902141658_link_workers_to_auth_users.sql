-- ログインは「login_id + パスワード」で行うが、Supabase Auth の
-- signInWithPassword はメールしか受け付けない。login_id からメールを引く層が
-- 要るので、workers に auth_email を持たせる。
--
-- auth.users は anon から読めず、メール規則（<employee_no>@faaaaarm.jp）に
-- 寄せると employee_no 未採番の人（清水・神田）が扱えないため、
-- workers 側に控えるのが一番素直で、規則が変わっても壊れない。

alter table public.workers
  add column if not exists auth_email text unique;

comment on column public.workers.auth_email is
  'Supabase Auth のログイン用メール。login_id から signInWithPassword を呼ぶために控える。auth.users.email と一致させること。';

-- 既存 24 人：auth_user_id で引いて実際のメールを写す。
update public.workers as w
set auth_email = u.email, updated_at = now()
from auth.users as u
where u.id = w.auth_user_id
  and w.auth_email is distinct from u.email;

-- 清水・神田：管理表で No. が空欄のため employee_no では突き合わせられない。
-- 007=清水 / 008=神田 の対応はユーザー確認済み。
update public.workers as w
set auth_user_id = u.id, auth_email = u.email, updated_at = now()
from auth.users as u
where u.email = '007@faaaaarm.jp'
  and w.name = '清水' and w.employee_no is null and w.auth_user_id is null;

update public.workers as w
set auth_user_id = u.id, auth_email = u.email, updated_at = now()
from auth.users as u
where u.email = '008@faaaaarm.jp'
  and w.name = '神田' and w.employee_no is null and w.auth_user_id is null;

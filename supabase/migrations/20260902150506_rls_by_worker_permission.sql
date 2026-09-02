-- 試用中の「anon も含めて全許可」を外し、workers.permission どおりの権限に張り替える。
--
-- 対応は lib/auth/permissions.ts と同じにしてある。片方だけ直すとズレるので、
-- 権限を増減するときは必ず両方を直すこと。
--   all       … マスタも記録も書ける（canEditMasters）
--   allowed   … 記録だけ書ける（canEditRecords）
--   view_only … 読むだけ
--
-- 読み取りは、ログインしている有効な作業者なら全員に全行を許す。
-- 画面側では閲覧のみの人に自分の記録だけを見せているが（canViewEveryone）、
-- あれは見せ方の問題で、DB で他人の行を隠すと管理タブの確認状況や
-- 収穫ボードの集計（全員ぶんの合計）まで欠けてしまうため、ここでは絞らない。

-- ---------------------------------------------------------------------------
-- 判定用のヘルパー
-- ---------------------------------------------------------------------------

-- ポリシーから workers を引くので、SECURITY DEFINER にして RLS を通さない。
-- 素で書くと「workers のポリシーを評価するために workers を読む」で無限再帰になる。
-- search_path を空にしているため、中の参照はすべて schema 修飾すること。
create or replace function public.current_worker_permission()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select w.permission
  from public.workers w
  where w.auth_user_id = (select auth.uid())
    and w.is_active
    and w.deleted_at is null
  limit 1
$$;

comment on function public.current_worker_permission() is
  'いま操作している作業者の permission。未ログイン・無効・退職なら NULL。';

-- 作業者として有効かどうか。auth アカウントが生きていても、workers 側を
-- 落とせば（is_active = false / deleted_at）ここが NULL になって全部止まる。
create or replace function public.is_active_worker()
returns boolean
language sql
stable
as $$ select public.current_worker_permission() is not null $$;

create or replace function public.can_edit_records()
returns boolean
language sql
stable
as $$ select public.current_worker_permission() in ('all', 'allowed') $$;

create or replace function public.can_edit_masters()
returns boolean
language sql
stable
as $$ select public.current_worker_permission() = 'all' $$;

-- ---------------------------------------------------------------------------
-- ログイン前に使う唯一の入口
-- ---------------------------------------------------------------------------

-- ログインIDからメールを引くのはログイン前＝anon で走るため、RLS では通せない。
-- workers を anon に開けると login_id とメールの一覧を丸ごと抜かれるので、
-- 「ID を 1 つ渡すとメールが 1 つ返るだけ」の窓口だけを開ける。
create or replace function public.login_email_for(p_login_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select w.auth_email
  from public.workers w
  where w.login_id = upper(btrim(p_login_id))
    and w.is_active
    and w.deleted_at is null
  limit 1
$$;

comment on function public.login_email_for(text) is
  'ログインIDに対応する Supabase Auth のメール。無効な作業者と未登録IDは NULL。ログイン前に anon から呼ぶ。';

revoke all on function public.login_email_for(text) from public;
grant execute on function public.login_email_for(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- ポリシーの張り替え
-- ---------------------------------------------------------------------------

do $$
declare
  -- マスタ。書き換えると実績・収穫の集計すべてに影響するので all だけが触れる。
  master_tables constant text[] := array[
    'crops', 'fields', 'field_plantings', 'crop_check_items',
    'work_type_master', 'work_category_master', 'work_type_raw_mapping',
    'workers'
  ];
  -- 日々の記録。all と allowed が書ける。
  record_tables constant text[] := array[
    'work_records', 'harvest_records', 'work_plans',
    'crop_check_records', 'pesticide_dilutions'
  ];
  t text;
  writer text;
begin
  foreach t in array (master_tables || record_tables) loop
    execute format('drop policy if exists trial_full_access on public.%I', t);

    -- 判定関数は (select ...) で包む。裸で書くと行ごとに評価され、
    -- 一覧を引くたびに行数ぶん workers を引きに行くことになる。
    execute format($f$
      create policy workers_read on public.%I
        for select to authenticated
        using ((select public.is_active_worker()))
    $f$, t);

    writer := case
      when t = any(master_tables) then 'public.can_edit_masters()'
      else 'public.can_edit_records()'
    end;

    execute format($f$
      create policy workers_insert on public.%I
        for insert to authenticated
        with check ((select %s))
    $f$, t, writer);

    execute format($f$
      create policy workers_update on public.%I
        for update to authenticated
        using ((select %s)) with check ((select %s))
    $f$, t, writer, writer);

    execute format($f$
      create policy workers_delete on public.%I
        for delete to authenticated
        using ((select %s))
    $f$, t, writer);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- workers の秘密の列
-- ---------------------------------------------------------------------------

-- login_id は資格情報の半分。RLS は行単位なので、列は GRANT で落とす。
-- これを開けたままだと、閲覧のみの人でも全員のログインIDとメールを一覧できる。
-- ログイン処理は上の login_email_for() を通るので、アプリはこの 2 列を読まない。
revoke all on public.workers from anon;
revoke select on public.workers from authenticated;
grant select (
  id, name, short_name, auth_user_id, employee_no, employment_type,
  department, main_role, language, permission, display_order, is_active,
  created_at, updated_at, deleted_at
) on public.workers to authenticated;

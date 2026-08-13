-- 作業実績管理の初期スキーマ（2026-08-13 時点のスナップショット）
--
-- この日は Supabase へ 7 回に分けて変更を流したが、途中経過（列の追加や
-- 接続確認用テーブルの削除）を残しても読みにくいだけなので、最終状態を
-- 1 本にまとめている。以後の変更はこのファイルを書き換えず、新しい
-- マイグレーションを追加すること。
--
-- ファイル名の日時は実際に適用した最後のマイグレーションと同じ値にしてある。
-- Supabase 側の記録では適用済み扱いになるため、CLI を導入しても
-- このファイルが二重に流れることはない。

-- ---------------------------------------------------------------------------
-- 共通
-- ---------------------------------------------------------------------------

-- 更新時刻の自動更新（オフライン同期の Last-Write-Win 判定に使う）
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- マスタ
-- ---------------------------------------------------------------------------

-- ユーザー兼作業者マスタ。
-- Supabase アカウントを持たない家族・従業員も登録できるようにするため auth.users
-- とは分離し、アカウントを持ったら auth_user_id で紐付ける。
create table public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_no text,
  login_id text unique,
  employment_type text,
  department text,
  main_role text,
  language text not null default 'ja',
  permission text not null default 'view_only'
    check (permission in ('all', 'edit_view', 'view_only')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.workers is
  'ユーザー兼作業者マスタ。auth アカウント不要（管理者一括入力モデル）。';
comment on column public.workers.short_name is
  'チップ表示用の略称。未設定なら name を表示する。';
comment on column public.workers.employee_no is
  '管理表の No.（001 / 101 / 201 など）。先頭ゼロを保つため text。未採番の人は NULL。';
comment on column public.workers.login_id is
  '将来のログインID。認証実装時に auth ユーザーと突き合わせるための鍵。';
comment on column public.workers.employment_type is '正社員 / パート / 実習生。';
comment on column public.workers.department is '所属（WF / AA など）。';
comment on column public.workers.language is 'BCP47 言語コード。ja / id。';
comment on column public.workers.permission is
  'all=全て / edit_view=編集・閲覧 / view_only=閲覧のみ。認証導入時に RLS の判定材料にする。';
comment on column public.workers.deleted_at is
  '論理削除。オフライン同期で物理削除は復元不能になるため使わない。';

-- 作業種類マスタ。正規化フェーズで確定した正式名だけを入れる。
create table public.work_type_master (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.work_type_master is
  '作業種類マスタ。試験期間中は空でよく、work_records.work_type_raw から昇格させる。';

-- 圃場マスタ
create table public.fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area_a numeric(10,2),
  crop text,
  memo text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on column public.fields.area_a is
  '面積（アール）。不明な圃場があるため NULL 許容。';

create trigger workers_set_updated_at
  before update on public.workers
  for each row execute function public.set_updated_at();

create trigger work_type_master_set_updated_at
  before update on public.work_type_master
  for each row execute function public.set_updated_at();

create trigger fields_set_updated_at
  before update on public.fields
  for each row execute function public.set_updated_at();

create index workers_active_order_idx
  on public.workers (display_order, name)
  where deleted_at is null and is_active;

create index work_type_master_active_order_idx
  on public.work_type_master (display_order, name)
  where deleted_at is null and is_active;

create index fields_active_order_idx
  on public.fields (display_order, name)
  where deleted_at is null and is_active;

-- ---------------------------------------------------------------------------
-- 作業実績
-- ---------------------------------------------------------------------------

-- 仕様書の user_id は「誰の作業か(worker_id)」と「誰が入力したか(created_by)」に
-- 分解している。管理者1名が全作業者分を入力するモデルのため、この2つは別物になる。
create table public.work_records (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id),
  work_date date not null,
  start_time time,
  end_time time,
  work_type_id uuid references public.work_type_master(id),
  work_type_raw text,
  field_id uuid references public.fields(id),
  memo text,
  batch_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on column public.work_records.work_type_raw is
  '試験期間用のフリーテキスト作業種類。正規化完了後は work_type_id に寄せる。';
comment on column public.work_records.batch_id is
  '一括登録で同時に作られたレコードをまとめる ID。まとめて編集・取り消しするために使う。';
comment on column public.work_records.created_by is
  '入力操作をした auth ユーザー。認証導入前は NULL。';

create trigger work_records_set_updated_at
  before update on public.work_records
  for each row execute function public.set_updated_at();

-- 一覧・Gantt は日付降順、集計は作業者/圃場軸で引く
create index work_records_work_date_idx
  on public.work_records (work_date desc)
  where deleted_at is null;

create index work_records_worker_date_idx
  on public.work_records (worker_id, work_date desc)
  where deleted_at is null;

create index work_records_field_date_idx
  on public.work_records (field_id, work_date desc)
  where deleted_at is null;

create index work_records_batch_idx
  on public.work_records (batch_id)
  where batch_id is not null;

-- 表記ゆれ棚卸しとオートコンプリートで distinct を引くため
create index work_records_work_type_raw_idx
  on public.work_records (work_type_raw)
  where work_type_raw is not null and deleted_at is null;

-- 正規化フェーズで使う対応表（試験期間中は空のまま）
create table public.work_type_raw_mapping (
  raw_text text primary key,
  work_type_id uuid references public.work_type_master(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.work_type_raw_mapping is
  'work_type_raw の正規化対応表。正式名の決定は人間が承認したものだけを入れる。';

create trigger work_type_raw_mapping_set_updated_at
  before update on public.work_type_raw_mapping
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- 【試験期間限定】ログイン画面が無い状態で入力を開始するため、anon にも全許可を
-- 出している。家族・従業員へ展開する前に必ず認証を導入し、これらの trial_
-- ポリシーを auth.uid() ベースのものへ差し替えること。名前の接頭辞が目印。
alter table public.workers enable row level security;
alter table public.work_type_master enable row level security;
alter table public.fields enable row level security;
alter table public.work_records enable row level security;
alter table public.work_type_raw_mapping enable row level security;

create policy trial_full_access on public.workers
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.work_type_master
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.fields
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.work_records
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.work_type_raw_mapping
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- ビュー
-- ---------------------------------------------------------------------------

-- 正規化ステップ4（出現ワードの頻度棚卸し）とステップ2（オートコンプリート）の
-- 両方で使う。security_invoker により、参照元テーブルの RLS がそのまま効く。
create view public.work_type_raw_stats
with (security_invoker = on)
as
select
  work_type_raw,
  count(*) as record_count,
  min(work_date) as first_used_on,
  max(work_date) as last_used_on
from public.work_records
where work_type_raw is not null
  and work_type_raw <> ''
  and deleted_at is null
group by work_type_raw;

comment on view public.work_type_raw_stats is
  'work_type_raw の出現頻度。正規化の棚卸しと入力時サジェストに使う。';

-- 1レコードの所要時間（分）。
-- 開始・終了のどちらかが未入力、または終了が開始以前（入力ミスの疑い）は
-- NULL＝時間未計上とし、件数だけ数えられるようにしている。勝手に24時間跨ぎと
-- して補正すると誤入力が見えなくなる。
create view public.work_record_durations
with (security_invoker = on)
as
select
  r.id,
  r.work_date,
  r.worker_id,
  r.field_id,
  coalesce(m.name, nullif(btrim(r.work_type_raw), ''), '未設定') as work_type_label,
  case
    when r.start_time is not null
     and r.end_time is not null
     and r.end_time > r.start_time
    then extract(epoch from (r.end_time - r.start_time)) / 60.0
  end as duration_minutes
from public.work_records r
left join public.work_type_master m on m.id = r.work_type_id
where r.deleted_at is null;

comment on view public.work_record_durations is
  '作業実績に所要時間（分）と表示用の作業種類ラベルを付けたもの。集計はすべてここを起点にする。';

-- ---------------------------------------------------------------------------
-- 集計関数
-- ---------------------------------------------------------------------------

-- 期間は呼び出し側が日/週/月/年の境界を計算して渡す。

create or replace function public.work_summary_by_worker(
  from_date date,
  to_date date
)
returns table (
  worker_id uuid,
  worker_name text,
  total_minutes numeric,
  record_count bigint,
  untimed_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.id,
    coalesce(w.short_name, w.name),
    coalesce(sum(d.duration_minutes), 0),
    count(*),
    count(*) filter (where d.duration_minutes is null)
  from public.work_record_durations d
  join public.workers w on w.id = d.worker_id
  where d.work_date between from_date and to_date
  group by w.id, w.short_name, w.name, w.display_order
  order by coalesce(sum(d.duration_minutes), 0) desc, w.display_order;
$$;

create or replace function public.work_summary_by_work_type(
  from_date date,
  to_date date
)
returns table (
  work_type_label text,
  total_minutes numeric,
  record_count bigint,
  untimed_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    d.work_type_label,
    coalesce(sum(d.duration_minutes), 0),
    count(*),
    count(*) filter (where d.duration_minutes is null)
  from public.work_record_durations d
  where d.work_date between from_date and to_date
  group by d.work_type_label
  order by coalesce(sum(d.duration_minutes), 0) desc, d.work_type_label;
$$;

-- 作業者 × 作業種類。「誰がどの作業に何時間使ったか」を1画面で見るために使う。
create or replace function public.work_summary_by_worker_and_type(
  from_date date,
  to_date date
)
returns table (
  worker_id uuid,
  worker_name text,
  work_type_label text,
  total_minutes numeric,
  record_count bigint,
  untimed_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.id,
    coalesce(w.short_name, w.name),
    d.work_type_label,
    coalesce(sum(d.duration_minutes), 0),
    count(*),
    count(*) filter (where d.duration_minutes is null)
  from public.work_record_durations d
  join public.workers w on w.id = d.worker_id
  where d.work_date between from_date and to_date
  group by w.id, w.short_name, w.name, w.display_order, d.work_type_label
  order by w.display_order, coalesce(sum(d.duration_minutes), 0) desc;
$$;

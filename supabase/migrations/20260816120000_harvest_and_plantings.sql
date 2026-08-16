-- 収穫まわりのテーブルと、権限区分の整理。
--
-- ここで入る変更は 3 つ。
--   1. workers.permission の呼び名を運用に合わせて整理する
--   2. 「どこに何がどれくらいあるか」を持つ作付情報テーブル field_plantings
--   3. 「どれくらい収穫したか」を残す harvest_records と、その集計関数
--
-- ログイン（login_id + 暗証番号）は実際に運用へ載せる段階で入れる。
-- 権限の判定材料になる permission は先に整理しておくが、暗証番号の保存先は
-- ログインを実装するときに別のマイグレーションで足すこと。

-- ---------------------------------------------------------------------------
-- 1. 権限区分
-- ---------------------------------------------------------------------------

-- 権限は 3 段階のまま、中間の呼び名を実際の運用に合わせて edit_view → allowed に変える。
--   all       … 全権限。圃場・作付・作物マスタの登録編集ができるのはこれだけ。
--   allowed   … 実績・予定・収穫の登録編集はできるが、マスタの登録編集はできない。
--   view_only … 閲覧のみ。入力系の画面と全体集計を出さない。
alter table public.workers drop constraint if exists workers_permission_check;

update public.workers set permission = 'allowed' where permission = 'edit_view';

alter table public.workers
  add constraint workers_permission_check
  check (permission in ('all', 'allowed', 'view_only'));

comment on column public.workers.permission is
  'all=全権限（マスタ編集可） / allowed=実績・収穫の登録編集可 / view_only=閲覧のみ。';

-- ---------------------------------------------------------------------------
-- 2. 作物の標準単位
-- ---------------------------------------------------------------------------

-- 収穫量の単位は作物ごとに違う（kg で量るもの、パック・ケースで数えるもの）。
-- 既定を kg にしてあるが、実際の単位は設定画面から作物ごとに直すこと。
alter table public.crops add column if not exists unit text not null default 'kg';

comment on column public.crops.unit is
  '収穫量の標準単位（kg / パック / ケース など）。収穫入力の初期値に使う。';

-- ---------------------------------------------------------------------------
-- 3. 作付情報
-- ---------------------------------------------------------------------------

-- 「どの圃場に何がどれくらい植わっているか」。
-- fields.crop は 1 圃場 1 作物のメモ書きしか持てないため、圃場と作物の
-- 多対多をこちらで持ち、fields.crop は概要表示用として残す。
create table public.field_plantings (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id),
  crop_id uuid not null references public.crops(id),
  planted_on date,
  -- 数え方は作物によって違うので、株数と面積の両方を任意で持つ。
  -- どちらか片方だけ入っていることを前提にした表示にしている。
  plant_count integer check (plant_count is null or plant_count >= 0),
  area_a numeric(10,2) check (area_a is null or area_a >= 0),
  -- 収穫の見込み量（任意）。入っていれば進捗バーの分母に使い、無ければ実績だけ出す。
  expected_quantity numeric(12,2) check (expected_quantity is null or expected_quantity >= 0),
  status text not null default 'growing'
    check (status in ('planned', 'growing', 'harvesting', 'finished')),
  memo text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.field_plantings is
  '作付情報。圃場ごとの「今なにがどれくらい植わっているか」を持つ。';
comment on column public.field_plantings.status is
  'planned=これから / growing=生育中 / harvesting=収穫中 / finished=終了。';
comment on column public.field_plantings.expected_quantity is
  '収穫見込み量。単位は crops.unit に従う。未入力なら進捗率は出さない。';

create trigger field_plantings_set_updated_at
  before update on public.field_plantings
  for each row execute function public.set_updated_at();

-- 収穫画面は常に「圃場ごとの作付一覧」で引く。
create index field_plantings_field_idx
  on public.field_plantings (field_id, display_order)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- 4. 収穫実績
-- ---------------------------------------------------------------------------

create table public.harvest_records (
  id uuid primary key default gen_random_uuid(),
  harvest_date date not null,
  field_id uuid not null references public.fields(id),
  crop_id uuid not null references public.crops(id),
  -- どの作付から採ったか。作付を登録していない圃場からの収穫も残せるよう NULL 許容。
  planting_id uuid references public.field_plantings(id),
  quantity numeric(12,2) not null check (quantity >= 0),
  -- 単位は記録時点の crops.unit を写し取る。
  -- マスタの単位を後から変えても、過去の記録の意味が変わらないようにするため。
  unit text not null,
  worker_id uuid references public.workers(id),
  memo text,
  created_by_worker_id uuid references public.workers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.harvest_records is
  '収穫実績。「いつ・どの圃場の・どの作物を・どれだけ採ったか」を残す。';
comment on column public.harvest_records.unit is
  '記録時点の作物マスタの単位を写したもの。マスタ変更で過去の記録が変質しないようにする。';
comment on column public.harvest_records.worker_id is
  '収穫した作業者。入力者（created_by_worker_id）とは別。';

create trigger harvest_records_set_updated_at
  before update on public.harvest_records
  for each row execute function public.set_updated_at();

create index harvest_records_date_idx
  on public.harvest_records (harvest_date desc)
  where deleted_at is null;

create index harvest_records_field_date_idx
  on public.harvest_records (field_id, harvest_date desc)
  where deleted_at is null;

create index harvest_records_planting_idx
  on public.harvest_records (planting_id)
  where deleted_at is null and planting_id is not null;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------

alter table public.field_plantings enable row level security;
alter table public.harvest_records enable row level security;

-- 【試験期間限定】他テーブルと同様、認証導入時に差し替えること。
create policy trial_full_access on public.field_plantings
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.harvest_records
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 6. 集計
-- ---------------------------------------------------------------------------

-- 収穫画面は「作付ごとの累計」と「選んだ期間の合計」の両方を出す。
-- 期間なしでも呼べるよう from_date / to_date は NULL 許容にし、
-- NULL のときは期間で絞らない（＝累計）扱いにしている。
--
-- 作付に紐付かない収穫（planting_id が NULL）も 1 行として返るため、
-- 呼び出し側は planting_id の有無で振り分けること。
create or replace function public.harvest_summary_by_planting(
  from_date date default null,
  to_date date default null
)
returns table (
  planting_id uuid,
  field_id uuid,
  crop_id uuid,
  total_quantity numeric,
  record_count bigint,
  last_harvested_on date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.planting_id,
    r.field_id,
    r.crop_id,
    coalesce(sum(r.quantity), 0),
    count(*),
    max(r.harvest_date)
  from public.harvest_records r
  where r.deleted_at is null
    and (from_date is null or r.harvest_date >= from_date)
    and (to_date is null or r.harvest_date <= to_date)
  group by r.planting_id, r.field_id, r.crop_id;
$$;

comment on function public.harvest_summary_by_planting(date, date) is
  '作付ごとの収穫量集計。期間を NULL にすると全期間の累計になる。';

-- 作物ごとの管理方法（デイリーチェックリスト）と、その日々の確認記録。
--
-- 「イチゴなら毎日ここを見る」といった管理項目を作物マスタにぶら下げ、
-- 管理タブで日付ごとにチェックしていく。
--
-- 項目の中身（何をどう確認するか）は業務側で決めるものなので、ここでは
-- 空の入れ物だけ作る。項目は設定画面から登録する。

-- ---------------------------------------------------------------------------
-- チェック項目マスタ
-- ---------------------------------------------------------------------------

create table public.crop_check_items (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id),
  title text not null,
  -- 確認のしかたや判断の基準。現場で迷ったときに読む用。
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.crop_check_items is
  '作物ごとの管理項目（デイリーチェックリストの1行）。中身は業務側で決める。';
comment on column public.crop_check_items.description is
  '確認のしかた・判断基準。管理タブで項目名の下に出す。';

create trigger crop_check_items_set_updated_at
  before update on public.crop_check_items
  for each row execute function public.set_updated_at();

-- 管理タブは常に「作物ごとの項目一覧」で引く。
create index crop_check_items_crop_order_idx
  on public.crop_check_items (crop_id, display_order)
  where deleted_at is null and is_active;

-- ---------------------------------------------------------------------------
-- 日々の確認記録
-- ---------------------------------------------------------------------------

-- 1 項目 × 1 日で 1 行。チェックを外すのは「削除」ではなく「未確認に戻す」
-- という状態変化なので、ここだけは deleted_at を持たせず is_done で表す。
-- こうしておくと (item_id, check_date) に一意制約を張れて、
-- チェックの付け外しを upsert 1 回で書けるようになる。
create table public.crop_check_records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.crop_check_items(id),
  check_date date not null,
  is_done boolean not null default true,
  memo text,
  -- 確認した人。ログイン導入までは NULL のまま。
  worker_id uuid references public.workers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, check_date)
);

comment on table public.crop_check_records is
  '管理項目の日々の確認記録。1 項目 × 1 日で 1 行。';
comment on column public.crop_check_records.is_done is
  'true=確認済み / false=未確認に戻した。行を消さず状態で持つ。';

create trigger crop_check_records_set_updated_at
  before update on public.crop_check_records
  for each row execute function public.set_updated_at();

-- 管理タブは「その日の分」をまとめて引く。
create index crop_check_records_date_idx
  on public.crop_check_records (check_date);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.crop_check_items enable row level security;
alter table public.crop_check_records enable row level security;

-- 【試験期間限定】他テーブルと同様、認証導入時に差し替えること。
create policy trial_full_access on public.crop_check_items
  for all to anon, authenticated using (true) with check (true);

create policy trial_full_access on public.crop_check_records
  for all to anon, authenticated using (true) with check (true);

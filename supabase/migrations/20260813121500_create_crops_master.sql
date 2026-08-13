-- 作物マスタを追加し、作業実績から参照できるようにする。
--
-- 作業種類（work_type_raw のフリー入力 → 後で正規化）と違い、作物は最初から
-- 確定した一覧があるため、フリーテキスト運用は挟まず最初から選択式にする。

create table public.crops (
  id uuid primary key default gen_random_uuid(),
  crop_code text not null unique,
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.crops is '作物マスタ。';
comment on column public.crops.crop_code is
  '管理表の作物別ID（01〜）。先頭ゼロを保つため text。';

create trigger crops_set_updated_at
  before update on public.crops
  for each row execute function public.set_updated_at();

create index crops_active_order_idx
  on public.crops (display_order, name)
  where deleted_at is null and is_active;

alter table public.crops enable row level security;

-- 【試験期間限定】他テーブルと同様、認証導入時に差し替えること。
create policy trial_full_access on public.crops
  for all to anon, authenticated using (true) with check (true);

-- 作業実績に作物を持たせる。
-- work_type_id / field_id と同じく未設定を許す（入力の途中で分からない場合があるため）。
alter table public.work_records
  add column crop_id uuid references public.crops(id);

comment on column public.work_records.crop_id is
  'その作業がどの作物に対するものか。圃場に植わっている作物とは別に持つ。';

create index work_records_crop_date_idx
  on public.work_records (crop_id, work_date desc)
  where deleted_at is null;

-- 作物は固定の参照データなので、組織のデータ（seed.sql の作業者）とは分けて
-- マイグレーション側に置く。空の DB にこのファイルを流せばそのまま使える。
insert into public.crops (crop_code, name, display_order) values
  ('01', 'イチゴ',      1),
  ('02', 'トマト',      2),
  ('03', 'きくらげ',    3),
  ('04', 'サツマイモ',  4),
  ('05', 'イモ（苗）',  5),
  ('06', '玉葱（苗）',  6);

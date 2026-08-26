-- 農薬の希釈計算を保存し、あとから確認できるようにするテーブル。
--
-- 「希釈倍率」と「散布液量（希釈後の総量）」の 2 つだけを入力すれば
-- 原液量・水量が求まる（原液量 = 散布液量 ÷ 希釈倍率）ので、
-- 農薬ごとの使用基準など法令に関わる値はここでは一切扱わない。
-- 計算はアプリ側（lib/pesticide/calc.ts）で行い、結果をそのまま保存する。

create table public.pesticide_dilutions (
  id uuid primary key default gen_random_uuid(),
  used_on date not null,
  -- マスタ化していないため自由入力。将来、農薬マスタを作る際は列を足して移行する。
  pesticide_name text not null,
  -- 「n 倍」の n。
  dilution_ratio numeric(10,2) not null check (dilution_ratio > 0),
  -- 希釈後の散布液量（合計）。単位は L。
  target_volume_l numeric(10,2) not null check (target_volume_l > 0),
  -- 計算結果のスナップショット。単位を変えても過去の記録の意味が変わらないよう、
  -- 倍率・散布液量とあわせて計算時点の値をそのまま持つ。
  stock_volume_ml numeric(12,2) not null check (stock_volume_ml >= 0),
  water_volume_l numeric(10,2) not null check (water_volume_l >= 0),
  memo text,
  -- 計算した作業者。ログイン未実装のうちは誰の操作か分からないため NULL 許容。
  worker_id uuid references public.workers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.pesticide_dilutions is
  '農薬の希釈計算の記録。希釈倍率と散布液量から求めた原液量・水量を保存し、あとから確認できるようにする。';
comment on column public.pesticide_dilutions.dilution_ratio is
  '希釈倍率（n 倍の n）。ユーザー入力をそのまま保存する。';
comment on column public.pesticide_dilutions.stock_volume_ml is
  '計算結果の原液量（mL）。target_volume_l と dilution_ratio から算出したスナップショット。';
comment on column public.pesticide_dilutions.water_volume_l is
  '計算結果の水量（L）。target_volume_l と stock_volume_ml から算出したスナップショット。';

create trigger pesticide_dilutions_set_updated_at
  before update on public.pesticide_dilutions
  for each row execute function public.set_updated_at();

create index pesticide_dilutions_used_on_idx
  on public.pesticide_dilutions (used_on desc, created_at desc)
  where deleted_at is null;

alter table public.pesticide_dilutions enable row level security;

-- 【試験期間限定】他テーブルと同様、認証導入時に差し替えること。
create policy trial_full_access on public.pesticide_dilutions
  for all to anon, authenticated using (true) with check (true);

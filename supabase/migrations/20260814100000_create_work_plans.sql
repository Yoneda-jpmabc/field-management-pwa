-- 作業予定テーブルを追加する。
--
-- work_records（実績）が「やったこと」を残すのに対し、work_plans は
-- 「これからやること」をダッシュボードの週カレンダーに置くためのもの。
-- 実績と違い作業者は持たせない。予定の段階では担当が決まっていないことが多く、
-- 「大まかな予定を先に置いておく」用途を優先するため。
-- 実績と紐付けたくなった時点で plan_id を work_records 側へ足す想定。

create table public.work_plans (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null,
  -- 大まかな予定なので、作業種類マスタは参照せずフリーテキストにする。
  title text not null,
  crop_id uuid references public.crops(id),
  field_id uuid references public.fields(id),
  memo text,
  is_done boolean not null default false,
  -- 同じ日に複数の予定を置いたときの並び順。小さいほど上。
  display_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.work_plans is
  '作業予定。ダッシュボードの週カレンダーに表示する「これからやること」。';
comment on column public.work_plans.title is
  '大まかな作業内容のフリーテキスト。実績側の work_type_raw とは別管理。';
comment on column public.work_plans.is_done is
  '予定を消化したかどうか。実績レコードとの自動連携はしない（手で切り替える）。';
comment on column public.work_plans.created_by is
  '入力操作をした auth ユーザー。認証導入前は NULL。';

create trigger work_plans_set_updated_at
  before update on public.work_plans
  for each row execute function public.set_updated_at();

-- カレンダーは常に「ある期間の plan_date」で引くため、日付を先頭にする。
create index work_plans_date_idx
  on public.work_plans (plan_date, display_order)
  where deleted_at is null;

alter table public.work_plans enable row level security;

-- 【試験期間限定】他テーブルと同様、認証導入時に差し替えること。
create policy trial_full_access on public.work_plans
  for all to anon, authenticated using (true) with check (true);

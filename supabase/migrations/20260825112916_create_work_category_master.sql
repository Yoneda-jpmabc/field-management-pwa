-- 作業区分マスタ（大分類）の新設と、作業種別マスタ（中分類）への紐付け
--
-- work_type_master は単一階層のフラットなマスタとして作られていたが、
-- 労働時間集計エクセル（作業内容 大/中/小）を仕分けした結果、
-- 大分類（作業区分）でグルーピングしないと同名の中分類（管理・収穫など）が
-- 複数の区分にまたがって衝突するため、階層を追加する。

-- ---------------------------------------------------------------------------
-- work_category_master（作業区分＝大分類）
-- ---------------------------------------------------------------------------

create table public.work_category_master (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.work_category_master is
  '作業区分マスタ（大分類）。work_type_master（中分類）をグルーピングする。';

create trigger work_category_master_set_updated_at
  before update on public.work_category_master
  for each row execute function public.set_updated_at();

create index work_category_master_active_order_idx
  on public.work_category_master (display_order, name)
  where deleted_at is null and is_active;

alter table public.work_category_master enable row level security;

-- 【試験期間限定】他マスタと同じ trial_ ポリシー。認証導入時に差し替えること。
create policy trial_full_access on public.work_category_master
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- work_type_master（作業種別＝中分類）に category_id を追加
-- ---------------------------------------------------------------------------

alter table public.work_type_master
  add column category_id uuid references public.work_category_master(id);

-- 「管理」「収穫」など同名の中分類が複数の区分にまたがるため、
-- 一意制約を name 単独から (category_id, name) の複合キーに変更する。
alter table public.work_type_master
  drop constraint if exists work_type_master_name_key;

alter table public.work_type_master
  add constraint work_type_master_category_id_name_key unique (category_id, name);

create index work_type_master_category_id_idx
  on public.work_type_master (category_id);

comment on column public.work_type_master.category_id is
  '所属する作業区分（work_category_master）。労働時間集計エクセルの「作業内容（大）」に対応。';

-- ---------------------------------------------------------------------------
-- 初期データ（労働時間集計エクセル 2025.7〜2026.6 の仕分け結果）
--
-- 「仕入」系（芋苗仕入・玉葱仕入）は対象外。台風対策/台風対策解除は
-- 「その他」の「台風対策」1件に統合。サツマイモの「芋掘り」は「収穫」に統合。
-- 玉葱生産の「日光ビニール」は「日光ビニール張り」に改称。
-- ---------------------------------------------------------------------------

insert into public.work_category_master (name, display_order) values
  ('キクラゲ', 10),
  ('芋苗生産', 20),
  ('玉葱生産', 30),
  ('サツマイモ', 40),
  ('イチゴ', 50),
  ('その他', 60);

insert into public.work_type_master (category_id, name, display_order)
select c.id, v.type_name, v.disp_order
from (values
  -- キクラゲ
  ('キクラゲ', '管理', 10),
  ('キクラゲ', '選別', 20),
  ('キクラゲ', '収穫', 30),
  ('キクラゲ', '乾燥', 40),
  ('キクラゲ', '菌床廃棄', 50),
  ('キクラゲ', '回収', 60),
  ('キクラゲ', '設営', 70),
  ('キクラゲ', '出荷', 80),
  ('キクラゲ', '草取り', 90),
  ('キクラゲ', '搬入', 100),
  ('キクラゲ', '清掃', 110),
  ('キクラゲ', '設置', 120),
  ('キクラゲ', '事務作業', 130),
  ('キクラゲ', '撤去', 140),
  ('キクラゲ', '運搬', 150),
  ('キクラゲ', '芽かき', 160),
  -- 芋苗生産
  ('芋苗生産', '管理', 10),
  ('芋苗生産', '収穫', 20),
  ('芋苗生産', '束ね', 30),
  ('芋苗生産', '草取り', 40),
  ('芋苗生産', '設置', 50),
  ('芋苗生産', '定植', 60),
  ('芋苗生産', '葉面散布', 70),
  ('芋苗生産', '撤去', 80),
  ('芋苗生産', '消毒', 90),
  ('芋苗生産', '運搬', 100),
  ('芋苗生産', '差し芽', 110),
  ('芋苗生産', '設営', 120),
  ('芋苗生産', '散布', 130),
  ('芋苗生産', '耕作', 140),
  ('芋苗生産', '清掃', 150),
  ('芋苗生産', '溝堀', 160),
  ('芋苗生産', '畝作り', 170),
  ('芋苗生産', '防草シート', 180),
  ('芋苗生産', '芽かき', 190),
  ('芋苗生産', '草刈り', 200),
  ('芋苗生産', '伐採', 210),
  ('芋苗生産', '補修', 220),
  ('芋苗生産', '石拾い', 230),
  ('芋苗生産', 'ラミネート', 240),
  ('芋苗生産', '土壌分析', 250),
  ('芋苗生産', 'セメント', 260),
  -- 玉葱生産
  ('玉葱生産', '管理', 10),
  ('玉葱生産', '収穫', 20),
  ('玉葱生産', '草取り', 30),
  ('玉葱生産', '播種', 40),
  ('玉葱生産', 'マルチ剥ぎ', 50),
  ('玉葱生産', '設置', 60),
  ('玉葱生産', '設営', 70),
  ('玉葱生産', '日光ビニール剥ぎ', 80),
  ('玉葱生産', '散布', 90),
  ('玉葱生産', '草刈り', 100),
  ('玉葱生産', '日光ビニール張り', 110),
  ('玉葱生産', 'ビニール張り', 120),
  ('玉葱生産', '耕作', 130),
  ('玉葱生産', 'ビニール剥ぎ', 140),
  ('玉葱生産', '葉面散布', 150),
  ('玉葱生産', '除草剤散布', 160),
  ('玉葱生産', '撤去', 170),
  ('玉葱生産', '出荷', 180),
  ('玉葱生産', '播種試験', 190),
  -- サツマイモ
  ('サツマイモ', '定植', 10),
  ('サツマイモ', '収穫', 20),
  ('サツマイモ', '耕作', 30),
  ('サツマイモ', '除草剤散布', 40),
  ('サツマイモ', '散布', 50),
  ('サツマイモ', '設営', 60),
  ('サツマイモ', '草刈り', 70),
  ('サツマイモ', '圃場確認', 80),
  -- イチゴ
  ('イチゴ', '設置', 10),
  ('イチゴ', 'パック詰め', 20),
  ('イチゴ', 'ベンチ', 30),
  -- その他
  ('その他', '事務作業', 10),
  ('その他', '会議', 20),
  ('その他', '台風対策', 30),
  ('その他', '伐採', 40),
  ('その他', 'セメント', 50),
  ('その他', '事務所防草シート', 60),
  ('その他', '清掃センター', 70),
  ('その他', '棚卸', 80),
  ('その他', '予算会議', 90)
) as v(category_name, type_name, disp_order)
join public.work_category_master c on c.name = v.category_name;

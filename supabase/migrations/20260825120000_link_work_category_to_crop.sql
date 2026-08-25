-- 作業区分マスタ(work_category_master)を作物マスタ(crops)に紐付ける
--
-- 作業実績登録で「作物を選ぶ→対応する作業区分の作業種別だけを表示する」
-- ためのリンク。crops と work_category_master は名称・件数が一致しないため
-- （例: crops の「きくらげ」に対し work_category_master は「キクラゲ」、
-- crops に「トマト」はあるが対応する区分の実績データはまだ無い）、
-- 自動突合ではなく明示的な対応表で結ぶ。

alter table public.work_category_master
  add column crop_id uuid references public.crops(id);

comment on column public.work_category_master.crop_id is
  '対応する作物（crops）。作業実績登録で作物選択に応じて作業種別を絞り込むために使う。'
  'null は特定の作物に紐づかない区分（その他＝会議・事務作業など）。';

update public.work_category_master c
set crop_id = crop.id
from public.crops crop
where (c.name, crop.name) in (
  ('キクラゲ', 'きくらげ'),
  ('サツマイモ', 'サツマイモ'),
  ('イチゴ', 'イチゴ'),
  ('芋苗生産', 'イモ（苗）'),
  ('玉葱生産', '玉葱（苗）')
);

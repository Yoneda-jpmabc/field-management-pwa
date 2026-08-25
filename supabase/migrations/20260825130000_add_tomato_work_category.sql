-- 作業区分マスタに「トマト」を追加
--
-- 作業実績登録の「作物」選択を「区分」選択に置き換えるにあたり、
-- crops の 6 作物すべてに対応する区分を用意する。トマトは労働時間集計
-- エクセルに実績が無く区分が無かったため追加する（作業種別は未登録のまま でよい）。

insert into public.work_category_master (name, crop_id, display_order)
select 'トマト', crop.id, 55
from public.crops crop
where crop.name = 'トマト';

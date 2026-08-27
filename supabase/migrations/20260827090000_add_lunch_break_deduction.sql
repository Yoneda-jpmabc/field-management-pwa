-- 実績登録で「午前午後を1本の時間で入力する」ケースの休憩時間を集計に反映する
--
-- 例: 8:00〜15:30 とまとめて入力しても、実際は12:00〜13:00の昼休憩を含んでいる
-- ことが多いため、その1時間は所要時間から差し引いて集計する。
-- ただし12:00〜13:00をまたいでも休憩を取らず作業した場合もあるため、
-- work_records.worked_through_lunch で「休憩を含まない」を明示できるようにする。

alter table public.work_records
  add column worked_through_lunch boolean not null default false;

comment on column public.work_records.worked_through_lunch is
  '12:00〜13:00をまたぐ時間入力でも休憩を取らず作業した場合に true。'
  'true の場合、集計では昼休憩の1時間を差し引かない。';

-- work_record_durations を再定義: 開始〜終了が12:00〜13:00をまるごと含み、
-- かつ worked_through_lunch が false のときだけ、所要時間から60分差し引く。
create or replace view public.work_record_durations
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
    then
      extract(epoch from (r.end_time - r.start_time)) / 60.0
      - case
          when not r.worked_through_lunch
           and r.start_time <= time '12:00'
           and r.end_time >= time '13:00'
          then 60.0
          else 0.0
        end
  end as duration_minutes
from public.work_records r
left join public.work_type_master m on m.id = r.work_type_id
where r.deleted_at is null;

comment on view public.work_record_durations is
  '作業実績に所要時間（分）と表示用の作業種類ラベルを付けたもの。集計はすべてここを起点にする。'
  '12:00〜13:00をまるごと含む時間入力は、worked_through_lunch が false なら昼休憩1時間を差し引く。';

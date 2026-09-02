-- login_id は extend_workers_as_user_master で作ったあと、実 DB からだけ手作業で
-- 消えていた（DROP したマイグレーションが無い）。Supabase Auth のログインを
-- 「login_id + パスワード」で行うため、鍵として復活させる。
--
-- 値は英数 8 文字の大文字。紙に印刷して手入力する運用を想定しているので、
-- 読み違えやすい 0 / O / 1 / I は使わない。突き合わせは大文字で行う前提で、
-- 入力側は upper() に正規化してから引く。

alter table public.workers
  add column if not exists login_id text unique;

alter table public.workers
  drop constraint if exists workers_login_id_format_check;

alter table public.workers
  add constraint workers_login_id_format_check
  check (login_id is null or login_id ~ '^[A-Z0-9]{6,12}$');

comment on column public.workers.login_id is
  'ログインID。Supabase Auth の email と対にして使う（login_id → auth_user_id → email）。英数大文字 6〜12 文字。';

-- seed.sql と同じ値を入れて、初期データと実 DB を一致させる。
update public.workers as w
set login_id = v.login_id, updated_at = now()
from (values
  ('001', 'K7X2M9QT'), ('002', 'B3F8N5RC'), ('003', 'W6D1P4YK'),
  ('004', 'H9L3X7MQ'), ('005', 'T2R8K5VN'), ('006', 'Q4M7B2XW'),
  ('101', 'J8N3H6RT'), ('102', 'X5K9D2MP'), ('103', 'V7Q4W8LN'),
  ('104', 'R2T6X9BK'), ('105', 'N8H3M5QY'), ('106', 'C4W7K2RT'),
  ('107', 'Y9X5N8DM'), ('108', 'M3B6Q2HK'),
  ('201', 'L7R4T9WX'), ('202', 'D2N8K5CQ'), ('203', 'F6H3X7MB'),
  ('204', 'K9W2R4TL'), ('205', 'Q5X8N3YH'), ('206', 'T4M7K6RD'),
  ('207', 'B8Q2W5XN'), ('208', 'H3R9L6MK'), ('209', 'N7D4X8QT'),
  ('210', 'W2K6B9CH')
) as v(employee_no, login_id)
where w.employee_no = v.employee_no
  and w.login_id is null;

-- 清水・神田は管理表で No. が空欄のまま。login_id は今回あらためて採番する。
update public.workers set login_id = 'P5V8T3ZW', updated_at = now()
  where name = '清水' and employee_no is null and login_id is null;
update public.workers set login_id = 'G6C9J4XR', updated_at = now()
  where name = '神田' and employee_no is null and login_id is null;

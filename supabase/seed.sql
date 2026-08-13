-- 作業者（ユーザー）マスタの初期データ。
-- 空の DB を立ち上げ直したときに流す。既にデータがある DB に流すと重複するので注意。
--
-- パスワードは列として持たせていない。管理表では全員 ID と同じ値で、情報が
-- 増えないうえに平文保存のリスクだけが残るため。認証は Supabase Auth で
-- 実装し、パスワードはそちらでハッシュ管理する。login_id はそのときの
-- 突き合わせに使う。

insert into public.workers
  (employee_no, login_id, name, employment_type, department, language, permission, display_order)
values
  ('001', 'K7X2M9QT', '山田',   '正社員', 'WF', 'ja', 'edit_view',   1),
  ('002', 'B3F8N5RC', '柿本',   '正社員', 'WF', 'ja', 'edit_view',   2),
  ('003', 'W6D1P4YK', '川口',   '正社員', 'AA', 'ja', 'edit_view',   3),
  ('004', 'H9L3X7MQ', '金子',   '正社員', 'AA', 'ja', 'edit_view',   4),
  ('005', 'T2R8K5VN', '川原',   '正社員', 'AA', 'ja', 'edit_view',   5),
  ('006', 'Q4M7B2XW', '米田',   '正社員', 'WF', 'ja', 'all',         6),
  -- 清水・神田は管理表で No./ID が空欄のため login_id は NULL のままにしている
  (null,  null,       '清水',   null,     null, 'ja', 'view_only',   7),
  (null,  null,       '神田',   null,     null, 'ja', 'view_only',   8),
  ('101', 'J8N3H6RT', '原田',   'パート', 'WF', 'ja', 'view_only', 101),
  ('102', 'X5K9D2MP', '野崎',   'パート', 'WF', 'ja', 'view_only', 102),
  ('103', 'V7Q4W8LN', '大西',   'パート', 'WF', 'ja', 'view_only', 103),
  ('104', 'R2T6X9BK', '前畑',   'パート', 'WF', 'ja', 'view_only', 104),
  ('105', 'N8H3M5QY', '山形',   'パート', null, 'ja', 'view_only', 105),
  ('106', 'C4W7K2RT', '松本',   'パート', null, 'ja', 'view_only', 106),
  ('107', 'Y9X5N8DM', '泉秀人', 'パート', null, 'ja', 'view_only', 107),
  ('108', 'M3B6Q2HK', '泉房美', 'パート', null, 'ja', 'view_only', 108),
  ('201', 'L7R4T9WX', 'デニ',       '実習生', null, 'id', 'view_only', 201),
  ('202', 'D2N8K5CQ', 'ダユ',       '実習生', null, 'id', 'view_only', 202),
  ('203', 'F6H3X7MB', 'ランガ',     '実習生', null, 'id', 'view_only', 203),
  ('204', 'K9W2R4TL', 'ラフィ',     '実習生', null, 'id', 'view_only', 204),
  ('205', 'Q5X8N3YH', 'タタ',       '実習生', null, 'id', 'view_only', 205),
  ('206', 'T4M7K6RD', 'ファディル', '実習生', null, 'id', 'view_only', 206),
  ('207', 'B8Q2W5XN', 'アリフ',     '実習生', null, 'id', 'view_only', 207),
  ('208', 'H3R9L6MK', 'ユスリル',   '実習生', null, 'id', 'view_only', 208),
  ('209', 'N7D4X8QT', 'ディマス',   '実習生', null, 'id', 'view_only', 209),
  ('210', 'W2K6B9CH', 'イクサン',   '実習生', null, 'id', 'view_only', 210);

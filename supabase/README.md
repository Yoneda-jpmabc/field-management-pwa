# supabase/

DB の作り方をここに残す。アプリのコードと同じように git で追えるようにするためのもの。

## ファイル

| パス | 中身 |
| --- | --- |
| `migrations/*.sql` | テーブル・ビュー・関数・RLS の定義。ファイル名の日時順に流す |
| `seed.sql` | 作業者（ユーザー）26名の初期データ |

## 空の Supabase プロジェクトから作り直す

1. Supabase の SQL Editor を開く
2. `migrations/` のファイルを**日時の古い順に**貼り付けて実行する
3. `seed.sql` を貼り付けて実行する

これで今と同じ DB になる。

## スキーマを変えるとき

**既存のファイルは書き換えない。** 新しいファイルを足す。

```
supabase/migrations/20260901120000_add_pesticide_records.sql
```

ファイル名は `YYYYMMDDHHMMSS_内容.sql`。日時は「いつ作ったか」であって、
順番を決めるためのものなので、必ず既存より後の値にすること。

過去のファイルを書き換えると、既に適用済みの環境と新規に作った環境で
DB の形がずれる。ずれた原因は後から追えないので、追加で直す。

## 注意

- `migrations/20260813075441_initial_schema.sql` は 2026-08-13 に 7 回に分けて
  適用した変更を 1 本にまとめたもの。途中経過は残していない。
- `work_plans`（作業予定）は `work_records`（作業実績）とは別テーブルで、
  今のところ相互参照はしていない。予定を実績に変換したくなったら
  `work_records` 側に `plan_id` を足す想定。
- RLS ポリシーは `trial_` 接頭辞のものが試験期間用で、anon（ログインなし）に
  全許可を出していた。`20260902150506_rls_by_worker_permission.sql` で
  `workers.permission` ベースへ差し替え済み（判定は `lib/auth/permissions.ts`
  と同じ対応: all=マスタも記録も / allowed=記録だけ / view_only=読むだけ）。
  読み取りはログイン中の有効な作業者なら全行見える。閲覧のみの人に自分の記録
  だけを見せているのは画面側の絞り込みで、DB では絞っていない（他人の行を
  隠すと管理タブの確認状況や収穫ボードの集計が欠けるため）。
- `20260816120000_harvest_and_plantings.sql` で収穫まわり
  （`field_plantings` / `harvest_records`）を足した。
  同じマイグレーションで `workers.permission` の中間値を `edit_view` から
  `allowed` に改名しているので、**このファイルを流す前の `seed.sql` は使えない**
  （`seed.sql` も同時に更新済み）。
- ログインは `login_id` + パスワード。パスワードは `workers` には持たせず、
  Supabase Auth 側でハッシュ管理している。`signInWithPassword` はメールしか
  受け付けないため、`20260902141658_link_workers_to_auth_users.sql` で
  `workers.auth_email` を足し、`login_id` → `auth_email` → サインイン、
  という順で引いている（`lib/auth/actions.ts`）。
  作業者の追加時は Auth にユーザーを作ったうえで、その `id` と `email` を
  `workers.auth_user_id` / `auth_email` に、`login_id` とあわせて入れること。
  なお `login_id` の参照はログイン前＝未認証で走るので、RLS を締めるときは
  この参照経路を必ず残すこと（残さないと誰もログインできなくなる）。
- `20260816140000_crop_check_items.sql` で作物ごとの管理項目
  （`crop_check_items`）と、その日々の確認記録（`crop_check_records`）を足した。
  確認記録だけは `deleted_at` を持たない。チェックを外すのは削除ではなく
  「未確認に戻す」状態変化なので `is_done` で表し、そのぶん
  `(item_id, check_date)` に一意制約を張って upsert 1 回で書けるようにしている。
- 管理項目の中身（何をどう確認するか）は業務側で決めるもの。
  マイグレーションには入れず、設定画面から登録する。

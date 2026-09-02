import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewEveryone, toPermission, type Permission } from "./permissions";

/**
 * 「今は誰が操作しているか」を返す層。
 *
 * ログインは login_id + パスワード。Supabase Auth 自体はメールしか受け付けないので、
 * workers.auth_email を経由してサインインし（lib/auth/actions.ts）、
 * ここでは逆に auth ユーザー → workers を引き直して作業者を特定する。
 *
 * 画面の出し分け（canEditMasters など）と Server Action の権限確認は、
 * すべてこの関数の戻り値を見るように配線してある。
 */

export type CurrentWorker = {
  id: string;
  name: string;
  permission: Permission;
};

/**
 * ログインしていれば作業者を、していなければ null を返す。
 *
 * 1 リクエスト中に何度も呼ばれる（レイアウト + ページ + Server Action の
 * 権限確認）ので cache でまとめる。auth.getUser() は毎回 Supabase まで
 * 問い合わせに行くため、素で呼ぶと同じ検証を何度も走らせることになる。
 */
export const findCurrentWorker = cache(
  async (): Promise<CurrentWorker | null> => {
    const supabase = await createSupabaseServerClient();

    // getSession() は Cookie の中身をそのまま信じるので使わない。
    // getUser() は Supabase 側で署名を検証してから返す。
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("workers")
      .select("id, name, permission, is_active, deleted_at")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    // auth アカウントが生きていても、作業者として無効なら通さない。
    // 退職者の Auth ユーザーを消し忘れても、workers 側を落とせば止まる。
    if (!data || !data.is_active || data.deleted_at !== null) return null;

    return {
      id: data.id,
      name: data.name,
      permission: toPermission(data.permission),
    };
  },
);

/**
 * ログイン必須の画面・処理で使う。未ログインなら /login へ送る。
 * 呼び出し側は常に「誰か」が確定している前提で書ける。
 */
export async function getCurrentWorker(): Promise<CurrentWorker> {
  const worker = await findCurrentWorker();
  if (!worker) redirect("/login");
  return worker;
}

/**
 * 全員分の記録を扱う画面（実績の登録・確認・集計）で使う。
 * 閲覧のみの人はナビゲーションにも出さないが、直接URLを叩けるので
 * ここで収穫タブへ送り返す。
 */
export async function requireEveryoneViewer(): Promise<CurrentWorker> {
  const worker = await getCurrentWorker();
  if (!canViewEveryone(worker.permission)) redirect("/harvest");
  return worker;
}

import "server-only";

import { redirect } from "next/navigation";
import { canViewEveryone, type Permission } from "./permissions";

/**
 * 「今は誰が操作しているか」を返す層。
 *
 * ログイン（作業者マスタの login_id + 暗証番号）はまだ入れていない。
 * 実際に運用へ載せる段階で実装する予定で、それまでは誰が操作しているかを
 * 判定できないため、全員が全権限を持つ扱いにしている（従来どおりの挙動）。
 *
 * 画面の出し分け（canEditMasters など）と Server Action の権限確認は、
 * すべてこの関数の戻り値を見るように配線してある。ログインを入れるときは
 * ここで Cookie のセッションと workers を引くように差し替えれば、
 * 呼び出し側を触らずに権限が効くようになる。
 */

export type CurrentWorker = {
  /** ログイン未実装のうちは null（誰の操作か特定できない）。 */
  id: string | null;
  permission: Permission;
};

export async function getCurrentWorker(): Promise<CurrentWorker> {
  return { id: null, permission: "all" };
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

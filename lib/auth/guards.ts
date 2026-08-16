import "server-only";

import { getCurrentWorker } from "./session";
import { canEditMasters, canEditRecords } from "./permissions";

/**
 * Server Action の入口で使う権限チェック。
 *
 * 画面側でもボタンを出し分けているが、Server Action は UI を経由せず直接 POST できる。
 * 「隠してあるから安全」にはならないので、書き込みを行うアクションは必ずここを通すこと。
 *
 * ログインを入れるまでは getCurrentWorker が全権限を返すため、実際には素通りする。
 * 判定の形だけ先に通しておき、ログイン導入時に session.ts を差し替えれば効くようにしている。
 */

export type GuardResult =
  | { ok: true; workerId: string | null }
  | { ok: false; message: string };

/** 実績・予定・収穫の登録編集ができるか（all / allowed）。 */
export async function requireRecordEditor(): Promise<GuardResult> {
  const worker = await getCurrentWorker();
  if (!canEditRecords(worker.permission)) {
    return { ok: false, message: "この操作を行う権限がありません。" };
  }
  return { ok: true, workerId: worker.id };
}

/**
 * 圃場・作付・作物マスタの登録編集ができるか（all のみ）。
 * マスタが書き換わると実績・収穫の集計すべてに影響するため、権限を分けている。
 */
export async function requireMasterEditor(): Promise<GuardResult> {
  const worker = await getCurrentWorker();
  if (!canEditMasters(worker.permission)) {
    return {
      ok: false,
      message: "圃場情報を編集する権限がありません。管理者に依頼してください。",
    };
  }
  return { ok: true, workerId: worker.id };
}

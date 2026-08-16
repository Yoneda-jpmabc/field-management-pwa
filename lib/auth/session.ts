import "server-only";

import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewEveryone, toPermission, type Permission } from "./permissions";

/**
 * ログインセッション。
 *
 * Supabase Auth はまだ入れていないため、ログインは workers.login_id と暗証番号で行い、
 * 「誰でログインしているか」は署名付き Cookie で持つ。
 * 署名しないと Cookie を書き換えるだけで別人になれてしまうので、HMAC を必ず付ける。
 *
 * ここで守れるのはアプリ経由のアクセスだけで、DB の RLS は anon 全許可のまま。
 * Supabase Auth へ移行するときは、この層を差し替えて RLS を auth.uid() ベースにすること。
 */

const COOKIE_NAME = "fm_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionWorker = {
  id: string;
  name: string;
  /** チップ表示用の短い名前。short_name が無ければ name。 */
  displayName: string;
  loginId: string | null;
  permission: Permission;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET が未設定です（16文字以上のランダムな文字列を .env.local に設定してください）。",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

/** Cookie 値を組み立てる。`workerId.発行時刻.署名` の形。 */
function serialize(workerId: string): string {
  const payload = `${workerId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/** Cookie 値を検証して worker id を取り出す。壊れていれば null。 */
function parse(raw: string): string | null {
  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  const [workerId, issuedAt] = payload.split(".");
  if (!workerId || !issuedAt) return null;

  // 署名が有効でも、発行から一定期間を過ぎたものは受け付けない。
  // Cookie の maxAge はブラウザ側の都合で消えないことがあるため、サーバー側でも見る。
  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SECONDS) return null;

  return workerId;
}

/** ログイン成功時に呼ぶ。Server Action / Route Handler からのみ呼べる。 */
export async function createSession(workerId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serialize(workerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * ログイン中の作業者を返す。未ログインなら null。
 *
 * 1 リクエスト中に画面のあちこちから呼ぶので、React の cache でメモ化して
 * DB への問い合わせを 1 回に抑えている。
 *
 * 権限は Cookie に入れず毎回 DB から引く。Cookie に焼き込むと、
 * 権限を落としてもログインし直すまで古い権限のまま使えてしまうため。
 */
export const getCurrentWorker = cache(
  async (): Promise<SessionWorker | null> => {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;

    let workerId: string | null = null;
    try {
      workerId = parse(raw);
    } catch {
      // SESSION_SECRET 未設定など。未ログイン扱いにしてログイン画面へ流す。
      return null;
    }
    if (!workerId) return null;

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("workers")
      .select("id, name, short_name, login_id, permission")
      .eq("id", workerId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      displayName: data.short_name ?? data.name,
      loginId: data.login_id,
      permission: toPermission(data.permission),
    };
  },
);

/**
 * ログイン必須のページで使う。未ログインならログイン画面へ飛ばす。
 * 戻り先を next に載せて、ログイン後に元の画面へ戻す。
 */
export async function requireWorker(returnTo?: string): Promise<SessionWorker> {
  const worker = await getCurrentWorker();
  if (!worker) {
    redirect(
      returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login",
    );
  }
  return worker;
}

/**
 * 全員分の記録を扱う画面（実績の登録・確認・集計）で使う。
 * 閲覧のみの人はナビゲーションにも出していないが、直接URLを叩けるので
 * ここで収穫タブへ送り返す。
 */
export async function requireEveryoneViewer(
  returnTo?: string,
): Promise<SessionWorker> {
  const worker = await requireWorker(returnTo);
  if (!canViewEveryone(worker.permission)) redirect("/harvest");
  return worker;
}

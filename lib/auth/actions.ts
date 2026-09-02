"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCurrentWorker } from "./session";
import { PREVIEW_COOKIE } from "./preview";
import { PERMISSIONS, type Permission } from "./permissions";

export type LoginState = { message: string } | null;

/**
 * ログインIDとパスワードの組み合わせが違う、ID が存在しない、作業者が無効、
 * のいずれでも同じ文言を返す。どの ID が実在するかを画面から探れないようにするため。
 */
const FAILED = "ログインIDまたはパスワードが違います。";

/**
 * login_id + パスワードでログインする。
 *
 * Supabase Auth の signInWithPassword はメールしか受け付けないので、
 * login_id → workers.auth_email を引いてから渡す。auth.users は anon から
 * 読めないため、メールは workers 側に控えてある（20260902141658 のマイグレーション）。
 *
 * この参照だけはログイン前＝未認証で走るので、workers を直接は引けない
 * （anon には権限が無い）。login_email_for() は SECURITY DEFINER で、
 * 「ID を 1 つ渡すとメールが 1 つ返るだけ」の窓口として anon に開けてある。
 * 無効な作業者・未登録IDには NULL が返る。
 */
export async function signInWithLoginId(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 現場では大文字で印刷したものを手入力するので、小文字で打たれても通す。
  const loginId = String(formData.get("loginId") ?? "")
    .trim()
    .toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!loginId || !password) {
    return { message: "ログインIDとパスワードを入力してください。" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: email } = await supabase.rpc("login_email_for", {
    p_login_id: loginId,
  });
  if (!email) return { message: FAILED };

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { message: FAILED };

  // ログアウト中に見ていた画面のキャッシュを残さない。
  revalidatePath("/", "layout");
  // redirect は例外を投げるので、必ず try の外で呼ぶこと。
  redirect("/");
}

/**
 * 権限プレビューの切り替え。null を渡すと解除して本来の権限に戻る。
 *
 * 効くのは画面と Server Action の権限確認まで。DB の RLS は本人の
 * workers.permission を見ているので、プレビュー中でも DB 側の許可は変わらない。
 *
 * Cookie は手で書けるので、ここで必ず本人の本当の権限を確かめる。
 * 全権限の人しか使えず、しかも下げる方向にしか効かない。
 */
export async function setPreviewPermission(
  next: Permission | null,
): Promise<void> {
  const worker = await findCurrentWorker();
  if (worker?.realPermission !== "all") return;

  const store = await cookies();
  if (next === null || next === "all") {
    store.delete(PREVIEW_COOKIE);
  } else if ((PERMISSIONS as readonly string[]).includes(next)) {
    store.set(PREVIEW_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // 消し忘れたまま翌日を迎えても、開き直せば本来の権限に戻る。
      maxAge: 60 * 60 * 12,
    });
  }

  // 権限は全画面の出し分けに効くので、レイアウトごと引き直す。
  revalidatePath("/", "layout");
}

/** ログアウトして /login へ戻す。 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // 権限プレビューを残したままにすると、次にログインした人の画面が
  // 前の人の確認状態のまま始まってしまう。
  (await cookies()).delete(PREVIEW_COOKIE);

  // 前の人の画面が Router Cache に残ったままにならないよう捨てる。
  revalidatePath("/", "layout");
  redirect("/login");
}

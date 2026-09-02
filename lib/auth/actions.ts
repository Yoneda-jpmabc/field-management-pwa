"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

/** ログアウトして /login へ戻す。 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // 前の人の画面が Router Cache に残ったままにならないよう捨てる。
  revalidatePath("/", "layout");
  redirect("/login");
}
